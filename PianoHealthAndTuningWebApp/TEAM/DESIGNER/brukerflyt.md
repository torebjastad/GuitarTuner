# PianoHelse — Brukerflyt-dokumentasjon
## Lead UX/UI Designer — Detaljert brukerreise

**Versjon:** 1.0
**Dato:** Mars 2026
**Språk:** Norsk (alle UI-strenger)

---

## Oversikt over brukerreiser

```
PIANOEIER-REISER                    TEMMER-REISER
═══════════════════════════════     ════════════════════════════
1. Første-gangs onboarding          A. Temmer-registrering
2. Piano-skanningsflyt              B. Profilkonfigurering
3. Helserospporthvisning            C. Bla gjennom oppdrag
4. Bookingflyt (finn temmer)        D. Akseptere oppdrag
5. Etter-booking-opplevelse         E. Fullføre oppdrag
6. Varselflyt (begge)               F. Temmer-inntektsoversikt
```

---

## 1. Pianoeier: Første-gangs onboarding

### Flyt-oversikt
```
App åpnet → Splash → Velg rolle → Registrering → Pianoinfo → Tillatelse → Hjem
```

### Detaljert trinnbeskrivelse

**Trinn 1.1: Splash-skjerm**
- Varighet: 2 sekunder
- Viser: Logo + app-navn + "Pianohelse" payoff
- Handling: Auto-navigerer til Trinn 1.2
- Logikk: Hvis brukeren allerede er logget inn → gå direkte til Hjem

**Trinn 1.2: Velg din rolle**
```
Skjerm: /velg-rolle
Innhold:
  - Overskrift: "Hvem er du?"
  - Kort 1: [Piano-ikon] "Jeg eier et piano" + "Sjekk helsetilstanden og finn en stemmer"
  - Kort 2: [Stemmegaffel-ikon] "Jeg er pianostemmer" + "Finn nye kunder og administrer oppdrag"
  - Bunntekst: "Allerede bruker? Logg inn"
Handling: Valg av kort lagres, navigerer til passende registreringsskjerm
```

**Trinn 1.3a: Pianoeier-registrering**
```
Felt 1: Fornavn (tekst, påkrevd)
Felt 2: Etternavn (tekst, påkrevd)
Felt 3: E-postadresse (e-post, påkrevd, validering)
Felt 4: Passord (passord, påkrevd, min 8 tegn)
Felt 5: [Avmerkingsboks] "Jeg godtar vilkår og personvern" (lenke til begge)

Knapp: "Opprett konto"
Alternativ: "Fortsett med Google" | "Fortsett med Apple"
Under: "Allerede bruker? Logg inn"

Validering (inline):
- E-post: Sjekk format ved blur
- Passord: Styrkemåler (svak / OK / sterk) mens bruker skriver
- Vilkår: Knapp er deaktivert til avmerket
```

**Trinn 1.4: Legg til pianoinfo (valgfritt, men sterkt oppfordret)**
```
Skjerm: /min-piano/legg-til
Overskrift: "Fortell oss om pianoet ditt"
Underskrift: "Dette hjelper oss å gi bedre diagnose og anbefalinger"

Felt 1: Pianotype
  [○] Flygelformet piano
  [○] Stuepiano (oppreist)
  [○] Digitalt piano
  [○] Vet ikke

Felt 2: Merke (tekst, valgfritt, eksempel: "Steinway, Yamaha, Kawai...")
Felt 3: Alder (valgfritt)
  Rullegardin: < 10 år / 10–25 år / 25–50 år / > 50 år / Vet ikke
Felt 4: Sist stemt (valgfritt)
  Rullegardin: < 6 måneder siden / 6–12 måneder / 1–2 år / > 2 år / Husker ikke

Knapp: "Lagre og fortsett"
Lenke under: "Hopp over — legg til senere"

Mikrotekst: "Vi bruker kun denne infoen for å forbedre analysen din."
```

