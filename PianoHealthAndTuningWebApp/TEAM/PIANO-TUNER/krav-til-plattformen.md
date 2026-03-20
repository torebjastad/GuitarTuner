# Krav til plattformen — fra stemmerens perspektiv
**Versjon:** 1.0
**Dato:** 20. mars 2026
**Forfatter:** Piano Tuner Expert
**Status:** Innspill til Designer og Developer — KRITISK å lese før UX-design av stemmerportal

---

## Innledning

Dette dokumentet beskriver hva en norsk pianostemmer **faktisk trenger** fra PianoHelse-plattformen for å ville bruke den. Det er basert på kunnskap om stenmerens arbeidshverdag, typiske frustrasjoner med eksisterende kanaler og hva som er avgjørende for at en stemmer velger å beholde kundeforholdet via plattformen fremfor å gå utenom den.

Stemmeren er en **selvstendig fagperson** (oftest enkeltpersonforetak) som er på farten store deler av arbeidsdagen, har god fagkunnskap men begrenset tid og interesse for administrasjon, og som primært ønsker én ting: **å gjøre jobben sin uten byråkratisk friksjon**.

---

## 1. Profil og troverdighet

### 1.1 NPTF-sertifiseringsmerke — obligatorisk synlighet

NPTF-autorisasjon er bransjens viktigste troverdighetsmarkør i Norge. Merket **MÅ vises tydelig** på stemmerprofilen — ikke gjemt i et faneinnhold, men synlig på listevisning og øverst på profilsiden.

**Implementasjonskrav:**
- NPTF-autorisasjonsnummer skal lagres og verifiseres (manuelt i MVP, automatisk i Fase 2)
- Merket vises med tekst: "Autorisert NPTF" + autorisasjonsnummer
- RPT (Registered Piano Technician, PTG) anerkjennes som internasjonal tilleggssertifisering
- Ikke-NPTF-sertifiserte stemmere vises tydelig som "Ikke NPTF-autorisert" — dette er ærlig og viktig for forbrukertilliten

### 1.2 Spesialiteter

Stemmere har svært ulik kompetanseprofil. Brukere som søker hjelp til spesifikke utfordringer har behov for å filtrere på dette.

**Spesialitetskategorier stemmer bør kunne velge (flervalgsliste):**
- Konsertflygel og sceneinstrumenter
- Antikke pianoer og historiske instrumenter (fortepiano, hammerklaver)
- Digitale hybrider (Yamaha AvantGrand, Roland V-Piano etc.)
- Regulering og mekanikk
- Intonasjon og voicing
- Restaurering og reparasjon
- Barnepedagogisk anbefaling (vil kommunisere enkelt med foreldre)
- Institusjoner: kirker, skoler, kulturhus

### 1.3 Geografisk rekkevidde — postnummerbasert, ikke bykategorier

En stemmer i Drammen betjener gjerne hele Viken-regionen, inkludert deler av Oslo. En stemmer i Ålesund kan ta oppdrag i hele Møre og Romsdal med et billass. Systemet **MÅ** støtte:

- Definering av dekningsområde som postnummerradius (f.eks. 50 km fra base)
- ELLER manuell liste over betjente postnummerprefikser
- Visning av stemmers rekkevidde som sirkel på kart (ikke bare liste)
- Mulighet for å flagge ekstra reisekostnad for lange avstander

**Feil tilnærming å unngå:** Drop-down med "Oslo / Bergen / Trondheim / Annet" — dette oversimplifiserer og ekskluderer store deler av markedet.

### 1.4 Kalenderintegrasjon — kritisk for adopsjon

Dette er **den viktigste praktiske funksjonen** for at stemmerne faktisk bruker plattformen:

- Stemmere har allerede fulle uker med etablerte kunder
- De vil ikke dobbeltbooke seg
- De sjekker ikke et nytt system jevnlig med mindre det er koblet til eksisterende verktøy

**Krav:**
- Kalenderintegrasjon mot Google Calendar og/eller iCal/Outlook **MÅ prioriteres høyt i Fase 2**
- I MVP: Stemmer setter manuelt sine tilgjengelige tidsvindu (f.eks. "ledige slots denne uken")
- Push-varsling til mobil er en akseptabel erstatning i MVP

### 1.5 Svar-tid-garanti / respons-SLA

Kunder som sender bookingforespørsler har en rimelig forventning om responstid. For at dette skal fungere:

- Stemmere bør forplikte seg til å **svare innen 24 timer** på forespørsler innenfor sitt dekningsområde
- Plattformen bør vise stemmers gjennomsnittlige responstid på profilen ("Svarer normalt innen 2 timer")
- Stemmere med konsistent treg responstid bør varsles og ved gjentatt manglende respons nedprioriteres i sorteringen

---

## 2. Booking-flyt fra stemmerens perspektiv

