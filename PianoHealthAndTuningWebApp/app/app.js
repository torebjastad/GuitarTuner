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
    }
}

function _visForberedelse() {
    // Oppdater tidsestimat og tast-info basert på valg
    _oppdaterForberedelseTekst();
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

    // Badge
    const badgeEl = document.getElementById('helse-badge');
    if (badgeEl) {
        const konfig = {
            god:               { tekst: 'God form',       css: 'badge-god' },
            trenger_tilsyn:    { tekst: 'Trenger tilsyn', css: 'badge-tilsyn' },
            kritisk:           { tekst: 'Kritisk',        css: 'badge-kritisk' },
            utilstrekkelig_data: { tekst: 'Mangler data', css: 'badge-tilsyn' }
        };
        const k = konfig[status] ?? konfig.kritisk;
        badgeEl.className = 'helse-badge ' + k.css;
        badgeEl.querySelector('.badge-tekst').textContent = k.tekst;
        badgeEl.querySelector('.badge-score').textContent =
            score !== null ? Math.round(score) + '/100' : '—/100';
    }

    _oppdaterDetaljerPanel(detaljer);
    _tegnStemningskurve();
    _oppdaterOktavTabell(detaljer.perOktav);
}

function _visFinnStemmer() {
    const listEl = document.getElementById('stemmer-liste');
    if (!listEl) return;
    listEl.innerHTML = MOCK_STEMMERE.map(s => `
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
    const antall = erAlle ? 88 : 52;
    const minutter = Math.ceil(antall * 2 / 60);  // ca 2 sek per tast
    const tidsEl = document.getElementById('forberedelse-tidsestimat');
    if (tidsEl) {
        tidsEl.textContent = `Ca. ${minutter} minutter · ${antall} taster · Hold hver tast i ~2 sekunder`;
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
 * Spiller en kort, diskret bekreftelsestone (~50ms, 880 Hz).
 * Lavt volum så den ikke forstyrrer pianolyttingen.
 */
function _spillBekreftelseslyd() {
    try {
        if (!AppTilstand.beepCtx) {
            AppTilstand.beepCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = AppTilstand.beepCtx;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = 880;  // A5 — tydelig uten å forstyrre pianotoner
        gain.gain.value = 0.06;     // Lavt volum

        osc.connect(gain);
        gain.connect(ctx.destination);

        const nå = ctx.currentTime;
        gain.gain.setValueAtTime(0.06, nå);
        gain.gain.exponentialRampToValueAtTime(0.001, nå + 0.05);

        osc.start(nå);
        osc.stop(nå + 0.06);
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
    if (barWrapper) barWrapper.setAttribute('aria-valuenow', indeks);
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
    const spillEl = document.getElementById('spill-tast-label');
    if (spillEl) spillEl.textContent = `Spill: ${label}`;

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

function _lagHvitTastSekvens() {
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

function _lagAlleTasterSekvens() {
    const sekvens = [];
    for (let i = 0; i < 88; i++) sekvens.push(i);
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
    if (!sirkelEl) return;

    sirkelEl.classList.remove('score-god', 'score-tilsyn', 'score-kritisk', 'score-mangler');
    const scoreRund = score !== null ? Math.round(score) : null;
    if (scoreEl) scoreEl.textContent = scoreRund !== null ? scoreRund : '—';

    switch (status) {
        case 'god':
            sirkelEl.classList.add('score-god');
            if (statusEl) statusEl.textContent = 'God form';
            if (ikonEl)   ikonEl.textContent   = '✓';
            break;
        case 'trenger_tilsyn':
            sirkelEl.classList.add('score-tilsyn');
            if (statusEl) statusEl.textContent = 'Trenger tilsyn';
            if (ikonEl)   ikonEl.textContent   = '!';
            break;
        case 'kritisk':
            sirkelEl.classList.add('score-kritisk');
            if (statusEl) statusEl.textContent = 'Kritisk tilstand';
            if (ikonEl)   ikonEl.textContent   = '!';
            break;
        default:
            sirkelEl.classList.add('score-mangler');
            if (statusEl) statusEl.textContent = 'Mangler data';
            if (ikonEl)   ikonEl.textContent   = '?';
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
    // Minimum 12px per datapunkt, minimum 900px total
    const antallPunkter = AppTilstand.kurveData.chartConfig.data.labels.length;
    const bredde = Math.max(900, antallPunkter * 16);
    canvas.style.width  = bredde + 'px';
    canvas.style.height = '340px';
    canvas.width  = bredde * 2;  // Retina
    canvas.height = 680;

    const morkModus = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const config    = morkModus
        ? TuningCurve.morkModusConfig(AppTilstand.kurveData.chartConfig)
        : AppTilstand.kurveData.chartConfig;

    // Overstyr responsive for bred kurve
    config.options.responsive = false;
    config.options.maintainAspectRatio = false;

    AppTilstand.stemningskurve = new Chart(canvas, config);
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
            type:      _verdi('piano-type'),
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
