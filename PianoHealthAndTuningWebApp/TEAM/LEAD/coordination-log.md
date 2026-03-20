# PianoHelse — Koordinasjonslogg
**Versjon:** 1.0
**Dato:** 20. mars 2026
**Forfatter:** Lead Coordinator

---

## Formål

Dette dokumentet definerer hva hvert teammedlem skal levere, hvordan leveransene henger sammen, og hvilke integrasjonspunkter som er kritiske for fremdriften. Det er den operative håndboken for teamkoordinering.

---

## 1. Teamstruktur og Ansvarsmatrise

| Teammedlem | Rolle | Primært ansvar | Leveranser til |
|---|---|---|---|
| **Lead Coordinator** | Produktstrategi og visjon | Masterplan, prioritering, investormateriell | Alle |
| **Developer** | Teknisk realisering | Arkitektur, frontend, backend, integrasjoner | Designer (implementerer designs), Lead (tekniske begrensninger) |
| **Designer** | Brukeropplevelse og merkevare | Wireframes, UI-komponenter, designsystem | Developer (design specs), Lead (visjon alignment) |
| **Piano Tuner Expert** | Faglig innhold og bransje | Stemmeterminologi, fagkrav, stemmernettverk | Developer (terskelverdier i kode), Kravspec (akseptable avvik) |
| **Economist** | Forretningsmodell og økonomi | Inntektsmodell, prissetting, investorkalkyle | Lead (beslutningsgrunnlag for provisjon og MVP), Marketing (budsjett) |
| **Marketing** | Vekst og kommunikasjon | GTM-plan, kanaler, partnerskaper, merkevareposisjon | Lead (ekstern kommunikasjon), Designer (kampanjemateriell) |

---

## 2. Leveranser per Teammedlem

### 2.1 Developer

**Fil-sti for leveranser:** `TEAM/DEV/`

| Leveranse | Beskrivelse | Avhengighet av | Blokkerer |
|---|---|---|---|
| `arkitektur-notat.md` | Valg av teknisk stack, begrunnelse, diagram | Masterplan, kravspesifikasjon | All utvikling |
| `ultdetektor-integrering.md` | Plan for å portere/integrere UltimateDetector i PianoHelse-webapp | Kravspesifikasjon F-D-01 til F-D-07 | Diagnostikk-feature |
| `api-design.md` | REST API-spesifikasjon (endepunkter, request/response-format, autentisering) | Kravspesifikasjon seksjon 4 | Backend utvikling, Designer (kjennskap til dataflyt) |
| `mobil-test-rapport.md` | Testresultater: UltimateDetector på iOS/Android + ulike mikrofoner | UltimateDetector (eksisterer) | NF-Y-01, NF-K-01, NF-K-02 |
| `gdpr-teknisk-impl.md` | Teknisk GDPR-implementering: klient-side lyd, samtykkelagring, sletting | Kravspesifikasjon seksjon 5.4 | Lansering |

**Kritiske tekniske beslutninger som Developer MÅ avklare:**
1. Valg av teknisk stack (vanilla JS vs. React, backend-framework, database)
2. Serverplassering innenfor EØS
3. Bekreftelse av klient-side lydanalyse (ingen serveroverføring)
4. Autentiseringsmekanisme for stemmere

---

### 2.2 Designer

**Fil-sti for leveranser:** `TEAM/DESIGN/`

| Leveranse | Beskrivelse | Avhengighet av | Blokkerer |
|---|---|---|---|
| `merkevare-guide.md` | Logo, farger, typografi, ikonspråk, fotografistil | Masterplan (tone-of-voice) | All UI-utvikling |
| `wireframes/` | Low-fidelity wireframes for alle sider i MVP-scope | Kravspesifikasjon seksjon 8, US-P-01 til US-S-04 | Developer kan ikke begynne frontend |
| `prototype-link.md` | Interaktiv Figma/Adobe XD-prototype (lenke + tilgangsinformasjon) | Wireframes | Brukertesting |
| `stemmekurve-visualisering.md` | Detaljert spec for stemmekurve-grafen: farger, akse, interaksjoner | US-P-02, Piano Tuner Expert (cent-skala) | Developer (Canvas-implementering) |
| `diagnostikk-flow.md` | Illustrert flyt for diagnostikksekvensen (steg 1–7, se kravspesifikasjon seksjon 8.3) | US-P-01 | Developer (sekvenslogikk) |
| `brukertesting-rapport.md` | Resultater fra 5+ brukertester av prototype | Prototype ferdig | Design iterasjon |

