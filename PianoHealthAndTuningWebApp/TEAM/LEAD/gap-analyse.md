# PianoHelse — Gap-analyse og kritisk gjennomgang
**Versjon:** 1.0
**Dato:** 20. mars 2026
**Forfatter:** Senior produktkonsulent (ekstern gjennomgang)
**Status:** Fullstendig første gjennomgang — ALLE gap identifisert

---

## Formål

Dette dokumentet er en konstruktiv, rigorøs kritikk av alt arbeidet gjort til nå på PianoHelse. Målet er å identifisere og adressere alle gap, inkonsistenser, svakheter og manglende elementer **før en eneste linje produksjonskode skrives**. Dokumentet er organisert i fem hoveddeler: strategi, teknologi, design, marked og jus/compliance.

---

## 1. Strategiske gap

### 1.1 Inntektsmodellen er underutviklet for provisjonsfasen

**Gap:** Masterplanen nevner 10–15 % provisjon i Fase 2, men det er ikke analysert hva dette gjør med stemmerens økonomi kontra Mittanbud-alternativet. Mittanbud tar 8–15 % avhengig av kategori, men har mye større volum. En stemmer med Kr 2 853 per oppdrag mister Kr 285–428 per jobb via PianoHelse — det er et reelt argument for at stemmeren heller fakturerer direkte etter å ha funnet kunden via plattformen.

**Konsekvens:** Risikoen for "disintermediation" (at stemmere og eiere avtaler direkte etter første møte) er ikke nevnt noe sted i dokumentene. Dette er en kjernerisiko for alle markedsplasser og er ikke adressert.

**Tiltak:** Economist-teamet MÅ analysere denne risikoen og foreslå motmekanismer: anmeldelsessystemet låst til plattformbestilte oppdrag, garantier eller forsikring kun via plattform, lojalitetsprogrammer.

---

### 1.2 Chicken-and-egg er ikke fullt løst — bare delvis adressert

**Gap:** Masterplanen og lanseringsstrategien erkjenner problemet og foreslår "supply first" + "gratis plattform i 12 måneder". Men det er et annet kritisk aspekt: **hva skjer med de første 50 pianoeierne som kjører diagnostikk, men det ikke er noen stemmere i deres postnummerområde?**

Med kun 25–30 NPTF-stemmere i hele Oslo-regionen, og en rekrutteringsmålsetting på 15–20 stemmere FØR lansering, vil det aldri finnes dekning for alle postnummer i Oslo. En pianoeier på Grorud som diagnostiserer pianoet og ikke finner en stemmer innenfor akseptabel radius, er en tapt bruker — og en som trolig snakker negativt om plattformen.

**Spesifikt manglende scenario: Hva vises til en pianoeier som har fullført diagnostikk, men det ikke finnes noen tilgjengelig stemmer i radius?** Ingen av de eksisterende dokumentene håndterer dette. Det finnes ingen "tom tilstand" for "ingen stemmere i ditt område", og ingen alternativ handlingsplan.

**Tiltak:**
- Design en spesifikk "Ingen stemmere i ditt område"-skjerm med alternativt call-to-action (registrer deg på venteliste, vi rekrutterer stemmere i ditt område, eller ta kontakt med nasjonal stemmer som reiser).
- Definer en minstegrense: aldri markedsfør appen i en geografi uten minimum 3 aktive stemmere.

---

### 1.3 Digitale pianoer er et uadressert problem

**Gap:** Pianoregisteret i Norge inkluderer et betydelig antall digitale pianoer. Disse **trenger ikke og kan ikke stemmes akustisk**. Likevel vil diagnostikken i teorien produsere en stemningskurve også for disse — og den vil vise nesten perfekte verdier (digitale pianoer er alltid "perfekt stemt" fordi de er digitale). En pianoeier med en Clavinova vil se grønn helsestatus og spørre seg: "Trenger jeg å stemme dette?"

Problemet er todelt:
1. Diagnostikken er meningsløs for digitale pianoer — den måler ikke det den er ment å måle.
2. Pianobutikker selger Yamaha Clavinovas (digitale), og vi vil sannsynligvis inngå partnerskap med dem. De sender oss kunder som ikke trenger tjenesten.

**Merk:** `TEAM/DEVELOPER/teknisk-arkitektur.md` lister digitalklaver som en pianotype i databaseskjemaet, men det er ingen logikk for å håndtere dette annerledes.

**Tiltak:** Legg til digital piano-deteksjon i onboarding-flyten. Hvis bruker oppgir "digitalt piano" → diagnostikken deaktiveres med en tydelig forklaring. Tilby i stedet service-informasjon eller link til digitalpiano-support.

---

### 1.4 Svært gamle pianoer — det "uoppstigende" pianoet

**Gap:** Et piano som ikke har vært stemt på 30–50 år, som har rustne strenger, et sprukket lydskjell eller knekte stifter, er kanskje **ikke stembart i det hele tatt**. Å sende en stemmer til et slikt instrument er et waste of time — og stemmeren er profesjonell nok til å se dette ved ankomst, men diagnostikken vil vise "kritisk" og anbefale stemming.

Ingen steder i dokumentene diskuteres scenarioet der stemmeren ankommer og konstaterer at pianoet trenger reparasjon, ikke stemming — eller er kondemnabelt. Hvem betaler for stemmeren reisekostnader i dette tilfellet? Hva sier vilkårene?

**Tiltak:**
- Legg til spørsmål i onboarding om "sist stemt" og "alder". Hvis "aldri stemt" + "over 30 år gammel" → vis en advarsel og anbefal fysisk besiktigelse fremfor diagnostikk.
- Betalingsflyt og vilkår MÅ inkludere en policy for "non-tunable piano" — hva kunden betaler og hva stemmeren kompenseres for.

---

### 1.5 Distrikt-Norge — det uadresserte geografiske gapet

**Gap:** Planen er Oslo-fokusert, noe som er riktig taktisk. Men det er ikke adressert hva som skjer med brukere i distriktene som finner appen (via Google SEO, som er nasjonalt) men ikke kan bruke den fordi det ikke finnes stemmere i nærheten.

Med kun 66 NPTF-stemmere i **hele** Norge, og de fleste konsentrert i de 5 største byene, betyr dette at store deler av Norge (Innlandet, Nordland, Møre og Romsdal etc.) ikke vil ha dekning i mange måneder eller år.

En bruker fra Namsos som gjennomfører diagnostikken og ser "Kritisk stemmetilstand — ingen stemmere tilgjengelig i ditt område" er ikke bare en tapt konvertering — det er en person som nå vet at tjenesten ikke kan hjelpe dem. De vil fortelle andre om dette.

**Tiltak:** Legg til et "landlig modus" der brukere uten stemmerdekning tilbys:
1. Kontaktinfo til NPTF for å finne regional stemmer.
2. En "Registrer interesse"-funksjon som bygger et regionalt etterspørsels-signal vi kan bruke til å rekruttere stemmere.
3. Tydelig kommunikasjon: "Vi er ikke der ennå, men jobber med å ekspandere."

---

### 1.6 Hva hvis Mittanbud tilbyr pianodiagnostikk?

**Gap:** Masterplanen nevner Mittanbud som en risiko og foreslår å bygge et "defensivt forsprang gjennom diagnostikkdata". Dette er en svak forsvarsposisjon. Mittanbud-eieren Verdane Capital har kapital til å kjøpe eller kopiere det teknologiske grunnlaget. Den virkelige barrieren er ikke teknologien (som er open source), men nettverkseffekten og dataen.

Problemet er at vi ikke har tydeliggjort **hva nettverkseffekten egentlig er** og **hva data-moaten betyr konkret**. "Vi eier dataen fra hver diagnose" er nevnt, men det er ikke forklart hvordan denne dataen gir oss en vedvarende fordel.

**Tiltak:** Economist og Lead MÅ utarbeide en konkret moat-analyse:
- Hva er det et stemmer-nettverk unikt ved PianoHelse kan tilby som Mittanbud ikke kan (spesialisert vurdering, pianospesifikk diagnostikk, Railsback-analyse for stemmer)?
- Hva er dataen fra 10 000 diagnoser verdt? (Aggregert piano-helseindeks per by? Prediktiv modell for stemmefrekvens?)

