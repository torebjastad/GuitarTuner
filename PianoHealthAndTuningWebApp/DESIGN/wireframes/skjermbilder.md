# PianoHelse — Wireframe-spesifikasjoner
## Lead UX/UI Designer — Detaljerte skjermbilder

**Versjon:** 1.0
**Dato:** Mars 2026
**Format:** ASCII wireframes (mobil-first, 390px bredde = iPhone 14 Pro)
**Konvensjoner:**
- `█` = Fylt element (knapp, bilde, ikon)
- `░` = Bakgrunnselement / skelett
- `─` `│` `┌` `┐` `└` `┘` `├` `┤` `┬` `┴` `┼` = Rammer
- `[Tekst]` = Interaktivt element (knapp, lenke)
- `(Tekst)` = Ikke-interaktiv tekst / etikett

---

## SKJERM 1: Splash / Oppstartssskjerm

```
┌─────────────────────────────────────┐  390px bred
│                                     │
│                                     │
│                                     │
│                                     │
│         ┌───────────┐               │
│         │   ♩ ♪ ♫   │               │  Piano-logo SVG
│         │  ═══════  │               │  (stiliserte tangenter)
│         └───────────┘               │
│                                     │
│         PianoHelse                  │  Playfair Display 36px
│                                     │
│    Stemmesjakten for pianoet ditt   │  Inter 16px, grå
│                                     │
│                                     │
│                                     │
│                                     │
│                                     │
│    ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■    │  Lastelinje (progress)
│                                     │  Animert
└─────────────────────────────────────┘

BG: #1B2B4B (dyp blå)
Logo: Hvit SVG
Tekst "PianoHelse": #F5F0E8 (elfenben)
Undertekst: rgba(245,240,232,0.7)
Lastelinje: #C9A84C (gull)

Varighet: 2,5 sekunder → navigerer til /velg-rolle (ny bruker) eller /hjem
```

**Notater:**
- Ingen skip-mulighet
- Forhåndslaster kjerneressurser i bakgrunnen
- `prefers-reduced-motion`: Ingen animert logo, kun statisk visning

---

## SKJERM 2: Velg din rolle

```
┌─────────────────────────────────────┐
│  ←                                  │  Tilbake-knapp (kun hvis relevant)
├─────────────────────────────────────┤
│                                     │
│  Hvem er du?                        │  H1, Inter 28px
│                                     │
│  Velg det som passer deg best       │  Body, #6B7280
│                                     │
│ ┌───────────────────────────────────┐│
│ │                                   ││  KORT 1 (klikk hele kort)
│ │     🎹                            ││  Ikon 48px
│ │                                   ││
│ │  Jeg eier et piano                ││  H2 Inter 22px
│ │                                   ││
│ │  Sjekk helsetilstanden og finn    ││  Body 14px #6B7280
│ │  en profesjonell stemmer nær deg  ││
│ │                                   ││
│ └───────────────────────────────────┘│  Kant: 1px #D1D5DB, radius 12px
│                                     │  Hover/trykk: kant #1B2B4B 2px
│ ┌───────────────────────────────────┐│
│ │                                   ││  KORT 2
│ │     🔧                            ││  Ikon 48px (stemmegaffel)
│ │                                   ││
│ │  Jeg er pianostemmer              ││  H2 Inter 22px
│ │                                   ││
│ │  Finn nye kunder og administrer   ││  Body 14px #6B7280
│ │  oppdrag effektivt                ││
│ │                                   ││
│ └───────────────────────────────────┘│
│                                     │
│  Allerede bruker? [Logg inn]         │  14px, lenke til /logg-inn
│                                     │
└─────────────────────────────────────┘

INTERAKSJONSTILSTANDER:
  Normal:   Hvit BG, #D1D5DB kant
  Hover:    #F5F0E8 BG, #1B2B4B kant 2px
  Trykket:  #D6E4F7 BG (100ms), deretter navigering
  Fokus:    3px outline #1B2B4B utenfor kortet
```

**Mikrokopi-notater:**
- Tittelen "Hvem er du?" er bevisst uformell — inviterende
- Bildekort-tekst beskriver nytte, ikke funksjon
- Ingen onboarding-karusell — direkte valg er raskere

---

## SKJERM 3: Registrering (Pianoeier)

```
┌─────────────────────────────────────┐
│  ←  Tilbake                         │
├─────────────────────────────────────┤
│                                     │
│  Opprett konto                      │  H1 28px
│                                     │
│  FORNAVN                            │  Label 12px / 500 / CAPS
│ ┌───────────────────────────────────┐│
│ │  Astrid                           ││  Input 48px høyde
│ └───────────────────────────────────┘│
│                                     │
│  ETTERNAVN                          │
│ ┌───────────────────────────────────┐│
│ │  Berntsen                         ││
│ └───────────────────────────────────┘│
│                                     │
│  E-POSTADRESSE                      │
│ ┌───────────────────────────────────┐│
│ │  astrid@example.com               ││
│ └───────────────────────────────────┘│
│                                     │
│  PASSORD                            │
│ ┌──────────────────────────────── 👁││
│ │  ••••••••••                       ││  👁 = vis/skjul passord
│ └───────────────────────────────────┘│
│  ██████████████░░░░  Sterkt          │  Passordstyrke-måler
│                                     │
│  ┌─┐ Jeg godtar vilkår for bruk og  │
│  │✓│ personvernerklæringen          │  Checkbox 20x20px
│  └─┘ [Les vilkår] · [Les personvern]│
│                                     │
│ ┌───────────────────────────────────┐│
│ │        Opprett konto              ││  Primærknapp 48px
│ └───────────────────────────────────┘│
│                                     │
│  ─────────────  eller  ─────────────│
│                                     │
│ ┌───────────────────────────────────┐│
│ │ [G]  Fortsett med Google          ││  Sekundærknapp
│ └───────────────────────────────────┘│
│ ┌───────────────────────────────────┐│
│ │  Fortsett med Apple ID           ││
│ └───────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘

VALIDERINGS-TILSTANDER:
E-post (feil):
  ┌──────────────────── 🔴 ────────────┐
  │  astrid@                          │  Rød kant
  └───────────────────────────────────┘
  [⚠] Skriv inn en gyldig e-postadresse   ← 14px rød tekst

Passord (OK):
  ┌──────────────────── 🟢 ────────────┐
  │  ••••••••••                       │  Grønn kant
  └───────────────────────────────────┘

"Opprett konto"-knapp:
  Deaktivert (grå): Inntil alle felt er fylt ut og vilkår akseptert
  Aktiv (primærblå): Klar til innsending
  Laster (spinner): Under oppretting
```

