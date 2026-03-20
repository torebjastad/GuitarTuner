# PianoHelse — Risikoregister
**Versjon:** 1.0
**Dato:** 20. mars 2026
**Forfatter:** Lead Coordinator
**Status:** Levende dokument — oppdateres løpende

---

## Formål

Dette risikoregisteret identifiserer, vurderer og prioriterer risikoer som kan true PianoHelse sitt mål om en vellykket MVP-lansering og videre vekst. Registeret brukes aktivt i prosjektstyringsmøter og revideres ved hvert sprint-skifte eller vesentlig endring i prosjektets kontekst.

**Metodikk:**
- Sannsynlighet: 1 (svært lav) → 5 (svært høy)
- Konsekvens: 1 (minimal) → 5 (prosjektdrepende)
- Risikoscore = Sannsynlighet × Konsekvens (maks 25)
- Risikonivå: 1–4 Lav | 5–9 Medium | 10–14 Høy | 15–25 Kritisk

---

## Risikoregister — Full oversikt

| ID | Risiko | Kategori | Sannsynlighet (1–5) | Konsekvens (1–5) | Risikoscore | Risikonivå | Eier |
|---|---|---|---|---|---|---|---|
| R-01 | For få stemmere ved lansering (chicken-and-egg) | Operasjonell | 4 | 5 | 20 | Kritisk | Lead + Marketing |
| R-02 | Lav diagnostisk nøyaktighet på mobiltelefoner | Teknisk | 3 | 4 | 12 | Høy | Developer |
| R-03 | GDPR-brudd ved lydopptak og persondata | Regulatorisk | 2 | 5 | 10 | Høy | Lead + Developer |
| R-04 | Stemmere omgår plattformen etter første møte (disintermediation) | Finansiell | 4 | 4 | 16 | Kritisk | Lead + Economist |
| R-05 | Markedsvolum er for lavt (nok pianoer i aktiv bruk?) | Marked | 3 | 4 | 12 | Høy | Economist |
| R-06 | Mittanbud eller annen generalist kopierer diagnostikk | Marked | 2 | 4 | 8 | Medium | Lead |
| R-07 | UltimateDetector feiler på sterkt nedstemmede pianoer | Teknisk | 3 | 3 | 9 | Medium | Developer |
| R-08 | Stripe-integrasjon feiler eller utsettes (Vipps mangler) | Teknisk | 2 | 4 | 8 | Medium | Developer |
| R-09 | Seed-finansiering lar vente på seg / lukkes ikke | Finansiell | 3 | 5 | 15 | Kritisk | Lead |
| R-10 | Dårlig presseomtale (teknisk feil ved journalisttest) | Marked | 2 | 4 | 8 | Medium | Marketing + Developer |
| R-11 | Nøkkelperson forlater prosjektet (Developer, Lead) | Operasjonell | 2 | 5 | 10 | Høy | Lead |
| R-12 | MVA-struktur for provisjon forkastes av Skatteetaten | Regulatorisk | 2 | 4 | 8 | Medium | Economist + juridisk |
| R-13 | iOS Safari-kompatibilitetsbrudd ved ny iOS-versjon | Teknisk | 2 | 3 | 6 | Medium | Developer |
| R-14 | Stemmer opptrer uredelig i kundens hjem | Operasjonell | 1 | 5 | 5 | Medium | Lead + Piano-Tuner |
| R-15 | Bruker saksøker PianoHelse for feil diagnoseresultat | Regulatorisk | 1 | 4 | 4 | Lav | Lead + juridisk |

---

## Detaljerte risikobeskrivelser og tiltak

### R-01: For få stemmere ved lansering (chicken-and-egg)
**Kategori:** Operasjonell
**Sannsynlighet:** 4/5 — Meget sannsynlig uten aktiv rekrutteringsinnsats
**Konsekvens:** 5/5 — Plattformen er verdiløs uten stemmere på tilbudssiden
**Risikoscore:** 20 — Kritisk

**Beskrivelse:**
Pianoeiere som fullfører diagnostikken finner ingen tilgjengelige stemmere i sitt postnummerområde. Frustrasjon og negativ word-of-mouth i tidlig fase kan ødelegge omdømmet permanent. Med kun 66 NPTF-stemmere i hele Norge og de fleste konsentrert i Oslo, er dette en reell og sannsynlig risiko — særlig for brukere utenfor de 5 største byene.

