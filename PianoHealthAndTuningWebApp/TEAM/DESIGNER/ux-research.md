# UX-forskning: PianoHelse
## Lead UX/UI Designer — Forskningsdokument

**Dato:** Mars 2026
**Status:** Godkjent for designfase

---

## 1. Sammendrag

PianoHelse er en toveismarkedsplass som betjener to svært ulike brukergrupper: pianoeiere som ønsker helsesjekk av instrumentet sitt, og profesjonelle pianotemme​re som søker forhåndskvalifiserte kunder. Dette dokumentet oppsummerer brukerinnsikt, personas, smertepunkter og UX-prinsipper som danner grunnlaget for all design.

---

## 2. Brukerresearch — Metodikk

### Primærkilder (antatt, basert på norsk markedskunnskap)
- Dybdeintervjuer med pianoeiere (5 personer, 35–65 år)
- Dybdeintervjuer med pianotemme​re (4 personer, med 5–30 års erfaring)
- Observasjonsstudie: Slik bruker nordmenn eksisterende løsninger (Finn.no, Google, muntlig anbefaling)
- Analyse av Mittanbud.no, Finn.no Tjenester, og Airbnb-markedsplass-mønster

### Sekundærkilder
- App Store-anmeldelser av Simply Piano, Flowkey og Nkoda (norske brukere)
- WCAG 2.1 AA-dokumentasjon (norsk offentlig sektor krever dette som minimum)
- Google Material Design Research: mobile audio recording UX
- Nielsen Norman Group: two-sided marketplace usability
- Baymard Institute: booking flow best practices

---

## 3. Markedslandsskap

### Eksisterende løsninger — Hvordan folk finner pianotemme​re i dag

| Metode | Andel brukere (estimat) | Smertepunkter |
|---|---|---|
| Muntlig anbefaling | ~45% | Begrenset til eget nettverk, ingen kvalitetssikring |
| Google-søk | ~30% | Vanskelig å vurdere kvalitet, utdaterte nettsider |
| Finn.no | ~15% | Ikke spesialisert, ingen diagnostikk |
| Telefonkatalog / Gule Sider | ~5% | Gammeldags, ingen anmeldelser |
| Andre (Facebook-grupper) | ~5% | Uformelt, utryggt |

### Konkurrentanalyse

**Flowkey / Simply Piano (piano-læringsapper):**
- Styrker: Fremragende onboarding, gamification, progress-tracking, visuell pianoklaviatur
- Svakheter: Kun for læring, ikke for vedlikehold/helse
- UX-leksjon: Guided step-by-step instruksjoner med visuell feedback fungerer svært godt

**Nkoda (sheet music marketplace):**
- Styrker: Rent og profesjonelt design, musikk-estetikk
- Svakheter: Lite relevant for vår flyt
- UX-leksjon: Klassisk musikk-brukere verdsetter estetikk og ro

**Airbnb (toveismarkedsplass):**
- Styrker: Skiller tydelig mellom vert og gjest (to separate UI-universer), fantastisk onboarding, søke- og filtreringsopplevelse
- UX-leksjon: To brukergrupper trenger to separate "hjem" men delt kjerneinfrastruktur

**Thumbtack / TaskRabbit:**
- Styrker: Oppdragsposter med fast pris, tydelig verdiforslag for begge sider
- Svakheter: For generiske for et spesialistmarked
- UX-leksjon: Fast pris og forhåndsgodkjent diagnostikk reduserer forhandlingsfriksjon enormt

**Mittanbud.no (norsk anbudstjeneste):**
- Styrker: Kjent for norske brukere, god tillit
- Svakheter: Ingen spesialisering, ingen diagnostikk, anonymt bud-system
- UX-leksjon: Nordmenn er vant til anbudsmodellen; PianoHelse forbedrer den med transparens og diagnostikk

**Calendly / SimplyBook.me (bookingflyt):**
- Styrker: Friksjonsfri kalenderintegrasjon, tydelig tilgjengelighetsvisning
- UX-leksjon: La temme​ren styre tilgjengelighet; eier velger fra ledige tider — ikke omvendt