---

## SKJERM 4: Piano-informasjon (Onboarding steg 2)

```
┌─────────────────────────────────────┐
│  ←  Tilbake    ●●○○  Steg 2 av 4   │  Framdriftsindikator (dots)
├─────────────────────────────────────┤
│                                     │
│  Fortell oss om pianoet ditt        │  H1 28px
│                                     │
│  Hjelper oss å gi bedre diagnose    │  Body 16px #6B7280
│                                     │
│  PIANO-TYPE                         │  Label
│ ┌───────────────────────────────────┐│
│ │  ○  Flygelformet piano            ││
│ │  ●  Stuepiano (oppreist)          ││  ● = valgt
│ │  ○  Digitalt piano                ││  Radio-knapper
│ │  ○  Vet ikke                      ││
│ └───────────────────────────────────┘│
│                                     │
│  MERKE  (valgfritt)                 │
│ ┌───────────────────────────────────┐│
│ │  F.eks. Steinway, Yamaha, Kawai   ││  Plassholder-tekst
│ └───────────────────────────────────┘│
│                                     │
│  ALDER PÅ PIANO  (valgfritt)        │
│ ┌────────────────────────────── ▼   ││  Rullegardin
│ │  Velg alder...                    ││
│ └───────────────────────────────────┘│
│                                     │
│  SIST STEMT  (valgfritt)            │
│ ┌────────────────────────────── ▼   ││
│ │  Velg tidspunkt...                ││
│ └───────────────────────────────────┘│
│                                     │
│ ┌───────────────────────────────────┐│
│ │        Lagre og fortsett          ││  Primærknapp
│ └───────────────────────────────────┘│
│                                     │
│      [Hopp over — legg til senere]  │  Tekstlenke
│                                     │
│  🔒 Vi bruker kun denne informasjonen│
│  for å forbedre analysen din.       │  12px, grå
│                                     │
└─────────────────────────────────────┘
```

---

## SKJERM 5: Hjemskjerm (Pianoeier — Første gang, tom tilstand)

```
┌─────────────────────────────────────┐
│  PianoHelse              🔔  👤     │  Topplinje
├─────────────────────────────────────┤
│                                     │
│  God ettermiddag, Astrid! 👋        │  H2 22px, personlig hilsen
│                                     │
│ ┌───────────────────────────────────┐│
│ │                                   ││  ONBOARDING-BANNER
│ │     🎹  Klar for første sjekk?   ││
│ │                                   ││  BG: #D6E4F7
│ │  Gjør en rask helseanalyse for å  ││
│ │  se tilstanden til pianoet ditt.  ││
│ │                                   ││
│ │  [Start første analyse  →]        ││  Primærknapp (blå)
│ └───────────────────────────────────┘│
│                                     │
│  MINE BOOKINGER                     │  H3 18px
│                                     │
│ ┌───────────────────────────────────┐│
│ │          [Piano-illustrasjon]     ││  TOM TILSTAND
│ │                                   ││
│ │   Ingen aktive bookinger          ││  Center-justert
│ │   ennå                            ││
│ │                                   ││
│ │   Gjør en analyse og book en      ││
│ │   stemmer.                        ││
│ │                                   ││
│ └───────────────────────────────────┘│
│                                     │
│  TIPS FRA OSS                       │
│ ┌───────────────────────────────────┐│
│ │  💡  Visste du at...              ││  INFO-KORT
│ │  Et piano bør stemmes 1–2 ganger  ││
│ │  i året for best lydkvalitet.     ││
│ └───────────────────────────────────┘│
│                                     │
│                    ╔═══╗            │  FAB (Flytende handlingsknapp)
│                    ║ + ║            │  56x56px, #1B2B4B
│                    ╚═══╝            │
│                  Start analyse      │  Etikett over FAB
├─────────────────────────────────────┤
│  🏠 Hjem   📊 Historikk  ⊕  👤 Profil│  Navigasjonsbar
└─────────────────────────────────────┘

INTERAKSJONSNOTATER:
- FAB-knappen pulserer svakt (2x per sekund) første 3 gang appen åpnes
- Deretter normal statisk tilstand
- [🔔] badge vises hvis det finnes uleste varsler
```

---

## SKJERM 6: Hjemskjerm (Pianoeier — Tilbakevendende bruker)

```
┌─────────────────────────────────────┐
│  PianoHelse              🔔2  👤    │  Topplinje, 2 uleste varsler
├─────────────────────────────────────┤
│                                     │
│  Hei, Astrid!                       │  H2 22px
│                                     │
│  HELSESTATUS — DITT PIANO           │  Label 12px CAPS
│ ┌───────────────────────────────────┐│
│ │                                   ││  HELSEKORT (klikk → rapport)
│ │    ╔════════════╗                 ││
│ │    ║    74      ║   God stemming  ││  Score-ring + tekst
│ │    ║   /100     ║                 ││
│ │    ╚════════════╝                 ││
│ │                                   ││
│ │  Analysert: 15. mars 2026         ││  14px grå
│ │                                   ││
│ │  [Se rapport]   [Book stemmer →]  ││  To knapper
│ └───────────────────────────────────┘│
│                                     │
│  AKTIVE BOOKINGER                   │
│ ┌───────────────────────────────────┐│
│ │  Lars Mikkelsen     Fre 20. mars  ││  BOOKINGKORT
│ │  Stuepiano-stemming · kl. 14:00  ││
│ │  Status: ✓ Bekreftet              ││  Grønn status
│ │                          [Detalj] ││
│ └───────────────────────────────────┘│
│                                     │
│  FORRIGE ANALYSER                   │
│ ┌─────────────────────────────────┐  │
│ │ 15. mars 2026  74/100  →       │  │  Liste-element
│ └─────────────────────────────────┘  │
│ ┌─────────────────────────────────┐  │
│ │ 12. sept. 2025  68/100  →      │  │
│ └─────────────────────────────────┘  │
│  [Se all historikk →]               │
│                                     │
│                    ╔═══╗            │  FAB
│                    ║ + ║            │
│                    ╚═══╝            │
├─────────────────────────────────────┤
│  🏠 Hjem   📊 Historikk  ⊕  👤 Profil│
└─────────────────────────────────────┘
```

---

## SKJERM 7: Forberedelsessjekk (Analyseflyten)

