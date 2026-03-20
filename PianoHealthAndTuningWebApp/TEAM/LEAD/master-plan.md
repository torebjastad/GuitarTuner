# PianoHelse — Master Plan
**Versjon:** 1.0
**Dato:** 20. mars 2026
**Forfatter:** Lead Coordinator
**Status:** Levende dokument — oppdateres løpende

---

## 1. Visjon

> **"Vi gjør pianostell enkelt og tilgjengelig for alle."**

PianoHelse er Norges første dedikerte plattform der pianoeiere kan diagnostisere pianoets stemmetilstand med mobiltelefonen sin — og bestille en sertifisert pianostemmer med noen få tastetrykk. Vi kombinerer avansert lydanalyse (AI-drevet tonehøydedetektion) med et todelt markedsplassnettverk som kobler pianoeiere og pianotemmer/pianostemmere i hele Norge.

**Engelsk versjon (for investorer):**
> PianoHelse is Norway's first AI-powered piano health platform — enabling piano owners to diagnose their instrument's tuning condition instantly, and book a certified piano technician through an integrated marketplace.

---

## 2. Strategisk Bakgrunn og Markedsanalyse

### 2.1 Markedsmulighet

**Det norske pianomarkedet:**
- Norge har ca. 5,3 millioner innbyggere. Basert på europeiske gjennomsnitt (ca. 1 piano per 30–40 husholdninger) anslår vi at det finnes **75 000–120 000 private klaverer og flygler** i norske hjem, musikkskoler, kirker og kulturhus.
- Det norske musikkmarkedet omsatte for 535 millioner NOK i musikkinstrumentbutikker i 2020 (Statistisk sentralbyrå).
- Hellstrøm — Norges historiske pianoprodusent — bygget 6 000 instrumenter frem til 1980. Mange av disse er fortsatt i bruk og er modne for regelmessig stell.

**Stemmebehov og prisnivå:**
- Faglig anbefaling: 2 ganger per år for aktivt brukte pianoer, 1 gang per år minimum.
- Norsk prisnivå 2026: Kr 2 853 inkl. mva. for standard stemming (Pianostemmeren AS).
- Opptrekk (når pianoet har falt mye): ca. halvparten av stemmekostnaden i tillegg.
- Det globale markedet for pianostemmetjenester er verdsatt til ca. USD 1,8 milliarder (2024) og forventes å nå USD 2,7 milliarder innen 2033 (CAGR 4,2 %).

**Tilbudsside — mangel på fagfolk:**
- Antall sertifiserte pianostemmere i Europa falt med 15 % fra 2021 til 2024.
- Mange bor i Oslo-regionen; landsdelene har begrenset tilgang til kvalifiserte stemmere.
- Dette er en todelt mulighet: å effektivisere bookingprosessen og å hjelpe stemmere å fylle kalenderne sine.

### 2.2 Konkurranselandskap

| Plattform | Land | Modell | Relevans for oss |
|---|---|---|---|
| **PianoSphere** | UK | Katalogtjeneste + annonser | Nærmest oss, men mangler diagnostikk og booking |
| **Mittanbud** | Norge (Norden) | Todelt håndverksmarkedsplass | Sterkest norsk aktør, men generalist — ingen pianodiagnostikk |
| **Thumbtack** | USA | Lead-fee modell | Teknisk avansert, men generell og ikke-norsk |
| **Bark.com** | UK/int. | Lead-generering, USD 246M omsetning | Generell, ingen diagnostikk |
| **Pianostemmeren.no** | Norge | Enkeltbedrift med bookingside | Ikke en plattform — konkurrent og mulig partner |
| **Håndverkeren.no** | Norge | Håndverksmarkedsplass | Generell, ikke musikkrelatert |

**Vår unike posisjon:**
Ingen eksisterende aktør kombinerer:
1. Akustisk diagnose (objektiv stemmehelseanalyse)
2. Strukturert markedsplass for pianostemmere
3. Norsk språk og norsk geografi

Dette er vår "defensible moat" — vi eier dataen fra hver diagnose og kan bygge en unik historisk stemmedatabase per piano.

### 2.3 Målgrupper

