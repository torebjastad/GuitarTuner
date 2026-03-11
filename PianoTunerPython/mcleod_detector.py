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

        # Step 1: NSDF (Vectorized)
        nsdf = np.zeros(max_tau)
        
        # Calculate autocorrelation using FFT-based convolution for speed
        # r(tau) = sum(x[i] * x[i+tau])
        # correlation is equivalent to convolution with reversed array
        r = np.correlate(buffer, buffer, mode='full')
        # The center of the 'full' correlation array is lag 0
        center = len(buffer) - 1
        acf = r[center:center + max_tau]
        
        # Calculate moving sum of squares 
        # m(tau) = sum_{j=0}^{W-tau-1} (x_j^2 + x_{j+tau}^2)
        sq = buffer ** 2
        sum_sq = np.sum(sq)
        
        m = np.zeros(max_tau)
        m[0] = 2 * sum_sq
        
        # To compute m[tau] iteratively:
        # m[tau] = m[tau-1] - x[W-tau]^2 - x[tau-1]^2
        current_m = m[0]
        for tau in range(1, max_tau):
            current_m -= sq[buf_len - tau] + sq[tau - 1]
            m[tau] = current_m
            
        # NSDF[tau] = 2 * acf[tau] / m[tau]
        # using np.divide instead of divide zero warnings
        with np.errstate(divide='ignore', invalid='ignore'):
            nsdf = np.where(m > 0, 2 * acf / m, 0)

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
