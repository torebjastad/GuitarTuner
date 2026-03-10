/**
 * Autocorrelation Algorithm (Legacy)
 * Depends on: pitch-common.js (TunerDefaults, PitchDetector)
 */
class AutocorrelationDetector extends PitchDetector {
    constructor(rmsThreshold = 0.002, trimThreshold = 0.2) {
        super();
        this.rmsThreshold = rmsThreshold;
        this.trimThreshold = trimThreshold;
        this.debug = false;
        this.debugData = null;
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

        const c = new Array(maxLag).fill(0);

        for (let i = 0; i < maxLag; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + subBuffer[j] * subBuffer[j + i];
            }
        }

        // Find first dip (start from minLag to skip impossibly high frequencies)
        let d = minLag;
        while (d < maxLag - 1 && c[d] > c[d + 1]) d++;

        let maxval = -1, maxpos = -1;
        for (let i = d; i < maxLag; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }

        if (maxpos < 1 || maxpos >= maxLag - 1) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        let T0 = maxpos;
        const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        const a = (x1 + x3 - 2 * x2) / 2;
        const b = (x3 - x1) / 2;
        const interpolatedT0 = a ? T0 - b / (2 * a) : T0;
        const frequency = sampleRate / interpolatedT0;

        if (this.debug) {
            this.debugData = {
                autocorr: new Float64Array(c),
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
