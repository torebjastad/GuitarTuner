# PianoHelse — Design-kritikk
## Lead UX/UI Designer — Evaluering av opprinnelig konseptdokument

**Dato:** Mars 2026
**Kilde for kritikk:** "Piano Health & Tuning Marketplace.md" (opprinnelig PRD)
**Vurderingsnivå:** Konstruktiv, strategisk

---

## 1. Sammendrag

Det opprinnelige konseptdokumentet er et solid utgangspunkt. Det definerer produktets kjerne korrekt og identifiserer to distinkte brukergrupper. Imidlertid er det et strategidokument, ikke et designdokument — og den visuelle retningen er beskrevet på et for overordnet og vagt nivå til å gi reell designveiledning. Dette dokumentet identifiserer hva som er sterkt, hva som mangler, og gir konkrete forbedringsforslag.

**Overordnet vurdering:** 6/10 — Godt fundament, men designer trenger langt mer konkretisering.

---

## 2. Sterke sider ved opprinnelig konsept

### 2.1 Klar verdiforslag-definisjon

PRD'en treffer kjernen presist: diagnostikk FØR booking er det genuint differensierende elementet. Formuleringen "diagnostic data is attached automatically" (seksjonen om Service Request) er designmessig nøkkelkonsekvensen — den forklarer hvorfor denne plattformen er overlegen Google-søk og Mittanbud.

**Designmessig konsekvens:** Helseosrapporten og tuningkurven er ikke støttefunksjoner — de er kjerneproduktet. Designet må behandle dem deretter: de trenger mest visuell tyngde, mest tid i onboarding, og mest gjennomarbeidet presentasjon.

### 2.2 To-sidig markedsplass-erkjennelse

PRD'en skiller tydelig mellom Piano Owner App (mobil) og Tuner Web Portal (desktop). Dette er korrekt og viktig — de to brukergruppene har radikalt ulik kontekst, ulike mål og ulik teknologibruk. Å sette dette opp som to separate produktoverflater er riktig arkitektonisk beslutning.

### 2.3 Fast pris som frisksjons-reduksjon

"Fixed Pricing" er nevnt som prinsipp. Dette er en innsiktsfull designbeslutning — det fjerner en av de største friksjonspunktene i anbud-modellen (forhandling). Designet må kommunisere dette tydelig til begge parter.

---

## 3. Svake sider og mangler

### 3.1 Visuell retning er for vag og intern

**Sitert fra PRD:**
> "Professional & Precise: High-contrast graphs, clean typography, and a 'technical yet accessible' feel."
> "Trustworthy: A color palette that evokes craftsmanship (e.g., deep blues, warm wood tones, or ivory/ebony accents)."
> "Functional: Clear calls to action and intuitive navigation."

**Kritikk:**
Disse beskrivelsene er konseptuelt riktige, men praktisk ubrukelige for en designer, utvikler eller QA. "High-contrast graphs" — hva betyr høy kontrast? Mellom hva? "Deep blues" — hvilken blå? "Clean typography" — hvilken skrift?

Enhver konkurrent kunne skrive nøyaktig de samme setningene. Det finnes ingen differensiering, ingen konkretisering og ingen hjelp til implementasjon.

**Konkret forbedring:**
Se designsystem.md for fullstendig spesifikasjon. Visuell retning skal alltid inneholde:
- Konkrete hex-koder (ikke bare fargebeskrivelser)
- Navngitte skriftvalg (ikke bare "clean typography")
- Referanseapper for inspirasjon
- Hva vi IKKE skal ligne på

### 3.2 Tuningkurven er underutviklet

PRD'en nevner "tuning curve analysis" og "visual graph showing deviation of each recorded note from ideal pitch." Dette er korrekt, men designutfordringen er enorm og ikke nevnt.

**Problemer PRD ikke adresserer:**
- Hvordan forstår en ikke-teknisk bruker (Astrid) en y-akse med "cent"-avvik?
- Hva er de visuelle terskelverdiene? (God / Advarsel / Kritisk)
- Interaktivitet på grafen? Mobiloptimalisering?
- Fargeblinde brukere — avhenger kurven kun av farge for mening?
- Historisk overlay — kan bruker sammenligne kurver over tid?

**Konkret forbedring:**
Grafpresentasjonen trenger sin egen designspesifikasjon (se wireframe SKJERM 10 i skjermbilder.md for fullstendig spec). Enhver "data visualization" i en produkt-PRD trenger en dedikert design-seksjon.

### 3.3 Helsescoren er ikke definert

PRD bruker ordene "Good", "Needs Attention", "Critical" uten å definere:
- Hva er den matematiske grensen mellom kategoriene?
- Er det en enkelt score (0–100) eller kun kategorier?
- Hva er algoritmen bak?

**Designmessig konsekvens:**
Uten definerte terskler kan ikke designeren lage korrekte fargekodinger, animasjoner eller mikrotekst. Vi vet ikke om 74% er "Good" eller "Needs Attention" uten disse grensene.

