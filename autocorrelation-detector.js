/**
 * Autocorrelation Algorithm (Legacy)
 *
 * Uses FFT-based autocorrelation O(N log N) instead of direct O(N²).
 * Depends on: pitch-common.js (TunerDefaults, PitchDetector, PitchFFT)
 */
class AutocorrelationDetector extends PitchDetector {
    constructor(rmsThreshold = 0.002, trimThreshold = 0.2) {
        super();
        this.rmsThreshold = rmsThreshold;
        this.trimThreshold = trimThreshold;
        this.debug = false;
        this.debugData = null;

        // Pre-allocate FFT buffers (resized lazily)
        this._fftSize = 0;
        this._fftRe = null;
        this._fftIm = null;
    }

    _ensureBuffers(size) {
        const nFft = PitchFFT.nextPow2(2 * size);
        if (this._fftSize !== nFft) {
            this._fftSize = nFft;
            this._fftRe = new Float64Array(nFft);
            this._fftIm = new Float64Array(nFft);
        }
    }

    getParams() {
        return [
            { key: 'rmsThreshold', label: 'RMS Noise Gate', min: 0.001, max: 0.1, step: 0.001, value: this.rmsThreshold, description: 'Minimum volume level (RMS) required to process the signal.' },
            { key: 'trimThreshold', label: 'Trim Threshold', min: 0.05, max: 0.5, step: 0.05, value: this.trimThreshold, description: 'Amplitude threshold for trimming quiet tails off the beginning and end of the buffer before autocorrelation.' }
        ];
    }

    getPitch(buffer, sampleRate) {
        let SIZE = buffer.length;
        let rms = 0;

        for (let i = 0; i < SIZE; i++) {
            const val = buffer[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);

        if (rms < this.rmsThreshold) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        // Normalize buffer to target RMS for amplitude-invariant processing
        const targetRms = 0.1;
        const gain = targetRms / rms;
        const normBuf = new Float32Array(SIZE);
        for (let i = 0; i < SIZE; i++) {
            normBuf[i] = buffer[i] * gain;
        }

        let r1 = 0, r2 = SIZE - 1;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(normBuf[i]) < this.trimThreshold) { r1 = i; break; }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(normBuf[SIZE - i]) < this.trimThreshold) { r2 = SIZE - i; break; }
        }

        const subBuffer = normBuf.slice(r1, r2);
        SIZE = subBuffer.length;

        // Restrict lag range based on frequency limits
        const maxLag = Math.min(SIZE, Math.ceil(sampleRate / TunerDefaults.MIN_FREQUENCY));
        const minLag = Math.max(1, Math.floor(sampleRate / TunerDefaults.MAX_FREQUENCY));

        // ── FFT-based autocorrelation: r(τ) = IFFT(|FFT(x)|²) ──
        this._ensureBuffers(SIZE);
        const nFft = this._fftSize;
        const re = this._fftRe;
        const im = this._fftIm;

        for (let i = 0; i < SIZE; i++) re[i] = subBuffer[i];
        for (let i = SIZE; i < nFft; i++) re[i] = 0;
        im.fill(0);

        PitchFFT.fft(re, im);

        // Power spectrum |X|²
        for (let i = 0; i < nFft; i++) {
            re[i] = re[i] * re[i] + im[i] * im[i];
            im[i] = 0;
        }

        PitchFFT.ifft(re, im);
        // re[lag] now holds the autocorrelation c[lag]

        // Find first dip (start from minLag to skip impossibly high frequencies)
        let d = minLag;
        while (d < maxLag - 1 && re[d] > re[d + 1]) d++;

        let maxval = -1, maxpos = -1;
        for (let i = d; i < maxLag; i++) {
            if (re[i] > maxval) {
                maxval = re[i];
                maxpos = i;
            }
        }

        if (maxpos < 1 || maxpos >= maxLag - 1) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        let T0 = maxpos;
        const x1 = re[T0 - 1], x2 = re[T0], x3 = re[T0 + 1];
        const a = (x1 + x3 - 2 * x2) / 2;
        const b = (x3 - x1) / 2;
        const interpolatedT0 = a ? T0 - b / (2 * a) : T0;
        const frequency = sampleRate / interpolatedT0;

        if (this.debug) {
            // Copy ACF for debug display
            const acfDebug = new Float64Array(maxLag);
            for (let i = 0; i < maxLag; i++) acfDebug[i] = re[i];
            this.debugData = {
                autocorr: acfDebug,
                r1,
                r2,
                trimmedSize: SIZE,
                firstDip: d,
                peakPos: maxpos,
                peakVal: maxval,
                interpolatedT0,
                rms,
                frequency,
                sampleRate
            };
        }

        return frequency;
    }
}
