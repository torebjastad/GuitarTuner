# PianoHelse — Investorpitch
**Seed-runde 2026 · Konfidensielt**

---

## Slide 1: Tittel

# PianoHelse
### Norges første app for pianohelseanalyse og stemmer-booking

> **"Vi gjør pianostell enkelt og tilgjengelig for alle."**

**Tagline:** Ta vare på musikken.

Diagnostisér. Book. Nyt musikken.

**Kontakt:** pianohelse.no

---

## Slide 2: Problemet

### 75 000–120 000 pianoer i Norge — og de fleste får ikke den stellet de trenger.

**Fakta om det norske pianomarkedet:**

- Norge har ca. 75 000–120 000 private klaverer og flygler i hjem, musikkskoler, kirker og kulturhus — basert på europeiske gjennomsnitt (1 piano per 30–40 husholdninger) og Statistisk sentralbyrås befolkningstall.
- **60 % av hjemmepianoer stemmes ikke regelmessig.** Faglig anbefaling er 1–2 ganger per år; de fleste pianoer stemmes langt sjeldnere (bransjekilde: RPT/PTG europeisk undersøkelse; norsk estimat basert på intervjuer med aktive pianostemmere).
- Det finnes kun **66 autoriserte NPTF-stemmere** (Norges Pianostemmer og Teknikerforening) i hele landet. Antallet sertifiserte pianostemmere i Europa falt med **15 % fra 2021 til 2024**.
- Det er **ingen Finn.no for pianostemming.** Ingen digital markedsplass. Ingen standardisert prissetting. Ingen måte å sjekke pianoets faktiske tilstand uten å betale kr 2 853 for et besøk.

**De tre barrierene som holder markedet fastlåst:**

| Barriere | Konsekvens |
|---|---|
| Pianoeier vet ikke om pianoet trenger stemming | Unødvendig utsettelse — "det høres kanskje OK ut" |
| Pianoeier vet ikke hvem man skal ringe | Inaktivitet — prosessen oppleves som for vanskelig |
| Pianostemmer har ingen effektiv kanal for nye kunder | Underutnyttet kapasitet — stemmere er vanskelige å finne |

**Resultatet:** Et marked der både eiere og fagfolk taper — og pianoet lider.

---

## Slide 3: Løsningen

### PianoHelse løser alle tre barrierene i én flyt.

**Slik fungerer det — tre steg:**

```
STEG 1: Diagnostikk (30 sekunder til 5 minutter)
┌─────────────────────────────────────────────────────┐
│  Åpne pianohelse.no på mobilen                      │
│  Gi mikrofontilgang                                  │
│  Spill alle de hvite tangentene én etter én          │
│  Appen lytter, analyserer og måler avvik i cent      │
└─────────────────────────────────────────────────────┘
            ↓
STEG 2: Helserapport (øyeblikkelig)
┌─────────────────────────────────────────────────────┐
│  STEMMEKURVE: Graf som viser avvik per note          │
│  [Grønn: ≤10 cent] [Gul: 10–30 cent] [Rød: >30]    │
│                                                      │
│  HELSEKARAKTER:                                      │
│  ✓ Bra — pianoet er i god stemmning                 │
│  ⚠ Trenger stell — bør stemmes snart                │
│  ✗ Kritisk — pianoet er betydelig ute av stemmning  │
│                                                      │
│  Norsk forklaring uten fagsjargong.                  │
└─────────────────────────────────────────────────────┘
            ↓
STEG 3: Booking (ett klikk)
┌─────────────────────────────────────────────────────┐
│  Trykk "Book en stemmer"                             │
│  Skriv inn postnummer og e-post                      │
│  Diagnostikkrapporten følger automatisk med          │
│  Stemmeren ser pianoets tilstand FØR besøket         │
│  Du mottar tilbud innen 24 timer                     │
└─────────────────────────────────────────────────────┘
```

**Nøkkelfordelen for stemmeren:** De ankommer et oppdrag de allerede forstår. Ingen overraskelser. Raskere jobb. Fornøyd kunde.

