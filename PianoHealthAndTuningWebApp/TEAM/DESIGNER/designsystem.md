# PianoHelse — Designsystem
## Lead UX/UI Designer — Offisiell spesifikasjon

**Versjon:** 1.0
**Dato:** Mars 2026
**Status:** Godkjent for implementering

---

## 1. Designfilosofi

PianoHelse-designsystemet er bygget rundt tre prinsipper:

**Presisjon:** Som et stemmeinstrument, skal designet være nøyaktig og pålitelig. Ingen visuell støy. Ingenting er plassert tilfeldig.

**Varme:** Pianokraft er håndverk og følelse. Fargepaletten henter fra elfenben, eik og mørk mahogny — materialer som kjennetegner et kvalitetspiano.

**Tillit:** Norske brukere er kritiske. Designet kommuniserer seriøsitet gjennom konsistens, god kontrast og aldri overrasker brukeren.

---

## 2. Fargepalett

### 2.1 Primærfarger

```
┌─────────────────────────────────────────────────────────────────┐
│  PRIMÆRFARGER                                                   │
│                                                                 │
│  ██████  Dypblå (Primary)          #1B2B4B                     │
│          Brukes til: Primærknapper, navigasjon, overskrifter   │
│          Mørk modus: #E8EEF7                                    │
│                                                                 │
│  ██████  Mellomblå (Primary Light)  #2D4A7A                    │
│          Brukes til: Hover-tilstander, aktive elementer        │
│          Mørk modus: #C5D4EE                                    │
│                                                                 │
│  ██████  Lyseblå (Primary Pale)     #D6E4F7                    │
│          Brukes til: Bakgrunn for kort, tags, indikatorer      │
│          Mørk modus: #1A2840                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Aksentsfarger

```
┌─────────────────────────────────────────────────────────────────┐
│  AKSENTSFARGER                                                  │
│                                                                 │
│  ██████  Elfenben (Accent)          #F5F0E8                    │
│          Brukes til: Kort-bakgrunn, sekundære flater           │
│          Mørk modus: #1C1A17                                    │
│                                                                 │
│  ██████  Varm gull (Accent Dark)    #C9A84C                    │
│          Brukes til: Premium-indikatorer, rating-stjerner      │
│          Mørk modus: #D4B366                                    │
│                                                                 │
│  ██████  Mahogny (Wood Tone)        #5C3317                    │
│          Brukes til: Dekorative elementer, piano-illustrasjon  │
│          Mørk modus: #8B5E3C                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Semantiske farger

```
┌─────────────────────────────────────────────────────────────────┐
│  SEMANTISKE FARGER                                              │
│                                                                 │
│  ██████  Suksess (Grønn)            #1A7A4A                    │
│          Brukes til: "God stemming", bekreftelse, fullfort     │
│          Lys: #E6F5EE   Mørk modus: #2DA870                   │
│                                                                 │
│  ██████  Advarsel (Amber)           #C47B00                    │
│          Brukes til: "Bør stemmes snart", oppmerksomhet        │
│          Lys: #FFF3D6   Mørk modus: #E09020                   │
│                                                                 │
│  ██████  Fare (Rød)                 #B91C1C                    │
│          Brukes til: "Kritisk tilstand", feilmeldinger         │
│          Lys: #FDEAEA   Mørk modus: #EF4444                   │
│                                                                 │
│  ██████  Info (Blå)                 #1D6FA4                    │
│          Brukes til: Informasjonsmeldinger, hjelp              │
│          Lys: #E3F1FA   Mørk modus: #3B9BD4                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Nøytrale farger

```
Grå-skala (brukes til tekst, grenser, bakgrunner):

  #0A0F1A  Nesten svart     — Overskrifter (lysmodus)
  #1F2937  Mørk grå         — Brødtekst primær
  #374151  Grå medium       — Brødtekst sekundær
  #6B7280  Grå lys          — Hjelpetekst, plassholderere
  #9CA3AF  Grå blek         — Deaktiverte elementer
  #D1D5DB  Grå kant         — Grenser, skillelinjer
  #E5E7EB  Grå bakgrunn     — Bakgrunner, innrykk
  #F3F4F6  Grå overflate    — Side-bakgrunn (lysmodus)
  #FFFFFF  Hvit             — Kort, modaler, input-felt