```
┌─────────────────────────────────────┐
│  ✕ Avbryt                           │
├─────────────────────────────────────┤
│                                     │
│  Gjør deg klar                      │  H1 28px
│  til analysen                       │
│                                     │
│  ≈ 5–8 minutter · Velg type under   │  Body grå
│                                     │
│ ┌───────────────────────────────────┐│
│ │  [Illustrasjon: Telefon ved piano]││  SVG-illustrasjon 160px høy
│ └───────────────────────────────────┘│
│                                     │
│  Før du starter:                    │  H3 18px
│                                     │
│  ✓  Pianoet er tilgjengelig          │  Sjekkpunkter
│  ✓  Du er i et noenlunde stille rom  │  (kun visuell liste)
│  ✓  Telefonen er 20–50 cm fra piano  │
│  ✓  Bluetooth-headset er koblet fra  │
│  ✓  Pedalen er ikke trykket ned      │
│                                     │
│  ANALYSENIVÅ:                        │  Label CAPS
│ ┌───────────────────────────────────┐│
│ │  ●  Fullstendig (alle 88)  ANBE.  ││  Radio + badge
│ │     ≈ 7 minutter                  ││
│ │  ○  Hvit-tangent (52 taster)      ││
│ │     ≈ 5 minutter                  ││
│ │  ○  Hurtig-sjekk (7 C-er)         ││
│ │     ≈ 1–2 minutter                ││
│ └───────────────────────────────────┘│
│                                     │
│ ┌───────────────────────────────────┐│
│ │      Jeg er klar — start!         ││  Primærknapp, grønn #1A7A4A
│ └───────────────────────────────────┘│
│                                     │
│  [Mer info om forberedelse]          │  Tekstlenke
│                                     │
└─────────────────────────────────────┘
```

---

## SKJERM 8: Aktiv innspilling (Analyseflyten — hovdeskjerm)

```
┌─────────────────────────────────────┐
│  [✕ Avbryt]         Tangent 23 av 88│  Header (minimalt)
├─────────────────────────────────────┤
│  ████████████████████░░░░░░░░░░░░░  │  Fremdriftslinje 26% fylt
│  (26%)                  Ca. 6 min   │  Tekst under
├─────────────────────────────────────┤
│                                     │
│                                     │
│            ╭───────────╮            │
│          ╭─╯           ╰─╮          │  Puls-ringer (animert)
│        ╭─╯   ╭───────╮   ╰─╮        │  3 konsentriske ringer
│        │     │   🎤   │     │        │  Mikrofon-ikon 32px
│        ╰─╮   ╰───────╯   ╭─╯        │  Ringene ekspanderer utover
│          ╰─╮           ╭─╯          │  og fader (1.5s loop)
│            ╰───────────╯            │
│                                     │
│         Spill nå: D3               │  H2 22px / 700, sentert
│                                     │
│   Hold tangenten nede i 2 sekunder  │  Body 14px grå
│                                     │
│  ┌─────────────────────────────────┐│
│  │ C  D  E  F  G  A  B  |C  D  E  ││  Mini-piano (scrollbart SVG)
│  │ ■  ●  ░  ░  ░  ░  ░  |░  ░  ░  ││  ■=fullfort(grønn), ●=aktiv(blå)
│  └─────────────────────────────────┘│  ░=kommende(grå)
│                                     │
│  ┌─────────────────────────────────┐│  LYDNIVÅ-INDIKATOR
│  │ ░░░▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░  ││  Grønn = god nivå
│  │ Mikrofon aktiv                  ││  Rød = for høy / for lav
│  └─────────────────────────────────┘│
│                                     │
│         [⏸  Sett på pause]          │  Sekundærknapp
│                                     │
└─────────────────────────────────────┘

TILSTANDSOVERGANGER:

VENTER (ingen lyd):
  - Puls-ringer: Langsom, svak blå (#D6E4F7)
  - Status-tekst: "Spill nå: D3"
  - Mikrofon ikon: Standard blå

LYTTER (lyd detektert, feil note):
  - Puls-ringer: Aktive, amber (#C47B00)
  - Status-tekst: "Det høres ut som C#3 — prøv D3"
  - Topp-hint: Pil rettet mot riktig tangent på mini-piano

TREFFER (riktig note bekreftet):
  - Puls-ringer: Grønn flash (#1A7A4A), 300ms
  - Status-tekst: "✓  D3 registrert!"
  - Haptic: Lett vibrasjon 50ms
  - 500ms pause → Neste tangent animerer inn
  - Mini-piano: D3 markeres grønn

PAUSE:
┌─────────────────────────────────────┐
│              [■ Avbryt]             │
├─────────────────────────────────────┤
│                                     │
│             [Pust ut! 😮‍💨]           │
│                                     │
│      Analysen er satt på pause      │
│                                     │
│      Du er 26% ferdig               │
│      Ca. 6 minutter igjen           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │      ▶  Fortsett analyse      │  │  Primær grønn
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**FEILTILFELLER:**

```
FOR MYE STØY:
┌─────────────────────────────────────┐
│  [Rød bakgrunns-flash, 200ms]       │
│                                     │
│     ⚠  For mye bakgrunnsstøy        │  Amber melding, sentert
│                                     │
│  Prøv å redusere støy i rommet,     │
│  eller flytt deg til et stille sted │
│                                     │
│  [Prøv igjen]    [Fortsett likevel] │
└─────────────────────────────────────┘

MIKROFON MISTET TILGANG:
┌─────────────────────────────────────┐
│     🔴  Mikrofon ikke tilgjengelig  │
│                                     │
│  Sjekk at PianoHelse har tillatelse │
│  til å bruke mikrofonen din.        │
│                                     │
│  [Åpne innstillinger]  [Prøv igjen] │
└─────────────────────────────────────┘
```

---

## SKJERM 9: Analyse pågår (Etter opptak)

```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│     Analyserer pianoet ditt...      │  H2 22px, sentert
│                                     │
│  ┌──────────────────────────────────┐│
│  │                    ╱             ││  TUNINGKURVE ANIMERT
│  │        ╭──╮       ╱   ╭─╮       ││  Linjen tegner seg fra venstre
│  │   ─────╯  ╰───╮──╯   ╰─╰─────  ││  til høyre, 5 sekunder
│  │               ╰──               ││
│  │  C1           C4            C8  ││  X-akse etiketter
│  └──────────────────────────────────┘│
│                                     │
│  ████████████████████████░░░░░░░░░  │  Fremdriftslinje
│                          72%        │
│                                     │
│  Sammenligner med referansestandard.│  Body 14px grå, skifter hvert 2s
│                                     │
│  ┌───────────────────────────────┐  │  INFO-PANEL (liten skrift)
│  │  🔒  Analysen skjer direkte   │  │
│  │     på enheten din. Vi lagrer │  │  12px, #6B7280
│  │     ikke lydfiler.            │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

