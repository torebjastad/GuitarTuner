/**
 * Guitar Tuner Application
 * Logic adapted from audio-processor.js (Copyright 2015 Google Inc.)
 */

const TunerDefaults = {
    FFTSIZE: 4096,       // Larger buffer for reliable low-frequency detection
    SmoothingWindow: 20, // Number of recent readings for median smoothing
    MIN_FREQUENCY: 30,   // Below low E2 (~82 Hz) with margin
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
        this.debug = false;
        this.debugData = null;
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
        let thresholdUsed = true;
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
            thresholdUsed = false;
            let minVal = 100; // Arbitrary high
            for (let i = 1; i < yinBufferLength; i++) {
                if (yinBuffer[i] < minVal) {
                    minVal = yinBuffer[i];
                    tau = i;
                }
            }
        }

        const initialTau = tau;

        // Step 4: Octave-error correction
        // Check if there's a valid dip at 2*tau (the true fundamental).
        // Guitar low strings often have a stronger 2nd harmonic than the
        // fundamental, causing YIN to lock onto the harmonic (half the
        // true period). If the CMND value at 2*tau is below a relaxed
        // threshold AND is better (lower) than the value at tau, the
        // fundamental is present and we should prefer it.
        let octaveCorrected = false;
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
            // Accept the sub-harmonic only if its CMND dip is reasonable
            // AND the dip at 2*tau is at least as good as at tau.
            // This prevents false corrections on mid/high strings (G3, B3, E4)
            // where the 2*tau dip is a sub-harmonic artifact, not the fundamental.
            if (bestVal < 0.3 && bestVal <= yinBuffer[tau]) {
                tau = bestTau;
                octaveCorrected = true;
            }
        }

        const correctedTau = tau;

        // Step 5: Parabolic Interpolation
        // Use 5-point least-squares quadratic fit when possible (more robust
        // for broad or asymmetric dips), fall back to 3-point fit near edges.
        let interpolatedTau = tau;
        if (tau > 2 && tau < yinBufferLength - 2) {
            // 5-point least-squares: fit y = a*x^2 + b*x + c at x = {-2,-1,0,1,2}
            const sm2 = yinBuffer[tau - 2];
            const sm1 = yinBuffer[tau - 1];
            const s0  = yinBuffer[tau];
            const s1  = yinBuffer[tau + 1];
            const s2  = yinBuffer[tau + 2];
            const a = (2 * sm2 - sm1 - 2 * s0 - s1 + 2 * s2) / 14;
            const b = (-2 * sm2 - sm1 + s1 + 2 * s2) / 10;
            if (a > 0) {
                const adjustment = -b / (2 * a);
                if (Math.abs(adjustment) < 2) interpolatedTau = tau + adjustment;
            }
        } else if (tau > 1 && tau < yinBufferLength - 1) {
            // 3-point fallback near buffer edges
            const s0 = yinBuffer[tau - 1];
            const s1 = yinBuffer[tau];
            const s2 = yinBuffer[tau + 1];
            const adjustment = (s2 - s0) / (2 * (2 * s1 - s2 - s0));
            if (Math.abs(adjustment) < 1) interpolatedTau = tau + adjustment;
        }

        const probability = 1 - yinBuffer[Math.floor(interpolatedTau)];

        // Capture debug data if enabled
        if (this.debug) {
            this.debugData = {
                cmnd: new Float32Array(yinBuffer),
                threshold: this.threshold,
                initialTau,
                thresholdUsed,
                octaveCorrected,
                correctedTau,
                interpolatedTau,
                probability,
                frequency: probability >= 0.6 ? sampleRate / interpolatedTau : -1,
                sampleRate,
                bufferLength: yinBufferLength
            };
        }

        // Noise gate
        if (probability < 0.6) return -1;

        return sampleRate / interpolatedTau;
    }
}

/**
 * Autocorrelation Algorithm (Legacy)
 */
class AutocorrelationDetector extends PitchDetector {
    constructor() {
        super();
        this.debug = false;
        this.debugData = null;
    }