**Trinn 1.5: Mikrofonillatelse**
```
Skjerm: /tillatelse/mikrofon

[Stor mikrofon-illustrasjon]

Overskrift: "PianoHelse trenger tilgang til mikrofonen"
Brødtekst: "For å analysere stemmingen til pianoet ditt, trenger appen å høre på det. Vi tar aldri opp lyd uten at du starter en analyse."

Knapp: "Gi tilgang til mikrofon"
Lenke under: "Hvorfor trenger dere dette?" → Ekspanderende forklaring

[Systemets tillatelsesdialog vises]

Ved AVSLAGET:
  → Vis forklaringsskjerm med instruksjoner for å aktivere manuelt i telefoninnstillinger
  → "Åpne innstillinger" → Deep link til app-innstillinger
  → "Prøv igjen"
```

**Trinn 1.6: Fullfort onboarding → Hjem**
```
Animasjon: Suksess-animasjon (✓ i sirkel, 600ms)
Tekst: "Velkommen til PianoHelse, [Fornavn]!"
Under: "Du er klar til å gjøre din første helsesjekk."
Knapp: "Start min første analyse" [primær, grønn]
Alternativ: "Utforsk appen" [sekundær]

Mikrotekst: "Du kan alltid gjøre en analyse senere fra hjemskjermen."
```

---

## 2. Piano-skanningsflyt (Kjerneflyt)

### Flyt-oversikt
```
Start → Forberedelse → Veiledning → Innspilling (tangent for tangent) → Analyse → Rapport
```

### Kontekst
Brukeren er på hjemskjermen og trykker "Start analyse" (FAB eller stor knapp).

**Trinn 2.1: Forberedelsessjekk**
```
Skjerm: /analyse/forbered

Overskrift: "Gjør deg klar til analysen"
Undertittel: "Ca. 5–8 minutter"

Sjekkliste (visuell, ikke interaktiv — kun informativ):
  ✓ Pianoet er stemt / ikke nettopp stemt (begge OK)
  ✓ Du er i et noenlunde stille rom
  ✓ Telefonen er 20–50 cm fra pianoet
  ✓ Ingen bluetooth-headset er koblet til
  ✓ Volumet på pianoet er normalt (ikke dempet)

[Illustrasjon: Telefon plassert på toppen av piano, avstandsindikator]

Knapper:
  [Start analyse]  ← Primær
  [Mer info om forberedelse]  ← Tekstlenke → Modal med utvidet instruksjon
```

**Trinn 2.2: Tangentvalg-guide**
```
Skjerm: /analyse/guide

Overskrift: "Vi tar lydprøver av tangentene dine"
Brødtekst: "Spill hver tangent én gang, rolig og jevnt, når appen ber deg om det. Hold tangenten nede i ca. 2 sekunder."

[Animert piano-illustrasjon: tangenter lyser opp fra venstre til høyre]

"Vi sjekker:"
  ● Alle 88 tangenter (fullstendig analyse)  — anbefalt
  ○ Kun de 52 hvite tangentene (raskere, 4–5 min)
  ○ Kun de 7 oktavene C (rask sjekk, 1–2 min)

Knapper:
  [Velg fullstendig analyse]  ← Primær (anbefalt-badge)
  [Tilpass valg]  ← Ekspanderer med detaljer

Under: "Hva brukes opptakene til?" → [Ekspanderende tekst]
  "Opptakene analyseres lokalt på enheten din. Vi sender kun de beregnede pitch-dataene til serveren, ikke selve lydfilen. Se personvernpolicy."
```