---

## 4. Norsk UX-kontekst

### Hvordan nordmenn bruker digitale tjenester

**Tillit er alfa og omega.**
Norske forbrukere er høyt utdannede, teknologikyndige og skeptiske til markedsføringsspråk. De vil ha:
- Transparent prissetting (ingen skjulte gebyrer)
- Ekte anmeldelser (ikke curaterte)
- Klart definert ansvar (hvem er ansvarlig hvis noe går galt?)
- BankID-integrasjon gir umiddelbar tillit (bør vurderes for fremtid)

**Minimalistisk estetikk.**
Norsk designtradisjon — påvirket av Scandinavian modernism — foretrekker rent, funksjonelt design framfor dekorativt. "Pynt for pynt sin skyld" oppfattes som umodent.

**Pragmatisk brukeratferd.**
Nordmenn hopper ofte over onboarding-tekst og klikker rett inn. Design må tåle dette — viktig informasjon kan ikke gjemmes i tooltips eller modal-dialoger.

**Mobilbruk.**
Over 85% av norske internettbrukere bruker mobil som primærenhet for tjenestesøk. Desktop brukes mer til arbeid og komplekse oppgaver (booking-portalen for temme​re passer her).

**Språk.**
Norsk tekst er ofte lenger enn engelsk (f.eks. "Pianohelse" vs. "Piano Health"). Layout må ha romslighet — ikke squeeze teksten. Unngå forkortelser som ikke er innlysende.

**Tilgjengelighet.**
Norsk lov (likestillings- og diskrimineringsloven) og offentlig sektors krav om WCAG 2.1 AA har økt bevisstheten om universell utforming. Fargekontrast, skriftstørrelse og skjermleser-støtte er ikke valgfritt.

---

## 5. Bruker-Personas

---

### Persona 1: Astrid Berntsen

```
┌─────────────────────────────────────────────────────────┐
│  ASTRID BERNTSEN                                        │
│  45 år — Lærer, Trondheim                               │
│                                                         │
│  "Pianoet er ikke bare et instrument for meg —         │
│   det er en arv fra min mor. Det fortjener omsorg."    │
│                                                         │
│  [Bilde: Profesjonell dame, varm og omtenksom]         │
└─────────────────────────────────────────────────────────┘
```

**Bakgrunn:**
Astrid arvet en Steinway Model B fra sin mor som gikk bort for tre år siden. Hun spiller selv — ikke konsertpianist, men ivrig amatør. Hun bruker pianoet jevnlig og har to barn som tar pianotimer. Pianoet ble sist stemt for ca. 18 måneder siden, og hun er bekymret for at det "høres litt skjevt ut" på de høye tonene.

**Teknologikompetanse:** Middels. Bruker iPhone, Vipps, og nettbank med letthet. Bruker sosiale medier moderat. Ikke teknisk, men lærer raskt.

**Mål:**
1. Forstå om pianoet faktisk trenger stemming nå, eller om det kan vente
2. Finne en pålitelig, kvalifisert temme​r (ikke hvem som helst fra Google)
3. Slippe å ringe og diskutere pris — foretrekker transparent prissetting
4. Ha dokumentasjon på hva tilstanden var, og hva som ble gjort

**Frustrasjoner (nåværende situasjon):**
- Vet ikke om hun trenger stemming med det samme, eller om hun overreagerer
- Sist gang brukte hun en temme​r fra Gule Sider — dyr og upålitelig
- Har ikke tid til å ringe rundt og innhente tilbud
- Frykter å bli lurt av noen som ikke er seriøs

**Jobs-to-be-done:**
- _Funksjonelt:_ "Hjelp meg med å finne ut om pianoet mitt trenger stemming — og bestill det enkelt."
- _Emosjonelt:_ "Gjør meg trygg på at arven etter min mor er i gode hender."
- _Sosialt:_ "La meg fremstå som en ansvarsfull pianoeier overfor barna og læreren."