    getPitch(buffer, sampleRate) {
        let SIZE = buffer.length;
        let rms = 0;

        for (let i = 0; i < SIZE; i++) {
            const val = buffer[i];
            rms += val * val;
        }
        rms = Math.sqrt(rms / SIZE);

        if (rms < 0.01) {
            if (this.debug) this.debugData = null;
            return -1;
        }

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
        const interpolatedT0 = a ? T0 - b / (2 * a) : T0;
        const frequency = sampleRate / interpolatedT0;

        if (this.debug) {
            this.debugData = {
                autocorr: new Float64Array(c),
                r1,
                r2,
                trimmedSize: SIZE,
                firstDip: d,
                peakPos: maxpos,
                peakVal: maxval,
                interpolatedT0,
                rms,
                frequency,
                sampleRate
            };
        }

        return frequency;
    }
}

/**
 * McLeod Pitch Method (MPM) Implementation
 * Based on "A Smarter Way to Find Pitch" by Philip McLeod & Geoff Wyvill (2005)
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

class Tuner {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.mediaStreamSource = null;
        this.isPlaying = false;

        this.detectors = {
            yin: new YinDetector(),
            mcleod: new McLeodDetector(),
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
        this.debugToggle = document.getElementById('debug-toggle');
        this.debugPlot = new DebugPlot('debug-canvas');

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

        // STRATEGY CALL (with performance timing)
        const t0 = performance.now();
        const frequency = this.currentDetector.getPitch(this.frequencyBuffer, this.audioContext.sampleRate);
        const perfMs = performance.now() - t0;

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

        // Draw debug plot if enabled
        if (this.currentDetector.debug && this.currentDetector.debugData) {
            const dd = this.currentDetector.debugData;
            if (this.currentDetector === this.detectors.yin) {
                this.debugPlot.draw(dd);
                this.debugPlot.updateInfo('YIN', dd, perfMs);
            } else if (this.currentDetector === this.detectors.mcleod) {
                this.debugPlot.drawMcLeod(dd);
                this.debugPlot.updateInfo('McLeod', dd, perfMs);
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

/**
 * Debug Visualization for YIN pitch detection.
 * Draws the CMND function on a canvas with annotated algorithm steps.
 */
