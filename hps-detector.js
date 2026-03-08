/**
 * Harmonic Product Spectrum (HPS) Pitch Detection
 * Frequency-domain method that identifies the fundamental by multiplying
 * downsampled copies of the magnitude spectrum. Harmonics align at the
 * fundamental, creating a dominant peak even when the fundamental is weak.
 *
 * Accuracy Strategy (two-stage):
 *   Stage 1 — HPS on a 32768-point FFT identifies WHICH peak is the fundamental
 *             (harmonic rejection). This doesn't need to be super precise.
 *   Stage 2 — DTFT (Discrete-Time Fourier Transform) evaluation at arbitrary
 *             sub-bin frequencies around the identified peak gives near-perfect
 *             frequency resolution (sub-0.01 Hz).
 *
 * The DTFT evaluates X(f) = Σ x[n]·w[n]·e^(-j·2π·f·n/fs) at any frequency f,
 * not just integer bin centers. Each evaluation costs O(N) where N=bufferSize,
 * but we only need 6 evaluations (two rounds of 3), so the total cost is tiny.
 *
 * Depends on: pitch-common.js (TunerDefaults, PitchDetector)
 */
class HpsDetector extends PitchDetector {
    constructor(numHarmonics = 5) {
        super();
        this.numHarmonics = numHarmonics;
        this.debug = false;
        this.debugData = null;

        // FFT size: 32768 for fine HPS harmonic alignment
        // At 48kHz → ~1.46 Hz per bin (for HPS peak identification only)
        this.fftSize = 32768;

        // Preallocate reusable buffers
        this._fftReal = new Float64Array(this.fftSize);
        this._fftImag = new Float64Array(this.fftSize);
        this._magnitude = new Float64Array(this.fftSize / 2);
        this._hps = new Float64Array(this.fftSize / 2);

        // Buffer for windowed input (used by DTFT refinement)
        this._windowedBuf = null;

        // Precomputed window (lazily initialized to match input size)
        this._window = null;
        this._windowSize = 0;
    }

    /**
     * Blackman-Harris 4-term window.
     * Main lobe is wider than Hanning but sidelobes are -92 dB (vs -43 dB),
     * giving much cleaner spectral peaks for precise interpolation.
     */
    _ensureWindow(size) {
        if (this._windowSize === size) return;
        this._window = new Float64Array(size);
        this._windowedBuf = new Float64Array(size);
        const N1 = size - 1;
        const a0 = 0.35875, a1 = 0.48829, a2 = 0.14128, a3 = 0.01168;
        for (let i = 0; i < size; i++) {
            const phi = 2 * Math.PI * i / N1;
            this._window[i] = a0 - a1 * Math.cos(phi) + a2 * Math.cos(2 * phi) - a3 * Math.cos(3 * phi);
        }
        this._windowSize = size;
    }

    /**
     * In-place radix-2 Cooley–Tukey FFT.
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
     * Compute multi-harmonic DTFT score at a candidate fundamental frequency.
     *
     *   S(f) = Σ_{k=1}^{numH} |DTFT(k·f)|²
     *
     * By evaluating DTFT at f, 2f, 3f simultaneously, this score is:
     * - Sharper:  the combined peak is narrower than any single harmonic peak
     * - Robust:   even if the fundamental is weak (E2 string), stronger upper
     *             harmonics dominate the sum and stabilise the peak location
     * - Natural:  frequency errors are measured relative to pitch (musical
     *             intervals), not in absolute Hz — achieving what log-frequency
     *             bins would provide
     *
     * Uses 3 harmonics for refinement (not 5) to reduce sensitivity to
     * guitar string inharmonicity (higher partials deviate more).
     *
     * O(numH · N) per evaluation. For numH=3, N=4096: ~49K FLOPs.
     */
    _multiHarmonicScore(f, sampleRate, numH) {
        const wb = this._windowedBuf;
        const n = this._windowSize;
        let totalPower = 0;

        for (let h = 1; h <= numH; h++) {
            const omega = 2 * Math.PI * h * f / sampleRate;
            const cosW = Math.cos(omega);
            const sinW = Math.sin(omega);
            let re = 0, im = 0;
            let cosN = 1, sinN = 0;

            for (let i = 0; i < n; i++) {
                const s = wb[i];
                re += s * cosN;
                im -= s * sinN;
                const newCos = cosN * cosW - sinN * sinW;
                sinN = sinN * cosW + cosN * sinW;
                cosN = newCos;
            }
            totalPower += re * re + im * im;
        }
        return totalPower;
    }

