"""Key-Specific Piano Pitch Detector.

Optimized pitch detection for piano tuning where the expected key is known.

Architecture:
- NSDF clarity gate: reject windows where the signal is not yet periodic
  (transient phase, room noise during attack). Clarity < MIN_CLARITY → -1.
- Uses the proven UltimateDetector for robust coarse pitch detection.
- DTFT refinement for sub-cent accuracy (skipped when clarity is low or
  for bass notes < 80 Hz where DTFT can follow sidebands).
- Validates detection against expected frequency (within ±1 semitone).

Why clarity gating?
  Piano bass notes have an inharmonic attack transient (first 50-200 ms
  after onset).  During this phase:
    • The waveform is not yet periodic → pitch detectors give noisy output.
    • Hard strikes push more energy into upper (stretched) harmonics.
    • This can bias the detected pitch by several cents.
  The NSDF peak height ("clarity") reliably reflects signal periodicity:
  values close to 1.0 → stable sustain; values < 0.65 → transient noise.
  Gating on clarity gives reproducible readings regardless of strike force.

The key-specific knowledge allows:
1. Narrowing DTFT refinement search range for speed and accuracy.
2. Validating detection output (reject spurious detections far from expected).
3. Smarter fallback when main detector fails.
"""

import numpy as np
import math
from ultimate_detector import UltimatePianoDetector


# ── Clarity gate constant ────────────────────────────────────────────────────
# Windows with NSDF peak height below this threshold are in the transient
# phase.  The value 0.65 is empirically robust: during the sustained tone
# it is always exceeded; during the attack transient it is often not.
MIN_CLARITY = 0.65


