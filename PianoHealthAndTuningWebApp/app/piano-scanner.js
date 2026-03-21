// piano-scanner.js — Orkestrerer en fullstendig 88-tasters skanning.
// Bruker UltimateDetector som intern målemotor.
//
// Avhenger av: pitch-common.js, ultimate-detector.js

'use strict';

/**
 * PianoScanner
 *
 * Koordinerer mikrofontilgang, UltimateDetector-kall og stabilitetslogikk
 * for å måle intonasjonsnøyaktigheten til alle taster på et piano.
 *
 * Bruk:
 *   const scanner = new PianoScanner();
 *   await scanner.startMikrofon();
 *   scanner.onNoteBekreft = (i, r) => …;
 *   await scanner.skannAlle();
 */
class PianoScanner {
    constructor() {
        this.detector   = new UltimateDetector(0.93, 0.30);
        this.audioCtx   = null;
        this.analyser   = null;
        this.stream     = null;
        this.recorder   = null;
        this.isScanning = false;

        // Resultater: indeks 0 = A0 (MIDI 21), indeks 87 = C8 (MIDI 108)
        this.noteResultater = new Array(88).fill(null);

        // --- Konfigurering ---
        this.BUFFER_SIZE       = 8192;
        this.STABIL_TERSKEL    = 8;      // Minimum gode avlesninger for bekreftelse
        this.SAMLETID_MS       = 1000;   // Samletid for medianen (1 sekund)
        this.MAKS_VENTETID_MS  = 10000;  // Timeout per tast (ms)
        this.GODKJENT_AVSTAND  = 0.45;   // Halvtoner — innenfor dette = riktig tast
        this.MIN_RMS           = 0.0001; // Minimum RMS — filtrerer digitalt stillhet
        this.MAKS_REL_STD      = 0.005;  // Maks relativ standardavvik for stabilitet (0.5%)
        this.RMS_FALLOFF       = 0.15;   // Stopp tidlig hvis RMS faller under 15% av toppverdi

        // Onset detection — forhindrer at etterklang fra forrige tone fanges opp
        this.ONSET_STILLE_RMS  = 0.002;  // RMS må falle under dette før vi lytter etter ny tone
        this.ONSET_ANSLAG_RMS  = 0.003;  // RMS må stige over dette for å registrere et nytt anslag

        // Skanneomfang: C1 (noteIndex 3) til A7 (noteIndex 84)
        // Hopper over A0–B0 (for bass for mobil-mikrofon) og A#7–C8 (for lyse/vanskelige)
        this.START_NOTE_INDEX  = 3;      // C1 (MIDI 24)
        this.SLUTT_NOTE_INDEX  = 84;     // A7 (MIDI 105)

        // --- Callbacks til UI ---
        this.onNoteMalt          = null;
        this.onNoteBekreft       = null;
        this.onNoteIkkeDetektert = null;
        this.onSkanningFullfort  = null;
        this.onFremdrift         = null;
        this.onVenterPåStille    = null;  // Viser "venter på stillhet" i UI

        // Privat
        this._lydChunks = [];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Statiske hjelpemetoder
    // ─────────────────────────────────────────────────────────────────────────

    static idealHz(noteIndex) {
        const midi = noteIndex + 21;
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    static frekvensInfo(hz) {
        if (hz <= 0) return null;
        const noteNum  = 12 * Math.log2(hz / 440);
        const midi     = Math.round(noteNum) + 69;
        const ideell   = 440 * Math.pow(2, (midi - 69) / 12);
        const cents    = 1200 * Math.log2(hz / ideell);
        const notenavn = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][midi % 12];
        const oktav    = Math.floor(midi / 12) - 1;
        return { cents, midi, noteNavn: notenavn, oktav, hz, ideell };
    }

    /**
     * Beregner RMS (Root Mean Square) av en audio-buffer.
     * Brukes til å sjekke om signalet har nok energi.
     */
    static rms(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i] * buffer[i];
        }
        return Math.sqrt(sum / buffer.length);
    }

    /**
     * DTFT refinement for sub-cent pitch accuracy.
     * Two-pass: coarse (±10 cents, 1-cent steps) then fine (±2 cents, 0.1-cent steps).
     * Uses Goertzel-like evaluation at specific frequencies.
     *
     * @param {Float32Array} buffer - Audio samples
     * @param {number} sampleRate - Sample rate in Hz
     * @param {number} centerFreq - Center frequency to refine around (Hz)
     * @returns {number} Refined frequency in Hz, or -1 if failed
     */
    static dtftRefine(buffer, sampleRate, centerFreq) {
        const N = buffer.length;

        // Apply Hanning window
        const windowed = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            windowed[i] = buffer[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1)));
        }

        // Evaluate DFT magnitude at specific frequencies
        const evalFreq = (freq) => {
            const omega = 2 * Math.PI * freq / sampleRate;
            let real = 0, imag = 0;
            for (let n = 0; n < N; n++) {
                real += windowed[n] * Math.cos(omega * n);
                imag += windowed[n] * Math.sin(omega * n);
            }
            return Math.sqrt(real * real + imag * imag);
        };

        // Coarse pass: ±10 cents, 1-cent steps
        let bestMag = -1, bestFreq = centerFreq;
        for (let c = -10; c <= 10; c++) {
            const f = centerFreq * Math.pow(2, c / 1200);
            const mag = evalFreq(f);
            if (mag > bestMag) { bestMag = mag; bestFreq = f; }
        }

        // Fine pass: ±2 cents around coarse peak, 0.1-cent steps
        const coarseCenter = bestFreq;
        bestMag = -1;
        let fineFreqs = [];
        let fineMags = [];
        for (let c = -20; c <= 20; c++) {
            const f = coarseCenter * Math.pow(2, (c * 0.1) / 1200);
            const mag = evalFreq(f);
            fineFreqs.push(f);
            fineMags.push(mag);
            if (mag > bestMag) { bestMag = mag; bestFreq = f; }
        }

        // Parabolic interpolation on fine pass
        const peakIdx = fineMags.indexOf(bestMag);
        if (peakIdx > 0 && peakIdx < fineMags.length - 1) {
            const a = fineMags[peakIdx - 1];
            const b = fineMags[peakIdx];
            const c = fineMags[peakIdx + 1];
            const d = a - 2 * b + c;
            if (d !== 0) {
                const adj = 0.5 * (a - c) / d;
                const refinedIdx = peakIdx + adj;
                const fLo = fineFreqs[0];
                const fHi = fineFreqs[fineFreqs.length - 1];
                return fLo + refinedIdx * (fHi - fLo) / (fineFreqs.length - 1);
            }
        }

        return bestFreq;
    }

    /**
     * Median av en tallarray. Mer robust enn gjennomsnitt mot uteliggere.
     */
    static median(arr) {
        if (arr.length === 0) return 0;
        const sorted = arr.slice().sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Oppsett
    // ─────────────────────────────────────────────────────────────────────────

    async startMikrofon() {
        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl:  false,
                channelCount:     1
            }
        });

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }

        const kilde   = this.audioCtx.createMediaStreamSource(this.stream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = this.BUFFER_SIZE;
        kilde.connect(this.analyser);

        // MediaRecorder for valgfritt lydopptak
        try {
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/mp4';
            this.recorder    = new MediaRecorder(this.stream, { mimeType });
            this._lydChunks  = [];
            this.recorder.ondataavailable = (e) => {
                if (e.data.size > 0) this._lydChunks.push(e.data);
            };
        } catch {
            // MediaRecorder ikke tilgjengelig — ikke kritisk
            this.recorder = null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Kjerne-scanning
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Skanner én enkelt tast basert på noteIndex (0=A0 ... 87=C8).
     *
     * Tre-fase onset detection:
     * 1. "vent_på_stille" — Venter på at forrige tone har dødd ut (RMS < ONSET_STILLE_RMS)
     * 2. "vent_på_anslag" — Venter på et nytt anslag (RMS > ONSET_ANSLAG_RMS)
     * 3. "sampling" — Samler 1 sekund med pitch-avlesninger, bruker median
     *
     * @param {number} noteIndex - 0-basert tastindeks
     * @param {boolean} erFørste - Hopp over onset-faser for første tone i sekvensen
     */
    skannNote(noteIndex, erFørste = false) {
        return new Promise((resolve) => {
            const forventetHz = PianoScanner.idealHz(noteIndex);
            const buffer      = new Float32Array(this.BUFFER_SIZE);
            const sampleRate  = this.audioCtx.sampleRate;

            let avlesninger    = [];
            let førsteTreffTid = null;
            let toppRms        = 0;
            const startTid     = performance.now();
            let rafId          = null;

            // Onset detection: første tone trenger ikke vente på stillhet
            let fase = erFørste ? 'vent_på_anslag' : 'vent_på_stille';

            const _ferdig = (resultat) => {
                cancelAnimationFrame(rafId);
                this.noteResultater[noteIndex] = resultat;
                resolve(resultat);
            };

            const _bekreft = () => {
                const hzVerdier = avlesninger.map(a => a.hz);
                let medianHz    = PianoScanner.median(hzVerdier);
                const snitt     = hzVerdier.reduce((a, b) => a + b, 0) / hzVerdier.length;
                const varians   = hzVerdier.reduce((s, v) => s + (v - snitt) ** 2, 0) / hzVerdier.length;
                const relStd    = Math.sqrt(varians) / snitt;

                // DTFT refinement for non-bass notes (≥ 80 Hz)
                // Sub-cent precision by evaluating DFT at exact frequencies
                if (forventetHz >= 80) {
                    this.analyser.getFloatTimeDomainData(buffer);
                    const refined = PianoScanner.dtftRefine(buffer, sampleRate, medianHz);
                    if (refined > 0) {
                        const refinedCents = Math.abs(1200 * Math.log2(refined / forventetHz));
                        if (refinedCents < 100) medianHz = refined;
                    }
                }

                const info = PianoScanner.frekvensInfo(medianHz);
                const resultat  = {
                    noteIndex,
                    status:            'bekreftet',
                    hz:                medianHz,
                    cents:             info.cents,
                    midi:              info.midi,
                    noteNavn:          info.noteNavn,
                    oktav:             info.oktav,
                    klarhet:           Math.max(0, 1 - relStd * 200),
                    antallAvlesninger: avlesninger.length
                };
                if (this.onNoteBekreft) this.onNoteBekreft(noteIndex, resultat);
                _ferdig(resultat);
            };

            const loop = () => {
                if (!this.isScanning) {
                    _ferdig({ noteIndex, status: 'avbrutt', hz: null, cents: null, klarhet: 0 });
                    return;
                }

                const tidBrukt = performance.now() - startTid;

                if (tidBrukt > this.MAKS_VENTETID_MS) {
                    if (avlesninger.length >= this.STABIL_TERSKEL) {
                        _bekreft();
                    } else {
                        if (this.onNoteIkkeDetektert) this.onNoteIkkeDetektert(noteIndex);
                        _ferdig({ noteIndex, status: 'ikke_detektert', hz: null, cents: null, klarhet: 0 });
                    }
                    return;
                }

                this.analyser.getFloatTimeDomainData(buffer);
                const signalRms = PianoScanner.rms(buffer);

                // ── Fase 1: Vent på stillhet (forrige tone dør ut) ──
                if (fase === 'vent_på_stille') {
                    if (this.onVenterPåStille) this.onVenterPåStille(noteIndex);
                    if (signalRms < this.ONSET_STILLE_RMS) {
                        fase = 'vent_på_anslag';
                    }
                    rafId = requestAnimationFrame(loop);
                    return;
                }

                // ── Fase 2: Vent på nytt anslag ──
                if (fase === 'vent_på_anslag') {
                    if (signalRms > this.ONSET_ANSLAG_RMS) {
                        fase = 'sampling';
                        // Liten forsinkelse: hopp over de første ~50ms for å la tonen stabilisere
                        // (anslags-transienten inneholder mye støy)
                    }
                    rafId = requestAnimationFrame(loop);
                    return;
                }

                // ── Fase 3: Sampling ──
                if (signalRms < this.MIN_RMS) {
                    rafId = requestAnimationFrame(loop);
                    return;
                }

                const hz = this.detector.getPitch(buffer, sampleRate);

                if (hz > 0) {
                    const semitonerBort = Math.abs(12 * Math.log2(hz / forventetHz));

                    if (semitonerBort <= this.GODKJENT_AVSTAND) {
                        if (førsteTreffTid === null) {
                            førsteTreffTid = performance.now();
                            toppRms = signalRms;
                        }

                        avlesninger.push({ hz, tid: tidBrukt, rms: signalRms });
                        if (signalRms > toppRms) toppRms = signalRms;

                        if (this.onNoteMalt) this.onNoteMalt(noteIndex, hz);

                        const samletid = performance.now() - førsteTreffTid;

                        // 1 fullt sekund samlet OG nok avlesninger → bekreft
                        if (samletid >= this.SAMLETID_MS && avlesninger.length >= this.STABIL_TERSKEL) {
                            _bekreft();
                            return;
                        }

                        // Lyden har dødd ut (RMS falt under 15% av topp) → bekreft tidlig
                        if (avlesninger.length >= this.STABIL_TERSKEL &&
                            signalRms < toppRms * this.RMS_FALLOFF) {
                            _bekreft();
                            return;
                        }

                    } else if (førsteTreffTid === null) {
                        avlesninger = [];
                    }
                }

                rafId = requestAnimationFrame(loop);
            };

            rafId = requestAnimationFrame(loop);
        });
    }

    /**
     * Utfører en fullstendig skanning.
     * @param {number[]|null} noteSekvens - Valgfri skannesekvens (null = standard hvite taster)
     */
    async skannAlle(noteSekvens = null) {
        const sekvens = noteSekvens ?? this._hviteTasterSekvens();
        this.isScanning = true;

        if (this.recorder && this.recorder.state === 'inactive') {
            try { this.recorder.start(250); } catch { /* ignorér */ }
        }

        for (let i = 0; i < sekvens.length; i++) {
            if (!this.isScanning) break;
            const noteIndex = sekvens[i];
            if (this.onFremdrift) this.onFremdrift(i, sekvens.length);
            await this.skannNote(noteIndex, i === 0);
        }

        if (this.recorder && this.recorder.state === 'recording') {
            try { this.recorder.stop(); } catch { /* ignorér */ }
        }

        this.isScanning = false;

        if (this.onSkanningFullfort) {
            this.onSkanningFullfort(this.noteResultater);
        }
    }

    stopp() {
        this.isScanning = false;
        if (this.recorder && this.recorder.state === 'recording') {
            try { this.recorder.stop(); } catch { /* ignorér */ }
        }
    }

    avslutt() {
        this.stopp();
        if (this.stream) {
            this.stream.getTracks().forEach(t => t.stop());
            this.stream = null;
        }
        if (this.audioCtx && this.audioCtx.state !== 'closed') {
            this.audioCtx.close();
            this.audioCtx = null;
        }
    }

    hentLydblob() {
        if (!this._lydChunks || this._lydChunks.length === 0) return null;
        const mimeType = this.recorder?.mimeType ?? 'audio/webm';
        return new Blob(this._lydChunks, { type: mimeType });
    }

    nullstill() {
        this.noteResultater = new Array(88).fill(null);
        this._lydChunks     = [];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Skannesekvenser
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Hvite taster fra C1 til A7.
     * Hopper over A0–B0 (for dype for mobilmikrofon) og A#7–C8 (for lyse/vanskelige).
     */
    _hviteTasterSekvens() {
        const hviteOffsets = [0, 2, 4, 5, 7, 9, 11];
        const sekvens = [];
        for (let okt = 0; okt <= 7; okt++) {
            for (const offset of hviteOffsets) {
                const midi = (okt + 1) * 12 + offset;
                const noteIndex = midi - 21;
                if (noteIndex >= this.START_NOTE_INDEX && noteIndex <= this.SLUTT_NOTE_INDEX) {
                    sekvens.push(noteIndex);
                }
            }
        }
        return sekvens;
    }

    /**
     * Alle taster (hvite + svarte) fra C1 til A7.
     */
    _alleTasterSekvens() {
        const sekvens = [];
        for (let i = this.START_NOTE_INDEX; i <= this.SLUTT_NOTE_INDEX; i++) {
            sekvens.push(i);
        }
        return sekvens;
    }
}