**Side A — Pianoeiere (Etterspørsel):**
- Privatpersoner med piano i hjemmet (primær)
- Foreldre til barn som spiller (sterk motivasjon: ønsker godt instrument)
- Musikkskoler og kulturskoler (institusjonelle kunder)
- Kirker og bedehus med orgel/piano
- Hoteller, restauranter, kulturhus

**Side B — Pianostemmere/Pianotemmer (Tilbud):**
- Sertifiserte pianostemmere i Norge (anslått 50–150 aktive fagpersoner nasjonalt)
- Pianoteknikere med bredere kompetanse (regulering, reparasjon)
- Nyutdannede stemmere som ønsker å bygge kundebase

---

## 3. Produktpilarer

### Pilar 1: Pianohelse-Monitor
*"Vet du egentlig om pianoet ditt er i stemmning?"*

En web-basert diagnostisk opplevelse der pianoeier spiller alle hvite taster (A0–C8) og får:
- En **stemmekurve** (avvik i cent per note)
- En samlet **helsekarakter**: Bra / Trenger stell / Kritisk
- Tydelig norsk forklaring av hva avviket betyr musikalsk
- Historikk (om de har testet før)

**Teknologisk grunnlag:** UltimateDetector (JavaScript) — allerede bygget og validert.

### Pilar 2: Smart Booking
*"Book riktig stemmer til rett tid"*

- Pianoeier sender stemmeforespørsel med diagnostikkrapporten vedlagt
- Stemmere i nærheten ser oppdraget med piano-type, alder, helsegrad og postnummer
- Stemmere legger inn pris og tilgjengelighet
- Pianoeier velger, bekrefter og betaler via plattformen
- Kalenderintegrasjon og påminnelser

### Pilar 3: Betrodd Nettverk
*"Vi kjenner stemmerne — du kan stole på dem"*

- Verifiserte fagpersoner (org.nummer, referanser, forsikring)
- Ratings og anmeldelser etter hvert oppdrag
- Sertifisering (NMF, PTG-Europe eller tilsvarende) merket på profil
- Gjennomsiktig prishistorikk

---

## 4. MVP-scope vs. Fase 2 vs. Fase 3

### MVP (Minimum Viable Product) — Fase 1
**Mål:** Validere kjernehypotesen: *"Pianoeiere vil bruke en gratis diagnostikk og deretter bestille via plattformen."*
**Tidslinje:** 0–6 måneder fra oppstart

**Inkludert i MVP:**
- [ ] Nettbasert diagnostikkmodul (mikrofon → stemmekurve → helsekarakter) — én side, ingen innlogging nødvendig
- [ ] Enkel bookingforespørselsflyt (navn, e-post, postnummer, rapport vedlagt)
- [ ] Manuell matching av forespørsler med stemmere (vi gjør dette manuelt til å begynne med)
- [ ] Stemmer-profil (enkelt skjema, kontaktinfo, geografi)
- [ ] Norsk grensesnitt gjennomgående
- [ ] GDPR-samsvarende samtykkehåndtering
- [ ] Grunnleggende e-postnotifisering

**Ikke i MVP:**
- Betaling via plattformen (stemmere fakturerer direkte)
- Kalenderintegrasjon
- Ratings/anmeldelser
- Mobilapp (responsivt web er tilstrekkelig)

### Fase 2 — Markedsplass-modenhet
**Mål:** Tjene penger og skalere mot 5 norske byer
**Tidslinje:** 6–18 måneder

- [ ] Innebygd betalingsmodul (Vipps + kortbetaling via Stripe)
- [ ] Automatisk matching basert på geografi og tilgjengelighet
- [ ] Stemmer-kalender og bookingbekreftelse
- [ ] Ratings og anmeldelser
- [ ] Pianodossier (historikk per piano per adresse)
- [ ] Påminnelsessystem (SMS/e-post: "Det er 12 måneder siden sist stemming")
- [ ] Institusjonelle kontoer (musikkskoler etc.)
- [ ] Provisjonsmodell aktivert (10–15 % av oppdragsverdi)

### Fase 3 — Vekst og Nordisk Ekspansjon
**Mål:** Markedsleder i Norden; bli den naturlige destinasjonen for piano-eierskap
**Tidslinje:** 18–36 måneder