**Trinn 2.3: Aktiv innspilling**
```
Skjerm: /analyse/opptak

═══════════════════════════════════════════
TOPPLINJE: [X Avbryt]    Tangent 23 av 52
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FREMGANGSINDIKATOR: ████████████░░░░░ 44%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SENTRALT ELEMENT:
  [Stor pulserendé mikrofon-animasjon, 160px]

STATUS-TEKST (stor, 22px):
  "Spill nå: D3"

UNDERSTØTTENDE INFO:
  "Hold tangenten nede i 2 sekunder"

MINI-PIANO (visuell):
  Viser alle tangenter. Gjennomfort: grønn. Aktiv: pulserer blå. Kommende: grå.
  [|||||||||||||||||||||||||||||||||||||||||]
  (Scrollbar under for piano-oversikt)

LYDDETEKTOR:
  Lydnivå-bar: ░░░░░░░░░░░▓▓▓▓▓▓▓░░░░░░░ (viser lydnivå)
  Status: "Mikrofon aktiv"

TILBAKEMELDING PÅ DETEKTERT NOTE:
  Riktig note detektert:
    → Kort visuell flash (grønn ring rundt mikrofon-animasjon)
    → Haptic feedback (vibrasjon, 50ms)
    → Automatisk neste tangent etter 0.5s

  Feil note detektert:
    → Gul ring
    → Tekst: "Prøv igjen — det høres ut som E3, ikke D3"
    → Ingen automatisk fremgang

  For mye støy:
    → Oransje ring
    → Tekst: "For mye bakgrunnsstøy — prøv å dempe lyden i rommet"

PAUSE-KNAPP (bottom center):
  [⏸ Sett på pause]
  Pauset: Viser "Pust ut! Trykk for å fortsette." + [▶ Fortsett]
```

**Trinn 2.4: Mellomstatus (halvveis)**
```
Vises automatisk etter 50% fullfort

Skjerm: /analyse/midtpause

Overskrift: "Halvveis! Flott jobbet 🎹"
Brødtekst: "26 tangenter igjen. Holder det bra til nå."

[Mini forhåndsvisning av tuningkurven — kun venstre halvdel tegnet inn, med "..." på høyre]
Undertekst under grafen: "Den fulle kurven vises når vi er ferdig"

Fremgangsstatus: "Ca. 3 minutter igjen"

Knapper:
  [Fortsett]  ← Primær
  [Se delresultat]  ← Tekstlenke (åpner modal med hittil analysert data)
```

**Trinn 2.5: Fullfort innspilling → Analyse**
```
Skjerm: /analyse/analyserer

Overskrift: "Analyserer pianoet ditt..."

[Animert tuningkurve som tegner seg opp — langsom reveal]

Fremgangsbar: Animert, 0% → 100% over ca. 5–10 sekunder (pitch-beregning)

Status-tekst (endres underveis):
  "Beregner tonehøyder..."
  "Sammenligner med referansestandard..."
  "Beregner helsescore..."
  "Lager din helseosrapport..."

Mikrotekst: "Analysen skjer direkte på enheten din."
```

---

## 3. Helseosrapportvisning

### Flyt-oversikt
```
Analyse ferdig → Første-gangs rapport → Lesing av rapport → Anbefaling → (Valgfri booking)
```

**Trinn 3.1: Rapport-avsløringsanimasjon**
```
Sekvensiell reveal (800ms total):
  1. Score-ringen animerer opp til verdien (0 → 74)
  2. Status-tekst fades inn
  3. Kort-innhold slides opp
  4. CTA-knapper fades inn

Ingen skip-mulighet — reveal er kort nok (< 1 sek)
```

**Trinn 3.2: Rapport-oversikt (topp)**
```
Skjerm: /rapport/[id]

TOPPSEKSJON:
  ┌─────────────────────────────────────────────┐
  │         [Score-ring: 74 / 100]              │
  │                                             │
  │         God stemming                        │
  │         Analysert: 15. mars 2026            │
  │                                             │
  │  "Pianoet ditt er i god stand. Vi           │
  │   anbefaler stemming om 6–12 måneder."      │
  └─────────────────────────────────────────────┘

STATUS-FORKLARING (korttekst):
  Grønn (70–100): "God stemming — instrumentet spiller godt innenfor akseptabelt avvik."
  Amber (40–69):  "Bør stemmes — merkbar avvik, anbefaler stemming innen 3 måneder."
  Rød (0–39):     "Trenger stemming — betydelig avvik. Anbefaler stemming snart."
```

