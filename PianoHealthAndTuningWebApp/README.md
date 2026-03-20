# PianoHelse

> **"Vi gjør pianostell enkelt og tilgjengelig for alle."**

**Status:** [Konseptfase / Pre-utvikling] [Versjon: 0.1 — MVP ikke lansert] [Sist oppdatert: 20. mars 2026]

Norges første AI-drevne plattform for pianohelseanalyse og booking av pianostemmere.

---

## Visjon

PianoHelse lar pianoeiere ta opp lyden av pianoet sitt med mobiltelefonen, få en visuell stemningskurve og helseanalyse, og booke en lokal, sertifisert pianostemmer direkte i appen — alt på under 5 minutter. For pianostemmere er det en portal med forhåndskvalifiserte oppdrag, komplett med lydopptak og diagnostikk, slik at de vet hva de møter før de setter foten innenfor døren. Plattformens teknologiske kjerne er `UltimateDetector`, en JavaScript-basert pitchdetektor som dekker hele pianoets frekvensområde fra A0 til C8 uten serversidekall.

---

## Markedsmulighet

| Nøkkeltall | Verdi |
|---|---|
| Estimerte pianoer i Norge | 75 000–120 000 (midtpunkt 97 500) |
| Aktive pianoer (40 % anslag) | ca. 39 000 |
| Stemminger per år (Norge, TAM) | 58 500 |
| **TAM — total markedsverdi (Norge)** | **Kr 166,9 mill/år** |
| SAM (konservativt — 5 byer, 35 % digitalvilje) | Kr 17,5 mill/år |
| Norsk stemmepris 2026 | Kr 2 853 inkl. mva. |
| NPTF-autoriserte stemmere (Norge) | 66 registrerte |
| Gjennomsnittsalder blant NPTF-stemmere | 62 år — generasjonskrise |
| Europeisk nedgang i antall stemmere (2021–2024) | −15 % |
| Global pianostemmer-marked 2024 | USD 1,8 mrd (CAGR 4,2 %) |
| Nærmeste norsk konkurrent | Mittanbud.no (generalist, ingen diagnostikk) |

Plattformens kjernefortrinn: ingen aktør i Norge kombinerer akustisk diagnose, strukturert markedsplass og norsk geografi i ett produkt.

---

## Slik kjører du appen

Ingen byggsteg. Ingen pakkehåndterer. Serve prosjektroten via HTTP (direkte `file://`-tilgang blokkerer mikrofontilgang i de fleste nettlesere):

```bash
# Naviger til GuitarTuner-roten
cd /sti/til/GuitarTuner

# Python (anbefalt for lokal utvikling)
python3 -m http.server 8080

# Node.js alternativ
npx serve .
```

Åpne deretter: `http://localhost:8080/PianoHealthAndTuningWebApp/app/index.html`

Appen krever:
- En nettleser med `getUserMedia`-støtte (HTTPS eller `localhost`)
- Mikrofontillatelse (iOS Safari og Android Chrome støttes)
- Et akustisk piano tilkoblet i samme rom

---

## Prosjektstruktur