---

## SKJERM 10: Helseosrapport — Oversikt

```
┌─────────────────────────────────────┐
│  ←  Tilbake           [Del] [Lagre] │  Topplinje med handlinger
├─────────────────────────────────────┤
│  HELSEOSRAPPORT                     │  Label CAPS 12px grå
│  15. mars 2026 · Fullstendig        │
├─────────────────────────────────────┤
│                                     │
│        ╔═══════════════════╗        │
│        ║                   ║        │  Score-ring SVG
│        ║        74         ║        │  Ring-farge: amber (siden 40–69
│        ║       /100        ║        │  er advarsel — 74 er god!)
│        ║                   ║        │  Ring-farge: grønn (#1A7A4A)
│        ╚═══════════════════╝        │
│                                     │
│              God stemming           │  H2 22px grønn
│                                     │
│  Pianoet ditt er i god stand.       │  Body 16px
│  Vi anbefaler stemming om 6–12 mnd. │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  TUNINGKURVEN DIN                   │  H3 18px
│  Avvik fra riktig tonehøyde         │  14px grå
│                                     │
│  ┌──────────────────────────────────┐│  TUNINGKURVE
│  │+50│                             ││  Y-akse: -50 til +50 cent
│  │ 25│      ╭─╮                    ││
│  │  0│──────╯ ╰──────────╮──────  ││  Nulllinje stiplet
│  │-25│                   ╰─       ││
│  │-50│                            ││
│  │   C1    C3    C5    C7    C8   ││
│  └──────────────────────────────────┘│
│  Trykk på kurven for detaljer        │  12px grå
│                                     │
├─────────────────────────────────────┤
│                                     │
│  OPPSUMMERING                       │  H3 18px
│                                     │
│  Gj.snitt avvik:     +3,2 cent      │  To-kolonne grid
│  Verste tangent:     C6 (+22 cent)  │
│  Beste tangent:      A4 (+0,3 cent) │
│  I grønn sone:       78 av 88 (89%) │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ ┌───────────────────────────────────┐│
│ │ ✓  Ingen umiddelbar handling      ││  ANBEFALINGS-KORT (grønn)
│ │    nødvendig                      ││  BG: #E6F5EE
│ │                                   ││  Venstre-kant: 4px #1A7A4A
│ │  Vi anbefaler en ny analyse om    ││
│ │  6 måneder.                       ││
│ │                                   ││
│ │  [Sett påminnelse]  [Book nå]     ││
│ └───────────────────────────────────┘│
│                                     │
│  ─────────────────────────────────  │
│  [v] Se tangentliste                │  Sammenleggbar seksjon
│  [v] Historikk                      │
│  [v] Om analysen                    │
│                                     │
└─────────────────────────────────────┘
```

---

## SKJERM 11: Finn en stemmer

```
┌─────────────────────────────────────┐
│  ←  Tilbake                         │
├─────────────────────────────────────┤
│                                     │
│  Finn en stemmer nær deg            │  H1 28px
│                                     │
│  📍 Trondheim  [Endre sted]         │  14px, lenke
│                                     │
│ ┌───────────────────────────────────┐│
│ │ 🔍  Søk etter navn...             ││  Søkefelt
│ └───────────────────────────────────┘│
│                                     │
│  [🔧 Filtre]  Sortér: [Nærmest ▼]  │  Filter + sortering
│                                     │
│  [Se karte]  ←→  [Se liste ●]       │  Visningsvalg (Liste aktiv)
│                                     │
│  3 stemme​re funnet i ditt område    │  Resultat-teller
│                                     │
│ ┌───────────────────────────────────┐│  TEMMER-KORT 1
│ │ ┌────┐  Lars Mikkelsen            ││
│ │ │Foto│  ★★★★☆ 4,8 · 23 anm.     ││  Profilfoto 48x48px
│ │ └────┘  Bergen · 3,2 km          ││
│ │                                   ││
│ │  PTG-sertifisert · 25 år erfaring ││  Chip-tags
│ │                                   ││
│ │  Fra kr 950,-    [Se profil →]    ││  Pris + CTA
│ └───────────────────────────────────┘│
│                                     │
│ ┌───────────────────────────────────┐│  TEMMER-KORT 2
│ │ ┌────┐  Ingrid Halvorsen          ││
│ │ │Foto│  ★★★★★ 5,0 · 8 anm.      ││
│ │ └────┘  Bergen · 5,7 km          ││
│ │                                   ││
│ │  RCT-sertifisert · Flyglspesialist││
│ │                                   ││
│ │  Fra kr 1 100,-   [Se profil →]  ││
│ └───────────────────────────────────┘│
│                                     │
│ ┌───────────────────────────────────┐│
│ │ ┌────┐  Ole Berg                  ││  TEMMER-KORT 3
│ │ │Foto│  ★★★★☆ 4,3 · 41 anm.     ││
│ │ └────┘  Bergen · 8,1 km          ││
│ │                                   ││
│ │  15 år erfaring · Vintage-piano   ││
│ │                                   ││
│ │  Fra kr 800,-     [Se profil →]  ││
│ └───────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘

FILTER-BUNNARK (slide up):
┌─────────────────────────────────────┐
│  ─── Filtre ────────────  [✕ Lukk]  │
│                                     │
│  MAKS AVSTAND                       │
│  ○────────────●──────────○          │  Slider: 30 km valgt
│  5 km                    50 km      │
│                                     │
│  MIN VURDERING                      │
│  [⭐][⭐][⭐][⭐][☆]  4 og over      │  Stjerne-velger
│                                     │
│  TILGJENGELIGHET                    │
│  [●] Denne uken  [○] Neste uke      │
│  [○] Velg dato                      │
│                                     │
│  SPESIALISERING                     │
│  [✓] Flygler  [✓] Stuepiano         │  Checkboxer
│  [ ] Antikk/Vintage                 │
│  [ ] Elektrisk/hybrid               │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │      Bruk filtre (3)            │ │  Knapp med antall aktive
│ └─────────────────────────────────┘ │
│  [Nullstill alle filtre]            │
└─────────────────────────────────────┘
```

---

## SKJERM 12: Temmer-profilside

