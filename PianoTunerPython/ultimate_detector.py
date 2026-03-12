import numpy as np
import math

class UltimatePianoDetector:
    def __init__(self, cutoff=0.93, small_cutoff=0.4):
        self.cutoff = cutoff
        self.small_cutoff = small_cutoff

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
            # Look at a slightly wider window to catch peak smearing
            return max(mag[max(1, b-2):min(len(mag), b+3)])
            
        pwr_mpm = 0
        pwr_wpeak = 0
        
        # Pianos suffer from mechanically-dense low frequencies and sympathetic resonance octave drops.
        if w_peak_freq > 1000 and mpm_freq > 0:
            ratio = w_peak_freq / mpm_freq
            closest_int = round(ratio)
            
            decision_log.append(f"3. Ratio (w_peak / mpm): {ratio:.2f} (closest int: {closest_int})")
            
            # Subharmonics and overtones physically never exceed a ratio of ~8 for pianos.
            if closest_int <= 8:
                is_close_to_int = abs(ratio - closest_int) < 0.2
                
                if is_close_to_int:
                    decision_log.append(f"4. Harmonic Relation Detected! Checking raw power...")
                    pwr_mpm = get_raw_power(mpm_freq)
                    pwr_wpeak = get_raw_power(w_peak_freq)
                    decision_log.append(f"   - Raw Power @ MPM ({mpm_freq:.1f}Hz): {pwr_mpm:.2f}")
                    decision_log.append(f"   - Raw Power @ Peak ({w_peak_freq:.1f}Hz): {pwr_wpeak:.2f}")
                    
                    # If w_peak is extremely high (> 1800Hz), it is almost guaranteed to be the true note
                    # because high middle-range notes don't produce dominant 7th overtones.
                    # If w_peak is lower, it could legitimately be an overtone of a low note,
                    # so we make it much easier for mpm_freq to prove itself.
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
                decision_log.append(f"4. Extreme Ratio > 8. MPM locked on low mechanical thud.")
                decision_log.append(f"   -> Using Spectral Peak.")
                # Extreme ratio. Mechanical impact thud / completely structural noise.
                final_freq = w_peak_freq
                
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
                'decision_log': decision_log
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
