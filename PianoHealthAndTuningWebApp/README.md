# PianoHelse

> **"Vi gjør pianostell enkelt og tilgjengelig for alle."**

**Status:** Pre-MVP / Klar for backend-integrasjon | **Versjon:** 0.3 | **Sist oppdatert:** 21. mars 2026

Diagnostikkmodulen kjorer lokalt og er testet pa ekte piano. Backend (Supabase), ekte bookingflyt og app store-publisering gjenstaar.

---

## Hva er PianoHelse?

PianoHelse er Norges forste AI-drevne plattform for pianohelseanalyse og booking av pianostemmere. Pianoeiere tar opp lyden av pianoet sitt med mobiltelefonen, faar en visuell stemmekurve og helseanalyse, og booker en lokal, sertifisert pianostemmer direkte i appen — alt pa under 5 minutter. For pianostemmere er det en portal med forhaandskvalifiserte oppdrag komplett med diagnostikkrapport, slik at de vet hva de moter for de setter foten innenfor doren. Plattformens teknologiske kjerne er `UltimateDetector` — en JavaScript-basert pitchdetektor som dekker hele pianoets frekvensomraade fra A0 til C8 uten serversidekall.

---

## Markedsmulighet

De fire sterkeste tallene:

| Nokkeltal | Verdi |
|---|---|
| NPTF-autoriserte stemmere i Norge | **66 registrerte** — gjennomsnittsalder 62 ar (generasjonskrise) |
| Estimerte pianoer i Norge | **75 000–120 000** (midtpunkt 97 500) |
| Norsk stemmepris 2026 | **Kr 2 853 inkl. mva.** per standard stemming |
| TAM — total markedsverdi Norge | **Kr 166,9 mill/ar** (39 000 aktive pianoer x 1,5 stemminger/ar x kr 2 853) |

Europeisk nedgang i antall stemmere 2021–2024: -15 %. Ingen aktiv konkurrent i Norge kombinerer akustisk diagnose, strukturert markedsplass og norsk geografi i ett produkt.

---

## Kom i gang (lokal utvikling)

Ingen byggsteg. Ingen pakkehåndterer. Server prosjektroten via HTTP (direkte `file://`-tilgang blokkerer mikrofontilgang i de fleste nettlesere):

```bash
# Steg 1: Klon eller naviger til GuitarTuner-roten
cd /sti/til/GuitarTuner

# Steg 2: Start HTTP-server (velg en av disse)
python3 -m http.server 8080
# eller
npx serve .

# Steg 3: Åpne i nettleser
# http://localhost:8080/PianoHealthAndTuningWebApp/app/index.html
```

Appen krever:
- En nettleser med `getUserMedia`-stotte (HTTPS eller `localhost`)
- Mikrofontillatelse (iOS Safari og Android Chrome stettes)
- Et akustisk piano i samme rom

For stemmer-portalen: `http://localhost:8080/PianoHealthAndTuningWebApp/app/stemmer-portal.html`

---

## Prosjektstruktur

