/**
 * Guitar Tuner Application
 * Logic adapted from audio-processor.js (Copyright 2015 Google Inc.)
 */

const TunerDefaults = {
    FFTSIZE: 4096,       // Larger buffer for reliable low-frequency detection
    SmoothingWindow: 5,
    MIN_FREQUENCY: 75,   // Below low E2 (~82 Hz) with margin
    MAX_FREQUENCY: 1400  // Above high E6 (~1319 Hz) with margin
};

/**
 * Strategy Interface for Pitch Detection
 */
class PitchDetector {
    getPitch(buffer, sampleRate) {
        throw new Error("Method 'getPitch()' must be implemented.");
    }
}

/**
 * YIN Algorithm Implementation
 */
class YinDetector extends PitchDetector {
    constructor(threshold = 0.1) {
        super();
        this.threshold = threshold;
    }

    getPitch(float32AudioBuffer, sampleRate) {
        const bufferSize = float32AudioBuffer.length;
        const yinBufferLength = Math.floor(bufferSize / 2);
        const yinBuffer = new Float32Array(yinBufferLength);

        // Step 1: Difference Function
        // d(tau) = sum((x[i] - x[i+tau])^2)
        for (let tau = 0; tau < yinBufferLength; tau++) {
            yinBuffer[tau] = 0;
        }

        for (let tau = 1; tau < yinBufferLength; tau++) {
            for (let i = 0; i < yinBufferLength; i++) {
                const delta = float32AudioBuffer[i] - float32AudioBuffer[i + tau];
                yinBuffer[tau] += delta * delta;
            }
        }

        // Step 2: Cumulative Mean Normalized Difference Function
        // d'(tau) = d(tau) / (1/tau * sum(d(j)))
        yinBuffer[0] = 1;
        let runningSum = 0;
        for (let tau = 1; tau < yinBufferLength; tau++) {
            runningSum += yinBuffer[tau];
            yinBuffer[tau] *= tau / runningSum;
        }

        // Step 3: Absolute Threshold
        let tau = -1;
        for (let i = 1; i < yinBufferLength; i++) {
            if (yinBuffer[i] < this.threshold) {
                // Found a dip below threshold
                while (i + 1 < yinBufferLength && yinBuffer[i + 1] < yinBuffer[i]) {
                    i++;
                }
                tau = i;
                break;
            }
        }

        // If no pitch found below threshold, look for global minimum
        if (tau === -1) {
            let minVal = 100; // Arbitrary high
            for (let i = 1; i < yinBufferLength; i++) {
                if (yinBuffer[i] < minVal) {
                    minVal = yinBuffer[i];
                    tau = i;
                }
            }
        }

        // Step 4: Octave-error correction
        // Check if there's a valid dip at 2*tau (the true fundamental).
        // Guitar low strings often have a stronger 2nd harmonic than the
        // fundamental, causing YIN to lock onto the harmonic (half the
        // true period). If the CMND value at 2*tau is below a relaxed
        // threshold, the fundamental is present and we should prefer it.
        const doubleTau = Math.round(tau * 2);
        if (doubleTau > 0 && doubleTau < yinBufferLength - 1) {
            // Walk to the local minimum near doubleTau
            let bestTau = doubleTau;
            let bestVal = yinBuffer[doubleTau];
            const searchRadius = Math.max(4, Math.round(tau * 0.1));
            const lo = Math.max(1, doubleTau - searchRadius);
            const hi = Math.min(yinBufferLength - 2, doubleTau + searchRadius);
            for (let k = lo; k <= hi; k++) {
                if (yinBuffer[k] < bestVal) {
                    bestVal = yinBuffer[k];
                    bestTau = k;
                }
            }
            // Accept the sub-harmonic if its CMND dip is reasonable
            if (bestVal < 0.3) {
                tau = bestTau;
            }
        }

        // Step 5: Parabolic Interpolation
        if (tau > 1 && tau < yinBufferLength - 1) {
            const s0 = yinBuffer[tau - 1];
            const s1 = yinBuffer[tau];
            const s2 = yinBuffer[tau + 1];
            let adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
            tau += adjustment;
        }

        const probability = 1 - yinBuffer[Math.floor(tau)];

        // Noise gate
        if (probability < 0.6) return -1;

        return sampleRate / tau;
    }
}

/**
 * Autocorrelation Algorithm (Legacy)
 */