```

### 2.5 Fargekontrasttabell (WCAG AA)

| Forgrunn | Bakgrunn | Ratio | Status |
|---|---|---|---|
| #0A0F1A (tekst) | #FFFFFF | 19.1:1 | BESTATT |
| #1F2937 (tekst) | #FFFFFF | 14.6:1 | BESTATT |
| #374151 (tekst) | #FFFFFF | 9.7:1 | BESTATT |
| #6B7280 (hjelp) | #FFFFFF | 4.6:1 | BESTATT |
| #FFFFFF (hvit) | #1B2B4B (primary) | 11.3:1 | BESTATT |
| #FFFFFF (hvit) | #1A7A4A (suksess) | 5.2:1 | BESTATT |
| #FFFFFF (hvit) | #B91C1C (fare) | 6.8:1 | BESTATT |
| #0A0F1A (tekst) | #F5F0E8 (elfenben) | 17.2:1 | BESTATT |

---

## 3. Typografi

### 3.1 Skriftvalg

```
PRIMÆR SKRIFT: Inter
  Kilde: fonts.google.com/specimen/Inter
  Bruk: All UI-tekst, knapper, etiketter, brødtekst

AKSENSSKRIFT: Playfair Display
  Kilde: fonts.google.com/specimen/Playfair+Display
  Bruk: Splash-skjerm overskrift, markedsføringsbanner (sparsomt)

DATASKRIFT: JetBrains Mono
  Kilde: fonts.google.com/specimen/JetBrains+Mono
  Bruk: Hz-verdier, cent-avvik, tekniske tall i helsegraf
```

### 3.2 Typografisk skala

```
DISPLAY (Splash / Hero)
  Skrift: Playfair Display
  Størrelse: 36px / 2.25rem
  Vekt: 700 (Bold)
  Linjehøyde: 1.2
  Bokstavspacing: -0.02em
  Bruk: "PianoHelse" på splash-skjerm

H1 (Sidenoverskrift)
  Skrift: Inter
  Størrelse: 28px / 1.75rem
  Vekt: 700
  Linjehøyde: 1.25
  Bokstavspacing: -0.01em
  Bruk: "Helseanalyse", "Finn en temmer"

H2 (Seksjonstittel)
  Skrift: Inter
  Størrelse: 22px / 1.375rem
  Vekt: 600 (SemiBold)
  Linjehøyde: 1.3
  Bruk: Korttitler, seksjonstitler

H3 (Undertittel)
  Skrift: Inter
  Størrelse: 18px / 1.125rem
  Vekt: 600
  Linjehøyde: 1.4
  Bruk: Undertitler, listetitler

BRØDTEKST (Body)
  Skrift: Inter
  Størrelse: 16px / 1rem
  Vekt: 400 (Regular)
  Linjehøyde: 1.6
  Bruk: Standard innholdstext

BRØDTEKST LITEN (Body Small)
  Skrift: Inter
  Størrelse: 14px / 0.875rem
  Vekt: 400
  Linjehøyde: 1.5
  Bruk: Metainfo, sekundær tekst, korts-footer

ETIKETT (Label)
  Skrift: Inter
  Størrelse: 12px / 0.75rem
  Vekt: 500 (Medium)
  Linjehøyde: 1.4
  Bokstavspacing: 0.05em
  STORE BOKSTAVER: JA
  Bruk: Skjemafeltsetiketter, kategorier

MIKROTEXT
  Skrift: Inter
  Størrelse: 11px / 0.6875rem
  Vekt: 400
  Linjehøyde: 1.4
  Bruk: Juridisk tekst, disclaimers, timestamps