**Trinn 3.3: Tuningkurve-seksjon**
```
SEKSJON: "Tuningkurven din"
Undertekst: "Viser avviket fra riktig tonehøyde for hver tangent."

[SVG TUNINGKURVE — INTERAKTIV]
  Y-akse: -50 cent til +50 cent (merkelapper: -50, -25, 0, +25, +50)
  X-akse: C1 til C8 (tangent-navn, vises sparsomt for plass)
  Nulllinje: Stiplet grå (#D1D5DB)
  Kurvefarge: Dynamisk
    - Grønn segment: ±10 cent (god zone)
    - Amber segment: ±10–25 cent
    - Rød segment: > ±25 cent

  Interaktivitet (touch):
    Trykk på punkt → Tooltip: "A4: +8 cent (440,8 Hz)"
    Pinch-to-zoom aktivert

  Legende:
    [●] God (±10 cent)   [●] Noe avvik (±10–25)   [●] Stort avvik (>±25)

STATISTIKK UNDER GRAFEN:
  Gj.snitt avvik:  +3.2 cent
  Verste tangent:  C6 (+22 cent)
  Beste tangent:   A4 (+0.3 cent)
  Tangenter i grønn sone: 78 av 88 (89%)
```

**Trinn 3.4: Detal-seksjon (sammenfoldbar)**
```
[v] Se tangentliste
  Tabell: Tangent | Frekvens (Hz) | Avvik (cent) | Status
  Sortérbar etter: Navn / Avvik / Status
  Filtrerbar: Vis kun utenfor god sone

[v] Historikk (hvis tidligere analyser finnes)
  Minikort for hver tidligere analyse med dato og score
  Trendpil: ↑ Forbedret / ↓ Forverret / → Stabil

[v] Om analysen
  Forklaring av algoritmen (kort, ikke-teknisk)
  Mikrofon og opptaksstatus
```

**Trinn 3.5: Anbefalings-seksjon og CTA**
```
ANBEFALINGS-KORT:
  Score 70–100 (God):
    ┌─────────────────────────────────────────┐
    │  ✓  Ingen umiddelbar handling nødvendig │
    │                                         │
    │  Vi anbefaler en ny sjekk om 6 måneder. │
    │                                         │
    │  [Sett påminnelse]  [Book allikevel]    │
    └─────────────────────────────────────────┘

  Score 40–69 (Advarsel):
    ┌─────────────────────────────────────────┐
    │  ⚠  Stemming anbefales                  │
    │                                         │
    │  Pianoet ditt vil lyde merkbart bedre   │
    │  etter en profesjonell stemming.        │
    │                                         │
    │  [Finn en stemmer nær deg]              │
    └─────────────────────────────────────────┘

  Score 0–39 (Kritisk):
    ┌─────────────────────────────────────────┐
    │  ⚠  Stemming nødvendig                  │
    │                                         │
    │  Avviket er betydelig og kan påvirke    │
    │  spillopplevelsen og instrumentets helse│
    │  på sikt.                               │
    │                                         │
    │  [Book stemmer nå]                      │
    └─────────────────────────────────────────┘

DELINGSALTERNATIVER:
  [Del rapport]  →  Bunndialog: "Del med" (temmer, e-post, kopi av lenke)
```

---

## 4. Bookingflyt: Finn og book en temmer

### Flyt-oversikt
```
Finn temmer → Temmer-liste → Profil → Velg dato → Bekreft → Betaling → Bekreftet
```

