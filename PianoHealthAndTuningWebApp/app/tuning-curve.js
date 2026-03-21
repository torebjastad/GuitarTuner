// tuning-curve.js — Genererer stemningskurvedata og Chart.js-konfigurasjon.
//
// Ny design: viser ALLE noter i skanneomfanget (C1–A7) på x-aksen.
// Ubekreftede noter = null (gap i linjen). Piano-tangenter tegnes i bunnen
// via Chart.js-plugin (afterDraw), justert med x-aksen over.
//
// Avhenger av: piano-scanner.js (PianoScanner.idealHz)
// Eksternt: Chart.js v4

'use strict';

class TuningCurve {

    /**
     * Genererer stemningskurvedata og Chart.js-konfigurasjon.
     *
     * X-aksen viser alle 82 noter i skanneomfanget (noteIndex 3–84, C1–A7).
     * Ubekreftede noter får null-verdier (gap i linje, usynlig punkt).
     *
     * @param {Array} noteResultater - Array[88] med NoteResultat fra PianoScanner
     * @returns {{ kurve, chartConfig, noteIndices, keyTypes, chartLabels }}
     */
    static generer(noteResultater) {
        const SCAN_START = 3;   // C1 (MIDI 24)
        const SCAN_END   = 84;  // A7 (MIDI 105)

        const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
        const BLACK_SEMI = new Set([1, 3, 6, 8, 10]);
        const darkMode   = window.matchMedia('(prefers-color-scheme: dark)').matches;

        const chartLabels = [];
        const chartData   = [];
        const chartColors = [];
        const noteIndices = [];
        const keyTypes    = [];   // 'white' | 'black'
        const kurve       = {};

        for (let i = SCAN_START; i <= SCAN_END; i++) {
            const midi     = i + 21;
            const semitone = midi % 12;
            const noteNavn = NOTE_NAMES[semitone];
            const oktav    = Math.floor(midi / 12) - 1;
            const isBlack  = BLACK_SEMI.has(semitone);
            const label    = noteNavn + oktav;

            chartLabels.push(label);
            noteIndices.push(i);
            keyTypes.push(isBlack ? 'black' : 'white');

            const r = noteResultater[i];
            if (r?.status === 'bekreftet') {
                const cents = Math.round(r.cents * 10) / 10;
                chartData.push(cents);
                const abs = Math.abs(cents);
                chartColors.push(
                    abs <= 5  ? 'rgba(22, 163, 74, 0.9)'  :
                    abs <= 15 ? 'rgba(234, 179, 8, 0.9)'  :
                                'rgba(220, 38, 38, 0.9)'
                );
                kurve[label] = {
                    noteIndex: i,
                    midi,
                    hz:      Math.round(r.hz    * 100) / 100,
                    ideell:  Math.round(PianoScanner.idealHz(i) * 100) / 100,
                    cents,
                    klarhet: Math.round(r.klarhet * 1000) / 1000
                };
            } else {
                chartData.push(null);
                chartColors.push('rgba(0,0,0,0)');
            }
        }

        // Railsback-referanse for alle noteIndices-posisjoner
        const railsbackData = noteIndices.map(i => TuningCurve._railsbackRef(i));

        // Dynamisk y-akse
        const validData = chartData.filter(v => v !== null);
        const maksCent = validData.length > 0
            ? Math.max(30, Math.ceil(Math.max(...validData.map(Math.abs)) / 10) * 10 + 5)
            : 30;

        // ── Piano-bakgrunns-plugin ──────────────────────────────────────────────
        // Tegner hvite/svarte kolonner og C-note-skillelinjer i kartområdet.
        const pianoBackgroundPlugin = {
            id: 'pianoBackground',
            beforeDatasetsDraw(chart) {
                const { ctx, chartArea, scales: { x } } = chart;
                if (!chartArea || !x) return;

                const n    = keyTypes.length;
                const barW = (chartArea.right - chartArea.left) / n;

                keyTypes.forEach((type, idx) => {
                    const xc = x.getPixelForValue(idx);

                    // Svart-tast-kolonne: litt mørkere bakgrunn
                    if (type === 'black') {
                        ctx.fillStyle = darkMode
                            ? 'rgba(255,255,255,0.04)'
                            : 'rgba(0,0,0,0.07)';
                        ctx.fillRect(xc - barW / 2, chartArea.top, barW, chartArea.bottom - chartArea.top);
                    }

                    // C-note skillelinje
                    const midi = noteIndices[idx] + 21;
                    if (midi % 12 === 0) {
                        ctx.save();
                        ctx.strokeStyle = darkMode
                            ? 'rgba(156,163,175,0.55)'
                            : 'rgba(107,114,128,0.65)';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath();
                        ctx.moveTo(xc - barW / 2, chartArea.top);
                        ctx.lineTo(xc - barW / 2, chartArea.bottom);
                        ctx.stroke();
                        ctx.restore();
                    }
                });
            }
        };

        // ── Piano-tangent-plugin ───────────────────────────────────────────────
        // Tegner en piano-tangent-rekke i bunnmargin-området nedenfor kartlinjen.
        const PIANO_GAP = 10;  // avstand fra chartArea.bottom til toppen av tangenter
        const PIANO_H   = 55;  // høyde på tangentene

        const pianoKeyboardPlugin = {
            id: 'pianoKeyboard',
            afterDraw(chart) {
                const { ctx, chartArea, scales: { x } } = chart;
                if (!chartArea || !x) return;

                const n      = keyTypes.length;
                const barW   = (chartArea.right - chartArea.left) / n;
                const y0     = chartArea.bottom + PIANO_GAP;
                const selIdx = chart._selectedChartIndex ?? -1;

                const wKeyFill   = darkMode ? '#D1D5DB' : '#F5F5F5';
                const wKeyStroke = darkMode ? '#6B7280' : '#AAAAAA';
                const bKeyFill   = darkMode ? '#1F2937' : '#1A1A2A';
                const selFill    = '#1B2B4B';
                const selAccent  = '#C9A84C';

                // Hvite tangenter (tegnes først — bakgrunn)
                keyTypes.forEach((type, idx) => {
                    if (type !== 'white') return;
                    const xc = x.getPixelForValue(idx);
                    const x0 = xc - barW / 2;
                    const isSel = idx === selIdx;

                    ctx.fillStyle   = isSel ? selFill : wKeyFill;
                    ctx.strokeStyle = wKeyStroke;
                    ctx.lineWidth   = 0.5;
                    ctx.fillRect(x0, y0, barW - 0.5, PIANO_H);
                    ctx.strokeRect(x0, y0, barW - 0.5, PIANO_H);

                    if (isSel) {
                        ctx.fillStyle = selAccent;
                        const r = Math.min(3, barW / 3);
                        ctx.beginPath();
                        ctx.arc(xc, y0 + PIANO_H - 6, r, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });

                // Svarte tangenter (tegnes på toppen)
                const bw = barW * 0.72;
                keyTypes.forEach((type, idx) => {
                    if (type !== 'black') return;
                    const xc   = x.getPixelForValue(idx);
                    const isSel = idx === selIdx;

                    ctx.fillStyle   = isSel ? selAccent : bKeyFill;
                    ctx.strokeStyle = darkMode ? '#374151' : '#111';
                    ctx.lineWidth   = 0.5;
                    ctx.fillRect(xc - bw / 2, y0, bw, PIANO_H * 0.62);
                    ctx.strokeRect(xc - bw / 2, y0, bw, PIANO_H * 0.62);
                });

                // Oktav-etiketter (C-noter)
                const fontSize = Math.max(8, Math.min(11, barW * 1.8));
                ctx.font         = `bold ${fontSize}px Inter, sans-serif`;
                ctx.fillStyle    = darkMode ? '#9CA3AF' : '#374151';
                ctx.textAlign    = 'center';
                ctx.textBaseline = 'top';

                noteIndices.forEach((ni, idx) => {
                    if ((ni + 21) % 12 === 0) {
                        const octave = Math.floor((ni + 21) / 12) - 1;
                        const xc = x.getPixelForValue(idx);
                        ctx.fillText('C' + octave, xc, y0 + PIANO_H + 4);
                    }
                });

                ctx.textBaseline = 'alphabetic';
            }
        };

        // ── Chart.js-konfigurasjon ─────────────────────────────────────────────
        const chartConfig = {
            type:    'line',
            plugins: [pianoBackgroundPlugin, pianoKeyboardPlugin],
            data: {
                labels:   chartLabels,
                datasets: [
                    {
                        label:                'Målt avvik (cent)',
                        data:                 chartData,
                        borderColor:          'rgba(59, 130, 246, 0.9)',
                        backgroundColor:      'rgba(59, 130, 246, 0.05)',
                        pointBackgroundColor: chartColors,
                        pointBorderColor:     chartColors,
                        pointRadius:          chartData.map(v => v !== null ? 5 : 0),
                        pointHoverRadius:     chartData.map(v => v !== null ? 7 : 0),
                        pointBorderWidth:     2,
                        borderWidth:          2,
                        tension:              0.15,
                        spanGaps:             false,
                        fill:                 false
                    },
                    {
                        label:       'Railsback-referanse (ideell stretch)',
                        data:        railsbackData,
                        borderColor: 'rgba(255, 200, 60, 0.75)',
                        borderDash:  [6, 3],
                        borderWidth: 2,
                        pointRadius: 0,
                        tension:     0.4,
                        fill:        false
                    }
                ]
            },
            options: {
                responsive:          false,
                maintainAspectRatio: false,
                animation:           { duration: 300, easing: 'easeOutQuart' },
                layout: {
                    // Bunnmargin gir plass til tangenter + oktavetiketter
                    padding: { bottom: PIANO_GAP + PIANO_H + 20 }
                },
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color:         darkMode ? '#D1D5DB' : '#374151',
                            font:          { family: 'Inter, sans-serif', size: 18, weight: '500' },
                            padding:       16,
                            usePointStyle: true
                        }
                    },
                    tooltip: { enabled: false }  // Erstattet av toneinfo-panel
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text:    'Avvik (cent)',
                            color:   darkMode ? '#9CA3AF' : '#4B5563',
                            font:    { family: 'Inter, sans-serif', size: 18, weight: '600' }
                        },
                        min:  -maksCent,
                        max:   maksCent,
                        ticks: {
                            stepSize: 10,
                            color:    darkMode ? '#D1D5DB' : '#374151',
                            font:     { family: 'JetBrains Mono, monospace', size: 16, weight: '500' },
                            callback: v => `${v > 0 ? '+' : ''}${v}¢`
                        },
                        grid: {
                            color: ctx => {
                                const v = ctx.tick.value;
                                if (v === 0)            return 'rgba(220,38,38,0.85)';
                                if (Math.abs(v) === 10) return 'rgba(22,163,74,0.45)';
                                if (Math.abs(v) === 20) return 'rgba(234,179,8,0.6)';
                                if (Math.abs(v) === 30) return 'rgba(220,38,38,0.35)';
                                return 'rgba(156,163,175,0.3)';
                            },
                            lineWidth: ctx => {
                                const v = ctx.tick.value;
                                if (v === 0)                         return 3;
                                if (Math.abs(v) === 10 || Math.abs(v) === 20) return 2;
                                return 1;
                            }
                        },
                        border: { color: 'rgba(107,114,128,0.4)' }
                    },
                    x: {
                        display: false  // Piano-tangentvisning erstatter x-akse-etiketter
                    }
                }
            }
        };

        return { kurve, chartConfig, noteIndices, keyTypes, chartLabels };
    }

    /**
     * Forenklet Railsback-referanse for noteIndex 0–87.
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

            const gjSnitt      = toner.reduce((s, t) => s + t.cents, 0) / toner.length;
            const midtMidi     = (okt.midiMin + okt.midiMaks) / 2;
            const midtNoteIdx  = midtMidi - 21;
            const railsRef     = TuningCurve._railsbackRef(midtNoteIdx);
            const avvikFraRailsback = gjSnitt - railsRef;

            resultat[okt.navn] = {
                gjennomsnittCents:  Math.round(gjSnitt * 10) / 10,
                railsbackRef:       Math.round(railsRef * 10) / 10,
                avvikFraRailsback:  Math.round(avvikFraRailsback * 10) / 10,
                antallToner:        toner.length
            };
        }

        return resultat;
    }

    /**
     * Tilpasser Chart.js-konfigurasjonen for mørk modus (bakoverkompatibilitet).
     * Ny kode bruker darkMode-sjekk direkte i generer().
     */
    static morkModusConfig(chartConfig) {
        // No-op: dark mode is now handled inside generer() based on system preference.
        return chartConfig;
    }
}
