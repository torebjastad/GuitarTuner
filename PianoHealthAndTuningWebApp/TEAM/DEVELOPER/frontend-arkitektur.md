# Frontend-arkitektur — PianoHelse

**Versjon:** 1.0
**Dato:** 2026-03-20
**Forfatter:** Lead Developer

---

## 1. Prosjektstruktur

PianoHelse består av to separate frontend-applikasjoner som deler visse moduler.

```
PianoHealthAndTuningWebApp/
├── shared/                         ← Delte moduler (symlinket eller kopieres ved deploy)
│   ├── pitch-common.js             ← Fra GuitarTuner (uendret)
│   ├── ultimate-detector.js        ← Fra GuitarTuner (uendret)
│   ├── api-client.js               ← REST/Supabase-wrapper
│   ├── auth.js                     ← Autentiseringslogikk
│   └── piano-scanner.js            ← Ny (se algoritme-integrasjon.md)
│
├── app/                            ← Pianoeier-PWA (mobil)
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js                       ← Service Worker
│   ├── app.js                      ← Inngangspunkt
│   ├── state.js                    ← Tilstandsmaskin
│   ├── router.js                   ← Enkelt klientside-routing
│   ├── screens/
│   │   ├── screen-hjem.js
│   │   ├── screen-skann.js
│   │   ├── screen-resultater.js
│   │   ├── screen-marked.js
│   │   └── screen-profil.js
│   ├── components/
│   │   ├── piano-tangenter.js      ← 88-tasters visuell representasjon
│   │   ├── stemningskurve.js       ← Chart.js-wrapper
│   │   ├── helse-badge.js          ← "God" / "Trenger tilsyn" / "Kritisk" indikator
│   │   ├── oppdrag-kort.js         ← Kort i oppdragsfeeden
│   │   └── last-opp-fremgang.js    ← Progress bar for lydopplasting
│   ├── health-scorer.js            ← Scoringsalgoritme
│   ├── tuning-curve.js             ← Kurvegenering og Chart.js config
│   └── style.css
│
└── portal/                         ← Stemmer-portal (desktop)
    ├── index.html
    ├── manifest.json
    ├── sw.js
    ├── app.js
    ├── state.js
    ├── router.js
    ├── screens/
    │   ├── screen-feed.js
    │   ├── screen-oppdrag-detalj.js
    │   ├── screen-aktive-oppdrag.js
    │   ├── screen-historikk.js
    │   └── screen-profil.js
    ├── components/
    │   ├── stemningskurve.js       ← Identisk med app/ (kopiert)
    │   ├── lydspiller.js           ← <audio>-wrapper med pianotast-markering
    │   └── oppdrag-liste.js
    └── style.css
```

---

## 2. PWA-konfigurasjon

### 2.1 Service Worker (sw.js)