    /**
     * Least-squares parabolic fit to symmetric evaluation points.
     *
     * Given 2k+1 points at offsets {-k, -(k-1), ..., 0, ..., k-1, k} × step
     * with log-domain scores, fits y = a·x² + b·x + c via normal equations.
     * For symmetric x-values, S_1 = S_3 = 0, giving the clean closed-form:
     *   b = T_1 / S_2         (linear coefficient)
     *   a = (n·T_2 - S_2·T_0) / (n·S_4 - S_2²)   (quadratic coefficient)
     *   peak at x = -b/(2a)
     *
     * Returns the fractional offset (in units of step) of the parabola's peak,
     * or 0 if the fit fails (non-concave or degenerate).
     */
    _leastSquaresPeak(offsets, logScores) {
        const n = offsets.length;
        let S_2 = 0, S_4 = 0, T_0 = 0, T_1 = 0, T_2 = 0;

        for (let i = 0; i < n; i++) {
            const x = offsets[i], y = logScores[i];
            const x2 = x * x;
            S_2 += x2;
            S_4 += x2 * x2;
            T_0 += y;
            T_1 += x * y;
            T_2 += x2 * y;
        }

        const det = n * S_4 - S_2 * S_2;
        if (det === 0 || S_2 === 0) return 0;

        const a = (n * T_2 - S_2 * T_0) / det;
        const b = T_1 / S_2;

        // Must be concave (a < 0) for a valid maximum
        if (a >= 0) return 0;

        const peak = -b / (2 * a);

        // Sanity: peak should be within the evaluation range
        const maxOff = offsets[offsets.length - 1];
        if (Math.abs(peak) > maxOff + 0.5) return 0;

        return peak;
    }

    /**
     * Two-round multi-harmonic DTFT refinement.
     *
     * Round 1 — Coarse:  7 points at ±1.5 bins (step = 0.5 bin)
     *                    least-squares parabola → ~0.05 bin accuracy
     * Round 2 — Fine:    5 points at ±0.25 bins around R1 result (step = 0.125 bin)
     *                    least-squares parabola → ~0.005 bin accuracy
     *
     * At 32768 FFT / 48kHz:
     *   0.005 bin ≈ 0.007 Hz ≈ 0.1 cent at E2, 0.04 cent at E4
     *
     * Total cost: (7 + 5) × 3 harmonics × 4096 samples ≈ 150K FLOPs (~0.1 ms)
     */
    _dtftRefine(approxFreq, sampleRate) {
        const binHz = sampleRate / this.fftSize;
        const numH = 3; // harmonics for refinement

        // ── Round 1: Coarse — 7 points over ±1.5 bins ──
        const step1 = binHz * 0.5;
        const offsets1 = [-3, -2, -1, 0, 1, 2, 3];
        const logScores1 = new Array(7);
        for (let i = 0; i < 7; i++) {
            const f = approxFreq + offsets1[i] * step1;
            if (f <= 0) { logScores1[i] = -100; continue; }
            const score = this._multiHarmonicScore(f, sampleRate, numH);
            logScores1[i] = score > 0 ? Math.log(score) : -100;
        }
        const peak1 = this._leastSquaresPeak(offsets1, logScores1);
        const freq1 = approxFreq + peak1 * step1;

        // ── Round 2: Fine — 5 points over ±0.25 bins around Round 1 ──
        const step2 = binHz * 0.125;
        const offsets2 = [-2, -1, 0, 1, 2];
        const logScores2 = new Array(5);
        for (let i = 0; i < 5; i++) {
            const f = freq1 + offsets2[i] * step2;
            if (f <= 0) { logScores2[i] = -100; continue; }
            const score = this._multiHarmonicScore(f, sampleRate, numH);
            logScores2[i] = score > 0 ? Math.log(score) : -100;
        }
        const peak2 = this._leastSquaresPeak(offsets2, logScores2);
        const freq2 = freq1 + peak2 * step2;

        return { frequency: freq2 };
    }

