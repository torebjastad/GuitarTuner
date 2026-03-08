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

        // RMS noise gate — very low floor to reject only true silence
        let rms = 0;
        for (let i = 0; i < bufferSize; i++) {
            rms += float32AudioBuffer[i] * float32AudioBuffer[i];
        }
        rms = Math.sqrt(rms / bufferSize);
        if (rms < 0.002) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        // Normalize buffer to target RMS for amplitude-invariant processing
        const targetRms = 0.1;
        const gain = targetRms / rms;
        const buffer = new Float32Array(bufferSize);
        for (let i = 0; i < bufferSize; i++) {
            buffer[i] = float32AudioBuffer[i] * gain;
        }

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
                const delta = buffer[i] - buffer[i + tau];
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

        // Step 4: Octave-error correction (bidirectional)
        let octaveCorrected = false;

        // 4a: Check tau/2 — if YIN locked onto a sub-harmonic (double the
        // true period), the real fundamental will have a good dip at half tau.
        // This fixes octave-down errors on mid/high strings (B3, E4) where
        // the first CMND dip below threshold is at 2× the true period.
        const halfTau = Math.round(tau / 2);
        if (halfTau >= minTau && halfTau < maxTau - 1) {
            let bestTau = halfTau;
            let bestVal = yinBuffer[halfTau];
            const searchRadius = Math.max(2, Math.round(halfTau * 0.1));
            const lo = Math.max(minTau, halfTau - searchRadius);
            const hi = Math.min(maxTau - 2, halfTau + searchRadius);
            for (let k = lo; k <= hi; k++) {
                if (yinBuffer[k] < bestVal) {
                    bestVal = yinBuffer[k];
                    bestTau = k;
                }
            }
            // Accept the half-tau if it has a reasonable dip and is
            // comparable to the current tau. Use a relaxed threshold (0.5)
            // since the true fundamental may have a weaker CMND dip than
            // the sub-harmonic, but still represents a valid period.
            if (bestVal < 0.5 && bestVal <= yinBuffer[tau] * 1.2) {
                tau = bestTau;
                octaveCorrected = true;
            }
        }

        // 4b: Check 2*tau — if YIN locked onto a harmonic (half the true
        // period), the real fundamental will have a good dip at double tau.
        // This fixes octave-up errors on low strings (E2, A2) where the
        // 2nd harmonic is stronger than the fundamental.
        if (!octaveCorrected) {
            const doubleTau = Math.round(tau * 2);
            if (doubleTau > 0 && doubleTau < maxTau - 1) {
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
                if (bestVal < 0.3 && bestVal < yinBuffer[tau] * 0.85) {
                    tau = bestTau;
                    octaveCorrected = true;
                }
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
