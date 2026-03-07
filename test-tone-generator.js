/**
 * Realistic Guitar Test Tone Generator
 * Produces guitar-like tones with harmonics, pluck envelope, vibrato, and noise.
 * Depends on: pitch-common.js (TunerDefaults), tuner.js (Tuner)
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

        this.toneButtons = document.querySelectorAll('.tone-btn');
        if (this.toneButtons.length > 0) this.bindEvents();
    }

    bindEvents() {
        this.toneButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const strIndex = parseInt(btn.getAttribute('data-string'), 10);
                if (this.isPlaying) {
                    this.stopTone();
                }
                this.playTone(strIndex);
            });
        });
    }

    async playTone(index) {
        const selectedString = this.strings[index];
        if (!selectedString) return;
        this.activeDataString = index;

        this.toneButtons.forEach((btn, idx) => {
            if (idx === index) btn.classList.add('active');
            else btn.classList.remove('active');
        });

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

        // Single shared vibrato LFO for all harmonics (realistic: one string = one vibrato)
        const vibratoRate = 4.5 + Math.random() * 1.5;  // 4.5-6 Hz
        const vibratoDepth = fundamental < 150 ? 0.8 : 0.4; // cents-scale
        const vibratoLfo = ctx.createOscillator();
        vibratoLfo.frequency.setValueAtTime(vibratoRate, now);
        vibratoLfo.start(now);
        this.nodes.push(vibratoLfo);

        // Create harmonic oscillators
        harmonics.forEach((amp, i) => {
            const harmNum = i + 1;
            const freq = fundamental * harmNum;
            if (freq > ctx.sampleRate / 2) return; // skip above Nyquist

            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            // Connect shared vibrato LFO scaled for this harmonic's frequency
            const vibratoGain = ctx.createGain();
            vibratoGain.gain.setValueAtTime(freq * vibratoDepth / 1200, now);
            vibratoLfo.connect(vibratoGain);
            vibratoGain.connect(osc.frequency);
            this.nodes.push(vibratoGain);

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

        // Auto-stop after the longest decay
        this._autoStopTimer = setTimeout(() => this.stopTone(), 4000);
    }

    stopTone() {
        clearTimeout(this._autoStopTimer);
        this.nodes.forEach(node => {
            try { node.disconnect(); } catch (e) { }
            try { if (node.stop) node.stop(); } catch (e) { }
        });
        this.nodes = [];
        this.isPlaying = false;
        this.activeDataString = null;

        if (this.toneButtons) {
            this.toneButtons.forEach(btn => btn.classList.remove('active'));
        }

        // Don't close the audio context — tuner might still be running
        if (!this.tuner.mediaStreamSource) {
            this.tuner.isPlaying = false;
            this.tuner.updateUI(null);
            this.tuner.statusEl.textContent = 'Stopped';
        }
    }
}