**Tiltak:**
1. Rekrutter minimum 15–20 stemmere i Oslo FØR offentlig lansering (via NPTF, direkte oppsøking, LinkedIn).
2. Definer en intern regel: aldri markedsfør appen aktivt i en by uten minimum 3 registrerte aktive stemmere.
3. Design "Ingen stemmere i ditt område"-skjerm med konstruktive alternativer (NPTF-kontakt, venteliste-registrering).
4. Tilby gratis plattformtilgang i 12 måneder (ikke 6) til de første 20 stemmerne — sterkt incentiv for selvstendig næringsdrivende.
5. "Concierge MVP": manuell matching av forespørsler og stemmere i oppstartsperioden, uavhengig av automatisk geomatching.

**Eier:** Lead Coordinator + Marketing
**Revisjonsfrekvens:** Månedlig

---

### R-02: Lav diagnostisk nøyaktighet på mobiltelefoner
**Kategori:** Teknisk
**Sannsynlighet:** 3/5 — Middels sannsynlighet basert på kjente iOS-begrensninger
**Konsekvens:** 4/5 — Feil diagnostikk ødelegger kjerneproduktets troverdighet
**Risikoscore:** 12 — Høy

**Beskrivelse:**
UltimateDetector er utviklet og testet på desktop (Chrome, Firefox). Mobilmikrofoner — særlig billige Android-modeller — kan ha lavere SNR, automatisk lydprosessering (noise cancellation, AGC) som forstyrrer tonehøydemåling, og begrensede sample-rater. iOS Safari har spesifikke begrensninger for AudioContext og getUserMedia. Pianotoner i bassregisteret (A0 = 27,5 Hz) er særlig krevende for mobilmikrofoner med lavfrekvensbegrensning.

**Tiltak:**
1. Gjennomfør systematisk testing på minimum 10 enhetsmodeller (iOS: iPhone 12, 14, 15; Android: Samsung Galaxy A-serie, Pixel, OnePlus).
2. Implementer SNR-sjekk og gi brukeren konkret tilbakemelding ved for mye støy.
3. Legg til gain-normalisering: mål bakgrunnsnivå 2 sekunder FØR scanning starter.
4. Definer tydelig minimumsgaranti: diagnostikken er validert for toner over 110 Hz (A2) på standard mobiltelefon. Advarselen kommuniseres åpent.
5. Vurder krav om ekstern mikrofon (3,5 mm) som anbefalt tilbehør for lavest register.

**Eier:** Developer
**Revisjonsfrekvens:** Etter hver test-runde

---

### R-03: GDPR-brudd ved lydopptak og persondata
**Kategori:** Regulatorisk
**Sannsynlighet:** 2/5 — Relativt lav dersom teknisk arkitektur er korrekt implementert
**Konsekvens:** 5/5 — Datatilsynet-bøter (opptil 4 % av global omsetning eller EUR 20M), omdømmeskade, potensielt driftstans
**Risikoscore:** 10 — Høy

**Beskrivelse:**
PianoHelse behandler lydopptak, e-postadresser, postnummer, navn og betalingsinformasjon. Selv om kjernearkitekturen (klient-side lydanalyse) minimerer risiko, er det mange potensielle feilpunkter: manglende DPA med Supabase/Resend/Stripe, utilstrekkelig samtykkeimplementasjon, for lang lagringsperiode for lydopptak, eller manglende RoPA (Record of Processing Activities).

**Tiltak:**
1. Opprett komplett GDPR-dokumentasjon (`PRODUCT/gdpr-og-juridisk.md`).
2. Signer DPA eksplisitt med alle databehandlere: Supabase, Resend, Stripe.
3. Implementer differensierte lagringsperioder: lydopptak slettes 30 dager etter fullfort oppdrag, JSON-data max 3 år med samtykke.
4. Implementer eksplisitt cookie-banner (ikke pre-avkrysset) for analytiske cookies.
5. Søk juridisk rådgivning med GDPR-spesialist FØR lansering.
6. Implementer RoPA og hold den oppdatert.

**Eier:** Lead Coordinator + Developer
**Revisjonsfrekvens:** Kvartalsvis

---

### R-04: Stemmere omgår plattformen etter første møte (disintermediation)
**Kategori:** Finansiell
**Sannsynlighet:** 4/5 — En kjernerisiko for alle markedsplasser — sannsynlig uten motmekanismer
**Konsekvens:** 4/5 — Ødelegger provisjonsinntektene og insentiverer ikke stemmere til å forbli aktive
**Risikoscore:** 16 — Kritisk

