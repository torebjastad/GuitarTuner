/**
 * McLeod Pitch Method (MPM) Implementation
 * Based on "A Smarter Way to Find Pitch" by Philip McLeod & Geoff Wyvill (2005)
 *
 * Uses FFT-based autocorrelation O(N log N) instead of direct O(N²) NSDF.
 * Depends on: pitch-common.js (TunerDefaults, PitchDetector, PitchFFT)
 */
class McLeodDetector extends PitchDetector {
    constructor(cutoff = 0.93, smallCutoff = 0.5) {
        super();
        this.cutoff = cutoff;         // Relative threshold k for key maxima selection
        this.smallCutoff = smallCutoff; // Minimum clarity to accept a reading
        this.debug = false;
        this.debugData = null;

        // Pre-allocate buffers (resized lazily in _ensureBuffers)
        this._fftSize = 0;
        this._fftRe = null;
        this._fftIm = null;
        this._nsdf = new Float64Array(TunerDefaults.FFTSIZE);
        this._cumSq = new Float64Array(TunerDefaults.FFTSIZE);
    }

    _ensureBuffers(bufLen) {
        const nFft = PitchFFT.nextPow2(2 * bufLen);
        if (this._fftSize !== nFft) {
            this._fftSize = nFft;
            this._fftRe = new Float64Array(nFft);
            this._fftIm = new Float64Array(nFft);
        }
        if (this._nsdf.length < bufLen) {
            this._nsdf = new Float64Array(bufLen);
        }
        if (this._cumSq.length < bufLen) {
            this._cumSq = new Float64Array(bufLen);
        }
    }

    getParams() {
        return [
            { key: 'cutoff', label: 'Relative Threshold', min: 0.5, max: 0.99, step: 0.01, value: this.cutoff, description: 'Multiplier for the highest NSDF peak. Higher values strictly reject harmonics, but might miss weak fundamentals. Default 0.93.' },
            { key: 'smallCutoff', label: 'Clarity Gate', min: 0.1, max: 0.9, step: 0.05, value: this.smallCutoff, description: 'Absolute minimum NSDF value (clarity) required. Below this, the signal is considered noise and rejected.' }
        ];
    }

    getPitch(buffer, sampleRate) {
        const bufLen = buffer.length;
        this._ensureBuffers(bufLen);

        const nsdf = this._nsdf;
        const maxTau = Math.min(Math.floor(bufLen / 2), Math.ceil(sampleRate / TunerDefaults.MIN_FREQUENCY));

        // ── FFT-based autocorrelation: r(τ) = IFFT(|FFT(x)|²) ──
        const nFft = this._fftSize;
        const re = this._fftRe;
        const im = this._fftIm;

        for (let i = 0; i < bufLen; i++) re[i] = buffer[i];
        for (let i = bufLen; i < nFft; i++) re[i] = 0;
        im.fill(0);

        PitchFFT.fft(re, im);

        // Power spectrum |X|²
        for (let i = 0; i < nFft; i++) {
            re[i] = re[i] * re[i] + im[i] * im[i];
            im[i] = 0;
        }

        PitchFFT.ifft(re, im);
        // re[τ] now holds the autocorrelation r(τ)

        // ── NSDF normalization via cumulative sums ──
        // m(τ) = Σ x[i]² (i=τ..N-1) + Σ x[i]² (i=0..N-τ-1)
        const cumSq = this._cumSq;
        cumSq[0] = buffer[0] * buffer[0];
        for (let i = 1; i < bufLen; i++) {
            cumSq[i] = cumSq[i - 1] + buffer[i] * buffer[i];
        }
        const sumSq = cumSq[bufLen - 1];

        nsdf[0] = sumSq > 0 ? 1 : 0; // nsdf[0] = 2*r(0) / (2*sumSq) = 1
        for (let tau = 1; tau < maxTau; tau++) {
            const mTau = (sumSq - cumSq[tau - 1]) + cumSq[bufLen - tau - 1];
            nsdf[tau] = mTau > 0 ? (2 * re[tau] / mTau) : 0;
        }

        // ── Peak Picking — find key maxima ──
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

        if (keyMaxima.length === 0) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        // ── Relative threshold selection ──
        let nmax = -Infinity;
        for (let i = 0; i < keyMaxima.length; i++) {
            if (keyMaxima[i].val > nmax) nmax = keyMaxima[i].val;
        }
        const threshold = this.cutoff * nmax;

        let selectedPeak = null;
        for (let i = 0; i < keyMaxima.length; i++) {
            if (keyMaxima[i].val >= threshold) {
                selectedPeak = keyMaxima[i];
                break;
            }
        }

        if (!selectedPeak) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        // ── Parabolic interpolation ──
        const tau = selectedPeak.tau;
        let interpolatedTau = tau;
        if (tau > 0 && tau < maxTau - 1) {
            const s0 = nsdf[tau - 1];
            const s1 = nsdf[tau];
            const s2 = nsdf[tau + 1];
            const a = (s0 + s2 - 2 * s1) / 2;
            const b = (s2 - s0) / 2;
            if (a < 0) {
                const adjustment = -b / (2 * a);
                if (Math.abs(adjustment) < 1) interpolatedTau = tau + adjustment;
            }
        }

        // Clarity gate
        const clarity = selectedPeak.val;
        const frequency = sampleRate / interpolatedTau;

        if (this.debug) {
            this.debugData = {
                nsdf: new Float32Array(nsdf.subarray(0, maxTau)),
                keyMaxima,
                nmax,
                threshold,
                selectedTau: tau,
                interpolatedTau,
                clarity,
                frequency: clarity >= this.smallCutoff ? frequency : -1,
                sampleRate,
                bufferLength: maxTau
            };
        }

        if (clarity < this.smallCutoff) return -1;

        return frequency;
    }
}
