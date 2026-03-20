# Diagnose-validering — faglig vurdering av diagnostikkmodulen
**Versjon:** 1.0
**Dato:** 20. mars 2026
**Forfatter:** Piano Tuner Expert
**Status:** Faglig kvalitetssikring — MÅ leses av Developer og Lead

---

## Innledning

Dette dokumentet er en faglig vurdering av PianoHelses diagnostikkmodul sett fra en pianostemmers perspektiv. Det besvarer: Hva kan appen faktisk måle? Hva bør den si til brukeren? Og hva MÅ den aldri påstå?

---

## 1. UltimateDetectors egnethet for pianostemming vs. gitarstemming

### 1.1 Styrker for pianoapplikasjon

`UltimateDetector` er opprinnelig utviklet i GuitarTuner-prosjektet, men er — noe uvanlig — faktisk bedre egnet for piano enn de fleste andre instrumenter av følgende grunner:

**Frekvensdekning:**
- Pianoets register: A0 (27,5 Hz) til C8 (4186 Hz) — 88 taster
- UltimateDetector dekker dette fullt ut, inkl. ekstremt lav bass (A0–A2) via McLeod MPM-trinnet
- Gitarens register er smalere: E2 (82,4 Hz) til C6 (~1047 Hz) — UltimateDetector er over-designet for gitar

**Inharmonisitets-robusthet:**
- UltimateDetectors beslutningsmotor bruker harmonisk verifisering med **stigende toleranse for høyere harmoniske nummer** (`tol = baseTolerance + 0.005 * nearestN`)
- Dette er direkte relevant for piano fordi pianostrengers inharmonisitet gjør overtoner skarpere enn ideelle heltallsmultipla
- Gitarstrenger har lavere inharmonisitet enn pianostrenger — UltimateDetector er "over-tilpasset" for piano

**Analyse av tone-onset:**
- Piano produserer en tydelig anslag-transient etterfulgt av en jevn, lang sustain-fase
- UltimateDetector leser fra AnalyserNode-bufferen og analyserer den stabile sustain-fasen når signalet er stabilt — dette er gunstig

### 1.2 Svakheter og begrensninger

**Avslagsfasen:**
- UltimateDetector er ikke spesielt designet for å håndtere **forte-anslag med rask avslagsfase** (mange konsertstykker). I en diagnostikksituasjon er dette ikke et problem — brukeren spiller én tone av gangen og holder den.

**Ekstremt høy diskant (C7–C8):**
- Toner over ca. 2500 Hz har svært korte lydbølge-perioder og er utfordrende for alle pitch-detektorer
- 65 536-punkts FFT ved 48 kHz gir ca. 0,73 Hz per bin, som er tilstrekkelig oppløsning
- C8 (4186 Hz) er godt innenfor rekkevidde, men signalet fra en spinett eller gammelt klaver kan ha lite energi her
- Anbefaling: Brukeren bør spille **forte** (tydelig anslag) for de høyeste tonene

**A0 (27,5 Hz):**
- McLeod MPM med 8192-samplers buffer ved 48 kHz gir ~2,3 perioder av A0
- Dette er det absolutte minimum for pålitelig pitch-deteksjon; stabil avsning krever at brukeren holder tonen i minst 1–2 sekunder
- Mobilmikrofoner har typisk dårlig frekvensrespons under 80 Hz — A0 og noen B0/C1-toner kan gi upålitelige målinger

**Konklusjon:** UltimateDetector er **godt egnet** for pianodiagnostikk i midtregisteret (A1–C6), **akseptabelt** i øvre diskant (C6–C8) og **begrenset** i ytterste bass (A0–E1). Appen bør flagge målinger i dette området med lavere konfidensverdi.

---

## 2. Akseptable måletoleransen for mobilmikrofon

### 2.1 Mobilmikrofonens akustiske begrensninger