**Trinn 4.1: Temmer-søk**
```
Skjerm: /finn-temmer

Overskrift: "Finn en stemmer nær deg"
Undertekst: "Basert på din plassering: Trondheim"

SØKE- OG FILTER-BAR:
  [Søk etter navn eller sted...     🔍]
  [Filtre ▼]  →  Bunndialog:
    Maks avstand: [Slider: 5 km ↔ 50 km]
    Min vurdering: [⭐⭐⭐⭐☆ og over]
    Tilgjengelighet: [Denne uken / Neste uke / Velg dato]
    Pris: [Slider: kr 500 ↔ kr 2000]
    Spesialisering: [Flygler] [Stuepiano] [Antikk/Vintage]
    [Bruk filtre]

SORTERING: "Sortér: Nærmest | Beste vurdering | Pris"

TEMMER-LISTE:
  [Se kart]  ←→  [Se liste]  (toggle)
```

**Trinn 4.2: Temmer-profil**
```
Skjerm: /temmer/[id]

HEADER:
  [Profilfoto 80px]  Lars Mikkelsen
                     ★★★★☆ 4.8 · 23 vurderinger
                     Bergen  ·  3,2 km fra deg

RASK INFO:
  Erfaring: 25 år   Sertifisering: PTG-sertifisert
  Svarer vanligvis: Innen 2 timer
  Har stemt: 847 instrumenter

PRIS:
  Stemming, stuepiano:  fra kr 950,-
  Stemming, flygelformet:  fra kr 1 200,-
  Stemming + vedlikehold:  fra kr 1 500,-
  [i] Priser er inkl. plattformgebyr på 12%

OM LARS:
  "Jeg har vært pianostemmer i Bergen siden 1998. Spesialisert på..."
  [Les mer]

SPESIALISERINGER: [Flygler] [Vintage] [Steinway-sertifisert]

ANMELDELSER (3 siste vises):
  ★★★★★  "Lars er utrolig dyktig og grundig..." — Kari L., feb 2026
  ★★★★☆  "Svært fornøyd, men litt sen..." — Per A., jan 2026
  [Se alle 23 anmeldelser]

TILGJENGELIGHET (ukeskalender forhåndsvisning):
  Man  Tir  Ons  Tor  Fre
  Ledig Ledig  ●  Ledig Ledig
  (●=opptatt, grønn=ledig)

CTA:
  [Book Lars Mikkelsen]  ← Primær, grønn
  [Send melding]  ← Sekundær
```

**Trinn 4.3: Velg dato og tid**
```
Skjerm: /book/[temmer-id]/dato

Overskrift: "Velg tidspunkt"

KALENDER (månedvisning):
  Grønn dato = Tilgjengelig
  Grå dato = Opptatt
  Rød dato = Ikke tilgjengelig

  Mars 2026
  M   T   O   T   F   L   S
  ─────────────────────────────
  16  17  18  19  20  21  22
  ○   ●   ●   ○   ○   ○   ─
  23  24  25  26  27  28  29
  ○   ○   ●   ○   ○   ○   ─
  (○ = ledig, ● = opptatt, ─ = helg/ikke tilgjengelig)

Valgt dato → Vis ledige tider:
  "Ledige tider 20. mars:"
  [09:00]  [11:00]  [14:00]  [16:30]
  Tidsbrikker: Klikk for å velge

Viktig informasjon:
  "Temme​ren bekrefter bestillingen innen 2 timer.
   Du debiteres ikke før bestillingen er bekreftet."

Knapper:
  [Neste: Bekreft bestilling]  ← Primær
  [← Velg annen temmer]  ← Sekundær
```