class AutocorrelationDetector extends PitchDetector {
    getPitch(buffer, sampleRate) {
        let SIZE = buffer.length;
        let rms = 0;

        for (let i = 0; i < SIZE; i++) {
            const val = buffer[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);

        if (rms < 0.01) return -1;

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
        const c = new Array(SIZE).fill(0);

        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + subBuffer[j] * subBuffer[j + i];
            }
        }

        let d = 0;
        while (c[d] > c[d + 1]) d++;

        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }

        let T0 = maxpos;
        const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        const a = (x1 + x3 - 2 * x2) / 2;
        const b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        return sampleRate / T0;
    }
}

class Tuner {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.mediaStreamSource = null;
        this.isPlaying = false;

        this.detectors = {
            yin: new YinDetector(),
            autocorr: new AutocorrelationDetector()
        };
        this.currentDetector = this.detectors.yin;

        // Configuration
        this.frequencyBuffer = new Float32Array(TunerDefaults.FFTSIZE);
        this.smoothingBuffer = [];
        this.smoothingWindow = TunerDefaults.SmoothingWindow;

        // Notes mapping
        this.noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        // UI Elements
        this.noteNameEl = document.getElementById('note-name');
        this.frequencyEl = document.getElementById('frequency');
        this.needleEl = document.getElementById('needle');
        this.statusEl = document.getElementById('tuning-status');
        this.startBtn = document.getElementById('start-btn');
        this.flatEl = document.getElementById('flat-indicator');
        this.sharpEl = document.getElementById('sharp-indicator');
        this.algoSelect = document.getElementById('algorithm-select');

        this.bindEvents();
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => {
            if (!this.isPlaying) {
                this.start();
                this.startBtn.textContent = 'Stop Tuner';
            } else {
                this.stop();
                this.startBtn.textContent = 'Start Tuner';
            }
        });

        this.algoSelect.addEventListener('change', (e) => {
            const algo = e.target.value;
            if (this.detectors[algo]) {
                this.currentDetector = this.detectors[algo];
                console.log(`Switched to ${algo}`);
            }
        });
    }

    async start() {
        if (!navigator.mediaDevices.getUserMedia) {
            alert('Your browser does not support audio input.');
            return;
        }

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            this.mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = TunerDefaults.FFTSIZE;

            this.mediaStreamSource.connect(this.analyser);

            this.isPlaying = true;
            this.statusEl.textContent = "Listening...";
            this.statusEl.style.color = "var(--text-primary)";
            this.update();
        } catch (err) {
            console.error('Error accessing microphone:', err);
            this.statusEl.textContent = "Error: " + err.message;
            this.statusEl.style.color = "var(--danger-color)";
        }
    }

    stop() {
        this.isPlaying = false;
        if (this.mediaStreamSource) {
            this.mediaStreamSource.mediaStream.getAudioTracks().forEach(track => track.stop());
            this.mediaStreamSource = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        // Reset UI
        this.updateUI(null);
        this.statusEl.textContent = "Stopped";
    }

    update() {
        if (!this.isPlaying) return;

        requestAnimationFrame(() => this.update());

        this.analyser.getFloatTimeDomainData(this.frequencyBuffer);

        // STRATEGY CALL
        const frequency = this.currentDetector.getPitch(this.frequencyBuffer, this.audioContext.sampleRate);

        if (frequency === -1 || isNaN(frequency) ||
            frequency < TunerDefaults.MIN_FREQUENCY ||
            frequency > TunerDefaults.MAX_FREQUENCY) {
            return;
        }

        // Octave-jump rejection: if the new reading is ~2x or ~0.5x
        // the current median, it's almost certainly an octave error
        if (this.smoothingBuffer.length >= 3) {
            const sorted = [...this.smoothingBuffer].sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];
            const ratio = frequency / median;
            // Reject readings that are roughly an octave away (1.8-2.2x or 0.45-0.55x)
            if ((ratio > 1.8 && ratio < 2.2) || (ratio > 0.45 && ratio < 0.55)) {
                return; // skip this reading
            }
        }

        // Apply smoothing
        this.smoothingBuffer.push(frequency);
        if (this.smoothingBuffer.length > this.smoothingWindow) {
            this.smoothingBuffer.shift();
        }

        // Use median of buffer for robust smoothing (resistant to outliers)
        const sorted = [...this.smoothingBuffer].sort((a, b) => a - b);
        const smoothedFreq = sorted[Math.floor(sorted.length / 2)];

        const note = this.getNote(smoothedFreq);
        this.updateUI(note);
    }

    getNote(frequency) {
        const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        const midi = Math.round(noteNum) + 69;
        const note = (midi % 12);
        const name = this.noteStrings[note];
        const octave = Math.floor(midi / 12) - 1;

        // Calculate cents off
        const desiredFreq = 440 * Math.pow(2, (midi - 69) / 12);
        const cents = 1200 * Math.log(frequency / desiredFreq) / Math.log(2);

        return { name, octave, frequency, cents, note };
    }

    updateUI(noteData) {
        if (!noteData) {
            this.noteNameEl.textContent = "-";
            this.noteNameEl.classList.remove('in-tune');
            this.frequencyEl.textContent = "0.00 Hz";
            this.needleEl.style.left = "50%";
            this.needleEl.style.background = "var(--needle-color)";
            this.flatEl.classList.remove('visible');
            this.sharpEl.classList.remove('visible');
            return;
        }

        this.noteNameEl.textContent = noteData.name;
        this.frequencyEl.textContent = noteData.frequency.toFixed(2) + " Hz";

        // Needle movement
        // Range: -50 cents to +50 cents
        // -50 cents -> 5%
        // +50 cents -> 95%
        const centsDisplay = Math.max(-50, Math.min(50, noteData.cents));
        // Map [-50, 50] to [5, 95]
        const percent = 50 + (centsDisplay / 50) * 45;
        this.needleEl.style.left = `${percent}%`;

        // Status & Indicators
        const isPerfect = Math.abs(noteData.cents) < 5; // 5 cents tolerance

        if (isPerfect) {
            this.statusEl.textContent = "Perfect Tune";
            this.statusEl.style.color = "var(--success-color)";
            this.noteNameEl.classList.add('in-tune');
            this.needleEl.style.background = "var(--success-color)";
            this.needleEl.style.boxShadow = "0 0 10px var(--success-color)";

            this.flatEl.classList.remove('visible');
            this.sharpEl.classList.remove('visible');
        } else {
            this.noteNameEl.classList.remove('in-tune');
            this.needleEl.style.background = "var(--needle-color)";
            this.needleEl.style.boxShadow = "0 0 10px var(--needle-color)";

            if (noteData.cents < 0) {
                this.statusEl.textContent = "Too Flat";
                this.statusEl.style.color = "var(--warning-color)";
                this.flatEl.classList.add('visible');
                this.sharpEl.classList.remove('visible');
            } else {
                this.statusEl.textContent = "Too Sharp";
                this.statusEl.style.color = "var(--warning-color)";
                this.flatEl.classList.remove('visible');
                this.sharpEl.classList.add('visible');
            }
        }
    }
}