---

### 1.7 Kvalitetskontroll for stemmere er underutviklet

**Gap:** Dokumentene sier stemmere MÅ "godkjennes manuelt av PianoHelse-teamet (MVP)". Men hva betyr "godkjenning"? Det er ingen definert sjekkliste, ingen minimumskrav for ikke-NPTF-stemmere, og ingen plan for hva som skjer dersom en registrert stemmer gjør en dårlig jobb.

Koordinasjonsloggen nevner at `stemmer-krav.md` skal lages av Piano Tuner Expert, men dette dokumentet eksisterer ikke ennå — og det er ikke noe fallback-krav i kravspesifikasjonen.

**Spesifikt gap:** Hva skjer dersom en stemmer:
- Gjør skade på pianoet?
- Ikke møter opp?
- Ikke fullfører jobben tilfredsstillende?
- Er uredelig med sin fagkompetanse (hevder NPTF-autorisasjon uten å ha det)?

Ingen av disse scenarioene er adressert i noen av dokumentene.

**Tiltak:** Definer minimum verifiseringskrav i kravspesifikasjonen (org.nr. påkrevd, forsikringsbevis påkrevd, NPTF-sertifikat kontrolleres mot NPTF-register om mulig). Legg til en tvisteløsningsprosess.

---

## 2. Tekniske gap

### 2.1 iOS Safari getUserMedia — kritisk plattform-risiko

**Gap:** Teknisk-arkitektur.md har en seksjon 4.1 om iOS Safari som er relativt god, men den mangler to kritiske problemer:

**Problem A — Permission state etter avvisning:** Hvis brukeren avviser mikrofontilgangen på iOS, kan ikke JavaScript kalle `getUserMedia` igjen i samme sesjon. Brukeren MÅ gå til iPhone Innstillinger → Safari → Mikrofon for å endre tillatelse. Dette er ikke selvforklarende. Brukerflyt-dokumentet (Trinn 1.5) nevner "Åpne innstillinger"-lenke, men en `deep link` til iOS-innstillingene for en spesifikk nettside fungerer **ikke** fra Safari-browseren — det er kun mulig fra native apps. Dette betyr at feilhåndteringen skissert i brukerflyt-dokumentet er teknisk umulig å implementere slik den er beskrevet.

**Problem B — AudioContext autoplay policy:** iOS Safari suspenderer AudioContext dersom den ikke er opprettet i en direkte brukerhendelse (touch/click). Koden i `algoritme-integrasjon.md` håndterer dette med `resume()`, men det er ikke spesifisert hva som skjer dersom AudioContext er i `interrupted`-tilstand (f.eks. etter et innkommende anrop under scanning). Scanning vil stille stoppe uten brukerfeedback.

**Tiltak:**
- Legg til en eksplisitt "Slik aktiverer du mikrofon i Safari"-guide med skjermbilder som vises ved avvisning (ikke en deep link — en visuell guide).
- Legg til lytting på `audioContext.onstatechange` og varsle brukeren ved `interrupted`-tilstand.

---

### 2.2 Lydnivå-normalisering for stille pianoer

**Gap:** Kravspesifikasjonen (F-D-07) nevner SNR-sjekk og bakgrunnsstøy-håndtering, men det er ingen krav om **gain-normalisering for svake signaler**. Mange pianoer — spesielt eldre, slitte instrumenter eller dempede pianoer — produserer veldig lite lyd. Når brukerens telefon ikke er plassert optimalt, eller pianoeieren bruker en av de tynne, eldre tangentstrengsbaserte instrumentene, kan signalnivået være for lavt for UltimateDetector.

Algoritme-integrasjonsrapporten nevner at `MIN_KLARHET` settes til 0.45, men det er ikke spesifisert hva som skjer dersom alle notedeteksjoner returnerer -1 (ingen deteksjon) fordi signalet er for svakt.

**Konkret risiko:** En bruker med et gammelt, nedstemt flygelklaver i et teppetelagt rom scanner alle 52 taster uten at én eneste tone detekteres. Appen markerer alle som "ikke detektert" og produserer en helseanalyse basert på 0 datapunkter. `HealthScorer.score()` i algoritme-integrasjon.md returnerer `{ status: 'utilstrekkelig_data' }` — men det er ingen UX for dette scenarioet i brukerflyt.md.

**Tiltak:**
- Legg til en automatisk gain-estimering i `startMikrofon()`: mål RMS-nivå i 2 sekunder før scanning starter; dersom signalnivå er for lavt, vis en advarsel: "Pianoet virker veldig stille. Prøv å plassere telefonen nærmere tangentkassen, eller spill litt hardere."
- Design en eksplisitt UX-skjerm for "Utilstrekkelig data — for få noter detektert".

---

### 2.3 Piano sterkt ute av stemning — UltimateDetector-grensen

**Gap:** UltimateDetector er validert for gitarbruk (typisk avvik fra referanse: < 50 cent). Et piano som er sterkt nedstemt — f.eks. et piano som ikke er stemt på 15 år — kan ha toner som er 100–200 cent (1–2 halvtoner) under riktig frekvens. `PianoScanner.skannNote()` bruker `GODKJENT_AVSTAND = 0.35 semitoner` for å bekrefte at riktig tast er spilt. Dersom tonen er 2 halvtoner ute, vil **aldri** bekreftes — timeout inntreffer for alle taster.

Resultatet er at diagnostikken feiler fullstendig på det instrumentet som trenger hjelp mest.

**Tiltak:**
- For første scanning-pass: bruk en bredere `GODKJENT_AVSTAND` (f.eks. 2.5 semitoner) for å identifisere grovt avvik.
- Detekter dersom gjennomsnittlig detektert frekvens er systematisk forskjøvet fra referanse (indikator på at pianoet trenger pitch raise / opptrekk), og informer bruker.
- Algoritme-integrasjonsdokumentet bør spesifisere en "grov deteksjonsmodus" for sterkt nedstemmede instrumenter.

---

### 2.4 Bakgrunnsstøy-håndtering mangler konkret spesifikasjon

**Gap:** F-D-07 sier systemet "MÅ gi feilmelding ved for mye bakgrunnsstøy (SNR-sjekk)". Men:
- Det er ikke spesifisert hva SNR-terskelen er.
- Det er ikke spesifisert hvilken SNR-beregningsmetode som brukes (vi befinner oss i klient-side JS uten referanseopptak av stillhet).
- Det er ikke spesifisert hva som skjer med noter som delvis ble forstyrret (registrert men med lav klarhet).

**Tiltak:** Developer MÅ spesifisere SNR-beregning (f.eks.: mål bakgrunnsstøynivå i 1 sekund FØR bruker spiller første tast; bruk dette som referanse for hele skannesesjonen). Legg til konkret SNR-terskelverdi i kravspesifikasjonen.

---

### 2.5 Databaseskjema — manglende felt og edge cases

**Gap:** Databaseskjemaet i teknisk-arkitektur.md er gjennomarbeidet, men mangler følgende:

**A — Tvistefelter:** Det finnes ingen felter i `oppdrag`-tabellen for å registrere tvistehistorikk, refunderings-state, eller manuell administrator-intervensjon. Dersom en pianist klager på en stemmer, har plattformadministratoren ingen database-støtte for å registrere utfallet.

**B — Kanselleringsfelter:** Statusen `kansellert` finnes, men det er ingen felt for:
- Hvem kansellerte (eier eller stemmer)?
- Årsak til kansellering?
- Kansellerings-tidspunkt?
- Om kansellering skjedde innenfor gratis-tidsvinduet?

**C — Opptrekk-indikator:** Diagnostikken kan beregne om pianoet trenger opptrekk (pitch raise), men dette er ikke lagret i `helseanalyser`-tabellen som et eget felt. Stemmeren ser dette ikke direkte.

**D — Stemmer-geografisk dekning:** `stemmer_profiler.rekkevidde_km` er en enkelt radius fra et fast punkt. Men stemmere kan ha kompleks geografisk dekning (f.eks. "Oslo og Follo, men ikke nordre Akershus"). PostGIS-integrasjonen er kommentert ut — dette er et reelt teknisk gap for matching.