### 2.1 Push-varsling ved ny forespørsel — kritisk

En pianostemmer er **ute på oppdrag store deler av arbeidsdagen**. Hen sitter ikke foran en datamaskin og sjekker et nytt adminpanel.

**Krav:**
- Push-notifikasjon til mobiltelefon øyeblikkelig når en ny forespørsel lander innenfor stemmerens dekningsområde
- SMS som fallback hvis push-varsling ikke er aktivert
- E-postvarsling som tredje lag (kan være litt forsinket)
- Varslingsteksten bør inneholde: postnummer, pianotype, helsekarakter og ønsket tidsperiode — nok til å vurdere interesse uten å åpne appen

**Eksempel på ideell push-varslingstekst:**
> "Ny forespørsel: Oslo 0470 — Steinway klaver, Helsescore 48/100 (trenger stell), ønsket: januar–februar. Trykk for å se detaljer."

### 2.2 Godta/avvise med ett klikk

Når stemmeren åpner varslinga skal hen kunne:
1. Se full forespørsel (pianodata, diagnostikkrapport, adresse, ønsket tid)
2. **Godta med ett klikk** (velg dato fra kalender)
3. **Avvise med ett klikk** (valgfri årsak: "ikke ledig" / "utenfor rekkevidde" / "annet")
4. **Stille spørsmål** (enkel chat/melding til pianoeier)

Å kreve at stemmeren fyller ut skjema, logger inn på PC, eller navigerer gjennom mange steg er et garantert adopsjonsdrap.

### 2.3 Pianoets helsedata MÅ vises FØR stemmer aksepterer

Dette er en av PianoHelses viktigste verdier for stemmerne: **de vet hva de kommer til**.

Forespørselsvisningen MÅ inneholde (i prioritert rekkefølge):

1. **Stemmekurve-graf** — visuell oversikt over cent-avvik per tone
2. **Helsescore** (0–100) og status (God / Trenger stell / Kritisk)
3. **Gjennomsnittlig avvik** i cent og **maksimalt avvik** (verste tone)
4. **Opptrekk-indikasjon** — ja/nei basert på diagnostikk
5. **Pianotype** (klaver, flygel, spinett, digital hybridkl.)
6. **Pianoets merke og modell** (om oppgitt av eier)
7. **Siste kjente stemming** (om oppgitt — "stemmet for 3 år siden")
8. **Har pianoet nylig blitt flyttet?** (ja/nei)

Denne informasjonen reduserer overraskelser, gir grunnlag for riktig prisvurdering og gjør at stemmeren kan planlegge riktig utstyr og tidsbruk.

### 2.4 Adresse og parkering

For pianostemmere er logistikk viktig. Stemming av et konsertflygel krever annen parkering enn et oppdrag i en leilighet i 4. etasje uten heis.

**Forespørselsvisningen bør vise:**
- Fullstendig adresse (synlig kun etter godtatt booking — av personvernhensyn)
- Etasje og heistilgang (ja/nei)
- Parkeringsmuligheter (fri parkering / betaling / garasje)
- Særlige adgangsforhold (port, ringekode)

Disse opplysningene kan samles inn som del av pianoeiers bookingskjema.

---

## 3. Etter stemming

### 3.1 Enkel digital kvittering / faktura til kunde

Fakturahåndtering er en av **de største frustrasjonene** for pianostemmere i dag. Mange bruker lang tid på å sende fakturaer, og noen glemmer det. Mange kunder betaler kontant eller via Vipps, men institutsjoner (kirker, skoler) krever formell faktura.

**Plattformkrav:**
- Stemmer markerer oppdrag som fullført i appen
- Appen genererer automatisk kvittering/faktura med:
  - Dato og adresse for oppdraget
  - Tjenestebeskrivelse ("Pianostemming + opptrekk")
  - Pris inkl. MVA
  - Stemmerens org.nr. og kontaktinfo
  - Betalingsinformasjon (Vipps/konto)
- Kvitteringen sendes automatisk til kundens e-post
- Stemmeren mottar kopi

I Fase 2 bør dette kobles mot et enkelt regnskapssystem eller Fiken-integrasjon.

### 3.2 Mulighet for stemmer å legge inn notater om pianoets tilstand

Etter et besøk bør stemmeren raskt (1–2 minutter) kunne dokumentere:
- Utført arbeid (stemming, opptrekk, evt. regulering)
- Observerte problemer som ikke ble utbedret
- Anbefalt neste stemmetid
- Kommentar til Piano-dossier (synlig for kunden og fremtidige stemmere)

Disse notatene er **verdifulle for alle parter**:
- Kunden forstår tilstanden til pianoet sitt
- Neste stemmer (om kunden bytter) har historikk å bygge på
- PianoHelse bygger en unik database over pianohelsehistorikk

### 3.3 Betalingsintegrering — stemmerne vil IKKE sende faktura selv