- [ ] Nordisk ekspansjon (Sverige, Danmark, Finland — med lokale stemmernettverket)
- [ ] API for pianoprodusenter og -forhandlere (Steinway, Yamaha, Kawai) — de kan sende kunder til oss
- [ ] Mobilapp (iOS/Android)
- [ ] Piano-ID og historikkdatabase (lik VIN-register for biler)
- [ ] Avansert diagnostikk: reguleringsanalyse, intonasjon, pedalmåling
- [ ] Forsikringsintegrasjon (pianoet forsikret? Krev dekning gjennom oss)
- [ ] B2B: Hotelkjeder, kulturhus, kirker med serviceavtaler

---

## 5. Forretningsmodell

### Inntektsstrømmer

| Kilde | MVP | Fase 2 | Fase 3 |
|---|---|---|---|
| **Provisjon** (10–15 % per oppdrag) | Nei | Ja | Ja |
| **Stemmer-abonnement** (synlighet, profil-boost) | Nei | Ja | Ja |
| **Premiumdiagnostikk** (detaljert rapport, historikk) | Nei | Vurderes | Ja |
| **Institusjonelle serviceavtaler** | Nei | Nei | Ja |
| **API-integrasjon** (pianoforhandlere) | Nei | Nei | Ja |

**Enhetøkonomi (estimat Fase 2):**
- Gjennomsnittlig oppdragsverdi: Kr 2 850
- Plattformprovisjons (12 %): Kr 342 per oppdrag
- Mål: 100 oppdrag/mnd i Oslo = Kr 34 200/mnd fra Oslo alene
- 5 byer × 100 oppdrag = Kr 171 000/mnd = Ca. 2 MNOK/år — lønnsomt på Fase 2

### Bootstrapping-strategi (MVP-fase)
- Gratis diagnostikk for pianoeiere — lav terskel for adopsjon
- Gratis profilering for stemmere det første året — løser chicken-and-egg problemet ved å subsidiere tilbudssiden
- Vi tar ingen provisjon i MVP — fokus er data og vekst

---

## 6. Risikoregister

### Risiko 1: Chicken-and-Egg — Lave antall stemmere ved lansering
**Sannsynlighet:** Høy | **Konsekvens:** Kritisk
**Beskrivelse:** Pianoeiere finner ikke tilgjengelige stemmere → frustrerte brukere → plattformen dør tidlig.
**Tiltak:**
- Rekrutter 15–20 stemmere manuelt i Oslo/Bergen/Trondheim FØR lansering
- Tilby gratis profil + synlighet i 12 måneder for tidlige stemmere
- Inngå partnerskap med Norsk Pianostemmer Forening (om den eksisterer) eller PTG Norge
- Bruk "concierge MVP": matchingen gjøres manuelt av teamet i starten

### Risiko 2: Lav diagnostisk nøyaktighet på mobiltelefoner
**Sannsynlighet:** Middels | **Konsekvens:** Høy
**Beskrivelse:** UltimateDetector er utviklet og testet på desktop. Mobilmikrofoner (særlig billige Android-modeller) kan gi dårligere lydinput.
**Tiltak:**
- Grundig testing på iOS og Android (minimum 10 enhetsmodeller)
- Implementer SNR-sjekk og gi brukeren tilbakemelding ("for mye bakgrunnsstøy")
- Bruk av ekstern mikrofon som valgfri premiumfunksjon
- Tydelig kommuniser at dette er en indikativ test, ikke en erstatning for faglig stemming

### Risiko 3: Personvernregulering (GDPR) og lydopptak
**Sannsynlighet:** Middels | **Konsekvens:** Høy
**Beskrivelse:** Lydopptak av brukeres omgivelser i hjemmet er sensitivt. Datatilsynet kan stille spørsmål.
**Tiltak:**
- All lydanalyse skjer klient-side (i nettleseren) — ingen lyddata sendes til server
- Tydelig informasjon til bruker: "Mikrofontilgang brukes kun for analysere klavertoner lokalt i nettleseren. Ingen lyd lagres eller overføres."
- Innhent eksplisitt samtykke (ikke pre-avkrysset)
- Personvernerklæring reviewet av jurist med GDPR-kompetanse

