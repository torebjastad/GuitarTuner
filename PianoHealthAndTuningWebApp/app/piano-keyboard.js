// piano-keyboard.js — Canvas-basert interaktivt pianotastatur.
// Tegner 88 taster (A0–C8) eller en begrenset vindusvisning.
// Bruker CSS-variabler for farger der mulig.
//
// Avhenger av: Ingen (standalone).
//
// Bruk:
//   const kb = new PianoKeyboard('canvas-id');
//   kb.oppdaterTast(noteIndex, 'bekreftet', -3.2);
//   kb.rullTil(noteIndex);

'use strict';

class PianoKeyboard {
    /**
     * @param {string|HTMLCanvasElement} canvasEllerId - Canvas-element eller ID
     * @param {object} [valg]
     * @param {number} [valg.fraNoteIndex=0]   - Første tast som tegnes (0 = A0)
     * @param {number} [valg.tilNoteIndex=87]  - Siste tast som tegnes (87 = C8)
     */
    constructor(canvasEllerId, valg = {}) {
        this.canvas = typeof canvasEllerId === 'string'
            ? document.getElementById(canvasEllerId)
            : canvasEllerId;

        if (!this.canvas) {
            console.error('[PianoKeyboard] Canvas ikke funnet:', canvasEllerId);
            return;
        }

        this.ctx = this.canvas.getContext('2d');

        // Konfigurasjon
        this.HVIT_BREDDE  = 18;   // px per hvit tast
        this.HVIT_HOYDE   = 80;   // px
        this.SVART_BREDDE = 11;   // px per svart tast
        this.SVART_HOYDE  = 50;   // px
        this.KANT_RADIUS  = 3;    // px, avrunding på hvite taster

        // Synlig område (standardverdier)
        this.fraNoteIndex = valg.fraNoteIndex ?? 0;
        this.tilNoteIndex = valg.tilNoteIndex ?? 87;

        // Tilstandskart: noteIndex → { status, cents }
        // status: 'nøytral' | 'aktiv' | 'bekreftet' | 'advarsel' | 'kritisk' | 'hoppet-over'
        this._tilstander = new Array(88).fill(null).map(() => ({
            status: 'nøytral',
            cents: null
        }));

        // Rulleposisjon (offset i piksler fra venstre)
        this._scrollX = 0;

        // Forhåndsberegn tast-geometri
        this._geometri = this._beregnGeometri();

        // Tilpass canvas-størrelse og tegn
        this._tilpassCanvas();
        this.tegn();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Offentlig API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Oppdater visuell status for én tast.
     * @param {number} noteIndex - 0-basert tastindeks
     * @param {'nøytral'|'aktiv'|'bekreftet'|'advarsel'|'kritisk'|'hoppet-over'} status
     * @param {number|null} [cents] - Cents-avvik (vises som farge-nyanse)
     */
    oppdaterTast(noteIndex, status, cents = null) {
        if (noteIndex < 0 || noteIndex > 87) return;
        this._tilstander[noteIndex] = { status, cents };
        this.tegn();
    }

    /**
     * Marker én tast som aktiv (lyttende) og scroll dit.
     * @param {number} noteIndex
     */
    settAktiv(noteIndex) {
        // Fjern tidligere aktiv
        this._tilstander.forEach((t, i) => {
            if (t.status === 'aktiv') this._tilstander[i].status = 'nøytral';
        });
        if (noteIndex >= 0 && noteIndex < 88) {
            this._tilstander[noteIndex].status = 'aktiv';
        }
        this.rullTil(noteIndex);
        this.tegn();
    }

    /**
     * Scroll visningen slik at en gitt tast er synlig (og nær midten).
     * @param {number} noteIndex
     */
    rullTil(noteIndex) {
        const geo = this._geometri[noteIndex];
        if (!geo) return;

        const synligBredde = this.canvas.width;
        const tasteX       = geo.x - this._scrollX;
        const margin       = 40;

        if (tasteX < margin) {
            this._scrollX = Math.max(0, geo.x - synligBredde / 2);
        } else if (tasteX + geo.bredde > synligBredde - margin) {
            const maxScroll = this._totalBredde() - synligBredde;
            this._scrollX   = Math.min(maxScroll, geo.x - synligBredde / 2);
        }

        this.tegn();
    }

    /**
     * Nullstill alle taster til 'nøytral'.
     */
    nullstill() {
        this._tilstander = new Array(88).fill(null).map(() => ({
            status: 'nøytral',
            cents: null
        }));
        this._scrollX = 0;
        this.tegn();
    }

    /**
     * Tegn hele tastaturet på canvas.
     */
    tegn() {
        if (!this.ctx) return;

        const ctx = this.ctx;
        const W   = this.canvas.width;
        const H   = this.canvas.height;

        // Bakgrunn
        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = this._cssVar('--graa-800', '#1F2937');
        ctx.fillRect(0, 0, W, H);

        ctx.save();
        ctx.translate(-this._scrollX, 0);

        // Tegn hvite taster først (bak)
        for (let i = this.fraNoteIndex; i <= this.tilNoteIndex; i++) {
            const geo = this._geometri[i];
            if (!geo || geo.erSvart) continue;
            this._tegnHvitTast(ctx, geo, i);
        }

        // Tegn svarte taster over (foran)
        for (let i = this.fraNoteIndex; i <= this.tilNoteIndex; i++) {
            const geo = this._geometri[i];
            if (!geo || !geo.erSvart) continue;
            this._tegnSvartTast(ctx, geo, i);
        }

        ctx.restore();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Intern: Geometri-beregning
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * MIDI-offset → er hvit tast?
     * Hvite: C D E F G A B = offsets 0 2 4 5 7 9 11
     */
    _erHvit(midi) {
        return [0, 2, 4, 5, 7, 9, 11].includes(midi % 12);
    }

    /**
     * Beregn x-posisjon og bredde for alle 88 taster.
     * Returnerer array[88] med { x, bredde, erSvart }.
     */
    _beregnGeometri() {
        const geo      = new Array(88).fill(null);
        let hviteX     = 0;

        // Første pass: plasser hvite taster
        const hvitePosisjoner = new Array(88).fill(0);
        let hviteTeller = 0;

        for (let i = 0; i < 88; i++) {
            const midi = i + 21;
            if (this._erHvit(midi)) {
                hvitePosisjoner[i] = hviteTeller;
                hviteTeller++;
            }
        }

        // Andre pass: beregn x for alle
        for (let i = 0; i < 88; i++) {
            const midi = i + 21;
            if (this._erHvit(midi)) {
                geo[i] = {
                    x:      hvitePosisjoner[i] * this.HVIT_BREDDE,
                    bredde: this.HVIT_BREDDE,
                    hoyde:  this.HVIT_HOYDE,
                    erSvart: false
                };
            } else {
                // Svarte taster plasseres mellom de hvite
                // Finn forrige og neste hvite tast
                let prevHvit = -1, nextHvit = -1;
                for (let j = i - 1; j >= 0; j--) {
                    if (this._erHvit(j + 21)) { prevHvit = j; break; }
                }
                for (let j = i + 1; j < 88; j++) {
                    if (this._erHvit(j + 21)) { nextHvit = j; break; }
                }

                let xMidt;
                if (prevHvit >= 0 && nextHvit >= 0) {
                    const x1 = hvitePosisjoner[prevHvit] * this.HVIT_BREDDE + this.HVIT_BREDDE;
                    const x2 = hvitePosisjoner[nextHvit] * this.HVIT_BREDDE;
                    xMidt = (x1 + x2) / 2;
                } else if (prevHvit >= 0) {
                    xMidt = hvitePosisjoner[prevHvit] * this.HVIT_BREDDE + this.HVIT_BREDDE * 0.6;
                } else {
                    xMidt = 0;
                }

                geo[i] = {
                    x:      xMidt - this.SVART_BREDDE / 2,
                    bredde: this.SVART_BREDDE,
                    hoyde:  this.SVART_HOYDE,
                    erSvart: true
                };
            }
        }

        return geo;
    }

    _totalBredde() {
        let antallHvite = 0;
        for (let i = 0; i < 88; i++) {
            if (this._erHvit(i + 21)) antallHvite++;
        }
        return antallHvite * this.HVIT_BREDDE;
    }

    _tilpassCanvas() {
        this.canvas.height = this.HVIT_HOYDE + 8;
        // Bredde styres av CSS (100%), vi setter intern piksel-bredde
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width > 0) {
            this.canvas.width = Math.round(rect.width);
        } else {
            // Fallback
            this.canvas.width = 360;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Intern: Tegnhjelp
    // ─────────────────────────────────────────────────────────────────────────

    _statusFarge(noteIndex, erSvart) {
        const { status, cents } = this._tilstander[noteIndex];
        const abs = cents !== null ? Math.abs(cents) : 0;

        switch (status) {
            case 'aktiv':
                return erSvart ? '#2D6AD4' : '#3D7EE8';
            case 'bekreftet':
                if (abs <= 5)  return erSvart
                    ? 'rgba(26, 122, 74, 0.85)'   // God
                    : 'rgba(26, 122, 74, 0.55)';
                if (abs <= 15) return erSvart
                    ? 'rgba(196, 123, 0, 0.85)'   // Advarsel
                    : 'rgba(196, 123, 0, 0.55)';
                return erSvart
                    ? 'rgba(185, 28, 28, 0.85)'   // Kritisk
                    : 'rgba(185, 28, 28, 0.50)';
            case 'advarsel':
                return erSvart ? 'rgba(196,123,0,0.85)' : 'rgba(196,123,0,0.55)';
            case 'kritisk':
                return erSvart ? 'rgba(185,28,28,0.85)' : 'rgba(185,28,28,0.50)';
            case 'hoppet-over':
                return erSvart ? '#555566' : '#CCCCCC';
            default:
                return erSvart
                    ? this._cssVar('--tast-svart', '#1A1A2A')
                    : this._cssVar('--tast-hvit', '#F8F8F8');
        }
    }

    _tegnHvitTast(ctx, geo, noteIndex) {
        const farge  = this._statusFarge(noteIndex, false);
        const aktiv  = this._tilstander[noteIndex].status === 'aktiv';

        ctx.fillStyle   = farge;
        ctx.strokeStyle = this._cssVar('--piano-kant', 'rgba(0,0,0,0.25)');
        ctx.lineWidth   = 0.75;

        this._avrundRektangel(ctx, geo.x + 0.5, 2, geo.bredde - 1, geo.hoyde - 4, this.KANT_RADIUS);
        ctx.fill();
        ctx.stroke();

        // Pulserende kant for aktiv tast
        if (aktiv) {
            ctx.strokeStyle = '#3D7EE8';
            ctx.lineWidth   = 2;
            this._avrundRektangel(ctx, geo.x + 1, 3, geo.bredde - 2, geo.hoyde - 6, this.KANT_RADIUS);
            ctx.stroke();
        }
    }

    _tegnSvartTast(ctx, geo, noteIndex) {
        const farge = this._statusFarge(noteIndex, true);
        const aktiv = this._tilstander[noteIndex].status === 'aktiv';

        // Svart tast (avrundet bunn)
        ctx.fillStyle = farge;
        this._avrundRektangel(ctx, geo.x, 0, geo.bredde, geo.hoyde, 2, false, true);
        ctx.fill();

        // Refleks øverst
        const grad = ctx.createLinearGradient(geo.x, 0, geo.x, geo.hoyde * 0.4);
        grad.addColorStop(0, 'rgba(255,255,255,0.12)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        this._avrundRektangel(ctx, geo.x, 0, geo.bredde, geo.hoyde * 0.4, 2, false, false);
        ctx.fill();

        if (aktiv) {
            ctx.strokeStyle = '#5B9EF8';
            ctx.lineWidth   = 1.5;
            this._avrundRektangel(ctx, geo.x + 0.75, 0.75, geo.bredde - 1.5, geo.hoyde - 0.75, 2, false, true);
            ctx.stroke();
        }
    }

    /**
     * Hjelpemetode: tegner et rektangel med valgfri avrunding.
     */
    _avrundRektangel(ctx, x, y, w, h, r, øverst = true, nederst = true) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        if (øverst) {
            ctx.arcTo(x + w, y, x + w, y + r, r);
        } else {
            ctx.lineTo(x + w, y);
        }
        ctx.lineTo(x + w, y + h - (nederst ? r : 0));
        if (nederst) {
            ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
        } else {
            ctx.lineTo(x + w, y + h);
        }
        ctx.lineTo(x + r, y + h);
        if (nederst) {
            ctx.arcTo(x, y + h, x, y + h - r, r);
        } else {
            ctx.lineTo(x, y + h);
        }
        ctx.lineTo(x, y + (øverst ? r : 0));
        if (øverst) {
            ctx.arcTo(x, y, x + r, y, r);
        } else {
            ctx.lineTo(x, y);
        }
        ctx.closePath();
    }

    /**
     * Hent CSS-variabel-verdi eller returner fallback.
     */
    _cssVar(navn, fallback) {
        const verdi = getComputedStyle(document.documentElement)
            .getPropertyValue(navn).trim();
        return verdi || fallback;
    }
}
