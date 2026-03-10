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

        // Test sample state (debug mode)
        this._testSamplesInit = false;
        this._testSamplesAvailable = false;
        this._audioCache = new Map();
        this._testSampleCtx = null;
        this._testSampleSource = null;
        this._micMuted = false;
        this._testPlayId = 0;

        if (this.smoothingSlider && this.smoothingVal) {
            this.smoothingSlider.value = this.smoothingWindow;
        }

        // Track whether we paused due to visibility change (vs user pressing stop)
        this._pausedByVisibility = false;

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
                this._buildParamsUI();
            }
        });

        if (this.debugToggle) {
            this.debugToggle.addEventListener('change', (e) => {
                const on = e.target.checked;
                this.debugPlot.toggle(on);
                
                const paramsContainer = document.getElementById('algo-params');
                if (paramsContainer) {
                    paramsContainer.style.display = on ? 'flex' : 'none';
                    if (on) this._buildParamsUI();
                }

                // Enable debug on all detectors
                this.detectors.yin.debug = on;
                this.detectors.mcleod.debug = on;
                this.detectors.autocorr.debug = on;
                this.detectors.hps.debug = on;
                this.detectors.music.debug = on;
                // Test samples
                const samplesDiv = document.getElementById('test-samples');
                if (samplesDiv) {
                    if (on) {
                        if (!this._testSamplesInit) {
                            this._initTestSamples();
                        } else if (this._testSamplesAvailable) {
                            samplesDiv.style.display = '';
                        }
                    } else {
                        samplesDiv.style.display = 'none';
                    }
                }
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

        // Pause/resume when the page goes to background/foreground.
        // Saves CPU and battery, especially on mobile devices.
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Page went to background — pause if tuner is running
                if (this.isPlaying) {
                    this._pauseProcessing();
                    this._pausedByVisibility = true;
                }
            } else {
                // Page returned to foreground — resume only if we paused it
                if (this._pausedByVisibility) {
                    this._pausedByVisibility = false;
                    this._resumeProcessing();
                }
            }
        });
    }

    /**
     * Rebuilds the dynamic Algorithm Parameters UI based on the current detector.
     */
    _buildParamsUI() {
        const container = document.getElementById('algo-params');
        if (!container) return;

        const params = this.currentDetector.getParams();
        container.innerHTML = '';

        if (!params || params.length === 0) {
            container.style.display = 'none';
            return;
        }

        if (this.debugToggle && this.debugToggle.checked) {
            container.style.display = 'flex';
        }

        params.forEach(param => {
            const row = document.createElement('div');
            row.className = 'param-row';

            const labelContainer = document.createElement('div');
            labelContainer.className = 'param-label';
            
            const labelText = document.createElement('span');
            labelText.textContent = param.label;
            labelContainer.appendChild(labelText);

            if (param.description) {
                const helpIcon = document.createElement('span');
                helpIcon.className = 'param-help-icon';
                helpIcon.textContent = '?';
                
                const tooltip = document.createElement('div');
                tooltip.className = 'param-tooltip';
                tooltip.textContent = param.description;
                
                helpIcon.appendChild(tooltip);
                labelContainer.appendChild(helpIcon);
            }

            const control = document.createElement('div');
            control.className = 'param-control';

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.className = 'param-slider';
            slider.min = param.min;
            slider.max = param.max;
            slider.step = param.step;
            slider.value = param.value;

            const valDisplay = document.createElement('div');
            valDisplay.className = 'param-value';
            valDisplay.textContent = Number(param.value).toFixed(param.step.toString().split('.')[1]?.length || 0);

            slider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                valDisplay.textContent = val.toFixed(param.step.toString().split('.')[1]?.length || 0);
                this.currentDetector.setParam(param.key, val);
            });

            control.appendChild(slider);
            control.appendChild(valDisplay);
            row.appendChild(labelContainer);
            row.appendChild(control);
            container.appendChild(row);
        });
    }

    /**
     * Pause audio processing without fully stopping the tuner.
     * Suspends the AudioContext and cancels the animation frame loop.
     * The microphone stream stays connected so we can resume instantly.
     */
    _pauseProcessing() {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
        this.statusEl.textContent = "Paused (background)";
        this.statusEl.style.color = "var(--warning-color)";
    }

    /**
     * Resume audio processing after a visibility-triggered pause.
     * Resumes the AudioContext and restarts the animation frame loop.
     */
    _resumeProcessing() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        this.statusEl.textContent = "Listening...";
        this.statusEl.style.color = "var(--text-primary)";
        this.update();
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
        this._pausedByVisibility = false;
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

        // Skip mic processing when muted (test sample results stay visible)
        if (this._micMuted) return;

        this.analyser.getFloatTimeDomainData(this.frequencyBuffer);

        // STRATEGY CALL (with performance timing)
        const t0 = performance.now();
        const frequency = this.currentDetector.getPitch(this.frequencyBuffer, this.audioContext.sampleRate);
        const perfMs = performance.now() - t0;

        const smoothedFreq = this._applySmoothing(frequency);
        if (smoothedFreq !== -1) {
            this.updateUI(this.getNote(smoothedFreq));
        }

        // Draw debug plot if enabled
        this._renderDebugPlot(perfMs);
    }
    
    /**
     * Applies median smoothing and octave-jump outlier rejection to a raw frequency sequence.
     * Extracts the logic so both the microphone and test audio samples use identical behavior.
     */
    _applySmoothing(frequency) {
        if (frequency === -1 || isNaN(frequency) ||
            frequency < TunerDefaults.MIN_FREQUENCY ||
            frequency > TunerDefaults.MAX_FREQUENCY) {
            return -1;
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
                    return -1; // skip isolated outlier readings
                }
            } else {
                this._noteChangeCount = 0;

                // Standard octave-jump rejection for readings close to the current note
                if ((ratio > 1.8 && ratio < 2.2) || (ratio > 0.45 && ratio < 0.55)) {
                    return -1; // skip this reading
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
        return sorted[Math.floor(sorted.length / 2)];
    }

    getNote(frequency) {
        if (frequency === -1) return null;
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

    _renderDebugPlot(perfMs) {
        if (!this.currentDetector.debug || !this.currentDetector.debugData) return;
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

    _getTestDatasets() {
        const semi = { C: 0, Db: 1, D: 2, Eb: 3, E: 4, F: 5, Gb: 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
        const disp = { C: 'C', Db: 'C#', D: 'D', Eb: 'D#', E: 'E', F: 'F', Gb: 'F#', G: 'G', Ab: 'G#', A: 'A', Bb: 'A#', B: 'B' };
        const freq = (note, oct) => {
            const midi = (oct + 1) * 12 + (semi[note] ?? { C:0,D:2,E:4,F:5,G:7,A:9,B:11 }[note]);
            return Math.round(440 * Math.pow(2, (midi - 69) / 12) * 100) / 100;
        };

        // Nylon guitar
        const nylon = [
            ['8396__speedy__clean_e_str_pick.wav', 'E2 pick', 82.41],
            ['8397__speedy__clean_e_str_pluck.wav', 'E2 pluck', 82.41],
            ['8395__speedy__clean_e_harm.wav', 'E3 harm', 164.81],
            ['8382__speedy__clean_a_str_pick.wav', 'A2 pick', 110.00],
            ['8383__speedy__clean_a_str_pluck.wav', 'A2 pluck', 110.00],
            ['8381__speedy__clean_a_harm.wav', 'A3 harm', 220.00],
            ['8388__speedy__clean_d_str_pick.wav', 'D3 pick', 146.83],
            ['8389__speedy__clean_d_str_pluck.wav', 'D3 pluck', 146.83],
            ['8387__speedy__clean_d_harm.wav', 'D4 harm', 293.66],
            ['8402__speedy__clean_g_str_pick.wav', 'G3 pick', 196.00],
            ['8403__speedy__clean_g_str_pluck.wav', 'G3 pluck', 196.00],
            ['8401__speedy__clean_g_harm1.wav', 'G4 harm', 392.00],
            ['8385__speedy__clean_b_str_pick.wav', 'B3 pick', 246.94],
            ['8386__speedy__clean_b_str_pluck.wav', 'B3 pluck', 246.94],
            ['8384__speedy__clean_b_harm.wav', 'B4 harm', 493.88],
            ['8393__speedy__clean_e1st_str_pick.wav', 'E4 pick', 329.63],
            ['8394__speedy__clean_e1st_str_pluck.wav', 'E4 pluck', 329.63],
            ['8392__speedy__clean_e1st_harm.wav', 'E5 harm', 659.26],
            ['8391__speedy__clean_e1st_5th.wav', 'A4 5th', 440.00],
            ['8390__speedy__clean_e1st_12th.wav', 'E5 12th', 659.26],
        ].map(([file, note, f]) => ({ file, note, freq: f }));

        // Plucked guitar — [id, note, octave] × 7 notes × 6 octaves
        const pluckedIds = {
            C: [399489,399488,399495,399494,399493,399492],
            D: [399497,399496,399482,399483,399480,399481],
            E: [399486,399487,399484,399485,399478,399479],
            F: [399501,399500,399503,399502,399505,399504],
            G: [399507,399506,399499,399498,399476,399477],
            A: [399469,399468,399467,399466,399473,399472],
            B: [399471,399470,399475,399474,399491,399490],
        };
        const plucked = [];
        for (const [n, ids] of Object.entries(pluckedIds)) {
            ids.forEach((id, i) => {
                const oct = i + 1;
                plucked.push({ file: `${id}__skamos66__${n.toLowerCase()}${oct}.wav`, note: `${n}${oct}`, freq: freq(n, oct) });
            });
        }
        plucked.sort((a, b) => a.freq - b.freq);

        // Piano (UIowa mf) — B0 to C8
        const noteOrder = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
        const piano = [];
        const addPiano = (n, oct) => piano.push({ file: `Piano.mf.${n}${oct}.ogg`, note: `${disp[n]}${oct}`, freq: freq(n, oct) });
        addPiano('B', 0);
        for (let oct = 1; oct <= 7; oct++) noteOrder.forEach(n => addPiano(n, oct));
        addPiano('C', 8);

        return [
            { key: 'nylon', name: 'Nylon Guitar', dir: 'TestData/Nylon-guitar-single-notes/', probe: nylon[0].file, tones: nylon },
            { key: 'plucked', name: 'Plucked Guitar', dir: 'TestData/22511__skamos66__plucked-guitar-notes/', probe: plucked[0].file, tones: plucked },
            { key: 'piano', name: 'Piano (UIowa)', dir: 'TestData/UIowa-Piano-mf/', probe: piano[0].file, tones: piano },
        ];
    }

    async _initTestSamples() {
        this._testSamplesInit = true;
        const datasets = this._getTestDatasets();
        const dsSelect = document.getElementById('sample-dataset');
        const toneSelect = document.getElementById('sample-tone');
        const playBtn = document.getElementById('sample-play-btn');
        const samplesDiv = document.getElementById('test-samples');

        dsSelect.innerHTML = '<option value="">Checking...</option>';

        // Probe each dataset
        const available = [];
        for (const ds of datasets) {
            try {
                const resp = await fetch(ds.dir + encodeURIComponent(ds.probe), { method: 'HEAD' });
                if (resp.ok) available.push(ds);
            } catch (e) { /* not available */ }
        }

        if (available.length === 0) {
            samplesDiv.style.display = 'none';
            return;
        }

        this._testSamplesAvailable = true;
        this._testDatasets = available;
        samplesDiv.style.display = '';

        dsSelect.innerHTML = available.map((ds, i) =>
            `<option value="${i}">${ds.name}</option>`
        ).join('');

        dsSelect.addEventListener('change', () => this._populateTones());
        toneSelect.addEventListener('change', () => this._playTestAudio(true));
        toneSelect.addEventListener('keydown', (e) => {
            if (e.code === 'Enter' || e.code === 'Space') {
                e.preventDefault();
                this._playTestAudio(true);
            }
        });
        playBtn.addEventListener('click', () => this._playTestAudio());
        document.getElementById('sample-mute').addEventListener('change', (e) => {
            this._micMuted = e.target.checked;
        });

        this._populateTones();
    }

    _populateTones() {
        const dsSelect = document.getElementById('sample-dataset');
        const toneSelect = document.getElementById('sample-tone');
        const idx = parseInt(dsSelect.value);
        const ds = this._testDatasets[idx];

        toneSelect.innerHTML = '<option value="">\u2014 Select tone \u2014</option>' +
            ds.tones.map((t, i) =>
                `<option value="${i}">${t.note} (${t.freq} Hz)</option>`
            ).join('');
        toneSelect.disabled = false;
        document.getElementById('sample-play-btn').disabled = true;
    }

    async _playTestAudio(forcePlay = false) {
        const playBtn = document.getElementById('sample-play-btn');
        const currentPlayId = ++this._testPlayId;

        // Stop if already playing
        if (this._testSampleSource) {
            this._testSampleSource.onended = null;
            this._testSampleSource.stop();
            this._testSampleSource = null;
            playBtn.textContent = '\u25B6';
            this.smoothingBuffer = []; // Clear smoothing buffer on stop
            
            // Clear debug plot since the signal ended
            if (this.currentDetector.debug && this.debugPlot) {
               this.debugPlot.clear();
            }
            
            if (!forcePlay) return;
        }

        const dsSelect = document.getElementById('sample-dataset');
        const toneSelect = document.getElementById('sample-tone');
        if (toneSelect.value === '') {
            playBtn.disabled = true;
            return;
        }

        const ds = this._testDatasets[parseInt(dsSelect.value)];
        const tone = ds.tones[parseInt(toneSelect.value)];
        const cacheKey = ds.dir + tone.file;

        if (!this._testSampleCtx || this._testSampleCtx.state === 'closed') {
            this._testSampleCtx = new (window.AudioContext || window.webkitAudioContext)();
        }

        let audioBuffer = this._audioCache.get(cacheKey);
        if (!audioBuffer) {
            playBtn.disabled = true;
            try {
                this.statusEl.textContent = 'Loading...';
                const resp = await fetch(ds.dir + encodeURIComponent(tone.file));
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const arrayBuf = await resp.arrayBuffer();
                audioBuffer = await this._testSampleCtx.decodeAudioData(arrayBuf);
                this._audioCache.set(cacheKey, audioBuffer);
                if (currentPlayId === this._testPlayId) {
                    this.statusEl.textContent = this.isPlaying ? 'Listening...' : 'Ready';
                }
            } catch (err) {
                console.error('Failed to load test sample:', err);
                if (currentPlayId === this._testPlayId) {
                    this.statusEl.textContent = 'Load error';
                    this.statusEl.style.color = 'var(--danger-color)';
                    playBtn.disabled = false;
                }
                return;
            }
        }

        // Check if another play event was triggered while we were waiting for the fetch
        if (currentPlayId !== this._testPlayId) return;
        
        playBtn.disabled = false;
        
        // Clear smoothing buffer before starting new test audio
        this.smoothingBuffer = [];

        if (this._testSampleCtx.state === 'suspended') {
            await this._testSampleCtx.resume();
        }

        this._testSampleSource = this._testSampleCtx.createBufferSource();
        this._testSampleSource.buffer = audioBuffer;
        this._testSampleSource.connect(this._testSampleCtx.destination);

        // Connect through an analyser for real-time detection during playback
        const analyser = this._testSampleCtx.createAnalyser();
        analyser.fftSize = TunerDefaults.FFTSIZE;
        this._testSampleSource.connect(analyser);
        const buf = new Float32Array(TunerDefaults.FFTSIZE);
        const sr = this._testSampleCtx.sampleRate;

        let rafId;
        const processLoop = () => {
            if (!this._testSampleSource || currentPlayId !== this._testPlayId) return;
            analyser.getFloatTimeDomainData(buf);
            const t0 = performance.now();
            const detected = this.currentDetector.getPitch(buf, sr);
            const perfMs = performance.now() - t0;
            
            const smoothedFreq = this._applySmoothing(detected);
            if (smoothedFreq !== -1) {
                this.updateUI(this.getNote(smoothedFreq));
            }
            
            this._renderDebugPlot(perfMs);
            rafId = requestAnimationFrame(processLoop);
        };

        playBtn.textContent = '\u25A0';
        this._testSampleSource.onended = () => {
            if (currentPlayId === this._testPlayId) {
                playBtn.textContent = '\u25B6';
                this._testSampleSource = null;
                cancelAnimationFrame(rafId);
                // The sound naturally decayed. We should clear the plot to avoid frozen last-frame noise graph.
                if (this.currentDetector.debug && this.debugPlot) {
                   this.debugPlot.clear();
                }
            }
        };
        this._testSampleSource.start();
        processLoop();
    }
}