**Nøkkelfordelen for pianoeieren:** Objektiv diagnose, fast pris, autorisert fagperson — uten å måtte spørre venner om tips.

**Vår teknologiske kjernefordel:** UltimateDetector — en proprietær, JavaScript-basert tonehøydealgoritme som dekker hele pianoregisteret (A0 til C8, 27,5 Hz til 4186 Hz). All lydanalyse skjer klient-side i nettleseren. Ingen lyd overføres til server. Ferdig bygget og validert.

---

## Slide 4: Produktdemonstrasjon

### Hva brukeren opplever.

**Skjerm 1 — Forsiden:**
En rolig, profesjonell landingsside. Mørk blå-grønn bakgrunn, elfenbenfarget typografi. Én stor knapp: **"Sjekk pianoet ditt — gratis."** Under: tre ikoner som forklarer flyten på ti sekunder. Ingen innlogging. Ingen app å laste ned.

**Skjerm 2 — Diagnostikkmodulen:**
Et animert, minimalistisk klaviatur fyller skjermen. Aktuell tangent lyser opp i blå-grønt. En diskret fremdriftslinje: *"23 av 52 tangenter analysert."* Telefonen lytter. Brukeren spiller. Det er faktisk litt gøy.

**Skjerm 3 — Helserapporten (WOW-øyeblikket):**
For første gang i pianoeierens liv ser de pianoets faktiske stemmetilstand som en kurve. Bass-registeret viser +22 cent. Diskanten er stort sett grønn. Én note i midten stikker ut i rødt: **+47 cent.** Øverst: en stor, tydelig karakter — **"Trenger stell."** Under: *"Pianoet ditt er i gjennomsnitt 18 cent ute av stemmning. Det er normalt etter 2–3 år. Vi anbefaler stemming snart."*

Dette øyeblikket — å se noe man aldri har kunnet se før — er delbart. Det er noe man viser til sin partner, sin musikklærer, sin venn som også har piano. Det er vår organiske vekstmotor.

**Skjerm 4 — Bookingflyten:**
En enkel skjerm. Postnummer. E-postadresse. Ønsket tidsperiode. Diagnostikkrapporten er allerede vedlagt — ingen ekstra steg. Én knapp: **"Send forespørsel."** Ferdig.

**Skjerm 5 — Stemmerportalen:**
Lars, pianostemmer, ser på sin portal: tre nye forespørsler i Oslo-området. Han klikker på én — og ser pianoets stemmekurve allerede. Han vet at det dreier seg om en enkel standard-stemming. Han sender tilbud med estimert tid og pris. Ti minutter arbeid. Ingen telefonsamtaler.

---

## Slide 5: Markedet

### TAM / SAM / SOM — Det norske pianomarkedet

**Total adresserbart marked (TAM):**
Det norske markedet for pianostemme- og pianoteknikertjenester er estimert til **kr 180–300 millioner per år**, basert på:
- 75 000–120 000 pianoer i Norge
- Anbefalte 1–2 stemminger per år
- Gjennomsnittspris kr 2 853 per stemming (kilde: Pianostemmeren AS, 2026)
- 50–70 % estimert stemmingsrate blant instrumenter i aktiv bruk

Det globale markedet for pianostemmetjenester er verdsatt til USD 1,8 milliarder (2024) og vokser med 4,2 % CAGR mot USD 2,7 milliarder innen 2033 (bransjekilde, 2024).

**Tilgjengelig adresserbart marked (SAM):**
Private pianoeiere som aktivt kan nås digitalt — primært husholdninger og musikkskoler i Oslo, Bergen, Trondheim, Stavanger og Kristiansand. Estimert **kr 60–100 millioner per år**:
- Ca. 30 000–45 000 aktivt brukte pianoer innenfor digital rekkevidde
- Estimert 1 stemming hvert 2. år i gjennomsnitt
- Pris kr 2 853 per oppdrag

**Serviceable Obtainable Market (SOM) — realistisk 3-årshorisont:**
**5 % markedsandel innen år 3** gir ca. 10 000 bookede oppdrag per år, tilsvarende:
- Brutto oppdragsverdi: ca. kr 28,5 millioner
- PianoHelse-provisjon (18 %): **kr 5,13 millioner per år**