```
┌─────────────────────────────────────┐
│  ←  Tilbake             [Del] [♡]   │  Favoritt-knapp
├─────────────────────────────────────┤
│                                     │
│         ┌──────────────────────┐    │
│         │ ┌────────────────┐   │    │  HEADER-FOTO (120px høy)
│         │ │  [Profilfoto]  │   │    │  BG: primærblå gradient
│         │ │  80x80px       │   │    │
│         │ └────────────────┘   │    │
│         └──────────────────────┘    │
│                                     │
│         Lars Mikkelsen              │  H1 28px, sentert
│         ★★★★☆ 4,8 · 23 anm.        │  Rating
│         Bergen · 3,2 km fra deg     │  14px grå
│                                     │
│  [Flygler]  [Stuepiano]  [Vintage]  │  Chip-tags
│                                     │
├─────────────────────────────────────┤
│                                     │
│  PRISER                             │  H3 18px
│                                     │
│  Stemming — stuepiano    kr 950,-   │  To-kolonne
│  Stemming — flygelformet kr 1 200,- │
│  Stemming + vedlikehold  kr 1 500,- │
│                                     │
│  ℹ️  Inkl. 12% plattformgebyr       │  12px grå
│                                     │
├─────────────────────────────────────┤
│                                     │
│  OM LARS                            │
│                                     │
│  "Jeg har stemt piano i Bergen      │
│  siden 1998, etter en grundig       │
│  mesterlæreutdanning i Leipzig.     │
│  Spesialisert på Steinway og        │
│  eldre instrumenter. PTG-sertifisert│
│  siden 2001. Svarer raskt og er     │
│  alltid presis på tid."             │  [Les mer] hvis > 200 tegn
│                                     │
├─────────────────────────────────────┤
│                                     │
│  KOMPETANSE                         │
│  Erfaring: 25 år                    │
│  Antall stemte instrumenter: 847    │
│  Sertifiseringer: PTG, RCT          │
│  Svarer vanligvis: Innen 2 timer    │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  ANMELDELSER (23)                   │
│                                     │
│  ★★★★★  "Lars er svært dyktig og   │
│           grundig..." — Kari L.     │  3 nyeste vises
│           22. feb 2026              │
│  ─────────────────────────────────  │
│  ★★★★☆  "Veldig fornøyd, men litt  │
│           forsinket..." — Per A.    │
│           10. jan 2026              │
│                                     │
│  [Se alle 23 anmeldelser →]         │  Lenke
│                                     │
├─────────────────────────────────────┤
│                                     │
│  TILGJENGELIGHET DENNE UKEN         │
│                                     │
│  Ma   Ti   On   To   Fr   Lø        │
│  ○    ●    ●    ○    ○    ─         │  ○=ledig ●=opptatt ─=ikke tilgj.
│                                     │
│  [Se full kalender]                 │
│                                     │
├─────────────────────────────────────┤
│                                     │
│ ┌───────────────────────────────────┐│
│ │       Book Lars Mikkelsen         ││  Primærknapp, grønn
│ └───────────────────────────────────┘│
│                                     │
│ ┌───────────────────────────────────┐│
│ │       Send melding                ││  Sekundærknapp
│ └───────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘
```

---

## SKJERM 13: Velg dato for booking

```
┌─────────────────────────────────────┐
│  ←  Tilbake                         │
│  Steg 1 av 3  ●○○                   │
├─────────────────────────────────────┤
│                                     │
│  Velg tidspunkt                     │  H1 28px
│  Lars Mikkelsen — Bergen            │  14px grå
│                                     │
│         ◀  Mars 2026  ▶             │  Månednavigasjon
│                                     │
│   Ma  Ti  On  To  Fr  Lø  Sø        │  Ukedager
│   ─────────────────────────────     │
│   16  17  18  19  20  21  22        │
│   ○   ●   ●   ○   ○   ─   ─        │
│   23  24  25  26  27  28  29        │
│   ○   ○   ●   ○   ○   ─   ─        │
│   30  31                            │
│   ○   ○                             │
│                                     │
│  ○ = Ledig   ● = Opptatt            │  Legende
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Ledige tider, fredag 20. mars:     │  (Vises etter datoseleksjon)
│                                     │
│  ┌───────┐ ┌───────┐ ┌───────┐     │
│  │ 09:00 │ │ 11:00 │ │ 14:00 │     │  Tid-brikker
│  └───────┘ └───────┘ └───────┘     │  14:00 = valgt (fylt blå)
│                                     │
│  ┌───────┐                          │
│  │ 16:30 │                          │
│  └───────┘                          │
│                                     │
│  ℹ️  Lars bekrefter vanligvis        │
│  innen 2 timer.                     │  12px grå
│                                     │
│ ┌───────────────────────────────────┐│
│ │    Neste: Bekreft booking         ││  Primær, deaktivert til dato valgt
│ └───────────────────────────────────┘│
│                                     │
└─────────────────────────────────────┘

DATOMARKERING (valgt):
  Valgt dato: Fylt sirkel, #1B2B4B bakgrunn, hvit tekst
  Tid valgt: Fylt brikke, #1B2B4B BG, hvit tekst
```

---

## SKJERM 14: Booking-bekreftelse

```
┌─────────────────────────────────────┐
│  ←  Tilbake                         │
│  Steg 3 av 3  ●●●                   │
├─────────────────────────────────────┤
│                                     │
│  Bekreft bestillingen               │  H1 28px
│                                     │
│ ┌───────────────────────────────────┐│  SAMMENDRAG-KORT
│ │ ┌────┐  Lars Mikkelsen            ││
│ │ │Foto│  Bergen · 3,2 km           ││
│ │ └────┘                            ││
│ │  ─────────────────────────────   ││
│ │  📅  Fredag 20. mars 2026         ││
│ │  🕑  kl. 14:00 (ca. 90 min)      ││
│ │  📍  Din adresse: Munkegt. 14     ││
│ │  🎹  Stemming — stuepiano         ││
│ │                                   ││
│ │  VEDLAGT:                         ││
│ │  ✓  Helseosrapport (74/100)       ││
│ │  ✓  Tuningkurve                   ││
│ └───────────────────────────────────┘│
│                                     │
│  PRISSAMMENDRAG                     │  H3 18px
│  ─────────────────────────────────  │
│  Stemming, stuepiano      kr 950,-  │
│  Plattformgebyr (12%)     kr 114,-  │
│  ─────────────────────────────────  │
│  Totalt                 kr 1 064,-  │  Bold
│                                     │
│  ℹ️  Du betales ikke før Lars       │
│  bekrefter.  [Les mer]              │  12px grå
│                                     │
│  BETALINGSMETODE                    │
│ ┌───────────────────────────────────┐│
│ │  ●  Vipps (+47 920 12 345)        ││
│ │  ○  Kort (avsluttes i ...1234)    ││
│ │  ○  Faktura (30 dager)            ││
│ └───────────────────────────────────┘│
│  [Endre betalingsmetode]            │
│                                     │
│  ┌─┐ Jeg godtar avbestillings-      │
│  │✓│ vilkårene  [Les vilkår]        │  Checkbox
│  └─┘ Gratis avbestilling ≤24 t før │
│                                     │
│ ┌───────────────────────────────────┐│
│ │       Bekreft og betal            ││  Primær grønn
│ └───────────────────────────────────┘│
│  [← Tilbake]                        │
│                                     │
└─────────────────────────────────────┘

UNDER BEHANDLING (etter trykk):
┌─────────────────────────────────────┐
│                                     │
│          [Spinner 32px]             │
│                                     │
│    Sender forespørsel...            │
│                                     │
└─────────────────────────────────────┘
```