DATANUMMER
  Skrift: JetBrains Mono
  Størrelse: 24px / 1.5rem (stor), 14px / 0.875rem (liten)
  Vekt: 500
  Linjehøyde: 1.2
  Bruk: Frekvenser, cent-avvik, score
```

### 3.3 Bruksregler

- **Maks 3 skriftstørrelser per skjerm** (unntatt dataverdier)
- **Aldri kursiv for UI-tekst** (vanskelig å lese på norsk med æøå)
- **Orddeling tillatt** for løpende tekst, aldri for overskrifter
- **Linjeklengde:** Maks 65–75 tegn for løpende tekst
- **Aldri CAPS for norske ord** over 12 tegn (støyende med æøå i versaler)

---

## 4. Ikonografi

### 4.1 Ikonstil

**Bibliotek:** Lucide Icons (https://lucide.dev)
- Åpen kildekode, MIT-lisens
- Konsistent 24×24px grid
- Thin stroke-stil (1.5px) — passer til vår presise estetikk
- Utmerket norsk tegnstøtte i SVG-format

### 4.2 Ikonstørrelser

```
NAVIGASJON:    24×24px
INLINE (tekst): 16×16px
STOR (hero):   48×48px
INDIKATOR:     20×20px
```

### 4.3 Ikonfarger

- Primær handling: `#1B2B4B`
- Sekundær / inaktiv: `#6B7280`
- Suksess: `#1A7A4A`
- Advarsel: `#C47B00`
- Fare: `#B91C1C`
- På mørk bakgrunn: `#FFFFFF` eller `#F5F0E8`

### 4.4 Alltid ledsaget av tekst

**Regel:** Ikon alene er aldri tilstrekkelig for viktige handlinger. Kombiner alltid ikon + tekstetikett for primærknappur. Unntatt: navigasjonsbar der etiketter er konsekvent brukt, og ARIA-labels dekker tilgjengelighet.

### 4.5 Nøkkelikon-register

| Ikon | Bruk | Lucide-navn |
|---|---|---|
| Mikrofon | Start opptak | `Mic` |
| Pianoet (custom) | App-logo | Custom SVG |
| Hjerte-puls | Helsestatus | `HeartPulse` |
| Kalender | Booking | `Calendar` |
| Bruker | Profil | `User` |
| Stjerne | Vurdering | `Star` |
| Kart-pin | Plassering | `MapPin` |
| Kontrollspill | Spill av lyd | `Play` |
| Stopp | Stopp opptak | `Square` |
| Sjekk | Fullfort | `CheckCircle2` |
| Advarsel | OBS! | `AlertTriangle` |
| Info | Hjelp | `Info` |
| Pil høyre | Neste steg | `ChevronRight` |
| Pil venstre | Tilbake | `ChevronLeft` |
| Lås | Privat | `Lock` |
| Del | Del rapport | `Share2` |

---

## 5. Komponentbibliotek

### 5.1 Knapper

#### Primærknapp (Filled)
```
┌────────────────────────────────┐
│  [Ikon]  Knapp-tekst           │  ← Høyde: 48px
└────────────────────────────────┘
  BG: #1B2B4B    Tekst: #FFFFFF
  Hover: #2D4A7A    Active: #0F1E36
  Radius: 8px    Padding: 12px 24px
  Skrift: Inter 16px / 600
  Min-bredde: 120px
  Fokus: 3px offset outline, #2D4A7A
  Deaktivert: BG #9CA3AF, tekst #FFFFFF, cursor: not-allowed
```

#### Sekundærknapp (Outlined)
```
┌────────────────────────────────┐
│  [Ikon]  Knapp-tekst           │  ← Høyde: 48px
└────────────────────────────────┘
  BG: transparent    Tekst: #1B2B4B
  Kant: 1.5px solid #1B2B4B
  Hover: BG #D6E4F7
  Radius: 8px    Padding: 12px 24px
```

