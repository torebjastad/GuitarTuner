import numpy as np
import math

class TunerDefaults:
    MIN_FREQUENCY = 20
    MAX_FREQUENCY = 10000

class HpsDetector:
    def __init__(self, num_harmonics=8, dtft_harmonics=2, snr_threshold=0.8, rms_threshold=0.002, window_size_exp=12):
        self.num_harmonics = num_harmonics
        self.dtft_harmonics = dtft_harmonics
        self.snr_threshold = snr_threshold
        self.rms_threshold = rms_threshold
        self.window_size_exp = window_size_exp
        
        self.fft_size = 32768
        self._window_size = 0
        self._window = None

    def _ensure_window(self, size):
        if self._window_size == size:
            return
        # Blackman-Harris 4-term
        N1 = size - 1
        a0, a1, a2, a3 = 0.35875, 0.48829, 0.14128, 0.01168
        idx = np.arange(size)
        phi = 2 * np.pi * idx / N1
        self._window = a0 - a1 * np.cos(phi) + a2 * np.cos(2 * phi) - a3 * np.cos(3 * phi)
        self._window_size = size

    def _multi_harmonic_score(self, f, sample_rate, num_h, weights, windowed_buf):
        n = len(windowed_buf)
        total_power = 0
        for h in range(1, num_h + 1):
            w = weights[h - 1] if weights is not None else 1
            if w <= 0:
                continue
            omega = 2 * math.pi * h * f / sample_rate
            
            # Vectorized DTFT evaluation
            idx = np.arange(n)
            exponent = -1j * omega * idx
            dtft_val = np.sum(windowed_buf * np.exp(exponent))
            power = w * (dtft_val.real**2 + dtft_val.imag**2)
            
            total_power += power
        return total_power

    def _assess_harmonic_weights(self, mag, half_n, ref_bin, num_h):
        weights = np.zeros(num_h)
        for h in range(1, num_h + 1):
            b = int(round(h * ref_bin))
            if b >= half_n - 5:
                weights[h - 1] = 0
                continue
            
            peak = mag[b]
            
            # noise floor from 3-5 bins away
            noise_sum = 0
            noise_count = 0
            for d in range(3, 6):
                if b - d >= 0:
                    noise_sum += mag[b - d]
                    noise_count += 1
                if b + d < half_n:
                    noise_sum += mag[b + d]
                    noise_count += 1
                    
            noise = noise_sum / noise_count if noise_count > 0 else 1
            local_snr = peak / noise if noise > 0 else 0
            weights[h - 1] = max(0, local_snr - 1.5)
            
        if weights[0] < 1:
            weights[0] = 1
        return weights

    def _least_squares_peak(self, offsets, log_scores):
        n = len(offsets)
        offsets = np.array(offsets)
        log_scores = np.array(log_scores)
        
        S_2 = np.sum(offsets**2)
        S_4 = np.sum(offsets**4)
        T_0 = np.sum(log_scores)
        T_1 = np.sum(offsets * log_scores)
        T_2 = np.sum((offsets**2) * log_scores)
        
        det = n * S_4 - S_2 * S_2
        if det == 0 or S_2 == 0:
            return 0
            
        a = (n * T_2 - S_2 * T_0) / det
        b = T_1 / S_2
        
        if a >= 0:
            return 0
            
        peak = -b / (2 * a)
        # Check bounds
        max_off = offsets[-1]
        if abs(peak) > max_off + 0.5:
            return 0
        return peak

    def _dtft_refine(self, approx_freq, sample_rate, weights, windowed_buf):
        bin_hz = sample_rate / self.fft_size
        num_h = len(weights)
        
        # Round 1
        step1 = bin_hz * 0.5
        offsets1 = [-3, -2, -1, 0, 1, 2, 3]
        log_scores1 = []
        for p in offsets1:
            f = approx_freq + p * step1
            if f <= 0:
                log_scores1.append(-100)
                continue
            score = self._multi_harmonic_score(f, sample_rate, num_h, weights, windowed_buf)
            log_scores1.append(math.log(score) if score > 0 else -100)
            
        peak1 = self._least_squares_peak(offsets1, log_scores1)
        freq1 = approx_freq + peak1 * step1
        
        # Round 2
        step2 = bin_hz * 0.125
        offsets2 = [-2, -1, 0, 1, 2]
        log_scores2 = []
        for p in offsets2:
            f = freq1 + p * step2
            if f <= 0:
                log_scores2.append(-100)
                continue
            score = self._multi_harmonic_score(f, sample_rate, num_h, weights, windowed_buf)
            log_scores2.append(math.log(score) if score > 0 else -100)
            
        peak2 = self._least_squares_peak(offsets2, log_scores2)
        freq2 = freq1 + peak2 * step2
        
        return freq2

    def get_pitch(self, buffer, sample_rate):
        required_size = 2 ** self.window_size_exp
        if len(buffer) < required_size:
            required_size = len(buffer)
            
        buffer = buffer[:required_size]
        buf_len = len(buffer)
        
        rms = np.sqrt(np.mean(buffer**2))
        if rms < self.rms_threshold:
            return -1
            
        target_rms = 0.1
        gain = target_rms / rms
        
        self._ensure_window(buf_len)
        windowed_buf = buffer * gain * self._window
        
        # FFT Stage
        re = np.zeros(self.fft_size)
        re[:buf_len] = windowed_buf
        
        fft_out = np.fft.rfft(re, n=self.fft_size)
        mag = np.abs(fft_out)
        half_n = self.fft_size // 2
        
        min_bin = max(1, math.floor(TunerDefaults.MIN_FREQUENCY * self.fft_size / sample_rate))
        internal_max_freq = 10000
        max_bin = min(half_n - 1, round(internal_max_freq * self.fft_size / sample_rate))
        
        hps = np.full(half_n, -100.0)
        
        for i in range(min_bin, max_bin):
            max_h = min(self.num_harmonics, math.floor((half_n - 1) / i))
            if max_h < 2:
                continue
            
            s = 0
            count = 0
            for h in range(1, max_h + 1):
                idx = i * h
                m = mag[idx]
                if m > 0:
                    s += math.log(m)
                    count += 1
                    
            if count >= 2:
                hps[i] = s / count
                
        # Find HPS peak
        peak_bin = min_bin
        peak_val = hps[min_bin]
        for i in range(min_bin + 1, max_bin):
            if hps[i] > peak_val:
                peak_val = hps[i]
                peak_bin = i
                
        # Octave-error check
        half_peak_bin = round(peak_bin / 2)
        if half_peak_bin >= min_bin:
            best_sub_bin = half_peak_bin
            best_sub_val = hps[half_peak_bin]
            search_radius = max(2, round(half_peak_bin * 0.05))
            lo = max(min_bin, half_peak_bin - search_radius)
            hi = min(max_bin - 1, half_peak_bin + search_radius)
            
            for k in range(lo, hi + 1):
                if hps[k] > best_sub_val:
                    best_sub_val = hps[k]
                    best_sub_bin = k
                    
            sub_mag = mag[best_sub_bin]
            peak_mag = mag[peak_bin]
            if (peak_val - best_sub_val) < 0.8 and sub_mag > peak_mag * 0.3:
                peak_bin = best_sub_bin
                peak_val = best_sub_val
                
        # SNR Gate
        valid_hps = hps[min_bin:max_bin]
        median = np.median(valid_hps)
        snr = peak_val - median
        
        if snr < self.snr_threshold:
            return -1
            
        # True spectral peak near HPS bin
        ref_bin = peak_bin
        ref_val = mag[peak_bin]
        ref_lo = max(min_bin, peak_bin - 3)
        ref_hi = min(max_bin - 1, peak_bin + 3)
        for k in range(ref_lo, ref_hi + 1):
            if mag[k] > ref_val:
                ref_val = mag[k]
                ref_bin = k
                
        # Assess quality
        bin_hz = sample_rate / self.fft_size
        approx_freq = ref_bin * bin_hz
        
        num_ref_h = self.dtft_harmonics
        if approx_freq < 150:
            max_useful = math.floor((sample_rate * 0.4) / approx_freq)
            num_ref_h = min(max_useful, max(4, self.dtft_harmonics))
            
        weights = self._assess_harmonic_weights(mag, half_n, ref_bin, num_ref_h)
        freq = self._dtft_refine(approx_freq, sample_rate, weights, windowed_buf)
        return freq