Innebygde mobilmikrofoner er designet for tale, ikke for presisjonstonal analyse. Typiske begrensninger:

| Parameter | Typisk mobilmikrofon | Kondensatormikrofon (profesjonell) |
|---|---|---|
| Frekvensrespons | 80 Hz – 12 kHz (±6 dB) | 20 Hz – 20 kHz (±2 dB) |
| Støygulv | 30–45 dB SPL | 10–20 dB SPL |
| Nøyaktighet lavt register | Dårlig under 80 Hz | God |
| Signalbehandling | Automatisk forsterkning, støyreduksjon aktivt | Ingen (bypasset) |

**Viktig:** Moderne iPhones (12 og nyere) og Samsung Galaxy S-serien har **betraktelig bedre** mikrofoner enn eldre og billigere enheter. Variansen mellom enheter er stor.

### 2.2 Hva er realistisk målenøyaktighet?

Basert på erfaring med lignende mobilbaserte stemmeverktøy (PianoMeter, PiaTune):

| Register | Realistisk nøyaktighet (mobilmikrofon, stille rom) | Kommentar |
|---|---|---|
| A0–E1 (sub-bass) | ±10–20 cent | Utenfor mikrofon-rekkevidde |
| F1–C3 (bass) | ±3–8 cent | Akseptabelt for diagnostikk |
| C3–C6 (midtregister) | ±1–4 cent | God nøyaktighet |
| C6–C7 (høy diskant) | ±2–6 cent | Akseptabelt |
| C7–C8 (ekstrem diskant) | ±5–15 cent | Kortere lydbølger, mer variabelt |

**Konklusjon for PianoHelse:**
- Appen er **ikke presisjonsverktøy på linje med ETD (Electronic Tuning Device)** brukt av fagstemmere
- Appen er et **screeningverktøy** som gir en indikasjon på om stemming er nødvendig
- For diagnostikkformål er nøyaktighet på **±5 cent i midtregisteret tilstrekkelig** — det er godt nok til å skille mellom et godt stemt og et dårlig stemt piano
- Diagnosen MÅ kommuniseres som indikativ, ikke definitiv

### 2.3 Faktorer brukeren kan kontrollere

Brukeren bør instrueres om:
1. **Stille rom** — fjern bakgrunnsstøy (TV, musikk, luftkondisjonering)
2. **Plassering**: telefon 20–30 cm fra tangentene, ikke bak lokket
3. **Spill forte** — særlig i bass og høy diskant; svake signaler gir dårligere måling
4. **Hold tonen** — hold hver tangent nede i 2–3 sekunder
5. **Ikke berør telefonen** mens du spiller — vibrasjoner forstyrrer mikrofonen

---

## 3. Railsback-referanselinjen i appen — er implementasjonen faglig korrekt?

### 3.1 Gjeldende implementasjon

Algoritme-integrasjonsdokumentet beskriver en forenklet Railsback-referanselinje modellert som en **kubisk kurve**:

```javascript
static _railsbackRef(labels, i) {
    const pos = (i / Math.max(labels.length - 1, 1)) * 2 - 1;  // -1 til +1
    return Math.round(30 * Math.pow(pos, 3) * 10) / 10;  // ±30 cent
}
```

Dette gir:
- A0: ca. −30 cent under 12-TET
- A4: ca. 0 cent (referansepunkt)
- C8: ca. +30 cent over 12-TET

### 3.2 Faglig vurdering

**Styrker:**
- S-kurveformen er korrekt — bass lavere, diskant høyere er den grunnleggende formen til Railsback-kurven
- ±30 cent representerer et **typisk gjennomsnitt** for uproblematiske pianoer
- Kubisk modell er enkel og lett å implementere uten feil