### Risiko 4: Begrenset antall aktive pianobrukere i Norge
**Sannsynlighet:** Middels | **Konsekvens:** Middels
**Beskrivelse:** Norge har ca. 75 000–120 000 pianoer, men mange er ikke i aktiv bruk. Det reelle adresserbare markedet for regelmessig stemming kan være 20 000–40 000 pianoer.
**Tiltak:**
- Prioriter segmenter med høyest konverteringsrate: aktive musikkskoler, foreldre med barn i kulturskolen
- Bruk diagnostikktjenesten som "awareness" — mange eiere vet ikke at pianoet er ute av stemmning
- Bygg langsiktig påminnelsesengasjement

### Risiko 5: Konkurranse fra Mittanbud / generalistplattformer
**Sannsynlighet:** Middels | **Konsekvens:** Middels
**Beskrivelse:** Mittanbud (Nordens ledende håndverksmarkedsplass, nylig kjøpt av Verdane) kan utvide til musikkinstrumenter.
**Tiltak:**
- Bygg et defensivt forsprang gjennom diagnostikkdata og vertikal ekspertise
- Vår kategorikunnskap (stemming, regulering, intonasjon) gir en nettverkseffekt Mittanbud ikke kan kopiere raskt
- Vurder å inngå partnerskap med Mittanbud fremfor å konkurrere frontalt

---

## 7. Suksesskriterier og KPIer

### Lansering (Måned 6)
| KPI | Mål |
|---|---|
| Antall diagnostikktester utført | 500 |
| Antall registrerte stemmere på plattformen | 20 |
| Antall fullførte bookingforespørsler | 50 |
| NPS (pianoeiere) | > 40 |
| Gjennomsnittlig diagnostikktid | < 10 minutter |
| Diagnostisk feilrate (feil tonehøyde detektert) | < 2 % |

### 6 måneder etter lansering
| KPI | Mål |
|---|---|
| Månedlig aktive diagnostikkbrukere | 300 |
| Plattformbaserte bookinger per måned | 80 |
| Geografisk dekning (byer med stemmere) | 5+ |
| Stemmer-gjenbruksrate | > 60 % (stemmere beholder kunden via plattformen) |
| Inntekt (provisjon) | > Kr 200 000/mnd |

### 12 måneder etter lansering
| KPI | Mål |
|---|---|
| Registrerte pianoeiere | 5 000 |
| Registrerte stemmere | 60 |
| Totalt gjennomførte oppdrag (akkumulert) | 1 000 |
| Gjentakende kunder (bestiller igjen innen 12 mnd) | > 50 % |
| Medieomtale / PR-treff | 5+ (Aftenposten, NRK, Klassekampen etc.) |
| Månedlig omsetning | > Kr 500 000 |

---

## 8. Teknologisk Arkitektur — Overordnet

```
[Bruker/Nettleser]
    |
    ├── Diagnostikkmodul (JS, client-side)
    │       └── UltimateDetector (pitch detection)
    │       └── Stemmekurve-visualisering (Canvas)
    │       └── Helsekarakter-beregning
    |
    ├── Frontend (React eller Vanilla JS + HTML/CSS — avgjøres av Developer)
    |
    └── Backend API (Node.js eller Python — avgjøres av Developer)
            ├── Brukerregistrering / autentisering
            ├── Diagnostikkrapport-lagring (anonymisert / samtykkebasert)
            ├── Bookingadministrasjon
            ├── Stemmerportal
            ├── E-post / SMS-varsler
            └── Betaling (Vipps + Stripe, Fase 2)

[Eksternt]
    ├── Vipps API (norsk mobil betaling — viktigst for norske forbrukere)
    ├── Stripe (kortbetaling, internasjonal)
    ├── Sendgrid / Postmark (e-post)
    └── Google Maps / Kartverket (geolokasjon)
```

**Nøkkelavgjørelse (beholdt fra GuitarTuner-kodebasen):**
UltimateDetector er skrevet i vanilla JavaScript og kjører i nettleseren. Den trenger ingen serverside-API-kall for selve lydanalysen. Dette er en avgjørende personvern- og ytelsesegenskap som vi MÅ bevare.

---

## 9. Team og Rollefordeling

| Rolle | Fokusområde |
|---|---|
| **Lead Coordinator (Meg)** | Visjon, produktstrategi, prioritering, veikart, investormateriell |
| **Developer** | Teknisk arkitektur, frontend/backend, UltimateDetector-integrasjon, sikkerhet |
| **Designer** | UX/UI, norsk language design, brukerflyt, merkevare |
| **Piano Tuner Expert** | Faglig innhold, bransjeforhold, nøyaktighetskrav, stemmernettverk |
| **Economist** | Inntektsmodell, prissetting, enhetøkonomi, investorkalkyle |
| **Marketing** | Go-to-market, SEO, partnerskapsstrategier, PR-plan |