Dette er et konservativt estimat. Markedet er udigitalisert og PianoHelse vil være alene om å tilby diagnostikk + booking som integrert flyt.

**Vekstdrivere utover Norge:**
- 35 millioner pianoer i Europa
- Svenske (Piano.se), danske og finske markeder er tilsvarende udigitaliserte
- Nordisk ekspansjon fra år 3 er inkludert i visjonen, men ikke i projeksjonene nedenfor

---

## Slide 6: Forretningsmodell

### Enkel. Skalerbar. Rettferdig for begge parter.

**Primærinntektsstrøm: Provisjon per gjennomført oppdrag**

| Element | Verdi |
|---|---|
| Gjennomsnittlig oppdragsverdi | Kr 2 853 inkl. mva. |
| PianoHelse-provisjon | 18 % |
| PianoHelse-inntekt per oppdrag | **~kr 513** |
| Stemmer mottar | Kr 2 340 netto |

18 % er konkurransedyktig sammenlignet med generalist-markedsplasser (Mittanbud: ~20–25 %, Thumbtack: ~20 %) og er lavere enn matleveringstjenester (25–35 %). Prisen er synlig og rettferdig.

**Modellen er enkel å kommunisere:**
- Pianoeier betaler ingenting til plattformen — bare til stemmeren, til normal pris
- Stemmeren betaler 18 % provisjon av hvert oppdrag han/hun mottar via PianoHelse
- Ingen abonnement, ingen oppsett-avgift — stemmeren risikerer ingenting

**Bootstrapping — MVP-fase (null provisjon):**
I de første 6 månedene tar vi ingen provisjon. Vi bygger tillit, data og markedsandel. Stemmere profileres gratis i 12 måneder. Dette løser chicken-and-egg-problemet og er det beste markedsføringskronene vi kan bruke.

**Sekundærinntektsstrømmer (Fase 2–3):**

| Strøm | Modell | Tidslinje |
|---|---|---|
| Stemmer-abonnement (synlighet, boost) | Kr 299–599/mnd | Fase 2 |
| Premiumdiagnostikk (historikk, PDF-rapport) | Kr 49 per rapport / kr 149/år | Fase 2 |
| Institusjonelle serviceavtaler (musikkskoler) | Fast årsavgift + provisjon | Fase 3 |
| API-integrasjon (Steinway, Yamaha, Kawai) | Lisensiering | Fase 3 |

**Enhetsøkonomi ved 100 oppdrag/mnd i Oslo alene:**
- Månedlig provisjonsinntekt: **kr 51 300**
- 5 byer × 100 oppdrag: **kr 256 500/mnd = ~kr 3 MNOK/år**
- Lønnsomt på driftsnivå ved Fase 2

---

## Slide 7: Trekkraft og veikart

### Vi har allerede det vanskeligste bak oss.

**Hva som er ferdig i dag:**

| Komponent | Status |
|---|---|
| UltimateDetector (tonehøydealgoritme) | Ferdig bygget og validert. Dekker A0–C8. |
| Teknisk arkitektur (design) | Komplett. Klient-side lydanalyse dokumentert. |
| Markedsanalyse og GTM-strategi | Komplett. Supply-first Oslo-modell klar. |
| Kravspesifikasjon (MVP) | Komplett. Brukerhistorier, akseptansekriterier, GDPR-krav. |
| Merkevareidentitet | Komplett. Tone-of-voice, visuell retning, tagline. |
| Stemmernettverk (identifisert) | NPTF kontaktliste klar. 6 nøkkelkontakter i Oslo identifisert. |

**Veikart — 18 måneder:**