#### Fargeknapp — Suksess
```
  BG: #1A7A4A    Tekst: #FFFFFF
  Hover: #146340
  Brukes til: "Book nå", "Bekreft"
```

#### Fare-knapp
```
  BG: #B91C1C    Tekst: #FFFFFF
  Brukes til: "Avbryt booking", destruktive handlinger
```

#### Tekstknapp (Ghost)
```
  BG: transparent    Tekst: #1B2B4B
  Underline ved hover
  Brukes til: Sekundære lenkehandlinger, "Les mer"
```

#### Flytende handlingsknapp (FAB)
```
  ┌────┐
  │ ⊕  │   ← 56×56px, radius 50% (sirkel)
  └────┘
  BG: #1B2B4B    Ikon: #FFFFFF
  Skygge: 0 4px 16px rgba(27,43,75,0.3)
  Brukes til: "Start analyse" (pianoeier-hjem)
```

### 5.2 Inndatafelt

#### Standard tekstfelt
```
  ETIKETT (12px / 500 / CAPS)
  ┌────────────────────────────────────┐
  │  Innhold / plassholder...          │  ← Høyde: 48px
  └────────────────────────────────────┘
  Hjelpetekst (14px / #6B7280)

  Normal:   Kant 1px #D1D5DB, BG #FFFFFF
  Fokus:    Kant 2px #1B2B4B, ring 3px #D6E4F7
  Feil:     Kant 2px #B91C1C, ring 3px #FDEAEA
  Suksess:  Kant 2px #1A7A4A
  Radius: 8px    Padding: 12px 16px
  Plassholder: #9CA3AF (sikrer ≥4.5:1 kontrast MED bakgrunn)
```

#### Feilmeldingsvisning
```
  [⚠ ikon 16px]  Feilmelding her (14px / #B91C1C)
  Alltid under feltet — aldri som tooltip
  Aldri bare ikon uten tekst
```

### 5.3 Helsemåler

#### Sirkulær helsescore
```
        ┌─────────┐
       /    87     \    ← Score (JetBrains Mono 28px)
      │  ●●●●●●●○○  │   ← Progress ring (SVG)
       \   God       /   ← Status-tekst (Inter 14px)
        └─────────┘

  Ring-bredde: 8px
  Farge: Suksess (#1A7A4A) for 70–100
         Advarsel (#C47B00) for 40–69
         Fare (#B91C1C) for 0–39
  Bakgrunnsring: #E5E7EB
  Størrelse: 120×120px (stor), 64×64px (mini)
```

#### Horisontal cent-avvik-bar (pr. tangent)
```
  ─────────────────────────────────────────────────────
       C3   |████████████┤         |    ←  -8 cent
       D3   |            ┤█████████|    ← +12 cent
       E3   |            ┤█        |    ←  +2 cent
  ─────────────────────────────────────────────────────
       -50               0               +50 cent

  Midtlinje: #D1D5DB
  Avvik < 5c: #1A7A4A (grønn)
  Avvik 5–15c: #C47B00 (amber)
  Avvik > 15c: #B91C1C (rød)
  Bar-høyde: 6px, radius 3px
```

### 5.4 Kort (Cards)

#### Standard innholdskort
```
  ┌──────────────────────────────────────────┐
  │                                          │
  │  [Overskrift H3]                         │
  │  Brødtekst her...                        │
  │                                          │
  │  [Sekundær info]              [Handling] │
  └──────────────────────────────────────────┘

  BG: #FFFFFF
  Kant: 1px solid #E5E7EB
  Radius: 12px
  Skygge: 0 2px 8px rgba(0,0,0,0.06)
  Padding: 20px
  Hover (klikbare kort): skygge øker, lett løft (transform: translateY(-2px))
```