```javascript
// app/sw.js — Service Worker for Pianoeier-app

const CACHE_NAVN     = 'pianohelse-app-v1';
const RUNTIME_CACHE  = 'pianohelse-runtime-v1';

// App shell: filer som alltid caches ved installasjon
const APP_SHELL = [
    '/',
    '/index.html',
    '/app.js',
    '/state.js',
    '/router.js',
    '/style.css',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    // Delte algoritme-filer
    '/shared/pitch-common.js',
    '/shared/ultimate-detector.js',
    '/shared/piano-scanner.js',
    '/shared/api-client.js',
    '/shared/auth.js',
    // Screens og components
    '/screens/screen-hjem.js',
    '/screens/screen-skann.js',
    '/screens/screen-resultater.js',
    '/screens/screen-marked.js',
    '/screens/screen-profil.js',
    '/components/piano-tangenter.js',
    '/components/stemningskurve.js',
    '/components/helse-badge.js',
    '/health-scorer.js',
    '/tuning-curve.js',
    // Chart.js fra CDN caches lokalt
    'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js',
    // Supabase JS fra CDN
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];

// Installer: forhåndscache app shell
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAVN).then(cache => cache.addAll(APP_SHELL))
    );
    self.skipWaiting();
});

// Aktiver: fjern gamle cacher
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(nøkler =>
            Promise.all(
                nøkler
                    .filter(n => n !== CACHE_NAVN && n !== RUNTIME_CACHE)
                    .map(n => caches.delete(n))
            )
        )
    );
    self.clients.claim();
});

// Fetch: strategi basert på ressurstype
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Aldri cache: betalinger, lydopplasting, Stripe, Supabase Functions
    if (url.pathname.includes('/functions/v1/') ||
        url.pathname.includes('/storage/v1/object/') ||
        url.hostname.includes('stripe.com')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // 2. App shell (JS/CSS/HTML): Cache First
    if (APP_SHELL.includes(url.href) || APP_SHELL.includes(url.pathname)) {
        event.respondWith(
            caches.match(event.request).then(cached =>
                cached || fetch(event.request).then(resp => {
                    if (resp.ok) {
                        const kopi = resp.clone();
                        caches.open(CACHE_NAVN).then(c => c.put(event.request, kopi));
                    }
                    return resp;
                })
            )
        );
        return;
    }

    // 3. API-kall (REST): Network First med fallback
    if (url.hostname.includes('supabase.co') && url.pathname.includes('/rest/v1/')) {
        event.respondWith(
            fetch(event.request)
                .then(resp => {
                    if (resp.ok) {
                        const kopi = resp.clone();
                        caches.open(RUNTIME_CACHE).then(c => c.put(event.request, kopi));
                    }
                    return resp;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    // 4. Alt annet: Stale-While-Revalidate
    event.respondWith(
        caches.open(RUNTIME_CACHE).then(cache =>
            cache.match(event.request).then(cached => {
                const nettverkReq = fetch(event.request).then(resp => {
                    if (resp.ok) cache.put(event.request, resp.clone());
                    return resp;
                });
                return cached || nettverkReq;
            })
        )
    );
});
```

### 2.2 iOS PWA-installasjonsbanner

`beforeinstallprompt` støttes ikke på iOS. Vi viser en manuell guide:

```javascript
// Detekter iOS Safari og om appen ikke er installert
function erIOSSafari() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent) &&
           /safari/i.test(navigator.userAgent) &&
           !/crios|fxios|opios/i.test(navigator.userAgent);
}

function erInstallert() {
    return navigator.standalone === true ||
           window.matchMedia('(display-mode: standalone)').matches;
}

if (erIOSSafari() && !erInstallert()) {
    // Vis manuell installasjonsguide med piltegn til "Del"-knappen
    document.getElementById('ios-installer-banner').style.display = 'flex';
}
```

---

## 3. Skjermkomponenter

### 3.1 Skjermstrukturen (SPA-mønster uten rammeverk)

```javascript
// router.js — Enkelt hash-basert routing

const Router = {
    ruter: {},

    registrer(sti, fn) {
        this.ruter[sti] = fn;
    },

    naviger(sti) {
        window.location.hash = sti;
    },

    _haandterNavigasjon() {
        const hash    = window.location.hash.slice(1) || '/';
        const parts   = hash.split('/').filter(Boolean);
        const rotSti  = '/' + (parts[0] || '');
        const params  = parts.slice(1);

        const fn = this.ruter[rotSti] || this.ruter['/404'];
        if (fn) fn(...params);
    },

    start() {
        window.addEventListener('hashchange', () => this._haandterNavigasjon());
        this._haandterNavigasjon();
    }
};

// Registrering i app.js:
Router.registrer('/hjem',       () => Skjerm.vis('screen-hjem'));
Router.registrer('/skann',      (pianoId) => Skjerm.vis('screen-skann', { pianoId }));
Router.registrer('/resultater', (analyseId) => Skjerm.vis('screen-resultater', { analyseId }));
Router.registrer('/marked',     () => Skjerm.vis('screen-marked'));
Router.registrer('/profil',     () => Skjerm.vis('screen-profil'));
```

### 3.2 Tilstandsmaskin (state.js)