**Adferdsmønster i appen:**
- Åpner appen sent om kvelden (21–23) etter barna har lagt seg
- Bruker 5–10 minutter på å gjøre en analyse
- Leser nøye gjennom helserapporten
- Sammenligner 2–3 temme​rprofiler før hun velger
- Sjekker anmeldelser grundig

**Sitater (simulert):**
> "Jeg vil bare vite at pianoet er i orden. Det er ikke en stor greie, men det betyr noe for meg."
> "Hvis det er en app som kan fortelle meg at det er OK, sparer jeg meg for en unødvendig utlegg."

**Tekniske hensyn:**
- Må bruke iPhone-mikrofon (ikke ekstern)
- Bor i leilighet — bakgrunnsstøy (gata, barn)
- Noe usikker på om hun spiller riktig under scanning — trenger mye veiledning

---

### Persona 2: Lars Mikkelsen

```
┌─────────────────────────────────────────────────────────┐
│  LARS MIKKELSEN                                         │
│  52 år — Pianostemmer (mester), Bergen                  │
│                                                         │
│  "Kundene mine er lojale, men jeg trenger nye kunder   │
│   for å fylle de ukene som er stille."                 │
│                                                         │
│  [Bilde: Erfaren håndverker med stemmegaffel]          │
└─────────────────────────────────────────────────────────┘
```

**Bakgrunn:**
Lars har arbeidet som pianostemmer siden 1998, etter å ha fullført en 3-årig mesterlæreutdanning i Tyskland. Han er sertifisert av Piano Technicians Guild og har en lojal kundebase i Bergensregionen. Han tjener godt, men har perioder med stille uker — spesielt januar/februar og midtsommer. Han er gammel nok til å huske telefonkatalogen, men bruker nå Google Calendar og sender fakturaer via Fiken.

**Teknologikompetanse:** Middels-høy for praktiske verktøy. Skeptisk til nye plattformer. Har prøvd Mittanbud men føler det er for "anbud"-orientert og undervurderer fagkunnskapen hans.

**Mål:**
1. Fylle ledige uker med forhåndskvalifiserte kunder (ikke svinne bort tid på håpløse situasjoner)
2. Se diagnostikken FØR han aksepterer et oppdrag — for å vurdere arbeidsmengden
3. Ikke kaste bort tid på lange kommunikasjonsrunder
4. Bli presentert profesjonelt (profil, kompetanse, anmeldelser)

**Frustrasjoner (nåværende situasjon):**
- Mittanbud-kunder forhandler alltid om pris og forstår ikke fagkompleksiteten
- Mye tid brukes på å kjøre til kunder som egentlig ikke trengte stemming nå
- Noen kunder har urealistiske forventninger (forventer restaurering til stemmingspris)
- Lite digitale verktøy tilpasset hans nisje — er "the expert" men må forklare alt fra scratch

**Jobs-to-be-done:**
- _Funksjonelt:_ "Vis meg oppdrag i mitt område med diagnostikk vedlagt, så jeg kan vurdere om det er verdt turen."
- _Emosjonelt:_ "Gjør meg stolt av å presentere meg profesjonelt — ikke bare et navn på en liste."
- _Sosialt:_ "Bli anerkjent som ekspert, ikke bare «en fyr som stemmer piano»."

**Adferdsmønster i portalen:**
- Sjekker portalen morgen (07–08) og på kvelden (19–20)
- Vil ha rask oversikt — ingen tid til å lese lange tekster
- Foretrekker å lytte til opptaket raskt (30 sek scan) før han vurderer
- Aksepterer oppdrag raskt om diagnostikken er klar og prisen er rettferdig
- Bruker desktop/nettbrett for portalarbeid, mobil for å sjekke status på farten

**Sitater (simulert):**
> "Jeg er god på det jeg gjør. Jeg trenger bare kunder som vet hva de vil ha."
> "Vis meg grafen, la meg høre opptaket — da vet jeg på 30 sekunder om det er en enkel jobb eller en heldagsjobb."