**Svakheter:**
- Den faktiske Railsback-kurven er **ikke symmetrisk** — stretchingen i ytterste diskant (C7–C8) er typisk kraftigere enn i ytterste bass
- Kurven varierer **signifikant** etter pianoets størrelse og konstruksjon:
  - Stor konserflygel (> 2 m): lavere inharmonisitet → smalere Railsback (±15–20 cent)
  - Liten spinett (< 1,3 m): høy inharmonisitet → bredere Railsback (±30–40 cent)
  - Standard hjemmepiano (klaver 1,0–1,3 m): Railsback ±20–30 cent

- Den ideelle referanselinja er **instrumentspesifikk** og beregnes riktig kun av ETD-programvare som måler inharmonisitetskonstanten (B) per streng

**Vurdering for PianoHelse:**
Den forenklede kubiske modellen er **akseptabel for diagnostikk**. Den gir brukeren et meningsfylt referansepunkt og unngår å flagge normale Railsback-avvik som feil. Den er imidlertid ikke presis nok til å brukes som grunnlag for profesjonell stemming.

**Anbefaling:**
- Behold den forenklede kubiske modellen for MVP
- Informer brukeren (tooltip eller forklaring) om at Railsback-referansen er en gjennomsnittsmodell
- I Fase 2 kan man la brukeren oppgi pianotype (stor flygel / normal flygel / klaver), og justere referansen tilsvarende

---

## 4. Hva appen skal si til brukeren ved ulike score-nivåer

### 4.1 Scoringsmetodikk

Helsescoren (0–100) beregnes av `HealthScorer` (beskrevet i algoritme-integrasjon.md) basert på vektet gjennomsnittlig cent-avvik fra Railsback-referansen. Her er de faglig korrekte tolkningene av hvert nivå.

### 4.2 Tolkningskategorier og brukerbudskap

---

#### Score 85–100: Nylig stemt, i utmerket stand

**Teknisk:** Gjennomsnittlig vektet avvik < 3 cent. Få eller ingen toner > 5 cent fra Railsback-referansen.

**Hva stemmeren ville sagt:** "Pianoet er i god stand. Intet behov for stemming akkurat nå."

**Budskap til bruker:**
> "Pianoet ditt er i utmerket stemmning! Det er nylig stemt eller har blitt holdt under gode forhold. Du trenger ikke å bestille stemming nå — sjekk igjen om 6–12 måneder, avhengig av bruksintensitet."

**Farge/indikator:** Grønn
**Anbefaling:** Ingen booking-CTA, men oppfordring til å huske neste kontroll

---

#### Score 70–84: God stand, bør stemmes innen ett år

**Teknisk:** Gjennomsnittlig avvik 3–6 cent. Noen toner nærmer seg 10 cent, men stemmebildet er jevnt.

**Hva stemmeren ville sagt:** "Pianoet er OK, men bør stemmes innen de neste 6–12 månedene."

**Budskap til bruker:**
> "Pianoet ditt er i akseptabel stand, men vi ser tegn på at stemmningen begynner å sige. Mange pianoeiere merker ikke dette selv, men det påvirker musikkopplevelsen over tid. Vi anbefaler stemming innen de neste 6–12 månedene."

**Farge/indikator:** Lysgrønn/gul
**Anbefaling:** Mild CTA — "Book stemmer" med soft tone

---

#### Score 50–69: Merkbar forringelse, bør stemmes innen 3–6 måneder

**Teknisk:** Gjennomsnittlig avvik 6–12 cent. Flere toner over 10 cent. Tydelig asymmetri mellom registrene er mulig.

**Hva stemmeren ville sagt:** "Pianoet trenger stemming — det er merkbart ute av stemmning for en trent lytter."

**Budskap til bruker:**
> "Pianoet ditt trenger stemming. Vi måler et gjennomsnittlig avvik på ca. [X] cent — det betyr at du setter pris på en stemmer snart. For barn som lærer å spille, er dette særlig viktig: å øve på et falskt piano kan forstyrre gehørutviklingen. Vi anbefaler stemming innen 3–6 måneder."