**Konkret forbedring:**
Designsystem og wireframes har nå definert:
- Score 70–100: "God stemming" (grønn)
- Score 40–69: "Bør stemmes" (amber)
- Score 0–39: "Trenger stemming" (rød)

Dette må bekreftes av produktteamet mot den faktiske pitch-detection-algoritmen.

### 3.4 Onboarding-flyten er ikke adressert

PRD hopper direkte til features uten å adressere ny-bruker-opplevelsen. For en app der kjernehandlingen (ta opp pianolyd) er uvant og teknisk — er onboarding kritisk for at brukere ikke dropper ut.

**Mangler:**
- Velkomstflyt (rolle-valg)
- Piano-oppsett (type, alder, merke)
- Mikrofonillatelse-forklaring
- Første-gangs scanning-guide (særskilt veiledning for nybegynnere)

**Konkret forbedring:**
Se brukerflyt.md seksjon 1 for komplett onboarding-spesifikasjon.

### 3.5 Feiltilstander er ikke nevnt

PRD beskriver kun "happy path" — det ideelle scenariet der alt fungerer. Ingenting om:
- Hva skjer om brukeren er i et for støyende rom?
- Hva om mikrofontillatelse avslås?
- Hva om nettverkstilkobling faller bort under opptak?
- Hva om ingen temme​re finnes i brukerens område?
- Hva om en temmer kansellerer?

**Designmessig konsekvens:**
Feiltilstander er der produkter vinner eller taper tillit. Airbnb er ikke flott fordi det ser bra ut — det er flott fordi det håndterer edge cases med omsorg og klarhet.

**Konkret forbedring:**
Se wireframes SKJERM 8 for feil-tilstander under opptak. Samtlige kritiske feiltilstander er nå spesifisert i skjermbilder.md.

### 3.6 Temmer-portalen er skissemessig behandlet

Desktop-portalen er nærmest et etterspill i PRD. Den får to kulepunkter (Assignment Feed og Diagnostic Review) vs. fem for piano-eier-appen. Men Lars (pianotemmer) er en like kritisk bruker — uten temme​re er plattformen verdiløs.

**Mangler:**
- Temmer-onboarding og verifisering
- Profilbygger (kompetanse, priser, sertifiseringer, bilde)
- Inntektsoversikt og utbetalingsflyt
- Anmeldelseshåndtering (respondere på, flagge misbruk)
- Kommunikasjonssystem (in-app meldinger)
- Kalender-integrasjon (Google Calendar / iCal sync)

**Konkret forbedring:**
Se brukerflyt.md seksjon 6 for fullstendig temmer-registrerings- og administrasjonsflyt. Se SKJERM 16, 17 og 21 i skjermbilder.md for desktop-wireframes.

### 3.7 Betalingsflyt er ikke spesifisert

PRD nevner "commission-based" og "fixed pricing" men gir ingen detaljer om:
- Hvem betaler hvem og når?
- Holdes penger i escrow til jobben er fullfort?
- Hvilke betalingsmetoder støttes? (Vipps er kritisk for norsk marked)
- Refusjonspolicy?
- Moms-håndtering?
- Faktura for B2B-kunder?

**Designmessig konsekvens:**
Betalingsflyt er direkte avhengig av disse avklaringene. Designet i booking-bekreftelsen (SKJERM 14) har antatt escrow-modell med Vipps-støtte — dette må bekreftes av produktteam og økonom.

---

## 4. Tilgjengelighetsgap

### 4.1 Ingen nevnelse av tilgjengelighet

PRD nevner ikke WCAG, universell utforming, eller tilgjengelighet i det hele tatt. For en norsk app i 2026 er dette en alvorlig mangel — ikke bare etisk, men juridisk.

**Norsk lov:**
Likestillings- og diskrimineringsloven § 17 krever at IKT-løsninger rettet mot allmennheten tilfredsstiller WCAG 2.1 nivå AA. Bøter for manglende etterlevelse finnes.

**Kritiske tilgjengelighetspunkter som PRD mangler:**
1. Tuningkurven kommuniserer tilstand via farge (grønn/amber/rød) — uten tekst-alternativ er dette utilgjengelig for fargeblinde (~8% av norske menn)
2. Lydopptak-UX er avhengig av synlig visuell feedback — hva med døve brukere (unikt tilfelle: de kan eie piano men ikke høre det)
3. Tastaturnavigasjon for desktop-portal
4. Skjermleser-støtte for interaktive grafer (hva leser VoiceOver opp for tuningkurven?)
5. Mikrokopiens kompleksitetsnivå — norsk lesbarhet må testes

**Konkret forbedring:**
Samtlige wireframes i skjermbilder.md inkluderer ARIA-noter og tilgjengelighetsspesifikasjoner. Designsystem.md inneholder komplett WCAG 2.1 AA-kontrasttabell.

---

## 5. Manglende brukerforankring

### 5.1 Ingen personas

