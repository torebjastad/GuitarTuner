// tuning-curve.js — Genererer stemningskurvedata og Chart.js-konfigurasjon.
// Inkluderer Railsback-referanselinje og per-oktav-avviksanalyse.
//
// Avhenger av: piano-scanner.js (PianoScanner.idealHz)
// Eksternt: Chart.js v4 (brukes av StemningskurveKomponent i komponenter)

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
     * @returns {{ kurve: object, chartConfig: object, noteIndices: number[] }}
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
            const noteNavn = r.noteNavn + r.oktav;

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

            // Fargekoding: Grønn ≤ 5¢, Amber 5–15¢, Rød > 15¢
            const abs = Math.abs(r.cents);
            chartKolorer.push(
                abs <= 5  ? 'rgba(22, 163, 74, 0.9)'   :  // Grønn
                abs <= 15 ? 'rgba(234, 179, 8, 0.9)'   :  // Amber
                            'rgba(220, 38, 38, 0.9)'       // Rød
            );
        }

        // Railsback-referanselinje
        const railsbackData = noteIndices.map(i => TuningCurve._railsbackRef(i));

        // Dynamisk y-akse: minst ±30 cent, utvid om nødvendig
        const maksCent = chartData.length > 0
            ? Math.max(30, Math.ceil(Math.max(...chartData.map(Math.abs)) / 10) * 10 + 5)
            : 30;

        const chartConfig = {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [
                    {
                        label:                'Målt avvik (cent)',
                        data:                 chartData,
                        borderColor:          'rgba(59, 130, 246, 0.95)',
                        backgroundColor:      'rgba(59, 130, 246, 0.08)',
                        pointBackgroundColor: chartKolorer,
                        pointBorderColor:     chartKolorer,
                        pointRadius:          6,
                        pointHoverRadius:     9,
                        pointBorderWidth:     2,
                        borderWidth:          2.5,
                        tension:              0.2,
                        fill:                 { target: { value: 0 }, above: 'rgba(59, 130, 246, 0.08)', below: 'rgba(59, 130, 246, 0.08)' }
                    },
                    {
                        label:           'Railsback-referanse (ideell stretch)',
                        data:            railsbackData,
                        borderColor:     'rgba(255, 200, 60, 0.75)',
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
                // Interaksjon: nødvendig for at onClick og onHover skal finne datapunkter
                interaction: {
                    mode:      'nearest',
                    axis:      'x',
                    intersect: false
                },
                animation: {
                    duration: 500,
                    easing:   'easeOutQuart'
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color:    '#374151',
                            font:     { family: 'Inter, sans-serif', size: 22, weight: '500' },
                            padding:  20,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(10, 15, 26, 0.95)',
                        titleColor:      '#F9FAFB',
                        titleFont:       { family: 'Inter, sans-serif', size: 22, weight: '700' },
                        bodyColor:       '#E5E7EB',
                        bodyFont:        { family: 'Inter, sans-serif', size: 18 },
                        footerColor:     '#93C5FD',
                        footerFont:      { family: 'Inter, sans-serif', size: 16, weight: '600' },
                        borderColor:     '#4B5563',
                        borderWidth:     1,
                        padding:         14,
                        cornerRadius:    8,
                        displayColors:   false,
                        callbacks: {
                            title: (ctx) => ctx[0].label,
                            label: (ctx) => {
                                if (ctx.datasetIndex === 1) {
                                    return `Railsback-ref: ${ctx.parsed.y > 0 ? '+' : ''}${ctx.parsed.y} ¢`;
                                }
                                const v = ctx.parsed.y;
                                const tegn = v > 0 ? '+' : '';
                                const status = Math.abs(v) <= 5 ? '✓ Stemt' : Math.abs(v) <= 15 ? '⚠ Litt ustemt' : '✗ Ustemt';
                                return [`Avvik: ${tegn}${v} cent`, status];
                            },
                            footer: (ctx) => {
                                if (ctx[0]?.datasetIndex === 0) return '👆 Trykk for å måle på nytt';
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text:    'Avvik fra temperert stemming (cent)',
                            color:   '#4B5563',
                            font:    { family: 'Inter, sans-serif', size: 20, weight: '600' }
                        },
                        min:  -maksCent,
                        max:   maksCent,
                        ticks: {
                            stepSize:  10,
                            color:    '#374151',
                            font:     { family: 'JetBrains Mono, monospace', size: 20, weight: '500' },
                            callback: (v) => `${v > 0 ? '+' : ''}${v}¢`,
                            includeBounds: true
                        },
                        grid: {
                            color: (ctx) => {
                                const v = ctx.tick.value;
                                // Nullinje: sterk rød — tydeligste referansepunktet
                                if (v === 0)                    return 'rgba(220, 38, 38, 0.85)';
                                // ±5¢: grønn sone (i stemt)
                                if (Math.abs(v) === 10)         return 'rgba(22, 163, 74, 0.45)';
                                // ±20¢: amber advarsel (merkbart ustemt)
                                if (Math.abs(v) === 20)         return 'rgba(234, 179, 8, 0.6)';
                                // ±30¢: rød grense (alvorlig ustemt)
                                if (Math.abs(v) === 30)         return 'rgba(220, 38, 38, 0.35)';
                                return 'rgba(156, 163, 175, 0.3)';
                            },
                            lineWidth: (ctx) => {
                                const v = ctx.tick.value;
                                if (v === 0)                    return 3;
                                if (Math.abs(v) === 10)         return 2;
                                if (Math.abs(v) === 20)         return 2.5;
                                if (Math.abs(v) === 30)         return 2;
                                return 1;
                            }
                        },
                        border: { color: 'rgba(107, 114, 128, 0.4)' }
                    },
                    x: {
                        title: {
                            display: true,
                            text:    'Tone',
                            color:   '#4B5563',
                            font:    { family: 'Inter, sans-serif', size: 18, weight: '500' }
                        },
                        ticks: {
                            color: (ctx) => {
                                const label = chartLabels[ctx.index] || '';
                                // C-noter i fet, mørk farge for oktavgrense-tydelighet
                                if (label.startsWith('C') && !label.startsWith('C#')) return '#111827';
                                return '#6B7280';
                            },
                            font: {
                                family: 'Inter, sans-serif',
                                size:   16,
                                weight: '400'
                            },
                            maxRotation: 45
                        },
                        grid: {
                            color: (ctx) => {
                                const label = chartLabels[ctx.index] || '';
                                if (label.startsWith('C') && !label.startsWith('C#')) {
                                    return 'rgba(107, 114, 128, 0.5)';
                                }
                                return 'rgba(209, 213, 219, 0.12)';
                            },
                            lineWidth: (ctx) => {
                                const label = chartLabels[ctx.index] || '';
                                if (label.startsWith('C') && !label.startsWith('C#')) return 2;
                                return 0.5;
                            }
                        }
                    }
                }
            }
        };

        return { kurve, chartConfig, noteIndices };
    }

    /**
     * Forenklet Railsback-referanselinje for noteIndex 0–87.
     * Kubisk modell: 30 × t³, t ∈ [−1, +1]
     */
    static _railsbackRef(noteIndex) {
        const t = (noteIndex / 87) * 2 - 1;
        return Math.round(30 * Math.pow(t, 3) * 10) / 10;
    }

    /**
     * Analyse av avvik fra Railsback-kurven per oktav.
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
     * Tilpasser Chart.js-konfigurasjonen for mørk modus.
     * Muterer originalen (unngår JSON.stringify som dreper callbacks).
     */
    static morkModusConfig(chartConfig) {
        if (chartConfig.data?.datasets?.[0]) {
            chartConfig.data.datasets[0].borderColor = 'rgba(96, 165, 250, 0.9)';
        }
        if (chartConfig.data?.datasets?.[1]) {
            chartConfig.data.datasets[1].borderColor = 'rgba(255, 210, 80, 0.8)';
        }

        const opts = chartConfig.options;
        if (!opts) return chartConfig;

        if (opts.plugins?.legend?.labels) {
            opts.plugins.legend.labels.color = '#D1D5DB';
        }

        const yAxis = opts.scales?.y;
        const xAxis = opts.scales?.x;

        if (yAxis) {
            if (yAxis.title) yAxis.title.color = '#9CA3AF';
            if (yAxis.ticks) yAxis.ticks.color = '#D1D5DB';
        }
        if (xAxis) {
            if (xAxis.title) xAxis.title.color = '#9CA3AF';
        }

        return chartConfig;
    }
}