```javascript
// state.js — Reaktiv minimalistisk tilstandshåndtering

const State = (() => {
    let _tilstand = {
        bruker:          null,     // { id, rolle, fullt_navn, ... }
        pianoer:         [],
        aktivAnalyse:    null,     // Pågående eller siste analyse
        skanneFremdrift: 0,        // 0–88 (antall skannet taster)
        skanneResultater: [],      // Array[88] av NoteResultat
        oppdragsliste:   [],
        innlastet:       false,
        feil:            null
    };

    const _lyttere = new Map();

    return {
        hent() { return { ..._tilstand }; },

        oppdater(delvis) {
            _tilstand = { ..._tilstand, ...delvis };
            this._varsle(Object.keys(delvis));
        },

        abonner(nøkler, fn) {
            const liste = Array.isArray(nøkler) ? nøkler : [nøkler];
            const id = Symbol();
            _lyttere.set(id, { nøkler: liste, fn });
            return () => _lyttere.delete(id);  // Returnerer unsubscribe-funksjon
        },

        _varsle(endredeNøkler) {
            for (const [, { nøkler, fn }] of _lyttere) {
                if (nøkler.some(k => endredeNøkler.includes(k))) {
                    fn(_tilstand);
                }
            }
        }
    };
})();
```

---

## 4. Pianoeier-appen: Skjermflyt

```
┌─────────────────────────────────────────────────────────────────┐
│                      SKJERMFLYT (app/)                          │
│                                                                 │
│  [Splash]                                                       │
│      │                                                          │
│      ├─→ Ikke innlogget → [Innlogging/Registrering]             │
│      │       │                                                  │
│      │       └─→ Google/Apple/E-post OAuth                     │
│      │               │                                         │
│      └─→ Innlogget → [Hjem] ◄─────────────────────────────────┤│
│                         │                                      ││
│              ┌──────────┼──────────┐                           ││
│              ▼          ▼          ▼                           ││
│          [Mine     [Siste      [Marked]                        ││
│           pianoer]  analyser]  → Åpne oppdrag                  ││
│              │          │          │                           ││
│              ▼          ▼          └─→ [Oppdrag-detalj]       ││
│          [Nytt/       [Analyse-                               ││
│           Rediger      detalj]                                 ││
│           piano]          │                                    ││
│              │            └─→ [Start oppdrag →]───────────────┘│
│              │                                                  │
│              └─→ [SKANNEFLYT]                                  │
│                      │                                         │
│               ┌──────┴──────┐                                  │
│               ▼             ▼                                  │
│         [Tillatelse    [Mikrofon OK]                           │
│          spurt]              │                                  │
│               │              ▼                                  │
│               │        [Spill tast X]                          │
│               │        [Visuell bekreftelse]                   │
│               │        [Neste →]                               │
│               │              │ (×52 hvite taster)              │
│               │              ▼                                  │
│               │        [Analyse pågår...]                      │
│               │              │                                  │
│               │              ▼                                  │
│               └──────→ [RESULTATER]                            │
│                              │                                  │
│                    ┌─────────┼──────────┐                      │
│                    ▼         ▼          ▼                      │
│             [Helsescore] [Kurve-    [Last opp /                │
│             God/Tilsyn/  diagram]   Del rapport]               │
│             Kritisk]         │          │                      │
│                    │         │          ▼                      │
│                    │         │    [Lydsamtykke →]             │
│                    └─────────┼─→  [Bestill stemmer →]         │
│                              │          │                      │
│                              │          ▼                      │
│                              │    [Opprett oppdrag]           │
│                              │    [Fast pris satt]             │
│                              └────────────────────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

### 4.1 Skanneflyt-skjerm (screen-skann.js)

Dette er den mest komplekse skjermen. Den koordinerer:
- Mikrofonoppsett
- PianoScanner-orkestrering
- Sanntids-UI-oppdatering
- Lydopptak (optional)

```javascript
// screens/screen-skann.js

class SkannSkjerm {
    constructor(pianoId) {
        this.pianoId    = pianoId;
        this.scanner    = new PianoScanner();
        this._aktiv     = false;
    }

    async mount(container) {
        container.innerHTML = this._render();
        this._bindEvents();
    }

