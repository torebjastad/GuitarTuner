// tuning-curve.js — Genererer stemningskurvedata og Chart.js-konfigurasjon.
// Inkluderer Railsback-referanselinje og per-oktav-avviksanalyse.
//
// Avhenger av: piano-scanner.js (PianoScanner.idealHz)
// Eksternt: Chart.js (brukes av StemningskurveKomponent i komponenter)

'use strict';

/**
 * TuningCurve
 *
 * Produserer to ting fra PianoScanner-resultater:
 * 1. Et kurve-JSON-objekt (noteNavn → detaljdata) for lagring/API
 * 2. En komplett Chart.js-konfigurasjon for umiddelbar visualisering
 *
 * Railsback-kurven:
 * Et godt stemt piano er IKKE stemt til ren 12-TET (temperert stemming).
 * Piano-strenger er inharmoniske: overtoner avviker oppover fra ideelle heltallsmultipla.
 * For å oppnå harmonisk samklang må bass-toner stemmes litt lavere og diskant-toner
 * litt høyere enn 12-TET — dette kalles "stretch tuning" eller Railsback-kurven.
 * Referansen her er en forenklet kubisk modell (±30 cent fra bass til diskant).
 */
class TuningCurve {

    /**
     * Genererer stemningskurvedata og Chart.js-konfigurasjon.
     *
     * @param {Array} noteResultater - Array[88] med NoteResultat fra PianoScanner
     * @returns {{ kurve: object, chartConfig: object }}
     */
    static generer(noteResultater) {
        const kurve        = {};
        const chartLabels  = [];
        const chartData    = [];
        const chartKolorer = [];
        const noteIndices  = [];

        for (let i = 0; i < 88; i++) {
            const r = noteResultater[i];
            if (!r || r.status !== 'bekreftet') continue;

            const midi     = i + 21;
            const noteNavn = r.noteNavn + r.oktav;   // F.eks. "A4", "C3", "C#5"

            kurve[noteNavn] = {
                noteIndex: i,
                midi,
                hz:      Math.round(r.hz * 100) / 100,
                ideell:  Math.round(PianoScanner.idealHz(i) * 100) / 100,
                cents:   Math.round(r.cents * 10) / 10,
                klarhet: Math.round(r.klarhet * 1000) / 1000
            };

            chartLabels.push(noteNavn);
            chartData.push(Math.round(r.cents * 10) / 10);
            noteIndices.push(i);

            // Fargekoding etter absolutt avvik fra temperert stemming:
            // Grønn ≤ 5 cent, Amber 5–15 cent, Rød > 15 cent
            const abs = Math.abs(r.cents);
            chartKolorer.push(
                abs <= 5  ? 'rgba(26, 122, 74, 0.85)'  :   // Suksess-grønn
                abs <= 15 ? 'rgba(196, 123, 0, 0.85)'  :   // Advarsel-amber
                            'rgba(185, 28, 28, 0.85)'       // Fare-rød
            );
        }

        // Generer Railsback-referanselinje for samme note-posisjoner
        const railsbackData = noteIndices.map(i => TuningCurve._railsbackRef(i));

        // Dynamisk y-akse: minst ±50 cent, utvid hvis data krever det
        const maksCent = chartData.length > 0
            ? Math.max(50, Math.ceil(Math.max(...chartData.map(Math.abs)) / 10) * 10 + 10)
            : 50;

        // Chart.js dataset-konfigurasjon
        const chartConfig = {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        // Faktisk stemningskurve
                        label:                'Målt avvik (cent)',
                        data:                 chartData,
                        borderColor:          'rgba(59, 130, 246, 0.95)',
                        backgroundColor:      'rgba(59, 130, 246, 0.08)',
                        pointBackgroundColor: chartKolorer,
                        pointBorderColor:     chartKolorer,
                        pointRadius:          5,
                        pointHoverRadius:     7,
                        borderWidth:          2.5,
                        tension:              0.2,
                        fill:                 { target: { value: 0 }, above: 'rgba(59, 130, 246, 0.10)', below: 'rgba(59, 130, 246, 0.10)' }
                    },
                    {
                        // Railsback-referanselinje (ideell strekningskurve)
                        label:           'Railsback-referanse (ideell stretch)',
                        data:            railsbackData,
                        borderColor:     'rgba(255, 200, 60, 0.7)',
                        borderDash:      [8, 4],
                        borderWidth:     2.5,
                        pointRadius:     0,
                        tension:         0.4,
                        fill:            false
                    }
                ]
            },
            options: {
                responsive:          true,
                maintainAspectRatio: false,
                animation: {
                    // Stemningskurven animerer inn punkt for punkt (500ms total)
                    // for å gi en følelse av at analysen "avslører" resultatet
                    duration: 500,
                    easing:   'easeOutQuart'
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color:    '#374151',
                            font:     { family: 'Inter', size: 12 },
                            padding:  16,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10, 15, 26, 0.92)',
                        titleColor:      '#F9FAFB',
                        bodyColor:       '#D1D5DB',
                        borderColor:     '#374151',
                        borderWidth:     1,
                        padding:         10,
                        callbacks: {
                            title: (ctx) => ctx[0].label,
                            label: (ctx) => {
                                if (ctx.datasetIndex === 1) {
                                    return `Railsback-ref: ${ctx.parsed.y > 0 ? '+' : ''}${ctx.parsed.y} ¢`;
                                }
                                const v = ctx.parsed.y;
                                const tegn = v > 0 ? '+' : '';
                                return `Avvik: ${tegn}${v} cent`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text:    'Avvik fra temperert stemming (cent)',
                            color:   '#6B7280',
                            font:    { family: 'Inter', size: 12, weight: '500' }
                        },
                        min:  -maksCent,
                        max:   maksCent,
                        ticks: {
                            stepSize:  10,
                            color:    '#4B5563',
                            font:     { family: 'JetBrains Mono', size: 11 },
                            callback: (v) => `${v > 0 ? '+' : ''}${v}¢`,
                            includeBounds: true
                        },
                        grid: {
                            color: (ctx) => {
                                const v = ctx.tick.value;
                                if (v === 0)                    return 'rgba(220, 38, 38, 0.8)';   // Nullinje — sterk rød
                                if (v === 10 || v === -10)      return 'rgba(22, 163, 74, 0.35)';  // ±10¢ — grønn sone
                                if (v === 20 || v === -20)      return 'rgba(234, 179, 8, 0.5)';   // ±20¢ — amber advarsel
                                return 'rgba(209, 213, 219, 0.2)';
                            },
                            lineWidth: (ctx) => {
                                const v = ctx.tick.value;
                                if (v === 0)                    return 2.5;
                                if (Math.abs(v) === 10)         return 1.5;
                                if (Math.abs(v) === 20)         return 2;
                                return 0.8;
                            }
                        },
                        border: { color: 'rgba(107, 114, 128, 0.3)' }
                    },
                    x: {
                        title: {
                            display: true,
                            text:    'Tone',
                            color:   '#6B7280',
                            font:    { family: 'Inter', size: 11 }
                        },
                        ticks: {
                            color:         '#6B7280',
                            font:          { family: 'Inter', size: 10 },
                            maxTicksLimit: 24,
                            maxRotation:   45
                        },
                        grid: {
                            color: 'rgba(209, 213, 219, 0.15)'
                        }
                    }
                }
            }
        };

        return { kurve, chartConfig };
    }

    /**
     * Forenklet Railsback-referanselinje for noteIndex 0–87.
     *
     * Basert på empirisk Railsback-kurvedata:
     * - A0 (noteIndex 0):  ca. −30 cent under 12-TET
     * - A4 (noteIndex 57): ca. 0 (referansepunkt)
     * - C8 (noteIndex 87): ca. +30 cent over 12-TET
     *
     * Modellert som en normalisert kubisk kurve: 30 × t³
     * der t ∈ [−1, +1] fra noteIndex 0 til 87.
     *
     * @param {number} noteIndex - 0-basert tastindeks
     * @returns {number} Forventet cent-avvik per Railsback-kurven
     */
    static _railsbackRef(noteIndex) {
        const t = (noteIndex / 87) * 2 - 1;  // Normaliser til [−1, +1]
        return Math.round(30 * Math.pow(t, 3) * 10) / 10;
    }

    /**
     * Analyse av avvik fra Railsback-kurven per oktav.
     *
     * En piano stemt etter Railsback-profilen vil vise minimalt avvik fra referansen.
     * Et piano som er stemt flatt i diskanten eller skarpt i bassen vil avvike tydelig.
     *
     * @param {object} kurve - Kurve-objektet fra TuningCurve.generer()
     * @returns {object} Per-oktav analyse: { 'A0–B1': { gjennomsnittCents, railsbackRef, avvikFraRailsback, antallToner }, … }
     */
    static railsbackAnalyse(kurve) {
        const OKTAVER = [
            { navn: 'A0–B1',  midiMin: 21,  midiMaks: 35  },
            { navn: 'C2–B2',  midiMin: 36,  midiMaks: 47  },
            { navn: 'C3–B3',  midiMin: 48,  midiMaks: 59  },
            { navn: 'C4–B4',  midiMin: 60,  midiMaks: 71  },
            { navn: 'C5–B5',  midiMin: 72,  midiMaks: 83  },
            { navn: 'C6–B6',  midiMin: 84,  midiMaks: 95  },
            { navn: 'C7–C8',  midiMin: 96,  midiMaks: 108 }
        ];

        const resultat = {};

        for (const okt of OKTAVER) {
            const toner = Object.values(kurve).filter(
                t => t.midi >= okt.midiMin && t.midi <= okt.midiMaks
            );
            if (toner.length < 2) continue;

            const gjSnitt = toner.reduce((s, t) => s + t.cents, 0) / toner.length;

            // Bruker midterste noteIndex i oktaven for Railsback-referansen
            const midtMidi     = (okt.midiMin + okt.midiMaks) / 2;
            const midtNoteIdx  = midtMidi - 21;
            const railsRef     = TuningCurve._railsbackRef(midtNoteIdx);

            const avvikFraRailsback = gjSnitt - railsRef;

            resultat[okt.navn] = {
                gjennomsnittCents:   Math.round(gjSnitt * 10) / 10,
                railsbackRef:        Math.round(railsRef * 10) / 10,
                avvikFraRailsback:   Math.round(avvikFraRailsback * 10) / 10,
                antallToner:         toner.length
            };
        }

        return resultat;
    }

    /**
     * Lager en mørk-modus versjon av Chart.js-konfigurasjonen.
     * Muterer originalen direkte (unngår JSON.stringify som dreper callbacks).
     *
     * @param {object} chartConfig - Basis-config fra TuningCurve.generer()
     * @returns {object} Samme config, tilpasset mørk modus
     */
    static morkModusConfig(chartConfig) {
        // Hovedlinje: lysere blå for mørk bakgrunn
        if (chartConfig.data?.datasets?.[0]) {
            chartConfig.data.datasets[0].borderColor = 'rgba(96, 165, 250, 0.9)';
        }
        // Railsback-referanse: varmere gul for mørk bakgrunn
        if (chartConfig.data?.datasets?.[1]) {
            chartConfig.data.datasets[1].borderColor = 'rgba(255, 210, 80, 0.75)';
        }

        const opts = chartConfig.options;
        if (!opts) return chartConfig;

        // Legend
        if (opts.plugins?.legend?.labels) {
            opts.plugins.legend.labels.color = '#D1D5DB';
        }

        // Aksetitler og ticks (farger oppdateres, callbacks beholdes)
        const yAxis = opts.scales?.y;
        const xAxis = opts.scales?.x;

        if (yAxis) {
            if (yAxis.title) yAxis.title.color = '#9CA3AF';
            if (yAxis.ticks) yAxis.ticks.color = '#9CA3AF';
            // VIKTIG: Ikke overskriv grid.color — det er en callback-funksjon
        }
        if (xAxis) {
            if (xAxis.title) xAxis.title.color = '#9CA3AF';
            if (xAxis.ticks) xAxis.ticks.color = '#9CA3AF';
            if (xAxis.grid)  xAxis.grid.color  = 'rgba(255,255,255,0.06)';
        }

        return chartConfig;
    }
}
