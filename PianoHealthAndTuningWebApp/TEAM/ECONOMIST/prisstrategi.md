# PianoHelse — Prisstrategi

**Versjon:** 1.0
**Dato:** 20. mars 2026
**Forfatter:** Economist
**Status:** Utkast til review

---

## 1. Analyse av optimal provisjonssats

### 1.1 Hva vi selger — verdidefinisjon

PianoHelse tar betalt for å koble en kvalifisert, forhåndsverifisert kund med en stemmer som vet nøyaktig hva jobben innebærer (diagnostikkrapporten). Verdien vi leverer til stemmeren er:

1. **Leads-generering:** Stemmeren slipper å markedsføre seg selv
2. **Leads-kvalitet:** Kunden har allerede bekreftet behovet med en objektiv diagnose
3. **Administrativ forenkling:** Booking, betalingsinnkreving og kommunikasjon håndteres
4. **Omdømmebygging:** Anmeldelsessystem gir synlig troverdighet over tid

Verdien vi leverer til pianoeieren er:

1. **Trygghet:** Verifiserte fagpersoner med kjent kvalitet
2. **Bekvemmelighet:** Alt på ett sted — fra diagnose til betalt oppdrag
3. **Beslutningsgrunnlag:** Objektiv rapport gjør det lettere å si ja

### 1.2 Provisjonssats — sammenligning med konkurrenter

| Plattform | Modell | Effektiv kostnad for leverandøren | Leverandørens perspektiv |
|---|---|---|---|
| **Mittanbud (Norge)** | Abonnement + provisjon | 20–25 % av jobbverdi | Generalist — lav differensiering per bransje |
| **Thumbtack (USA)** | Lead-fee per forespørsel | Kr 50–300 per lead uavhengig av konvertering | Betaler for leads som ikke konverterer |
| **Bark.com (UK/int.)** | Abonnement | Ca. Kr 300–600/mnd fast | Betaler uavhengig av volum |
| **Finn.no Torget** | Fast annonsepris | Kr 0–199 per annonse | Ingen provisjon, men ingen kvalitetssikring |
| **Håndverkeren.no** | Provisjon | 15–20 % | Generalist, lavt volum i nisjekategorier |
| **PianoHelse (forslag)** | Provisjon | **12 % (start) → 15 % (mål)** | Spesialist med diagnostikkdata — høyere leads-kvalitet rettferdiggjør gebyr |

**Konklusjon:** 12 % er konkurransedyktig sammenlignet med generalistplattformer (Mittanbud 20–25 %). Stemmere som sammenligner vil finne PianoHelse billigere, med høyere leads-kvalitet.

### 1.3 Norsk pianostemmer-perspektiv

For å forstå hva som er akseptabelt, setter vi oss i Lars sin situasjon (se persona i kravspesifikasjon.md):

Lars har 60 faste kunder og tar ca. 30–40 oppdrag per måned. Han ønsker å fylle 10 ekstra slots per måned.

**Hva koster det ham i dag å skaffe nye kunder?**

| Kanal | Kostnad | Effektivitet |
|---|---|---|
| Finn.no-annonse | Kr 199 per annonse | Lav — konkurranse med rørleggere, malere |
| Visittkort-nettsted | Kr 200/mnd (hosting + tid) | Svært lav uten SEO |
| Muntlig anbefaling | Kr 0 | Høy, men ukontrollerbar |
| Annonsering i Facebook | Kr 500–1 000/mnd | Usikker — ingen har prøvd dette segmentet systematisk |
| **Total markedsføringskostnad** | **Ca. kr 500–1 500/mnd** | For usikker avkastning |

Med PianoHelse og 10 oppdrag per måned:
- Provisjon ved 12 %: 10 × kr 342 = **kr 3 420/mnd**
- Provisjon ved 15 %: 10 × kr 428 = **kr 4 280/mnd**

Provisjonen er høyere enn dagens annonsekostnad, men stemmeren:
- Slipper tid brukt på leads-behandling (anslått 2–3 timer/mnd)
- Får forhåndsdiagnostiserte kunder (færre no-shows og misforståelser)
- Får betaling garantert via plattformen (ingen fakturarisiko)

**Akseptabelt nivå for de fleste stemmere: 10–15 %.** 18 % er over smertegrensen for denne gruppen.

---

## 2. Anbefalte provisjonssatser og implementeringsplan

### 2.1 Introduksjonsperiode (mnd 7–12): 12 %