**E — Logg for GDPR-forespørsler:** Det finnes ingen tabell for å logge innsynsforespørsler, sletteforespørsler og hva som ble gjort. GDPR artikkel 30 krever behandlingsprotokoll.

**Tiltak:** Opprett en `gdpr_logg`-tabell. Legg til kanselleringsfelt i `oppdrag`. Legg til `opptrekk_indikert BOOLEAN` i `helseanalyser`. Definer en `tvister`-tabell for Fase 2.

---

### 2.6 Betalingsflyt edge cases er ikke adressert

**Gap:** Betalingsarkitekturen (Stripe Connect) er godt beskrevet for "happy path", men følgende scenarioer mangler fullstendig:

**A — Refusjon:** Hvem initierer refusjon? Under hvilke omstendigheter? Hvem bærer Stripe-gebyret (ikke-refunderbart)? Hvor lang tid har pianoeier på å kreve refusjon?

**B — Delvis refusjon:** Stemmeren møtte opp men kunne bare delvis stemme pianoet (f.eks. noen tangenter umulige å stemme uten reparasjon). Betaler pianoeier fullt? Halvt?

**C — Stripe Connect-konto ikke fullt onboardet:** Dersom stemmeren godtar et oppdrag uten å ha fullført Stripe Express-onboarding (stripe_onboarded = false), vil transferen feile ved fullføring. Hva er fallback?

**D — Betalingsfeil etter aksept:** PaymentIntent opprettes ved aksept, men kunden betaler ikke umiddelbart (kortbetaling kommer ved bekreftelse). Dersom betalingen mislykkes etter at stemmeren allerede har stilt opp, er det ingen definert prosess.

**Tiltak:** Legg til refusjonspolicy i brukervilkår. Dokumenter edge-cases i api-design.md. Legg til pre-check av `stripe_onboarded` i `aksepter-oppdrag` Edge Function — avvis aksept dersom onboarding ikke er fullført.

---

### 2.7 GDPR — datalagringsperiode for lydopptak er for generisk

**Gap:** Teknisk-arkitektur.md sier "automatisk sletting av lydopptak etter 180 dager". Men dette er ikke begrunnet og er trolig for lang tid.

Lydopptak av pianoer i et hjem er knyttet til en spesifikk adresse og kan indirekte avsløre hvem som bor der (bakgrunnslyder, stemmer, etc.). I en GDPR-analyse bør formålsbegrensningen styre lagringstiden:

- Formålet er å la stemmeren forberede seg til oppdraget.
- Etter at oppdraget er fullført, er lydopptaket ikke lenger nødvendig for dette formålet.
- En 180-dagers periode etter **fullføring av oppdraget** er vanskelig å begrunne. 30 dager er mer forsvarlig.

**Tiltak:** Differensier lagringsperioder:
- Lydopptak: Slettes 30 dager etter oppdrag er fullfort (eller 30 dager etter opplasting dersom ingen booking).
- JSON-analysedata: Kan lagres inntil 3 år (historikkformål) med samtykke.
- Personopplysninger: Slettes 30 dager etter konto-sletting.

---

### 2.8 Supabase Frankfurt-region — GDPR DPA-status

**Gap:** Teknisk-arkitektur.md sier Supabase Frankfurt (eu-central-1) er tilstrekkelig for GDPR. Dette stemmer i prinsippet, men:
- Supabase er et US-selskap (Delaware Corp). Databehandleravtale (DPA) MÅ signeres eksplisitt — det er ikke tilstrekkelig å bare velge EU-region.
- Supabase bruker AWS som underliggende infrastruktur. AWS er ikke automatisk GDPR-compliant uten SCCs (Standard Contractual Clauses).
- Dersom Supabase benytter support-personale i USA til feilsøking, kan dette utgjøre et dataoverføringsproblem.

**Tiltak:** Dokumenter eksplisitt at DPA med Supabase er signert. Vurder om vi trenger en norsk/EU-basert alternativ BaaS (f.eks. Neon.tech med EU-hosting, eller selfhosted Supabase på DigitalOcean Amsterdam).

---

## 3. Design-gap

### 3.1 Drop-off under den 5–8 minutter lange skannesesjonen

**Gap:** Brukerflyt.md anerkjenner at skanningen tar 5–8 minutter og har implementert en mellomstatus ved 50% (Trinn 2.4). Men:

- Det er ingen "resume"-funksjonalitet. Dersom telefonen låser seg, noen ringer, eller appen crasher midtveis, mister brukeren alt fremgang.
- Det er ingen mekanisme for å lagre delresultater til IndexedDB og gjenoppta skanningen.
- Trinn 2.3 viser en "Avbryt"-knapp men ingen "Lagre og fortsett later"-funksjon.

Basert på forskning fra mobilopptak-UX (nevnt i ux-research.md) er 5–8 minutter en kritisk drop-off terskel. Mange brukere vil bli avbrutt — av barn, av telefoner, av at pianoet er i et annet rom.

**Tiltak:** Design og implementer en "Gjenoppta skanning"-flyt. Lagre fremdrift til IndexedDB for hvert bekreftet note-resultat. Vis "Du har en ufullstendig skanning — fortsett der du slapp?" ved neste åpning av appen.

---

### 3.2 Tomt-tilstand: "Ingen stemmere i ditt område" mangler helt

**Gap:** Designsystem.md (seksjon 5.9) har en generisk tom-tilstand komponent, men brukerflyt.md mangler fullstendig en skjerm for scenarioet der ingen stemmere er tilgjengelige. Dette er ikke et kanttilfelle — det er et forventet scenario i lanseringsperioden for alle brukere utenfor Oslo.

**Tiltak:** Design en spesifikk "Ingen stemmere i ditt område"-skjerm (se kravspec-oppdatering for krav). Gi brukeren nyttige alternativer: NPTF-nettsted, manuell kontaktinfo-lenke, "Varsle meg når stemmere er tilgjengelige i [postnummer]".

---

### 3.3 Stemmerportalen er underdesignet for desktop

**Gap:** Brukerflyt.md (seksjon 8, Temmer-portal) viser kun en navigasjonsmeny-skisse. Det er ingen detaljerte brukerflyt-beskrivelser for portalen tilsvarende det som finnes for pianoeier-appen. Stemmerportalen skal brukes på desktop og er et profesjonelt verktøy — den fortjener like mye UX-arbeid.

Spesifikt mangler:
- Flyt for "Endre tilgjengelighet i kalender".
- Flyt for "Se fullstendig diagnostikkrapport og lydopptak".
- Flyt for "Marker oppdrag som fullfort og skriv notat til kunden".
- Dashboard-design (hva vises først, hva er viktigst).
- Tomt tilstand for ny stemmer som ikke har fått sitt første oppdrag ennå.

---

### 3.4 Stemmer-onboarding er ikke tillitbyggende nok

**Gap:** Brukerflyt.md (Trinn 6.1) beskriver en 4-stegs registrering som inkluderer et felt for fødselsnummer med teksten "For å bygge tillit, bekrefter vi identiteten din." Dette er problematisk på flere måter:
1. Det er ikke avklart hvem som foretar selve verifiseringen og mot hvilke registre.
2. Å spørre om fødselsnummer i et nettskjema uten å forklare nøyaktig hva det brukes til og hvem som ser det, er trolig i strid med GDPR (ikke minimum nødvendig data for registrering).
3. For en ny platform er dette et svært høyt tillitskrav å stille til en stemmer som knapt kjenner oss.

**Tiltak:** Fjern fødselsnummer-feltet fra MVP-onboarding. Bruk heller org.nr (for næringsdrivende) + kopi av NPTF-sertifikat + manuell godkjenning. BankID for stemmere kan vurderes i Fase 2. Skriv eksplisitt i registreringsflyten hva som verifiseres og av hvem.

---

### 3.5 WCAG 2.1 AA — manglende tilgjengelighetsgarantier for skanningsflyt

**Gap:** Kravspesifikasjonen setter WCAG 2.1 AA som krav (NF-UU-01 til NF-UU-05). Designsystemet har fargekontraster verifisert. Men skanningsflyten har en fundamental tilgjengelighetsutfordring som ikke er adressert:

