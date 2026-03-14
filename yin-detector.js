/**
 * YIN Algorithm Implementation
 *
 * Uses FFT-based cross-correlation O(N log N) for the difference function
 * instead of the direct O(N²) computation.
 * Depends on: pitch-common.js (TunerDefaults, PitchDetector, PitchFFT)
 */
class YinDetector extends PitchDetector {
    constructor(threshold = 0.1, probabilityThreshold = 0.6) {
        super();
        this.threshold = threshold;
        this.probabilityThreshold = probabilityThreshold;
        this.debug = false;
        this.debugData = null;

        // Pre-allocate FFT buffers (resized lazily)
        this._fftSize = 0;
        this._aRe = null;
        this._aIm = null;
        this._bRe = null;
        this._bIm = null;
    }

    _ensureBuffers(bufferSize) {
        // Cross-correlation needs fftSize >= bufferSize + halfBuffer
        const nFft = PitchFFT.nextPow2(2 * bufferSize);
        if (this._fftSize !== nFft) {
            this._fftSize = nFft;
            this._aRe = new Float64Array(nFft);
            this._aIm = new Float64Array(nFft);
            this._bRe = new Float64Array(nFft);
            this._bIm = new Float64Array(nFft);
        }
    }

    getParams() {
        return [
            { key: 'threshold', label: 'Threshold', min: 0.01, max: 0.3, step: 0.01, value: this.threshold, description: 'Absolute threshold for the CMND function. Lower values make it stricter and less likely to find a pitch, but more accurate against octave-jump errors.' },
            { key: 'probabilityThreshold', label: 'Noise Gate (Prob)', min: 0.1, max: 0.9, step: 0.05, value: this.probabilityThreshold, description: 'Minimum confidence required to accept a reading. Prevents random noise from being interpreted as a pitch.' }
        ];
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

        // Restrict tau range based on frequency limits
        const maxTau = Math.min(halfBuffer, Math.ceil(sampleRate / TunerDefaults.MIN_FREQUENCY));
        const minTau = Math.max(1, Math.floor(sampleRate / TunerDefaults.MAX_FREQUENCY));

        const yinBuffer = new Float32Array(maxTau);

        // ── FFT-based difference function ──
        // d(τ) = S1 + S2(τ) - 2·r_cross(τ)
        // where S1 = Σ x[i]² (i=0..W-1), S2(τ) = Σ x[i+τ]² (i=0..W-1),
        // r_cross(τ) = Σ x[i]·x[i+τ] (i=0..W-1)

        this._ensureBuffers(bufferSize);
        const nFft = this._fftSize;
        const aRe = this._aRe;
        const aIm = this._aIm;
        const bRe = this._bRe;
        const bIm = this._bIm;

        // FFT of windowed signal a = x[0:halfBuffer]
        for (let i = 0; i < halfBuffer; i++) aRe[i] = buffer[i];
        for (let i = halfBuffer; i < nFft; i++) aRe[i] = 0;
        aIm.fill(0);
        PitchFFT.fft(aRe, aIm);

        // FFT of full signal b = x[0:bufferSize]
        for (let i = 0; i < bufferSize; i++) bRe[i] = buffer[i];
        for (let i = bufferSize; i < nFft; i++) bRe[i] = 0;
        bIm.fill(0);
        PitchFFT.fft(bRe, bIm);

        // Cross-correlation: R = IFFT(conj(A) · B)
        for (let i = 0; i < nFft; i++) {
            const cRe = aRe[i], cIm = -aIm[i]; // conj(A)
            const xRe = bRe[i], xIm = bIm[i];  // B
            aRe[i] = cRe * xRe - cIm * xIm;
            aIm[i] = cRe * xIm + cIm * xRe;
        }
        PitchFFT.ifft(aRe, aIm);
        // aRe[τ] = r_cross(τ)

        // S1 = Σ x[i]² for i=0..halfBuffer-1 (constant)
        let S1 = 0;
        for (let i = 0; i < halfBuffer; i++) S1 += buffer[i] * buffer[i];

        // S2(τ) via cumulative sum of x²
        // S2(τ) = Σ x[i+τ]² for i=0..halfBuffer-1 = cumSq[τ+halfBuffer-1] - cumSq[τ-1]
        const cumSq = new Float64Array(bufferSize);
        cumSq[0] = buffer[0] * buffer[0];
        for (let i = 1; i < bufferSize; i++) {
            cumSq[i] = cumSq[i - 1] + buffer[i] * buffer[i];
        }

        yinBuffer[0] = 0;
        for (let tau = 1; tau < maxTau; tau++) {
            const S2 = cumSq[tau + halfBuffer - 1] - cumSq[tau - 1];
            yinBuffer[tau] = S1 + S2 - 2 * aRe[tau];
        }

        // Step 2: Cumulative Mean Normalized Difference Function
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
            let minVal = 100;
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

        // 4a: Check tau/2
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
            if (bestVal < 0.5 && bestVal <= yinBuffer[tau] * 1.2) {
                tau = bestTau;
                octaveCorrected = true;
            }
        }

        // 4b: Check 2*tau
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
        let interpolatedTau = tau;
        if (tau > 2 && tau < maxTau - 2) {
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
            const s0 = yinBuffer[tau - 1];
            const s1 = yinBuffer[tau];
            const s2 = yinBuffer[tau + 1];
            const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
            if (Math.abs(adjustment) < 1) interpolatedTau = tau + adjustment;
        }

        const probability = 1 - yinBuffer[Math.floor(interpolatedTau)];

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
                frequency: probability >= this.probabilityThreshold ? sampleRate / interpolatedTau : -1,
                sampleRate,
                bufferLength: maxTau
            };
        }

        if (probability < this.probabilityThreshold) return -1;

        return sampleRate / interpolatedTau;
    }
}