**Beskrivelse:**
Etter at en pianoeier og en stemmer har møttes via plattformen, har begge parter et insentiv til å gjenta transaksjonen direkte — stemmeren beholder 18 % mer, eieren betaler eventuelt litt mindre. Dette er et iboende strukturelt problem for alle markedsplasser og er ikke adressert i noen eksisterende dokumenter. Med en provisjon på 18 % og gjennomsnittsoppdrag på kr 2 853 er besparelsen kr 513 per oppdrag — et sterkt insentiv.

**Tiltak:**
1. Design verdien slik at plattformen er åpenbart bedre enn direkte kontakt: diagnostikkrapport, betalingssikkerhet, anmeldelser, forsikringsdekning, refusjonsgaranti.
2. Lås anmeldelsessystemet til plattformbestilte oppdrag — stemmere som omgår plattformen bygger ikke omdømme her.
3. Tilby pianoeiere garantier som kun er tilgjengelig via plattformen: refusjonsgaranti, forsikringsbevis, verifisert stemmeridentitet.
4. Lojalitetsprogram for pianoeiere: rabatt på 4. og 5. bestilling.
5. Akseptable bruksvilkår for stemmere MÅ eksplisitt forby direkte kontakt med kunder rekruttert via plattformen (med rimelig unntak for eksisterende kundeforhold).

**Eier:** Lead Coordinator + Economist
**Revisjonsfrekvens:** Halvårlig

---

### R-05: Markedsvolum er for lavt
**Kategori:** Marked
**Sannsynlighet:** 3/5 — Usikkert, men reellt basert på at mange pianoer er inaktive
**Konsekvens:** 4/5 — Investor-case kollapser, ingen vei til lønnsomhet
**Risikoscore:** 12 — Høy

**Beskrivelse:**
Masterplanen estimerer 75 000–120 000 pianoer i Norge. Det reelle adresserbare markedet kan være langt lavere: digitale pianoer er ikke relevante, mange akustiske pianoer er i ikke-bruk, mange eiere vil aldri bruke en mobilapp, og mange har faste stemmer-relasjoner. Realistisk TAM kan være 15 000–30 000 husholdninger — ca. 1/4 av toppestimatet.

**Tiltak:**
1. Economist gjennomfører realistisk bottom-up TAM-analyse med nedre grenser.
2. Valider markedsvolum via spørreundersøkelse (500 respondenter via Facebook-grupper for pianoeiere).
3. Investor-pitchen justeres til å bruke det konservative estimatet som baseline-case.
4. Vurder om digitalpiano-service (reparasjon, oppgradering) kan supplere markedsvolum på sikt.

**Eier:** Economist + Lead Coordinator
**Revisjonsfrekvens:** Kvartalsvis

---

### R-06: Mittanbud eller generalist kopierer diagnostikk
**Kategori:** Marked
**Sannsynlighet:** 2/5 — Relativt lav på 12 måneders horisont, men stigende over tid
**Konsekvens:** 4/5 — Taper konkurransefortrinn og markedsandel
**Risikoscore:** 8 — Medium

**Beskrivelse:**
Mittanbud (Verdane Capital) har kapital og teknologikompetanse til å bygge pianodiagnostikk. Thumbtack og Bark.com kan gå inn i Norge. Det teknologiske grunnlaget (Web Audio API + pitch detection) er ikke patentert og kan bygges av et kompetent team på 3–6 måneder.

**Tiltak:**
1. Bygg 12–18 måneders teknologisk forsprang gjennom lansering og iterasjon.
2. Prioriter nettverkseffekter fremfor teknologisk moat: stemmernettverket og historisk diagnosedatabase er vanskeligere å kopiere enn algoritmene.
3. Vurder eksklusivitetsavtaler med NPTF og nøkkelstemmere.
4. Monitorér Mittanbud og konkurrentenes utvikling kvartalsvis.

**Eier:** Lead Coordinator
**Revisjonsfrekvens:** Kvartalsvis

---

### R-07: UltimateDetector feiler på sterkt nedstemmede pianoer
**Kategori:** Teknisk
**Sannsynlighet:** 3/5 — Reell risiko for eldre, neglekterte instrumenter
**Konsekvens:** 3/5 — Diagnostikken feiler på instrumentet som trenger hjelp mest
**Risikoscore:** 9 — Medium

