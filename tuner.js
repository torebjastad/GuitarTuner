/**
 * Tuner — Main orchestrator class
 * Depends on: pitch-common.js, yin-detector.js, mcleod-detector.js,
 *             autocorrelation-detector.js, hps-detector.js, music-detector.js, debug-plot.js
 */
class Tuner {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.mediaStreamSource = null;
        this.isPlaying = false;

        this.detectors = {
            yin: new YinDetector(),
            mcleod: new McLeodDetector(),
            autocorr: new AutocorrelationDetector(),
            hps: new HpsDetector(),
            music: new MusicDetector()
        };
        this.currentDetector = this.detectors.mcleod;

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
        this.debugToggle = document.getElementById('debug-toggle');
        this.debugPlot = new DebugPlot('debug-canvas');
        this.smoothingSlider = document.getElementById('smoothing-slider');
        this.smoothingVal = document.getElementById('smoothing-val');

        if (this.smoothingSlider && this.smoothingVal) {
            this.smoothingSlider.value = this.smoothingWindow;
        }

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

        if (this.debugToggle) {
            this.debugToggle.addEventListener('change', (e) => {
                const on = e.target.checked;
                this.debugPlot.toggle(on);
                // Enable debug on all detectors
                this.detectors.yin.debug = on;
                this.detectors.mcleod.debug = on;
                this.detectors.autocorr.debug = on;
                this.detectors.hps.debug = on;
                this.detectors.music.debug = on;
            });
        }

        if (this.smoothingSlider && this.smoothingVal) {
            // Function to update the display text in ms
            const updateDisplay = (frames) => {
                // ~16.67ms per frame assuming 60fps requestAnimationFrame
                const ms = Math.round(frames * 16.67);
                this.smoothingVal.textContent = `${ms} ms`;
            };

            // Initial display update
            updateDisplay(this.smoothingWindow);

            this.smoothingSlider.addEventListener('input', (e) => {
                this.smoothingWindow = parseInt(e.target.value, 10);
                updateDisplay(this.smoothingWindow);

                // Shrink buffer immediately if we reduced the window size
                while (this.smoothingBuffer.length > this.smoothingWindow) {
                    this.smoothingBuffer.shift();
                }
            });
        }
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
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
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

        // Cancel any previously queued frame to prevent duplicate loops
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
        }
        this._rafId = requestAnimationFrame(() => this.update());

        this.analyser.getFloatTimeDomainData(this.frequencyBuffer);

        // STRATEGY CALL (with performance timing)
        const t0 = performance.now();
        const frequency = this.currentDetector.getPitch(this.frequencyBuffer, this.audioContext.sampleRate);
        const perfMs = performance.now() - t0;

        if (frequency === -1 || isNaN(frequency) ||
            frequency < TunerDefaults.MIN_FREQUENCY ||
            frequency > TunerDefaults.MAX_FREQUENCY) {
            return;
        }

        // Octave-jump rejection & note-change detection
        if (this.smoothingBuffer.length >= 3) {
            const sorted = [...this.smoothingBuffer].sort((a, b) => a - b);
            const median = sorted[Math.floor(sorted.length / 2)];
            const ratio = frequency / median;

            // Check if this is a large frequency change (different note entirely)
            // A semitone ratio is ~1.059, so beyond ~1.3x or below ~0.77x is a different note region
            const isLargeChange = ratio > 1.3 || ratio < 0.77;

            if (isLargeChange) {
                // Track consecutive "different note" readings
                this._noteChangeCount = (this._noteChangeCount || 0) + 1;

                // If we've seen 3+ consecutive readings at a very different frequency,
                // the player genuinely switched notes — reset the buffer
                if (this._noteChangeCount >= 3) {
                    this.smoothingBuffer = [];
                    this._noteChangeCount = 0;
                } else {
                    return; // skip isolated outlier readings
                }
            } else {
                this._noteChangeCount = 0;

                // Standard octave-jump rejection for readings close to the current note
                if ((ratio > 1.8 && ratio < 2.2) || (ratio > 0.45 && ratio < 0.55)) {
                    return; // skip this reading
                }
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

        // Draw debug plot if enabled
        if (this.currentDetector.debug && this.currentDetector.debugData) {
            const dd = this.currentDetector.debugData;
            if (this.currentDetector === this.detectors.yin) {
                this.debugPlot.draw(dd);
                this.debugPlot.updateInfo('YIN', dd, perfMs);
            } else if (this.currentDetector === this.detectors.mcleod) {
                this.debugPlot.drawMcLeod(dd);
                this.debugPlot.updateInfo('McLeod', dd, perfMs);
            } else if (this.currentDetector === this.detectors.hps) {
                this.debugPlot.drawHps(dd);
                this.debugPlot.updateInfo('HPS', dd, perfMs);
            } else if (this.currentDetector === this.detectors.music) {
                this.debugPlot.drawMusic(dd);
                this.debugPlot.updateInfo('MUSIC', dd, perfMs);
            } else {
                this.debugPlot.drawAutocorrelation(dd);
                this.debugPlot.updateInfo('Autocorr', dd, perfMs);
            }
        }
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

        this.noteNameEl.textContent = noteData.name + noteData.octave;
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