---

## SKJERM 15: Booking bekreftet

```
┌─────────────────────────────────────┐
│                                     │
│        ╔═════════════════════╗      │
│        ║                     ║      │
│        ║          ✓          ║      │  Suksess-animasjon
│        ║                     ║      │  Grønn ring fylt
│        ╚═════════════════════╝      │  (konfetti-partikler)
│                                     │
│      Forespørsel sendt!             │  H1 28px, grønn
│                                     │
│  Lars Mikkelsen bekrefter           │
│  vanligvis innen 2 timer.           │  Body 16px grå
│                                     │
│ ┌───────────────────────────────────┐│  DETALJ-KORT
│ │  📅  Fredag 20. mars 2026         ││
│ │  🕑  kl. 14:00                    ││
│ │  👤  Lars Mikkelsen               ││
│ │  🔖  Ref: PH-20260320-4421        ││  Ref-nummer, monospace
│ └───────────────────────────────────┘│
│                                     │
│  HVA SKJER NESTE?                   │  H3 18px
│                                     │
│  ① ✓  Forespørsel sendt til Lars    │
│  ②  ⏳  Lars bekrefter (innen 2 t)  │
│  ③  📅  Kalenderinvitasjon sendes   │
│  ④  ✓  Lars ankommer kl. 14:00      │
│                                     │
│ ┌───────────────────────────────────┐│
│ │  📅  Legg til i kalender          ││  Primærknapp, blå
│ └───────────────────────────────────┘│
│                                     │
│  [Gå til mine bookinger]            │  Sekundær
│  [Tilbake til hjem]                 │  Tekstlenke
│                                     │
│                                     │
└─────────────────────────────────────┘
```

---

## SKJERM 16: Temmer-portal — Oppdragsfeed (Desktop)

```
┌──────────────────────────────────────────────────────────────────────────────┐  1280px
│  PianoHelse                                          Lars Mikkelsen  🔔3  [👤]│  Topplinje
├──────────┬───────────────────────────────────────────────────────────────────┤
│          │                                                                    │
│  📋      │   Finn oppdrag                                    [Oppdater]       │  Toppoverskrift
│  Mine    │                                                                    │
│  oppdrag │   Filtre: [Alle] [Nær meg (10 km)] [Stuepiano] [Flygler]  [+]    │  Filterbar
│          │                                                                    │
│  🔍      │   Sortér: [Nyeste ▼]  |  Avstand: [50 km]  |  Pris: [Alle]      │
│  Finn    │                                                                    │
│  oppdrag │ ┌────────────────────────────────────────────────────────────────┐│
│  ●AKTIV  │ │  [NY]                               Trondheim sentrum  3,2 km  ││  OPPDRAGSKORT 1
│          │ │                                                                  ││
│  📅      │ │  Stuepiano — Yamaha, ca. 15 år                                  ││
│  Kalender│ │  Forespurt: Fredag 20. mars, eller etter avtale                ││
│          │ │                                                                  ││
│  💰      │ │  ┌──────────────────────────────────────────────────────────┐  ││
│  Inntekt.│ │  │  Helseosrapport:  74/100  [●●●●●●●●●░] God stemming      │  ││  Diagnostikk
│          │ │  │  Verste avvik: C6 (+22 cent)                              │  ││
│  ⭐      │ │  │  [▶  Hør opptak (32 sek)]  [Se tuningkurve]              │  ││
│  Anmeld. │ │  └──────────────────────────────────────────────────────────┘  ││
│          │ │                                                                  ││
│  👤      │ │  Pris: kr 950,-  ·  Din andel: kr 836,-                        ││
│  Profil  │ │                                                                  ││
│          │ │                          [Avslå]       [Akseptér oppdrag →]    ││  Knapper høyre-just.
│  ⚙️       │ └────────────────────────────────────────────────────────────────┘│
│  Innst.  │                                                                    │
│          │ ┌────────────────────────────────────────────────────────────────┐│  OPPDRAGSKORT 2
│          │ │  [NY]                                  Bergen vest  5,7 km    ││
│  ────────│ │                                                                  ││
│          │ │  Flygelformet — Steinway Model B, ca. 70 år                     ││
│  [Logg   │ │  Forespurt: Neste uke, mandag eller tirsdag                    ││
│   ut]    │ │                                                                  ││
│          │ │  ┌──────────────────────────────────────────────────────────┐  ││
│          │ │  │  Helseosrapport:  41/100  [████░░░░░░] Trenger stemming  │  ││
│          │ │  │  Verste avvik: F4 (-38 cent)                              │  ││
│          │ │  │  [▶  Hør opptak (28 sek)]  [Se tuningkurve]              │  ││
│          │ │  └──────────────────────────────────────────────────────────┘  ││
│          │ │                                                                  ││
│          │ │  Pris: kr 1 200,-  ·  Din andel: kr 1 056,-                    ││
│          │ │                                                                  ││
│          │ │                          [Avslå]       [Akseptér oppdrag →]    ││
│          │ └────────────────────────────────────────────────────────────────┘│
│          │                                                                    │
└──────────┴───────────────────────────────────────────────────────────────────┘

SIDEMENY: 260px bred, BG: #1B2B4B, tekst: #F5F0E8
HOVED-INNHOLD: Resten, BG: #F3F4F6
OPPDRAGSKORT: BG: #FFFFFF, radius: 12px, skygge: lvl 1
```

---

