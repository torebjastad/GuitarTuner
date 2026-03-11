import numpy as np
import math

# Try to use McLeod, but heavily verify using spectral data.
class UltimatePianoDetector:
    def __init__(self, cutoff=0.93, small_cutoff=0.4):
        self.cutoff = cutoff
        self.small_cutoff = small_cutoff

    def get_pitch(self, buffer, sample_rate):
        buf_len = len(buffer)
        max_tau = min(buf_len // 2, int(np.ceil(sample_rate / 20)))
        
        # NSDF Calculation
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

        # Peak Picking
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
            return -1
            
        nmax = max(val for tau, val in key_maxima)
        if nmax < self.small_cutoff:
            return -1
            
        # Select best peak using McLeod
        threshold = self.cutoff * nmax
        selected_peak = None
        for tau, val in key_maxima:
            if val >= threshold:
                selected_peak = (tau, val)
                break
                
        if not selected_peak:
            return -1
            
        tau, clarity = selected_peak
        
        # FFT for spectral verification
        fft_size = 16384
        N = len(buffer)
        window = np.hanning(N)
        re = np.zeros(fft_size)
        re[:N] = buffer * window
        mag = np.abs(np.fft.rfft(re))
        bin_hz = sample_rate / fft_size
        
        def get_spectral_power(freq):
            b = int(round(freq / bin_hz))
            if b <= 0 or b >= len(mag)-1: return 0
            # Return max within a small neighborhood
            return max(mag[max(1, b-2):min(len(mag), b+3)])
            
        interpolated_tau = float(tau)
        # Verify sub-harmonics!
        # If the tau is very large (low freq), check if there is an earlier key_maximum 
        # (higher freq) that represents a physically stronger spectral peak!
        candidate_freq = sample_rate / tau
        
        # Only bother checking octave errors if candidate is below 2000Hz, 
        # because high notes are where McLeod tends to drop an octave.
        # Check integer multiples of the candidate frequency
        best_freq = candidate_freq
        best_power = get_spectral_power(candidate_freq)
        
        # We will check exactly 1 octave up (2*f), 1.5 octaves (3*f) etc., and see if one is drastically stronger
        for mult in [2, 3, 4, 5]:
            higher_freq = candidate_freq * mult
            if higher_freq > 6000: break # Exceeds piano range
            
            pwr = get_spectral_power(higher_freq)
            
            # If the higher harmonic is massively stronger (e.g. 3x stronger), 
            # and it exists as a key_maximum in NSDF, upgrade!
            if pwr > best_power * 2.5:
                # Check if this period exists as a valid peak in NSDF
                expected_tau = tau / mult
                # Find matching key_maxima
                for pk_tau, pk_val in key_maxima:
                    # if it's within 1 sample
                    if abs(pk_tau - expected_tau) < 2 and pk_val > 0.4:
                        best_freq = sample_rate / pk_tau
                        best_power = pwr
                        interpolated_tau = float(pk_tau)
                        break

        # Parabolic interpolation
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
                    
        return sample_rate / interpolated_tau