```
[Nå — Mnd 0]    Seed-finansiering lukket
      ↓
[Mnd 1–2]       Teknisk utvikling: diagnostikkmodul + booking-backend
      ↓
[Mnd 2–4]       UX-design og testing. Stemmer-onboarding (Oslo, 15–20 stemmere).
      ↓
[Mnd 4–6]       Intern beta → offentlig soft launch Oslo
      ↓
[Mnd 6]         KPI-sjekk: 500 diagnostikker, 75 bookede oppdrag, NPS > 50
      ↓
[Mnd 6–12]      Oslo saturering. Bergen og Trondheim onboarding.
      ↓
[Mnd 12]        Provisjonsmodell aktivert. Vipps + kortbetaling integrert.
      ↓
[Mnd 12–18]     Nasjonal lansering. 5 byer. 50+ stemmere. Månedlig inntjening.
```

**Nøkkel-KPIer ved milepæler:**

| Milepæl | Diagnostikker | Stemmere | Oppdrag (akk.) | Månedsinntekt |
|---|---|---|---|---|
| Lansering Oslo (Mnd 6) | 500 totalt | 20 | 75 | Kr 0 (bootstrap) |
| Oslo moden (Mnd 12) | 300/mnd | 60 | 1 000 | Kr 500 000+ |
| Nasjonal (Mnd 18) | 800/mnd | 100+ | 3 000 | Kr 1 500 000+ |

---

## Slide 8: Konkurranselandskap

### Vi er alene om kombinasjonen som faktisk løser problemet.

**Ingen eksisterende aktør kombinerer diagnostikk + booking + norsk kontekst.**

| Aktør | Type | Pianodiagnostikk | Norsk booking | Vurdert som |
|---|---|---|---|---|
| **Mittanbud.no** | Generell håndverksmarkedsplass | Nei | Ja (generell) | Sterkeste norske aktør — men vertikal ekspertise mangler totalt |
| **PianoSphere (UK)** | Pianokatalogtjeneste | Nei | Nei | Nærmest oss i tema, men uten booking og uten norsk marked |
| **Thumbtack (USA)** | Lead-fee markedsplass | Nei | Nei (ikke norsk) | Ingen relevans i Norge |
| **Bark.com (UK/int.)** | Lead-generering, USD 246M omsetning | Nei | Ikke norsk | Konkurrerer ikke i norsk nisje |
| **Pianostemmeren.no** | Enkeltbedrift | Nei | Bare sin egne tjenester | Mulig partner, ikke plattformkonkurrent |
| **Håndverkeren.no** | Norsk håndverksmarkedsplass | Nei | Ja (generell) | Uten kategoridybde for piano |

**Vår defensible moat — tre lag:**

1. **Proprietær diagnostikkalgoritme:** UltimateDetector er vår teknologi. Den er ikke tilgjengelig for konkurrenter uten vesentlig ingeniørinnsats. Ingen av de eksisterende aktørene har lydanalyse-kompetanse i piano-domenet.

2. **Historisk pianodata per instrument:** Hvert piano som diagnostiseres via PianoHelse får en unik historikk. Over tid bygger vi det eneste registeret i Norge som dokumenterer pianohelse per instrument — tenk VIN-register for biler. Denne databasen er umulig å kopiere uten å starte fra scratch.

3. **Vertikal ekspertise og tillit:** Vi er spesialister. Mittanbud og Thumbtack kan aldri bli "pianoplattformen" — de er for generelle. NPTF-stemmere og pianobutikker vil samarbeide med en spesialist, ikke en håndverksaggregator.

**Høyeste trusselnivå:** Mittanbud (nylig kjøpt av Verdane) kan utvide til musikkverktøy. Vår respons: bygg et 12–18 måneders teknologisk forsprang og sørg for at stemmernettverket er eksklusivt knyttet til oss.

---

## Slide 9: Team

### Vi trenger de riktige menneskene — og vi vet hvem det er.

PianoHelse er bygget på tverrfaglig kompetanse. Teamet kombinerer teknologi, bransjekunnskap, norsk markedserfaring og produktledelse.

**Nødvendig kjerneteam:**

**CEO / Produktsjef**
- Norsk markedserfaring, B2C, mobilfokusert
- Erfaring med tosidig markedsplass (to-sided marketplace)
- Investornettverk — kjennskap til Investinor, Norse VC, Katapult
- Varm forståelse for norsk forbrukerpsykologi og Janteloven-sensitivitet