**Farge/indikator:** Gul/oransje
**Anbefaling:** Tydelig CTA — "Book stemmer"

---

#### Score 30–49: Trenger stemming snart — tydelig hørbar skjevhet

**Teknisk:** Gjennomsnittlig avvik 12–20 cent. Mange toner over 15 cent. Tydelig register-ubalanse er vanlig.

**Hva stemmeren ville sagt:** "Pianoet er klart nedstemt og hørbart falskt. Stemming bør skje snart."

**Budskap til bruker:**
> "Pianoet ditt er tydelig ute av stemmning — avviket er nå stort nok til at de fleste vil høre det. Vi anbefaler at du bestiller en stemmer snart. Det er lurt å informere stemmeren om at det kan gå en stund siden sist stemming, slik at hen kan planlegge riktig tid."

**Farge/indikator:** Oransje/rød
**Anbefaling:** Sterk CTA — "Bestill stemming nå"

---

#### Score under 30: Kritisk — mulig pitch raise nødvendig

**Teknisk:** Gjennomsnittlig avvik > 20 cent. Mulig mange toner > 30 cent. Kan indikere at pianoet ikke har vært stemt på mange år.

**Hva stemmeren ville sagt:** "Pianoet er svært nedstemt. Enkel stemming vil ikke holde — vi må vurdere opptrekk og kanskje to separate besøk."

**Budskap til bruker:**
> "Pianoet ditt er i kritisk stand. Det har sannsynligvis stått ustemte i mange år, og det er mulig at en normal stemming ikke vil holde. Stemmeren kan trenge å gjennomføre et 'opptrekk' (pitch raise) — en ekstra runde for å løfte tonehøyden gradvis opp til riktig nivå. Dette kan bety to separate besøk og litt høyere kostnad enn en vanlig stemming. Vi anbefaler at du kontakter en stemmer snarest mulig."

**Farge/indikator:** Rød
**Anbefaling:** Meget sterk CTA + opptrekk-informasjon + kostnadsvarsling

---

### 4.3 Ekstra kommunikasjon ved spesifikke funn

| Funn | Tilleggsbudskap |
|---|---|
| En enkelt tone avviker mye mer enn nabotonene (> 20 cent mer) | "Tone [X] avviker uvanlig mye. Det kan tyde på en brutt streng, løs stemmenål eller en streng som har hoppet av stolen. Be stemmeren sjekke dette spesielt." |
| Toner i ytterste bass (A0–E1) er flagget med lav konfidensverdi | "Målinger for de dypeste basstonene er usikre — mobilmikrofoner har begrenset rekkevidde i dette området. Stemmeren vil sjekke disse manuelt." |
| Gjennomsnittlig avvik antyder opptrekk-behov | Se score under 30 ovenfor. |
| Stor forskjell mellom bassregister og diskantregister | "Det er uvanlig stor forskjell i stemmetilstand mellom bass og diskant. Dette kan tyde på at pianoet ble stemt uferdig sist, eller at det er spesielle forhold i ett register." |

---

## 5. Hva kan og hva kan ikke en mobilapp diagnostisere?

### 5.1 Innenfor appens kapasitet

- Grov stemmetilstand per tone (tonehøyde vs. forventet frekvens)
- Gjennomsnittlig avviksnivå over hele klaviaturet
- Registerspesifikt avvik (bass / midtregister / diskant)
- Indikasjon på opptrekk-behov (basert på avviksmagnitude)
- Enkle outlier-toner (toner som avviker mye fra nabotonene)

### 5.2 Utenfor appens kapasitet — krever fagperson

