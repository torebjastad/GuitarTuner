/**
 * Ultimate Hybrid Pitch Detector
 *
 * Two-stage algorithm combining McLeod Pitch Method (time-domain) with a
 * frequency-weighted spectral peak (frequency-domain) and a decision engine
 * that intelligently selects the best result.
 *
 * Ported from PianoTunerPython/ultimate_detector.py
 *
 * Stage 1 — McLeod MPM via NSDF for reliable low/mid-frequency detection
 * Stage 2 — High-resolution FFT (65536-point) with +6 dB/octave highpass
 *           weighting to suppress mechanical/structural noise
 * Stage 3 — Decision engine comparing both candidates via harmonic ratio
 *           analysis and spectral power comparison
 *
 * Depends on: pitch-common.js (TunerDefaults, PitchDetector)
 */
class UltimateDetector extends PitchDetector {
    constructor(cutoff = 0.93, smallCutoff = 0.40, rmsThreshold = 0.002) {
        super();
        this.cutoff = cutoff;
        this.smallCutoff = smallCutoff;
        this.rmsThreshold = rmsThreshold;
        this.decisionFreq = 1000;
        this.debug = false;
        this.debugData = null;

        // Spectral FFT size — 65536 gives ~0.73 Hz resolution at 48 kHz
        this.spectralFftSize = 65536;

        // Pre-allocate FFT buffers
        this._fftReal = new Float64Array(this.spectralFftSize);
        this._fftImag = new Float64Array(this.spectralFftSize);
        this._magnitude = new Float64Array(this.spectralFftSize / 2 + 1);

        // Pre-allocate McLeod buffers (sized for max expected buffer)
        this._nsdf = new Float64Array(8192);
        this._sq = new Float64Array(8192);
        this._m = new Float64Array(8192);

        // Hanning window cache
        this._hanningWindow = null;
        this._hanningSize = 0;
    }

    getRequiredBufferSize() {
        return 8192;
    }

    getParams() {
        return [
            { key: 'cutoff', label: 'MPM Threshold', min: 0.5, max: 1.0, step: 0.01, value: this.cutoff, description: 'McLeod relative threshold — fraction of best NSDF peak. Higher values prefer the first (highest-frequency) strong peak, avoiding octave drops.' },
            { key: 'smallCutoff', label: 'Clarity Gate', min: 0.1, max: 0.9, step: 0.01, value: this.smallCutoff, description: 'Minimum NSDF clarity value. Rejects signals where the best periodicity peak is too weak (noisy/unpitched).' },
            { key: 'rmsThreshold', label: 'RMS Noise Gate', min: 0.0001, max: 0.05, step: 0.0001, value: this.rmsThreshold, description: 'Minimum RMS volume level required to process the signal.' },
            { key: 'decisionFreq', label: 'Decision Freq', min: 500, max: 2000, step: 50, value: this.decisionFreq, description: 'Frequency threshold above which the decision engine activates to compare MPM vs spectral peak. Below this, MPM result is trusted.' }
        ];
    }

