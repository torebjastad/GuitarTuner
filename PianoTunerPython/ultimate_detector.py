import numpy as np
import math

class UltimatePianoDetector:
    def __init__(self, cutoff=0.93, small_cutoff=0.4):
        self.cutoff = cutoff
        self.small_cutoff = small_cutoff

    def _find_spectral_peaks(self, mag, bin_hz, min_freq=25, max_freq=10000, prominence_ratio=0.1):
        """Find prominent spectral peaks with parabolic interpolation."""
        min_bin = max(1, int(min_freq / bin_hz))
        max_bin = min(len(mag) - 1, int(max_freq / bin_hz))

        threshold = np.max(mag[min_bin:max_bin]) * prominence_ratio
        peaks = []
        for i in range(min_bin + 1, max_bin - 1):
            if mag[i] > mag[i-1] and mag[i] > mag[i+1] and mag[i] > threshold:
                a = mag[i-1]; b = mag[i]; c = mag[i+1]
                d = a - 2*b + c
                adj = 0.5 * (a - c) / d if d != 0 else 0
                freq = (i + adj) * bin_hz
                peaks.append((freq, mag[i]))

        peaks.sort(key=lambda x: x[0])
        return peaks

    def _count_harmonic_hits(self, peaks, f0_candidate, tolerance=0.04):
        """Count how many spectral peaks fall near integer multiples of f0_candidate.

        Uses a relative tolerance that grows slightly with harmonic number to
        account for piano inharmonicity (upper partials are stretched sharp).
        Returns (hit_count, total_harmonic_power).
        """
        if f0_candidate <= 0 or not peaks:
            return 0, 0.0

        hits = 0
        total_power = 0.0
        for freq, power in peaks:
            ratio = freq / f0_candidate
            nearest_n = round(ratio)
            if nearest_n < 1:
                continue
            # Allow slightly more tolerance for higher harmonics (inharmonicity)
            tol = tolerance + 0.005 * nearest_n
            if abs(ratio - nearest_n) < tol:
                hits += 1
                total_power += power
        return hits, total_power

    def get_pitch(self, buffer, sample_rate, return_debug=False):
        mpm_freq, dbg = self._run_mcleod(buffer, sample_rate)

        fft_size = 65536
        N = len(buffer)
        window = np.hanning(N)
        re = np.zeros(fft_size)
        re[:N] = buffer * window
        mag = np.abs(np.fft.rfft(re))

        bin_hz = sample_rate / fft_size
        freqs = np.arange(len(mag)) * bin_hz

        min_bin = int(25 / bin_hz)
        max_bin = int(10000 / bin_hz)

        valid_mag = mag[min_bin:max_bin]
        valid_freqs = freqs[min_bin:max_bin]

        weighted_mag = valid_mag * valid_freqs
        peak_idx = np.argmax(weighted_mag)

        w_peak_bin = min_bin + peak_idx

        alpha = mag[w_peak_bin - 1]
        beta = mag[w_peak_bin]
        gamma = mag[w_peak_bin + 1]
        num = 0.5 * (alpha - gamma)
        den = alpha - 2 * beta + gamma
        adj = num / den if den != 0 else 0
        w_peak_freq = (w_peak_bin + adj) * bin_hz

        final_freq = mpm_freq
        decision_log = []
        decision_log.append(f"1. McLeod Picked: {mpm_freq:.1f} Hz")
        decision_log.append(f"2. High-pass Weighted Spectral Peak: {w_peak_freq:.1f} Hz")

        def get_raw_power(freq):
            b = int(round(freq / bin_hz))
            if b <= 0 or b >= len(mag)-1: return 0
            return max(mag[max(1, b-2):min(len(mag), b+3)])

        pwr_mpm = 0
        pwr_wpeak = 0
        harmonic_f0 = -1
        harmonic_peaks = []

        # Pianos suffer from mechanically-dense low frequencies and sympathetic resonance octave drops.
        if w_peak_freq > 1000 and mpm_freq > 0:
            ratio = w_peak_freq / mpm_freq
            closest_int = round(ratio)

            decision_log.append(f"3. Ratio (w_peak / mpm): {ratio:.2f} (closest int: {closest_int})")

            if closest_int <= 8:
                is_close_to_int = abs(ratio - closest_int) < 0.2

                if is_close_to_int:
                    decision_log.append(f"4. Harmonic Relation Detected! Checking raw power...")
                    pwr_mpm = get_raw_power(mpm_freq)
                    pwr_wpeak = get_raw_power(w_peak_freq)
                    decision_log.append(f"   - Raw Power @ MPM ({mpm_freq:.1f}Hz): {pwr_mpm:.2f}")
                    decision_log.append(f"   - Raw Power @ Peak ({w_peak_freq:.1f}Hz): {pwr_wpeak:.2f}")

                    threshold_mult = 0.8 if w_peak_freq > 1800 else 0.05

                    if pwr_mpm > pwr_wpeak * threshold_mult:
                        decision_log.append(f"5. MPM fundamental power {(pwr_mpm):.2f} proved dominant over threshold {(pwr_wpeak * threshold_mult):.2f}.")
                        decision_log.append(f"   -> Retaining MPM freq!")
                        final_freq = mpm_freq
                    else:
                        decision_log.append(f"5. MPM power was weak compared to peak. MPM locked on subharmonic octave-drop.")
                        decision_log.append(f"   -> Upgrade pitch to Spectral Peak!")
                        final_freq = w_peak_freq
                else:
                    decision_log.append(f"4. Ratio is far from integer. No harmonic relation.")
                    decision_log.append(f"   -> MPM locked on noise, using Spectral Peak.")
                    final_freq = w_peak_freq
            else:
                # Ratio > 8: Use harmonic verification — count how many spectral peaks
                # align with integer multiples of each candidate frequency.
                decision_log.append(f"4. Ratio > 8 ({closest_int}). Running harmonic verification...")

                harmonic_peaks = self._find_spectral_peaks(mag, bin_hz, min_freq=25, max_freq=10000)
                decision_log.append(f"   - Found {len(harmonic_peaks)} spectral peaks")

                mpm_hits, mpm_hpwr = self._count_harmonic_hits(harmonic_peaks, mpm_freq)
                wpeak_hits, wpeak_hpwr = self._count_harmonic_hits(harmonic_peaks, w_peak_freq)

                decision_log.append(f"   - MPM ({mpm_freq:.1f}Hz): {mpm_hits} peaks align, harmonic power={mpm_hpwr:.1f}")
                decision_log.append(f"   - w_peak ({w_peak_freq:.1f}Hz): {wpeak_hits} peaks align, harmonic power={wpeak_hpwr:.1f}")

                # MPM wins on hit count AND its harmonics carry significantly more
                # total energy than w_peak's harmonics. This filters out coincidental
                # alignments where a low-frequency noise locks onto dense harmonic
                # positions but the actual energy is negligible.
                power_factor = mpm_hpwr / max(wpeak_hpwr, 1e-10)
                decision_log.append(f"   - Power factor (mpm_hpwr/wpeak_hpwr): {power_factor:.1f}")

                if mpm_hits >= 3 and mpm_hits > wpeak_hits and power_factor > 8:
                    decision_log.append(f"5. MPM confirmed: {mpm_hits} harmonic peaks with {power_factor:.0f}x more power.")
                    decision_log.append(f"   -> Retaining MPM freq!")
                    final_freq = mpm_freq
                    harmonic_f0 = mpm_freq
                elif mpm_hits >= 3 and mpm_hits == wpeak_hits and power_factor > 8:
                    decision_log.append(f"5. Tied at {mpm_hits} hits but MPM has {power_factor:.0f}x more harmonic power.")
                    decision_log.append(f"   -> Retaining MPM freq!")
                    final_freq = mpm_freq
                    harmonic_f0 = mpm_freq
                else:
                    decision_log.append(f"5. MPM not convincingly confirmed ({mpm_hits} hits, power factor {power_factor:.1f}).")
                    decision_log.append(f"   -> Using Spectral Peak.")
                    final_freq = w_peak_freq
                    harmonic_f0 = w_peak_freq
                
        # Fallback if MPM totally failed but we found a valid peak
        if final_freq < 0 and w_peak_freq > 0:
            decision_log.append(f"MPM totally failed. Fallback to Spectral Peak.")
            final_freq = w_peak_freq
            
        if return_debug:
            return final_freq, {
                'nsdf': dbg['nsdf'],
                'key_maxima': dbg['key_maxima'],
                'threshold': dbg['threshold'],
                'selected_tau': dbg['selected_tau'],
                'mag': mag,
                'weighted_mag': weighted_mag,
                'min_bin': min_bin,
                'bin_hz': bin_hz,
                'candidate_freq': mpm_freq,
                'w_peak_freq': w_peak_freq,
                'best_freq': final_freq,
                'pwr_mpm': pwr_mpm,
                'pwr_wpeak': pwr_wpeak,
                'decision_log': decision_log,
                'harmonic_f0': harmonic_f0,
                'harmonic_peaks': harmonic_peaks,
            }
        return final_freq

    def _run_mcleod(self, buffer, sample_rate):
        buf_len = len(buffer)
        max_tau = min(buf_len // 2, int(np.ceil(sample_rate / 20)))
        
        r = np.correlate(buffer, buffer, mode='full')
        center = len(buffer) - 1
        acf = r[center:center + max_tau]
        
        sq = buffer ** 2
        sum_sq = np.sum(sq)
        m = np.zeros(max_tau)
        m[0] = 2 * sum_sq
        
        current_m = m[0]
        for tau in range(1, max_tau):
            current_m -= sq[buf_len - tau] + sq[tau - 1]
            m[tau] = current_m
            
        with np.errstate(divide='ignore', invalid='ignore'):
            nsdf = np.where(m > 0, 2 * acf / m, 0)

        key_maxima = []
        in_positive_region = False
        current_max_tau = 0
        current_max_val = -float('inf')
        
        for tau in range(1, max_tau):
            if nsdf[tau] > 0 and nsdf[tau - 1] <= 0:
                in_positive_region = True
                current_max_tau = tau
                current_max_val = nsdf[tau]
            elif nsdf[tau] <= 0 and nsdf[tau - 1] > 0:
                if in_positive_region:
                    key_maxima.append((current_max_tau, current_max_val))
                in_positive_region = False
            elif in_positive_region and nsdf[tau] > current_max_val:
                current_max_tau = tau
                current_max_val = nsdf[tau]
                
        if in_positive_region:
            key_maxima.append((current_max_tau, current_max_val))
            
        if not key_maxima:
            return -1, {'nsdf': nsdf, 'key_maxima': [], 'threshold': 0, 'selected_tau': None}
            
        nmax = max(val for tau, val in key_maxima)
        if nmax < self.small_cutoff:
            return -1, {'nsdf': nsdf, 'key_maxima': [], 'threshold': 0, 'selected_tau': None}
            
        threshold = self.cutoff * nmax
        selected_peak = None
        for tau, val in key_maxima:
            if val >= threshold:
                selected_peak = (tau, val)
                break
                
        if not selected_peak:
            return -1, {'nsdf': nsdf, 'key_maxima': [], 'threshold': 0, 'selected_tau': None}
            
        tau, clarity = selected_peak
        interpolated_tau = float(tau)
        
        tau_int = int(round(interpolated_tau))
        if 0 < tau_int < max_tau - 1:
            s0 = nsdf[tau_int - 1]
            s1 = nsdf[tau_int]
            s2 = nsdf[tau_int + 1]
            a = (s0 + s2 - 2 * s1) / 2
            b = (s2 - s0) / 2
            if a < 0:
                adj = -b / (2 * a)
                if abs(adj) < 1:
                    interpolated_tau = tau_int + adj
                    
        return sample_rate / interpolated_tau, {
            'nsdf': nsdf, 'key_maxima': key_maxima, 'threshold': threshold, 'selected_tau': tau
        }