```
PianoHealthAndTuningWebApp/
│
├── README.md                          # Denne filen — prosjektoversikt
├── Piano Health & Tuning Marketplace.md  # Opprinnelig konseptbeskrivelse
│
├── app/                               # Produksjonsklar klientkode (PWA)
│   ├── index.html                     # Enkel-side HTML-skall (ingen rammeverk)
│   ├── style.css                      # Mørkt tema, CSS custom properties
│   ├── manifest.json                  # PWA-manifest (installasjon, ikoner)
│   ├── sw.js                          # Service Worker (offline-støtte)
│   ├── router.js                      # Hash-basert SPA-router (iOS-kompatibel)
│   ├── app.js                         # Inngangspunkt — initialiserer alle moduler
│   ├── piano-scanner.js               # Orkestrerer 52-tasters skanning via mikrofon
│   ├── piano-keyboard.js              # Visuell klaviaturgjengivelse (Canvas)
│   ├── health-scorer.js               # Beregner helsepoeng (0–100) og anbefalinger
│   ├── tuning-curve.js                # Stemmekurve-visualisering (Chart.js)
│   └── icons/
│       └── icon.svg                   # App-ikon (piano-silhuett)
│
├── PRODUCT/                           # Produktdokumentasjon
│   ├── kravspesifikasjon.md           # Fullstendig norsk kravspesifikasjon (brukerhistorier, GDPR)
│   ├── investorpitch.md               # Investor-pitch-deck i Markdown
│   ├── en-pager.md                    # Enside-sammendrag for nye teammedlemmer
│   ├── gdpr-og-juridisk.md            # GDPR-analyse, personvernerklæring, ansvarsfraskrivelse
│   └── db/
│       └── schema.sql                 # Supabase PostgreSQL-skjema (pianoer, oppdrag, stemmere)
│
├── DESIGN/
│   └── wireframes/
│       └── skjermbilder.md            # ASCII-wireframes for alle nøkkelskjermer
│
└── TEAM/                              # Agentdokumentasjon per rolle
    ├── LEAD/
    │   ├── master-plan.md             # Strategi, faseplan, KPIer, investering
    │   ├── gap-analyse.md             # 20 identifiserte gap og prioriterte tiltak
    │   ├── risiko-register.md         # 15 risikoer med score og tiltak
    │   ├── coordination-log.md        # Koordinasjonslogg mellom agenter
    │   ├── project-status.md          # Nåværende prosjektstatus og fremdrift
    │   └── beslutningslogg.md         # Logg over viktige prosjektbeslutninger
    │
    ├── DEVELOPER/
    │   ├── teknisk-arkitektur.md      # Supabase, Stripe Connect, PWA-arkitektur
    │   ├── algoritme-integrasjon.md   # UltimateDetector-integrasjon, PianoScanner, HealthScorer
    │   ├── api-design.md              # Supabase Edge Functions og REST API-design
    │   └── frontend-arkitektur.md     # Vanilla JS, hash-router, CSS-tokens
    │
    ├── DESIGNER/
    │   ├── designsystem.md            # Farger, typografi, komponenter
    │   ├── brukerflyt.md              # Detaljerte brukerflyter for alle scenarier
    │   ├── ux-research.md             # Brukerundersøkelse og UX-innsikt
    │   └── design-critique.md         # Faglig designkritikk og anbefalinger
    │
    ├── PIANO-TUNER/
    │   ├── marked-og-fagkunnskap.md   # NPTF, PTG, prissetting, bransjeforhold
    │   ├── diagnose-validering.md     # Faglig vurdering av diagnostikkmodulen
    │   ├── krav-til-plattformen.md    # Stemmernes krav og ønsker
    │   └── pianohelse-faglig.md       # Faglig grunnlag for helsekarakterene
    │
    ├── ECONOMIST/
    │   ├── enhetokonomi.md            # TAM/SAM/SOM, CAC, LTV, break-even
    │   ├── finansiell-modell.md       # 18-måneders P&L (base/pessimistisk/optimistisk)
    │   ├── inntektsmodell.md          # Provisjonsstruktur og prisstrategier
    │   └── prisstrategi.md            # Priselastisitet og konkurrentanalyse
    │
    └── MARKETING/
        ├── lanseringsstrategi.md      # Go-to-market, PR-plan, beta-rekruttering
        ├── innholdsstrategi.md        # SEO, innholdsproduksjon, kanaler
        ├── merkevareidentitet.md      # Navn, farger, tone-of-voice
        ├── målgrupper.md              # Segmentering og personas
        ├── partnerskap.md             # Pianobutikker, kulturskoler, NPTF
        └── veksttaktikker.md          # Referralprogram, lojalitet, viralt potensial
```

**Totalt: 43 filer** (inkl. denne README)

---

## Teknisk arkitektur

### Klient — PWA / Vanilla JS

Appen er en Progressive Web App uten rammeverk, uten bundler og uten npm. Alle avhengigheter lastes som `<script>`-tagger i HTML-hodet i riktig rekkefølge.

```
index.html
  └── router.js          Hash-basert SPA-router (#/diagnose, #/booking, osv.)
  └── piano-scanner.js   Web Audio API → UltimateDetector → cent-avvik per note
  └── piano-keyboard.js  Canvas-basert klaviaturvisning med fargekoding
  └── health-scorer.js   Vektet gjennomsnitt av cent-avvik → helsescore 0–100
  └── tuning-curve.js    Chart.js stemmekurve med Railsback-referanselinje
  └── app.js             Inngangspunkt — binder modulene og starter routing
```

Alle lydanalyser skjer utelukkende klient-side. Ingen lyddata sendes til serveren. Dette er et GDPR-krav og et arkitekturprinsipp som ikke skal brytes.

### Algoritme — UltimateDetector

`UltimateDetector` (fra `GuitarTuner`-prosjektet) er den teknologiske kjernen. Den er en hybrid tre-trinns detektor:

1. **McLeod MPM** (FFT-basert autokorrelasjon) — håndterer bass A0–C5
2. **Frekvensvektet spektraltopp** (65 536-punkts FFT) — håndterer diskant C5–C8
3. **Beslutningsmotor** med harmonisk verifisering — velger beste kandidat

Nøkkelegenskaper for pianoapplikasjon:
- Frekvensdekning: 27,5 Hz (A0) til 4186 Hz (C8) — alle 88 taster
- Stigende toleranse for overtoner (`tol = baseTolerance + 0.005 * n`) — robusthet mot inharmonisitet
- Validert for midtregisteret A1–C6 (±1–4 cent med mobilmikrofon); begrenset under 80 Hz

### Backend — Supabase (planlagt, Fase 2)

Backend-arkitekturen er designet men ikke implementert. Den planlegges på Supabase (Frankfurt-region, `eu-central-1`):