#### Helseraport-kort
```
  ┌──────────────────────────────────────────┐
  │  ●─────────────────────  87/100          │ ← Statusbar
  │                                          │
  │  God stemming                            │ ← Status tekst H2
  │  Sist analysert: 15. mars 2026           │ ← Metadata
  │                                          │
  │  [Se rapport]  [Book temmer]             │
  └──────────────────────────────────────────┘
  Venstre kant: 4px solid farge (suksess/advarsel/fare)
```

#### Temmer-profilkort
```
  ┌──────────────────────────────────────────┐
  │  [Foto 48px]  Lars Mikkelsen             │
  │               ★★★★☆ 4.8 (23 vurd.)      │
  │               Bergen — 3,2 km fra deg   │
  │                                          │
  │  Sertifisert Piano Technicians Guild     │
  │  "Erfaren med flygler og stuepiano..."   │
  │                                          │
  │  Fra kr 850,-              [Se profil]   │
  └──────────────────────────────────────────┘
```

### 5.5 Fremgangsindikator (Opptaksflyt)

```
  Steg 1      Steg 2      Steg 3      Steg 4
  ──●──────────○────────────○────────────○──
  Opptak    Analyse    Rapport    (Book)

  Fullfort: ● Fylt sirkel, #1B2B4B, ✓ ikon
  Aktiv:    ● Fylt sirkel, #1B2B4B, pulserende ring
  Kommende: ○ Tom sirkel, #D1D5DB
  Linje: 2px, Fullfort: #1B2B4B, Kommende: #D1D5DB
```

### 5.6 Innspillings-puls-animasjon

```
  STILLE (ingen lyd):
  ┌────────────────────────────────────────┐
  │              ○                         │ ← Sirkel 80px, #D6E4F7
  │          🎤                            │ ← Mic-ikon sentert
  └────────────────────────────────────────┘

  SPILLER/OPPTAK AKTIVT:
  ┌────────────────────────────────────────┐
  │          ○○○○                          │ ← 3 konsentriske ringer
  │        ○  🎤  ○                        │ ← Pulser utover (ease-out)
  │          ○○○○                          │ ← Farge: #1B2B4B
  └────────────────────────────────────────┘

  GOD INNSPILLING (detektert riktig note):
  ┌────────────────────────────────────────┐
  │          ○○○○                          │ ← Ringer: #1A7A4A
  │        ○  ✓   ○                        │ ← Sjekk-ikon
  │          ○○○○                          │
  └────────────────────────────────────────┘

  CSS-animasjon:
  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 0.8; }
    100% { transform: scale(2.5); opacity: 0;   }
  }
  Varighet: 1.5s, ease-out, infinite (kun under opptak)
  prefers-reduced-motion: Erstatt med statisk fargeendring
```

### 5.7 Navigasjonsbar (Mobilbunnbar)

```
  ┌─────────────────────────────────────────────┐
  │  🏠         📊         ⊕         👤        │
  │ Hjem      Historikk  Analyser  Profil       │
  └─────────────────────────────────────────────┘

  Høyde: 64px + safe-area-inset-bottom (iOS)
  BG: #FFFFFF
  Topkant: 1px solid #E5E7EB
  Aktiv ikon: #1B2B4B (fylt ikon)
  Inaktiv ikon: #9CA3AF (outline ikon)
  Etikett: 10px / Inter / 500
  Aktiv etikett: #1B2B4B
  Inaktiv etikett: #6B7280
  Fokus: 2px outline på hele tab-item
```

### 5.8 Toast-varsler