**CTO / Lead Developer**
- Ekspertise i Web Audio API, JavaScript (vanilla + moderne rammeverk)
- PWA-utvikling (Progressive Web App) — offline-kapasitet, mobil-ytelse
- Backend: Node.js eller Python, PostgreSQL, sikker API-arkitektur
- Kjennskap til GDPR-compliant arkitektur (klient-side lydbehandling er avgjørende)

**UX / Designer**
- Mobil-først design — kritisk for diagnostikkflyten
- Erfaring med norske forbrukerapper (ikke Silicon Valley-stil)
- Kompetanse i datavizualisering (stemmekurven er produktets hjerte)

**Piano-ekspert (rådgiver / deltid)**
- Autorisert NPTF-stemmer
- Validerer diagnostikktersklene (cent-avvik per helsekarakter)
- Inngangsdør til NPTF-nettverket og de 66 autoriserte stemmerne
- Faglig troverdighet overfor pressen og bransjen

**Salg / Partnerskap (Fase 2)**
- Ansvarlig for onboarding av stemmere og institusjonelle avtaler
- Kontakter i kulturskolesektoren, kirker, pianobutikker

**Rådgiverteam (søkes):**
- Musikknæringen: NMF, NPTF, Aspheim/Hellstrøm/Steinway-kontakter
- Juridisk: GDPR-spesialist, markedsplassrett
- Teknologisk: Erfaren SaaS/markedsplass-gründer

---

## Slide 10: Finansielle projeksjoner

### Konservative estimater. Klare forutsetninger.

**Forutsetninger:**
- Gjennomsnittlig oppdragsverdi: kr 2 853 (fast, basert på Pianostemmeren AS listepris 2026)
- PianoHelse-provisjon: 18 % av oppdragsverdi
- PianoHelse-inntekt per oppdrag: kr 513,54
- Provisjonsmodell aktiveres i Fase 2 (mnd 12)
- År 1 starter ved lansering (Oslo soft launch, mnd 6 etter finansiering)
- Ingen sekundærinntekter inkludert i proyeksjonene nedenfor

**Oppdragsvolum og inntektsvekst:**

| År | Oppdrag totalt | Inntekt (18 % provisjon) | Nye byer | Aktive stemmere |
|---|---|---|---|---|
| **År 1** (Lansering → Mnd 12) | 500 oppdrag | **Kr 256 500** | Oslo | 20–30 |
| **År 2** (Mnd 12–24) | 3 000 oppdrag | **Kr 1 540 000** | Oslo + Bergen + Trondheim | 60–80 |
| **År 3** (Mnd 24–36) | 10 000 oppdrag | **Kr 5 130 000** | 5+ byer nasjonalt | 100+ |

**Månedlig oppdragsrytme (År 3):**
- Gjennomsnitt 833 oppdrag per måned
- 5 byer × ca. 167 oppdrag/mnd per by
- Oslo alene: estimert 300–400 oppdrag/mnd ved full saturering

**Kostnadsprofil (estimert, År 1–2):**

| Post | År 1 | År 2 |
|---|---|---|
| Teknisk utvikling og hosting | Kr 600 000 | Kr 400 000 |
| Design og UX | Kr 150 000 | Kr 100 000 |
| Markedsføring og PR | Kr 150 000 | Kr 400 000 |
| Juridisk (GDPR, vilkår, kontrakter) | Kr 75 000 | Kr 50 000 |
| Drift, administrasjon | Kr 100 000 | Kr 200 000 |
| Vipps/Stripe-integrasjon | — | Kr 50 000 |
| **Totalt** | **Kr 1 075 000** | **Kr 1 200 000** |

**Break-even estimat:** Rundt 2 350 oppdrag akkumulert — realistisk i løpet av år 2.

**Viktig merknad om provisjonsfri MVP-fase:**
Ingen inntekter i de første 6 månedene er bevisst. Vi investerer i tillit, data og nettverkseffekter — den eneste rasjonelle strategien for en tosidig markedsplass som starter fra null.

---