**Hva skjer for en pianoeier med nedsatt hørsel?** De er ikke målgruppen for diagnostikken, men de eier kanskje piano for sine barn. Mer kritisk: **hva skjer for en pianoeier med nedsatt motorikk** som ikke kan spille alle 52 taster?

Den primære UX-metaforen (spill alle hvite taster én etter én) er en motorisk krevende oppgave som tar 5–8 minutter. WCAG 2.1 AA sier ikke noe eksplisitt om motorisk tilgjengelighet for slike oppgaver, men det er god UX-praksis å vurdere alternative modi.

**Tiltak:**
- Legg til en "Assistert modus" der en annen person kan hjelpe til å spille tastene.
- Legg til mulighet for å hoppe over enkeltnoter og merke dem som "ikke tilgjengelig".
- NF-UU-04 (alternativ tekstlig fremstilling av stemmekurven for synshemmede) MÅ ha konkret implementeringsspec — det er ikke nok å bare sette kravet.

---

### 3.6 Fargekoding — inkonsistens mellom designsystem og kode

**Gap:** Det er en inkonsistens i fargekoding for cent-avvik:
- Algoritme-integrasjon.md (TuningCurve.js): Grønn ≤ 5 cent, Gul 5–15 cent, Rød > 15 cent.
- Designsystem.md (seksjon 5.3): God ≤ 10 cent, Advarsel 10–25 cent, Fare > 25 cent.
- Kravspesifikasjon seksjon 4.2: God ≤ 10 cent (MAD), Trenger stell 10–30 cent, Kritisk > 30 cent.

Tre forskjellige systemer med tre forskjellige terskelgrenser. Dette er en direkte inkonsistens som MÅ løses av Piano Tuner Expert og teamet i fellesskap.

**Tiltak:** Tving frem en felles terskelverdi-beslutning (åpen beslutning O-003 i project-status.md) og oppdater ALLE tre dokumenter til å bruke samme verdier.

---

## 4. Markeds- og vekst-gap

### 4.1 Prisens transparens — hvem setter prisen?

**Gap:** Brukerflyt.md (Trinn 6.1, Steg 3) lar stemmere sette sin egen pris. Bookingflyt (Trinn 4.4) viser en fast pris med plattformgebyr. Men:

- Masterplanen (Fase 2) sier "Pianoeier sender stemmeforespørsel" og "Stemmere legger inn pris og tilgjengelighet" — altså en anbudsmodell.
- Brukerflyt (Trinn 4.3) viser en "Velg dato og tid"-flyt med kalender som antyder at prisen allerede er satt på forhånd — altså en fast-pris-modell.

**Disse to modellene er motstridende.** Det er ikke avklart om PianoHelse er en fast-pris-markedsplass (à la TaskRabbit) eller en anbudsmarkedsplass (à la Mittanbud).

**Konsekvens:** Denne fundamentale produktbeslutningen er ikke tatt. Den påvirker hele brukerflyt, provisjonsberegning, og verdipropisisjonen for begge brukergrupper.

**Tiltak:** Lead Coordinator MÅ ta denne beslutningen og oppdatere alle berørte dokumenter. Anbefalt valg: Stemmeren setter en standardpris for ulike tjenestetyper; pianoeier ser disse prisene og velger basert på tilgjengelighet — kombinert fast pris / valg-modell (ikke anbud).

---

### 4.2 Referral-programmet er ikke GDPR-compliant

**Gap:** Veksttaktikker.md (Del 3) beskriver et referral-program der musikklærere som sender "5 eller flere elever" til PianoHelse får ett gratis stemmeoppdrag. Men dette er problematisk:

- Musikklærere kan ikke rettmessig dele elevenes kontaktinformasjon med PianoHelse uten elevfamiliens eksplisitte samtykke.
- Referral-lenker som sporer hvem som sendte hvem innebærer behandling av personopplysninger.
- "Merket 'Anbefalt av [lærerens navn]' i annonseringsmateriell" er en markedsføring som bruker en privatpersons navn, krever eksplisitt samtykke og skal ikke skje basert på referral-aktivitet alene.

**Tiltak:** Redesign referral-programmet: lærere deler en anonym referral-lenke (ingen persondata overføres); sporing skjer kun gjennom besøksstatistikk uten identifiserende data; "anbefalt av"-merkingen krever eksplisitt opt-in fra læreren med skriftlig samtykke.

---

### 4.3 Markedsestimater mangler en nedre grense

**Gap:** Masterplanen anslår 75 000–120 000 pianoer i Norge. Men det reelle adresserbare markedet er ikke analysert. Faktorer som reduserer markedet kraftig:
- Digitale pianoer (ikke relevante for akustisk stemming).
- Pianoer i ikke-bruk (stenger, svømmehaller, undervisningsrom, etc.).
- Pianoer der eier aldri vil bruke en app (veldig eldre eiere).
- Pianoer allerede dekket av faste stemmer-relasjoner.

Det realistiske Total Addressable Market (TAM) for appen kan være 15 000–30 000 husholdninger, ikke 75 000–120 000. Investor-caset bør ikke bygge på det øvre estimatet.

**Tiltak:** Economist MÅ analysere TAM, SAM og SOM for PianoHelse med realistiske nedre grenser.

---

### 4.4 Digital piano-målgruppe er en mulighet, ikke bare et problem

**Gap:** (Delvis knyttet til 1.3) Mens vi anbefaler å ekskludere digitale pianoer fra diagnostikken, er eierne av digitale pianoer en underutnyttet målgruppe for en **annen** tjeneste: reparasjon, service og oppgradering av digitale instrumenter. Yamahas Clavinova-serie kan trenge taste-reparasjon, programvareoppdateringer eller pedal-reparasjon.

Dette er en mulighet for PianoHelse å tilby en "Digital Piano Service"-kategori i Fase 2–3 — en tjeneste pianobutikker og tekniker-stemmere kan tilby.

---

## 5. Juridiske og compliance-gap

### 5.1 GDPR — Lyd-opptak er personopplysning og krever eksplisitt hjemmel

**Gap:** Teknisk-arkitektur.md sier korrekt at lydopptak er personopplysninger. Men det er ikke avklart:
- Hva er det **rettslige grunnlaget** (GDPR art. 6) for behandlingen av lydopptaket?
- Samtykke (art. 6(1)(a)) er mest sannsynlig, men da er samtykket MÅ være:
  - Frivillig (ikke en forutsetning for å bruke tjenesten — og lydopptak er allerede gjort valgfritt, bra).
  - Spesifikt (kun for det angitte formålet).
  - Informert (bruker MÅ vite nøyaktig hva opptaket brukes til og hvem som kan se det).
  - Entydig (eksplisitt avkrysning, ikke pre-avkrysset).

Det er ikke dokumentert at behandlingsgrunnlaget er vurdert for ALLE kategorier av personopplysninger plattformen behandler, inkludert: e-postadresse, postnummer, navn, lydopptak, betalingsinformasjon, IP-adresse.

**Tiltak:** Lag et fullstendig GDPR-behandlingsgrunnlag-register (Record of Processing Activities, RoPA) som GDPR art. 30 krever. Dette er en del av det nye juridisk-og-gdpr.md dokumentet.

---

### 5.2 Angrerettloven — ingen omtale i noen dokumenter

**Gap:** Angrerettloven (lov om angrerett, LOV-2014-06-20-27) gir norske forbrukere rett til å angre på kjøp av tjenester innen 14 dager. For PianoHelse betyr dette:

- En pianoeier som booker og betaler for stemming, kan i teorien angre innen 14 dager — **selv etter at stemming er utført**.
- Angrerettloven gjør unntak dersom tjenesten er "fullt utført" OG kunden på forhånd har bekreftet skriftlig at de gir avkall på angreretten når tjenesten er fullfort.

Ingen steder i brukerflyt, kravspesifikasjon eller vilkårsramme er dette nevnt. Dersom PianoHelse ikke informerer kunder om angreretten FØR bestilling, og ikke innhenter eksplisitt fravikelseserklæring, kan en misfornøyd kunde kreve pengene tilbake fra en stemmer som allerede har utført og fått betalt for jobben.

