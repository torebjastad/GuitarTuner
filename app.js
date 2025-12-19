/**
 * Guitar Tuner Application
 * Logic adapted from audio-processor.js (Copyright 2015 Google Inc.)
 */

class Tuner {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.mediaStreamSource = null;
        this.isPlaying = false;

        // Configuration
        this.FFTSIZE = 2048;
        // Guitar strings frequencies (Hz) for reference/optimization if needed,
        // but we'll use the generic note detection as well.
        // E2: 82.41, A2: 110, D3: 146.83, G3: 196, B3: 246.94, E4: 329.63

        this.frequencyBuffer = new Float32Array(this.FFTSIZE);

        // Notes mapping
        this.noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

        // UI Elements
        this.noteNameEl = document.getElementById('note-name');
        this.frequencyEl = document.getElementById('frequency');
        this.needleEl = document.getElementById('needle');
        this.statusEl = document.getElementById('tuning-status');
        this.startBtn = document.getElementById('start-btn');

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
            this.analyser.fftSize = this.FFTSIZE;

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
        this.noteNameEl.textContent = "-";
        this.noteNameEl.classList.remove('in-tune');
        this.frequencyEl.textContent = "0.00 Hz";
        this.needleEl.style.transform = `translateX(-50%)`;
        this.statusEl.textContent = "Stopped";
    }

    update() {
        if (!this.isPlaying) return;

        requestAnimationFrame(() => this.update());

        this.analyser.getFloatTimeDomainData(this.frequencyBuffer);

        const frequency = this.autoCorrelate(this.frequencyBuffer, this.audioContext.sampleRate);

        if (frequency === -1) {
            // No signal / too quiet
            return;
        }

        const note = this.getNote(frequency);
        this.updateUI(note);
    }

    /**
     * Autocorrelation algorithm to detect pitch
     * Based on Chris Wilson's pitch detection code
     */
    autoCorrelate(buffer, sampleRate) {
        let SIZE = buffer.length;
        let rms = 0;

        // Calculate Root Mean Square (volume)
        for (let i = 0; i < SIZE; i++) {
            const val = buffer[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);

        // Threshold to ignore noise
        if (rms < 0.01) return -1;

        // Trim buffer to meaningful range
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

        // Autocorrelation
        for (let i = 0; i < SIZE; i++) {
            for (let j = 0; j < SIZE - i; j++) {
                c[i] = c[i] + subBuffer[j] * subBuffer[j + i];
            }
        }

        let d = 0;
        // Skip the first peak (which is at index 0)
        while (c[d] > c[d + 1]) d++;

        let maxval = -1, maxpos = -1;
        for (let i = d; i < SIZE; i++) {
            if (c[i] > maxval) {
                maxval = c[i];
                maxpos = i;
            }
        }

        let T0 = maxpos;

        // Parabolic interpolation for better precision
        const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
        const a = (x1 + x3 - 2 * x2) / 2;
        const b = (x3 - x1) / 2;
        if (a) T0 = T0 - b / (2 * a);

        return sampleRate / T0;
    }

    getNote(frequency) {
        const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
        const midi = Math.round(noteNum) + 69;
        const note = (midi % 12);
        const name = this.noteStrings[note];
        const octave = Math.floor(midi / 12) - 1;

        // Calculate cents off
        // Frequency of the closest note
        const desiredFreq = 440 * Math.pow(2, (midi - 69) / 12);
        const cents = Math.floor(1200 * Math.log(frequency / desiredFreq) / Math.log(2));

        return { name, octave, frequency, cents, note };
    }

    updateUI(noteData) {
        this.noteNameEl.textContent = noteData.name;
        this.frequencyEl.textContent = noteData.frequency.toFixed(2) + " Hz";

        // Needle movement
        // Limit cents to +/- 50 for display
        let centsDisplay = Math.max(-50, Math.min(50, noteData.cents));
        // Map -50..50 to -45deg..45deg or percentage translation
        // Using translation: 0% is center, -50% is left, 50% is right relative to container center?
        // Actually CSS: translateX(-50%) is center because of logic. 
        // We want to offset from that center.
        // Let's use left property or transform.
        // CSS: left: 50% + (cents * scale)
        const range = 45; // percentage width to cover
        const percent = (centsDisplay / 50) * range;

        this.needleEl.style.transform = `translateX(calc(-50% + ${percent}%))`;

        // Status styling
        if (Math.abs(noteData.cents) < 5) {
            this.statusEl.textContent = "Perfect Tune";
            this.statusEl.style.color = "var(--success-color)";
            this.noteNameEl.classList.add('in-tune');
            this.needleEl.style.background = "var(--success-color)";
            this.needleEl.style.boxShadow = "0 0 10px var(--success-color)";
        } else {
            this.noteNameEl.classList.remove('in-tune');
            this.needleEl.style.background = "var(--needle-color)";
            this.needleEl.style.boxShadow = "0 0 10px var(--needle-color)";
            if (noteData.cents < 0) {
                this.statusEl.textContent = "Too Flat";
                this.statusEl.style.color = "var(--warning-color)";
            } else {
                this.statusEl.textContent = "Too Sharp";
                this.statusEl.style.color = "var(--warning-color)";
            }
        }
    }
}

// Initialize
const tuner = new Tuner();
