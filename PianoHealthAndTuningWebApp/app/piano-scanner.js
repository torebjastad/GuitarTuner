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
        this.MIN_RMS           = 0.0001; // Minimum RMS — kun for å filtrere rent digitalt stillhet
        this.MAKS_REL_STD      = 0.005;  // Maks relativ standardavvik for stabilitet (0.5%)
        this.RMS_FALLOFF       = 0.15;   // Stopp tidlig hvis RMS faller under 15% av toppverdi

        // --- Callbacks til UI ---
        this.onNoteMalt          = null;
        this.onNoteBekreft       = null;
        this.onNoteIkkeDetektert = null;
        this.onSkanningFullfort  = null;
        this.onFremdrift         = null;

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
     * Algoritme:
     * 1. Venter på at brukeren slår an riktig tast (frekvens nær forventet)
     * 2. Samler 1 fullt sekund med pitch-avlesninger fra første treff
     * 3. Stopper tidlig hvis lyden dør ut (RMS faller under 15% av topp)
     * 4. Bruker median av alle gode avlesninger (robust mot uteliggere)
     */
    skannNote(noteIndex) {
        return new Promise((resolve) => {
            const forventetHz = PianoScanner.idealHz(noteIndex);
            const buffer      = new Float32Array(this.BUFFER_SIZE);
            const sampleRate  = this.audioCtx.sampleRate;

            let avlesninger    = [];   // Alle gode Hz-avlesninger
            let førsteTreffTid = null; // Tidspunkt for første gyldige avlesning
            let toppRms        = 0;    // Høyeste RMS sett under sampling
            const startTid     = performance.now();
            let rafId          = null;

            const _ferdig = (resultat) => {
                cancelAnimationFrame(rafId);
                this.noteResultater[noteIndex] = resultat;
                resolve(resultat);
            };

            const _bekreft = () => {
                const hzVerdier = avlesninger.map(a => a.hz);
                const medianHz  = PianoScanner.median(hzVerdier);
                const snitt     = hzVerdier.reduce((a, b) => a + b, 0) / hzVerdier.length;
                const varians   = hzVerdier.reduce((s, v) => s + (v - snitt) ** 2, 0) / hzVerdier.length;
                const relStd    = Math.sqrt(varians) / snitt;
                const info      = PianoScanner.frekvensInfo(medianHz);
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
                // Avbrutt?
                if (!this.isScanning) {
                    _ferdig({ noteIndex, status: 'avbrutt', hz: null, cents: null, klarhet: 0 });
                    return;
                }

                const tidBrukt = performance.now() - startTid;

                // Timeout
                if (tidBrukt > this.MAKS_VENTETID_MS) {
                    // Hvis vi har nok data, bekreft likevel
                    if (avlesninger.length >= this.STABIL_TERSKEL) {
                        _bekreft();
                    } else {
                        if (this.onNoteIkkeDetektert) this.onNoteIkkeDetektert(noteIndex);
                        _ferdig({ noteIndex, status: 'ikke_detektert', hz: null, cents: null, klarhet: 0 });
                    }
                    return;
                }

                // Hent audiobuffer
                this.analyser.getFloatTimeDomainData(buffer);
                const signalRms = PianoScanner.rms(buffer);

                // Ignorer rent digitalt stillhet
                if (signalRms < this.MIN_RMS) {
                    rafId = requestAnimationFrame(loop);
                    return;
                }

                // Kjør pitch-detektor
                const hz = this.detector.getPitch(buffer, sampleRate);

                if (hz > 0) {
                    // Er detektert frekvens nær forventet tast?
                    const semitonerBort = Math.abs(12 * Math.log2(hz / forventetHz));

                    if (semitonerBort <= this.GODKJENT_AVSTAND) {
                        // Registrer første treff-tidspunkt
                        if (førsteTreffTid === null) {
                            førsteTreffTid = performance.now();
                            toppRms = signalRms;
                        }

                        avlesninger.push({ hz, tid: tidBrukt, rms: signalRms });
                        if (signalRms > toppRms) toppRms = signalRms;

                        // Oppdater sanntids-UI
                        if (this.onNoteMalt) this.onNoteMalt(noteIndex, hz);

                        // Sjekk om vi har samlet nok data
                        const samletid = performance.now() - førsteTreffTid;

                        // Har vi 1 fullt sekund med data OG nok avlesninger?
                        if (samletid >= this.SAMLETID_MS && avlesninger.length >= this.STABIL_TERSKEL) {
                            _bekreft();
                            return;
                        }

                        // Har lyden dødd ut? (RMS falt under 15% av topp)
                        // Bare sjekk etter minst noen avlesninger
                        if (avlesninger.length >= this.STABIL_TERSKEL &&
                            signalRms < toppRms * this.RMS_FALLOFF) {
                            _bekreft();
                            return;
                        }

                    } else if (førsteTreffTid === null) {
                        // Feil tast FØR vi har begynt å sample — nullstill
                        avlesninger = [];
                    }
                    // Etter at sampling har startet, ignorer enkelt-frames med feil frekvens
                    // (kan skje ved overgang mellom toner)
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
            await this.skannNote(noteIndex);
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
     * 52 hvite taster fra A0 til C8.
     */
    _hviteTasterSekvens() {
        const hviteOffsets = [0, 2, 4, 5, 7, 9, 11];
        const sekvens = [];
        for (let okt = 0; okt <= 7; okt++) {
            for (const offset of hviteOffsets) {
                const midi = (okt + 1) * 12 + offset;
                if (midi >= 21 && midi <= 108) sekvens.push(midi - 21);
            }
        }
        return sekvens;
    }

    /**
     * Alle 88 taster fra A0 til C8.
     */
    _alleTasterSekvens() {
        const sekvens = [];
        for (let i = 0; i < 88; i++) sekvens.push(i);
        return sekvens;
    }
}