    _render() {
        return `
        <div class="skann-skjerm">
            <header>
                <h1>Skann pianoet ditt</h1>
                <p class="undertekst">Spill tastene én for én når vi ber deg om det</p>
            </header>

            <div class="fremdrift-sekvens">
                <div class="neste-tast" id="neste-tast">
                    <span class="tast-navn" id="tast-navn">—</span>
                    <span class="tast-hz"  id="tast-hz"></span>
                </div>
                <div class="naal-container" id="naal-container">
                    <!-- Gjenbruker CSS fra GuitarTuner-prosjektet -->
                    <div class="naal" id="naal"></div>
                </div>
                <div class="status-melding" id="status-melding">Klar til å starte</div>
            </div>

            <div class="piano-tangenter-container">
                <!-- Komponent: Visuell 88-tasters keyboard (scrollbar for mobil) -->
                <piano-tangenter id="piano-tangenter"></piano-tangenter>
            </div>

            <div class="fremdrift-bar">
                <div class="fremdrift-fylt" id="fremdrift-fylt" style="width:0%"></div>
                <span id="fremdrift-tekst">0 av 52 taster</span>
            </div>

            <div class="skann-knapper">
                <button id="start-skann-knapp" class="knapp-primer">
                    Start skanning
                </button>
                <button id="stopp-knapp" class="knapp-sekunder" style="display:none">
                    Avbryt
                </button>
            </div>

            <div class="lydsamtykke" id="lydsamtykke" style="display:none">
                <label>
                    <input type="checkbox" id="lagre-lyd-check">
                    Lagre lydopptak (gjør det lettere for stemmer å vurdere jobben)
                </label>
            </div>
        </div>`;
    }

    _bindEvents() {
        document.getElementById('start-skann-knapp').addEventListener('click',
            () => this._startSkanning());
        document.getElementById('stopp-knapp').addEventListener('click',
            () => this._stoppSkanning());

        // Koble PianoScanner callbacks til UI
        this.scanner.onNoteMalt = (noteIndex, hz) => {
            this._oppdaterNaal(hz, PianoScanner.idealHz(noteIndex));
        };

        this.scanner.onNoteBekreft = (noteIndex, resultat) => {
            this._markerTastBekreftet(noteIndex, resultat.cents);
            this._oppdaterFremdrift(noteIndex);
        };

        this.scanner.onNoteIkkeDetektert = (noteIndex) => {
            this._markerTastHoppetOver(noteIndex);
        };

        this.scanner.onSkanningFullfort = (resultater) => {
            this._fullfortSkanning(resultater);
        };
    }

    async _startSkanning() {
        document.getElementById('start-skann-knapp').style.display = 'none';
        document.getElementById('stopp-knapp').style.display = 'block';

        try {
            await this.scanner.startMikrofon();
            document.getElementById('lydsamtykke').style.display = 'block';
            await this.scanner.skannAlle();
        } catch (err) {
            if (err.name === 'NotAllowedError') {
                document.getElementById('status-melding').textContent =
                    'Mikrofontilgang ble avvist. Vennligst tillat mikrofon i nettleserinnstillingene.';
            } else {
                document.getElementById('status-melding').textContent =
                    'Feil ved oppstart: ' + err.message;
            }
        }
    }

    _oppdaterNaal(detektertHz, idealHz) {
        const cents = 1200 * Math.log2(detektertHz / idealHz);
        const vist  = Math.max(-50, Math.min(50, cents));
        const pst   = 50 + (vist / 50) * 45;
        document.getElementById('naal').style.left = pst + '%';
    }

    _markerTastBekreftet(noteIndex, cents) {
        const farge = Math.abs(cents) <= 5  ? 'intonasjon-god'    :
                      Math.abs(cents) <= 15 ? 'intonasjon-advarsel' :
                                              'intonasjon-kritisk';
        document.querySelector(`[data-note-index="${noteIndex}"]`)
            ?.classList.add('bekreftet', farge);
    }

