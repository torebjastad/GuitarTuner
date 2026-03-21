// app.js — Hoved-orkestrator for PianoHelse Pianoeier-appen.
//
// Avhenger av (i lastingsrekkefølge):
//   pitch-common.js, ultimate-detector.js  → fra ../../
//   piano-scanner.js, health-scorer.js, tuning-curve.js → fra ./
//   router.js, piano-keyboard.js → fra ./

'use strict';

// Service Worker deaktivert under utvikling
// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('./sw.js').catch(() => {});
//     });
// }

// ─────────────────────────────────────────────────────────────────────────────
// Mock stemmere (Fase 1)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_STEMMERE = [
    { navn: 'Lars Mikkelsen',  by: 'Oslo',     avstand: '3,2 km',  erfaring: '18 år', pris: '1 400–1 800 kr', tlf: '+47 97 23 45 67', stjerner: 5, anmeldelser: 142 },
    { navn: 'Kari Thorshaug',  by: 'Bærum',    avstand: '8,5 km',  erfaring: '11 år', pris: '1 200–1 600 kr', tlf: '+47 91 67 89 01', stjerner: 5, anmeldelser: 87 },
    { navn: 'Erik Bergström',  by: 'Sandvika', avstand: '12 km',   erfaring: '25 år', pris: '1 600–2 200 kr', tlf: '+47 99 12 34 56', stjerner: 4, anmeldelser: 213 }
];

// ─────────────────────────────────────────────────────────────────────────────
// App-tilstand
// ─────────────────────────────────────────────────────────────────────────────

const AppTilstand = {
    pianoInfo:        null,
    skanneResultater: null,
    scoreResultat:    null,
    kurveData:        null,
    aktivtNoteIndex:  -1,
    skannerAktiv:     false,
    skanneValg:       'hvite',  // 'hvite' (52 taster) eller 'alle' (88 taster)

    scanner:          null,
    tastatur:         null,
    stemningskurve:   null,
    beepCtx:          null      // AudioContext for bekreftelseslyd
};

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────

const router = new Router();

router
    .registrer('velkomst',     _visVelkomst)
    .registrer('piano-info',   _visPianoInfo)
    .registrer('forberedelse', _visForberedelse)
    .registrer('skanning',     _visSkanning)
    .registrer('analyse',      _visAnalyse)
    .registrer('rapport',      _visRapport)
    .registrer('finn-stemmer', _visFinnStemmer);

// ─────────────────────────────────────────────────────────────────────────────
// Skjerm-handlers
// ─────────────────────────────────────────────────────────────────────────────

function _visVelkomst() {}

function _visPianoInfo() {
    if (AppTilstand.pianoInfo) {
        const merkeEl = document.getElementById('piano-merke');
        if (merkeEl && AppTilstand.pianoInfo.merke) merkeEl.value = AppTilstand.pianoInfo.merke;

        // Gjenopprett radio-valg
        if (AppTilstand.pianoInfo.type) {
            const radio = document.querySelector(`input[name="piano-type"][value="${AppTilstand.pianoInfo.type}"]`);
            if (radio) radio.checked = true;
        }
    }
}

function _visForberedelse() {
    // Oppdater tidsestimat og tast-info basert på valg
    _oppdaterForberedelseTekst();

    // Vis advarsel hvis bruker har oppgitt digitalt piano
    const digitalAdvarselEl = document.getElementById('digitalt-piano-advarsel');
    if (digitalAdvarselEl) {
        const erDigitalt = AppTilstand.pianoInfo?.type === 'digitalt';
        digitalAdvarselEl.style.display = erDigitalt ? '' : 'none';
    }
}