**Trinn 4.4: Booking-bekreftelse**
```
Skjerm: /book/[id]/bekreft

Overskrift: "Bekreft bestillingen"

SAMMENDRAG-KORT:
  ┌──────────────────────────────────────────┐
  │  [Foto] Lars Mikkelsen                   │
  │  Dato: Fredag 20. mars 2026, kl. 14:00  │
  │  Type: Stemming — stuepiano              │
  │  Din adresse: Munkegt. 14, Trondheim     │
  │                                          │
  │  VEDLAGT:                                │
  │  ✓ Din helseosrapport (74/100 — God)     │
  │  ✓ Lydopptak (anonymisert)               │
  └──────────────────────────────────────────┘

PRISSAMMENDRAG:
  Stemming stuepiano:        kr 950,-
  Plattformgebyr (12%):       kr 114,-
  ────────────────────────────────────
  Totalt:                  kr 1 064,-

  [i] Plattformgebyret dekker betalingssikkerhet
      og kundesupport. Lesmer

BETALINGSMETODE:
  [○] Vipps  [○] Kort  [○] Faktura (30 dager)
  [Legg til / endre betalingsmetode]

BETINGELSER:
  [✓] Jeg godtar avbestillingsvilkårene
  "Gratis avbestilling frem til 24 timer før."
  [Les vilkår]

Knapper:
  [Bekreft og betal]  ← Primær, grønn
  [← Tilbake]  ← Sekundær
```

**Trinn 4.5: Bekreftelse**
```
Skjerm: /booking/[id]/bekreftet

[Suksess-animasjon: ✓ i grønn sirkel, konfetti-partikler (om ikke reduced-motion)]

Overskrift: "Forespørsel sendt!"
Brødtekst: "Lars Mikkelsen bekrefter vanligvis innen 2 timer."

BOOKINGS-DETALJER:
  Fredag 20. mars 2026, kl. 14:00
  Lars Mikkelsen — Bergen
  Referansenummer: PH-20260320-4421

NESTE STEG:
  1. ✓ Du mottar SMS og e-post med bekreftelse
  2. ⏳ Lars bekrefter tidspunktet (innen 2 timer)
  3. 📅 Kalenderinvitasjon sendes etter bekreftelse
  4. ✓ Lars ankommer avtalt tid

Knapper:
  [Legg til i kalender]  ← Primær
  [Gå til mine bookinger]  ← Sekundær
  [Tilbake til hjem]  ← Tekstlenke
```

---

## 5. Varselflyt (Begge brukergrupper)

### 5.1 Varsel-typer for pianoeier

| Hendelse | Kanal | Innhold |
|---|---|---|
| Booking mottatt av temmer | Push + SMS | "Lars Mikkelsen har mottatt din forespørsel" |
| Booking bekreftet | Push + SMS + E-post | "Bekreftet! Lars stiller opp fredag 20. mars kl. 14:00" |
| Temmer på vei | Push | "Lars Mikkelsen er på vei — ETA 15 minutter" |
| Jobb fullfort | Push + E-post | "Jobben er fullfort. Se din oppdaterte helseosrapport" |
| Påminnelse: Sjekk piano | Push | "Det er nå 6 måneder siden siste stemming — tid for en ny sjekk?" |
| Ny melding fra temmer | Push | "Lars Mikkelsen: Jeg er litt forsinket..." |

### 5.2 Varsel-typer for temmer

| Hendelse | Kanal | Innhold |
|---|---|---|
| Nytt oppdrag i område | Push | "Nytt oppdrag: Stuepiano, Trondheim sentrum — kr 950,-" |
| Oppdragsforespørsel (direkte) | Push + SMS | "Astrid Berntsen ønsker å booke deg — 20. mars kl. 14:00" |
| Oppdrag bekreftet | Push | "Booking bekreftet med Astrid Berntsen" |
| Betaling mottatt | Push | "Betaling på kr 950,- er mottatt og satt på vent" |
| Påminnelse: Oppdrag i morgen | Push | "Husk: Astrid Berntsen, i morgen kl. 14:00, Munkegt. 14" |
| Betaling utbetalt | Push | "kr 950,- er overfort til din konto" |

---

## 6. Temmer: Registrering og profil-oppsett