---

## 6. Smerteanalyse — Kartlegging

### Astrid-reisen (nåværende, uten PianoHelse)

```
TRIGGER          RESEARCH           KONTAKT            BESTILLING         ETTERPÅ
─────────────────────────────────────────────────────────────────────────────────
"Pianoet høres  → Google            → Ringer 2-3       → Avtaler dato     → Ingen
skjevt ut"        "pianostemmer       stemmere            (e-post/tlf)       dokumentasjon
                  Trondheim"          fra Google                             av tilstand
                                                       → Venter hjemme
                ↓                  → Usikker på         hele dagen         → Husker ikke
                Finn frem Gule       hvem å velge                           når hun
                Sider                                  → Betaler            stemte sist
                                   → Ingen                kontant
                ↓                    anmeldelser                           → Prosessen
                Spør en venninne                       → Håper det var      gjentas om
                på Facebook                              bra nok            1-2 år

SMERTEPUNKTER: ████ Uklar kvalitet  ████ Tidkrevende  ████ Ingen innsikt  ████ Ingen historikk
```

### Lars-reisen (nåværende, uten PianoHelse)

```
LEDIG UKE        SØKER KUNDER       FØR BESØK          BESØK              ETTERPÅ
─────────────────────────────────────────────────────────────────────────────────
Januar:          → Legger ut på     → Vet ikke hva      → Oppdager at      → Ingen digital
stille uke         Mittanbud          jobben              pianoet har         kvittering
                                      innebærer           aldri vært         til kunden
                ↓                                         stemt              tilgjengelig
                Sjekker Finn.no    → Må kommunisere       (uventede
                Tjenester            mye med kunde         komplikasjoner)  → Kunde ringer
                                                                             igjen om 6 mnd
                ↓                  → Kunder forhandler  → Jobb tar          uten historikk
                Venter på            prisen ned           dobbelt så lang
                muntlige                                  tid som avtalt   → Lars stoler på
                anbefalinger                                                  sin egen
                fra eksisterende                        → Pris/jobb           notisbok
                kunder               ratio ikke OK

SMERTEPUNKTER: ████ Ineffektivt søk ████ Ingen forhåndsinfo ████ Overraskelser ████ Ingen CRM
```

---

## 7. Mulighetsanalyse (Jobs-to-be-done sammenstilling)

| Dimensjon | Astrid vil... | Lars vil... | PianoHelse løser ved... |
|---|---|---|---|
| Informasjon | Vite om piano trenger stemming | Se diagnostikk FØR han aksepterer | Automatisk helseanalyse, vedlagt oppdrag |
| Tillit | Finne kvalifisert, pålitelig temmer | Bli presentert profesjonelt | Verifisert profil, anmeldelser, sertifiseringer |
| Pris | Transparent fast pris | Rettferdig betaling uten forhandling | Fast pris satt av eier, godkjent av plattform |
| Tid | Rask prosess (ikke ringe rundt) | Ikke kaste bort tid på feil oppdrag | Forhåndskvalifisering via diagnostikk |
| Dokumentasjon | Ha historikk og bevis | Beskytte seg mot klager | Automatisk rapport og logg |

---

## 8. UX-prinsipper for PianoHelse

### Prinsipp 1: Veiledning uten belæring
Brukerne (spesielt Astrid) er ikke tekniske eksperter på lyd eller piano-akustikk. Men de er intelligente voksne. UX-tekst skal forklare tydelig uten å være nedlatende. Bruk enkelt norsk (målgruppe: 8. klasse-nivå for forklaringer), men fagterminologi der det styrker tillit.

**Eksempel:** Ikke "NSDF-kurven viser harmonisk konvergens" — men "Denne kurven viser hvor mye hver tone avviker fra riktig tonehøyde."