PRD beskriver brukergrupper som kategorier ("Piano Owners", "Piano Tuners") men ikke som mennesker. Uten personas er det umulig å avgjøre design-dilemmaer: Bør vi forklare "cent" som begrep eller skjule det? Svaret avhenger av hvem Astrid er — og PRD gir oss ikke Astrid.

**Konkret forbedring:**
Se ux-research.md for fullstendige personas med sitater, atferdsmønstre og jobs-to-be-done.

### 5.2 Ingen forklaring av eksisterende brukeratferd

PRD beskriver ikke hvordan brukere løser problemet i dag. Uten dette vet vi ikke hvor høy "switching cost" er — og dermed ikke hvor overbevisende verdiforslaget må være.

**Konkret forbedring:**
Se ux-research.md seksjon 3 for fullstendig kartlegging av eksisterende løsninger og smerteanalyse.

---

## 6. Spesifikke visuelle anbefalinger

### 6.1 Unngå generisk "tech-app" estetikk

Mange fintech- og health-apper ser identiske ut: hvit bakgrunn, blå knapper, avrundede hjørner. PianoHelse har mulighet til å differensiere seg visuelt gjennom sin musikk/håndverk-identitet. Elfenben-tonen (#F5F0E8) og mahogny-referansen i designsystemet er nettopp dette — de skiller oss fra en generisk booking-app.

**Anbefaling:** Bruk elfenben som bakgrunnsfarger for informasjonskort og sekundærflater. Unngå kun blå/hvitt-kombinasjoner.

### 6.2 Tuningkurven trenger en "wow-moment"

Første gang en bruker ser sin egen tuningkurve, skal det oppleves som avslørende og fascinerende — ikke kjedelig og teknisk. Den animerte innteiknings-effekten (kurven tegner seg opp over 800ms) og det interaktive "trykk for å se detaljer" er designgrep som skaper dette øyeblikket.

**Anbefaling:** Invester i kurve-animasjonen og mobil-touch-interaktivitet. Dette er det visuelle "øyeblikket av sannhet" i produktet.

### 6.3 Score-ringen er et nøkkelelement

En enkel sirkulær helsescore (som Apple Watch Fitness Rings) er langt mer emosjonelt engasjerende enn en tallverdi alene. Animasjonen fra 0 → 74 gir en følelse av at appen "avslører" resultatet, ikke bare viser et tall.

**Anbefaling:** Ikke erstatt score-ringen med en fremdriftslinje eller tekst-basert score. Den sirkulære formen refererer til en klaviaturets repetative syklus av oktaver og er semantisk passende.

### 6.4 Temmer-portalen trenger en annen farge-identitet

Fordi temme​re er profesjonelle brukere med et arbeidsverktøy-mindset, kan portalen tilpasses:
- Mørk sidemeny (#1B2B4B) gir et mer "professional dashboard"-utseende
- Tettere informasjonstetthet (ikke mobiloptimert på desktop)
- Tekniske detaljer (tuningkurve, Hz-verdier) presentert mer prominentlt

**Anbefaling:** Gjennomfør to separate design-auditer etter lansering — én for piano-eier-appen, én for temmer-portalen.

---

## 7. Prioritert handlingsliste for produktteamet

Basert på denne kritikken, anbefaler designteamet at følgende avklaringer gjøres FØR detaljert implementering begynner:

| Prioritet | Avklaring | Ansvarlig |
|---|---|---|
| P0 | Definer matematisk grense mellom score-kategoriene | Produkt + Tech |
| P0 | Bekreft escrow-modell og utbetalingstidspunkt | Økonom + Produkt |
| P0 | Bekreft Vipps-integrasjon som primær betalingsmetode | Tech + Økonom |
| P1 | Spesifiser temmer-verifiseringsprosess (ID-sjekk) | Produkt + Legal |
| P1 | Definer kansellerings- og refusjonspolicy | Legal + Økonom |
| P1 | Avklar ARIA-spec for tuningkurve med tech-team | Designer + Tech |
| P2 | Bestem om BankID skal brukes for fremtidig tillit | Produkt |
| P2 | Definer om temmer kan avslå enkelt-kunder | Produkt |

---

## 8. Konklusjon

Det opprinnelige konseptdokumentet stiller de riktige spørsmålene og definerer en reell markedsmulighet. Men design kan ikke bygges på "deep blues" og "technical yet accessible" alene.

Det viktigste designteamet har levert i denne fasen er:

1. **Konkret fargepalett** med hex-koder og kontrasttesting
2. **Personas** som gjør design-beslutninger mulige
3. **Fullstendige wireframes** for alle 21 nøkkelskjermer
4. **Feiltilstands-spesifikasjoner** som PRD overser
5. **Tilgjengelighets-krav** forankret i norsk lov

Neste steg er prototype-testing med faktiske pianoeiere og pianotemme​re — aldri design i et vakuum.

---

*Dette dokumentet er en faglig kritikk med konstruktivt formål. Alle anbefalinger er implementert i designsystem.md, brukerflyt.md og skjermbilder.md.*