    async _fullfortSkanning(resultater) {
        const score      = HealthScorer.score(resultater);
        const kurveData  = TuningCurve.generer(resultater);
        const lydBlob    = document.getElementById('lagre-lyd-check')?.checked
                           ? this.scanner.hentLydblob()
                           : null;

        State.oppdater({
            skanneResultater: resultater,
            aktivAnalyse:     { score, kurveData, lydBlob, pianoId: this.pianoId }
        });

        Router.naviger('/resultater');
    }
}
```

---

## 5. Felles komponenter

### 5.1 PianoTangenter (piano-tangenter.js)

Visuell representasjon av 88 taster, optimert for berøringsskjerm:

```javascript
class PianoTangenter extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        // Generer 88 taster med korrekt hvit/svart-mønster
        // Hvite taster: 12px bred, svarte: 8px bred, overlappende
        // Scrollbar horisontalt for mobil
        // data-note-index="0"..."87" for stilhook
        const html = this._genererTangentHTML();
        this.innerHTML = `<div class="tangent-wrapper">${html}</div>`;
    }

    markerAktiv(noteIndex) {
        this.querySelectorAll('.tangent.aktiv').forEach(el => el.classList.remove('aktiv'));
        this.querySelector(`[data-note-index="${noteIndex}"]`)?.classList.add('aktiv');
    }

    markerResultat(noteIndex, status) {
        // status: 'bekreftet-god' | 'bekreftet-advarsel' | 'bekreftet-kritisk' | 'hoppet-over'
        this.querySelector(`[data-note-index="${noteIndex}"]`)?.classList.add(status);
    }

    _genererTangentHTML() {
        const hviteOffsets = new Set([0, 2, 4, 5, 7, 9, 11]);
        let html = '';
        for (let i = 0; i < 88; i++) {
            const midi   = i + 21;
            const offset = midi % 12;
            const erHvit = hviteOffsets.has(offset);
            html += `<div class="tangent ${erHvit ? 'hvit' : 'svart'}"
                          data-note-index="${i}"
                          aria-label="Tone ${i}"></div>`;
        }
        return html;
    }
}

customElements.define('piano-tangenter', PianoTangenter);
```

### 5.2 Stemningskurve (stemningskurve.js)

```javascript
class StemningskurveKomponent {
    constructor(canvasId) {
        this.canvas  = document.getElementById(canvasId);
        this.diagram = null;
    }

    tegn(kurveConfig) {
        if (this.diagram) this.diagram.destroy();
        this.diagram = new Chart(this.canvas, kurveConfig);
    }

    // Legg til Railsback-referanselinje som overlay
    leggTilRailsbackRef() { /* Se tuning-curve.js */ }

    oppdaterDatapunkt(noteIndex, cents) {
        if (!this.diagram) return;
        this.diagram.data.datasets[0].data[noteIndex] = cents;
        this.diagram.update('none');  // Ingen animasjon for sanntidsoppdateringer
    }
}
```

### 5.3 HelseBadge (helse-badge.js)

```javascript
function lagHelseBadge(status, score) {
    const konfig = {
        god:            { tekst: 'God form',       emoji: '', css: 'badge-god' },
        trenger_tilsyn: { tekst: 'Trenger tilsyn', emoji: '', css: 'badge-tilsyn' },
        kritisk:        { tekst: 'Kritisk',        emoji: '', css: 'badge-kritisk' }
    };
    const k = konfig[status] ?? konfig.kritisk;
    return `
        <div class="helse-badge ${k.css}">
            <span class="badge-tekst">${k.tekst}</span>
            <span class="badge-score">${score !== null ? Math.round(score) : '—'}/100</span>
        </div>`;
}
```

---

## 6. Stemmer-portalen: Oppdragsfeed (screen-feed.js)

```javascript
class OppdragsFeedSkjerm {
    constructor() {
        this._abonnement = null;
    }

    async mount(container) {
        container.innerHTML = this._renderSkeleton();
        await this._lastOppdrag();
        this._abonnerSanntid();
    }

    async _lastOppdrag() {
        const stemmer = State.hent().bruker;
        const region  = stemmer.postnummer?.slice(0, 2) ?? '';

        const oppdrag = await ApiKlient.hentAapneOppdrag(region);
        State.oppdater({ oppdragsliste: oppdrag });
        this._rendreOppdragListe(oppdrag);
    }

    _abonnerSanntid() {
        const stemmer = State.hent().bruker;
        const region  = stemmer.postnummer?.slice(0, 2) ?? '';

        this._abonnement = abonnerOppdragsVarsler(region, (nytt) => {
            this._visBannerVarsel(nytt);
            this._lastOppdrag();  // Oppdater listen
        });
    }