**Viktige designbeslutninger som Designer MÅ ta:**
1. Visuell metafor for "cent-avvik" (termometer? kurve? emoji?) — tilgjengelig for ikke-musikere
2. Mobilopplevelse for diagnostikk: hvordan holde telefonen mot pianotangentene
3. Fargesystem for helsekarakter (grønn/gul/rød) med fargeblindt-alternativ

---

### 2.3 Piano Tuner Expert

**Fil-sti for leveranser:** `TEAM/EXPERT/`

| Leveranse | Beskrivelse | Avhengighet av | Blokkerer |
|---|---|---|---|
| `faglig-krav-stemming.md` | Definisjon av akseptable avvik per register, faglig grunnlag for helsekarakterer | Kravspesifikasjon seksjon 4.2 | Diagnostikklogikk (terskelverdier) |
| `stemmer-rekruttering.md` | Plan for å rekruttere 15–20 stemmere til MVP-lansering i Oslo | Masterplan seksjon 10, Risiko 1 | MVP-lansering |
| `pianoer-og-stemming.md` | Faglig innhold til "Om stemming"-siden: hva er stemming, hvor ofte, hva koster det, hva skjer hvis man venter | Kravspesifikasjon (ordliste) | Innholdsmarkedsføring |
| `stemmer-krav.md` | Minimumskrav for stemmere på plattformen: sertifisering, forsikring, org.nr | Åpen beslutning O-006 | Stemmer-onboarding |
| `faglig-begrensninger.md` | Hva diagnostikken IKKE kan avdekke (regulering, intonasjon, etc.) — viktig for ærlig kommunikasjon | US-P-01 (akseptansekriterier) | Produkttekster |

**Kritiske faglige avklaringer:**
1. Cent-terskel for de tre helsekarakterene (forslag i kravspesifikasjon seksjon 4.2 — trenger validering)
2. Grense for opptrekk (pitch raise) vs. standard stemming
3. Faglig korrekt norsk terminologi gjennomgående

---

### 2.4 Economist

**Fil-sti for leveranser:** `TEAM/ECONOMICS/`

| Leveranse | Beskrivelse | Avhengighet av | Blokkerer |
|---|---|---|---|
| `forretningsmodell.md` | Fullstendig inntektsmodell, provisjonssatser, prissettingsstrategi | Masterplan seksjon 5 | Fase 2-lansering |
| `enhetokonomi.md` | CAC, LTV, payback period, break-even-analyse — 3 scenarier | Markedsdata (SSB, Statista), provisjonsnivå | Investorpresentasjon |
| `konkurrentprising.md` | Gjennomgang av provisjonsnivåer hos Mittanbud, Thumbtack, Bark.com, PianoSphere | Offentlig tilgjengelig info | Åpen beslutning O-004 |
| `investorkalkyle.md` | Finansielle projeksjoner 3 år, funding-behov, antatt pre-money verdsettelse | Alle andre leveranser | Investor-runde |
| `vipps-vs-stripe.md` | Analyse av transaksjonskostnader og brukerpreferanser for Vipps eCom vs. Stripe i Norge | Kravspesifikasjon seksjon 6.2 | Betalingsimplementering (Fase 2) |

**Kritiske økonomi-beslutninger:**
1. Fastsette provisjonsnivå (10–15 % eller annet) — påvirker stemmer-adopsjon
2. Freemium vs. gratis diagnostikk for pianoeiere
3. Stemmer-abonnement vs. per-lead-fee (vi bør ikke kopiere Thumbtack blind — leads er uforutsigbart for norske håndverkere)

---

### 2.5 Marketing

**Fil-sti for leveranser:** `TEAM/MARKETING/`