function _visSkanning() {
    const canvas = document.getElementById('tastatur-canvas');
    if (canvas && !AppTilstand.tastatur) {
        AppTilstand.tastatur = new PianoKeyboard(canvas);
    } else if (AppTilstand.tastatur) {
        AppTilstand.tastatur.nullstill();
    }

    // Opprett scanner
    if (AppTilstand.scanner) AppTilstand.scanner.avslutt();
    try {
        AppTilstand.scanner = new PianoScanner();
    } catch (initErr) {
        AppTilstand.scanner = null;
        _visSkannFeil('Kunne ikke starte diagnosemodellen. Last siden på nytt. (' + initErr.message + ')');
        return;
    }

    // Koble callbacks
    AppTilstand.scanner.onNoteMalt = (noteIndex, hz) => {
        _oppdaterSanntidsVisning(noteIndex, hz);
    };
    AppTilstand.scanner.onNoteBekreft = (noteIndex, resultat) => {
        _bekreftTast(noteIndex, resultat);
    };
    AppTilstand.scanner.onNoteIkkeDetektert = (noteIndex) => {
        _tastIkkeDetektert(noteIndex);
    };
    AppTilstand.scanner.onSkanningFullfort = (resultater) => {
        _skanningFullfort(resultater);
    };
    AppTilstand.scanner.onFremdrift = (indeks, totalt) => {
        _oppdaterFremdrift(indeks, totalt);
        _oppdaterNesteTastLabel(indeks, totalt);
        _oppdaterBassAdvarsel(indeks);
    };
    AppTilstand.scanner.onVenterPåStille = () => {
        const statusEl = document.getElementById('skanning-status');
        if (statusEl) {
            statusEl.textContent = 'Vent — lytter etter stillhet før neste tone…';
            statusEl.className   = 'skanning-status status-lytter';
        }
    };

    const antall = AppTilstand.skanneValg === 'alle' ? 88 : 52;
    _settSkanneStatus('venter');
    _oppdaterFremdrift(0, antall);
}

function _visAnalyse() {
    if (AppTilstand.skanneResultater) {
        const startTid = performance.now();
        const scoreResultat = HealthScorer.score(AppTilstand.skanneResultater);
        const kurveData     = TuningCurve.generer(AppTilstand.skanneResultater);
        AppTilstand.scoreResultat = scoreResultat;
        AppTilstand.kurveData     = kurveData;
        const ventetid = Math.max(0, 2000 - (performance.now() - startTid));
        setTimeout(() => router.navigate('rapport'), ventetid);
    } else {
        router.navigate('velkomst');
    }
}

function _visRapport() {
    if (!AppTilstand.scoreResultat) return;
    const { score, status, detaljer } = AppTilstand.scoreResultat;

    _oppdaterScoreSirkel(score, status);

    const beskrivelseEl = document.getElementById('rapport-beskrivelse');
    if (beskrivelseEl) {
        beskrivelseEl.textContent = HealthScorer.lagBeskrivelse(AppTilstand.scoreResultat);
    }

    // Badge — bruker 5-nivå systemet
    const badgeEl = document.getElementById('helse-badge');
    if (badgeEl) {
        let badgeTekst, badgeCss;
        if (status === 'utilstrekkelig_data' || score === null) {
            badgeTekst = 'Mangler data';
            badgeCss   = 'badge-tilsyn';
        } else {
            const nivaa = HealthScorer.scoreNivaa(score);
            badgeTekst = nivaa.tittel;
            badgeCss   = nivaa.nivaa <= 1 ? 'badge-god'
                       : nivaa.nivaa <= 2 ? 'badge-god'
                       : nivaa.nivaa <= 3 ? 'badge-tilsyn'
                       :                    'badge-kritisk';
        }
        badgeEl.className = 'helse-badge ' + badgeCss;
        badgeEl.querySelector('.badge-tekst').textContent = badgeTekst;
        badgeEl.querySelector('.badge-score').textContent =
            score !== null ? Math.round(score) + '/100' : '—/100';
    }

    _oppdaterDetaljerPanel(detaljer);
    _tegnStemningskurve();
    _oppdaterOktavTabell(detaljer.perOktav);

    // Vis opptrekk-advarsel hvis gjennomsnittlig avvik overstiger 25 cent
    const opptrekkEl = document.getElementById('opptrekk-advarsel');
    if (opptrekkEl) {
        opptrekkEl.style.display =
            (detaljer.gjennomsnittAvvik >= 25) ? '' : 'none';
    }
}