| Problem | Hvorfor appen ikke kan detektere det |
|---|---|
| **Regulering** (tangentfall, hammerslag) | Mekanisk — ikke akustisk |
| **Intonasjon** (hammerfilm-hardhet) | Klangkvalitet, ikke tonehøyde |
| **Pedaler** (demperfeil, mekanisk slitasje) | Mekanisk |
| **Strukturelle skader** (sprekker i lydplate, rust) | Visuell/taktil inspeksjon |
| **Pinnebrett-tilstand** (løse stemmenåler) | Indikeres delvis av ustabile avlesninger, men ikke pålitelig |
| **Unisonfeil** | Vanskelig å skille fra naturlig inharmonisitet via mobilmikrofon |
| **Tangentmisfarging, tangentblokker** | Visuelt |
| **Stemmebestandighet** | Krever målinger over tid |

---

## 6. Ansvarsfraskrivelse — juridiske og faglige råd til appens formuleringer

### 6.1 Juridisk grunnlag

PianoHelse-diagnosen er **ikke et sakkyndig uttalelse** og kan ikke brukes som grunnlag for forsikringskrav, kjøp/salg-tvister eller lignende. Diagnosen er et digitalt screeningverktøy på linje med egendiagnose-apper i helsesektoren.

### 6.2 Obligatoriske ansvarsfraskrivende formuleringer

Følgende formuleringer MÅ inkluderes i appen — ikke bare i vilkårene, men synlig i diagnostikkresultatet:

**I resultatvisningen:**
> "Denne rapporten er basert på lydanalyse via mobilmikrofon og gir en indikasjon på stemmebehov. Den erstatter ikke faglig vurdering av en autorisert pianostemmer. Miljøfaktorer som bakgrunnsstøy, rommets akustikk og telefonmodell kan påvirke nøyaktigheten."

**I rapporten sendt til pianoeier:**
> "PianoHelses diagnostikk er et indikativt verktøy — ikke en faglig sertifisering av pianoets tilstand. Kun en autorisert pianostemmer kan gi en fullstendig vurdering av instrumentet, inkludert mekanikk, regulering og strukturelle forhold."

**I bookingforespørselen til stemmeren:**
> "Diagnostikkrapporten er generert automatisk og er ment som veiledning. Stemmerens faglige vurdering på stedet har alltid forrang."

### 6.3 Hva appen ALDRI skal si

- "Pianoet ditt er perfekt stemt" — dette kan misforstås som en garanti
- "Pianoet trenger ikke stemmes på [X] år" — stemming-behov avhenger av faktorer appen ikke kan måle
- "Streng [X] er brutt" — appen kan indikere at en tone avviker, men kan ikke diagnostisere årsaken
- "Det koster kr X å utbedre dette" — prissetting er stemmerens ansvar

### 6.4 Håndtering av feil og lave konfidensverdier

Appen bør **ikke skjule usikkerhet**. Toner med lav konfidensskår bør:
- Vises med stiplet kontur i stemmekurven
- Merkes med "!" og teksten: "Usikker måling — spill tonen igjen eller la stemmeren sjekke"
- Holdes utenfor helsescore-beregningen (eller vektes ned) for å unngå å trekke scoren ned basert på dårlige data

### 6.5 SNR-sjekk og brukeradvarsler

`HealthScorer`-modulen og `PianoScanner`-klassen bør implementere følgende sjekker med tydelig brukermelding:

| Situasjon | Melding til bruker |
|---|---|
| For mye bakgrunnsstøy | "Vi registrerer for mye bakgrunnsstøy. Skru av TV/musikk og prøv igjen." |
| Mikrofontilgang nektet | "Appen trenger mikrofontilgang for å analysere pianoet. Tillat mikrofon i nettleserinnstillingene." |
| Ingen tone detektert etter 8 sekunder | "Vi hørte ikke noen tone. Sørg for å spille tydelig og hold tangenten nede i 2–3 sekunder." |
| Feil tone spilt | "Det ser ut som du spilte en annen tangent enn forventet. Vi venter på tone [X] — [notebeskrivelse]." |
| For få toner analysert (< 10 av 52) | "For få toner ble analysert til å gi en pålitelig helsescore. Fullfør minst 20 tangenter." |
