/**
 * McLeod Pitch Method (MPM) Implementation
 * Based on "A Smarter Way to Find Pitch" by Philip McLeod & Geoff Wyvill (2005)
 * Depends on: pitch-common.js (TunerDefaults, PitchDetector)
 */
class McLeodDetector extends PitchDetector {
    constructor(cutoff = 0.93, smallCutoff = 0.5) {
        super();
        this.cutoff = cutoff;         // Relative threshold k for key maxima selection
        this.smallCutoff = smallCutoff; // Minimum clarity to accept a reading
        this.debug = false;
        this.debugData = null;
        // Pre-allocate NSDF buffer
        this.nsdfBuffer = new Float32Array(TunerDefaults.FFTSIZE);
    }

    getPitch(buffer, sampleRate) {
        const bufLen = buffer.length;
        const nsdf = this.nsdfBuffer;

        // Limit tau range: max tau = sampleRate / minFreq.
        // Beyond that we'd be detecting sub-bass below the tuner's range.
        // Also cap at bufLen/2 so the inner sum has enough samples for a meaningful result.
        const maxTau = Math.min(Math.floor(bufLen / 2), Math.ceil(sampleRate / TunerDefaults.MIN_FREQUENCY));

        // Step 1: Normalized Square Difference Function (NSDF)
        // NSDF(tau) = 2 * r(tau) / m(tau)
        // where r(tau) = sum(x[i]*x[i+tau]) and m(tau) = sum(x[i]^2 + x[i+tau]^2)
        for (let tau = 0; tau < maxTau; tau++) {
            let acf = 0;
            let div = 0;
            const limit = bufLen - tau;
            for (let i = 0; i < limit; i++) {
                acf += buffer[i] * buffer[i + tau];
                div += buffer[i] * buffer[i] + buffer[i + tau] * buffer[i + tau];
            }
            nsdf[tau] = div > 0 ? 2 * acf / div : 0;
        }

        // Step 2: Peak Picking — find key maxima
        // A key maximum is the highest NSDF value between a positive zero crossing
        // (going up) and a negative zero crossing (going down).
        const keyMaxima = [];
        let inPositiveRegion = false;
        let currentMaxTau = 0;
        let currentMaxVal = -Infinity;

        for (let tau = 1; tau < maxTau; tau++) {
            if (nsdf[tau] > 0 && nsdf[tau - 1] <= 0) {
                // Positive zero crossing (upward)
                inPositiveRegion = true;
                currentMaxTau = tau;
                currentMaxVal = nsdf[tau];
            } else if (nsdf[tau] <= 0 && nsdf[tau - 1] > 0) {
                // Negative zero crossing (downward) — end of positive region
                if (inPositiveRegion) {
                    keyMaxima.push({ tau: currentMaxTau, val: currentMaxVal });
                }
                inPositiveRegion = false;
            } else if (inPositiveRegion && nsdf[tau] > currentMaxVal) {
                currentMaxTau = tau;
                currentMaxVal = nsdf[tau];
            }
        }
        // Handle case where signal ends while still in a positive region
        if (inPositiveRegion) {
            keyMaxima.push({ tau: currentMaxTau, val: currentMaxVal });
        }

        if (keyMaxima.length === 0) {
            if (this.debug) this.debugData = null;
            return -1;
        }

        // Step 3: Relative threshold selection
        // Find the global maximum among key maxima, then select the first
        // key maximum whose value is >= cutoff * globalMax
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

        // Step 4: Parabolic interpolation around the selected peak
        const tau = selectedPeak.tau;
        let interpolatedTau = tau;
        if (tau > 0 && tau < maxTau - 1) {
            const s0 = nsdf[tau - 1];
            const s1 = nsdf[tau];
            const s2 = nsdf[tau + 1];
            const a = (s0 + s2 - 2 * s1) / 2;
            const b = (s2 - s0) / 2;
            if (a < 0) { // Must be a true maximum (concave down)
                const adjustment = -b / (2 * a);
                if (Math.abs(adjustment) < 1) interpolatedTau = tau + adjustment;
            }
        }

        // Step 5: Clarity gate
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