## Slide 11: Funding Ask

### Kr 3 500 000 seed — for å ta produkt til marked.

**Beløp:** Kr 3 500 000 (ca. EUR 300 000)

**Runde:** Seed / Pre-seed

**Instrumenttype:** Konvertibelt lån med 20 % diskont ved neste runde, eller direkte egenkapital ved enighet om verdsettelse.

**Bruk av midler:**

| Kategori | Andel | Beløp | Formål |
|---|---|---|---|
| Teknologi og produkt | 60 % | Kr 2 100 000 | Backend, frontend, diagnostikkmodul, betalingsintegrasjon (Vipps + Stripe), sikkerhet, GDPR-arkitektur |
| Markedsføring og vekst | 25 % | Kr 875 000 | Stemmer-rekruttering, PR-push, Facebook/Instagram-annonsering, pianobutikk-partnerskap, innholdsproduksjon |
| Drift og administrasjon | 15 % | Kr 525 000 | Juridisk (GDPR-review, vilkår), infrastruktur, lønn i opprampingsfasen |

**Runway:** 18 måneder

**Neste milepæl ved bruk av disse midlene:**
- 100 aktive, verifiserte stemmere på plattformen
- 2 000 bookede og gjennomførte oppdrag
- Provisjonsmodellen aktivert og bevist
- Klar for Serie A eller videre vekstfinansiering

**Hva vi ser etter i en investor:**
- Norsk nettverk og markedsforståelse
- Erfaring med B2C/markedsplass-modeller
- Langsiktig perspektiv — dette er ikke en flip-kandidat på 12 måneder
- Gjerne et personlig forhold til musikk, kultur eller håndverk

**Potensielle finansieringskilder vi aktivt vurderer:**
- Innovasjon Norge (kulturteknologi / digital nyskaping)
- Norse VC / Katapult (norsk tidligfasefond)
- Kulturdepartementet (musikk som kulturarv)
- Engelinvestorer med interesse for musikk og teknologi

---

## Slide 12: Visjon

### Vi starter med Norge. Vi stopper ikke der.

**Det finnes 35 millioner pianoer i Europa.**

Alle trenger stell. Ingen har enkel tilgang til diagnostikk. Tilgangen til sertifiserte stemmere faller overalt.

PianoHelse er ikke en norsk app som kanskje kan skalere. Det er en europeisk plattform som starter i Norge — fordi Norge er det smarteste startpunktet:

- Høy kjøpekraft og digital modning
- Konsentrert geografi som gjør supply-rekruttering håndterbar
- Sterk musikk- og kulturarvsidentitet (Grieg, Hellstrøm, NPTF)
- Regulatorisk rammeverk (GDPR) som tvinger frem et etisk produkt fra dag én

**Nordisk ekspansjon — år 3:**
Sverige, Danmark og Finland har tilsvarende markedsstruktur: 300 000–500 000 pianoer per land, udigitalisert stemme-marked, sterk kulturell identitet knyttet til piano. Sverige alene er 3× Norges befolkning.

**Europeisk potensial — år 5:**
Tyskland (9 millioner pianoer), Frankrike, UK, Polen og Østerrike er alle modne for det samme produktet. Med nordisk trackrecord og proprietær diagnostikkteknologi er PianoHelse en overtagelseskandidat eller IPO-kandidat på 7–10 års horisont.

**Men vi gjør én ting riktig nå:**
Vi gir Kari i Oslo et ærlig svar på om pianoet hennes trenger stell. Vi kobler henne med Lars, pianostemmeren som ikke hadde fylt opp kalenderen sin. De møtes. Pianoet klinger riktig igjen. Datteren spiller bedre.

Det er produktet. Det er visjonen.

> **"Et piano kan leve i 100 år med god pleie. Vi vil at det skal skje."**

---

*PianoHelse — Seed-runde 2026*
*Alle tall i norske kroner inkl. mva. der ikke annet er angitt.*
*Finansielle projeksjoner er estimater og ikke garantier om fremtidig inntjening.*
*Konfidensielt dokument — ikke til videredistribusjon.*