**Koordinasjonsrytme:**
- Ukentlig asynkron oppdatering via `TEAM/` dokumentmappen
- Månedlig synkronisering av prioriteringer (oppdater dette dokumentet)

---

## 10. Norsk Markedsstrategi — Go-to-Market

### Fase 1 GTM: Oslo-fokusert betatest
1. Rekrutter 5–10 pianostemmere i Oslo via LinkedIn, pianoforum.no, NMF-kontakter
2. Distribuer gratistjeneste via Facebook-grupper for pianoeiere, kulturskolenes foreldregrupper
3. Send pressemelding til Aftenposten Kultur og NRK Klassisk
4. Samarbeid med Steinway Gallery Oslo og andre pianoforhandlere som anbefaler stell etter kjøp

### Tone-of-Voice
- **Uformelt "du"** gjennomgående (standard i moderne norske apper)
- Varm, hjelpsom, faglig men tilgjengelig
- Unngå teknisk sjargong overfor pianoeiere; bruk det overfor stemmere
- Eksempel: "Pianoet ditt er litt ute av stemmning. Det er normalt — vi hjelper deg finne en stemmer i nærheten."

### Merkevareidentitet
- Navn: **PianoHelse**
- Undertittel: "Diagnostisér. Book. Nyt musikken."
- Farge: Varm sort + ivory/elfenben (klaviatur) + en trygg "suksessgrønn" for sunne pianoer
- Tone: Seriøs kompetanse, norsk vennlighet

---

## 11. Avhengigheter og Kritisk Sti

```
[Uke 1–2]  Teknisk arkitekturbeslutning (Developer)
     ↓
[Uke 2–4]  UX-wireframes og prototype (Designer)
     ↓
[Uke 3–6]  UltimateDetector webintegrasjon + diagnostikkside (Developer)
     ↓
[Uke 4–8]  Stemmerrekruttering og onboarding (Piano Tuner Expert + Marketing)
     ↓
[Uke 6–10] Bookingflyt + backend (Developer)
     ↓
[Uke 10]   Intern betatest (hele teamet)
     ↓
[Uke 12]   Betatest med 5 ekte pianoeiere og 3 stemmere
     ↓
[Uke 16–20] Offentlig lansering — Oslo
```

---

## 12. Investeringsbehov (Estimat)

| Post | MVP (6 mnd) | Fase 2 (6–18 mnd) |
|---|---|---|
| Utvikling (backend, frontend) | Kr 400 000 | Kr 800 000 |
| Design | Kr 100 000 | Kr 150 000 |
| Markedsføring og PR | Kr 50 000 | Kr 300 000 |
| Juridisk (GDPR, vilkår) | Kr 50 000 | Kr 50 000 |
| Infrastruktur / sky | Kr 20 000 | Kr 60 000 |
| Vipps + Stripe integrasjon | — | Kr 30 000 |
| **Total** | **Kr 620 000** | **Kr 1 390 000** |

Potensielle finansieringskilder:
- Innovasjon Norge (kulturteknologi / digital nyskaping)
- Kulturdepartementet (musikk som kulturarv)
- Privat engelinvestor med interesse for musikk og teknologi

---

---

## 13. Økonomi-oppsummering (fra Economist-agenten)

*Levert av: Economist — 20. mars 2026. Kilde: `enhetokonomi.md` og `finansiell-modell.md`.*

### 13.1 Markedsstørrelse — TAM / SAM / SOM

| Størrelse | Verdi | Beskrivelse |
|---|---|---|
| **TAM** | Kr 166,9 mill/år | 39 000 aktive pianoer × 1,5 stemminger/år × kr 2 853 |
| **SAM (konservativt)** | Kr 17,5 mill/år | 5 byer, 35 % digitaliseringsvilje, 50 % aktiv stemmingsandel |
| **SAM (optimistisk)** | Kr 35 mill/år | Øvre anslag |
| **SOM år 1** | Kr 1,5 mill GMV | Oslo, manuell matching, ~4–9 % av SAM |
| **SOM år 2** | Kr 6,0 mill GMV | Nasjonal, selvbetjening, ~17–34 % av SAM |
| **SOM år 3** | Kr 14,0 mill GMV | Moden plattform, ~40–80 % av SAM |

