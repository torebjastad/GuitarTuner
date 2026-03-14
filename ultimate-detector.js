/**
 * Ultimate Hybrid Pitch Detector
 *
 * Two-stage algorithm combining McLeod Pitch Method (time-domain) with a
 * frequency-weighted spectral peak (frequency-domain) and a decision engine
 * that intelligently selects the best result using harmonic verification.
 *
 * Ported from PianoTunerPython/ultimate_detector.py
 *
 * Stage 1 — McLeod MPM via FFT-based autocorrelation (O(N log N)) and NSDF
 * Stage 2 — High-resolution FFT (65536-point) with +6 dB/octave highpass
 *           weighting to suppress mechanical/structural noise
 * Stage 3 — Decision engine comparing both candidates via harmonic ratio
 *           analysis, spectral power comparison, and harmonic verification
 *
 * Depends on: pitch-common.js (TunerDefaults, PitchDetector)
 */
class UltimateDetector extends PitchDetector {
    constructor(cutoff = 0.93, smallCutoff = 0.40) {
        super();
        this.cutoff = cutoff;
        this.smallCutoff = smallCutoff;
        this.decisionFreq = 1000;
        this.debug = false;
        this.debugData = null;

        // Spectral FFT size — 65536 gives ~0.73 Hz resolution at 48 kHz
        this.spectralFftSize = 65536;

        // Pre-allocate spectral FFT buffers
        this._fftReal = new Float64Array(this.spectralFftSize);
        this._fftImag = new Float64Array(this.spectralFftSize);
        this._magnitude = new Float64Array(this.spectralFftSize / 2 + 1);

        // Pre-allocate McLeod FFT-based autocorrelation buffers
        // For N=8192 input, acfFftSize = nextPow2(2*8192) = 16384
        this._acfFftSize = 0;
        this._acfReal = null;
        this._acfImag = null;

        // Pre-allocate NSDF normalization buffers
        this._nsdf = new Float64Array(8192);
        this._cumSq = new Float64Array(8192);

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
     * Ensure autocorrelation FFT buffers are allocated for the given input size.
     */
    _ensureAcfBuffers(bufLen) {
        const nFft = PitchFFT.nextPow2(2 * bufLen);
        if (this._acfFftSize === nFft) return;
        this._acfFftSize = nFft;
        this._acfReal = new Float64Array(nFft);
        this._acfImag = new Float64Array(nFft);
    }

    /**
     * Find spectral peaks in the magnitude spectrum with parabolic interpolation.
     * Returns array of { freq, power } sorted by frequency.
     */
    _findSpectralPeaks(mag, binHz, minFreq, maxFreq, prominenceRatio) {
        const minBin = Math.max(2, Math.floor(minFreq / binHz));
        const maxBin = Math.min(mag.length - 2, Math.floor(maxFreq / binHz));
        const peaks = [];

        // Find max in region for threshold
        let regionMax = 0;
        for (let i = minBin; i < maxBin; i++) {
            if (mag[i] > regionMax) regionMax = mag[i];
        }
        const threshold = regionMax * prominenceRatio;

        for (let i = minBin + 1; i < maxBin - 1; i++) {
            if (mag[i] > mag[i - 1] && mag[i] > mag[i + 1] && mag[i] > threshold) {
                // Parabolic interpolation
                const a = mag[i - 1], b = mag[i], c = mag[i + 1];
                const d = a - 2 * b + c;
                const adj = d !== 0 ? 0.5 * (a - c) / d : 0;
                peaks.push({ freq: (i + adj) * binHz, power: b });
            }
        }

        peaks.sort((a, b) => a.freq - b.freq);
        return peaks;
    }

    /**
     * Count how many spectral peaks fall near integer multiples of f0Candidate.
     * Uses a tolerance that grows with harmonic number for piano inharmonicity.
     * Returns { hits, totalPower }.
     */
    _countHarmonicHits(peaks, f0Candidate, baseTolerance) {
        if (f0Candidate <= 0 || peaks.length === 0) return { hits: 0, totalPower: 0 };

        let hits = 0;
        let totalPower = 0;

        for (let p = 0; p < peaks.length; p++) {
            const ratio = peaks[p].freq / f0Candidate;
            const nearestN = Math.round(ratio);
            if (nearestN < 1) continue;
            const tol = baseTolerance + 0.005 * nearestN;
            if (Math.abs(ratio - nearestN) < tol) {
                hits++;
                totalPower += peaks[p].power;
            }
        }

        return { hits, totalPower };
    }

    /**
     * McLeod Pitch Method (time-domain) with FFT-based autocorrelation.
     *
     * Uses the convolution theorem for O(N log N) autocorrelation:
     *   r[τ] = IFFT(|FFT(x)|²)
     *
     * This replaces the O(N²) direct loop, giving ~3x speedup at N=8192
     * and ~32x at N=65536.
     *
     * Returns { freq, clarity, debugData }.
     */
    _runMcleod(buffer, sampleRate) {
        const bufLen = buffer.length;
        const maxTau = Math.min(bufLen >> 1, Math.ceil(sampleRate / 20));

        // Ensure pre-allocated buffers are large enough
        if (this._nsdf.length < maxTau) {
            this._nsdf = new Float64Array(maxTau);
        }
        if (this._cumSq.length < bufLen) {
            this._cumSq = new Float64Array(bufLen);
        }

        const nsdf = this._nsdf;

        // ── FFT-based autocorrelation: O(N log N) ──
        this._ensureAcfBuffers(bufLen);
        const nFft = this._acfFftSize;
        const acfRe = this._acfReal;
        const acfIm = this._acfImag;

        // Zero-pad buffer into FFT input
        for (let i = 0; i < bufLen; i++) acfRe[i] = buffer[i];
        for (let i = bufLen; i < nFft; i++) acfRe[i] = 0;
        acfIm.fill(0);

        // Forward FFT
        PitchFFT.fft(acfRe, acfIm);

        // Power spectrum: |X|² (real-only result for autocorrelation)
        for (let i = 0; i < nFft; i++) {
            acfRe[i] = acfRe[i] * acfRe[i] + acfIm[i] * acfIm[i];
            acfIm[i] = 0;
        }

        // Inverse FFT → autocorrelation
        PitchFFT.ifft(acfRe, acfIm);
        // acfRe[tau] now contains the autocorrelation r(tau)

        // ── Vectorized NSDF normalization via cumulative sums ──
        const cumSq = this._cumSq;
        let sumSq = 0;
        cumSq[0] = buffer[0] * buffer[0];
        for (let i = 1; i < bufLen; i++) {
            cumSq[i] = cumSq[i - 1] + buffer[i] * buffer[i];
        }
        sumSq = cumSq[bufLen - 1];

        // m[0] = 2 * sumSq
        // m[tau] = (sumSq - cumSq[tau-1]) + cumSq[N-tau-1]
        // nsdf[tau] = 2 * acf[tau] / m[tau]
        const m0 = 2 * sumSq;
        nsdf[0] = m0 > 0 ? (2 * acfRe[0] / m0) : 0;

        for (let tau = 1; tau < maxTau; tau++) {
            const mTau = (sumSq - cumSq[tau - 1]) + cumSq[bufLen - tau - 1];
            nsdf[tau] = mTau > 0 ? (2 * acfRe[tau] / mTau) : 0;
        }

        // ── Key maxima extraction ──
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

        // RMS for debug display only (no gating — matches Python)
        let rms = 0;
        if (this.debug) {
            let rmsSum = 0;
            for (let i = 0; i < bufLen; i++) rmsSum += buffer[i] * buffer[i];
            rms = Math.sqrt(rmsSum / bufLen);
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

        PitchFFT.fft(re, im);

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
        let harmonicPeaks = null;

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

            if (closestInt <= 8) {
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
            } else {
                // Ratio > 8: Run harmonic verification — count spectral peaks
                // that align with integer multiples of each candidate.
                harmonicPeaks = this._findSpectralPeaks(mag, binHz, 25, 10000, 0.1);

                const mpmResult = this._countHarmonicHits(harmonicPeaks, mpmFreq, 0.04);
                const wpeakResult = this._countHarmonicHits(harmonicPeaks, wPeakFreq, 0.04);

                const powerFactor = mpmResult.totalPower / Math.max(wpeakResult.totalPower, 1e-10);

                // Adaptive threshold: relax when MPM has overwhelmingly more hits (≥4x)
                const pfThreshold = mpmResult.hits >= 4 * Math.max(wpeakResult.hits, 1) ? 6 : 8;

                if (mpmResult.hits >= 3 && mpmResult.hits > wpeakResult.hits && powerFactor > pfThreshold) {
                    finalFreq = mpmFreq;
                    decisionReason = `MPM (harmonic verified: ${mpmResult.hits} hits, pf=${powerFactor.toFixed(0)}, thr=${pfThreshold})`;
                } else if (mpmResult.hits >= 3 && mpmResult.hits === wpeakResult.hits && powerFactor > pfThreshold) {
                    finalFreq = mpmFreq;
                    decisionReason = `MPM (tied hits, power dominant: pf=${powerFactor.toFixed(0)})`;
                } else {
                    finalFreq = wPeakFreq;
                    decisionReason = `Spectral peak (MPM unconfirmed: ${mpmResult.hits} hits, pf=${powerFactor.toFixed(1)})`;
                }
            }
        }

        // Fallback if MPM totally failed
        if (finalFreq < 0 && wPeakFreq > 0) {
            finalFreq = wPeakFreq;
            decisionReason = 'Spectral peak (MPM failed, fallback)';
        }

        // Frequency range filter (lower bound only — no upper limit for piano range)
        if (finalFreq > 0 && finalFreq < TunerDefaults.MIN_FREQUENCY) {
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
                harmonicPeaks,
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