**Trinn 6.1: Temmer-registrering**
```
Skjerm: /temmer/registrer

STEG 1/4: Grunninfo
  Fornavn, etternavn, e-post, passord
  Mobilnummer (påkrevd for SMS-varsler)
  Knapp: "Neste"

STEG 2/4: Fagkompetanse
  Overskrift: "Fortell om din kompetanse"
  Felt: År med erfaring (rullegardin: 1–5 / 5–10 / 10–20 / 20+)
  Sertifiseringer: [✓] PTG  [✓] RCT  [✓] Annet: ___
  Spesialiseringer:
    [✓] Flygler
    [✓] Stuepiano / Upright
    [✓] Antikk og vintage
    [✓] Elektrisk/hybrid piano
  Felt: Kort om deg (tekst, maks 300 tegn)
  Knapp: "Neste"

STEG 3/4: Tjenesteområde og prissetting
  Overskrift: "Ditt tjenesteområde"
  Felt: Bostedsadresse (for avstandsberegning, ikke vist offentlig)
  Felt: Maksimal kjøreavstand (slider: 10–100 km)

  PRISSETTING:
  Tjeneste: Stemming — stuepiano
    Pris: [kr ______]  (eksempel: kr 950,-)
  Tjeneste: Stemming — flygelformet
    Pris: [kr ______]
  Tjeneste: Stemming + generelt vedlikehold
    Pris: [kr ______]
  [+ Legg til tjeneste]

  Mikrotekst: "PianoHelse tar 12% provisjon av prisen. Du mottar resten."
  Knapp: "Neste"

STEG 4/4: Profil og verifisering
  Last opp profilbilde: [Kamera-ikon / Velg fra galleri]
  (Foto er påkrevd — øker bookingsrate med 3x)

  Identitetsverifisering: "For å bygge tillit, bekrefter vi identiteten din."
  [✓] Jeg er villig til å dele fødselsnummer for ID-sjekk
  Alternativ: Organiasjonsnummer (for firma-temme​re)

  Betalingsinformasjon:
  Kontonummer for utbetaling: [________]

  [✓] Jeg godtar temmer-vilkår og bruksbetingelser

  Knapp: "Send søknad"

  Etter innsending:
  "Søknaden din er mottatt! Vi verifiserer identiteten din innen 1–2 virkedager.
   Du mottar e-post når profilen er godkjent."
```

**Trinn 6.2: Temmer-hjemskjerm (Oppdragsfeed)**
```
Skjerm: /temmer/hjem

TOPPSEKSJON:
  God morgen, Lars!
  [3 nye oppdrag i ditt område]

STATISTIKK-BAR:
  Denne uken: 4 oppdrag | kr 3 800,- | ★ 4.9

OPPDRAG-LISTE:
  ┌──────────────────────────────────────────────┐
  │  [NYTT]                                      │
  │  Stuepiano — Trondheim sentrum               │
  │  Avstand: 3,2 km                             │
  │  Pris: kr 950,-  (din andel: kr 836,-)       │
  │  Forespurt: I dag, fortrinnsvis fredag       │
  │  ──────────────────────────────────────      │
  │  Helseosrapport vedlagt: 58/100 [Advarsel]   │
  │  [▶ Hør opptak (32 sek)]  [Se tuningkurve]  │
  │                                              │
  │  [Akseptér oppdrag]  [Avslå]                │
  └──────────────────────────────────────────────┘

Hvert oppdragskort viser:
  - Type og sted
  - Avstand
  - Pris og Larss andel
  - Forespurt tidspunkt
  - Helsescore og lenke til rapport
  - Lydavspillingsknapp (30-sek forhåndsvisning)
  - Akseptér / Avslå knapper

Filtrering øverst:
  [Alle] [Nær meg] [I dag] [Denne uken]
```