    _visBannerVarsel(oppdrag) {
        const banner = document.createElement('div');
        banner.className  = 'varsel-banner';
        banner.textContent = `Nytt oppdrag i ${oppdrag.by}: ${oppdrag.pris_nok} NOK`;
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), 5000);
    }

    unmount() {
        // Cleanup WebSocket-abonnement
        if (this._abonnement) {
            this._abonnement.unsubscribe();
            this._abonnement = null;
        }
    }
}
```

---

## 7. Lydavspillerkomponent for stemmer (lydspiller.js)

```javascript
class LydspillerKomponent {
    constructor(containerId) {
        this.container  = document.getElementById(containerId);
        this.analyseId  = null;
        this.audEl      = null;
    }

    async last(analyseId) {
        this.analyseId = analyseId;
        const signertUrl = await ApiKlient.hentSignertLydUrl(analyseId);

        this.container.innerHTML = `
            <div class="lydspiller">
                <audio id="audio-element" controls preload="metadata">
                    <source src="${signertUrl}">
                    Din nettleser støtter ikke lydavspilling.
                </audio>
                <p class="lyd-notat">
                    Lyden utløper om 60 minutter. Last siden på nytt ved behov.
                </p>
            </div>`;

        this.audEl = document.getElementById('audio-element');
    }
}
```

---

## 8. Offline-kapasitet

### 8.1 Hva fungerer offline

| Funksjon | Offline-støtte | Begrunnelse |
|---|---|---|
| Vise tidligere analyseresultater | Ja (Network First → cache fallback) | Historiske data er nyttige offline |
| Se stemningskurve fra siste analyse | Ja | Lagres i State + IndexedDB |
| Starte ny skanning | Ja | Alt pitch-detection er lokalt |
| Laste opp analyseresultater | Nei, men køes | Opplasting krever nettverk |
| Betalingsflyt | Nei | Stripe krever nettverk |
| Oppdragsfeed | Begrenset (siste cachet liste) | Realtime fungerer ikke offline |

### 8.2 IndexedDB for offline-persistens

For å lagre ufullstendige skanneresultater mellom øktene (f.eks. bruker mister internett midt i skanningen):

```javascript
// Enkelt IndexedDB-wrapper i state.js
const OfflineKø = {
    async køAnalyse(analysePayload) {
        const db  = await this._apneDB();
        const tx  = db.transaction('kø', 'readwrite');
        tx.objectStore('kø').put({ ...analysePayload, id: Date.now(), type: 'analyse' });
    },

    async behandleKø() {
        if (!navigator.onLine) return;
        const db    = await this._apneDB();
        const kø    = await this._hentKø(db);
        for (const item of kø) {
            try {
                if (item.type === 'analyse') await ApiKlient.opprettAnalyse(item.payload);
                await this._fjernFraKø(db, item.id);
            } catch { /* Prøv igjen neste gang */ }
        }
    }
};

window.addEventListener('online', () => OfflineKø.behandleKø());
```

---

## 9. Tilgjengelighet og norsk UX

### 9.1 Internasjonalisering: Kun norsk (bokmål)

Alle strenger er på norsk. Ingen i18n-rammeverk brukes — hardkodede norske strenger er riktig valg for MVP da:
- Målmarkedet er utelukkende Norge
- Ingen oversettelseskompleksitet
- Enklere kodebase

### 9.2 Tilgjengelighets-krav

```html
<!-- Alle interaktive elementer har aria-labels på norsk -->
<button aria-label="Start skanning av piano">Start skanning</button>

<!-- Statusmeldinger bruker aria-live for skjermlesere -->
<div aria-live="polite" id="status-melding">Klar til å starte</div>

