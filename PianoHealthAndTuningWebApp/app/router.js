// router.js — Hash-basert klientside-ruter for PianoHelse.
// Ingen History API — bruker window.location.hash for iOS-kompatibilitet.
//
// Bruk:
//   const router = new Router();
//   router.registrer('velkomst', () => { ... });
//   router.init();
//   router.navigate('skanning');

'use strict';

class Router {
    constructor() {
        // Kart fra skjermId → handlingsfunksjon
        this._ruter = {};
        // Alle kjente seksjoner i DOM-en
        this._skjermKlasse = 'skjerm';
        this._skjulKlasse  = 'skjul';
        // Forrige aktive skjerm-id (for opprydding)
        this._aktivSkjerm  = null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Offentlig API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Registrer en skjerm med en handlingsfunksjon.
     * @param {string} skjermId - ID-en på <section id="skjerm-{skjermId}">
     * @param {Function} fn - Kalles når denne skjermen aktiveres. Mottar eventuelle route-params.
     */
    registrer(skjermId, fn) {
        this._ruter[skjermId] = fn;
        return this;
    }

    /**
     * Naviger til en skjerm. Oppdaterer hash og viser riktig seksjon.
     * @param {string} skjermId - Skjerm-ID
     * @param {object} [params] - Valgfrie parametere sendt til handleren
     */
    navigate(skjermId, params) {
        window.location.hash = skjermId;
        this._aktiverSkjerm(skjermId, params);
    }

    /**
     * Start routeren — lytter på hashchange og viser initial skjerm.
     */
    init() {
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '').trim();
            const [skjermId, ...paramDeler] = hash.split('/');
            const params = paramDeler.length > 0
                ? Object.fromEntries(paramDeler.map((v, i) => [i, v]))
                : {};
            this._aktiverSkjerm(skjermId || 'velkomst', params);
        });

        // Vis innledende skjerm fra hash eller fallback til 'velkomst'
        const initiellHash = window.location.hash.replace('#', '').trim();
        const skjermId     = initiellHash.split('/')[0] || 'velkomst';
        this._aktiverSkjerm(skjermId);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Intern hjelpemetode
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Skjuler alle seksjoner, viser den valgte, og kaller tilhørende handler.
     * @param {string} skjermId
     * @param {object} [params]
     */
    _aktiverSkjerm(skjermId, params = {}) {
        // Finn alle seksjoner
        const alleSeksjoner = document.querySelectorAll('.' + this._skjermKlasse);
        alleSeksjoner.forEach(el => el.classList.add(this._skjulKlasse));

        // Vis ønsket seksjon
        const mål = document.getElementById('skjerm-' + skjermId);
        if (mål) {
            mål.classList.remove(this._skjulKlasse);
            this._aktivSkjerm = skjermId;
        } else {
            console.warn('[Router] Fant ikke skjerm:', 'skjerm-' + skjermId);
            // Fallback til velkomst
            const velkomst = document.getElementById('skjerm-velkomst');
            if (velkomst) velkomst.classList.remove(this._skjulKlasse);
        }

        // Kall registrert handler
        const fn = this._ruter[skjermId];
        if (fn) {
            fn(params);
        }
    }
}