**Begrunnelse:**
- Senker barrieren for stemmernes adopsjon av betalingsmodell
- Signaliserer at vi verdsetter langsiktige partnerskap fremfor kortsiktig inntjening
- 12 % gir tilstrekkelig inntekt til å nå operasjonelt break-even ved ca. 47 oppdrag/mnd

**Kommunikasjon til stemmere:** "Du betaler kun når du tjener. Og du betaler 12 % — halvparten av hva Mittanbud tar."

### 2.2 Satsøkning (mnd 13–24): 15 %

**Begrunnelse:**
- Vi har da bevist verdien av plattformen med 6–12 måneder data
- Stemmerne ser at oppdragskvaliteten er høyere enn alternativer
- 15 % er vårt langsiktige mål og gir 30 % høyere marginbidrag per oppdrag vs. 12 %

**Gjennomføring:** Varsle alle stemmere 60 dager i forkant. Tilby de som har > 20 oppdrag på plattformen en 3-måneder overgangsperiode til 12 % som lojalitetsbonus.

### 2.3 Langsiktig stabilisering: 15 %

15 % er taket. Vi vil ikke stige til 18 % fordi det nærmer oss nivåene til generalistplattformer, og vår differensiering er spesialisering — ikke volum.

---

## 3. Abonnement for stemmere: "Synlighetsabonnement" vs. ren provisjon

### 3.1 Modell A: Ren provisjon (ingen abonnement)

**Fordeler:**
- Enkel å forstå og kommunisere: "Du betaler kun når du tjener"
- Ingen fastbetaling = lav inngangsbarriere
- Skalerer automatisk med stemmernes volum

**Ulemper:**
- Ingen forutsigbar inntekt for PianoHelse
- Høy churnskrisiko — stemmere kan deaktivere profilen i lavsesonger
- PianoHelse har lavere "skin in the game" i å holde stemmerne aktive

### 3.2 Modell B: Hybrid (synlighetsabonnement + lavere provisjon)

**Fordeler:**
- Stemmere med jevnt volum sparer penger (se beregning i inntektsmodell.md)
- PianoHelse får forutsigbare abonnementsinntekter
- Stemmere som betaler abonnement er mer lojale og aktive

**Ulemper:**
- Mer kompleks prisliste
- Noen stemmere vil avvise abonnementsmodellen prinsipielt

### 3.3 Anbefaling

**Start med ren provisjon (Modell A).** Tilby abonnement først når vi har > 30 aktive stemmere og minst 6 måneder data som viser at de fleste har > 5 oppdrag per måned på plattformen.

**Begrunnelse:** Abonnementsmodellen gir kun verdi for stemmere med jevnt volum. I tidlig fase er volumet for lavt til at stemmerne ser verdien. Å introdusere abonnement for tidlig kan skape negativ friksjon og redusere rekrutteringsevnen.

---

## 4. Prissensitivitetsanalyse

### 4.1 Stemmerperspektiv — sensitiv for provisjon

Vi analyserer effekten av ulike provisjonssatser på stemmernes netto per oppdrag:

| Provisjonssats | Stemmers netto per oppdrag | Reduksjon vs. ingen plattform | Terskelevalueringsresultat |
|---|---|---|---|
| 0 % (ingen plattform) | Kr 2 853 | — | Referanse |
| 10 % | Kr 2 568 | − Kr 285 (10,0 %) | Svært akseptabelt |
| 12 % | Kr 2 511 | − Kr 342 (12,0 %) | Akseptabelt — under smertegrense |
| 15 % | Kr 2 425 | − Kr 428 (15,0 %) | Akseptabelt dersom leads-kvalitet er høy |
| 18 % | Kr 2 340 | − Kr 513 (18,0 %) | Over smertegrense for mange — risiko for bypass |
| 25 % | Kr 2 140 | − Kr 713 (25,0 %) | Uakseptabelt — Mittanbud-nivå uten plattformfordel |

### 4.2 Pianoeier-perspektiv — sensitiv for pris?

Pianoeieren betaler den samme prisen (kr 2 853) uavhengig av vår provisjon — stemmeren kan velge å inkludere plattformprovisjon i sin pris eller absorbere den.

**Viktig:** Dersom stemmere begynner å heve prisene for å kompensere for vår provisjon, vil pianoeiere oppleve plattformen som dyrere enn direkte kontakt. Dette er bypass-risikoen.

