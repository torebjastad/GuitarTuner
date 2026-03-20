// piano-scanner.js — Orkestrerer en fullstendig 88-tasters skanning.
// Bruker UltimateDetector som intern målemotor.
//
// Avhenger av: pitch-common.js (via shared/), ultimate-detector.js (via shared/)

'use strict';

/**
 * PianoScanner
 *
 * Koordinerer mikrofontilgang, UltimateDetector-kall og stabilitetslogikk
 * for å måle intonasjonsnøyaktigheten til alle taster på et piano.
 *
 * Bruk:
 *   const scanner = new PianoScanner();
 *   await scanner.startMikrofon();       // Må kalles fra en brukerinteraksjon
 *   scanner.onNoteBekreft = (i, r) => …;
 *   await scanner.skannAlle();
 */
class PianoScanner {
    constructor() {
        // Konfigurer UltimateDetector med litt strengere klarhetskontroll
        // enn standard (0.40 → 0.45) for å unngå falske avlesninger mellom taster.
        this.detector   = new UltimateDetector(0.93, 0.45);
        this.audioCtx   = null;
        this.analyser   = null;
        this.stream     = null;
        this.recorder   = null;
        this.isScanning = false;

        // Resultater: indeks 0 = A0 (MIDI 21), indeks 87 = C8 (MIDI 108)
        this.noteResultater = new Array(88).fill(null);

        // --- Konfigurering ---
        this.BUFFER_SIZE      = 8192;   // Matchet mot UltimateDetector.getRequiredBufferSize()
        this.STABIL_TERSKEL   = 8;      // Antall konsistente avlesninger kreves for bekreftelse
        this.MAKS_VENTETID_MS = 8000;   // Maks ventetid per tast (ms) før "ikke detektert"
        this.GODKJENT_AVSTAND = 0.35;   // Semitoner — innenfor dette anses tonen som riktig tast
        this.MIN_KLARHET      = 0.45;   // Minimumklarhet fra UltimateDetector

        // --- Callbacks til UI (sett av den som bruker klassen) ---
        /** Kalles for hvert gyldig målingsframe (sanntids-UI). @type {((noteIndex: number, hz: number) => void)|null} */
        this.onNoteMalt          = null;
        /** Kalles når en tast er stabil og bekreftet. @type {((noteIndex: number, resultat: object) => void)|null} */
        this.onNoteBekreft       = null;
        /** Kalles ved timeout (tast ikke detektert). @type {((noteIndex: number) => void)|null} */
        this.onNoteIkkeDetektert = null;
        /** Kalles når hele skanningen er fullført. @type {((noteResultater: Array) => void)|null} */
        this.onSkanningFullfort  = null;
        /** Kalles for å oppdatere fremdriftsvisningen. @type {((indeks: number, totalt: number) => void)|null} */
        this.onFremdrift         = null;

        // Privat: lydchunks fra MediaRecorder
        this._lydChunks = [];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Statiske hjelpemetoder
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returnerer idealfrekvensen (Hz) for noteIndex 0–87.
     * noteIndex 0 = A0 (MIDI 21), noteIndex 57 = A4 (440 Hz), noteIndex 87 = C8.
     * @param {number} noteIndex - 0-basert tastindeks
     * @returns {number} Idealfrekvens i Hz
     */
    static idealHz(noteIndex) {
        const midi = noteIndex + 21;
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    /**
     * Beregner frekvensinformasjon for en gitt Hz-verdi.
     * @param {number} hz - Frekvens i Hz
     * @returns {{ cents: number, midi: number, noteNavn: string, oktav: number, hz: number, ideell: number }|null}
     */
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

    // ─────────────────────────────────────────────────────────────────────────
    // Oppsett
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Starter mikrofon og oppsett AudioContext.
     * MÅ kalles fra en brukerinteraksjon (click/touch) på grunn av
     * nettleser-policyer for AudioContext og getUserMedia.
     *
     * @throws {DOMException} Hvis mikrofontilgang avvises (NotAllowedError)
     */
    async startMikrofon() {
        // Krev mikrofon uten behandlingsfiltere for best mulig nøyaktighet
        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl:  false,
                channelCount:     1
                // Merk: sampleRate-constraint ignoreres stille på iOS Safari.
                // Vi leser ctx.sampleRate etter opprettelse i stedet.
            }
        });

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // iOS Safari kan suspendere AudioContext automatisk — gjenoppta eksplisitt
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }

        // Koble mikrofon → AnalyserNode
        const kilde   = this.audioCtx.createMediaStreamSource(this.stream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = this.BUFFER_SIZE;
        kilde.connect(this.analyser);

        // Sett opp MediaRecorder for valgfritt lydopptak
        // iOS Safari støtter kun audio/mp4; Android/desktop støtter WebM/Opus
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/mp4';
        this.recorder    = new MediaRecorder(this.stream, { mimeType });
        this._lydChunks  = [];
        this.recorder.ondataavailable = (e) => {
            if (e.data.size > 0) this._lydChunks.push(e.data);
        };
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Kjerne-scanning
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Skannes én enkelt tast basert på noteIndex (0=A0 ... 87=C8).
     *
     * Prinsipp: Løper en RAF-loop og samler avlesninger fra UltimateDetector.
     * Når STABIL_TERSKEL konsistente avlesninger er nær forventet frekvens,
     * og standardavviket er < 0,5 % av gjennomsnittet, regnes tonen som bekreftet.
     * Timeout etter MAKS_VENTETID_MS.
     *
     * @param {number} noteIndex - 0-basert tastindeks
     * @returns {Promise<{noteIndex, status, hz, cents, midi, noteNavn, oktav, klarhet, antallAvlesninger}>}
     */
    skannNote(noteIndex) {
        return new Promise((resolve) => {
            const forventetHz = PianoScanner.idealHz(noteIndex);
            const buffer      = new Float32Array(this.BUFFER_SIZE);
            const sampleRate  = this.audioCtx.sampleRate;

            let avlesninger   = [];
            const startTid    = performance.now();
            let rafId         = null;

            const loop = () => {
                // Sjekk om skanningen er avbrutt
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

                // Timeout
                if (performance.now() - startTid > this.MAKS_VENTETID_MS) {
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

                // Hent audiobuffer og kjør pitch-detektor
                this.analyser.getFloatTimeDomainData(buffer);
                const hz = this.detector.getPitch(buffer, sampleRate);

                if (hz > 0) {
                    // Sjekk om detektert frekvens er nær forventet tast
                    const semitonerBort = Math.abs(12 * Math.log2(hz / forventetHz));

                    if (semitonerBort <= this.GODKJENT_AVSTAND) {
                        avlesninger.push(hz);

                        // Behold kun siste 2 × STABIL_TERSKEL avlesninger
                        if (avlesninger.length > this.STABIL_TERSKEL * 2) {
                            avlesninger.shift();
                        }

                        // Sjekk stabilitet: relativ standardavvik < 0,5 %
                        if (avlesninger.length >= this.STABIL_TERSKEL) {
                            const snitt   = avlesninger.reduce((a, b) => a + b, 0) / avlesninger.length;
                            const varians = avlesninger.reduce((s, v) => s + (v - snitt) ** 2, 0) / avlesninger.length;
                            const relStd  = Math.sqrt(varians) / snitt;

                            if (relStd < 0.005) {
                                // Stabil — bekreft tonen
                                cancelAnimationFrame(rafId);
                                const info    = PianoScanner.frekvensInfo(snitt);
                                const resultat = {
                                    noteIndex,
                                    status:            'bekreftet',
                                    hz:                snitt,
                                    cents:             info.cents,
                                    midi:              info.midi,
                                    noteNavn:          info.noteNavn,
                                    oktav:             info.oktav,
                                    klarhet:           Math.max(0, 1 - relStd * 200),
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
                        // Feil tast detektert — nullstill avlesninger
                        // (brukeren kan ha spilt en annen tast ved et uhell)
                        avlesninger = [];
                    }
                }

                rafId = requestAnimationFrame(loop);
            };

            rafId = requestAnimationFrame(loop);
        });
    }

    /**
     * Utfører en fullstendig skanning av alle taster i noteSekvens.
     * Standard er alle 52 hvite taster fra lav til høy (Alternativ A).
     *
     * @param {number[]|null} noteSekvens - Valgfri overstyring av skannesekvens
     */
    async skannAlle(noteSekvens = null) {
        const sekvens = noteSekvens ?? this._defaultSekvens();
        this.isScanning = true;

        // Start lydopptak (valgfritt — brukeren aktiverer dette separat via UI)
        if (this.recorder && this.recorder.state === 'inactive') {
            this.recorder.start(250);  // Chunk hvert 250ms for jevn minnebruk
        }

        for (let i = 0; i < sekvens.length; i++) {
            if (!this.isScanning) break;

            const noteIndex = sekvens[i];

            // Informer UI om fremdrift
            if (this.onFremdrift) this.onFremdrift(i, sekvens.length);

            await this.skannNote(noteIndex);
        }

        // Stopp lydopptak
        if (this.recorder && this.recorder.state === 'recording') {
            this.recorder.stop();
        }

        this.isScanning = false;

        if (this.onSkanningFullfort) {
            this.onSkanningFullfort(this.noteResultater);
        }
    }

    /**
     * Avbryter pågående skanning.
     */
    stopp() {
        this.isScanning = false;
        if (this.recorder && this.recorder.state === 'recording') {
            this.recorder.stop();
        }
    }

    /**
     * Frigjør Web Audio-ressurser. Skal kalles etter ferdig bruk.
     */
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

    /**
     * Returnerer lydopptaket som en Blob, eller null hvis ikke tilgjengelig.
     * @returns {Blob|null}
     */
    hentLydblob() {
        if (!this._lydChunks || this._lydChunks.length === 0) return null;
        const mimeType = this.recorder?.mimeType ?? 'audio/webm';
        return new Blob(this._lydChunks, { type: mimeType });
    }

    /**
     * Nullstiller resultatene for en ny skanning.
     */
    nullstill() {
        this.noteResultater = new Array(88).fill(null);
        this._lydChunks     = [];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Privat: Skannesekvens
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Standard skannesekvens: alle 52 hvite taster fra A0 til C8.
     * Hvite taster tilsvarer MIDI-offsets 0,2,4,5,7,9,11 (C D E F G A B).
     * Naturlig spilleflyt for pianoeieren: venstre til høyre.
     * @returns {number[]} Array av noteIndex-verdier (0-basert)
     */
    _defaultSekvens() {
        const hviteOffsets = [0, 2, 4, 5, 7, 9, 11];  // C D E F G A B (semitoner fra C)
        const sekvens      = [];

        for (let okt = 0; okt <= 7; okt++) {
            for (const offset of hviteOffsets) {
                // Beregn MIDI-note: MIDI 12 = C0, MIDI 21 = A0, MIDI 108 = C8
                const midi = (okt + 1) * 12 + offset;
                if (midi >= 21 && midi <= 108) {
                    sekvens.push(midi - 21);  // Konverter til 0-basert noteIndex
                }
            }
        }
        return sekvens;
    }
}