**Tiltak:** Legg til et obligatorisk avkrysningsfelt i booking-bekreftelse: "Jeg er klar over at tjenesten vil bli utført umiddelbart og at jeg dermed gir avkall på min angrerett i henhold til Angrerettloven § 22(1)." Dette MÅ bekreftes av juridisk rådgiver.

---

### 5.3 Ansvarsbegrensning — diagnostikken anbefaler stemming, pianoet trenger reparasjon

**Gap:** Ingen steder er det et juridisk ansvarsbegrensningssvar på følgende scenario: En pianoeier gjennomfører diagnostikken, helsekarakteren er "God" (fordi mange toner er nær riktig frekvens), men pianoet har faktisk skjulte strukturelle problemer (knekte strenger, sprukket lydskjell) som ikke oppdages av tonehøydediagnostikk. Eieren stoler på diagnostikken, velger ikke å stemme, og pianoet forringes videre.

Omvendt: Diagnostikken sier "Kritisk" og eieren booker stemmer. Stemmeren forsøker å stemme men forverre en allerede kritisk situasjon (f.eks. en sprekker fyllmasse-streng under opptrekk). Hvem er ansvarlig?

**Tiltak:** Diagnostikken MÅ ha en tydelig ansvarsfraskrivelse innbakt i selve resultatsiden — ikke bare i personvernpolicyen. "PianoHelse-diagnostikken måler kun tonehøydeavvik. Den oppdager ikke mekaniske feil, strukturelle skader, hammerslitasje eller pedalproblem. Kontakt en fagperson for en full fysisk vurdering."

---

### 5.4 Stemmerverifisering og "bad actor"-risiko

**Gap:** En person kan registrere seg som "pianostemmer" med falsk informasjon. I MVP godkjennes stemmere "manuelt av PianoHelse-teamet", men hva dette innebærer er ikke definert. Dersom en uautorisert person registrerer seg, aksepterer et oppdrag, og utfører dårlig arbeid (eller i verste fall begår annen kriminalitet i hjemmet), er PianoHelse eksponert.

**Tiltak:** Minimal verifiseringspakke for MVP: org.nr. kontrollert mot Brønnøysundregistrene (offentlig API), og/eller NPTF-sertifikatnummer kontrollert mot NPTF-register (via e-post til NPTF). Legg eksplisitt til en disclaimer i vilkårene om at PianoHelse ikke erstatter brukerens egen vurdering av stemmerens egnethet.

---

### 5.5 MVA (VAT) — norsk B2C og plattformens provisjonsansvar

**Gap:** Ingen av dokumentene nevner MVA/merverdiavgift. Dette er kritisk fordi:

1. Pianostemmerens tjeneste er MVA-pliktig (25 % MVA som selvstendig næringsdrivende over frikortgrensen).
2. PianoHelse tar en provisjon — dette er en tjeneste PianoHelse leverer til stemmeren og er MVA-pliktig.
3. Dersom PianoHelse behandler hele betalingen (Stripe Connect collect-then-transfer), kan Skatteetaten argumentere for at PianoHelse er den reelle tjenesteleverandøren, ikke stemmeren, noe som medfører at PianoHelse er ansvarlig for 25 % MVA på hele betalingsbeløpet (ikke bare provisjonen).

**Tiltak:** Hent inn skatterådgivning på MVA-strukturen FØR Fase 2-lansering. Economist MÅ inkludere MVA i forretningsmodell-analysen. Dette kan påvirke nettopp valget mellom "collect then transfer" vs. fakturabasert provisjonsmodell.

---

### 5.6 Personvern for mindreårige

**Gap:** Kravspesifikasjonen nevner "foreldre til barn som spiller" som en sentral målgruppe. Dersom et barn under 16 år oppretter en konto (uten foreldresamtykke), er dette i strid med GDPR artikkel 8 og ekomloven.

Det er ingen aldersverifisering nevnt i registreringsflyten, og ingen policy for behandling av barn under 16 år.

**Tiltak:** Legg til en "Jeg bekrefter at jeg er over 16 år, eller at jeg er forelder/foresatt som oppretter konto på vegne av barnet" i registreringsflyten. Beskriv i personvernerklæringen at tjenesten ikke er rettet mot barn under 16 år.

---

## 6. Koordinasjons- og prosess-gap

### 6.1 TEAM/PIANO-TUNER/ og TEAM/ECONOMIST/ er tomme mapper

**Gap:** Koordinasjonsloggen definerer leveranser fra Piano Tuner Expert og Economist, men begge mappene er tomme. Dette er akseptabelt i konseptfasen, men prosjektstatusen burde registrere dette som et aktivt gap, ikke bare "Ikke startet".

Spesielt kritisk: Piano Tuner Experts `faglig-terskelverdi.md` er en blokkerende leveranse for utviklerens diagnostikkimplementering. Denne avhengigheten er underkommunisert i project-status.md.

---

### 6.2 Mappestruktur er inkonsistent

**Gap:** Koordinasjonsloggen definerer filstier som `TEAM/DEV/`, `TEAM/DESIGN/`, `TEAM/EXPERT/`, `TEAM/ECONOMICS/` — men de faktiske mappene er `TEAM/DEVELOPER/`, `TEAM/DESIGNER/`, `TEAM/PIANO-TUNER/`, `TEAM/ECONOMIST/`. Dette er en direkte inkonsistens mellom koordinasjonsloggen og den faktiske mappestrukturen.

**Tiltak:** Oppdater koordinasjonsloggen til å reflektere de faktiske mappestiene.

---

### 6.3 README.md er unøyaktig

**Gap:** README.md sier `TEAM/LEAD/` inneholder `kravspesifikasjon.md`. Kravspesifikasjonen ligger faktisk i `PRODUCT/kravspesifikasjon.md`. Dessuten er `TEAM/PIANO-TUNER/` listet med dokumenter (`markedsanalyse.md`, `stemmer-behov.md`, `bransjekunnskap.md`) som ikke eksisterer.

---

## 7. Oppsummering av prioriterte tiltak

### Kritiske (blokkerer lansering)
1. Ta beslutning om prismodell (fast pris vs. anbud).
2. Design "ingen stemmere i ditt område"-flyt.
3. Implementer digital piano-deteksjon og dedikert UX.
4. Design "gjenoppta skanning"-funksjonalitet.
5. Løs inkonsistens i cent-terskelgrenser.
6. Lag juridisk-og-gdpr.md (se Phase 3-leveranse).
7. Legg til angrerettlov-samtykke i bookingflyt.
8. Definer minimum stemmerverifisering.

### Høy prioritet (bør løses pre-lansering)
9. Spesifiser iOS Safari-feilhåndtering (guide, ikke deep link).
10. Legg til gain-normalisering og "utilstrekkelig signal"-UX.
11. Utvid PianoScanner for sterkt nedstemmede instrumenter.
12. Kompletter databaseskjema (kanselleringsfelt, GDPR-logg, opptrekk-indikator).
13. Betalingsflyt edge cases (refusjon, delvis fullføring, Stripe-feil).
14. MVA-avklaring for provisjonsmodell.

### Middels prioritet (bør løses i Fase 1)
15. Disintermediation-strategi.
16. Distrikt-modus ("rural mode") med NPTF-fallback.
17. Fullstendig stemmerportal-brukerflyt (desktop-design).
18. Ansvarsbegrensnings-disclaimer i diagnostikkresultat.
19. Aldersverifisering i registreringsflyt.
20. Redesign referral-programmet for GDPR-compliance.

---

*Gap-analysen er utarbeidet basert på gjennomlesning av alle eksisterende prosjektdokumenter per 20. mars 2026. Kritikkene er konstruktive og løsningsorienterte. Alle identifiserte gap er adresserbare — ingen av dem er produktdrepende dersom de håndteres nå.*

*Neste steg: Oppdater kravspesifikasjon, teknisk arkitektur og prosjektstatus basert på funnene i dette dokumentet.*

---

## 8. Tillegg: Strukturerte Gap-kort (Lead Coordinator-revisjon, 20. mars 2026)

Dette tillegget reformaterer og supplerer gap-analysen med strukturerte gap-kort for alle identifiserte og nye gap. Formålet er å gjøre prioritering, eierskap og handling sporbar for hele teamet.