**Trinn 6.3: Akseptering av oppdrag**
```
Temmer klikker [Akseptér oppdrag]

Modal vises:
  "Bekreft akseptering"

  Oppdragsinfo:
  Astrid Berntsen — Munkegt. 14, Trondheim
  Fredag 20. mars 2026, kl. 14:00
  Stuepiano (Yamaha, ca. 15 år gammel)

  Vedlagt diagnostikk:
  Score: 74/100 — God stemming
  Verste avvik: C6 (+22 cent)
  Forventet arbeidstid: 60–90 minutter

  Din betaling: kr 836,- (etter 12% gebyr)

  [Bekreft]  [Avbryt]

  Etter bekreftelse:
  → Astrid får push-varsel
  → Lars ser oppdrag i "Mine oppdrag"
  → Kalenderinvitasjon sendes begge parter
```

---

## 7. Fullføring av oppdrag

**Trinn 7.1: Dag-for-dag-flyt (temmer)**
```
Dagen før: Push-varsel "Husk: Astrid Berntsen i morgen kl. 14:00"
  → Trykk for å åpne oppdragsdetal

Ankommer: Trykk [Jeg er fremme] i appen
  → Astrid får push: "Lars Mikkelsen er på stedet"

Under stemming: Lars kan notere observasjoner:
  Notater: [Tekstfelt, valgfritt]
  Eks: "Pedal mekanisme trenger service"

Fullfort: Trykk [Marker som fullfort]
  → System: "Bra! Betalingen din på kr 836,- settes i behandling."
  → Astrid får push: "Stemmingen er fullfort! Lars har etterlatt en rapport."

Temmer kan legge til:
  "Notat til kunden" — kort tekstmelding til Astrid
  "Anbefalt neste stemming" — rullegardin: 6 mnd / 1 år / 18 mnd / 2 år
```

**Trinn 7.2: Etter-oppdrag (pianoeier)**
```
Astrid mottar push: "Jobben er fullfort"

Vurderingsskjerm:
  Overskrift: "Hvordan gikk det med Lars?"

  Stjernevurdering (1–5):
  [☆][☆][☆][☆][☆]

  (Etter valg av antall stjerner — valgfri kommentar)
  Kommentar: [Skriv en kommentar... (valgfritt)]

  [Send vurdering]  ←  Primær
  [Hopp over]  ← Tekstlenke

  Etter innsending:
  → Ny helseosrapport er tilgjengelig
  → "Vil du sette opp neste stemming om [anbefalt periode]?"
  → [Ja, sett opp påminnelse]  [Nei takk]
```

---

## 8. Navigasjonsarkitektur

### Pianoeier-app (Mobilbunnbar)

```
  ┌─────────────────────────────────────────────────┐
  │  🏠 Hjem    📊 Historikk    ⊕ Analyser    👤 Profil │
  └─────────────────────────────────────────────────┘

  Hjem:
    - Siste helseosrapport (sammendrag)
    - Hurtigknapp: "Ny analyse"
    - Mine bookinger (aktive)
    - Varsler

  Historikk:
    - Alle tidligere analyser (kronologisk)
    - Trendvisning (score over tid)
    - Alle bookinger

  Analyser (FAB):
    - Starter direkte skanningsflyt
    - (Ingen egen tab-side — er en handling)

  Profil:
    - Pianoinformasjon
    - Kontoinnstillinger
    - Varselpreferanser
    - Betalingsmetoder
    - Hjelp og støtte
    - Logg ut
```

### Temmer-portal (Desktop-sidemeny)

```
  ┌──────────────────┬─────────────────────────────────┐
  │  PIANOHELSE      │                                 │
  │  [Logo]          │                                 │
  │                  │  HOVED-INNHOLDSOMRADET         │
  │  📋 Mine oppdrag │                                 │
  │  🔍 Finn oppdrag │                                 │
  │  📅 Kalender     │                                 │
  │  💰 Inntekter    │                                 │
  │  ⭐ Anmeldelser  │                                 │
  │  👤 Min profil   │                                 │
  │  ⚙️ Innstillinger │                                 │
  │                  │                                 │
  │  [Logg ut]       │                                 │
  └──────────────────┴─────────────────────────────────┘
```

---

*Alle brukerflyter er basert på UX-forskning fra ux-research.md og skal valideres med brukertesting.*