| Leveranse | Beskrivelse | Avhengighet av | Blokkerer |
|---|---|---|---|
| `gtm-plan.md` | Go-to-market plan for MVP: kanaler, budsjett, tidslinje, KPIer | Masterplan seksjon 10, Merkevare-guide | Lansering |
| `seo-analyse.md` | Nøkkelordsanalyse: "pianostemming", "pianostemmer", "piano stemmning Norge" — søkevolum, konkurranse | Ferdig nettside (for on-page SEO) | SEO-implementering |
| `partnerskapsplan.md` | Liste over potensielle partnere (Steinway Oslo, Yamaha-forhandlere, musikkskoler, NMF, kulturkontorer), kontaktplan | Masterplan, Piano Tuner Expert | Tidlig distribusjon |
| `innholdsplan.md` | Redaksjonell kalender: bloggartikler, sosiale medier-innhold, pressemelding | Piano Tuner Expert (faglig innhold) | Innholdsmarkedsføring |
| `pressemelding-draft.md` | Første pressemelding til norske medier (Aftenposten Kultur, NRK Klassisk, Pianoforum) | Produktlansering klar | PR |

**Kritiske markedsføringsbeslutninger:**
1. GTM-sekvens: Diagnostikk first (standalone) vs. full plattform fra dag 1
2. Primær akkvisisjonskanal for pianoeiere (Facebook-grupper, SEO, PR?)
3. Stemmer-rekruttering: Facebook-grupper for pianostemmere, bransjeorganisasjoner, LinkedIn

---

## 3. Integrasjonspunkter og Avhengigheter

### 3.1 Kritisk avhengighetskjede (MVP)

```
Piano Tuner Expert: Faglig terskelverdi
         ↓
Developer: Diagnostikklogikk (terskler implementert i kode)
         ↓
Designer: Stemmekurve-visualisering (spec for kurven)
         ↓
Developer: Canvas-rendering av kurven
         ↓
[Diagnostikkmodul ferdig]
         ↓
Marketing: GTM-plan aktiveres
         ↓
[Lansering]
```

### 3.2 Parallelle spor (kan kjøres samtidig)

**Spor A — Teknisk:**
- Developer: Arkitektur + API-design
- Developer: UltimateDetector-integrering i webapp
- Developer: Backend (autentisering, database, e-post)

**Spor B — Design:**
- Designer: Merkevare-guide
- Designer: Wireframes (alle sider)
- Designer: Stemmekurve-spec

**Spor C — Marked og Innhold:**
- Piano Tuner Expert: Faglig innhold + stemmer-rekruttering
- Marketing: SEO-analyse + partnerskapsplan
- Economist: Forretningsmodell + enhetøkonomi

### 3.3 Kritiske integrasjonspunkter

| Integrasjon | Hvem produserer | Hvem konsumerer | Frist |
|---|---|---|---|
| Merkevare-guide ferdig | Designer | Developer, Marketing | Før UI-utvikling starter |
| Wireframes ferdig | Designer | Developer | Før frontend-utvikling |
| Teknisk stack-valg | Developer | Designer (vet hva som er mulig) | Uke 1–2 |
| Faglige terskelverdie | Piano Tuner Expert | Developer (hardkoder terskler) | Uke 3 |
| API-design | Developer | Designer (forstår dataflyt) | Uke 3–4 |
| Provisjonsnivå | Economist | Lead (endelig beslutning), Developer (i betalingsflyt) | Fase 2 |
| Stemmer-rekruttering (15+ stemmere) | Piano Tuner Expert + Marketing | Plattformen (det er noe å booke) | Før lansering |

---

## 4. Kommunikasjonsrutiner

### 4.1 Asynkron oppdatering
Hvert teammedlem legger sin siste fremdriftsoppdatering i sin `TEAM/<ROLLE>/status.md`-fil. Lead Coordinator leser disse og oppdaterer `project-status.md` ukentlig.

### 4.2 Blokkerende problemstillinger
Hvis en leveranse er blokkert, skrives dette umiddelbart i `TEAM/LEAD/blocker-log.md` med:
- Hvem er blokkert
- Hva blokkerer dem
- Hvem kan løse det
- Frist for løsning