### 13.2 Enhetøkonomi per transaksjon

| Provisjonssats | Netto til PianoHelse | Netto margin av GMV |
|---|---|---|
| 10 % | Kr 192 | 6,7 % |
| **12 % (anbefalt oppstart)** | **Kr 277** | **9,7 %** |
| **15 % (fra mnd 13)** | **Kr 363** | **12,7 %** |
| 18 % | Kr 448 | 15,7 % |

Alle nettotall er etter Stripe-gebyrer (2,0 % + kr 1,80 + Stripe Connect 0,25 % + kr 0,10).

### 13.3 Break-even

```
Faste driftskostnader (Fase 2, ekskl. lønn): kr 12 950/mnd
Netto per transaksjon (12 %): kr 277

Break-even = 47 bookinger/mnd
```

47 bookinger tilsvarer ca. 6 stemmere som gjennomfører 8 oppdrag per måned via plattformen — et realistisk mål tidlig i Fase 2.

| Provisjonssats | Break-even transaksjoner/mnd |
|---|---|
| 10 % | 67 |
| 12 % | 47 |
| 15 % | 36 |
| 18 % | 29 |

### 13.4 Kapitalbehov

| Scenario | Minimum startkapital | Anbefalt buffer |
|---|---|---|
| Pessimistisk | Kr 574 000 | Kr 700 000 |
| **Base case** | **Kr 442 000** | **Kr 530 000** |
| Optimistisk | Kr 368 000 | Kr 450 000 |

**Anbefalt finansiering: kr 530 000** (base case med 20 % buffer). Kan bootstrappes uten ekstern kapital dersom grunnleggerne kan dekke dette fra egne midler.

### 13.5 EBITDA og break-even tidslinje (base case)

- **EBITDA-positivt:** Måned 13
- **Akkumulert cash-underskudd ved mnd 12 (cash low point):** Ca. kr 441 526
- **Provisjonssats fra mnd 7:** 12 %
- **Anbefalt oppjustering til 15 %:** Fra måned 13 (EBITDA er positivt, stemmerne er etablert)

### 13.6 Lifetime Value og CAC

| Kundesegment | LTV (base case) | CAC (base case) | LTV:CAC |
|---|---|---|---|
| Pianoeier | Kr 2 078 | Kr 300 | **6,9 : 1** |
| Pianostemmer | Kr 178 165 | Kr 600 | **297 : 1** |

Stemmersiden er klart den mest verdifulle — en etablert stemmer med jevnt volum (8 oppdrag/mnd via plattformen i 6,7 år) genererer kr 178 000 i livstidsinntekt til PianoHelse.

**Kritisk risiko (pianist-siden):** LTV er svært sensitiv for bookingfrekvens. Dersom gjennomsnittlig pianist ikke bestiller minst 1 stemming per år via plattformen, faller LTV under kr 831 (pessimistisk).

### 13.7 Supabase-kostnad

Supabase Free tier er tilstrekkelig gjennom hele Fase 1 og Fase 2 (estimert 56 MB databasebruk etter 12 måneder — langt under 500 MB-grensen). Første betalingsutløsende grense er 50 000 MAU, som ikke nås før tidligst år 2–3.

---

## 14. Faglig validering (fra Piano Tuner Expert)

*Levert av: Piano Tuner Expert — 20. mars 2026. Kilde: `marked-og-fagkunnskap.md` og `diagnose-validering.md`.*

### 14.1 Bransjestrukturen — en generasjonskrise

| Parameter | Verdi |
|---|---|
| NPTF-registrerte stemmere (Norge 2026) | 66 |
| Yrkesaktive (heltid/deltid, estimat) | 50–80 |
| Gjennomsnittsalder NPTF-stemmere | **62 år** |
| Studenter per kull, NMH pianostemmerstudium | 5 |
| Europeisk nedgang i antall stemmere (2021–2024) | −15 % |
| Teoretisk piano : stemmer-ratio | 900–2 400 pianoer per stemmer |