class DebugPlot {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.infoEl = document.getElementById('debug-info');
        this.visible = false;
        // Performance tracking
        this.perfHistory = [];
        this.perfHistoryMax = 60;
    }

    toggle(show) {
        this.visible = show;
        if (this.canvas) {
            this.canvas.parentElement.style.display = show ? 'block' : 'none';
        }
        if (!show) {
            this.clear();
            this.perfHistory = [];
        }
    }

    clear() {
        if (!this.ctx) return;
        const { width, height } = this.canvas;
        this.ctx.clearRect(0, 0, width, height);
        if (this.infoEl) this.infoEl.innerHTML = '';
    }

    recordPerf(ms) {
        this.perfHistory.push(ms);
        if (this.perfHistory.length > this.perfHistoryMax) this.perfHistory.shift();
    }

    updateInfo(algoName, debugData, perfMs) {
        if (!this.infoEl) return;
        this.recordPerf(perfMs);

        const avg = this.perfHistory.reduce((a, b) => a + b, 0) / this.perfHistory.length;
        const max = Math.max(...this.perfHistory);
        const frameBudget = 16.67; // 60fps
        const loadPct = (avg / frameBudget) * 100;

        // Performance color class
        const perfClass = loadPct < 15 ? 'perf-good' : loadPct < 50 ? 'perf-ok' : 'perf-bad';
        const loadLabel = loadPct < 15 ? 'light' : loadPct < 50 ? 'moderate' : 'heavy';

        const s = (label, val) => `<span>${label}: ${val}</span>`;

        let items = [s('Algorithm', algoName)];

        if (algoName === 'YIN' && debugData) {
            items.push(
                s('Freq', debugData.frequency > 0 ? debugData.frequency.toFixed(2) + ' Hz' : 'rejected'),
                s('τ', debugData.interpolatedTau.toFixed(2)),
                s('Confidence', (debugData.probability * 100).toFixed(1) + '%'),
                s('Octave corr.', debugData.octaveCorrected ? 'yes' : 'no'),
            );
        } else if (algoName === 'McLeod' && debugData) {
            items.push(
                s('Freq', debugData.frequency > 0 ? debugData.frequency.toFixed(2) + ' Hz' : 'rejected'),
                s('τ', debugData.interpolatedTau.toFixed(2)),
                s('Clarity', (debugData.clarity * 100).toFixed(1) + '%'),
                s('Key maxima', debugData.keyMaxima.length),
                s('Threshold', debugData.threshold.toFixed(3)),
            );
        } else if (algoName === 'Autocorr' && debugData) {
            items.push(
                s('Freq', debugData.frequency.toFixed(2) + ' Hz'),
                s('T₀', debugData.interpolatedT0.toFixed(2)),
                s('RMS', debugData.rms.toFixed(4)),
                s('Trimmed', `[${debugData.r1}..${debugData.r2}]`),
            );
        }

        items.push(
            s('Calc', perfMs.toFixed(2) + ' ms'),
            s('Avg', avg.toFixed(2) + ' ms'),
            s('Peak', max.toFixed(2) + ' ms'),
            `<span class="${perfClass}">CPU: ${loadPct.toFixed(1)}% (${loadLabel})</span>`,
        );

        this.infoEl.innerHTML = items.join('');
    }

    draw(debugData) {
        if (!this.visible || !this.ctx || !debugData) return;

        const canvas = this.canvas;
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;

        // Size canvas to container
        const W = canvas.parentElement.getBoundingClientRect().width;
        const H = 250;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);
        const pad = { top: 25, bottom: 35, left: 50, right: 15 };
        const plotW = W - pad.left - pad.right;
        const plotH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        const { cmnd, threshold, initialTau, correctedTau, interpolatedTau,
                octaveCorrected, probability, frequency, sampleRate, bufferLength } = debugData;

        // Determine visible range: show around the interesting tau region
        // Show from tau=0 up to 1.5x the corrected tau (or at least 200 samples)
        const maxTauDisplay = Math.min(
            bufferLength,
            Math.max(200, Math.ceil(correctedTau * 1.5))
        );

        // Find Y range (CMND values typically 0–2, but clamp for display)
        const yMax = 2.0;
        const yMin = 0;

        // Helper: data coords to pixel coords
        const toX = (tau) => pad.left + (tau / maxTauDisplay) * plotW;
        const toY = (val) => pad.top + (1 - (val - yMin) / (yMax - yMin)) * plotH;

        // Background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1;
        for (let v = 0; v <= yMax; v += 0.5) {
            const y = toY(v);
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(W - pad.right, y);
            ctx.stroke();
        }

        // Y-axis labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'right';
        for (let v = 0; v <= yMax; v += 0.5) {
            ctx.fillText(v.toFixed(1), pad.left - 6, toY(v) + 4);
        }

        // X-axis tick labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        const xStep = maxTauDisplay <= 300 ? 50
                     : maxTauDisplay <= 600 ? 100
                     : 200;
        for (let t = xStep; t < maxTauDisplay; t += xStep) {
            const x = toX(t);
            // Tick mark
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, pad.top + plotH);
            ctx.lineTo(x, pad.top + plotH + 5);
            ctx.stroke();
            // Label
            ctx.fillText(t, x, pad.top + plotH + 17);
        }
        ctx.fillText('lag (samples)', pad.left + plotW / 2, H - 4);

        // Draw CMND curve
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 1; i < maxTauDisplay; i++) {
            const x = toX(i);
            const y = toY(Math.min(cmnd[i], yMax));
            if (i === 1) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw threshold line
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(pad.left, toY(threshold));
        ctx.lineTo(W - pad.right, toY(threshold));
        ctx.stroke();
        ctx.setLineDash([]);

        // Label threshold
        ctx.fillStyle = '#fbbf24';
        ctx.font = '10px Outfit, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`threshold = ${threshold}`, pad.left + 4, toY(threshold) - 5);

        // Draw octave-correction threshold line (0.3)
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(pad.left, toY(0.3));
        ctx.lineTo(W - pad.right, toY(0.3));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(251, 191, 36, 0.5)';
        ctx.fillText('octave corr. = 0.3', pad.left + 4, toY(0.3) - 5);

        // Mark initial tau (Step 3 result)
        if (initialTau > 0 && initialTau < maxTauDisplay) {
            const ix = toX(initialTau);
            const iy = toY(Math.min(cmnd[initialTau], yMax));

            // Vertical line
            ctx.strokeStyle = octaveCorrected ? 'rgba(248, 113, 113, 0.4)' : 'rgba(74, 222, 128, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(ix, pad.top);
            ctx.lineTo(ix, pad.top + plotH);
            ctx.stroke();
            ctx.setLineDash([]);

            // Dot
            ctx.fillStyle = octaveCorrected ? '#f87171' : '#4ade80';
            ctx.beginPath();
            ctx.arc(ix, iy, 4, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.font = '10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            const initFreq = sampleRate / initialTau;
            ctx.fillText(
                `Step 3: τ=${initialTau} (${initFreq.toFixed(1)} Hz)`,
                ix, pad.top - 5
            );
        }

        // Mark corrected tau (Step 4 result) if octave correction applied
        if (octaveCorrected && correctedTau > 0 && correctedTau < maxTauDisplay) {
            const cx = toX(correctedTau);
            const cy = toY(Math.min(cmnd[correctedTau], yMax));

            // Vertical line
            ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(cx, pad.top);
            ctx.lineTo(cx, pad.top + plotH);
            ctx.stroke();
            ctx.setLineDash([]);

            // Arrow from initial to corrected
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([]);
            ctx.beginPath();
            const ix = toX(initialTau);
            const midY = pad.top + 14;
            ctx.moveTo(ix, midY);
            ctx.lineTo(cx, midY);
            // Arrowhead
            ctx.lineTo(cx - 6, midY - 4);
            ctx.moveTo(cx, midY);
            ctx.lineTo(cx - 6, midY + 4);
            ctx.stroke();

            // Dot
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.arc(cx, cy, 4, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.font = '10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            const corrFreq = sampleRate / correctedTau;
            ctx.fillText(
                `Step 4: τ=${correctedTau} (${corrFreq.toFixed(1)} Hz)`,
                cx, cy - 10
            );
        }

        // Mark final interpolated tau (Step 5)
        if (interpolatedTau > 0 && interpolatedTau < maxTauDisplay) {
            const fx = toX(interpolatedTau);

            // Vertical line — final result
            ctx.strokeStyle = 'rgba(74, 222, 128, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(fx, pad.top + plotH - 20);
            ctx.lineTo(fx, pad.top + plotH);
            ctx.stroke();

            // Triangle marker at bottom
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.moveTo(fx, pad.top + plotH - 20);
            ctx.lineTo(fx - 5, pad.top + plotH - 12);
            ctx.lineTo(fx + 5, pad.top + plotH - 12);
            ctx.closePath();
            ctx.fill();
        }

    }

    drawAutocorrelation(debugData) {
        if (!this.visible || !this.ctx || !debugData) return;

        const canvas = this.canvas;
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;

        const W = canvas.parentElement.getBoundingClientRect().width;
        const H = 250;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);
        const pad = { top: 25, bottom: 35, left: 50, right: 15 };
        const plotW = W - pad.left - pad.right;
        const plotH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        const { autocorr, r1, r2, trimmedSize, firstDip, peakPos, peakVal,
                interpolatedT0, rms, frequency, sampleRate } = debugData;

        // Display range: show up to 1.5x the peak position (at least 200)
        const maxLagDisplay = Math.min(
            trimmedSize,
            Math.max(200, Math.ceil(peakPos * 1.5))
        );

        // Y range: autocorrelation from min to max in the visible range
        let yMin = 0, yMax = 0;
        for (let i = 0; i < maxLagDisplay && i < autocorr.length; i++) {
            if (autocorr[i] > yMax) yMax = autocorr[i];
            if (autocorr[i] < yMin) yMin = autocorr[i];
        }
        // Add some padding
        const yRange = yMax - yMin || 1;
        yMax += yRange * 0.05;
        yMin -= yRange * 0.05;

        const toX = (lag) => pad.left + (lag / maxLagDisplay) * plotW;
        const toY = (val) => pad.top + (1 - (val - yMin) / (yMax - yMin)) * plotH;

        // Background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(0, 0, W, H);

        // Grid lines (horizontal)
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1;
        const yStep = Math.pow(10, Math.floor(Math.log10(yRange / 4)));
        const yGridStep = yRange / 4 < yStep * 2.5 ? yStep : yStep * 2.5;
        const yGridStart = Math.ceil(yMin / yGridStep) * yGridStep;
        for (let v = yGridStart; v <= yMax; v += yGridStep) {
            const y = toY(v);
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(W - pad.right, y);
            ctx.stroke();
        }

        // Y-axis labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'right';
        for (let v = yGridStart; v <= yMax; v += yGridStep) {
            const label = Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0);
            ctx.fillText(label, pad.left - 6, toY(v) + 4);
        }

        // Zero line
        if (yMin < 0) {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pad.left, toY(0));
            ctx.lineTo(W - pad.right, toY(0));
            ctx.stroke();
        }

        // X-axis tick labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        const xStep = maxLagDisplay <= 300 ? 50
                     : maxLagDisplay <= 600 ? 100
                     : 200;
        for (let t = xStep; t < maxLagDisplay; t += xStep) {
            const x = toX(t);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, pad.top + plotH);
            ctx.lineTo(x, pad.top + plotH + 5);
            ctx.stroke();
            ctx.fillText(t, x, pad.top + plotH + 17);
        }
        ctx.fillText('lag (samples)', pad.left + plotW / 2, H - 4);

        // Draw autocorrelation curve
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < maxLagDisplay && i < autocorr.length; i++) {
            const x = toX(i);
            const y = toY(autocorr[i]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Mark first-dip point (Step 4: where autocorrelation stops decreasing)
        if (firstDip > 0 && firstDip < maxLagDisplay) {
            const dx = toX(firstDip);
            const dy = toY(autocorr[firstDip]);

            ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(dx, pad.top);
            ctx.lineTo(dx, pad.top + plotH);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(dx, dy, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`First dip: ${firstDip}`, dx, pad.top - 5);
        }

        // Mark detected peak (Step 4: argmax after first dip)
        if (peakPos > 0 && peakPos < maxLagDisplay) {
            const px = toX(peakPos);
            const py = toY(autocorr[peakPos]);

            ctx.strokeStyle = 'rgba(248, 113, 113, 0.5)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(px, pad.top);
            ctx.lineTo(px, pad.top + plotH);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#f87171';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = '10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            const peakFreq = sampleRate / peakPos;
            ctx.fillText(
                `Peak: T₀=${peakPos} (${peakFreq.toFixed(1)} Hz)`,
                px, py - 10
            );
        }

        // Mark interpolated T0 (Step 5: parabolic refinement)
        if (interpolatedT0 > 0 && interpolatedT0 < maxLagDisplay) {
            const fx = toX(interpolatedT0);

            ctx.strokeStyle = 'rgba(74, 222, 128, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(fx, pad.top + plotH - 20);
            ctx.lineTo(fx, pad.top + plotH);
            ctx.stroke();

            // Triangle marker
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.moveTo(fx, pad.top + plotH - 20);
            ctx.lineTo(fx - 5, pad.top + plotH - 12);
            ctx.lineTo(fx + 5, pad.top + plotH - 12);
            ctx.closePath();
            ctx.fill();
        }

    }

    drawMcLeod(debugData) {
        if (!this.visible || !this.ctx || !debugData) return;

        const canvas = this.canvas;
        const ctx = this.ctx;
        const dpr = window.devicePixelRatio || 1;

        const W = canvas.parentElement.getBoundingClientRect().width;
        const H = 250;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.scale(dpr, dpr);
        const pad = { top: 25, bottom: 35, left: 50, right: 15 };
        const plotW = W - pad.left - pad.right;
        const plotH = H - pad.top - pad.bottom;

        ctx.clearRect(0, 0, W, H);

        const { nsdf, keyMaxima, threshold, selectedTau, interpolatedTau,
                clarity, frequency, sampleRate, bufferLength } = debugData;

        // Display range: show around the interesting tau region
        const maxTauDisplay = Math.min(
            bufferLength,
            Math.max(200, Math.ceil((selectedTau > 0 ? selectedTau : 100) * 2.5))
        );

        // NSDF range is [-1, +1]
        const yMax = 1.1;
        const yMin = -0.5;

        const toX = (tau) => pad.left + (tau / maxTauDisplay) * plotW;
        const toY = (val) => pad.top + (1 - (val - yMin) / (yMax - yMin)) * plotH;

        // Background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(0, 0, W, H);

        // Grid lines
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
        ctx.lineWidth = 1;
        for (let v = -0.5; v <= 1.0; v += 0.25) {
            const y = toY(v);
            ctx.beginPath();
            ctx.moveTo(pad.left, y);
            ctx.lineTo(W - pad.right, y);
            ctx.stroke();
        }

        // Zero line (prominent)
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pad.left, toY(0));
        ctx.lineTo(W - pad.right, toY(0));
        ctx.stroke();

        // Y-axis labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'right';
        for (let v = -0.5; v <= 1.0; v += 0.5) {
            ctx.fillText(v.toFixed(1), pad.left - 6, toY(v) + 4);
        }

        // X-axis tick labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        const xStep = maxTauDisplay <= 300 ? 50
                     : maxTauDisplay <= 600 ? 100
                     : 200;
        for (let t = xStep; t < maxTauDisplay; t += xStep) {
            const x = toX(t);
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, pad.top + plotH);
            ctx.lineTo(x, pad.top + plotH + 5);
            ctx.stroke();
            ctx.fillText(t, x, pad.top + plotH + 17);
        }
        ctx.fillText('lag (samples)', pad.left + plotW / 2, H - 4);

        // Draw NSDF curve
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 1; i < maxTauDisplay && i < bufferLength; i++) {
            const x = toX(i);
            const y = toY(Math.max(yMin, Math.min(nsdf[i], yMax)));
            if (i === 1) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw relative threshold line
        if (threshold > yMin) {
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
            ctx.lineWidth = 1;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.moveTo(pad.left, toY(threshold));
            ctx.lineTo(W - pad.right, toY(threshold));
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#fbbf24';
            ctx.font = '10px Outfit, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`threshold = ${threshold.toFixed(3)}`, pad.left + 4, toY(threshold) - 5);
        }

        // Mark all key maxima (orange dots)
        for (let i = 0; i < keyMaxima.length; i++) {
            const km = keyMaxima[i];
            if (km.tau >= maxTauDisplay) continue;
            const kx = toX(km.tau);
            const ky = toY(Math.min(km.val, yMax));

            ctx.fillStyle = km.tau === selectedTau ? '#f87171' : 'rgba(251, 146, 60, 0.7)';
            ctx.beginPath();
            ctx.arc(kx, ky, km.tau === selectedTau ? 5 : 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Mark selected peak with label
        if (selectedTau > 0 && selectedTau < maxTauDisplay) {
            const sx = toX(selectedTau);
            const sy = toY(Math.min(nsdf[selectedTau], yMax));

            // Vertical dashed line
            ctx.strokeStyle = 'rgba(248, 113, 113, 0.4)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 3]);
            ctx.beginPath();
            ctx.moveTo(sx, pad.top);
            ctx.lineTo(sx, pad.top + plotH);
            ctx.stroke();
            ctx.setLineDash([]);

            // Label
            ctx.fillStyle = '#f87171';
            ctx.font = '10px Outfit, sans-serif';
            ctx.textAlign = 'center';
            const peakFreq = sampleRate / selectedTau;
            ctx.fillText(
                `Peak: τ=${selectedTau} (${peakFreq.toFixed(1)} Hz)`,
                sx, pad.top - 5
            );
        }

        // Mark interpolated tau (final result)
        if (interpolatedTau > 0 && interpolatedTau < maxTauDisplay) {
            const fx = toX(interpolatedTau);

            ctx.strokeStyle = 'rgba(74, 222, 128, 0.8)';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(fx, pad.top + plotH - 20);
            ctx.lineTo(fx, pad.top + plotH);
            ctx.stroke();

            // Triangle marker
            ctx.fillStyle = '#4ade80';
            ctx.beginPath();
            ctx.moveTo(fx, pad.top + plotH - 20);
            ctx.lineTo(fx - 5, pad.top + plotH - 12);
            ctx.lineTo(fx + 5, pad.top + plotH - 12);
            ctx.closePath();
            ctx.fill();
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

        this.toneButtons = document.querySelectorAll('.tone-btn');
        if (this.toneButtons.length > 0) this.bindEvents();
    }

    bindEvents() {
        this.toneButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const strIndex = parseInt(btn.getAttribute('data-string'), 10);
                if (this.isPlaying && this.activeDataString === strIndex) {
                    this.stopTone();
                } else {
                    if (this.isPlaying) {
                        this.stopTone();
                    }
                    this.playTone(strIndex);
                }
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
            try { node.disconnect(); } catch (e) {}
            try { if (node.stop) node.stop(); } catch (e) {}
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

// Initialize
const tuner = new Tuner();
const testTones = new TestToneGenerator(tuner);
