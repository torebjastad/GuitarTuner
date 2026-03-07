/**
 * YIN Algorithm Implementation
 * Depends on: pitch-common.js (TunerDefaults, PitchDetector)
 */
class YinDetector extends PitchDetector {
    constructor(threshold = 0.1) {
        super();
        this.threshold = threshold;
        this.debug = false;
        this.debugData = null;
    }

    getPitch(float32AudioBuffer, sampleRate) {
        const bufferSize = float32AudioBuffer.length;
        const halfBuffer = Math.floor(bufferSize / 2);

        // Restrict tau range based on frequency limits:
        // tau = sampleRate / frequency, so low freq → high tau, high freq → low tau
        const maxTau = Math.min(halfBuffer, Math.ceil(sampleRate / TunerDefaults.MIN_FREQUENCY));
        const minTau = Math.max(1, Math.floor(sampleRate / TunerDefaults.MAX_FREQUENCY));

        const yinBuffer = new Float32Array(maxTau);

        // Step 1: Difference Function
        // d(tau) = sum((x[i] - x[i+tau])^2)
        for (let tau = 0; tau < maxTau; tau++) {
            yinBuffer[tau] = 0;
        }

        for (let tau = 1; tau < maxTau; tau++) {
            for (let i = 0; i < halfBuffer; i++) {
                const delta = float32AudioBuffer[i] - float32AudioBuffer[i + tau];
                yinBuffer[tau] += delta * delta;
            }
        }

        // Step 2: Cumulative Mean Normalized Difference Function
        // d'(tau) = d(tau) / (1/tau * sum(d(j)))
        yinBuffer[0] = 1;
        let runningSum = 0;
        for (let tau = 1; tau < maxTau; tau++) {
            runningSum += yinBuffer[tau];
            yinBuffer[tau] *= tau / runningSum;
        }

        // Step 3: Absolute Threshold (search only within valid frequency range)
        let tau = -1;
        let thresholdUsed = true;
        for (let i = minTau; i < maxTau; i++) {
            if (yinBuffer[i] < this.threshold) {
                // Found a dip below threshold
                while (i + 1 < maxTau && yinBuffer[i + 1] < yinBuffer[i]) {
                    i++;
                }
                tau = i;
                break;
            }
        }

        // If no pitch found below threshold, look for global minimum
        if (tau === -1) {
            thresholdUsed = false;
            let minVal = 100; // Arbitrary high
            for (let i = minTau; i < maxTau; i++) {
                if (yinBuffer[i] < minVal) {
                    minVal = yinBuffer[i];
                    tau = i;
                }
            }
        }

        const initialTau = tau;

        // Step 4: Octave-error correction
        // Check if there's a valid dip at 2*tau (the true fundamental).
        // Guitar low strings often have a stronger 2nd harmonic than the
        // fundamental, causing YIN to lock onto the harmonic (half the
        // true period). If the CMND value at 2*tau is below a relaxed
        // threshold AND is better (lower) than the value at tau, the
        // fundamental is present and we should prefer it.
        let octaveCorrected = false;
        const doubleTau = Math.round(tau * 2);
        if (doubleTau > 0 && doubleTau < maxTau - 1) {
            // Walk to the local minimum near doubleTau
            let bestTau = doubleTau;
            let bestVal = yinBuffer[doubleTau];
            const searchRadius = Math.max(4, Math.round(tau * 0.1));
            const lo = Math.max(1, doubleTau - searchRadius);
            const hi = Math.min(maxTau - 2, doubleTau + searchRadius);
            for (let k = lo; k <= hi; k++) {
                if (yinBuffer[k] < bestVal) {
                    bestVal = yinBuffer[k];
                    bestTau = k;
                }
            }
            // Accept the sub-harmonic only if its CMND dip is reasonable
            // AND the dip at 2*tau is at least as good as at tau.
            // This prevents false corrections on mid/high strings (G3, B3, E4)
            // where the 2*tau dip is a sub-harmonic artifact, not the fundamental.
            if (bestVal < 0.3 && bestVal <= yinBuffer[tau]) {
                tau = bestTau;
                octaveCorrected = true;
            }
        }

        const correctedTau = tau;

        // Step 5: Parabolic Interpolation
        // Use 5-point least-squares quadratic fit when possible (more robust
        // for broad or asymmetric dips), fall back to 3-point fit near edges.
        let interpolatedTau = tau;
        if (tau > 2 && tau < maxTau - 2) {
            // 5-point least-squares: fit y = a*x^2 + b*x + c at x = {-2,-1,0,1,2}
            const sm2 = yinBuffer[tau - 2];
            const sm1 = yinBuffer[tau - 1];
            const s0 = yinBuffer[tau];
            const s1 = yinBuffer[tau + 1];
            const s2 = yinBuffer[tau + 2];
            const a = (2 * sm2 - sm1 - 2 * s0 - s1 + 2 * s2) / 14;
            const b = (-2 * sm2 - sm1 + s1 + 2 * s2) / 10;
            if (a > 0) {
                const adjustment = -b / (2 * a);
                if (Math.abs(adjustment) < 2) interpolatedTau = tau + adjustment;
            }
        } else if (tau > 1 && tau < maxTau - 1) {
            // 3-point fallback near buffer edges
            const s0 = yinBuffer[tau - 1];
            const s1 = yinBuffer[tau];
            const s2 = yinBuffer[tau + 1];
            const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
            if (Math.abs(adjustment) < 1) interpolatedTau = tau + adjustment;
        }

        const probability = 1 - yinBuffer[Math.floor(interpolatedTau)];

        // Capture debug data if enabled
        if (this.debug) {
            this.debugData = {
                cmnd: new Float32Array(yinBuffer),
                threshold: this.threshold,
                initialTau,
                thresholdUsed,
                octaveCorrected,
                correctedTau,
                interpolatedTau,
                probability,
                frequency: probability >= 0.6 ? sampleRate / interpolatedTau : -1,
                sampleRate,
                bufferLength: maxTau
            };
        }

        // Noise gate
        if (probability < 0.6) return -1;

        return sampleRate / interpolatedTau;
    }
}