Gjennomsnittsalderen på 62 år er kritisk — bransjens rekrutteringsbase svikter. Nyutdannede stemmere er PianoHelseplattformens mest motiverte målgruppe på tilbudssiden.

### 14.2 Geografisk dekning

| Region | Tilgjengelighet |
|---|---|
| Oslo og Viken | Godt dekket |
| Bergen og Vestland | Rimelig dekket |
| Trondheim og Trøndelag | Middels dekket |
| Stavanger/Rogaland | Begrenset kapasitet |
| Nord-Norge | Kritisk underdekning (1–2 kjente stemmere) |
| Innlandet / Telemark / Agder | Spredt og sårbar |

### 14.3 Opptrekk-trigger — når pianoet trenger pitch raise

Opptrekk er nødvendig når:
- Pianoet har stått ustemt i mer enn 3–5 år
- **Gjennomsnittlig avvik er over 25 cent fra A4 = 440 Hz**
- Pianoet er nettopp importert med annen stemmingspraksis

**Appen MÅ flagge opptrekk-behov** ved gjennomsnittlig avvik > 25 cent og informere om mulig to-besøks-prosess og ekstra kostnad.

Typisk opptrekk-kostnad (2026): Kr 500–1 300 i tillegg til standard stemming.

### 14.4 UltimateDetector — faglig vurdering for pianoapplikasjon

| Register | Vurdering |
|---|---|
| A1–C6 (midtregister, 55–1047 Hz) | God — anbefalt primærregister for diagnostikk |
| C6–C8 (høy diskant) | Akseptabelt — brukeren bør spille forte |
| A0–E1 (sub-bass, under 80 Hz) | Begrenset — mobilmikrofoner har dårlig respons |

**Konklusjon:** UltimateDetector er godt egnet for pianodiagnostikk i midtregisteret. Appen bør flagge målinger under 80 Hz med lavere konfidensverdi og oppfordre til forte-anslag.

Inharmonisitets-robusthet: UltimateDetectors harmoniske verifisering med stigende toleranse (`tol = baseTolerance + 0.005 * nearestN`) er direkte relevant for piano, der strengers inharmonisitet gjør overtoner skarpere enn ideelle heltallsmultipla.

### 14.5 Helsescore-tolkning — faglig forankret

| Score | Status | Gjennomsnittlig avvik | Anbefalt budskap |
|---|---|---|---|
| 85–100 | Utmerket | < 3 cent | Ingen stemming nå. Sjekk om 6–12 mnd |
| 70–84 | Akseptabel | 3–6 cent | Bør stemmes innen 6–12 mnd |
| 50–69 | Trenger stell | 6–12 cent | Stem innen 3–6 mnd; viktig for barns gehør |
| 30–49 | Hørbart falskt | 12–20 cent | Bestill snart — informer stemmeren |
| **Under 30** | **Kritisk** | **> 20 cent** | **Mulig opptrekk nødvendig — to besøk** |

**Anbefalt scoring-threshold for opptrekk-advarsel: score under 30** (tilsvarer > 20 cent gjennomsnittlig avvik og antyder piano ustemt i mange år).

### 14.6 Hva appen ALDRI skal si

- "Pianoet ditt er perfekt stemt" — kan misforstås som garanti
- "Streng X er brutt" — appen kan ikke diagnostisere årsaker
- "Det koster kr X å utbedre dette" — prissetting er stemmerens ansvar
- "Pianoet trenger ikke stemmes på X år" — avhenger av faktorer appen ikke måler

### 14.7 Sertifisering — NPTF vs. RPT

PianoHelse bør anerkjenne begge sertifiseringsordningene på stemmerprofilen:
- **NPTF-autorisasjon** er norsk standard (krever 4 år praksis + fagprøve)
- **RPT (Registered Piano Technician, PTG)** er internasjonal tilleggssertifisering

Verifisering av NPTF-sertifikat mot NPTF-register er ikke planlagt i MVP — dette er et åpent gap (GAP-05).

---

## 15. Kritiske åpne spørsmål

*Oppdatert 20. mars 2026 basert på `gap-analyse.md`. Disse spørsmålene blokkerer eller begrenser implementasjonen.*

### Avgjørende spørsmål som MÅ besvares FØR lansering

**1. Prismodell: fast pris vs. anbud? (GAP-11 — blokkerer bookingflyt-design)**

