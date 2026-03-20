# Algoritme-integrasjonsplan — PianoHelse

**Versjon:** 1.0
**Dato:** 2026-03-20
**Forfatter:** Lead Developer

Denne planen beskriver i detalj hvordan `UltimateDetector` fra GuitarTuner-prosjektet adapteres for å drive piano-helseanalysen i PianoHelse. All referert kode gjelder eksisterende filer i `/c/Users/ToreGrüner/OneDrive/Code/GuitarTuner/`.

---

## 1. Bakgrunn: UltimateDetectors egnethet for piano

`UltimateDetector` er spesialdesignet for å dekke hele pianoets frekvensområde:

- **Frekvensområde:** A0 (27,5 Hz) til C8 (4186 Hz) — alle 88 taster
- **Frekvensoppløsning:** 65536-punkts FFT ved 48 kHz gir ~0,73 Hz per bin. Dette er tilstrekkelig for å skille halvtoner selv i det øvre registeret (C7=2093 Hz, C#7=2217 Hz, differanse = 124 Hz >> 0,73 Hz).
- **Lav-frekvens-nøyaktighet:** McLeod MPM (Stage 1) er tidsdomene-basert og håndterer A0–A2 bedre enn rent FFT-baserte detektorer fordi den direkte måler perioden via autokorrelasjon. Den eksisterende implementasjonen bruker 8192-samplers buffer (~170ms ved 48 kHz), noe som gir ~2,3 perioder for A0=27,5 Hz.
- **Inharmonisitet-robusthet:** Beslutningsmotor (Stage 3) bruker harmonisk verifisering med toleranse som øker med harmonisk nummer (`tol = baseTolerance + 0.005 * nearestN`). Dette er direkte relevant fordi piano-inharmonisitet (Railsback-effekten) gjør at overtoner avviker mer fra ideelle heltallsmultipla.

**Konklusjon:** `UltimateDetector.getPitch()` kan brukes uendret som målemotor. Tilpasningene er i orkestreringslogikken rundt detektoren.

---

## 2. Piano-skanneorkestrering: PianoScanner

### 2.1 Grunnleggende design

```javascript
// piano-scanner.js

/**
 * Orkestrerer en fullstendig 88-tasters skanning.
 * Bruker UltimateDetector som intern målemotor.
 *
 * Avhenger av: pitch-common.js, ultimate-detector.js
 */
class PianoScanner {
    constructor() {
        this.detector   = new UltimateDetector();
        this.audioCtx   = null;
        this.analyser   = null;
        this.stream     = null;
        this.recorder   = null;
        this.isScanning = false;

        // Resultater: indeks 0 = A0, indeks 87 = C8
        this.noteResultater = new Array(88).fill(null);

        // Konfigurering
        this.BUFFER_SIZE      = 8192;  // Matchet mot UltimateDetector.getRequiredBufferSize()
        this.STABIL_TERSKEL   = 8;     // Antall konsistente avlesninger kreves
        this.MAKS_VENTETID_MS = 8000;  // Maks tid per tast før "ikke detektert"
        this.GODKJENT_AVSTAND = 0.35;  // Semitoner — innenfor dette regnes det som riktig tast
        this.MIN_KLARHET      = 0.45;  // UltimateDetector smallCutoff (default 0.40, litt strengere)

        // Callbacks til UI
        this.onNoteMalt         = null;  // (noteIndex, rezultat) => void
        this.onNoteBekreft      = null;  // (noteIndex) => void
        this.onNoteIkkeDetektert = null; // (noteIndex) => void
        this.onSkanningFullfort  = null; // (noteResultater) => void
    }

    /**
     * Returnerer idealfrekvensen for MIDI-note 21 (A0) til 108 (C8).
     * MIDI 21 = A0, MIDI 69 = A4 (440 Hz), MIDI 108 = C8
     */
    static idealHz(noteIndex) {
        const midi = noteIndex + 21;
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    /**
     * Konverterer frekvens til antall cent avvik fra nærmeste halvtone.
     * Returnerer { cents, midi, noteNavn }
     */
    static frekvensInfo(hz) {
        if (hz <= 0) return null;
        const noteNum = 12 * Math.log2(hz / 440);
        const midi    = Math.round(noteNum) + 69;
        const ideell  = 440 * Math.pow(2, (midi - 69) / 12);
        const cents   = 1200 * Math.log2(hz / ideell);
        const noteNavn = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'][midi % 12];
        const oktav    = Math.floor(midi / 12) - 1;
        return { cents, midi, noteNavn, oktav, hz, ideell };
    }

    /**
     * Starter mikrofon og oppsett AudioContext.
     * MÅ kalles fra en brukerinteraksjon (click/touch).
     */
    async startMikrofon() {
        this.stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation:  false,
                noiseSuppression:  false,
                autoGainControl:   false,
                channelCount:      1
                // sampleRate: { ideal: 48000 }  — sett dette kun på Android/desktop.
                // iOS Safari ignorerer sampleRate stille; vi leser ctx.sampleRate etter opprettelse.
            }
        });

        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.audioCtx.state === 'suspended') {
            await this.audioCtx.resume();
        }

        const kilde    = this.audioCtx.createMediaStreamSource(this.stream);
        this.analyser  = this.audioCtx.createAnalyser();
        this.analyser.fftSize = this.BUFFER_SIZE;
        kilde.connect(this.analyser);

        // Sett opp MediaRecorder for lydopptak (valgfritt, kun hvis bruker samtykker)
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
            ? 'audio/webm;codecs=opus'
            : 'audio/mp4';
        this.recorder = new MediaRecorder(this.stream, { mimeType });
        this._lydChunks = [];
        this.recorder.ondataavailable = (e) => {
            if (e.data.size > 0) this._lydChunks.push(e.data);
        };
    }

    /**
     * Skannes én enkelt tast basert på noteIndex (0=A0 ... 87=C8).
     *
     * Prinsipp: Løper en RAF-loop og samler avlesninger fra UltimateDetector.
     * Når STABIL_TERSKEL konsistente avlesninger er nær forventet frekvens, regnes
     * tonen som bekreftet. Timeout etter MAKS_VENTETID_MS.
     *
     * Returnerer et Promise<NoteResultat> som resolves når tonen er bekreftet eller
     * timeout inntreffer.
     */
    skannNote(noteIndex) {
        return new Promise((resolve) => {
            const forventetHz  = PianoScanner.idealHz(noteIndex);
            const buffer       = new Float32Array(this.BUFFER_SIZE);
            const sampleRate   = this.audioCtx.sampleRate;

            let avlesninger    = [];
            let startTid       = performance.now();
            let rafId          = null;

            const loop = () => {
                const naa = performance.now();
                if (naa - startTid > this.MAKS_VENTETID_MS) {
                    cancelAnimationFrame(rafId);
                    const resultat = { noteIndex, status: 'ikke_detektert', hz: null, cents: null, klarhet: 0 };
                    this.noteResultater[noteIndex] = resultat;
                    if (this.onNoteIkkeDetektert) this.onNoteIkkeDetektert(noteIndex);
                    resolve(resultat);
                    return;
                }

                this.analyser.getFloatTimeDomainData(buffer);
                const hz = this.detector.getPitch(buffer, sampleRate);

                if (hz > 0) {
                    // Sjekk om detektert frekvens er nær forventet tast
                    // "Nær" = innenfor GODKJENT_AVSTAND semitoner
                    const semitonerBort = Math.abs(12 * Math.log2(hz / forventetHz));
                    if (semitonerBort <= this.GODKJENT_AVSTAND) {
                        avlesninger.push(hz);

                        // Hold kun siste 2 * STABIL_TERSKEL avlesninger
                        if (avlesninger.length > this.STABIL_TERSKEL * 2) {
                            avlesninger.shift();
                        }

                        // Beregn klarhet som konvergens: std/gjennomsnitt < 0.5%
                        if (avlesninger.length >= this.STABIL_TERSKEL) {
                            const snitt = avlesninger.reduce((a, b) => a + b, 0) / avlesninger.length;
                            const varians = avlesninger.reduce((s, v) => s + (v - snitt) ** 2, 0) / avlesninger.length;
                            const relStd = Math.sqrt(varians) / snitt;

                            if (relStd < 0.005) {  // <0,5% standardavvik → stabil
                                cancelAnimationFrame(rafId);
                                const info    = PianoScanner.frekvensInfo(snitt);
                                const resultat = {
                                    noteIndex,
                                    status:    'bekreftet',
                                    hz:        snitt,
                                    cents:     info.cents,
                                    midi:      info.midi,
                                    noteNavn:  info.noteNavn,
                                    oktav:     info.oktav,
                                    klarhet:   Math.max(0, 1 - relStd * 200),  // 0–1 skala
                                    antallAvlesninger: avlesninger.length
                                };
                                this.noteResultater[noteIndex] = resultat;
                                if (this.onNoteBekreft) this.onNoteBekreft(noteIndex, resultat);
                                resolve(resultat);
                                return;
                            }
                        }

                        // Oppdater UI underveis
                        if (this.onNoteMalt) this.onNoteMalt(noteIndex, hz);
                    } else {
                        // Feil tast spilt — informer UI, men ikke forkast avlesninger
                        // (brukeren kan ha spilt en annen tast ved et uhell)
                        avlesninger = [];  // Nullstill for å kreve ny stabilitetsperiode
                    }
                }

                rafId = requestAnimationFrame(loop);
            };

            rafId = requestAnimationFrame(loop);
        });
    }

    /**
     * Utfører en fullstendig skanning av alle 88 taster i rekkefølge.
     * noteSekvens kan overstyres for delvis skanning eller tilpasset rekkefølge.
     */
    async skannAlle(noteSekvens = null) {
        const sekvens = noteSekvens ?? this._defaultSekvens();
        this.isScanning = true;

        if (this.recorder && this.recorder.state === 'inactive') {
            this.recorder.start(250);  // Chunk hvert 250ms
        }

        for (const noteIndex of sekvens) {
            if (!this.isScanning) break;
            await this.skannNote(noteIndex);
        }

        if (this.recorder && this.recorder.state === 'recording') {
            this.recorder.stop();
        }

        this.isScanning = false;
        if (this.onSkanningFullfort) {
            this.onSkanningFullfort(this.noteResultater);
        }
    }

    stopp() {
        this.isScanning = false;
    }

    /**
     * Standard skannesekvens: alle hvite taster fra lav til høy.
     * 52 hvite taster dekker hele registeret med naturlig spilleflyt for pianoeieren.
     * MIDI for hvite taster: C D E F G A B per oktav
     */
    _defaultSekvens() {
        const hviteOffsets = [0, 2, 4, 5, 7, 9, 11];  // C D E F G A B
        const sekvens = [];
        for (let okt = 0; okt <= 7; okt++) {
            for (const offset of hviteOffsets) {
                const midi = (okt + 1) * 12 + offset;  // MIDI 12=C0, 21=A0
                if (midi >= 21 && midi <= 108) {
                    sekvens.push(midi - 21);  // Konverter til noteIndex (0-87)
                }
            }
        }
        return sekvens;
    }

    /**
     * Returnerer lydopptaket som en Blob, eller null hvis ikke tilgjengelig.
     */
    hentLydblob() {
        if (!this._lydChunks || this._lydChunks.length === 0) return null;
        const mimeType = this.recorder?.mimeType ?? 'audio/webm';
        return new Blob(this._lydChunks, { type: mimeType });
    }
}
```

### 2.2 Anbefalt skannesekvens

For en piano-helseskanning er det to logiske sekvensmønstre:

**Alternativ A: Alle hvite taster lav-til-høy (anbefalt for MVP)**
- 52 taster å spille, naturlig for pianoeier
- Dekker alle oktaver og gir god dekning av Railsback-kurven
- Enkelt å forklare i UI: "Spill alle hvite taster fra venstre til høyre"
- Mangler: Ingen svarte taster, men for helsevurdering er dette tilstrekkelig

**Alternativ B: Kvartoktav-fordelt (alle 88 taster)**
- Gir fullstendig Railsback-analyse
- For manuelt opplegg er 88 taster mye å be om
- Anbefalt for fremtidig "Pro-skanning"-funksjon

**Implementert sekvens i MVP:** Alternativ A (52 hvite taster).

---

## 3. Helsepoengalgoritme

### 3.1 Inndataformat

Etter en fullstendig skanning har vi en liste `noteResultater[0..87]` der hvert element enten er:
- `{ status: 'bekreftet', hz, cents, klarhet }` — vellykket måling
- `{ status: 'ikke_detektert' }` — timeout/ikke spilt
- `null` — ikke forsøkt (hvis delvis skanning)

### 3.2 Scoringsalgoritme

```javascript
// health-scorer.js

class HealthScorer {
    /**
     * Beregner helsescore og klassifisering fra note-resultater.
     *
     * Vekting: Midterste register (oktav 3–5) vektes mer fordi:
     * 1. Det er registeret pianostemmer jobber mest med
     * 2. Det er der de fleste sanger og stykker primært befinner seg
     * 3. Ørene er mest sensitive for unøyaktighet i 500–2000 Hz-området
     *
     * Returner: { score, status, detaljer }
     */
    static score(noteResultater) {
        const bekreftede = noteResultater.filter(r => r?.status === 'bekreftet');

        if (bekreftede.length < 5) {
            return {
                score: null,
                status: 'utilstrekkelig_data',
                detaljer: { bekreftede: bekreftede.length, total: noteResultater.length }
            };
        }

        // Vektfunksjon: Gaussisk klokke sentrert på A4 (noteIndex 57 = A4)
        // Bredde = 3 oktaver (36 halvtoner)
        const vekt = (noteIndex) => {
            const A4_INDEX = 57;
            const avstand  = noteIndex - A4_INDEX;
            return Math.exp(-(avstand * avstand) / (2 * 36 * 36));
        };

        let vektetSumAvvik = 0;
        let totalVekt      = 0;
        let maksAvvik      = 0;
        let antallKritiske = 0;  // > 20 cent avvik
        let antallAdvarsel = 0;  // > 10 cent avvik

        for (const r of bekreftede) {
            const absoluttCents = Math.abs(r.cents);
            const w = vekt(r.noteIndex) * r.klarhet;  // Klarhet som tilleggsgevinst

            vektetSumAvvik += absoluttCents * w;
            totalVekt      += w;

            if (absoluttCents > maksAvvik) maksAvvik = absoluttCents;
            if (absoluttCents > 20) antallKritiske++;
            else if (absoluttCents > 10) antallAdvarsel++;
        }

        const gjennomsnittAvvik = totalVekt > 0 ? vektetSumAvvik / totalVekt : 0;

        // Helsescore: 100 = perfekt, 0 = fullstendig avsporet
        // Funksjon: 100 * exp(-gjennomsnitt / 15)
        // Tolkningstabell:
        //   100  → 0 cent gjennomsnitt (teoretisk perfekt)
        //   85   → ~2,5 cent gjennomsnitt (profesjonelt stemt)
        //   70   → ~5 cent gjennomsnitt (akseptabelt)
        //   50   → ~10 cent gjennomsnitt (trenger tilsyn)
        //   30   → ~18 cent gjennomsnitt (kritisk)
        const score = 100 * Math.exp(-gjennomsnittAvvik / 15);

        // Statusklassifisering
        let status;
        if (score >= 70 && antallKritiske === 0) {
            status = 'god';
        } else if (score >= 45 && antallKritiske <= 3) {
            status = 'trenger_tilsyn';
        } else {
            status = 'kritisk';
        }

        return {
            score: Math.round(score * 10) / 10,
            status,
            detaljer: {
                gjennomsnittAvvik: Math.round(gjennomsnittAvvik * 10) / 10,
                maksAvvik:         Math.round(maksAvvik * 10) / 10,
                antallKritiske,
                antallAdvarsel,
                bekreftede:        bekreftede.length,
                total:             noteResultater.filter(r => r !== null).length,
                dekning:           Math.round(bekreftede.length / 88 * 100)  // % av 88 taster
            }
        };
    }
}
```

### 3.3 Terskelkalibrering

Tersklene over er utledet fra faglig kunnskap om pianostemming:

| Scenario | Typisk gjennomsnittlig avvik | Score |
|---|---|---|
| Nystemt av profesjonell (±2 ct) | 1–3 cent | 85–93 |
| Hjemmepiano, stemt for 12 mnd siden | 3–7 cent | 63–85 |
| Ukjent historikk, normalt slitasje | 7–15 cent | 37–63 |
| Lenge siden sist stemt, synlig stikkproblem | >15 cent | <37 |
| Krever løfting (pitch raise) | >25 cent mange toner | <20 |

---

## 4. Stemningskurve-generering

### 4.1 Hva en stemningskurve er

En stemningskurve viser avvik fra 12-TET (temperert stemming) for hver målte tone, plottet mot toneposisjon (bassregister til diskantregister). En godt stemt piano har en karakteristisk S-kurve (Railsback-kurven) der bass-toner er litt lavere og diskant-toner er litt høyere enn teoretisk temperert stemming — dette er en akustisk nødvendighet fordi piano-strenger er inharmoniske.

### 4.2 JSON-format for stemningskurve

```javascript
// tuning-curve.js

class TuningCurve {
    static generer(noteResultater) {
        const kurve = {};
        const chartLabels = [];
        const chartData   = [];
        const chartKolorer = [];

        for (let i = 0; i < 88; i++) {
            const r = noteResultater[i];
            if (!r || r.status !== 'bekreftet') continue;

            const midi     = i + 21;
            const noteNavn = r.noteNavn + r.oktav;
            const nøkkel   = noteNavn;  // F.eks. "A4", "C3"

            kurve[nøkkel] = {
                noteIndex: i,
                midi,
                hz:      Math.round(r.hz * 100) / 100,
                ideell:  Math.round(PianoScanner.idealHz(i) * 100) / 100,
                cents:   Math.round(r.cents * 10) / 10,
                klarhet: Math.round(r.klarhet * 1000) / 1000
            };

            chartLabels.push(noteNavn);
            chartData.push(Math.round(r.cents * 10) / 10);

            // Fargekoding: grønn (innenfor 5 ct), gul (5–15 ct), rød (>15 ct)
            const abs = Math.abs(r.cents);
            chartKolorer.push(
                abs <= 5  ? 'rgba(40, 200, 120, 0.8)'   :
                abs <= 15 ? 'rgba(255, 180, 30, 0.8)'   :
                            'rgba(220, 60, 60, 0.8)'
            );
        }

        // Chart.js dataset-konfigurasjon
        const chartConfig = {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: 'Avvik (cent)',
                    data: chartData,
                    borderColor: 'rgba(100, 160, 255, 0.9)',
                    backgroundColor: chartKolorer,
                    pointBackgroundColor: chartKolorer,
                    pointRadius: 4,
                    tension: 0.2,
                    fill: false
                }, {
                    // Railsback-referanselinje (ideell strekningskurve)
                    label: 'Railsback-referanse',
                    data: chartLabels.map((_, i) => TuningCurve._railsbackRef(chartLabels, i)),
                    borderColor: 'rgba(200, 200, 200, 0.3)',
                    borderDash: [4, 4],
                    pointRadius: 0,
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: true },
                    tooltip: {
                        callbacks: {
                            label: (ctx) => `${ctx.parsed.y > 0 ? '+' : ''}${ctx.parsed.y} cent`
                        }
                    }
                },
                scales: {
                    y: {
                        title: { display: true, text: 'Avvik fra temperert stemming (cent)' },
                        min: -60,
                        max: 60,
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    x: {
                        title: { display: true, text: 'Tone' },
                        ticks: { maxTicksLimit: 20 }
                    }
                }
            }
        };

        return { kurve, chartConfig };
    }

    /**
     * Forenklet Railsback-referanselinje.
     * Basert på empirisk Railsback-kurvedata:
     * - A0: ca. -30 cent under 12-TET
     * - A4: ca. 0 (referansepunkt)
     * - C8: ca. +30 cent over 12-TET
     * Modellert som en kubisk kurve.
     */
    static _railsbackRef(labels, i) {
        // Normaliser posisjon: -1 (bass) til +1 (diskant)
        const pos = (i / Math.max(labels.length - 1, 1)) * 2 - 1;
        // Kubisk modell: 30 * pos^3 (forenklet)
        return Math.round(30 * Math.pow(pos, 3) * 10) / 10;
    }
}
```

---

## 5. Railsback-avviksanalyse

### 5.1 Hva vi analyserer

Etter å ha generert stemningskurven, beregner vi for hvert registersegment (oktav) det gjennomsnittlige avviket fra den ideelle Railsback-kurven. Et piano som er jevnt stemt etter Railsback-profilen vil vise minimal avvik, mens et piano som er stemt "flatt" i diskanten eller "skarpt" i bassen vil avvike.

### 5.2 Implementasjon

```javascript
static railsbackAnalyse(kurve) {
    const OKTAVER = [
        { navn: 'A0–B1',  midiMin: 21, midiMaks: 35 },
        { navn: 'C2–B2',  midiMin: 36, midiMaks: 47 },
        { navn: 'C3–B3',  midiMin: 48, midiMaks: 59 },
        { navn: 'C4–B4',  midiMin: 60, midiMaks: 71 },
        { navn: 'C5–B5',  midiMin: 72, midiMaks: 83 },
        { navn: 'C6–B6',  midiMin: 84, midiMaks: 95 },
        { navn: 'C7–C8',  midiMin: 96, midiMaks: 108 }
    ];

    const resultat = {};
    for (const okt of OKTAVER) {
        const toner = Object.values(kurve).filter(
            t => t.midi >= okt.midiMin && t.midi <= okt.midiMaks
        );
        if (toner.length < 2) continue;

        const gjSnitt    = toner.reduce((s, t) => s + t.cents, 0) / toner.length;
        const railsRef   = TuningCurve._railsbackRef(
            ['dummy'], (okt.midiMin + okt.midiMaks) / 2 / 87
        );
        const avvikFraRailsback = gjSnitt - railsRef;

        resultat[okt.navn] = {
            gjennomsnittCents:    Math.round(gjSnitt * 10) / 10,
            railsbackRef:         Math.round(railsRef * 10) / 10,
            avvikFraRailsback:    Math.round(avvikFraRailsback * 10) / 10,
            antallToner:          toner.length
        };
    }
    return resultat;
}
```

---

## 6. Konfidensscore per tone

Konfidensskoren er et sammensatt mål som forteller stemmer (og bruker) hvor pålitelig en enkelt tonemåling er:

```
Konfidensberegning:
  base_confidence = klarhet (fra PianoScanner, 0–1)
  antall_faktor   = min(antallAvlesninger / STABIL_TERSKEL, 1.0)
  avvik_faktor    = 1.0 hvis |cents| < 50, ellers 0.5 (for store avvik er mer usikre)
  konfidensScore  = base_confidence × antall_faktor × avvik_faktor
```

Stemmer-portalen viser konfidensskoren som en fargeindikator ved siden av hvert datapunkt på kurvediagrammet. Datapunkter med lav konfidensScore (<0,5) vises med stiplet kontur og et "!" ikon for å informere stemmer om at akkurat den tonen bør kontrolleres manuelt.

---

## 7. Tilpasning av UltimateDetector for pianobruk

Kun to konfigurasjonsendringer fra standardverdiene er anbefalt:

### 7.1 `smallCutoff` økes fra 0,40 til 0,45

Standardverdien er valgt for gitarapplikasjonen der noen opptak kan ha lav signalstyrke. For piano-scanning kontrollerer vi at brukeren aktivt spiller — vi trenger en litt strengere klarhetskontroll for å unngå falske avlesninger mellom taster.

```javascript
const detector = new UltimateDetector(0.93, 0.45);
```

### 7.2 `decisionFreq` beholdes på 1000 Hz (standardverdi)

Under 1000 Hz dominerer MPM (McLeod) — dette er riktig for bassregisteret. Over 1000 Hz aktiveres beslutningsmotor for å sammenligne MPM vs spektralt peak. Dette er passende for piano der høydiskanttoner (C7 = 2093 Hz, C8 = 4186 Hz) er utfordrende for tidsdomene-algoritmer.

### 7.3 Buffer-størrelse forblir 8192

`UltimateDetector.getRequiredBufferSize()` returnerer 8192. Ved 48 kHz er dette 170ms per buffer. For piano-scanning er dette akseptabelt — brukeren holder noten et par sekunder, og vi trenger ~1 sekund (6–8 buffers) for stabilitetsbekreftelse.

### 7.4 Ingen MAX_FREQUENCY-begrensning

`UltimateDetector` har allerede ingen øvre frekvensgrense (kommentert i koden: "no upper limit for piano range"). Dette er korrekt — C8 = 4186 Hz er langt innenfor detektorens rekkevidde (søker opp til 10 000 Hz i Stage 2).

---

## 8. Ytelsesbudsjettering

| Operasjon | Estimert tid | Plattform |
|---|---|---|
| `UltimateDetector.getPitch()` — Stage 2 FFT (65536 pt) | ~5–15ms | Desktop Chrome |
| `UltimateDetector.getPitch()` — Stage 2 FFT (65536 pt) | ~30–80ms | Android mid-range |
| `UltimateDetector.getPitch()` — Stage 2 FFT (65536 pt) | ~20–50ms | iPhone 13+ |
| `AnalyserNode.getFloatTimeDomainData()` (8192 samples) | <1ms | Alle plattformer |
| Én nøkkelmålingssyklus (8 stabile avlesninger) | ~1–2 sekunder | Alle plattformer |
| Komplett skanning (52 hvite taster) | ~5–10 min | Inkl. brukerinteraksjon |

**Konklusjon:** `UltimateDetector` er rask nok for piano-scanning. RAF-loopen kjøres på ~60fps, men siden vi venter på brukeren (spille tangenttoner), er CPU-last lav det meste av skannetiden. For defensiv kodepraksis: sett en `setTimeout(loop, 16)` i stedet for ren RAF på veldig gamle Android-enheter (kan oppdages via `navigator.hardwareConcurrency < 4`).