    /**
     * Ensure Hanning window is computed for the given size.
     */
    _ensureHanningWindow(size) {
        if (this._hanningSize === size) return;
        this._hanningWindow = new Float64Array(size);
        const N1 = size - 1;
        for (let i = 0; i < size; i++) {
            this._hanningWindow[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / N1));
        }
        this._hanningSize = size;
    }

    /**
     * In-place radix-2 Cooley-Tukey FFT.
     * Identical to the proven implementation in hps-detector.js.
     */
    _fft(re, im) {
        const n = re.length;

        // Bit-reversal permutation
        for (let i = 1, j = 0; i < n; i++) {
            let bit = n >> 1;
            while (j & bit) { j ^= bit; bit >>= 1; }
            j ^= bit;
            if (i < j) {
                let tmp = re[i]; re[i] = re[j]; re[j] = tmp;
                tmp = im[i]; im[i] = im[j]; im[j] = tmp;
            }
        }

        // Butterfly stages
        for (let len = 2; len <= n; len *= 2) {
            const half = len >> 1;
            const angle = -2 * Math.PI / len;
            const wRe = Math.cos(angle);
            const wIm = Math.sin(angle);
            for (let i = 0; i < n; i += len) {
                let curRe = 1, curIm = 0;
                for (let j = 0; j < half; j++) {
                    const idx1 = i + j;
                    const idx2 = idx1 + half;
                    const uRe = re[idx1], uIm = im[idx1];
                    const vRe = re[idx2] * curRe - im[idx2] * curIm;
                    const vIm = re[idx2] * curIm + im[idx2] * curRe;
                    re[idx1] = uRe + vRe;
                    im[idx1] = uIm + vIm;
                    re[idx2] = uRe - vRe;
                    im[idx2] = uIm - vIm;
                    const tmpRe = curRe * wRe - curIm * wIm;
                    curIm = curRe * wIm + curIm * wRe;
                    curRe = tmpRe;
                }
            }
        }
    }

    /**
     * McLeod Pitch Method (time-domain).
     * Returns { freq, clarity, debugData }.
     */
    _runMcleod(buffer, sampleRate) {
        const bufLen = buffer.length;
        const maxTau = Math.min(bufLen >> 1, Math.ceil(sampleRate / 20));

        // Ensure pre-allocated buffers are large enough
        if (this._nsdf.length < maxTau) {
            this._nsdf = new Float64Array(maxTau);
            this._sq = new Float64Array(bufLen);
            this._m = new Float64Array(maxTau);
        }

        const nsdf = this._nsdf;
        const sq = this._sq;
        const m = this._m;

        // Compute squared samples
        for (let i = 0; i < bufLen; i++) {
            sq[i] = buffer[i] * buffer[i];
        }

        // Running sum of squares normalization
        let sumSq = 0;
        for (let i = 0; i < bufLen; i++) sumSq += sq[i];
        m[0] = 2 * sumSq;

        let currentM = m[0];
        for (let tau = 1; tau < maxTau; tau++) {
            currentM -= sq[bufLen - tau] + sq[tau - 1];
            m[tau] = currentM;
        }

        // Autocorrelation and NSDF
        nsdf[0] = 1;
        for (let tau = 1; tau < maxTau; tau++) {
            let acf = 0;
            for (let i = 0; i < bufLen - tau; i++) {
                acf += buffer[i] * buffer[i + tau];
            }
            nsdf[tau] = m[tau] > 0 ? (2 * acf / m[tau]) : 0;
        }

        // Key maxima extraction
        const keyMaxima = [];
        let inPositiveRegion = false;
        let currentMaxTau = 0;
        let currentMaxVal = -Infinity;

        for (let tau = 1; tau < maxTau; tau++) {
            if (nsdf[tau] > 0 && nsdf[tau - 1] <= 0) {
                inPositiveRegion = true;
                currentMaxTau = tau;
                currentMaxVal = nsdf[tau];
            } else if (nsdf[tau] <= 0 && nsdf[tau - 1] > 0) {
                if (inPositiveRegion) {
                    keyMaxima.push({ tau: currentMaxTau, val: currentMaxVal });
                }
                inPositiveRegion = false;
            } else if (inPositiveRegion && nsdf[tau] > currentMaxVal) {
                currentMaxTau = tau;
                currentMaxVal = nsdf[tau];
            }
        }
        if (inPositiveRegion) {
            keyMaxima.push({ tau: currentMaxTau, val: currentMaxVal });
        }

        const emptyDebug = {
            nsdf: new Float64Array(nsdf.subarray(0, maxTau)),
            keyMaxima: [],
            threshold: 0,
            selectedTau: -1,
            maxTau
        };

        if (keyMaxima.length === 0) {
            return { freq: -1, clarity: 0, debugData: emptyDebug };
        }

        // Clarity gate
        let nmax = -Infinity;
        for (let i = 0; i < keyMaxima.length; i++) {
            if (keyMaxima[i].val > nmax) nmax = keyMaxima[i].val;
        }
        if (nmax < this.smallCutoff) {
            return { freq: -1, clarity: nmax, debugData: emptyDebug };
        }

        // Relative threshold selection — pick first peak above threshold
        const threshold = this.cutoff * nmax;
        let selectedPeak = null;
        for (let i = 0; i < keyMaxima.length; i++) {
            if (keyMaxima[i].val >= threshold) {
                selectedPeak = keyMaxima[i];
                break;
            }
        }

        if (!selectedPeak) {
            return { freq: -1, clarity: nmax, debugData: emptyDebug };
        }

        // Parabolic interpolation
        let interpolatedTau = selectedPeak.tau;
        const tauInt = selectedPeak.tau;
        if (tauInt > 0 && tauInt < maxTau - 1) {
            const s0 = nsdf[tauInt - 1];
            const s1 = nsdf[tauInt];
            const s2 = nsdf[tauInt + 1];
            const a = (s0 + s2 - 2 * s1) / 2;
            const b = (s2 - s0) / 2;
            if (a < 0) {
                const adj = -b / (2 * a);
                if (Math.abs(adj) < 1) {
                    interpolatedTau = tauInt + adj;
                }
            }
        }

        const freq = sampleRate / interpolatedTau;
        return {
            freq,
            clarity: selectedPeak.val,
            debugData: {
                nsdf: new Float64Array(nsdf.subarray(0, maxTau)),
                keyMaxima,
                threshold,
                selectedTau: selectedPeak.tau,
                interpolatedTau,
                maxTau
            }
        };
    }

    getPitch(buffer, sampleRate) {
        const bufLen = buffer.length;

        // RMS noise gate
        let rmsSum = 0;
        for (let i = 0; i < bufLen; i++) {
            rmsSum += buffer[i] * buffer[i];
        }
        const rms = Math.sqrt(rmsSum / bufLen);
        if (rms < this.rmsThreshold) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        // ── Stage 1: McLeod MPM ──
        const mcleod = this._runMcleod(buffer, sampleRate);
        const mpmFreq = mcleod.freq;

        // ── Stage 2: Frequency-weighted spectral peak ──
        const fftSize = this.spectralFftSize;
        const re = this._fftReal;
        const im = this._fftImag;

        // Apply Hanning window and zero-pad
        this._ensureHanningWindow(bufLen);
        for (let i = 0; i < bufLen; i++) {
            re[i] = buffer[i] * this._hanningWindow[i];
        }
        for (let i = bufLen; i < fftSize; i++) {
            re[i] = 0;
        }
        im.fill(0);

        this._fft(re, im);

        // Magnitude spectrum
        const mag = this._magnitude;
        const halfN = fftSize / 2 + 1;
        for (let i = 0; i < halfN; i++) {
            mag[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
        }

        const binHz = sampleRate / fftSize;
        const minBin = Math.floor(25 / binHz);
        const maxBin = Math.floor(10000 / binHz);

        // Frequency weighting (+6 dB/octave highpass) and find peak
        let bestWeightedVal = -Infinity;
        let peakIdx = 0;
        for (let i = 0; i < maxBin - minBin; i++) {
            const bin = minBin + i;
            const freq = bin * binHz;
            const weighted = mag[bin] * freq;
            if (weighted > bestWeightedVal) {
                bestWeightedVal = weighted;
                peakIdx = i;
            }
        }
        const wPeakBin = minBin + peakIdx;

        // Parabolic interpolation on RAW magnitude (weighting only for selection)
        let wPeakFreq;
        if (wPeakBin > 0 && wPeakBin < halfN - 1) {
            const alpha = mag[wPeakBin - 1];
            const beta = mag[wPeakBin];
            const gamma = mag[wPeakBin + 1];
            const num = 0.5 * (alpha - gamma);
            const den = alpha - 2 * beta + gamma;
            const adj = den !== 0 ? num / den : 0;
            wPeakFreq = (wPeakBin + adj) * binHz;
        } else {
            wPeakFreq = wPeakBin * binHz;
        }

        // ── Stage 3: Decision engine ──
        let finalFreq = mpmFreq;
        let decisionReason = 'MPM (default)';
        let pwrMpm = 0;
        let pwrWpeak = 0;

        const getRawPower = (freq) => {
            const b = Math.round(freq / binHz);
            if (b <= 0 || b >= halfN - 1) return 0;
            const lo = Math.max(1, b - 2);
            const hi = Math.min(halfN - 1, b + 3);
            let maxMag = 0;
            for (let i = lo; i < hi; i++) {
                if (mag[i] > maxMag) maxMag = mag[i];
            }
            return maxMag;
        };

        if (wPeakFreq > this.decisionFreq && mpmFreq > 0) {
            const ratio = wPeakFreq / mpmFreq;
            const closestInt = Math.round(ratio);

            if (closestInt > 8) {
                // Extreme ratio — MPM locked on mechanical thud
                finalFreq = wPeakFreq;
                decisionReason = 'Spectral peak (ratio > 8, MPM on noise)';
            } else {
                const isCloseToInt = Math.abs(ratio - closestInt) < 0.2;

                if (!isCloseToInt) {
                    // Not harmonically related — MPM locked on noise
                    finalFreq = wPeakFreq;
                    decisionReason = 'Spectral peak (no harmonic relation)';
                } else {
                    // Harmonically related — compare raw spectral power
                    pwrMpm = getRawPower(mpmFreq);
                    pwrWpeak = getRawPower(wPeakFreq);

                    const thresholdMult = wPeakFreq > 1800 ? 0.8 : 0.05;

                    if (pwrMpm > pwrWpeak * thresholdMult) {
                        finalFreq = mpmFreq;
                        decisionReason = 'MPM (power dominant)';
                    } else {
                        finalFreq = wPeakFreq;
                        decisionReason = 'Spectral peak (MPM power weak)';
                    }
                }
            }
        }

        // Fallback if MPM totally failed
        if (finalFreq < 0 && wPeakFreq > 0) {
            finalFreq = wPeakFreq;
            decisionReason = 'Spectral peak (MPM failed, fallback)';
        }

        // Frequency range filter
        if (finalFreq > 0 && (finalFreq < TunerDefaults.MIN_FREQUENCY || finalFreq > TunerDefaults.MAX_FREQUENCY)) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        // Debug data
        if (this.debug) {
            // Build weighted magnitude for display (only within valid range)
            const weightedMag = new Float64Array(maxBin - minBin);
            for (let i = 0; i < weightedMag.length; i++) {
                const bin = minBin + i;
                weightedMag[i] = mag[bin] * bin * binHz;
            }

            this.debugData = {
                // McLeod stage
                nsdf: mcleod.debugData.nsdf,
                keyMaxima: mcleod.debugData.keyMaxima,
                mpmThreshold: mcleod.debugData.threshold,
                selectedTau: mcleod.debugData.selectedTau,
                interpolatedTau: mcleod.debugData.interpolatedTau,
                mpmClarity: mcleod.clarity,
                maxTau: mcleod.debugData.maxTau,
                // Spectral stage
                magnitude: new Float64Array(mag.subarray(minBin, maxBin)),
                weightedMagnitude: weightedMag,
                wPeakBin,
                wPeakFreq,
                // Decision
                mpmFreq,
                finalFreq,
                decisionReason,
                pwrMpm,
                pwrWpeak,
                // General
                sampleRate,
                fftSize,
                binHz,
                minBin,
                maxBin,
                rms
            };
        }

        return finalFreq;
    }
}