<!-- Piano-tangenter er dekorative (ikke interaktive) — role="presentation" -->
<div class="tangent hvit" role="presentation" data-note-index="0"></div>
```

### 9.3 Berøringsvennlig design

- Minimum berøringsmål: 44×44 px (Apple HIG) / 48×48 dp (Material Design)
- Knapper i skanneflyt er store og har god avstand — brukeren holder telefonen med én hånd mens de spiller piano med den andre
- Piano-tangentvisualisering er scrollbar, ikke zoom-avhengig
- Tilstandsfarger bruker aldri farge alene som informasjonsbærer (alltid tekst + form/ikon i tillegg)

### 9.4 CSS custom properties (konsistent med eksisterende kodebase)

```css
/* style.css — Bygger på eksisterende GuitarTuner-tokens */
:root {
    /* Eksisterende tokens (beholdes) */
    --bg-color:        #0f0f1a;
    --card-bg:         rgba(255,255,255,0.05);
    --text-primary:    #e8e8f0;
    --text-secondary:  #888899;
    --accent-color:    #7c6af7;
    --success-color:   #28c87a;
    --warning-color:   #ffb41e;
    --danger-color:    #dc3c3c;
    --needle-color:    #c8c8e0;

    /* Nye tokens for PianoHelse */
    --helse-god:       #28c87a;     /* Grønn */
    --helse-tilsyn:    #ffb41e;     /* Gul */
    --helse-kritisk:   #dc3c3c;     /* Rød */
    --tast-hvit:       #f0f0f0;
    --tast-svart:      #1a1a2a;
    --tast-bekreftet:  rgba(40,200,122,0.4);
    --tast-advarsel:   rgba(255,180,30,0.4);
    --tast-kritisk:    rgba(220,60,60,0.4);
    --piano-border:    rgba(255,255,255,0.15);
}
```

---

## 10. Ytelse og leveringsteknikk

### 10.1 Lasting av JS-filer

Samme mønster som GuitarTuner: script-tags i avhengighetsrekkefølge, ingen bundler:

```html
<!-- app/index.html -->
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#1a1a2e">
    <link rel="manifest" href="/manifest.json">
    <link rel="stylesheet" href="/style.css">
    <title>PianoHelse</title>
</head>
<body>
    <div id="app"></div>

    <!-- Eksterne avhengigheter (fra CDN, caches i Service Worker) -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>

    <!-- Felles algoritme-lag (avhengighetsrekkefølge) -->
    <script src="/shared/pitch-common.js"></script>
    <script src="/shared/ultimate-detector.js"></script>
    <script src="/shared/api-client.js"></script>
    <script src="/shared/auth.js"></script>
    <script src="/shared/piano-scanner.js"></script>

    <!-- App-spesifikk logikk -->
    <script src="/health-scorer.js"></script>
    <script src="/tuning-curve.js"></script>
    <script src="/state.js"></script>
    <script src="/router.js"></script>

    <!-- Komponenter -->
    <script src="/components/piano-tangenter.js"></script>
    <script src="/components/stemningskurve.js"></script>
    <script src="/components/helse-badge.js"></script>

    <!-- Skjermer -->
    <script src="/screens/screen-hjem.js"></script>
    <script src="/screens/screen-skann.js"></script>
    <script src="/screens/screen-resultater.js"></script>
    <script src="/screens/screen-marked.js"></script>
    <script src="/screens/screen-profil.js"></script>

    <!-- Inngangspunkt -->
    <script src="/app.js"></script>

    <!-- Service Worker-registrering -->
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }
    </script>
</body>
```

### 10.2 Supabase-klient-initialisering

```javascript
// app.js — Globalt initialisert én gang

window._supabaseClient = supabase.createClient(
    'https://{project-id}.supabase.co',
    '{anon-public-key}'   // Anon-nøkkel er trygg å eksponere i frontend (RLS beskytter data)
);

// Init-sekvens
(async () => {
    const økt = await Auth.hentOkt();
    if (økt) {
        State.oppdater({ bruker: økt.user, innlastet: true });
    } else {
        State.oppdater({ innlastet: true });
    }
    Router.start();
})();
```

### 10.3 Ytelsesbudsjett

| Metrikk | Mål | Begrunnelse |
|---|---|---|
| First Contentful Paint | < 1,5 sek på 4G | PWA med Service Worker cache |
| Time to Interactive | < 3 sek på 4G | Ingen tunge rammeverk |
| Lighthouse PWA-score | > 90 | Installérbar på iOS/Android |
| Total JS-bundelstørrelse | < 200 KB (uten CDN) | Inkl. pitch-detection kode |
| Chart.js (CDN) | ~200 KB (cachet) | Akseptabelt for visualisering |
| Supabase JS (CDN) | ~50 KB (cachet) | Nødvendig |
| **Totalt første last** | **< 500 KB** | Akseptabelt for mobilbrukere |