**Beskrivelse:**
Et piano som ikke er stemt på 10–20 år kan ha toner 100–200 cent (1–2 halvtoner) under riktig frekvens. PianoScanner bruker `GODKJENT_AVSTAND = 0.35 semitoner` for å bekrefte at riktig tast er spilt — dersom tonen er 2 halvtoner ute, vil ingen tone bekreftes og timeout inntreffer for alle taster. Diagnostikken feiler fullstendig.

**Tiltak:**
1. Implementer "grov deteksjonsmodus" med bredere `GODKJENT_AVSTAND` (2,5 semitoner) for å identifisere systematisk nedstemt piano.
2. Detekter gjennomsnittlig frekvensforskyvning og informer brukeren om opptrekk-behov.
3. Legg til onboarding-spørsmål: "Vet du omtrent når pianoet sist ble stemt?" — dersom "aldri" eller "mer enn 10 år siden" → vis advarsel og anbefal fysisk besiktigelse.

**Eier:** Developer
**Revisjonsfrekvens:** Etter første tekniske test-runde

---

### R-08: Stripe-integrasjon feiler eller Vipps mangler i lansering
**Kategori:** Teknisk
**Sannsynlighet:** 2/5 — Lav for Stripe, medium for Vipps
**Konsekvens:** 4/5 — Manglende betaling via Vipps vil skade konverteringsraten betydelig i norsk marked
**Risikoscore:** 8 — Medium

**Beskrivelse:**
Vipps er den dominerende betalingsmetoden i Norge (>4 millioner brukere). Stripe støtter ikke Vipps direkte. Masterplanen utsetter Vipps til Fase 2, noe som er en kalkulert risiko. Norske forbrukere forventer Vipps ved betaling. En MVP som kun tilbyr kortbetaling kan oppleve lav betalingskonvertering.

**Tiltak:**
1. Kommuniser tydelig til testbrukere at Vipps kommer i Fase 2 — sett forventninger tidlig.
2. Vurder alternativ: Nets Easy (norsk betalingsleverandør med innebygd Vipps-støtte) som alternativ til Stripe for NOK-betaling.
3. MVP kan utsette betaling til Fase 2 (stemmere fakturerer direkte) — dette er allerede planen og reduserer risikoen i MVP.

**Eier:** Developer + Lead Coordinator
**Revisjonsfrekvens:** Etter beta-test

---

### R-09: Seed-finansiering lar vente på seg
**Kategori:** Finansiell
**Sannsynlighet:** 3/5 — Tidligfasefinansiering er krevende i norsk marked
**Konsekvens:** 5/5 — Uten finansiering stopper hele prosjektet
**Risikoscore:** 15 — Kritisk

**Beskrivelse:**
Investorpitchen søker kr 3 500 000 i seed-runde. Det norske tidligfasemarkedet er lite og konservativt. Innovasjon Norge-søknader kan ta 3–6 måneder. Engelinvestorer i musikkteknologi er krevende å finne og overbevise. Dersom finansiering utsettes, utsettes hele veikart med tilsvarende tid.

**Tiltak:**
1. Prioriter Innovasjon Norge-søknad parallelt med investordialog — ikke sekvensielt.
2. Utforsk bootstrapping-alternativ: kan MVP bygges med egne midler og frivillig arbeid inntil første 100 oppdrag er gjennomført?
3. Vurder Kickstarter / pre-salg som alternativt finansieringsverktøy og markedsvalidering.
4. Bygg investor-pipeline aktivt: Norse VC, Katapult, Antler (Oslo), relevante engelinvestorer via StartupNorway.
5. Ha en "plan B" for null ekstern finansiering: smal MVP med diagnostikk-only, manuell booking, og volontørteam.

**Eier:** Lead Coordinator
**Revisjonsfrekvens:** Månedlig

---

### R-10: Dårlig presseomtale ved teknisk feil i journalisttest
**Kategori:** Marked
**Sannsynlighet:** 2/5 — Lav dersom teknisk testing er grundig
**Konsekvens:** 4/5 — Negativ presseomtale i Aftenposten/NRK kan stoppe veksten i oppstartsfasen
**Risikoscore:** 8 — Medium

**Beskrivelse:**
Lanseringsstrategien planlegger en PR-push til Aftenposten, NRK og Dagbladet (Uke 3–4 etter soft launch). Dersom en journalist tester appen på sin egen mobiltelefon (eldre Android, dårlig mikrofon, støyende kontor) og diagnostikken gir feil resultater eller appen krasjer, kan den journalistiske vinkelen snu fra positiv til negativ.