## SKJERM 17: Temmer-portal — Diagnostikkvisning (Desktop Modal)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Diagnostikkrapport — Astrid Berntsen                           [✕ Lukk]   │  Modal header
├────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────┐  ┌──────────────────────────────┐   │
│  │                                   │  │  OPPDRAGSINFO                │   │
│  │   TUNINGKURVE                     │  │                              │   │
│  │                                   │  │  Eier: Astrid Berntsen       │   │
│  │  ┌─────────────────────────────┐  │  │  Sted: Munkegt. 14,          │   │
│  │  │+50│                        │  │  │        7013 Trondheim         │   │
│  │  │ 25│   ╭─╮                  │  │  │                              │   │
│  │  │  0│───╯ ╰─────────╮───── │  │  │  Piano: Stuepiano (Yamaha,    │   │
│  │  │-25│               ╰─    │  │  │         ca. 15 år)            │   │
│  │  │-50│                    │  │  │                              │   │
│  │  │   C1   C3   C5   C7   C8│  │  │  Score: 74/100 (God)         │   │
│  │  └─────────────────────────────┘  │  │                              │   │
│  │                                   │  │  Gj.snitt avvik: +3,2 cent   │   │
│  │  Klikk på kurven for detaljer     │  │  Verste: C6 (+22 cent)       │   │
│  │                                   │  │  Beste:  A4 (+0,3 cent)      │   │
│  └───────────────────────────────────┘  │                              │   │
│                                         │  PRIS                        │   │
│  LYDOPPTAK                              │                              │   │
│  ┌─────────────────────────────────┐   │  Kr 950,-                    │   │
│  │ ▶ ──────●───────────────── ◀   │   │  Din andel: kr 836,-         │   │
│  │ 0:00           0:18    0:32     │   │                              │   │
│  └─────────────────────────────────┘   │  Forespurt: Fre 20. mars     │   │
│  Spill av og lyt til innspillingen     │  eller etter avtale           │   │
│                                         │                              │   │
│  TANGENTLISTE (utvalg):                 │  ┌──────────────────────┐    │   │
│  ┌─────────────────────────────────┐   │  │  Akseptér oppdrag     │    │   │  Grønn knapp
│  │ Note  │  Hz      │  Cent  │ St  │   │  └──────────────────────┘    │   │
│  │ A4    │  440,1   │  +0,3  │ ✓   │   │                              │   │
│  │ C6    │  1051,2  │  +22   │ ⚠   │   │  [Avslå]                     │   │  Lenke
│  │ D3    │  146,8   │  -3,1  │ ✓   │   │                              │   │
│  └─────────────────────────────────┘   └──────────────────────────────┘   │
│  [Se full tangentliste]                                                     │
│                                                                             │
└────────────────────────────────────────────────────────────────────────────┘
Modal: 900px bred, max 90vh høy, scrollbar inne i modal
```

---

## SKJERM 18: Varselsenter

```
┌─────────────────────────────────────┐
│  ←  Tilbake                         │
│  Varsler                     [Merk alle som lest]│
├─────────────────────────────────────┤
│                                     │
│  I DAG                              │  Label CAPS grå
│                                     │
│ ┌───────────────────────────────────┐│  ULEST (blå prikk)
│ │ ●  [Foto] Lars Mikkelsen har      ││
│ │    bekreftet bookingen din!       ││
│ │    Fredag 20. mars kl. 14:00      ││
│ │    12:34                          ││
│ └───────────────────────────────────┘│
│                                     │
│ ┌───────────────────────────────────┐│  ULEST
│ │ ●  📊 Din helseosrapport er klar! ││
│ │    Se analysen av pianoet ditt.   ││
│ │    11:02                          ││
│ └───────────────────────────────────┘│
│                                     │
│  I GÅR                              │
│                                     │
│ ┌───────────────────────────────────┐│  LEST (ingen prikk, lysere BG)
│ │    [Foto] Lars Mikkelsen sendte   ││
│ │    deg en melding.                ││
│ │    Gå til meldinger               ││
│ │    I går, 18:45                   ││
│ └───────────────────────────────────┘│
│                                     │
│  VARSEL-INNSTILLINGER               │
│  [Endre hva du varsles om →]        │  Lenke til innstillinger
│                                     │
└─────────────────────────────────────┘
```

---

## SKJERM 19: Profil-innstillinger (Pianoeier)

```
┌─────────────────────────────────────┐
│  ←  Tilbake                         │
│  Min profil                         │
├─────────────────────────────────────┤
│                                     │
│      ┌─────────────────────────┐    │
│      │    [Profilfoto 80px]    │    │
│      └─────────────────────────┘    │
│      [Endre bilde]                  │  Under foto
│                                     │
│      Astrid Berntsen                │  H2 22px, sentert
│      astrid@example.com             │  14px grå
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  MITT PIANO                         │  H3 18px
│                                     │
│  Type:       Stuepiano              │
│  Merke:      Yamaha                 │
│  Alder:      Ca. 15 år             │
│              [Rediger →]            │  Lenke
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  KONTO                              │
│                                     │
│  [Endre navn →]                     │  Liste-elementer
│  [Endre e-post →]                   │
│  [Endre passord →]                  │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  VARSLER                            │
│                                     │
│  Push-varsler          [●───]       │  Toggle (på)
│  E-postvarsler         [●───]       │  Toggle (på)
│  SMS-varsler           [──●]        │  Toggle (av)
│  Påminnelser           [●───]       │  Toggle (på)
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  BETALINGSMETODER                   │
│                                     │
│  Vipps: +47 920 12 345  [Fjern]     │
│  [+ Legg til betalingsmetode]       │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  [Hjelp og støtte →]                │
│  [Personvern og vilkår →]           │
│                                     │
│ ┌───────────────────────────────────┐│
│ │          Logg ut                  ││  Sekundærknapp (outlined)
│ └───────────────────────────────────┘│
│                                     │
│  [Slett konto]                      │  Rød tekst, destruktiv
│                                     │
└─────────────────────────────────────┘
```

---

## SKJERM 20: Historikk-fane

```
┌─────────────────────────────────────┐
│  PianoHelse              🔔  👤     │
├─────────────────────────────────────┤
│                                     │
│  Historikk                          │  H1 28px
│                                     │
│  TRENDOVERSIKT                      │  H3 18px
│                                     │
│  ┌──────────────────────────────────┐│  TREND-GRAF
│  │   100│                          ││
│  │    75│         ●────────────●   ││  Score over tid
│  │    50│    ●────╯                ││
│  │    25│                          ││
│  │     0│                          ││
│  │      │────┼────┼────┼────┼────  ││
│  │      sep okt nov des jan mar    ││
│  └──────────────────────────────────┘│
│                                     │
│  ↑ Forbedret fra 68 → 74 (siste)    │  14px grønn med pil
│                                     │
│  ALLE ANALYSER                      │
│                                     │
│ ┌───────────────────────────────────┐│
│ │  15. mars 2026                    ││  ANALYSE-ELEMENT
│ │  74/100  ●●●●●●●●░░  God         ││  Fremgangsbar
│ │  Fullstendig · 88 tangenter       ││
│ │                  [Se rapport →]   ││
│ └───────────────────────────────────┘│
│                                     │
│ ┌───────────────────────────────────┐│
│ │  12. september 2025               ││
│ │  68/100  ●●●●●●●░░░  Advarsel    ││  Amber
│ │  Fullstendig · 88 tangenter       ││
│ │                  [Se rapport →]   ││
│ └───────────────────────────────────┘│
│                                     │
│ ┌───────────────────────────────────┐│
│ │  3. mars 2025                     ││
│ │  71/100  ●●●●●●●●░░  God         ││
│ │  Hvit-tangent · 52 tangenter      ││
│ │                  [Se rapport →]   ││
│ └───────────────────────────────────┘│
│                                     │
│  ALLE BOOKINGER                     │
│                                     │
│ ┌───────────────────────────────────┐│
│ │  20. mars 2026 — Bekreftet  ✓    ││  Grønn status
│ │  Lars Mikkelsen · Stuepiano       ││
│ │  kr 1 064,-                       ││
│ │                  [Detaljer →]     ││
│ └───────────────────────────────────┘│
│                                     │
├─────────────────────────────────────┤
│  🏠 Hjem   📊 Historikk  ⊕  👤 Profil│
└─────────────────────────────────────┘
```

---

## SKJERM 21: Temmer-portal — Min profil (Desktop)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  PianoHelse                                       Lars Mikkelsen  🔔  [👤]   │
├──────────┬───────────────────────────────────────────────────────────────────┤
│ [MENY]   │                                                                    │
│          │  Min profil                                [Se offentlig profil]   │
│  (se     │                                                                    │
│  sk.16)  │ ┌──────────────────────────────────────────────────────────────┐  │
│          │ │  ┌───────────┐  Lars Mikkelsen                               │  │
│          │ │  │ [Foto]    │  ★★★★☆ 4,8 · 23 anmeldelser                 │  │
│          │ │  │  120px    │  Bergen · 25 år erfaring                      │  │
│          │ │  └───────────┘  PTG-sertifisert                               │  │
│          │ │                                                               │  │
│          │ │  [Endre profilfoto]                           [Rediger profil]│  │
│          │ └──────────────────────────────────────────────────────────────┘  │
│          │                                                                    │
│          │ ┌──────────────────────────┐  ┌──────────────────────────────┐    │
│          │ │  TJENESTER OG PRISER     │  │  TJENESTEOMRÅDE              │    │
│          │ │                          │  │                              │    │
│          │ │  Stemming stuepiano:     │  │  Bosted (privat):            │    │
│          │ │  kr 950,-  [Endre]       │  │  Damsgårdsveien 85, Bergen  │    │
│          │ │                          │  │                              │    │
│          │ │  Stemming flygelformet:  │  │  Maks avstand: 40 km         │    │
│          │ │  kr 1 200,-  [Endre]     │  │  ○───────────●──────○       │    │
│          │ │                          │  │  10 km             100 km    │    │
│          │ │  Vedlikehold + stemming: │  │                              │    │
│          │ │  kr 1 500,-  [Endre]     │  │  [Oppdater tjenesteområde]  │    │
│          │ │                          │  └──────────────────────────────┘    │
│          │ │  [+ Legg til tjeneste]   │                                      │
│          │ └──────────────────────────┘                                      │
│          │                                                                    │
│          │ ┌──────────────────────────────────────────────────────────────┐  │
│          │ │  OM MEG                                             [Rediger]│  │
│          │ │                                                               │  │
│          │ │  "Jeg har stemt piano i Bergen siden 1998..."                │  │
│          │ │                                                               │  │
│          │ │  Spesialiseringer:  [Flygler] [Stuepiano] [Vintage]          │  │
│          │ │  Sertifiseringer:  [PTG] [RCT]                               │  │
│          │ └──────────────────────────────────────────────────────────────┘  │
│          │                                                                    │
└──────────┴───────────────────────────────────────────────────────────────────┘
```