    getPitch(buffer, sampleRate) {
        const bufLen = buffer.length;

        // RMS noise gate
        let rms = 0;
        for (let i = 0; i < bufLen; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / bufLen);
        if (rms < 0.01) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        // Prepare window & windowed buffer (shared between FFT and DTFT)
        this._ensureWindow(bufLen);
        for (let i = 0; i < bufLen; i++) {
            this._windowedBuf[i] = buffer[i] * this._window[i];
        }

        const N = this.fftSize;
        const re = this._fftReal;
        const im = this._fftImag;

        // Zero-pad windowed buffer into FFT input
        for (let i = 0; i < bufLen; i++) {
            re[i] = this._windowedBuf[i];
        }
        for (let i = bufLen; i < N; i++) {
            re[i] = 0;
        }
        im.fill(0);

        // ── Stage 1: FFT-based HPS for harmonic identification ──

        this._fft(re, im);

        // Magnitude spectrum (positive frequencies only)
        const halfN = N >> 1;
        const mag = this._magnitude;
        for (let i = 0; i < halfN; i++) {
            mag[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
        }

        // Frequency range → bin range
        const minBin = Math.max(1, Math.floor(TunerDefaults.MIN_FREQUENCY * N / sampleRate));
        const maxBin = Math.min(
            Math.floor(halfN / this.numHarmonics),
            Math.ceil(TunerDefaults.MAX_FREQUENCY * N / sampleRate)
        );

        // Harmonic Product Spectrum (log domain)
        const hps = this._hps;
        for (let i = 0; i < maxBin; i++) {
            hps[i] = mag[i] > 0 ? Math.log(mag[i]) : -100;
        }
        for (let h = 2; h <= this.numHarmonics; h++) {
            for (let i = minBin; i < maxBin; i++) {
                const idx = i * h;
                if (idx < halfN) {
                    hps[i] += mag[idx] > 0 ? Math.log(mag[idx]) : -100;
                }
            }
        }

        // Find HPS peak
        let peakBin = minBin;
        let peakVal = hps[minBin];
        for (let i = minBin + 1; i < maxBin; i++) {
            if (hps[i] > peakVal) {
                peakVal = hps[i];
                peakBin = i;
            }
        }

        // Octave-error check (sub-harmonic preference)
        const halfPeakBin = Math.round(peakBin / 2);
        if (halfPeakBin >= minBin) {
            let bestSubBin = halfPeakBin;
            let bestSubVal = hps[halfPeakBin];
            const searchRadius = Math.max(2, Math.round(halfPeakBin * 0.05));
            const lo = Math.max(minBin, halfPeakBin - searchRadius);
            const hi = Math.min(maxBin - 1, halfPeakBin + searchRadius);
            for (let k = lo; k <= hi; k++) {
                if (hps[k] > bestSubVal) {
                    bestSubVal = hps[k];
                    bestSubBin = k;
                }
            }
            if (peakVal - bestSubVal < 1.5) {
                peakBin = bestSubBin;
                peakVal = bestSubVal;
            }
        }

        // SNR gate: peak must be well above the noise floor
        const hpsValues = [];
        for (let i = minBin; i < maxBin; i++) {
            hpsValues.push(hps[i]);
        }
        hpsValues.sort((a, b) => a - b);
        const median = hpsValues[Math.floor(hpsValues.length / 2)];
        const snr = peakVal - median;

        if (snr < 4) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        // ── Stage 2: DTFT refinement for precise frequency estimation ──
        //
        // The HPS told us approximately WHERE the fundamental is (peakBin).
        // Now we find the *exact* spectral peak in the original magnitude
        // spectrum near that bin, then use DTFT evaluation at sub-bin
        // frequencies for near-perfect precision.

        // Find the true spectral peak in the original spectrum near the HPS bin
        let refBin = peakBin;
        let refVal = mag[peakBin];
        const refLo = Math.max(minBin, peakBin - 3);
        const refHi = Math.min(maxBin - 1, peakBin + 3);
        for (let k = refLo; k <= refHi; k++) {
            if (mag[k] > refVal) {
                refVal = mag[k];
                refBin = k;
            }
        }

        // Convert to frequency and refine via DTFT
        const binHz = sampleRate / N;
        const approxFreq = refBin * binHz;
        const refinement = this._dtftRefine(approxFreq, sampleRate);
        const frequency = refinement ? refinement.frequency : approxFreq;

        // Capture debug data
        if (this.debug) {
            const magDisplayMax = Math.min(halfN, maxBin * this.numHarmonics);

            // HPS-only frequency (for comparison in debug info)
            let hpsInterpolatedBin = peakBin;
            if (peakBin > minBin && peakBin < maxBin - 1) {
                const s0 = hps[peakBin - 1], s1 = hps[peakBin], s2 = hps[peakBin + 1];
                const d = s0 - 2 * s1 + s2;
                if (d < 0) {
                    const adj = (s0 - s2) / (2 * d);
                    if (Math.abs(adj) < 1) hpsInterpolatedBin = peakBin + adj;
                }
            }
            const hpsFreq = hpsInterpolatedBin * binHz;

            this.debugData = {
                magnitudeSpectrum: new Float64Array(mag.subarray(0, magDisplayMax)),
                hpsSpectrum: new Float64Array(hps.subarray(0, maxBin)),
                peakBin,
                interpolatedBin: frequency / binHz,
                peakVal,
                snr,
                rms,
                frequency,
                hpsOnlyFreq: hpsFreq,
                refBin,
                sampleRate,
                fftSize: N,
                minBin,
                maxBin,
                numHarmonics: this.numHarmonics
            };
        }

        return frequency;
    }
}