```
PianoHealthAndTuningWebApp/
│
├── README.md                             # Denne filen — prosjektoversikt
├── Piano Health & Tuning Marketplace.md  # Opprinnelig konseptbeskrivelse
│
├── app/                                  # Produksjonsklar klientkode (PWA)
│   ├── index.html                        # Enkel-side HTML-skall (ingen rammeverk)
│   ├── style.css                         # Morkt tema, CSS custom properties
│   ├── manifest.json                     # PWA-manifest (installasjon, ikoner)
│   ├── sw.js                             # Service Worker (offline-stotte)
│   ├── router.js                         # Hash-basert SPA-router (iOS-kompatibel)
│   ├── app.js                            # Inngangspunkt — initialiserer alle moduler
│   ├── piano-scanner.js                  # Orkestrerer 52-tasters skanning via mikrofon
│   ├── piano-keyboard.js                 # Visuell klaviaturgjengivelse (Canvas)
│   ├── health-scorer.js                  # Beregner helsepoeng (0–100) og anbefalinger
│   ├── tuning-curve.js                   # Stemmekurve-visualisering (Chart.js)
│   ├── stemmer-portal.html               # Stemmer-portalens HTML-skall
│   └── icons/
│       └── icon.svg                      # App-ikon (piano-silhuett)
│
├── PRODUCT/                              # Produktdokumentasjon
│   ├── kravspesifikasjon.md              # Fullstendig norsk kravspesifikasjon (brukerhistorier, GDPR)
│   ├── investorpitch.md                  # Investor-pitch-deck i Markdown (12 slides, seed kr 3,5M)
│   ├── en-pager.md                       # Enside-sammendrag for nye teammedlemmer
│   ├── gdpr-og-juridisk.md               # GDPR-analyse, personvernerklæring, ansvarsfraskrivelse
│   └── db/
│       └── schema.sql                    # Supabase PostgreSQL-skjema (pianoer, oppdrag, stemmere)
│
├── DESIGN/
│   └── wireframes/
│       └── skjermbilder.md               # ASCII-wireframes for alle nokkelskjermer
│
└── TEAM/                                 # Agentdokumentasjon per rolle
    ├── LEAD/
    │   ├── master-plan.md                # Strategi, faseplan, KPIer, investering
    │   ├── gap-analyse.md                # Identifiserte gap og prioriterte tiltak
    │   ├── risiko-register.md            # 15 risikoer med score og tiltak
    │   ├── coordination-log.md           # Koordinasjonslogg mellom agenter
    │   ├── project-status.md             # Naværende prosjektstatus og fremdrift
    │   └── beslutningslogg.md            # Logg over viktige prosjektbeslutninger
    │
    ├── DEVELOPER/
    │   ├── teknisk-arkitektur.md         # Supabase, Stripe Connect, PWA-arkitektur
    │   ├── algoritme-integrasjon.md      # UltimateDetector-integrasjon, PianoScanner, HealthScorer
    │   ├── api-design.md                 # Supabase Edge Functions og REST API-design
    │   └── frontend-arkitektur.md        # Vanilla JS, hash-router, CSS-tokens
    │
    ├── DESIGNER/
    │   ├── designsystem.md               # Farger, typografi, komponenter
    │   ├── brukerflyt.md                 # Detaljerte brukerflyter for alle scenarier
    │   ├── ux-research.md                # Brukerundersokelse og UX-innsikt
    │   └── design-critique.md            # Faglig designkritikk og anbefalinger
    │
    ├── PIANO-TUNER/
    │   ├── marked-og-fagkunnskap.md      # NPTF, PTG, prissetting, bransjeforhold
    │   ├── diagnose-validering.md        # Faglig vurdering av diagnostikkmodulen
    │   ├── krav-til-plattformen.md       # Stemmernes krav og onsker
    │   └── pianohelse-faglig.md          # Faglig grunnlag for helsekarakterene
    │
    ├── ECONOMIST/
    │   ├── enhetokonomi.md               # TAM/SAM/SOM, CAC, LTV, break-even
    │   ├── finansiell-modell.md          # 18-maneders P&L (base/pessimistisk/optimistisk)
    │   ├── inntektsmodell.md             # Provisjonsstruktur og prisstrategier
    │   └── prisstrategi.md               # Priselastisitet og konkurrentanalyse
    │
    └── MARKETING/
        ├── lanseringsstrategi.md         # Go-to-market, PR-plan, beta-rekruttering
        ├── innholdsstrategi.md           # SEO, innholdsproduksjon, kanaler
        ├── merkevareidentitet.md         # Navn, farger, tone-of-voice
        ├── målgrupper.md                 # Segmentering og personas
        ├── partnerskap.md                # Pianobutikker, kulturskoler, NPTF
        ├── veksttaktikker.md             # Referralprogram, lojalitet, viralt potensial
        └── mikrokopi.md                  # UI-tekster, knapper, feilmeldinger
```

**Totalt: 44 filer** (inkl. denne README)

---

## Teamdokumentasjon

| Mappe | Innhold | Ansvarlig rolle |
|---|---|---|
| `TEAM/LEAD/` | Masterplan, prosjektstatus, risikoregister, gap-analyse, koordinasjonslogg, beslutningslogg | Lead Coordinator |
| `TEAM/DEVELOPER/` | Teknisk arkitektur (Supabase, PWA), algoritme-integrasjon, API-design, frontend-arkitektur | Developer |
| `TEAM/DESIGNER/` | Designsystem, brukerflyt, UX-research, designkritikk | Designer |
| `TEAM/PIANO-TUNER/` | Bransje- og fagkunnskap, diagnose-validering, stemmerkrav, helsefaglig grunnlag | Piano Tuner Expert |
| `TEAM/ECONOMIST/` | Enheto konomi (TAM/SAM/SOM/CAC/LTV), finansiell modell, inntektsmodell, prisstrategi | Economist |
| `TEAM/MARKETING/` | Lanseringsstrategi, innholdsstrategi, merkevare, malgrupper, partnerskap, vekst, mikrokopi | Marketing |
| `PRODUCT/` | Kravspesifikasjon, investor-pitch, GDPR/juridisk, en-pager, databaseskjema | Lead + Developer |
| `DESIGN/wireframes/` | ASCII-wireframes for alle nokkels kiermer | Designer |

---

## Teknisk arkitektur