function _visFinnStemmer() {
    const listEl = document.getElementById('stemmer-liste');
    if (!listEl) return;

    // Bygg score-kontekst-melding
    const score = AppTilstand.scoreResultat?.score ?? null;
    const hasterTekst = score !== null && score < 50
        ? '<div style="background:var(--fare-lys);border:1px solid var(--fare);border-radius:var(--radius-md);padding:var(--space-md);margin-bottom:var(--space-md)">' +
          '<p style="font-size:0.875rem;color:var(--fare);font-weight:600">Anbefalt: Book snarest</p>' +
          `<p style="font-size:0.875rem;color:var(--fare)">Pianoets helsescore er ${Math.round(score)}/100. Vi anbefaler at du booker en stemmer så snart som mulig.</p></div>`
        : '';

    listEl.innerHTML = hasterTekst + MOCK_STEMMERE.map(s => `
        <div class="stemmer-kort">
            <div class="stemmer-hode">
                <div class="stemmer-avatar" aria-hidden="true">
                    ${s.navn.split(' ').map(n => n[0]).join('')}
                </div>
                <div class="stemmer-info">
                    <h3 class="stemmer-navn">${s.navn}</h3>
                    <p class="stemmer-by">${s.by} · ${s.avstand}</p>
                    <div class="stemmer-stjerner" aria-label="${s.stjerner} av 5 stjerner">
                        ${'★'.repeat(s.stjerner)}${'☆'.repeat(5 - s.stjerner)}
                        <span class="stemmer-antall">(${s.anmeldelser})</span>
                    </div>
                </div>
            </div>
            <div class="stemmer-detaljer">
                <div class="stemmer-detalj">
                    <span class="detalj-etikett">Erfaring</span>
                    <span class="detalj-verdi">${s.erfaring}</span>
                </div>
                <div class="stemmer-detalj">
                    <span class="detalj-etikett">Pris</span>
                    <span class="detalj-verdi">${s.pris}</span>
                </div>
            </div>
            <a href="tel:${s.tlf}" class="knapp-primer stemmer-ring-knapp"
               aria-label="Ring ${s.navn}">
                Ring ${s.navn.split(' ')[0]}
            </a>
        </div>
    `).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Forberedelse: tast-valg og tidsestimat
// ─────────────────────────────────────────────────────────────────────────────

function _oppdaterForberedelseTekst() {
    const erAlle = AppTilstand.skanneValg === 'alle';
    const sekvens = erAlle ? _lagAlleTasterSekvens() : _lagHvitTastSekvens();
    const antall = sekvens.length;
    const minutter = Math.ceil(antall * 1.5 / 60);
    const tidsEl = document.getElementById('forberedelse-tidsestimat');
    if (tidsEl) {
        tidsEl.textContent = `Ca. ${minutter} minutter · ${antall} taster (C1–A7) · Hold hver tast i ~2 sekunder`;
    }

    // Oppdater radio-knapper
    const hviteRadio = document.getElementById('valg-hvite');
    const alleRadio  = document.getElementById('valg-alle');
    if (hviteRadio) hviteRadio.checked = !erAlle;
    if (alleRadio)  alleRadio.checked  = erAlle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skannings-UI
// ─────────────────────────────────────────────────────────────────────────────

function _oppdaterSanntidsVisning(noteIndex, hz) {
    const forventet = PianoScanner.idealHz(noteIndex);
    const cents     = 1200 * Math.log2(hz / forventet);

    const centsEl = document.getElementById('skanning-cents');
    if (centsEl) {
        const tegn = cents > 0 ? '+' : '';
        centsEl.textContent = `${tegn}${cents.toFixed(1)} ¢`;
        centsEl.className   = 'skanning-cents '
            + (Math.abs(cents) <= 5  ? 'cents-ok'
             : Math.abs(cents) <= 15 ? 'cents-advarsel'
             :                         'cents-kritisk');
    }

    const hzEl = document.getElementById('skanning-hz');
    if (hzEl) hzEl.textContent = hz.toFixed(1) + ' Hz';

    const pulsEl = document.getElementById('mikrofon-puls');
    if (pulsEl) pulsEl.classList.add('puls-aktiv');
}

function _bekreftTast(noteIndex, resultat) {
    const status = Math.abs(resultat.cents) <= 5  ? 'bekreftet'
                 : Math.abs(resultat.cents) <= 15 ? 'advarsel'
                 :                                  'kritisk';

    if (AppTilstand.tastatur) {
        AppTilstand.tastatur.oppdaterTast(noteIndex, status, resultat.cents);
    }

    const statusEl = document.getElementById('skanning-status');
    if (statusEl) {
        const notaNavn = resultat.noteNavn + resultat.oktav;
        statusEl.textContent = `✓ ${notaNavn} registrert`;
        statusEl.className   = 'skanning-status status-bekreftet';
    }

    // Kort bekreftelseslyd — diskret men tydelig "klikk/pling"
    _spillBekreftelseslyd();

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(30);
}

/**
 * Spiller en tydelig bekreftelsestone — to-tone "ding-ding" (~150ms).
 * Høyt nok til å være tydelig, kort nok til å ikke forstyrre.
 */
function _spillBekreftelseslyd() {
    try {
        if (!AppTilstand.beepCtx) {
            AppTilstand.beepCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = AppTilstand.beepCtx;
        if (ctx.state === 'suspended') ctx.resume();
        const nå = ctx.currentTime;

        // Tone 1: 1200 Hz (høy, tydelig)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.value = 1200;
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        gain1.gain.setValueAtTime(0.25, nå);
        gain1.gain.exponentialRampToValueAtTime(0.001, nå + 0.08);
        osc1.start(nå);
        osc1.stop(nå + 0.09);

        // Tone 2: 1600 Hz (en kvart over, gir "ding-ding" effekt)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = 1600;
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        gain2.gain.setValueAtTime(0.20, nå + 0.06);
        gain2.gain.exponentialRampToValueAtTime(0.001, nå + 0.15);
        osc2.start(nå + 0.06);
        osc2.stop(nå + 0.16);
    } catch {
        // Ignorer — lyd er valgfritt
    }
}

function _tastIkkeDetektert(noteIndex) {
    if (AppTilstand.tastatur) {
        AppTilstand.tastatur.oppdaterTast(noteIndex, 'hoppet-over', null);
    }
    const statusEl = document.getElementById('skanning-status');
    if (statusEl) {
        statusEl.textContent = 'Tonen ble ikke oppdaget — gikk videre';
        statusEl.className   = 'skanning-status status-advarsel';
    }
}

function _oppdaterFremdrift(indeks, totalt) {
    const pst       = totalt > 0 ? Math.round(indeks / totalt * 100) : 0;
    const barEl     = document.getElementById('fremdrift-bar-fylt');
    const tekstEl   = document.getElementById('fremdrift-tekst');
    const pstEl     = document.getElementById('fremdrift-pst');
    const barWrapper = document.querySelector('.fremdrift-bar[role="progressbar"]');

    if (barEl)      barEl.style.width = pst + '%';
    if (tekstEl)    tekstEl.textContent = `${indeks} av ${totalt} taster`;
    if (pstEl)      pstEl.textContent = pst + '%';
    if (barWrapper) {
        barWrapper.setAttribute('aria-valuenow', indeks);
        barWrapper.setAttribute('aria-valuemax', totalt);
    }
}

function _oppdaterNesteTastLabel(indeks, totalt) {
    if (indeks >= totalt) return;

    const sekvens = AppTilstand.skanneValg === 'alle'
        ? _lagAlleTasterSekvens()
        : _lagHvitTastSekvens();
    const noteIndex = sekvens[indeks];
    if (noteIndex === undefined) return;

    const info = PianoScanner.frekvensInfo(PianoScanner.idealHz(noteIndex));
    if (!info) return;

    const label = info.noteNavn + info.oktav;

    // Gjeldende tast
    const spillEl = document.getElementById('spill-tast-label');
    if (spillEl) spillEl.textContent = label;

    // Neste tast
    const nesteEl = document.getElementById('neste-tast-label');
    if (nesteEl) {
        const nesteNoteIndex = sekvens[indeks + 1];
        if (nesteNoteIndex !== undefined) {
            const nesteInfo = PianoScanner.frekvensInfo(PianoScanner.idealHz(nesteNoteIndex));
            nesteEl.textContent = nesteInfo ? nesteInfo.noteNavn + nesteInfo.oktav : '—';
        } else {
            nesteEl.textContent = '—';
        }
    }

    if (AppTilstand.tastatur) {
        AppTilstand.tastatur.settAktiv(noteIndex);
    }
}

function _settSkanneStatus(status) {
    const pulsEl   = document.getElementById('mikrofon-puls');
    const statusEl = document.getElementById('skanning-status');
    if (!pulsEl || !statusEl) return;

    switch (status) {
        case 'venter':
            pulsEl.classList.remove('puls-aktiv', 'puls-bekreftet');
            statusEl.textContent = 'Trykk "Start skanning" for å begynne';
            statusEl.className   = 'skanning-status';
            break;
        case 'lytter':
            pulsEl.classList.add('puls-aktiv');
            pulsEl.classList.remove('puls-bekreftet');
            statusEl.textContent = 'Lytter — spill neste tast';
            statusEl.className   = 'skanning-status status-lytter';
            break;
        case 'bekreftet':
            pulsEl.classList.remove('puls-aktiv');
            pulsEl.classList.add('puls-bekreftet');
            break;
    }
}

function _oppdaterBassAdvarsel(skanneIndeks) {
    const sekvens    = AppTilstand.skanneValg === 'alle'
        ? _lagAlleTasterSekvens() : _lagHvitTastSekvens();
    const noteIndex  = sekvens[skanneIndeks];
    const advarselEl = document.getElementById('bass-mikrofon-advarsel');
    if (!advarselEl) return;
    advarselEl.style.display = (noteIndex !== undefined && noteIndex < 10)
        ? '' : 'none';
}

// Skanneomfang: C1 (noteIndex 3) til A7 (noteIndex 84)
const SKANN_START = 3;
const SKANN_SLUTT = 84;

function _lagHvitTastSekvens() {
    const hviteOffsets = [0, 2, 4, 5, 7, 9, 11];
    const sekvens = [];
    for (let okt = 0; okt <= 7; okt++) {
        for (const offset of hviteOffsets) {
            const midi = (okt + 1) * 12 + offset;
            const noteIndex = midi - 21;
            if (noteIndex >= SKANN_START && noteIndex <= SKANN_SLUTT) {
                sekvens.push(noteIndex);
            }
        }
    }
    return sekvens;
}

function _lagAlleTasterSekvens() {
    const sekvens = [];
    for (let i = SKANN_START; i <= SKANN_SLUTT; i++) sekvens.push(i);
    return sekvens;
}

function _skanningFullfort(resultater) {
    AppTilstand.skanneResultater = resultater;
    AppTilstand.skannerAktiv    = false;

    const startKnapp = document.getElementById('start-skanning-knapp');
    const stoppKnapp = document.getElementById('stopp-skanning-knapp');
    if (startKnapp) startKnapp.style.display = '';
    if (stoppKnapp) stoppKnapp.style.display = 'none';

    router.navigate('analyse');
}

// ─────────────────────────────────────────────────────────────────────────────
// Rapport
// ─────────────────────────────────────────────────────────────────────────────

function _oppdaterScoreSirkel(score, status) {
    const sirkelEl = document.getElementById('score-sirkel');
    const scoreEl  = document.getElementById('score-tall');
    const statusEl = document.getElementById('score-status-tekst');
    const ikonEl   = document.getElementById('score-ikon');
    const chipEl   = document.getElementById('neste-stemming-chip');
    if (!sirkelEl) return;

    sirkelEl.classList.remove(
        'score-nivaa-1', 'score-nivaa-2', 'score-nivaa-3',
        'score-nivaa-4', 'score-nivaa-5', 'score-mangler'
    );
    const scoreRund = score !== null ? Math.round(score) : null;
    if (scoreEl) scoreEl.textContent = scoreRund !== null ? scoreRund : '—';

    if (score === null || status === 'utilstrekkelig_data') {
        sirkelEl.classList.add('score-mangler');
        if (statusEl) statusEl.textContent = 'Mangler data';
        if (ikonEl)   ikonEl.textContent   = '?';
        if (chipEl)   chipEl.style.display = 'none';
    } else {
        const nivaa = HealthScorer.scoreNivaa(score);
        sirkelEl.classList.add(`score-nivaa-${nivaa.nivaa}`);
        if (ikonEl) ikonEl.textContent = nivaa.nivaa <= 2 ? '✓' : '!';
        if (statusEl) statusEl.textContent = nivaa.tittel;
        if (chipEl) {
            chipEl.querySelector('strong').textContent = nivaa.handling;
            chipEl.style.display = '';
        }
    }

    const svgRing = document.getElementById('score-ring-bue');
    if (svgRing && scoreRund !== null) {
        const omkrets = 2 * Math.PI * 54;
        const fylt    = (scoreRund / 100) * omkrets;
        svgRing.style.strokeDasharray  = `${fylt} ${omkrets}`;
        svgRing.style.strokeDashoffset = '0';
    }
}

function _oppdaterDetaljerPanel(detaljer) {
    const el = (id) => document.getElementById(id);
    const gjEl = el('detalj-gjennomsnitt');
    const mxEl = el('detalj-maks');
    const krEl = el('detalj-kritiske');
    const adEl = el('detalj-advarsler');
    const bkEl = el('detalj-bekreftede');

    if (gjEl) gjEl.textContent = `${detaljer.gjennomsnittAvvik} ¢`;
    if (mxEl) mxEl.textContent = `${detaljer.maksAvvik} ¢`;
    if (krEl) krEl.textContent = detaljer.antallKritiske;
    if (adEl) adEl.textContent = detaljer.antallAdvarsel;
    if (bkEl) bkEl.textContent = `${detaljer.bekreftede} / 88 taster`;
}

function _tegnStemningskurve() {
    if (!AppTilstand.kurveData) return;

    const canvas = document.getElementById('stemningskurve-canvas');
    if (!canvas || typeof Chart === 'undefined') return;

    if (AppTilstand.stemningskurve) {
        AppTilstand.stemningskurve.destroy();
        AppTilstand.stemningskurve = null;
    }

    // Gjør canvas bred nok til å vise alle toner uten komprimering
    const antallPunkter = AppTilstand.kurveData.chartConfig.data.labels.length;
    const bredde = Math.max(900, antallPunkter * 18);
    canvas.style.width  = bredde + 'px';
    canvas.style.height = '380px';
    canvas.width  = bredde * 2;  // Retina
    canvas.height = 760;

    const morkModus = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const config    = morkModus
        ? TuningCurve.morkModusConfig(AppTilstand.kurveData.chartConfig)
        : AppTilstand.kurveData.chartConfig;

    config.options.responsive = false;
    config.options.maintainAspectRatio = false;

    // Klikk-handler: trykk på datapunkt for å måle tonen på nytt
    config.options.onClick = (evt, elements) => {
        if (!elements || elements.length === 0) return;
        const el = elements[0];
        if (el.datasetIndex !== 0) return; // Bare hovedkurven
        const idx = el.index;
        const noteIndices = AppTilstand.kurveData.noteIndices;
        if (!noteIndices || idx >= noteIndices.length) return;
        const noteIndex = noteIndices[idx];
        _startEnkeltNoteMåling(noteIndex);
    };

    AppTilstand.stemningskurve = new Chart(canvas, config);
}

/**
 * Re-skanner en enkelt tone fra Railsback-kurven.
 * Viser tastatur med markert tast, lytter, oppdaterer og tegner kurven på nytt.
 */
async function _startEnkeltNoteMåling(noteIndex) {
    const info = PianoScanner.frekvensInfo(PianoScanner.idealHz(noteIndex));
    if (!info) return;
    const noteNavn = info.noteNavn + info.oktav;

    // Vis overlay
    const overlay = document.getElementById('reskan-overlay');
    if (!overlay) return;

    const overlayNavn   = document.getElementById('reskan-note-navn');
    const overlayStatus = document.getElementById('reskan-status');
    const overlayAvbryt = document.getElementById('reskan-avbryt');

    if (overlayNavn)   overlayNavn.textContent = noteNavn;
    if (overlayStatus) overlayStatus.textContent = 'Spill tasten nå…';
    overlay.style.display = 'flex';

    // Vis tasten på tastaturet
    if (AppTilstand.tastatur) {
        AppTilstand.tastatur.settAktiv(noteIndex);
    }

    // Opprett ny scanner for enkeltmåling (gjenbruker mikrofon hvis mulig)
    let scanner = AppTilstand.scanner;
    if (!scanner) {
        scanner = new PianoScanner();
        try { await scanner.startMikrofon(); } catch { overlay.style.display = 'none'; return; }
    }

    // Avbryt-knapp
    let avbrutt = false;
    const _avbryt = () => { avbrutt = true; scanner.isScanning = false; overlay.style.display = 'none'; };
    if (overlayAvbryt) overlayAvbryt.addEventListener('click', _avbryt, { once: true });

    scanner.isScanning = true;
    scanner.onNoteMalt = (ni, hz) => {
        if (overlayStatus) {
            const cents = 1200 * Math.log2(hz / PianoScanner.idealHz(ni));
            overlayStatus.textContent = `Lytter… ${hz.toFixed(1)} Hz (${cents > 0 ? '+' : ''}${cents.toFixed(1)}¢)`;
        }
    };

    const resultat = await scanner.skannNote(noteIndex, true);

    if (avbrutt) return;
    overlay.style.display = 'none';

    if (resultat.status === 'bekreftet') {
        // Oppdater resultatet og tegn kurven på nytt
        AppTilstand.skanneResultater[noteIndex] = resultat;
        const kurveData = TuningCurve.generer(AppTilstand.skanneResultater);
        AppTilstand.kurveData = kurveData;

        // Recalculate score
        const scoreResultat = HealthScorer.score(AppTilstand.skanneResultater);
        AppTilstand.scoreResultat = scoreResultat;

        _tegnStemningskurve();
        _oppdaterScoreSirkel(scoreResultat.score, scoreResultat.status);
        _oppdaterDetaljerPanel(scoreResultat.detaljer);
        _oppdaterOktavTabell(scoreResultat.detaljer.perOktav);

        _spillBekreftelseslyd();
    }
}

function _oppdaterOktavTabell(perOktav) {
    const tabellEl = document.getElementById('oktav-tabell-kropp');
    if (!tabellEl || !perOktav) return;

    tabellEl.innerHTML = Object.entries(perOktav)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([oktavNavn, data]) => {
            const css = data.gjennomsnittCents !== null
                ? (Math.abs(data.gjennomsnittCents) <= 5  ? 'rad-god'
                 : Math.abs(data.gjennomsnittCents) <= 15 ? 'rad-advarsel'
                 :                                          'rad-kritisk')
                : '';
            const tegn = data.gjennomsnittCents > 0 ? '+' : '';
            return `
                <tr class="${css}">
                    <td>${oktavNavn}</td>
                    <td>${data.antallToner}</td>
                    <td>${tegn}${data.gjennomsnittCents} ¢</td>
                    <td>${data.maksCents} ¢</td>
                </tr>`;
        }).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// Event-binding
// ─────────────────────────────────────────────────────────────────────────────

function _bindAlleKnapper() {
    // Velkomst → piano-info
    _bind('start-diagnose-knapp', () => router.navigate('piano-info'));

    // Piano-info → forberedelse
    _bind('piano-info-neste-knapp', () => {
        AppTilstand.pianoInfo = {
            type:      _verdiRadio('piano-type'),
            merke:     _verdi('piano-merke'),
            alder:     _verdi('piano-alder'),
            sistStemt: _verdi('piano-sist-stemt')
        };
        router.navigate('forberedelse');
    });
    _bind('piano-info-hopp-knapp', () => router.navigate('forberedelse'));

    // Tast-valg radio-knapper i forberedelse
    const valgHvite = document.getElementById('valg-hvite');
    const valgAlle  = document.getElementById('valg-alle');
    if (valgHvite) valgHvite.addEventListener('change', () => {
        AppTilstand.skanneValg = 'hvite';
        _oppdaterForberedelseTekst();
    });
    if (valgAlle) valgAlle.addEventListener('change', () => {
        AppTilstand.skanneValg = 'alle';
        _oppdaterForberedelseTekst();
    });

    // Forberedelse → skanning (direkte, ingen modal)
    _bind('forberedelse-start-knapp', () => router.navigate('skanning'));
    _bind('forberedelse-avbryt-knapp', () => router.navigate('velkomst'));

    // Skanning — start
    _bind('start-skanning-knapp', async () => {
        const startKnapp = document.getElementById('start-skanning-knapp');
        const stoppKnapp = document.getElementById('stopp-skanning-knapp');

        if (startKnapp) startKnapp.style.display = 'none';
        if (stoppKnapp) stoppKnapp.style.display = '';

        if (!AppTilstand.scanner) {
            _visSkannFeil('Diagnosemodellen er ikke klar. Last siden på nytt.');
            if (startKnapp) startKnapp.style.display = '';
            if (stoppKnapp) stoppKnapp.style.display = 'none';
            return;
        }

        AppTilstand.skannerAktiv = true;
        _settSkanneStatus('lytter');

        try {
            await AppTilstand.scanner.startMikrofon();

            // Velg sekvens basert på brukerens valg
            const sekvens = AppTilstand.skanneValg === 'alle'
                ? AppTilstand.scanner._alleTasterSekvens()
                : null;  // null = standard hvite taster

            await AppTilstand.scanner.skannAlle(sekvens);
        } catch (err) {
            AppTilstand.skannerAktiv = false;
            if (startKnapp) startKnapp.style.display = '';
            if (stoppKnapp) stoppKnapp.style.display = 'none';

            let melding;
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                melding = 'Mikrofontilgang ble avvist. Gå til nettleserinnstillinger og tillat mikrofon for dette nettstedet.';
            } else if (err.name === 'NotFoundError') {
                melding = 'Ingen mikrofon funnet. Kontroller at en mikrofon er tilkoblet.';
            } else if (!window.isSecureContext) {
                melding = 'Mikrofon krever HTTPS. Åpne appen via https:// eller localhost.';
            } else {
                melding = 'Feil ved oppstart av mikrofon: ' + err.message;
            }
            _visSkannFeil(melding);
        }
    });

    // Skanning — stopp
    _bind('stopp-skanning-knapp', () => {
        if (AppTilstand.scanner) AppTilstand.scanner.stopp();
        AppTilstand.skannerAktiv = false;
        const startKnapp = document.getElementById('start-skanning-knapp');
        const stoppKnapp = document.getElementById('stopp-skanning-knapp');
        if (startKnapp) startKnapp.style.display = '';
        if (stoppKnapp) stoppKnapp.style.display = 'none';
        _settSkanneStatus('venter');
    });

    // Rapport
    _bind('book-stemmer-knapp', () => router.navigate('finn-stemmer'));
    _bind('del-rapport-knapp',  () => _delRapport());
    _bind('finn-stemmer-tilbake-knapp', () => router.navigate('rapport'));
    _bind('ny-analyse-knapp', () => {
        AppTilstand.skanneResultater = null;
        AppTilstand.scoreResultat    = null;
        AppTilstand.kurveData        = null;
        router.navigate('forberedelse');
    });
}

function _bind(id, fn) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
}

function _verdi(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

/**
 * Henter verdi fra en radiogruppe (name-basert).
 */
function _verdiRadio(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : '';
}

function _visSkannFeil(melding) {
    const feilEl = document.getElementById('skanning-feil');
    if (feilEl) {
        feilEl.textContent = melding;
        feilEl.style.display = '';
    }
    const statusEl = document.getElementById('skanning-status');
    if (statusEl) {
        statusEl.textContent = 'Feil oppstod';
        statusEl.className   = 'skanning-status status-feil';
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Deling
// ─────────────────────────────────────────────────────────────────────────────

function _delRapport() {
    if (!AppTilstand.scoreResultat) return;
    const { score, status } = AppTilstand.scoreResultat;
    const statusTekst = {
        god: 'God form', trenger_tilsyn: 'Trenger tilsyn',
        kritisk: 'Kritisk tilstand', utilstrekkelig_data: 'Mangler data'
    }[status] ?? 'Ukjent';

    const tekst = `Min piano-helsesjekk via PianoHelse:\nHelsescore: ${Math.round(score ?? 0)}/100 — ${statusTekst}`;

    if (navigator.share) {
        navigator.share({ title: 'PianoHelse-rapport', text: tekst, url: window.location.href })
            .catch(() => {});
    } else {
        navigator.clipboard.writeText(tekst)
            .then(() => alert('Rapporten er kopiert til utklippstavlen.'))
            .catch(() => alert(tekst));
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    _bindAlleKnapper();
    router.init();
});
