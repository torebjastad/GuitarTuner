/**
 * Guitar Tuner Application
 * Logic adapted from audio-processor.js (Copyright 2015 Google Inc.)
 */

const TunerDefaults = {
    FFTSIZE: 2048,
    SmoothingWindow: 5
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

        // Step 4: Parabolic Interpolation
        if (tau > 1 && tau < yinBufferLength - 1) {
            const s0 = yinBuffer[tau - 1];
            const s1 = yinBuffer[tau];
            const s2 = yinBuffer[tau + 1];
            // Peak position adjustment
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

        if (frequency === -1 || isNaN(frequency)) {
            return;
        }

        // Apply smoothing
        this.smoothingBuffer.push(frequency);
        if (this.smoothingBuffer.length > this.smoothingWindow) {
            this.smoothingBuffer.shift();
        }

        // Use average of buffer for smoother needle
        const smoothedFreq = this.smoothingBuffer.reduce((a, b) => a + b) / this.smoothingBuffer.length;

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

// Initialize
const tuner = new Tuner();