/**
 * Realistic Guitar Test Tone Generator
 * Produces guitar-like tones with harmonics, pluck envelope, vibrato, and noise.
 */
class TestToneGenerator {
    constructor(tuner) {
        this.tuner = tuner;
        this.isPlaying = false;
        this.nodes = [];  // track all nodes for cleanup

        // Standard tuning frequencies
        this.strings = [
            { name: 'E2', freq: 82.41 },
            { name: 'A2', freq: 110.00 },
            { name: 'D3', freq: 146.83 },
            { name: 'G3', freq: 196.00 },
            { name: 'B3', freq: 246.94 },
            { name: 'E4', freq: 329.63 }
        ];

        // Harmonic amplitude profiles per string (relative to fundamental = 1.0)
        // Low strings have stronger upper harmonics relative to fundamental
        this.harmonicProfiles = {
            'E2': [1.0, 1.8, 1.4, 1.0, 0.7, 0.5, 0.3, 0.2],
            'A2': [1.0, 1.5, 1.2, 0.8, 0.5, 0.4, 0.2, 0.15],
            'D3': [1.0, 1.2, 0.9, 0.6, 0.4, 0.3, 0.15, 0.1],
            'G3': [1.0, 0.9, 0.7, 0.5, 0.3, 0.2, 0.1, 0.05],
            'B3': [1.0, 0.8, 0.5, 0.3, 0.2, 0.1, 0.05],
            'E4': [1.0, 0.6, 0.4, 0.2, 0.1, 0.05]
        };

        this.toneSelect = document.getElementById('test-tone-select');
        this.toneBtn = document.getElementById('test-tone-btn');
        if (this.toneBtn) this.bindEvents();
    }

    bindEvents() {
        this.toneBtn.addEventListener('click', () => {
            if (this.isPlaying) {
                this.stopTone();
            } else {
                this.playTone();
            }
        });
    }

