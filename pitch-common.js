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
     * Updates an internal parameter. Override if reallocation/recalculation is needed.
     */
    setParam(key, value) {
        if (this[key] !== undefined) {
            this[key] = value;
        }
    }
}