En nøkkelbarriere for adopsjon er at plattformen øker administrasjonstiden. Betalingsintegrering løser dette.

**Fase 2-prioritet:**
- Kunde betaler via Vipps eller kort ved booking (depositum) eller etter fullføring
- Plattformen overfører beløpet til stemmer minus provisjon (10–15 %)
- Automatisk MVA-beregning og rapportering (da stemmere er MVA-pliktige over kr 50 000/år)
- Månedlig utbetaling med detaljert oversikt

---

## 4. Portal-funksjoner stemmeren trenger

### 4.1 Inntektsoversikt

Pianostemmere driver enkeltpersonforetak og trenger enkel likviditetsoversikt.

**Stemmerdashboard MÅ vise:**
- Inntekt denne måneden (og sammenlikning med forrige måned)
- Inntekt hittil i år
- Antall gjennomførte oppdrag siste 30 dager / år
- Utestående fakturaer (ubetalte)

**Visualisering:**
- Enkel søylediagram: månedlig inntekt siste 12 måneder
- "Neste utbetaling fra PianoHelse: kr X den DD.MM."

### 4.2 Statistikk over egne kunder

**Nyttige metrics stemmeren bør se:**
- Returkunderate: % av kunder som har booket igjen via plattformen
- Geografisk spredning: kart over egne oppdrag (hjelper med ruteplanlegging)
- Gjennomsnittlig tid mellom stemminger per kunde
- Kunder som nærmer seg anbefalt stemmedato (potensielle leads for stemmeren selv)

### 4.3 Venteliste-funksjon

Mange kunder ønsker stemming på et **bestemt tidspunkt** (f.eks. "før jul" eller "i januar") og er ikke avhengige av at det skjer umiddelbart. En venteliste-funksjon gir stemmeren:

- Oversikt over kunder som ønsker stemming i fremtiden
- Mulighet til å planlegge ruteoppdrag ("tre kunder i Bærum i mars — kjøre én runde")
- Redusert press i høysesong ved å spre etterspørselen jevnere

**Implementasjonskrav:**
- Kunde kan ved booking velge: "Snarest mulig" ELLER "Ønsket periode: [velg måned]"
- Stemmere ser venteliste sortert etter ønsket periode og geografisk klynge
- Stemmere kan sende tilbud til ventende kunder når de har ledig kapasitet

### 4.4 Varsling og kommunikasjon

**Kanaler stemmeren trenger varsling via:**
1. Push-notifikasjon i mobilnettleser (PWA) — primærkanal
2. SMS — for stemmere som ikke alltid sjekker mobil-apper aktivt
3. E-post — sekundærkanal, egnet for ukentlig oppsummering

**Varslingstyper:**
- Ny bookingforespørsel (øyeblikkelig)
- Booking akseptert av kunde (øyeblikkelig)
- Påminnelse om kommende oppdrag (24 timer i forveien)
- Ny anmeldelse mottatt (innen en time)
- Ukentlig oppsummering: oppdrag fullført, inntekter, nye leads

---

## 5. Onboarding av stemmere — hva PianoHelse må gjøre riktig fra dag én

### 5.1 Registrering

Registreringsprosessen MÅ ikke ta mer enn **15 minutter**. Krav:
- E-post + passord (ingen sosial login fra tredjeparter)
- Grunninfo: navn, org.nr., telefon, postnummer, dekningsradius
- NPTF-autorisasjonsnummer (verifiseres manuelt av PianoHelse-teamet innen 24 timer)
- Profilbeskrivelse (fritekst, max 300 tegn)
- Valgfri: profilbilde, linker til nettsted

Profilen aktiveres etter verifisering — dette er viktig for plattformens troverdighet.

### 5.2 Hva stemmeren MÅ forstå om PianoHelse fra starten

- Plattformen er **gratis i MVP-perioden** (ett år)
- **Provisjonsmodell** aktiveres i Fase 2 (estimert 10–15 % per oppdrag)
- PianoHelse er **ikke en konkurrent** — plattformen genererer nye kunder stemmeren ikke hadde fra før
- Diagnostikkrapporten er et verktøy for stemmeren — ikke en erstatning for faglig vurdering

### 5.3 Hva stemmerne frykter — og hvordan vi adresserer det

| Frykt | Vår respons |
|---|---|
| "Jeg mister kontrollen over mine kunder" | Eksisterende kunder er dine — vi hjelper deg finne nye |
| "Appen gir feil diagnose og kunden forventer noe annet" | Diagnosen er indikativ, ikke definitiv — stemmeren gjør den endelige faglige vurderingen |
| "Jeg vil ikke betale provisjon for kunder jeg allerede har" | Provisjon gjelder kun oppdrag booket via plattformen |
| "Det er for komplisert å lære et nytt system" | Onboarding tar 15 minutter; daglig bruk tar under 2 minutter per oppdrag |