    async playTone() {
        const selectedString = this.strings[this.toneSelect.selectedIndex];
        if (!selectedString) return;

        // Ensure audioContext exists
        if (!this.tuner.audioContext || this.tuner.audioContext.state === 'closed') {
            this.tuner.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.tuner.audioContext.state === 'suspended') {
            await this.tuner.audioContext.resume();
        }

        const ctx = this.tuner.audioContext;

        // Set up analyser if not connected
        if (!this.tuner.analyser) {
            this.tuner.analyser = ctx.createAnalyser();
            this.tuner.analyser.fftSize = TunerDefaults.FFTSIZE;
            this.tuner.frequencyBuffer = new Float32Array(TunerDefaults.FFTSIZE);
        }

        const now = ctx.currentTime;
        const fundamental = selectedString.freq;
        const harmonics = this.harmonicProfiles[selectedString.name]
            || this.harmonicProfiles['G3'];

        // Master gain for overall volume
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.3, now);
        masterGain.connect(this.tuner.analyser);
        // Also connect to speakers so the user can hear it
        masterGain.connect(ctx.destination);
        this.nodes.push(masterGain);

        // Create harmonic oscillators
        harmonics.forEach((amp, i) => {
            const harmNum = i + 1;
            const freq = fundamental * harmNum;
            if (freq > ctx.sampleRate / 2) return; // skip above Nyquist

            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            // Add slight vibrato (more on lower strings, subtle)
            const vibratoRate = 4.5 + Math.random() * 1.5;  // 4.5-6 Hz
            const vibratoDepth = fundamental < 150 ? 0.8 : 0.4; // cents-scale
            const vibratoLfo = ctx.createOscillator();
            const vibratoGain = ctx.createGain();
            vibratoLfo.frequency.setValueAtTime(vibratoRate, now);
            vibratoGain.gain.setValueAtTime(freq * vibratoDepth / 1200, now);
            vibratoLfo.connect(vibratoGain);
            vibratoGain.connect(osc.frequency);
            vibratoLfo.start(now);
            this.nodes.push(vibratoLfo, vibratoGain);

            // Per-harmonic gain with pluck envelope
            const harmGain = ctx.createGain();
            // Normalize amplitude
            harmGain.gain.setValueAtTime(0, now);
            // Attack: quick pluck (5ms)
            harmGain.gain.linearRampToValueAtTime(amp * 0.5, now + 0.005);
            // Decay: higher harmonics decay faster (realistic string behavior)
            const decayTime = 3.0 / (1 + harmNum * 0.4);
            harmGain.gain.exponentialRampToValueAtTime(
                amp * 0.01, now + decayTime
            );

            osc.connect(harmGain);
            harmGain.connect(masterGain);
            osc.start(now);
            osc.stop(now + decayTime + 0.1);
            this.nodes.push(osc, harmGain);
        });

        // Add a touch of noise (string/fret buzz character)
        const noiseLength = ctx.sampleRate * 0.5;
        const noiseBuffer = ctx.createBuffer(1, noiseLength, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseLength; i++) {
            noiseData[i] = (Math.random() * 2 - 1) * 0.02;
        }
        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        noiseSource.connect(noiseGain);
        noiseGain.connect(masterGain);
        noiseSource.start(now);
        this.nodes.push(noiseSource, noiseGain);

        // Start the tuner's update loop if not already running
        this.tuner.isPlaying = true;
        this.tuner.smoothingBuffer = [];
        this.tuner.statusEl.textContent = `Test: ${selectedString.name} (${selectedString.freq} Hz)`;
        this.tuner.statusEl.style.color = 'var(--accent-color)';
        this.tuner.update();

        this.isPlaying = true;
        this.toneBtn.textContent = 'Stop Tone';

        // Auto-stop after the longest decay
        this._autoStopTimer = setTimeout(() => this.stopTone(), 4000);
    }

    stopTone() {
        clearTimeout(this._autoStopTimer);
        this.nodes.forEach(node => {
            try { node.disconnect(); } catch (e) {}
            try { if (node.stop) node.stop(); } catch (e) {}
        });
        this.nodes = [];
        this.isPlaying = false;
        this.toneBtn.textContent = 'Play Tone';

        // Don't close the audio context — tuner might still be running
        if (!this.tuner.mediaStreamSource) {
            this.tuner.isPlaying = false;
            this.tuner.updateUI(null);
            this.tuner.statusEl.textContent = 'Stopped';
        }
    }
}

// Initialize
const tuner = new Tuner();
const testTones = new TestToneGenerator(tuner);