```
[Bruker / Mobiltelefon]
        |
        v
  index.html (PWA, installbar)
        |
        ├── router.js          Hash-basert SPA-router (#/diagnose, #/booking, osv.)
        │                      (iOS-kompatibel — ingen history.pushState pa iOS PWA)
        │
        ├── piano-scanner.js   Web Audio API → UltimateDetector → cent-avvik per note
        │                      (52 hvite taster som standard, A0-avlest med mikrofon-advarsel)
        │
        ├── piano-keyboard.js  Canvas-basert klaviaturvisning med fargekoding per note
        │
        ├── health-scorer.js   Vektet gjennomsnitt av cent-avvik → helsescore 0–100
        │                      (Median-basert pitch per note, ikke mean)
        │
        ├── tuning-curve.js    Chart.js stemmekurve med Railsback-referanselinje
        │
        ├── app.js             Inngangspunkt — binder modulene og starter routing
        │
        └── sw.js              Service Worker (offline-cache, PWA-installasjon)

  [All lydanalyse skjer klient-side — ingen lyd overføres til server — GDPR-prinsipp]

        |
        v (planlagt Fase 2)

  Supabase (Frankfurt, eu-central-1)
        ├── PostgreSQL         pianoer, oppdrag, stemmere, helseanalyser, profiler
        ├── Auth               E-post/passord + magic links
        ├── Storage            JSON-diagnostikkrapporter (lydopptak lagres IKKE)
        └── Edge Functions     Booking-logikk, Stripe Connect, e-postvarsler

  Stripe Connect              Betalinger og utbetalinger til stemmere
  Resend                      Transaksjons-e-poster og paminnelser
```

### UltimateDetector — den teknologiske kjernen

`UltimateDetector` (fra `GuitarTuner`-prosjektet) er en hybrid tre-trinns pitchdetektor:

1. **McLeod MPM** (FFT-basert autokorrelasjon) — håndterer bass A0–C5
2. **Frekvensvektet spektraltopp** (65 536-punkts FFT) — håndterer diskant C5–C8
3. **Beslutningsmotor** med harmonisk verifisering — velger beste kandidat

Nokkelegenskaper:
- Frekvensdekning: 27,5 Hz (A0) til 4186 Hz (C8) — alle 88 taster
- Mobilmikrofon-advarsel aktiveres for A0–E1 (noteIndex < 10, under 41 Hz)
- MIN_RMS-gate er fjernet (matcher UltimateDetectors design — klarhet-basert gate)
- Validert for midtregisteret A1–C6 (±1–4 cent med mobilmikrofon)

---

## Forretningsmodell

| Parameter | Verdi |
|---|---|
| Gjennomsnittlig booking-verdi | Kr 2 853 inkl. mva. |
| Provisjon ved oppstart (mnd 1–12) | **12 %** |
| Netto til PianoHelse per booking (12 %) | **Kr 277** (etter Stripe-gebyrer) |
| Break-even bookinger per maned | **47 bookinger/mnd** |
| Anbefalt okning til 15 % provisjon | Fra maned 13 (EBITDA-positivt) |
| EBITDA-positivt (base case) | **Maned 13** |
| Akkumulert kapitalbehov (base case) | **Kr 530 000** |
| LTV : CAC — pianoeier | **6,9 : 1** (LTV kr 2 078 / CAC kr 300) |
| LTV : CAC — pianostemmer | **297 : 1** (LTV kr 178 165 / CAC kr 600) |

**Bootstrapping i MVP-fasen:** Ingen provisjon tas. Diagnostikk er gratis. Stemmerprofiler er gratis de forste 12 manedene. Fokus er brukerdata og nettverksbygging.

---

## Neste steg mot MVP

Gjenstaaende for MVP kan lanseres:

**Kritiske — blokkerer lansering:**
- [ ] Implementer ekte booking-flyt og betalingsstrom (Supabase + Stripe Connect)
- [ ] Skriv og publiser personvernerklæring pa norsk (GAP-01)
- [ ] Implementer cookie-banner i henhold til ePrivacy-direktivet (GAP-08)
- [ ] Opprett RoPA (Record of Processing Activities, GDPR art. 30) (GAP-16)
- [ ] Signer DPA med Supabase, Stripe og Resend (GAP-17)
- [ ] Design "ingen stemmere i ditt omraade"-skjerm (GAP-15)

**Teknisk utvikling:**
- [ ] Rekrutter 15–20 pianostemmere i Oslo manuelt FOR lansering
- [ ] Test diagnostikkmodul pa minimum 10 mobilenhetsmodeller (iOS + Android)
- [ ] Implementer "gjenoppta skanning"-funksjonalitet (IndexedDB) (GAP-13)
- [ ] Implementer digital piano-deteksjon og dedikert UX (GAP-14)
- [ ] Avklar MVA-struktur for provisjonsmodell med skatteraadgiver (GAP-09)

**Fase 2 (etter MVP-validering):**
- [ ] Stripe Connect-integrasjon og betalingsflyt (Vipps via Nets Easy)
- [ ] Kalenderintegrasjon og automatisk stemmer-matching
- [ ] Ratings og anmeldelsessystem
- [ ] Nasjo nal utrulling (Bergen, Trondheim, Stavanger, Kristiansand)
- [ ] App Store / Google Play-publisering

---

## Kjore appen

```
http://localhost:8080/PianoHealthAndTuningWebApp/app/index.html
```

Stemmer-portal:
```
http://localhost:8080/PianoHealthAndTuningWebApp/app/stemmer-portal.html
```

---

## Dato og versjon

- **Opprettet:** 20. mars 2026
- **Sist oppdatert:** 21. mars 2026
- **Status:** Pre-MVP — diagnostikkmodul klar, backend gjenstaar
- **Spraak:** Norsk (bokmal) — malmarked Norge
