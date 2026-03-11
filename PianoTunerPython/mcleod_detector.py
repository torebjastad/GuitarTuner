import numpy as np

class TunerDefaults:
    MIN_FREQUENCY = 20
    MAX_FREQUENCY = 10000

class McLeodDetector:
    def __init__(self, cutoff=0.93, small_cutoff=0.5):
        self.cutoff = cutoff
        self.small_cutoff = small_cutoff

    def get_pitch(self, buffer, sample_rate):
        buf_len = len(buffer)
        
        # Max tau corresponding to MIN_FREQUENCY
        max_tau = min(buf_len // 2, int(np.ceil(sample_rate / TunerDefaults.MIN_FREQUENCY)))
        
        if max_tau <= 0:
            return -1

        # Step 1: NSDF
        nsdf = np.zeros(max_tau)
        for tau in range(max_tau):
            limit = buf_len - tau
            if limit <= 0:
                break
            
            # Using numpy for speed
            b1 = buffer[:limit]
            b2 = buffer[tau:]
            
            acf = np.sum(b1 * b2)
            div = np.sum(b1**2) + np.sum(b2**2)
            
            nsdf[tau] = 2 * acf / div if div > 0 else 0

        # Step 2: Peak Picking
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
            
        # Step 3: Relative threshold
        nmax = max(val for tau, val in key_maxima)
        threshold = self.cutoff * nmax
        
        selected_peak = None
        for tau, val in key_maxima:
            if val >= threshold:
                selected_peak = (tau, val)
                break
                
        if not selected_peak:
            return -1
            
        # Step 4: Parabolic interpolation
        tau, clarity = selected_peak
        interpolated_tau = float(tau)
        
        if 0 < tau < max_tau - 1:
            s0 = nsdf[tau - 1]
            s1 = nsdf[tau]
            s2 = nsdf[tau + 1]
            
            a = (s0 + s2 - 2 * s1) / 2
            b = (s2 - s0) / 2
            
            if a < 0:
                adjustment = -b / (2 * a)
                if abs(adjustment) < 1:
                    interpolated_tau += adjustment
                    
        # Step 5: Clarity gate
        if clarity < self.small_cutoff:
            return -1
            
        return sample_rate / interpolated_tau
