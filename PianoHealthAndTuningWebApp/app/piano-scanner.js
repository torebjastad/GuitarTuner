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
        this.detector   = new UltimateDetector(0.93, 0.45);
        this.audioCtx   = null;
        this.analyser   = null;
        this.stream     = null;
        this.recorder   = null;
        this.isScanning = false;

        // Resultater: indeks 0 = A0 (MIDI 21), indeks 87 = C8 (MIDI 108)
        this.noteResultater = new Array(88).fill(null);

        // --- Konfigurering ---
        this.BUFFER_SIZE       = 8192;
        this.STABIL_TERSKEL    = 12;     // Minimum gode avlesninger for bekreftelse
        this.MIN_SAMLETID_MS   = 1500;   // Minimum samletid FØR tone kan bekreftes (ms)
        this.MAKS_VENTETID_MS  = 8000;   // Timeout per tast (ms)
        this.GODKJENT_AVSTAND  = 0.35;   // Halvtoner — innenfor dette = riktig tast
        this.MIN_KLARHET       = 0.45;   // Minimumklarhet fra UltimateDetector
        this.MIN_RMS           = 0.005;  // Minimum RMS for å akseptere en frame som gyldig signal
        this.MAKS_REL_STD      = 0.003;  // Maks relativ standardavvik for stabilitet (0.3%)

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
     * Forbedret algoritme:
     * 1. Samler avlesninger i minimum MIN_SAMLETID_MS millisekunder
     * 2. Krever at signalet har nok energi (RMS > MIN_RMS)
     * 3. Krever STABIL_TERSKEL gode avlesninger
     * 4. Bruker median av alle gode avlesninger (robust mot uteliggere)
     * 5. Krever relativ standardavvik < MAKS_REL_STD for stabilitet
     */
    skannNote(noteIndex) {
        return new Promise((resolve) => {
            const forventetHz = PianoScanner.idealHz(noteIndex);
            const buffer      = new Float32Array(this.BUFFER_SIZE);
            const sampleRate  = this.audioCtx.sampleRate;

            let avlesninger   = [];  // Alle gode Hz-avlesninger
            const startTid    = performance.now();
            let rafId         = null;

            const loop = () => {
                // Avbrutt?
                if (!this.isScanning) {
                    cancelAnimationFrame(rafId);
                    const resultat = {
                        noteIndex, status: 'avbrutt',
                        hz: null, cents: null, klarhet: 0
                    };
                    this.noteResultater[noteIndex] = resultat;
                    resolve(resultat);
                    return;
                }

                const tidBrukt = performance.now() - startTid;

                // Timeout
                if (tidBrukt > this.MAKS_VENTETID_MS) {
                    cancelAnimationFrame(rafId);
                    const resultat = {
                        noteIndex, status: 'ikke_detektert',
                        hz: null, cents: null, klarhet: 0
                    };
                    this.noteResultater[noteIndex] = resultat;
                    if (this.onNoteIkkeDetektert) this.onNoteIkkeDetektert(noteIndex);
                    resolve(resultat);
                    return;
                }

                // Hent audiobuffer
                this.analyser.getFloatTimeDomainData(buffer);

                // Sjekk signal-energi — ignorer frames med for lite lyd
                const signalRms = PianoScanner.rms(buffer);
                if (signalRms < this.MIN_RMS) {
                    // Stille / for svakt signal — fortsett å lytte
                    rafId = requestAnimationFrame(loop);
                    return;
                }

                // Kjør pitch-detektor
                const hz = this.detector.getPitch(buffer, sampleRate);

                if (hz > 0) {
                    // Er detektert frekvens nær forventet tast?
                    const semitonerBort = Math.abs(12 * Math.log2(hz / forventetHz));

                    if (semitonerBort <= this.GODKJENT_AVSTAND) {
                        avlesninger.push({ hz, tid: tidBrukt, rms: signalRms });

                        // Begrens buffer til siste 3 × STABIL_TERSKEL
                        if (avlesninger.length > this.STABIL_TERSKEL * 3) {
                            avlesninger.shift();
                        }

                        // Sjekk stabilitetskrav:
                        // 1) Minimum samletid oppnådd
                        // 2) Nok avlesninger
                        // 3) Relativ standardavvik lav nok
                        if (
                            tidBrukt >= this.MIN_SAMLETID_MS &&
                            avlesninger.length >= this.STABIL_TERSKEL
                        ) {
                            const hzVerdier = avlesninger.map(a => a.hz);
                            const medianHz  = PianoScanner.median(hzVerdier);
                            const snitt     = hzVerdier.reduce((a, b) => a + b, 0) / hzVerdier.length;
                            const varians   = hzVerdier.reduce((s, v) => s + (v - snitt) ** 2, 0) / hzVerdier.length;
                            const relStd    = Math.sqrt(varians) / snitt;

                            if (relStd < this.MAKS_REL_STD) {
                                // Stabil! Bruk median for robusthet
                                cancelAnimationFrame(rafId);
                                const info    = PianoScanner.frekvensInfo(medianHz);
                                const resultat = {
                                    noteIndex,
                                    status:            'bekreftet',
                                    hz:                medianHz,
                                    cents:             info.cents,
                                    midi:              info.midi,
                                    noteNavn:          info.noteNavn,
                                    oktav:             info.oktav,
                                    klarhet:           Math.max(0, 1 - relStd * 300),
                                    antallAvlesninger: avlesninger.length
                                };
                                this.noteResultater[noteIndex] = resultat;
                                if (this.onNoteBekreft) this.onNoteBekreft(noteIndex, resultat);
                                resolve(resultat);
                                return;
                            }
                        }

                        // Oppdater sanntids-UI underveis
                        if (this.onNoteMalt) this.onNoteMalt(noteIndex, hz);

                    } else {
                        // Feil tast — nullstill
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
