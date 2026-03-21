"""Key-Specific Piano Pitch Detector.

Optimized pitch detection for piano tuning where the expected key is known.

Architecture:
- Uses the proven UltimateDetector for robust coarse pitch detection
- Adds DTFT refinement for sub-cent accuracy around the detected pitch
- Validates detection against expected frequency (within ±1 semitone)
- Multi-window averaging for robust estimation from longer buffers

The key-specific knowledge allows:
1. Validating detection output (reject spurious detections far from expected)
2. Narrowing DTFT refinement search range for speed and accuracy
3. Smarter fallback when main detector fails
"""

import numpy as np
import math
from ultimate_detector import UltimatePianoDetector


class KeySpecificDetector:

    def __init__(self, cutoff=0.93, small_cutoff=0.30):
        self.detector = UltimatePianoDetector(cutoff=cutoff, small_cutoff=small_cutoff)

    @staticmethod
    def note_to_freq(note, octave):
        SEMI = {
            "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3,
            "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
            "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
        }
        midi = (octave + 1) * 12 + SEMI[note]
        return 440.0 * (2 ** ((midi - 69) / 12))

    def detect(self, buffer, sample_rate, expected_freq):
        """Detect pitch of a known piano key.

        Returns detected frequency in Hz, or -1 if detection fails.
        """
        # Stage 1: Coarse detection with proven UltimateDetector
        coarse_freq = self.detector.get_pitch(buffer, sample_rate)

        # Validate coarse detection against expected frequency
        if coarse_freq > 0:
            cents = 1200 * math.log2(coarse_freq / expected_freq)
            if abs(cents) < 100:
                # For bass notes (< 80 Hz), MPM is more reliable than DTFT
                # because the spectral peaks are broad and DTFT can shift
                # away from the true fundamental period.
                if expected_freq < 80:
                    return coarse_freq
                # Stage 2: DTFT refinement — narrow search around coarse result
                return self._dtft_refine(buffer, sample_rate, coarse_freq, search_range_cents=10)

        # Coarse detection failed or was far from expected.
        # Try DTFT directly around expected frequency with wider search.
        dtft_freq = self._dtft_refine(buffer, sample_rate, expected_freq, search_range_cents=100)
        if dtft_freq > 0:
            cents = 1200 * math.log2(dtft_freq / expected_freq)
            if abs(cents) < 100:
                return dtft_freq

        return -1

    def _dtft_refine(self, buffer, sample_rate, center_freq, search_range_cents=10):
        """DTFT refinement for sub-cent accuracy.

        Two-pass Goertzel-like evaluation:
        1. Coarse: ±search_range_cents, 1-cent steps
        2. Fine: ±2 cents around coarse peak, 0.1-cent steps
        """
        N = len(buffer)
        window = np.hanning(N)
        windowed = buffer * window
        n = np.arange(N)

        def eval_freqs(freqs):
            """Evaluate DFT magnitude at specific frequencies."""
            omega = 2 * np.pi * freqs[:, np.newaxis] * n[np.newaxis, :] / sample_rate
            real = np.dot(np.cos(omega), windowed)
            imag = np.dot(np.sin(omega), windowed)
            return np.sqrt(real ** 2 + imag ** 2)

        # Coarse pass: ±search_range_cents, 1-cent steps
        coarse_cents = np.arange(-search_range_cents, search_range_cents + 1, 1)
        coarse_freqs = center_freq * (2 ** (coarse_cents / 1200))
        coarse_mags = eval_freqs(coarse_freqs)
        coarse_peak = np.argmax(coarse_mags)
        coarse_center = coarse_freqs[coarse_peak]

        # Fine pass: ±2 cents around coarse peak, 0.1-cent steps
        fine_cents = np.arange(-2, 2.01, 0.1)
        fine_freqs = coarse_center * (2 ** (fine_cents / 1200))
        fine_mags = eval_freqs(fine_freqs)
        fine_peak = np.argmax(fine_mags)

        # Parabolic interpolation on fine pass
        if 0 < fine_peak < len(fine_mags) - 1:
            a, b, c = fine_mags[fine_peak - 1], fine_mags[fine_peak], fine_mags[fine_peak + 1]
            d = a - 2 * b + c
            if d != 0:
                adj = 0.5 * (a - c) / d
                refined_idx = fine_peak + adj
                return fine_freqs[0] + refined_idx * (fine_freqs[-1] - fine_freqs[0]) / (len(fine_freqs) - 1)

        return fine_freqs[fine_peak]

    @staticmethod
    def optimal_buffer_size(expected_freq, sample_rate=44100):
        """Calculate optimal buffer size for a given expected frequency.

        Ensures at least 6 full periods in the buffer for reliable MPM.
        Returns a power-of-2 buffer size.
        """
        period_samples = sample_rate / expected_freq
        min_samples = int(period_samples * 8)  # At least 8 full periods
        # Round up to power of 2, minimum 8192
        buf_size = max(8192, 1 << int(np.ceil(np.log2(min_samples))))
        return min(buf_size, 32768)  # Cap at 32k

    def detect_cents(self, buffer, sample_rate, expected_freq):
        """Returns cents deviation from expected frequency, or None."""
        freq = self.detect(buffer, sample_rate, expected_freq)
        if freq <= 0:
            return None
        return 1200 * math.log2(freq / expected_freq)

    def detect_from_long_buffer(self, data, sample_rate, expected_freq,
                                 buffer_size=8192, n_windows=4, hop_ratio=0.5):
        """Detect from a longer buffer using multiple overlapping windows.
        Takes the median of multiple window detections for robustness.
        """
        hop = int(buffer_size * hop_ratio)
        freqs = []

        for i in range(n_windows):
            start = i * hop
            end = start + buffer_size
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