---

## GAP-01: Mangler GDPR-personvernerklæring som publisert tekst
**Alvorlighet:** Kritisk
**Område:** Product / Lead
**Beskrivelse:** Det finnes ingen ferdigskrevet personvernerklæring tilpasset PianoHelse. Kravspesifikasjonen setter krav (NF-P-08) om at erklæringen skal foreligge på norsk og klart språk, men selve teksten eksisterer ikke. MVP kan ikke lanseres uten en publisert personvernerklæring.
**Handling:** Opprett `PRODUCT/gdpr-og-juridisk.md` med komplett utkast til personvernerklæring. Legalreviewer gjennomgår utkastet før lansering. Se ny leveranse fra Lead Coordinator (20. mars 2026).
**Ansvarlig:** Lead Coordinator + juridisk rådgiver
**Status:** Under arbeid — utkast opprettet 20. mars 2026

---

## GAP-02: Mangler tilgjengelighetserklæring (WCAG / universell utforming)
**Alvorlighet:** Kritisk
**Område:** Designer / Developer
**Beskrivelse:** Likestillings- og diskrimineringsloven § 17 krever at IKT-løsninger rettet mot allmennheten har en publisert tilgjengelighetserklæring (accessibility statement). Kravspesifikasjonen setter WCAG 2.1 AA som teknisk krav, men det finnes ingen plan for å publisere den lovpålagte erklæringen. Bøter for manglende etterlevelse kan ilegges av Digitaliseringsdirektoratet.
**Handling:** Designer og Developer utarbeider tilgjengelighetserklæring etter mal fra uutv.no (Digitaliseringsdirektoratets verktøy). Erklæringen publiseres på `/tilgjengelighet`-siden ved lansering. Automatisk WCAG-skanning (axe/WAVE) dokumenteres og inkluderes.
**Ansvarlig:** Designer (primær) + Developer (teknisk implementering)
**Status:** Åpen

---

## GAP-03: Uklar ansvarsbegrensning for diagnoseresultater
**Alvorlighet:** Kritisk
**Område:** Product / Lead / juridisk
**Beskrivelse:** Diagnostikken måler kun tonehøydeavvik. Den kan ikke avdekke mekaniske skader, strukturelle feil, hammerslitasje eller pedalproblemer. Ingen steder i nåværende dokumenter (og heller ikke i brukergrensesnittet) er det en klar ansvarsfraskrivelse. Scenariet der brukeren stoler på "God"-status mens pianoet har skjulte strukturelle feil er juridisk eksponerende. Stemmere kan også påføre skade på sterkt nedstemmede pianoer under opptrekk.
**Handling:** Legg til ansvarsbegrensingstekst direkte på resultatsiden i UI (ikke bare i vilkårene). Formuler klausul i brukervilkår: "PianoHelse-diagnostikken er en indikativ tjeneste og ikke et substitutt for faglig vurdering." Se `PRODUCT/gdpr-og-juridisk.md`.
**Ansvarlig:** Lead Coordinator + Designer (UI-tekst) + juridisk rådgiver
**Status:** Under arbeid

---

## GAP-04: Mangler onboarding-e-postflyt
**Alvorlighet:** Høy
**Område:** Developer / Marketing
**Beskrivelse:** Kravspesifikasjonen spesifiserer e-postbekreftelse for bookingforespørsel (F-B-03), men det finnes ingen definert sekvens for onboarding-e-poster: velkomst-e-post etter registrering, aktiverings-e-post for stemmere, oppfølgings-e-post etter utført diagnostikk, og påminnelses-e-poster. Ingen e-posttemplater er skrevet eller spesifisert.
**Handling:** Marketing og Developer definerer komplett e-postflyt med triggere, timing og tekstmaler for alle kritiske transaksjons-e-poster. Minimum for MVP: (1) Velkomst-pianoeier, (2) Bookingbekreftelse, (3) Tilbud mottatt, (4) Stemmer-godkjenning. Implementeres via Resend (allerede valgt i teknisk arkitektur).
**Ansvarlig:** Marketing (tekst) + Developer (implementering)
**Status:** Åpen

---

## GAP-05: Stemmer-verifisering — er NPTF-sertifikat tilstrekkelig?
**Alvorlighet:** Høy
**Område:** Lead / Piano-Tuner
**Beskrivelse:** Dokumentene sier stemmere godkjennes manuelt, men det er ikke definert hva som faktisk sjekkes. NPTF har 66 autoriserte medlemmer, men ikke alle aktive pianostemmere i Norge er NPTF-sertifiserte. Spørsmålet om hvorvidt vi krever NPTF-sertifikat (og dermed ekskluderer ikke-sertifiserte fagpersoner) eller aksepterer alternativ dokumentasjon er ikke besvart. Det er heller ingen sjekk mot NPTF-registeret for å bekrefte at oppgitt sertifikatnummer er gyldig.
**Handling:** Piano-Tuner Expert definerer minimums-akkrediteringskrav. Lead Coordinator kontakter NPTF om tilgang til sertifikatregister for verifisering. Alternativt: org.nr. + forsikringsbevis + 3 referanser som minimumspakke for ikke-NPTF-stemmere. Dokumenteres i `stemmer-krav.md`.
**Ansvarlig:** Piano-Tuner Expert + Lead Coordinator
**Status:** Åpen — blokkerer stemmer-onboarding

---

## GAP-06: Ingen plan for "stemmer møter ikke opp" (no-show)
**Alvorlighet:** Høy
**Område:** Product / Lead / juridisk
**Beskrivelse:** Det finnes ingen prosedyre for hva som skjer dersom en stemmer aksepterer et oppdrag og deretter ikke møter opp. Pianoeieren er da i en situasjon uten produkt og potensielt uten penger tilbake (hvis betaling er tatt). Ingen av dokumentene adresserer dette scenariet — hverken i brukervilkårene, brukerflyt eller kravspesifikasjonen.
**Handling:** Definer "no-show"-policy i brukervilkår: stemmer som ikke møter opp uten 24-timers kansellering mister rett til betaling og kan suspenderes. Pianoeier får automatisk full refusjon. Implementer automatisk timeout: oppdrag reåpnes dersom stemmeren ikke bekrefter oppmøte innen X timer etter avtalt tidspunkt.
**Ansvarlig:** Lead Coordinator + juridisk rådgiver
**Status:** Åpen

---

## GAP-07: Ingen refund- og klagebehandlingsplan
**Alvorlighet:** Høy
**Område:** Lead / Developer / juridisk
**Beskrivelse:** Betalingsarkitekturen (Stripe Connect) er godt beskrevet for "happy path", men det finnes ingen dokumentert prosess for refusjon, delvis refusjon eller klagebehandling. Angrerettloven gir forbrukere rett til å angre på tjenestekjøp innen 14 dager. Ingen av disse scenariene er adressert i kravspesifikasjon, brukerflyt eller teknisk arkitektur. Hvem bærer Stripe-gebyret ved refusjon? Hva ved delvis utførelse?
**Handling:** Definer refusjonspolicy i brukervilkår. Dokumenter refusjons-flyt i teknisk arkitektur (Stripe Refund API). Legg til obligatorisk angrerettfraskrivelse i bookingbekreftelse (Angrerettloven § 22). Se `PRODUCT/gdpr-og-juridisk.md` seksjon 7.
**Ansvarlig:** Lead Coordinator + Developer + juridisk rådgiver
**Status:** Åpen

---

## GAP-08: Mangler cookie-banner (GDPR + ePrivacy-direktivet)
**Alvorlighet:** Høy
**Område:** Developer / Lead
**Beskrivelse:** Kravspesifikasjonen nevner "cookiesamtykke implementert" som akseptansekriterium (Teknisk akseptanse), men det finnes ingen konkret spesifikasjon av hvilke cookies som brukes, hvilke som er nødvendige vs. analytiske, og hvordan samtykke innhentes og lagres. ePrivacy-direktivet (implementert i norsk lov via ekomloven § 2-7b) krever aktivt samtykke for analytiske cookies. Datatilsynet har sanksjonert norske selskaper for mangelfull cookie-håndtering.
**Handling:** Developer kartlegger alle cookies og lokal lagring (LocalStorage, IndexedDB, Supabase auth-token). Kategoriser: nødvendige (unntak fra samtykke) vs. analytiske (krever samtykke). Implementer cookie-banner med Cookiebot, Osano, eller tilsvarende. Publiser cookie-policy. Se `PRODUCT/gdpr-og-juridisk.md` seksjon 3.
**Ansvarlig:** Developer + Lead Coordinator
**Status:** Åpen