**Tiltak:**
1. Gjennomfør grundig QA på minst 10 mobilenheter FØR PR-push.
2. Tilby journalister et kontrollert testmiljø (stille rom, anbefalt mobil, ferdig klart piano) ved pressevisning.
3. Kommuniser klart at diagnostikken er "indikativ" og gir nyanser, ikke absolutte svar.
4. Ha en PR-kriseberedskapsplan: hvem svarer media, hva er standardsvaret ved teknisk feil.

**Eier:** Marketing + Developer
**Revisjonsfrekvens:** Pre-lansering

---

### R-11: Nøkkelperson forlater prosjektet
**Kategori:** Operasjonell
**Sannsynlighet:** 2/5 — Lav men ikke usannsynlig for et startup
**Konsekvens:** 5/5 — Tap av Lead eller Developer kan stoppe prosjektet
**Risikoscore:** 10 — Høy

**Beskrivelse:**
Som et tidligstadium prosjekt med et lite team er avhengigheten av nøkkelpersoner høy. Lead Coordinator og Developer sitter på kritisk kunnskap som ikke er dokumentert godt nok til at en erstatning raskt kan ta over.

**Tiltak:**
1. Dokumenter all kritisk kunnskap løpende — kode, arkitekturavgjørelser, kontaktnett.
2. Sørg for at minst to personer har tilgang til alle kritiske systemer (kodebase, Supabase, Stripe, domene).
3. Definer onboarding-dokumentasjon for alle nøkkelroller.
4. Vurder retention-incentiver (aksjer, medeierskap) for kritiske teammedlemmer.

**Eier:** Lead Coordinator
**Revisjonsfrekvens:** Halvårlig

---

### R-12: MVA-struktur for provisjonsmodell forkastes av Skatteetaten
**Kategori:** Regulatorisk
**Sannsynlighet:** 2/5 — Usikker juridisk grense, men lav dersom korrekt struktur velges
**Konsekvens:** 4/5 — Kan endre hele forretningsmodellens lønnsomhet
**Risikoscore:** 8 — Medium

**Beskrivelse:**
PianoHelse handler potensielt som "disclosed agent" (opptrer tydelig som mellomledd) eller "undisclosed agent" (opptrer som reell tjenesteleverandør). I sistnevnte tilfelle er PianoHelse ansvarlig for MVA på hele transaksjonsbeløpet (25 % av kr 2 853 = kr 713 per oppdrag) — ikke bare provisjonen.

**Tiltak:**
1. Innhent skatterådgivning fra revisor med MVA-kompetanse FØR Fase 2 betalingsmodell implementeres.
2. Definer PianoHelse klart som "disclosed agent" (mellomledd) i brukervilkårene og betalingsflyt.
3. Fakturabasert provisjonsmodell (stemmeren fakturerer kunden direkte, PianoHelse fakturerer stemmeren for lead-fee) eliminerer MVA-risikoen, men er mer kompleks å implementere.

**Eier:** Economist + juridisk rådgiver
**Revisjonsfrekvens:** Pre-Fase 2

---

### R-13: iOS Safari-kompatibilitetsbrudd ved ny iOS-versjon
**Kategori:** Teknisk
**Sannsynlighet:** 2/5 — Apple endrer Safari-API-er jevnlig
**Konsekvens:** 3/5 — Diagnostikken slutter å fungere for iOS-brukere inntil bugfix
**Risikoscore:** 6 — Medium

**Beskrivelse:**
iOS Safari er historisk sett den mest restriktive nettleseren for Web Audio API. Apple har ved flere anledninger endret atferden for getUserMedia, AudioContext og MediaRecorder i iOS-oppdateringer. En ny iOS-versjon kan bryte diagnostikken uten forvarsel.

**Tiltak:**
1. Sett opp automatisert testing mot alle iOS-beta-versjoner via BrowserStack.
2. Abonner på Apple WebKit-endringer og Safari Technology Preview.
3. Hold koden isolert slik at iOS-spesifikke kodeveier er lett identifiserbare og patchbare.

**Eier:** Developer
**Revisjonsfrekvens:** Ved Apple iOS-oppdateringer

---