Masterplanen antyder anbudsmodell ("stemmere legger inn pris og tilgjengelighet"), mens brukerflytdokumentet antyder fast pris med kalendervalg. Disse er motstridende. Hele brukerflyt, provisjonsberegning og UI-design er avhengig av dette valget.

Anbefaling: Stemmeren setter standardpris per tjenestetype (standard stemming, pitch raise, regulering). Pianoeier velger stemmer basert på pris og tilgjengelighet — kombinert fast pris / valg-modell, ikke anbud.

**Ansvarlig:** Lead Coordinator. **Frist:** Uke 1.

---

**2. MVA-struktur for provisjon (GAP-09)**

Ingen dokumenter nevner merverdiavgift. Pianostemmers tjenester er MVA-pliktige (25 %). PianoHelses provisjon er MVA-pliktig. Dersom PianoHelse behandler hele betalingen via Stripe Connect ("collect then transfer"), kan Skatteetaten argumentere for at PianoHelse er reell tjenesteleverandør — noe som medfører MVA-ansvar på hele transaksjonsbeløpet (kr 713 per oppdrag ved kr 2 853). Dette kan endre hele lønnsomhetsprofilen.

To alternativer:
- **Collect-then-transfer:** Stripe-anbefalt, men MVA-risiko som "undisclosed agent"
- **Fakturabasert:** Stemmeren fakturerer kunden, PianoHelse fakturerer stemmeren for lead-fee. MVA-risikoen elimineres, men er mer kompleks.

**Ansvarlig:** Economist + juridisk rådgiver. **Frist:** Pre-Fase 2.

---

**3. Verifisering av stemmer-sertifisering — NPTF eller selvdeklarering? (GAP-05 / GAP-12)**

Det er ikke definert hva "godkjenning" av en stemmer faktisk innebærer. To uavklarte spørsmål:

a) Krever PianoHelse NPTF-sertifikat (og dermed ekskluderer ikke-sertifiserte fagpersoner)? Eller aksepteres alternativ dokumentasjon (RPT, fagbrev, referanser)?

b) Dersom NPTF-sertifikat kreves: sjekkes sertifikatnummeret mot NPTF-registeret, eller selvdeklarerer stemmeren?

Med kun 66 NPTF-autoriserte stemmere i Norge er eksklusjonskravet potensielt ødeleggende for tilbudssiden.

**Ansvarlig:** Piano Tuner Expert + Lead Coordinator. **Frist:** Uke 2.

---

**4. Databehandleravtaler — ingen er signert ennå (GAP-17 / R-03)**

PianoHelse bruker tre kritiske tredjeparts databehandlere:
- **Supabase** (US-selskap, Delaware Corp, AWS-infrastruktur) — DPA ikke signert
- **Stripe** (betalingsbehandler) — DPA ikke signert
- **Resend** (e-posttjeneste) — DPA ikke signert

Uten signerte DPA-er er PianoHelse i brudd med GDPR artikkel 28. Datatilsynet kan ilegge bøter (opptil 4 % av global omsetning eller EUR 20 mill) og pålegge driftsstans. Dette MÅ løses FØR de første brukerne registrerer seg.

**Ansvarlig:** Lead Coordinator + Developer. **Frist:** Uke 1–2.

---

### Øvrige åpne spørsmål (høy prioritet, ikke lanserings-blokkerende)

5. **No-show-policy:** Hva skjer dersom stemmeren aksepterer men ikke møter opp? Ingen prosedyre finnes (GAP-06).
6. **Refusjonspolicy:** Hvem initierer refusjon? Hvem bærer Stripe-gebyr? (GAP-07)
7. **RoPA:** GDPR art. 30 krever Register over Behandlingsaktiviteter. Ikke opprettet (GAP-16).
8. **Cookie-banner:** ePrivacy-direktivet krever aktivt samtykke for analytiske cookies. Ikke implementert (GAP-08).
9. **Gjenoppta skanning:** 5–8 minutter er en kritisk drop-off terskel. Ingen resume-funksjonalitet (GAP-13).
10. **Digital piano:** Diagnostikken er meningsløs for digitale pianoer — ingen dedikert UX (GAP-14).

---

*Neste gjennomgang: Etter at beslutning om prismodell er tatt og DPA-er er signert.*
*Dokumenteier: Lead Coordinator*