---

## GAP-09: MVA-ansvar for provisjonsmodellen er ikke avklart
**Alvorlighet:** Høy
**Område:** Economist / Lead / juridisk
**Beskrivelse:** Ingen av dokumentene nevner MVA/merverdiavgift. Pianostemmers tjenester er MVA-pliktige (25 %). PianoHelse som plattform er ansvarlig for MVA på sin provisjon (18 %). Dersom PianoHelse behandler hele betalingen via Stripe Connect ("collect then transfer"), kan Skatteetaten argumentere for at PianoHelse er reell tjenesteleverandør — noe som medfører MVA-ansvar på HELE transaksjonsbeløpet, ikke bare provisjonen. Dette kan avgjøre om forretningsmodellen er lønnsom.
**Handling:** Economist og Lead Coordinator innhenter skatterådgivning på MVA-strukturen. Vurder alternativer: fakturabasert provisjonsmodell (stemmeren fakturerer kunden direkte, PianoHelse fakturerer stemmeren separat for lead-fee) vs. collect-then-transfer. Beslutning MÅ tas FØR Fase 2-lansering med betalingsintegrasjon.
**Ansvarlig:** Economist + juridisk rådgiver
**Status:** Åpen — blokkerer Fase 2 betalingsmodell

---

## GAP-10: Aldersgrense og personvern for mindreårige
**Alvorlighet:** Høy
**Område:** Developer / Product / juridisk
**Beskrivelse:** Kravspesifikasjonen identifiserer "foreldre til barn som spiller" som primær målgruppe. GDPR artikkel 8 (og norsk personopplysningslov § 5) setter aldersgrense for selvstendig samtykke til digital behandling ved 15 år i Norge (lavere enn EUs 16-årsgrense). Barn under 15 år krever foreldresamtykke. Det er ingen aldersverifisering i registreringsflyten, og ingen policy for behandling av mindreåriges data. Spørsmålet om brukere MÅ være 18+ (for å inngå bindende avtale/betaling) er heller ikke avklart.
**Handling:** Legg til alderserklæring i registreringsflyt: "Jeg bekrefter at jeg er fylt 18 år, eller at jeg er forelder/foresatt." Beskriv i personvernerklæringen at tjenesten ikke er rettet mot barn under 15 år uten foreldresamtykke. Diagnostikk uten kontoopprettelse er åpen for alle (ingen personopplysninger lagres uten samtykke).
**Ansvarlig:** Developer (implementering) + Lead Coordinator (policy)
**Status:** Åpen

---

## GAP-11: Prismodell er ikke endelig besluttet (fast pris vs. anbud)
**Alvorlighet:** Kritisk
**Område:** Lead / Product
**Beskrivelse:** Det er en grunnleggende inkonsistens mellom dokumentene: Masterplanen antyder anbudsmodell ("stemmere legger inn pris og tilgjengelighet"), mens brukerflyt antyder fast pris med kalendervalg. Investorpitchen bruker 18 % provisjon av "gjennomsnittlig oppdragsverdi kr 2 853" som om prisen er fast. Disse to modellene er motstridende og påvirker hele brukerflyt, provisjonsberegning og verdipropisisjonen for begge brukergrupper.
**Handling:** Lead Coordinator tar og dokumenterer en endelig beslutning. Anbefaling: fast pris per tjenestetype satt av stemmeren (standard stemming, pitch raise, regulering), med prisen synlig for pianoeieren FØR booking. Oppdater masterplan, kravspesifikasjon og investorpitch til å bruke konsistent terminologi.
**Ansvarlig:** Lead Coordinator
**Status:** Åpen — beslutning nødvendig FØR design av bookingflyt

---

## GAP-12: Inkonsistente cent-terskelgrenser på tvers av dokumenter
**Alvorlighet:** Høy
**Område:** Developer / Designer / Piano-Tuner / Product
**Beskrivelse:** Tre dokumenter bruker tre ulike terskelgrenser for helsekarakterer:
- Algoritme-integrasjon: Grønn ≤ 5 cent, Gul 5–15 cent, Rød > 15 cent
- Designsystem: God ≤ 10 cent, Advarsel 10–25 cent, Fare > 25 cent
- Kravspesifikasjon: God ≤ 10 cent (MAD), Trenger stell 10–30 cent, Kritisk > 30 cent
Ingen av disse er validert av Piano Tuner Expert. Hvis disse verdiene er ulike i kode og UI, vil brukerne oppleve feilaktige helsekarakterer.
**Handling:** Piano Tuner Expert definerer faglig forsvarlige terskelverdier. Lead Coordinator innkaller til avklaringsmøte (asynkront via dokumentmappen). Endelig verdi oppdateres i ALLE berørte dokumenter: kravspesifikasjon, teknisk arkitektur, algoritme-integrasjon, designsystem. Åpen beslutning O-003 lukkes.
**Ansvarlig:** Piano-Tuner Expert (faglig input) + Lead Coordinator (beslutning)
**Status:** Åpen — blokkerer ferdigstilling av diagnostikkmodul

---

## GAP-13: Ingen "gjenoppta skanning"-funksjonalitet
**Alvorlighet:** Høy
**Område:** Developer / Designer
**Beskrivelse:** Skanningen av 52 taster tar 5–8 minutter. Det finnes ingen resume-funksjonalitet. Dersom telefonen låser seg, noen ringer, eller appen krasjer midtveis, mister brukeren all fremgang. Basert på mobilopptak-UX-forskning er 5–8 minutter en kritisk drop-off terskel. Mange brukere vil bli avbrutt — av barn, telefoner, eller fordi pianoet er i et annet rom.
**Handling:** Design og implementer "Gjenoppta skanning"-flyt. Lagre fremdrift til IndexedDB for hvert bekreftet note-resultat. Vis "Du har en ufullstendig skanning — fortsett der du slapp?" ved neste åpning av appen. Legg til krav i kravspesifikasjonen.
**Ansvarlig:** Developer + Designer
**Status:** Åpen

---

## GAP-14: Digitale pianoer — ingen deteksjon eller dedikert UX
**Alvorlighet:** Høy
**Område:** Developer / Designer / Product
**Beskrivelse:** Digitale pianoer (Yamaha Clavinova, Roland, Kawai CA-serie) er alltid perfekt stemt digitalt og trenger aldri akustisk stemming. Dersom en eier av digitalt piano bruker diagnostikken, vil alle toner vise nær-perfekte verdier — noe som er meningsløst og potensielt misvisende. Databaseskjemaet lister "digitalklaver" som pianotype, men det finnes ingen logikk for å håndtere dette annerledes.
**Handling:** Legg til spørsmål i onboarding: "Hva slags piano har du? Akustisk klaver / Akustisk flygel / Digitalt piano / Annet." Dersom "Digitalt piano" → diagnostikken deaktiveres med tydelig forklaring og alternativt innhold. Dette er et UX-gap og et produktavklaring-gap.
**Ansvarlig:** Designer (UX-flyt) + Developer (implementering) + Lead Coordinator (produktbeslutning)
**Status:** Åpen

---

## GAP-15: Ingen plan for distrikt-Norge — "ingen stemmere i ditt område"
**Alvorlighet:** Høy
**Område:** Designer / Marketing / Product
**Beskrivelse:** Med kun 66 NPTF-stemmere i hele Norge (de fleste i de 5 største byene) vil store deler av landet ikke ha stemmerdekning i måneder eller år. Ingen av dokumentene definerer hva som vises til en bruker som fullfører diagnostikken men ikke har tilgjengelige stemmere. Dette er et forventet scenario — ikke et kanttilfelle — i lanseringsperioden.
**Handling:** Design en spesifikk "Ingen stemmere i ditt område"-skjerm med konstruktive alternativer: (1) NPTF-nettsted for manuelt søk, (2) "Varsle meg når stemmere er tilgjengelige" (e-postregistrering), (3) Kontakt nasjonal stemmer med reisevilje. Marketing definerer ikke-Oslo taktikk. Definer intern regel: aldri markedsfør aktivt i en geografi uten minst 3 aktive stemmere.
**Ansvarlig:** Designer + Marketing + Lead Coordinator
**Status:** Åpen