```
Supabase PostgreSQL   → pianoer, oppdrag, stemmere, helseanalyser, profiler
Supabase Auth         → e-post/passord + magic links
Supabase Storage      → JSON-diagnostikkrapporter (lydopptak lagres IKKE)
Supabase Edge Func.   → booking-logikk, Stripe Connect, e-postvarsler
Stripe Connect        → betalinger og utbetalinger til stemmere
Resend (e-post)       → transaksjons-e-poster og påminnelser
```

Merk: DPA med Supabase, Stripe og Resend er ikke signert ennå (GAP-17).

---

## Forretningsmodell

| Parameter | Verdi |
|---|---|
| Gjennomsnittlig booking-verdi | Kr 2 853 inkl. mva. |
| Anbefalt provisjon ved oppstart | 12 % |
| Netto til PianoHelse per booking (12 %) | Kr 277 (etter Stripe-gebyrer) |
| Netto til PianoHelse per booking (15 %) | Kr 363 |
| Break-even bookinger per måned | **47 bookinger/mnd** (ved 12 % provisjon) |
| Anbefalte økning til 15 % provisjon | Fra måned 13 |
| EBITDA-positivt (base case) | **Måned 13** |
| Akkumulert kapitalbehov (base case) | **Kr 530 000** |
| LTV : CAC — pianoeier | 6,9 : 1 (LTV kr 2 078 / CAC kr 300) |
| LTV : CAC — pianostemmer | 297 : 1 (LTV kr 178 165 / CAC kr 600) |

**Bootstrapping i MVP-fasen:** Ingen provisjon tas. Diagnostikk er gratis. Stemmerprofiler er gratis i 12 måneder. Fokus er brukerdata og nettverksbygging.

---

## Neste steg mot MVP-lansering

Gjenstående arbeid før MVP kan lanseres (basert på gap-analyse og master-plan):

**Kritiske — blokkerer lansering:**
- [ ] Ta endelig beslutning om prismodell: fast pris vs. anbudsmodell (GAP-11)
- [ ] Skriv og publiser personvernerklæring på norsk (GAP-01)
- [ ] Implementer digital piano-deteksjon og dedikert UX (GAP-14)
- [ ] Design "ingen stemmere i ditt område"-skjerm (GAP-15)
- [ ] Implementer cookie-banner i henhold til ePrivacy-direktivet (GAP-08)
- [ ] Opprett RoPA (Record of Processing Activities, GDPR art. 30) (GAP-16)

**Teknisk utvikling:**
- [ ] Rekrutter 15–20 pianostemmere i Oslo manuelt FØR lansering
- [ ] Test diagnostikkmodul på minimum 10 mobilenhetsmodeller (iOS + Android)
- [ ] Implementer "gjenoppta skanning"-funksjonalitet (IndexedDB) (GAP-13)
- [ ] Signer DPA med Supabase, Stripe og Resend (GAP-17)
- [ ] Avklar MVA-struktur for provisjonsmodell med skatterådgiver (GAP-09)

**Fase 2 (etter MVP-validering):**
- [ ] Stripe Connect-integrasjon og betalingsflyt
- [ ] Vipps-integrasjon (via Nets Easy eller direkte Vipps-API)
- [ ] Kalenderintegrasjon og automatisk stemmer-matching
- [ ] Ratings og anmeldelsessystem
- [ ] Nasjonal utrulling (Bergen, Trondheim, Stavanger, Kristiansand)

---

## Juridisk og GDPR

**Personvern:**
- All lydanalyse skjer klient-side i nettleseren. Ingen lyd overføres til server.
- Eksplisitt samtykke innhentes før mikrofontilgang (ikke forhåndsavkrysset).
- Supabase Frankfurt-region (EU) benyttes for all datalagring.
- Lydopptak (dersom lagret): slettes 30 dager etter fullført oppdrag.
- JSON-analysedata kan lagres inntil 3 år med samtykke.

**Ansvarsfraskrivelse:**
PianoHelse-diagnosen er et indikativt screeningverktøy — ikke et sakkyndig uttalelse. Den måler kun tonehøydeavvik og kan ikke avdekke mekaniske skader, strukturelle feil, hammerslitasje eller andre forhold som krever faglig inspeksjon. Resultater er ikke grunnlag for forsikringskrav, kjøps-/salgstvister eller lignende. Kun en autorisert pianostemmer kan gi en fullstendig faglig vurdering.

**Datatilsynet:**
PianoHelse er registrert som behandlingsansvarlig og plikter å ha en oppdatert RoPA (GDPR art. 30). Personvernerklæring og cookie-policy MÅ publiseres FØR lansering.

---

## Dato og versjon

- **Opprettet:** 20. mars 2026
- **Sist oppdatert:** 20. mars 2026 (oppdatert av Lead Coordinator etter Economist- og Piano-Tuner-agentens leveranser)
- **Status:** Konseptfase / Pre-utvikling
- **Språk:** Norsk (bokmål) — målmarked Norge