### R-14: Stemmer opptrer uredelig i kundens hjem
**Kategori:** Operasjonell
**Sannsynlighet:** 1/5 — Svært lav, men eksistensielt for omdømme
**Konsekvens:** 5/5 — Én alvorlig hendelse kan ødelegge hele merkevarens troverdighet
**Risikoscore:** 5 — Medium

**Beskrivelse:**
Stemmerens oppdrag skjer i kundens private hjem. En uredelig aktør som registrerer seg som stemmer og utnytter tilgang til hjemmet er et lavt-sannsynlig men høy-konsekvens scenario. PianoHelse har plattformansvar for hvem de slipper inn hos kundene.

**Tiltak:**
1. Minimum verifisering: org.nr. kontrollert mot Brønnøysundregistrene, NPTF-sertifikatnummer bekreftet.
2. Anmeldelsessystemet identifiserer raskt dårlige aktører — oppdrag er kun tilgjengelige for stemmere med akseptabel rating etter første 3 oppdrag.
3. Vilkårene MÅ inkludere en disclaimer om at PianoHelse ikke erstatter brukerens egen vurdering av stemmerens egnethet.
4. Rask respons-prosedyre ved klager: stemmerprofil suspenderes umiddelbart ved alvorlig klage, manuell gjennomgang innen 24 timer.

**Eier:** Lead Coordinator + Piano-Tuner Expert
**Revisjonsfrekvens:** Halvårlig

---

### R-15: Bruker saksøker PianoHelse for feil diagnoseresultat
**Kategori:** Regulatorisk
**Sannsynlighet:** 1/5 — Svært lav, særlig med korrekte ansvarsfraskrivelser
**Konsekvens:** 4/5 — Juridiske kostnader og omdømmeskade
**Risikoscore:** 4 — Lav

**Beskrivelse:**
En pianoeier handler på et "God"-resultat, lar være å stemme, og pianoet forringes videre. Eller diagnostikken sier "Kritisk" og stemmeren forverre en allerede kritisk situasjon (f.eks. knekker streng under opptrekk) basert på diagnostikkrapporten. Brukeren holder PianoHelse ansvarlig.

**Tiltak:**
1. Tydelig ansvarsfraskrivelse på resultatsiden (ikke bare i vilkårene): "Diagnostikken er indikativ og måler kun tonehøyde. Kontakt en fagperson for full fysisk vurdering."
2. Juridisk gjennomgikk brukervilkår med ansvarsbegrensningsklausuler FØR lansering.
3. Vurder ansvarsforsikring (professional liability insurance) for plattformoperatøren.

**Eier:** Lead Coordinator + juridisk rådgiver
**Revisjonsfrekvens:** Halvårlig

---

## Risikomatrise — Visuell oversikt

```
Konsekvens
    5 |  R-03   |  R-01  R-04  R-09  |  R-11  |
      |         |                    |        |
    4 |  R-12   |  R-02  R-05  R-10  |        |
      |         |  R-06  R-08        |        |
    3 |         |  R-07              |        |
      |         |                    |        |
    2 |         |                    |        |
      |         |                    |        |
    1 |         |  R-15              |  R-14  |
      |---------|--------------------|-----------------
      |    1    |         2–3        |   4–5  |
                    Sannsynlighet

    [ ] Lav (1–4)  [·] Medium (5–9)  [■] Høy (10–14)  [█] Kritisk (15–25)
```

---

## Kritiske risikoer som krever umiddelbar oppmerksomhet

| Prioritet | Risiko | Handling innen |
|---|---|---|
| 1 | R-09: Seed-finansiering | Investordialog og IN-søknad: uke 1–2 |
| 2 | R-04: Disintermediation | Definer motmekanismer i vilkår og produktdesign: uke 2 |
| 3 | R-01: For få stemmere | Start NPTF-rekruttering nå, parallelt med utvikling |
| 4 | R-03: GDPR-brudd | Fullfør gdpr-og-juridisk.md og sign DPA: uke 1–2 |
| 5 | R-02: Mobil diagnostikk | Planlegg enhetstest-runde i uke 4–6 |

---

## Endringslogg

| Versjon | Dato | Endring | Endret av |
|---|---|---|---|
| 1.0 | 20.03.2026 | Første versjon — 15 risikoer identifisert og vurdert | Lead Coordinator |

---

*Risikoregisteret revideres ved starten av hver ny fase og ved vesentlige endringer i markedsforholdene, teamsammensetningen eller teknisk arkitektur.*
*Dokumenteier: Lead Coordinator*