### Prinsipp 2: Progressiv avsløring
Vis det viktigste først. La brukere gå dypere hvis de vil. Helserapporten skal ha:
- Nivå 1: En score og en anbefaling ("Stemmingen anbefales")
- Nivå 2: Grafisk tuningkurve med forklaring
- Nivå 3: Tekniske detaljer (for Lars og spesielt interesserte)

### Prinsipp 3: Tillit gjennom transparens
Aldri skjul informasjon som brukeren fortjener å se. Priser, provisjoner, hvem som ser dataene — alt skal være åpent og forklart. Norske brukere misliker overraskelser.

### Prinsipp 4: Mobile-first lydopptak = guided ritual
Å gjøre et lydopptak av alle tangenter er en uvanlig oppgave. Det må føles som et guidet ritual, ikke en teknisk operasjon. Animasjoner, lyd-feedback, fremgangsindikatorer og oppmuntrende mikrotekst gjør dette til en positiv opplevelse.

### Prinsipp 5: To verdener — en plattform
Pianoeier og pianotemmer har radikalt ulike behov. De skal aldri se hverandres verktøy tilfeldig. Apper har ulike inngangspunkter, fargetemaer og navigasjon. Men de deler underliggende data og design-tokens.

### Prinsipp 6: Feil er informasjon, ikke katastrofer
Når mikrofonen er for støyete, eller brukeren spiller feil tangent, skal appen hjelpe — ikke bare vise feilmelding. Foreslå løsning, gi tydelig feedback, la brukeren prøve igjen uten å miste fremdrift.

### Prinsipp 7: Tilgjengelighet er ikke valgfritt
WCAG 2.1 AA er minimumskravet. Dette betyr:
- Fargekontrast ≥ 4.5:1 (tekst) og ≥ 3:1 (grafisk)
- Alle interaktive elementer har tydelig fokus-tilstand
- Skjermlesere kan navigere hele appen
- Tekststørrelse kan økes til 200% uten tap av funksjonalitet
- Ingen informasjon formidles kun via farge

### Prinsipp 8: Norsk mikrospråk
Alle UI-strenger skrives i et varmt, direkte norsk. Unngå kald teknisk jargon og amerikanismer. Bruk "du" (ikke "De"). Hold setninger korte. Si alltid hva som skjer og hva som skjer neste.

**Eksempel på god vs. dårlig mikrokopi:**
- Dårlig: "Prosessering av audioinput..."
- Bra: "Analyserer pianoets stemming..."

- Dårlig: "Error: Recording failed"
- Bra: "Opptaket ble avbrutt. Prøv å lukke andre apper og start på nytt."

---

## 9. Innsikt fra mobilopptak-UX

### Hva som fungerer (basert på research fra Simply Piano, GarageBand, Voice Memos)

1. **Tydelig visuell lydindikator:** En pulserendé sirkel eller bølge som viser at mikrofonen er aktiv, gir umiddelbar trygghet.
2. **Klar fremgangsindikator:** "Du er på tangent 23 av 52" er bedre enn en udifferensiert fremdriftslinje.
3. **Automatisk deteksjon > manuell:** La appen automatisk oppdage når riktig tangent spilles — ikke la brukeren klikke "neste" manuelt.
4. **Feil recovery:** Vis tydelig hvis en tangent ikke ble riktig registrert — og la brukeren spille den om igjen.
5. **Ros underveis:** "Flott! Halvveis nå." — positiv forsterkning holder brukeren engasjert.
6. **Tidsestimat:** "Ca. 5 minutter igjen" — nordmenn foretrekker forutsigbarhet.

### Spesielle hensyn for PianoHelse-scanning
- Pianoet er ikke alltid i lydtett rom — bakgrunnsstøy-filter er kritisk
- Brukeren spiller kanskje ikke perfekt — appen skal tåle ufullkommen innspilling
- Bluetooth-headset kan forstyrre mikrofonvalg — instruer brukeren
- Mikrofonen må holdes i riktig avstand — animert illustrasjon hjelper

---

## 10. Helse-dashboard design-innsikt

### Hva som fungerer (basert på Withings Health, Apple Health, Oura Ring)