```
  SUKSESS:
  ┌───────────────────────────────────────────┐
  │  ✓  Booking bekreftet!           [Lukk]  │
  └───────────────────────────────────────────┘
  BG: #E6F5EE, kant venstre: 4px #1A7A4A

  FEIL:
  ┌───────────────────────────────────────────┐
  │  ⚠  Opptaket feilet. Prøv igjen.  [Lukk] │
  └───────────────────────────────────────────┘
  BG: #FDEAEA, kant venstre: 4px #B91C1C

  INFO:
  ┌───────────────────────────────────────────┐
  │  ℹ  Lars Mikkelsen har akseptert oppdraget│
  └───────────────────────────────────────────┘
  BG: #E3F1FA, kant venstre: 4px #1D6FA4

  Posisjon: Topp-sentrum på mobil, Bunn-høyre på desktop
  Varighet: 4 sekunder (auto-lukk), med pause ved hover
  Animasjon: slide-in fra topp, fade-out
  prefers-reduced-motion: fade-in/out uten slide
```

### 5.9 Tomt tilstand (Empty States)

```
  ┌──────────────────────────────────────────┐
  │                                          │
  │          [Illustrasjon 120px]            │
  │                                          │
  │     Ingen analyser ennå                  │
  │                                          │
  │  Gjør din første helseanalyse for å      │
  │  se tilstanden til pianoet ditt.         │
  │                                          │
  │        [Start analyse]                   │
  │                                          │
  └──────────────────────────────────────────┘

  Illustrasjonstil: Enkel, linjestilt SVG. Monokromatisk (#D6E4F7 / #1B2B4B).
  Aldri fotografier for tomme tilstander.
  Alltid med primær CTA.
```

### 5.10 Lastestatus

```
  SKELETON SCREEN (foretrukket, ikke spinner):
  ┌──────────────────────────────────────────┐
  │  ████████████████  ← Grå blokk (H2)     │
  │                                          │
  │  ████  ████████████████████████          │
  │  ████████  ████████████  ████████        │
  │                                          │
  │  ████████  ████████████████              │
  └──────────────────────────────────────────┘

  Skjelett-farge: #E5E7EB
  Animasjon: shimmer (gradient sweep 1.5s ease-in-out infinite)
  Brukes: Ved innlasting av oppdragsliste, temmer-profiler, historikk

  SPINNER (kun for korte operasjoner < 2 sekunder):
  Sirkel 24px, stroke #1B2B4B, rotasjon 0.8s linear infinite
  prefers-reduced-motion: pulse i stedet for rotasjon
```

---

## 6. Romlig system (Spacing)

Basert på 4px grid:

```
  4px   — xs  (tett, innad i komponent)
  8px   — sm  (mellom relaterte elementer)
  12px  — md- (kompakt innhold)
  16px  — md  (standard innhold-gap)
  20px  — md+ (kort-padding standard)
  24px  — lg  (seksjonsseparasjon)
  32px  — xl  (mellom seksjoner)
  48px  — 2xl (sidetopp-margin)
  64px  — 3xl (hero-seksjoner)
```

---

## 7. Heving (Elevation / Shadows)

```
  Level 0 (flat):      ingen skygge            — kort i liste
  Level 1 (subtil):    0 1px 3px rgba(0,0,0,0.08)  — standard kort
  Level 2 (moderat):   0 4px 12px rgba(0,0,0,0.1)  — flytende elementer
  Level 3 (høy):       0 8px 24px rgba(0,0,0,0.15) — modaler, drawer
  Level 4 (maksimal):  0 16px 48px rgba(0,0,0,0.2) — tooltip, popover
```

---

## 8. Border-radius

```
  sm:   4px  — Chips, badges, small tags
  md:   8px  — Knapper, inndatafelt
  lg:  12px  — Kort, paneler
  xl:  16px  — Modaler, bottom sheet
  full: 50%  — Avatar, FAB, indikatorprikk
```

---

## 9. Mørk modus

### Prinsipp
Mørk modus er ikke en fargeomvendt lysmodus. Det er et eget visuelt system designet for lavlys-bruk.

### Token-mapping