### 4.3 Beslutninger
Alle vesentlige beslutninger dokumenteres i `project-status.md` (Beslutningsloggen) av Lead Coordinator. Ingen beslutning tas uten at det er dokumentert hvem som tok den og hvorfor.

---

## 5. Fil- og Mappestruktur (fullstendig plan)

```
PianoHealthAndTuningWebApp/
│
├── TEAM/
│   ├── LEAD/
│   │   ├── master-plan.md             ← Dette dokumentet + visjon
│   │   ├── project-status.md          ← Fremdrift, åpne spørsmål, beslutningslogg
│   │   ├── coordination-log.md        ← Leveranser, avhengigheter (dette dokumentet)
│   │   └── blocker-log.md             ← Opprett ved behov
│   │
│   ├── DEV/
│   │   ├── arkitektur-notat.md
│   │   ├── api-design.md
│   │   ├── ultdetektor-integrering.md
│   │   ├── mobil-test-rapport.md
│   │   └── gdpr-teknisk-impl.md
│   │
│   ├── DESIGN/
│   │   ├── merkevare-guide.md
│   │   ├── diagnostikk-flow.md
│   │   ├── stemmekurve-visualisering.md
│   │   ├── brukertesting-rapport.md
│   │   ├── prototype-link.md
│   │   └── wireframes/                ← Bildefiler eller Figma-eksporter
│   │
│   ├── EXPERT/
│   │   ├── faglig-krav-stemming.md
│   │   ├── stemmer-rekruttering.md
│   │   ├── pianoer-og-stemming.md
│   │   ├── stemmer-krav.md
│   │   └── faglig-begrensninger.md
│   │
│   ├── ECONOMICS/
│   │   ├── forretningsmodell.md
│   │   ├── enhetokonomi.md
│   │   ├── konkurrentprising.md
│   │   ├── investorkalkyle.md
│   │   └── vipps-vs-stripe.md
│   │
│   └── MARKETING/
│       ├── gtm-plan.md
│       ├── seo-analyse.md
│       ├── partnerskapsplan.md
│       ├── innholdsplan.md
│       └── pressemelding-draft.md
│
├── PRODUCT/
│   └── kravspesifikasjon.md           ← Fullstendig produktkrav (norsk)
│
└── SRC/                               ← Kilde-kode (Developer oppretter)
    ├── (webapp-kode her)
    └── ...
```

---

## 6. Risiko og Eskalering

### Eskaleringssti
1. Teammedlem identifiserer problem → dokumenterer i `blocker-log.md`
2. Lead Coordinator vurderer innen 24 timer
3. Hvis løses innen teamet → Lead oppdaterer `project-status.md`
4. Hvis krever ekstern ressurs (jurist, investorinput, brukertesting) → Lead eskalerer til produkteier

### Røde flagg som krever umiddelbar eskalering
- UltimateDetector er unøyaktig på mobiltelefoner (diagnostisk nøyaktighet < 95 %)
- Juristen fraråder klient-side-only lydarkitektur av GDPR-grunner
- Vi klarer ikke rekruttere 10+ stemmere innen 8 uker fra oppstart
- Kostnad for Vipps-integrasjon overstiger budsjettramma

---

## 7. Definisjon av "Ferdig" per Fase

### MVP er ferdig når:
- Alle akseptansekriterier i kravspesifikasjon seksjon 9 er grønne
- Minimum 15 stemmere er aktive på plattformen
- Minimum 3 reelle pianoeiere har testet diagnostikken og gitt feedback
- Personvernerklæring er publisert og GDPR-gjennomgang er dokumentert
- Lead Coordinator har godkjent lanseringsklar status

### Fase 2 er ferdig når:
- Betaling via Vipps og Stripe er implementert og testet
- Automatisk geo-matching fungerer
- Ratings og anmeldelser er implementert
- 100 betalte oppdrag er gjennomført via plattformen
- Economist har bekreftet positiv enhetøkonomi

---

*Koordinasjonsloggen eies av Lead Coordinator og oppdateres ved vesentlige endringer i leveranseplanen.*
*Alle teammedlemmer forventes å lese dette dokumentet og si ifra om konflikter med egne planer.*
