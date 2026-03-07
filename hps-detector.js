/**
 * Harmonic Product Spectrum (HPS) Pitch Detection
 * Frequency-domain method that identifies the fundamental by multiplying
 * downsampled copies of the magnitude spectrum. Harmonics align at the
 * fundamental, creating a dominant peak even when the fundamental is weak.
 *
 * Depends on: pitch-common.js (TunerDefaults, PitchDetector)
 */
class HpsDetector extends PitchDetector {
    constructor(numHarmonics = 5) {
        super();
        this.numHarmonics = numHarmonics;
        this.debug = false;
        this.debugData = null;

        // FFT size: zero-pad input for better frequency resolution
        // 16384 at 48kHz → ~2.93 Hz per bin; with interpolation → ~0.3 Hz effective
        this.fftSize = 16384;

        // Preallocate reusable buffers
        this._fftReal = new Float64Array(this.fftSize);
        this._fftImag = new Float64Array(this.fftSize);
        this._magnitude = new Float64Array(this.fftSize / 2);
        this._hps = new Float64Array(this.fftSize / 2);

        // Precomputed window (lazily initialized to match input size)
        this._window = null;
        this._windowSize = 0;
    }

    /**
     * Ensure the Hanning window matches the current input buffer size.
     */
    _ensureWindow(size) {
        if (this._windowSize === size) return;
        this._window = new Float64Array(size);
        const factor = 2 * Math.PI / (size - 1);
        for (let i = 0; i < size; i++) {
            this._window[i] = 0.5 * (1 - Math.cos(factor * i));
        }
        this._windowSize = size;
    }

    /**
     * In-place radix-2 Cooley–Tukey FFT.
     * Operates on interleaved real/imaginary Float64Arrays of length N (power of 2).
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

    getPitch(buffer, sampleRate) {
        const bufLen = buffer.length;

        // RMS noise gate (same as Autocorrelation)
        let rms = 0;
        for (let i = 0; i < bufLen; i++) {
            rms += buffer[i] * buffer[i];
        }
        rms = Math.sqrt(rms / bufLen);
        if (rms < 0.01) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        // Prepare window
        this._ensureWindow(bufLen);

        const N = this.fftSize;
        const re = this._fftReal;
        const im = this._fftImag;

        // Apply Hanning window + zero-pad
        for (let i = 0; i < bufLen; i++) {
            re[i] = buffer[i] * this._window[i];
        }
        for (let i = bufLen; i < N; i++) {
            re[i] = 0;
        }
        im.fill(0);

        // FFT
        this._fft(re, im);

        // Magnitude spectrum (first half only — second half is conjugate mirror)
        const halfN = N >> 1;
        const mag = this._magnitude;
        for (let i = 0; i < halfN; i++) {
            mag[i] = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
        }

        // Frequency range → bin range
        const minBin = Math.max(1, Math.floor(TunerDefaults.MIN_FREQUENCY * N / sampleRate));
        // maxBin for HPS: the highest harmonic of maxBin must fit within halfN
        const maxBin = Math.min(
            Math.floor(halfN / this.numHarmonics),
            Math.ceil(TunerDefaults.MAX_FREQUENCY * N / sampleRate)
        );

        // Harmonic Product Spectrum (log domain to avoid overflow)
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

        // Find peak in valid range
        let peakBin = minBin;
        let peakVal = hps[minBin];
        for (let i = minBin + 1; i < maxBin; i++) {
            if (hps[i] > peakVal) {
                peakVal = hps[i];
                peakBin = i;
            }
        }

        // Octave-error check: HPS can sometimes pick the octave above.
        // In log domain, we compare with an additive threshold (not multiplicative).
        // If the bin at peakBin/2 has an HPS value close to the peak, prefer it
        // (lower frequency = more likely to be the true fundamental).
        const halfPeakBin = Math.round(peakBin / 2);
        if (halfPeakBin >= minBin) {
            // Search a small neighborhood around peakBin/2 for the best candidate
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
            // In log domain: accept if the sub-harmonic peak is within 1.5 of the main peak
            // (exp(1.5) ≈ 4.5×, meaning the sub-harmonic is at least ~22% of the main peak's power)
            if (peakVal - bestSubVal < 1.5) {
                peakBin = bestSubBin;
                peakVal = bestSubVal;
            }
        }

        // Parabolic interpolation for sub-bin accuracy
        let interpolatedBin = peakBin;
        if (peakBin > minBin && peakBin < maxBin - 1) {
            const s0 = hps[peakBin - 1];
            const s1 = hps[peakBin];
            const s2 = hps[peakBin + 1];
            const denom = 2 * s1 - s0 - s2;
            if (denom > 0) {
                const adjustment = (s0 - s2) / (2 * denom);
                if (Math.abs(adjustment) < 1) {
                    interpolatedBin = peakBin + adjustment;
                }
            }
        }

        // Convert bin to frequency
        const frequency = interpolatedBin * sampleRate / N;

        // SNR gate: peak must be well above the noise floor in the HPS
        // Compute median HPS value in the search range as noise estimate
        const hpsValues = [];
        for (let i = minBin; i < maxBin; i++) {
            hpsValues.push(hps[i]);
        }
        hpsValues.sort((a, b) => a - b);
        const median = hpsValues[Math.floor(hpsValues.length / 2)];
        const snr = peakVal - median; // log-domain difference = ratio

        // Capture debug data
        if (this.debug) {
            // For the debug plot: copy magnitude spectrum up to a useful range
            const magDisplayMax = Math.min(halfN, maxBin * this.numHarmonics);
            this.debugData = {
                magnitudeSpectrum: new Float64Array(mag.subarray(0, magDisplayMax)),
                hpsSpectrum: new Float64Array(hps.subarray(0, maxBin)),
                peakBin,
                interpolatedBin,
                peakVal,
                snr,
                rms,
                frequency: snr >= 4 ? frequency : -1,
                sampleRate,
                fftSize: N,
                minBin,
                maxBin,
                numHarmonics: this.numHarmonics
            };
        }

        // Reject if SNR too low (exp(4) ≈ 55× above noise floor)
        if (snr < 4) return -1;

        return frequency;
    }
}
