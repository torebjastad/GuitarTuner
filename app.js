/**
 * Guitar Tuner Application — Entry Point
 * All classes are loaded via separate script tags in index.html.
 */

// Initialize
const tuner = new Tuner();
const testTones = new TestToneGenerator(tuner);