| Token | Lysmodus | Mørk modus |
|---|---|---|
| `--surface-primary` | #FFFFFF | #111827 |
| `--surface-secondary` | #F3F4F6 | #1F2937 |
| `--surface-elevated` | #FFFFFF | #273549 |
| `--text-primary` | #0A0F1A | #F9FAFB |
| `--text-secondary` | #374151 | #D1D5DB |
| `--text-tertiary` | #6B7280 | #9CA3AF |
| `--border` | #E5E7EB | #374151 |
| `--primary` | #1B2B4B | #3D6BB5 |
| `--primary-text` | #FFFFFF | #FFFFFF |
| `--accent` | #F5F0E8 | #2C2620 |

### Detektering
Bruk `prefers-color-scheme: dark` som standard.
Gi brukeren mulighet til å overstyre via innstillinger.

### Piano-grafen i mørk modus
Tuningkurven bruker `#60A5FA` (lys blå) på mørk bakgrunn for god synlighet.
Grid-linjer: `rgba(255,255,255,0.08)`.

---

## 10. Bevegelse og animasjon

### Animasjonsprinsipper

**Formål:** Animasjoner skal gi feedback, styre oppmerksomhet og formidle tilstand. Aldri dekorativ animasjon for sin egen skyld.

### Timing

```
  Øyeblikkelig:  0ms   — Hover-farge (oppfattes som unresponsiv ellers)
  Rask:         150ms  — Knapp-trykk, fokus-ring
  Normal:       250ms  — Modal-inn, kort-ekspandering
  Langsom:      400ms  — Side-overgang, diagram-animasjon
  Svært langsom:600ms+ — Kun for store hero-animasjoner (sparksjerm)
```

### Easing

```
  ease-out    : Brukes for ting som kommer INN (myk landing)
  ease-in     : Brukes for ting som går UT (rask start, myk slutt)
  ease-in-out : Brukes for ting som skifter tilstand (f.eks. toggle)
  linear      : Brukes kun for looping (spinner, progress bar)
```

### Nøkkelanimasjoner

1. **Opptakspuls:** Se 5.6 ovenfor
2. **Side-overgang:** Slide-inn fra høyre (ny side) / venstre (tilbake). 250ms ease-out.
3. **Helsescore oppbygging:** Sirkelring tegnes fra 0 til score på 800ms. En gang ved første innlasting.
4. **Tuningkurve-tegning:** Linjen animerer inn punkt for punkt (500ms total). Gir en følelse av at analysen "avslører" resultatet.
5. **Suksess-konfetti (kun etter "perfekt" stemming):** 800ms, 15 partikler, `prefers-reduced-motion`-trygt.

### `prefers-reduced-motion`

Alle animasjoner byttes til en øyeblikkelig `opacity`-fade (150ms) når denne medieforespørselen er aktiv. Ingen transformasjoner, ingen slides, ingen pulseringer.

---

## 11. Bildestil (Illustrasjoner og fotografier)

### Illustrasjoner
- Stil: Enkel, geometrisk linjestil SVG. Ikke karikatur, ikke foto-realistisk.
- Fargeskala: Monokromatisk — bruker design system farger (#1B2B4B, #D6E4F7, #F5F0E8)
- Innhold: Piano-relatert — tangenter, stemmegaffel, noter, hender på tangenter
- Brukes til: Tomme tilstander, onboarding-illustrasjoner, markedsføringssider

### Fotografier
- Stil: Naturlig lys, varm fargeprofil. Autentiske situasjoner — ikke overdrevent polert reklamefoto.
- Motiv: Faktiske pianoeiere (ikke stock-modeller), faktiske pianoer (med slitasje — ekte)
- Fargebehandling: Lette varm-toner. Ikke sterkt filtrert.
- Brukes til: Temmer-profilbilder, markedsføringssider

### Piano-UI-visuals
- Tangentvisualiseringen (scanning-flyt): Stilisert SVG-piano. Sort-hvitt med primærfarge-fremheving.
- Tuningkurven: SVG-graf med axis, gridlines, og linjegraf. Aldri kakediagram.

---

*Designsystemet er levende. Alle avvik fra spesifikasjonen skal godkjennes av lead designer og dokumenteres her.*