**Tiltak:** Vi anbefaler at PianoHelse-bookinger prises likt som stemmernes direkte priser. Stemmerne bør absorbere provisjonen i stedet for å velte den over på kunden — leads-kvaliteten rettferdiggjør dette.

### 4.3 Provisjonssats vs. volum — effekt på total inntekt

| Sats | Oppdrag ved break-even | Total inntekt (mnd 12, 131 oppdrag) | Total inntekt (mnd 18, 305 oppdrag) |
|---|---|---|---|
| 10 % | 67 | Kr 25 083 | Kr 58 433 |
| 12 % | 47 | Kr 36 264 | Kr 84 508 |
| 15 % | 36 | Kr 51 372 | Kr 104 966 |
| 18 % | 29 | Kr 79 960 | Kr 164 055 |

**Konklusjon:** Den marginale inntektsgevinsten fra 15 % til 18 % (ca. 56 %) må veies mot risikoen for 20–30 % lavere adopsjonsrate blant stemmere, noe som lett utvisker gevinsten.

---

## 5. Freemium-strategi for pianoeiere

### 5.1 Gratisdiagnose som inngangsport

Gratisdiagnosen er kjernen i vår vekststrategi — den er ikke bare et markedsverktøy, men den faktiske produktopplevelsen som skaper tillit og initierer bookingbehov.

**Hva er gratis — alltid:**

| Funksjon | Gratis for alltid | Begrunnelse |
|---|---|---|
| Én fullstendig stemmekurve-analyse | Ja | Kjernen i lead-generering for plattformen |
| Helsekarakter (God / Trenger stell / Kritisk) | Ja | Nødvendig for konvertering til booking |
| Norsk forklaring av resultatet | Ja | Reduserer friksjon |
| "Book en stemmer"-flyt | Ja | Direkte inntektsgenererende |

**Hva er betalt (PianoHelse Pro):**

| Funksjon | Pris | Aktiveringsfase |
|---|---|---|
| Diagnostikkhistorikk (alle analyser) | Inkl. i Pro | Fase 3 |
| PDF-rapport for nedlasting | Inkl. i Pro | Fase 3 |
| Sammenligning av stemmekurver over tid | Inkl. i Pro | Fase 3 |
| Automatisk påminnelse (6/12 mnd) | Inkl. i Pro | Fase 2/3 |
| Institusjonell konto (kulturskoler, kirker) | Inkl. i Pro for institusjon | Fase 3 |

**PianoHelse Pro-priser:**
- Privat: Kr 99/mnd eller **Kr 799/år** (2 måneder gratis)
- Institusjonell: Kr 299/mnd eller **Kr 2 490/år**

### 5.2 Freemium-ratio

Bransjenorm for freemium-til-betalt konvertering: 2–8 %.

For PianoHelse anslår vi:
- Av 5 000 registrerte pianoeiere ved mnd 12 vil ca. 3 % konvertere til Pro: **150 betalende brukere**
- Inntekt: 150 × kr 799/år = **kr 119 850/år** eller **kr 9 988/mnd**

Dette er en sekundær inntektskilde i Fase 3, men bygger en interessant recurring revenue-komponent.

### 5.3 Friksjonspunkt for konvertering

Den viktigste konverteringsutløseren for Pro er **historikk-funksjonen**: etter at en bruker har utført to eller tre analyser over tid, er det naturlig å ønske å se utviklingen. Betalingsmuren bør legges nettopp her — etter den andre analysen.

---

## 6. Sammenfattet prisstrategianbefaling

| Spørsmål | Anbefaling |
|---|---|
| Startsats provisjon | **12 %** — introduksjonssats mnd 7 |
| Mål-sats provisjon | **15 %** — innføres gradvis fra mnd 13 |
| Makssats provisjon | **15 %** — 18 % anbefales ikke |
| Abonnement for stemmere | **Nei i Fase 2** — aktiveres i Fase 3 når volum er bevist |
| Boost/fremhevet plassering | **Ja fra mnd 12** — enkelt å implementere og forstå |
| PianoHelse Pro | **Nei i Fase 1–2** — aktiveres i Fase 3 |
| Gratis diagnose | **Alltid gratis** — dette er verktøyet som driver hele markedsplassen |

---

*Dokumenteier: Economist*
*Neste revisjon: Mnd 12 — vurder om satsøkning til 15 % er gjennomførbar basert på stemmertilfredshet og churn-data.*