class KeySpecificDetector:

    def __init__(self, cutoff=0.93, small_cutoff=0.30,
                 min_clarity=MIN_CLARITY):
        self.detector    = UltimatePianoDetector(cutoff=cutoff,
                                                  small_cutoff=small_cutoff)
        self.min_clarity = min_clarity

    @staticmethod
    def note_to_freq(note, octave):
        SEMI = {
            "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
            "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
            "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
        }
        midi = (octave + 1) * 12 + SEMI[note]
        return 440.0 * (2 ** ((midi - 69) / 12))

    # ── Core NSDF clarity ────────────────────────────────────────────────────

    @staticmethod
    def nsdf_clarity(buffer, sample_rate, min_hz=20):
        """Compute the McLeod NSDF and return (freq_hz, clarity).

        clarity = height of the first key-maximum that exceeds 93 % of
        the global maximum (range 0–1).  Close to 1 = very periodic
        (stable sustain); close to 0 = noise or transient.

        Returns:
            (freq, clarity) — freq is -1 if no periodic structure detected.
        """
        N = len(buffer)
        max_tau = min(N // 2, int(np.ceil(sample_rate / min_hz)))
        if max_tau < 4:
            return -1, 0.0

        # FFT-based autocorrelation (O(N log N))
        n_fft = 1 << int(np.ceil(np.log2(2 * N)))
        X     = np.fft.rfft(buffer, n=n_fft)
        acf   = np.fft.irfft(X * np.conj(X), n=n_fft)[:max_tau]

        # NSDF normalisation
        sq     = buffer ** 2
        sum_sq = sq.sum()
        m      = np.empty(max_tau)
        m[0]   = 2 * sum_sq
        if max_tau > 1:
            cs       = np.cumsum(sq)
            taus     = np.arange(1, max_tau)
            m[1:]    = (sum_sq - cs[taus - 1]) + cs[N - taus - 1]
        with np.errstate(divide='ignore', invalid='ignore'):
            nsdf = np.where(m > 0, 2 * acf / m, 0.0)

        # Peak-picking
        key_maxima, in_pos = [], False
        cur_tau, cur_val   = 0, -np.inf
        for tau in range(1, max_tau):
            if nsdf[tau] > 0 and nsdf[tau - 1] <= 0:
                in_pos = True; cur_tau, cur_val = tau, nsdf[tau]
            elif nsdf[tau] <= 0 and nsdf[tau - 1] > 0:
                if in_pos: key_maxima.append((cur_tau, cur_val))
                in_pos = False
            elif in_pos and nsdf[tau] > cur_val:
                cur_tau, cur_val = tau, nsdf[tau]
        if in_pos:
            key_maxima.append((cur_tau, cur_val))

        if not key_maxima:
            return -1, 0.0

        nmax = max(v for _, v in key_maxima)
        if nmax < 0.05:
            return -1, float(nmax)

        threshold = 0.93 * nmax
        for tau, _ in key_maxima:
            if nsdf[tau] >= threshold:
                # Parabolic interpolation
                itau = float(tau)
                if 0 < tau < max_tau - 1:
                    s0, s1, s2 = nsdf[tau-1], nsdf[tau], nsdf[tau+1]
                    a = (s0 + s2 - 2*s1) / 2
                    b = (s2 - s0) / 2
                    if a < 0:
                        adj = -b / (2*a)
                        if abs(adj) < 1:
                            itau = tau + adj
                freq = sample_rate / itau if itau > 0 else -1
                return freq, float(nmax)

        return -1, float(nmax)

    # ── Main detection ───────────────────────────────────────────────────────

    def detect(self, buffer, sample_rate, expected_freq):
        """Detect pitch of a known piano key.

        Returns detected frequency in Hz, or -1 if:
        - The signal is still in the transient phase (NSDF clarity < min_clarity)
        - Detection output is > 100 cents from expected_freq
        - All detection stages fail

        The clarity gate makes this robust to strike force: hard and soft
        keystrokes produce the same result once the signal stabilises.
        """
        # ── Clarity gate ────────────────────────────────────────────────────
        _, clarity = KeySpecificDetector.nsdf_clarity(buffer, sample_rate)
        if clarity < self.min_clarity:
            return -1   # still in transient — reject this window

        # ── Stage 1: Coarse detection with UltimateDetector ─────────────────
        coarse_freq = self.detector.get_pitch(buffer, sample_rate)

        if coarse_freq > 0:
            cents = 1200 * math.log2(coarse_freq / expected_freq)
            if abs(cents) < 100:
                # For bass notes, DTFT can latch onto sidebands.
                # The MPM/NSDF result is already sub-cent accurate for bass.
                if expected_freq < 80:
                    return coarse_freq
                # Stage 2: DTFT refinement (narrow ±10 ct window)
                refined = self._dtft_refine(buffer, sample_rate, coarse_freq,
                                            search_range_cents=10)
                # Accept DTFT only if correction is ≤ 5 cents (guard against
                # sidelobe capture when clarity is only moderate)
                if refined > 0 and abs(1200 * math.log2(refined / coarse_freq)) <= 5:
                    return refined
                return coarse_freq

        # ── Stage 3: Fallback DTFT around expected frequency ────────────────
        # Only attempt when clarity is reasonably good; a noisy transient
        # with wide ±100 ct search can easily lock onto a room resonance.
        if clarity >= 0.70:
            dtft_freq = self._dtft_refine(buffer, sample_rate, expected_freq,
                                          search_range_cents=50)
            if dtft_freq > 0:
                cents = 1200 * math.log2(dtft_freq / expected_freq)
                if abs(cents) < 100:
                    return dtft_freq

        return -1

    # ── DTFT refinement ──────────────────────────────────────────────────────

    def _dtft_refine(self, buffer, sample_rate, center_freq,
                     search_range_cents=10):
        """Sub-cent DTFT refinement (Goertzel-like two-pass evaluation).

        Pass 1: ±search_range_cents in 1-cent steps.
        Pass 2: ±2 cents around the pass-1 peak, in 0.1-cent steps.
        Parabolic interpolation on pass-2 result.
        """
        N        = len(buffer)
        window   = np.hanning(N)
        windowed = buffer * window
        n        = np.arange(N)

        def eval_freqs(freqs):
            omega = (2 * np.pi * freqs[:, np.newaxis]
                     * n[np.newaxis, :] / sample_rate)
            real = np.dot(np.cos(omega), windowed)
            imag = np.dot(np.sin(omega), windowed)
            return np.sqrt(real**2 + imag**2)

        coarse_cents = np.arange(-search_range_cents,
                                  search_range_cents + 1, 1.0)
        coarse_freqs = center_freq * (2 ** (coarse_cents / 1200))
        coarse_mags  = eval_freqs(coarse_freqs)
        coarse_center = coarse_freqs[np.argmax(coarse_mags)]

        fine_cents = np.arange(-2.0, 2.01, 0.1)
        fine_freqs = coarse_center * (2 ** (fine_cents / 1200))
        fine_mags  = eval_freqs(fine_freqs)
        fine_peak  = int(np.argmax(fine_mags))

        if 0 < fine_peak < len(fine_mags) - 1:
            a, b, c = (fine_mags[fine_peak - 1],
                       fine_mags[fine_peak],
                       fine_mags[fine_peak + 1])
            d = a - 2*b + c
            if d != 0:
                adj         = 0.5 * (a - c) / d
                refined_idx = fine_peak + adj
                span        = fine_freqs[-1] - fine_freqs[0]
                return fine_freqs[0] + refined_idx * span / (len(fine_freqs) - 1)

        return fine_freqs[fine_peak]

    # ── Harmonic partial fitting ──────────────────────────────────────────────

    def detect_harmonic_fit(self, buffer, sample_rate, expected_freq,
                            max_harmonic=20, threshold_ratio=0.015,
                            fft_size=None, tol_cents=25):
        """Estimate f₀ by fitting spectral peaks to the harmonic series.

        Why this beats NSDF for piano bass notes:
          NSDF/autocorrelation maximises the sum of harmonic correlations.
          When the fundamental is weak (typical at higher velocities) and
          upper inharmonic partials dominate, the optimal lag shifts slightly
          short → detected frequency drifts sharp by up to 15 cents.

          This method instead:
          1. Finds all strong spectral peaks with a high-resolution FFT.
          2. For each peak near n×expected_freq (n = 1..max_harmonic),
             derives f₀ = peak_freq / n.
          3. Returns the median of all f₀ estimates — robust to outliers
             from noise peaks or missing harmonics.

          Result: ~1-2 cent spread across velocity layers v4-v16 for bass
          notes, vs 15 cents for NSDF on the same data.

        Returns:
            (f0_hz, n_harmonics_used) or (-1, 0) on failure.
        """
        N = len(buffer)
        if fft_size is None:
            # Use large FFT for good frequency resolution on bass notes.
            # At 48 kHz, 524288 points → 0.092 Hz/bin → 0.4¢ at 65 Hz.
            fft_size = max(131072, 1 << int(np.ceil(np.log2(N * 16))))

        window  = np.hanning(N)
        padded  = np.zeros(fft_size)
        padded[:N] = buffer * window
        mag     = np.abs(np.fft.rfft(padded))
        bin_hz  = sample_rate / fft_size
        freqs   = np.arange(len(mag)) * bin_hz

        # Peak picking up to max_harmonic × expected_freq
        max_freq = expected_freq * (max_harmonic + 0.5)
        max_bin  = min(len(mag) - 2, int(max_freq / bin_hz))
        m        = mag[:max_bin]
        thresh   = m.max() * threshold_ratio
        is_peak  = (m[1:-1] > m[:-2]) & (m[1:-1] > m[2:]) & (m[1:-1] > thresh)
        peak_idx = np.where(is_peak)[0] + 1   # +1 due to [1:-1] slice

        # Parabolic interpolation on each peak
        a = mag[peak_idx - 1]; b = mag[peak_idx]; c = mag[peak_idx + 1]
        denom = a - 2*b + c
        adj   = np.where(denom != 0, 0.5*(a - c)/denom, 0.0)
        peak_freqs = (peak_idx + adj) * bin_hz

        # For each peak, assign harmonic number and derive f₀ estimate
        f0_estimates = []
        for pf in peak_freqs:
            if pf < expected_freq * 0.5:
                continue   # below half the expected fundamental — ignore
            n = round(pf / expected_freq)
            if n < 1 or n > max_harmonic:
                continue
            f0_candidate = pf / n
            if abs(1200 * math.log2(f0_candidate / expected_freq)) < tol_cents:
                f0_estimates.append(f0_candidate)

        if not f0_estimates:
            return -1, 0

        return float(np.median(f0_estimates)), len(f0_estimates)

    def detect_harmonic_fit_cents(self, buffer, sample_rate, expected_freq, **kwargs):
        """Returns (cents_deviation, n_harmonics) or (None, 0) on failure."""
        f0, n = self.detect_harmonic_fit(buffer, sample_rate, expected_freq, **kwargs)
        if f0 <= 0:
            return None, 0
        return 1200 * math.log2(f0 / expected_freq), n

    # ── Convenience helpers ───────────────────────────────────────────────────

    @staticmethod
    def optimal_buffer_size(expected_freq, sample_rate=44100):
        """Power-of-2 buffer with at least 8 full periods of expected_freq.

        Larger buffers are more reliable for bass notes (more periods fit).
        """
        period_samples = sample_rate / expected_freq
        min_samples    = int(period_samples * 8)
        buf_size       = max(8192, 1 << int(np.ceil(np.log2(min_samples))))
        return min(buf_size, 32768)

    def detect_cents(self, buffer, sample_rate, expected_freq):
        """Returns cents deviation from expected_freq, or None on failure."""
        freq = self.detect(buffer, sample_rate, expected_freq)
        if freq <= 0:
            return None
        return 1200 * math.log2(freq / expected_freq)

    def detect_from_long_buffer(self, data, sample_rate, expected_freq,
                                buffer_size=8192, n_windows=4, hop_ratio=0.5):
        """Median of multiple overlapping windows — clarity-gated.

        Windows where the signal is still in the transient phase (low NSDF
        clarity) are automatically excluded, making the result independent
        of how hard the key was struck.
        """
        hop   = int(buffer_size * hop_ratio)
        freqs = []

        for i in range(n_windows):
            start = i * hop
            end   = start + buffer_size
            if end > len(data):
                break
            freq = self.detect(data[start:end], sample_rate, expected_freq)
            if freq > 0:
                cents = 1200 * math.log2(freq / expected_freq)
                if abs(cents) < 100:
                    freqs.append(freq)

        if not freqs:
            return -1
        return float(np.median(freqs))