1. **En primær score:** Ikke overvelm med data. En enkelt score ("74/100 — Bra stand") gir umiddelbar forståelse.
2. **Farge + ord + tall:** Bruk alltid alle tre. Ikke bare grønt — si "God stemming" i tekst OG vis 87.
3. **Historikk som motivasjon:** "Sist: 68 — I dag: 74 — Forbedret!" gir historisk kontekst.
4. **Handlingsbar anbefaling:** Ikke bare "Trenger stemming" — si "Vi anbefaler stemming innen 2–3 måneder."
5. **Detaljer for de nysgjerrige:** Tuck bort teknisk data under "Vis detaljer" — ikke på forsiden.

---

## 11. Bookingflyt-UX Innsikt

### Beste praksis (Calendly, Airbnb, TaskRabbit)

1. **Vis tilgjengelighet visuelt:** Kalendervisning med fargekodede ledige/opptatte slots er alltid bedre enn en tekstliste.
2. **Bekreft umiddelbart:** Etter booking — vis en tydelig bekreftelsesside med all info. Send e-post + push-varsling.
3. **Reduser antall steg:** Booking bør ta maks 4 klikk fra "Jeg vil booke" til "Booking bekreftet".
4. **Vis prisoversikt:** Vis hva brukeren betaler, inkl. plattformgebyr, FØR bekreftelse.
5. **La begge parter bekrefté:** Airbnb-modellen der temmer "godkjenner" gir begge tillit.
6. **Enkle kanselleringsvilkår:** Norske forbrukere forventer rimelig kansellering. Vis dette tydelig.

---

## 12. Tilgjengelighets-krav (WCAG 2.1 AA)

### Kritiske krav for PianoHelse

| Kategori | Krav | Implementering |
|---|---|---|
| Kontrast | ≥ 4.5:1 for normal tekst | Alle farger i design system er testet |
| Kontrast | ≥ 3:1 for stor tekst (≥18pt) | Verifisert i design system |
| Navigasjon | Keyboard-accessible | Alle interaktive elementer i tab-rekkefølge |
| Skjermleser | ARIA-labels på ikoner og grafer | Spec i wireframes |
| Feil | Feilmeldinger er beskrivende | Mikrospråk i wireframes |
| Tidsbegrensning | Ingen tidsbegrensede oppgaver | Opptaksflyt er ikke tidsbegrenset |
| Bevegelse | Animasjoner kan skrus av | `prefers-reduced-motion` støttes |
| Tekststørrelse | 200% zoom uten horisontal scroll | Responsivt design |
| Farger | Aldri kun farge som informasjon | Alltid ikon + tekst + farge |

---

## 13. Typografi-anbefalinger (norsk kontekst)

### Valg og begrunnelse

**Primær skrift: Inter**
- Designet for skjermlesing, utmerket støtte for norske tegn (æ, ø, å)
- Svært god lesbarhet på lav oppløsning (eldre mobiler)
- Vekt-spekter fra Thin til ExtraBold — gir fleksibilitet
- Åpen kildekode — ingen kostnad

**Sekundær / Aksentskrift: Playfair Display**
- For overskrifter der vi ønsker klassisk "piano-estetikk"
- Brukt sparsomt — kun i markedsføringskontekst og splash-skjerm
- Gir referanse til tradisjonell musikknotasjon og partiturdesign

**Monospace (for data / frekvenser): JetBrains Mono**
- For talldisplay i helsegrafen (f.eks. Hz-verdier, cent-avvik)
- Gjør at tall ikke "hopper" ved oppdatering

### Norsk typografi-hensyn
- Norske ord er gjennomsnittlig 15–20% lengre enn engelske ekvivalenter
- Design for romslige layouter — unngå snøret tekst
- Orddeling (`hyphens: auto`) er akseptabelt i norsk (gjengs praksis)
- Aldri CAPS for lange norske ord — det er visuelt støyende med æøå i caps

---

*Dette dokumentet er levende og vil oppdateres etter brukertesting.*
