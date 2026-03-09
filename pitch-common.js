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
}