---

## Interaksjonsprinsipper — Mikrotekst-referanse

### Knapp-tilstander
| Tilstand | Mikrotekst | Notater |
|---|---|---|
| Normal | "Book Lars Mikkelsen" | Klar, handlingsorientert |
| Laster | "Sender..." | Verb i presens, ingen prikker |
| Suksess | "Bestilt!" | Kortvarig (2s), deretter navigering |
| Feil | "Noe gikk galt. Prøv igjen." | Aldri teknisk feilkode til bruker |
| Deaktivert | (tooltip: "Fyll ut alle felt først") | Tooltip på hover/fokus |

### Tomme tilstander — Overskrifter
| Kontekst | Overskrift | Undertekst |
|---|---|---|
| Ingen analyser | "Ingen analyser ennå" | "Gjør din første helsesjekk av pianoet." |
| Ingen bookinger | "Ingen aktive bookinger" | "Book en stemmer etter neste analyse." |
| Ingen oppdrag (temmer) | "Ingen nye oppdrag akkurat nå" | "Vi varsler deg når nye oppdrag dukker opp." |
| Ingen anmeldelser | "Ingen anmeldelser ennå" | "Dine første anmeldelser vises her." |

### Feilmeldinger — Standardtekster
| Feil | Brukervenlig melding |
|---|---|
| Nettverksfeil | "Ingen nettverkstilkobling. Sjekk tilkoblingen og prøv igjen." |
| Server-feil | "Noe gikk galt hos oss. Prøv igjen om litt." |
| Mikrofon avvist | "Mikrofontillatelse er nødvendig. Gå til Innstillinger og aktiver mikrofon." |
| For mye støy | "For mye bakgrunnsstøy. Prøv et roligere sted." |
| Ugyldig e-post | "Skriv inn en gyldig e-postadresse." |
| Passord for kort | "Passordet må ha minst 8 tegn." |
| Booking-konflikt | "Dette tidspunktet er dessverre ikke lenger ledig. Velg et annet." |

---

*Alle wireframes er spesifisert for mobil (390px) med desktop-varianter der relevant. Implementasjon skal følge designsystem.md for alle farger, typografi og komponentspesifikasjoner.*
