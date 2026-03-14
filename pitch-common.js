/**
 * Guitar Tuner — Shared Constants & Base Class
 */

const TunerDefaults = {
    FFTSIZE: 4096,       // Larger buffer for reliable low-frequency detection
    SmoothingWindow: 20, // Number of recent readings for median smoothing
    MIN_FREQUENCY: 20,   // Below low E2 (~82 Hz) with margin
    MAX_FREQUENCY: 5000  // Above high E6 (~1319 Hz) with margin
};

/**
 * Shared FFT utilities for pitch detection algorithms.
 * All methods operate in-place on Float64Array buffers.
 */
const PitchFFT = {
    /** Smallest power of 2 >= n. */
    nextPow2(n) {
        let v = 1;
        while (v < n) v <<= 1;
        return v;
    },

    /**
     * In-place radix-2 Cooley-Tukey FFT.
     * re and im must be Float64Arrays of equal power-of-2 length.
     */
    fft(re, im) {
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
    },

    /**
     * In-place inverse FFT: IFFT(X) = conj(FFT(conj(X))) / N.
     */
    ifft(re, im) {
        const n = re.length;
        for (let i = 0; i < n; i++) im[i] = -im[i];
        PitchFFT.fft(re, im);
        const invN = 1 / n;
        for (let i = 0; i < n; i++) {
            re[i] *= invN;
            im[i] = -im[i] * invN;
        }
    }
};

/**
 * Strategy Interface for Pitch Detection
 */
class PitchDetector {
    getPitch(buffer, sampleRate) {
        throw new Error("Method 'getPitch()' must be implemented.");
    }

    /**
     * Returns an array of parameter definitions for generating UI controls.
     * Each definition should be { key: string, label: string, min: number, max: number, step: number, value: number }
     */
    getParams() {
        return [];
    }

    /**
     * Optionally override to request a larger or smaller sample buffer size from the Tuner.
     * By default returns TunerDefaults.FFTSIZE (4096).
     */
    getRequiredBufferSize() {
        return TunerDefaults.FFTSIZE;
    }

    /**
     * Updates an internal parameter. Override if reallocation/recalculation is needed.
     */
    setParam(key, value) {
        if (this[key] !== undefined) {
            this[key] = value;
        }
    }
}
