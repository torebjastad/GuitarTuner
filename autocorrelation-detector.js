/**
 * Autocorrelation Algorithm (Legacy)
 * Depends on: pitch-common.js (TunerDefaults, PitchDetector)
 */
class AutocorrelationDetector extends PitchDetector {
    constructor() {
        super();
        this.debug = false;
        this.debugData = null;
    }

    getPitch(buffer, sampleRate) {
        let SIZE = buffer.length;
        let rms = 0;

        for (let i = 0; i < SIZE; i++) {
            const val = buffer[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);

        if (rms < 0.01) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        let r1 = 0, r2 = SIZE - 1;
        const thres = 0.2;
        for (let i = 0; i < SIZE / 2; i++) {
            if (Math.abs(buffer[i]) < thres) { r1 = i; break; }
        }
        for (let i = 1; i < SIZE / 2; i++) {
            if (Math.abs(buffer[SIZE - i]) < thres) { r2 = SIZE - i; break; }
        }

        const subBuffer = buffer.slice(r1, r2);
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