---

## GAP-16: Mangler RoPA (Record of Processing Activities) etter GDPR art. 30
**Alvorlighet:** Kritisk
**Område:** Lead / Developer / juridisk
**Beskrivelse:** GDPR artikkel 30 krever at alle behandlingsansvarlige fører et register over behandlingsaktiviteter (RoPA). PianoHelse behandler: e-postadresser, postnummer, navn, lydopptak, betalingsinformasjon, IP-adresser, og diagnostikkdata. Det rettslige grunnlaget for ALLE disse kategoriene er ikke dokumentert. Datatilsynet kan be om innsyn i RoPA ved tilsyn.
**Handling:** Lead Coordinator og Developer utarbeider RoPA som del av `PRODUCT/gdpr-og-juridisk.md`. Dokumenter: behandlingsformål, rettslig grunnlag (art. 6), datatype, lagringsperiode, mottakere, overføring til tredjeland, sikkerhetstiltak. Oppdateres ved hver ny datatype som legges til plattformen.
**Ansvarlig:** Lead Coordinator + juridisk rådgiver
**Status:** Under arbeid — se ny gdpr-og-juridisk.md

---

## GAP-17: Supabase DPA — ikke eksplisitt signert
**Alvorlighet:** Høy
**Område:** Developer / Lead
**Beskrivelse:** Teknisk arkitektur antar at Supabase Frankfurt-region er tilstrekkelig for GDPR. Supabase er et US-selskap (Delaware Corp) som bruker AWS som underliggende infrastruktur. Databehandleravtale (DPA) MÅ signeres eksplisitt med Supabase — valg av EU-region er ikke tilstrekkelig. AWS krever egne SCCs (Standard Contractual Clauses). Support-personale i USA kan potensielt få tilgang til data for feilsøking, noe som kan utgjøre et ulovlig dataoverføringsproblem.
**Handling:** Developer signerer Supabase DPA (tilgjengelig i Supabase dashboard → Settings → Legal). Dokumenter eksplisitt at DPA er signert i teknisk-arkitektur.md. Vurder om SCCs med AWS er nødvendig i tillegg. Konsulter juridisk rådgiver dersom Datatilsynet-tilsyn er sannsynlig (f.eks. ved håndtering av lydopptak).
**Ansvarlig:** Developer + Lead Coordinator
**Status:** Åpen

---

## GAP-18: Ingen beredskapsplan for kritisk feil i produksjon
**Alvorlighet:** Medium
**Område:** Developer / Lead
**Beskrivelse:** Kravspesifikasjonen (NF-R-02) krever at kritiske feil i produksjon har en responsplan med mål om løsning innen 4 timer, men ingen slik plan er dokumentert. Det finnes ingen definert eskalasjonsprosess, ingen varslingssystem (PagerDuty e.l.), og ingen definisjon av hva som utgjør en "kritisk feil" vs. en "ikke-kritisk feil".
**Handling:** Developer definerer beredskapsplan: (1) Overvåkingsverktøy (Sentry for JS-feil, Supabase dashboard for databasefeil, Vercel/hosting for oppetid). (2) Definisjon av alvorlighetsgrader. (3) Varslingsprosedyre (hvem varsles, via hvilken kanal, innen hvor lang tid). (4) Rollback-prosedyre. Dokumenteres i `TEAM/DEVELOPER/driftsrutiner.md`.
**Ansvarlig:** Developer
**Status:** Åpen

---

## GAP-19: App-builder-agent mangler — ingen konkret byggeplan
**Alvorlighet:** Medium
**Område:** Lead / Developer
**Beskrivelse:** Av de 7 definerte agentene i prosjektet har 5 levert bidrag (Lead, Developer, Designer, Marketing, Investor/Pitch). App-builder-agenten mangler fullstendig. Det finnes ingen konkret plan for selve bygging av applikasjonen — teknisk arkitektur er designet, men ingen har ansvar for å koordinere faktisk kodeskriving, testing og deployment. Dette er det primære operative gapet i prosjektet akkurat nå.
**Handling:** Lead Coordinator definerer App-builder-rollen og leveranser. Primær leveranse: fungerende diagnostikkmodul (HTML/CSS/JS) som integrerer UltimateDetector mot et pianotastatur-UI. Tidsramme: Uke 3–6 (jf. kritisk sti i masterplan).
**Ansvarlig:** Lead Coordinator + Developer
**Status:** Åpen — under arbeid (agent kjører)

---

## GAP-20: Economist-leveranser mangler — finansiell modell uvalidert
**Alvorlighet:** Medium
**Område:** Economist
**Beskrivelse:** Alle finansielle projeksjoner i investorpitchen (slide 10) er basert på Lead Coordinators estimater uten validering fra Economist. Kritiske spørsmål er ubesvarte: Hva er realistisk CAC? Hva er LTV over 5 år? Hva er break-even med realistiske scenarioer? Er 18 % provisjonsnivå bærekraftig for stemmere? MVA-implikasjoner er ikke beregnet. Investor-caset hviler på uvaliderte tall.
**Handling:** Economist leverer `TEAM/ECONOMIST/forretningsmodell-analyse.md` med minimum 3 scenarioer (optimistisk/realistisk/pessimistisk), CAC-estimat, LTV-beregning og break-even-analyse. Economist bekrefter eller justerer investorpitchens projeksjoner. Prioritert leveranse uke 1.
**Ansvarlig:** Economist
**Status:** Under arbeid (agent kjører)

---

## 9. Oppsummering av alle gap (prioritert)

### Kritiske gap (blokkerer lansering)
| Gap | Tittel | Ansvarlig |
|---|---|---|
| GAP-01 | Personvernerklæring mangler | Lead + juridisk |
| GAP-02 | Tilgjengelighetserklæring (WCAG) mangler | Designer + Developer |
| GAP-03 | Ansvarsbegrensning for diagnostikk | Lead + Designer + juridisk |
| GAP-08 | Cookie-banner og cookie-policy | Developer + Lead |
| GAP-11 | Prismodell ikke besluttet (fast vs. anbud) | Lead |
| GAP-12 | Inkonsistente cent-terskelgrenser | Piano-Tuner + Lead |
| GAP-16 | Mangler RoPA (GDPR art. 30) | Lead + juridisk |

### Høy prioritet (bør løses pre-lansering)
| Gap | Tittel | Ansvarlig |
|---|---|---|
| GAP-04 | Mangler onboarding-e-postflyt | Marketing + Developer |
| GAP-05 | Stemmer-verifisering uklar | Piano-Tuner + Lead |
| GAP-06 | Ingen plan for stemmer no-show | Lead + juridisk |
| GAP-07 | Ingen refund- og klagebehandlingsplan | Lead + Developer + juridisk |
| GAP-09 | MVA-ansvar for provisjonsmodell | Economist + juridisk |
| GAP-10 | Aldersgrense og personvern for mindreårige | Developer + Lead |
| GAP-13 | Ingen "gjenoppta skanning"-funksjonalitet | Developer + Designer |
| GAP-14 | Digitale pianoer — ingen deteksjon eller UX | Designer + Developer |
| GAP-15 | Ingen plan for distrikt-Norge | Designer + Marketing |
| GAP-17 | Supabase DPA ikke signert | Developer |

### Medium prioritet
| Gap | Tittel | Ansvarlig |
|---|---|---|
| GAP-18 | Ingen beredskapsplan for kritisk feil | Developer |
| GAP-19 | App-builder mangler | Lead + Developer |
| GAP-20 | Economist-leveranser mangler | Economist |

---

*Oppdatert av Lead Coordinator, 20. mars 2026. Versjon 2.0.*
*Tidligere gap (GAP-nummerering starter fra 01) er nå inkludert i dette strukturerte formatet i tillegg til de detaljerte analysene i seksjon 1–7.*
