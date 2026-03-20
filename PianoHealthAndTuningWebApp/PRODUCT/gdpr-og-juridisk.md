# PianoHelse — GDPR og Juridisk Rammeverk
**Versjon:** 1.0 — Utkast til juridisk review
**Dato:** 20. mars 2026
**Forfatter:** Lead Coordinator
**Status:** Utkast — MÅ gjennomgås av juridisk rådgiver med GDPR-kompetanse FØR lansering

---

> **VIKTIG:** Dette dokumentet er et internt arbeidsutkast og IKKE en ferdig publisert juridisk tekst. Alle seksjoner markert [JURIDISK REVIEW] MÅ gjennomgås av en kvalifisert jurist med GDPR-kompetanse. Tekster markert [BRUKERVENDT TEKST] er ment som utkast til publiserte vilkår og erklæringer.

---

## Grunnlag og kilder

Dette dokumentet er utarbeidet med referanse til:
- **GDPR (Forordning (EU) 2016/679)** — Europaparlamentets og Rådets forordning om behandling av personopplysninger, gjeldende i Norge via EØS-avtalen og implementert i **Personopplysningsloven (LOV-2018-06-15-38)**.
- **Datatilsynets veiledninger** — datatilsynet.no, særlig veiledning om informasjonsplikten, samtykke, og lydopptak.
- **ePrivacy-direktivet (2002/58/EF)** — implementert i norsk rett via **ekomloven § 2-7b** — krav om samtykke til cookies og elektronisk sporing.
- **Angrerettloven (LOV-2014-06-20-27)** — norske forbrukeres angrerett ved kjøp av tjenester.
- **Forbrukertilsynets retningslinjer** — krav til markedsplasser, prisopplysning og vilkår (forbrukertilsynet.no).
- **Markedsføringsloven (LOV-2009-01-09-2)** — krav til markedsføring og handelspraksis i Norge.
- **Likestillings- og diskrimineringsloven § 17** — universell utforming av IKT-løsninger.

---

## 1. Personvernerklæring [BRUKERVENDT TEKST]

### 1.1 Hvem er behandlingsansvarlig?

**[BEDRIFTSNAVN] (PianoHelse)**
[Org.nr. XXXXXX — settes inn etter selskapsregistrering]
[Adresse]
[E-post: personvern@pianohelse.no]
[Telefon: XXXXXXXX]

PianoHelse er behandlingsansvarlig for personopplysningene du deler med oss via pianohelse.no.

### 1.2 Hvilke personopplysninger samler vi inn?

Vi samler inn følgende typer personopplysninger om deg, avhengig av hvordan du bruker tjenesten:

**Alle brukere (uten innlogging):**
- Ingen personopplysninger samles inn ved bruk av diagnostikkmodulen alene.
- Lydanalysen skjer *lokalt i nettleseren din* — ingen lyd overføres til våre servere.
- Vi bruker nødvendige informasjonskapsler (cookies) for teknisk drift av nettsiden (se avsnitt 3).

**Brukere som sender bookingforespørsel:**
- E-postadresse (påkrevd for å motta svar fra stemmere)
- Postnummer (for geografisk matching)
- Diagnostikkresultat/stemmekurve (JSON, ikke lyd) — kun med ditt samtykke

**Registrerte pianoeiere (Fase 2):**
- Navn, e-postadresse, postnummer
- Pianoopplysninger (merke, modell, alder, type)
- Diagnostikkhistorikk (JSON-resultater)
- Lydopptak (kun med eksplisitt samtykke, valgfritt)

**Registrerte pianostemmere (portalen):**
- Navn, firmanavn, organisasjonsnummer
- E-postadresse, telefonnummer
- Geografisk dekningsområde (kommuner/radius)
- Sertifiseringer og faglig bakgrunn
- Profilbilde (frivillig)
- Bankkontonummer / Stripe Express-kontoopplysninger (for utbetaling, Fase 2)

**Teknisk logging:**
- IP-adresse (lagres kortvarig for sikkerhet og feilsøking, maks 30 dager)
- Nettlesertype og skjermoppløsning (anonymisert, for kompatibilitetstesting)

### 1.3 Rettslig grunnlag for behandlingen (GDPR art. 6)

| Kategori personopplysning | Rettslig grunnlag | Hjemmel |
|---|---|---|
| E-postadresse (bookingforespørsel) | Avtaleoppfyllelse | Art. 6(1)(b) |
| Postnummer (matching) | Avtaleoppfyllelse | Art. 6(1)(b) |
| Diagnostikkresultat (JSON) | Samtykke (frivillig lagring) | Art. 6(1)(a) |
| Lydopptak (valgfritt) | Samtykke (eksplisitt opt-in) | Art. 6(1)(a) |
| Stemmer-profil | Avtaleoppfyllelse | Art. 6(1)(b) |
| Org.nr. og fakturering | Rettslig forpliktelse (bokføringsloven) | Art. 6(1)(c) |
| IP-adresse (sikkerhetslogg) | Berettiget interesse (sikkerhet) | Art. 6(1)(f) |
| Markedsføringse-poster (nyhetsbrev) | Samtykke | Art. 6(1)(a) |

> [JURIDISK REVIEW] Berettiget interesse for IP-logg bør dokumenteres i en interesseavveining (LIA — Legitimate Interest Assessment).

### 1.4 Hvem deler vi opplysninger med?

PianoHelse deler personopplysninger med følgende kategorier av mottakere:

**Pianostemmere:** Diagnoseresultater (ikke lyd) og kontaktopplysninger (postnummer, e-post) deles med relevante stemmere for å muliggjøre booking. Stemmere er bundet av konfidensialitetsforpliktelser i plattformvilkårene.

**Tekniske leverandører (databehandlere):**
- **Supabase Inc.** (database og lagring) — Frankfurt-region (EU). Databehandleravtale signert.
- **Resend Inc.** (e-post) — EU-region. Databehandleravtale signert.
- **Stripe Inc.** (betaling, Fase 2) — EU-region. Standard Contractual Clauses inngått.

Vi deler ikke personopplysninger med andre tredjeparter uten ditt samtykke, med mindre vi er pålagt dette ved lov.

**Vi selger ikke personopplysninger.**

### 1.5 Overføring til tredjeland

PianoHelse lagrer all data på servere i EU/EØS (Frankfurt, Tyskland). Stripe-betalingsdata kan behandles delvis i USA — Standard Contractual Clauses (SCCs) etter GDPR art. 46(2)(c) er inngått med Stripe.

### 1.6 Lagringsperioder

| Datakategori | Lagringsperiode | Begrunnelse |
|---|---|---|
| Bookingforespørsler (ikke-registrert) | 90 dager etter avsluttet dialog | Praktisk oppfølging |
| Diagnostikkresultat (JSON) — med samtykke | Inntil 3 år fra siste aktivitet | Historikk og påminnelse |
| Lydopptak — med samtykke | 30 dager etter fullfort oppdrag | Stemmers forberedelse |
| Stemmer-profil (aktiv) | Så lenge profil er aktiv + 30 dager | Aktiv tjenesteleverandør |
| Stemmer-profil (slettet/inaktiv) | 60 dager etter avslutning | Tvistehåndtering |
| Fakturaopplysninger (org.nr., betaling) | 5 år | Bokføringsloven § 13 |
| IP-adresser (sikkerhetslogg) | 30 dager | Sikkerhet |

### 1.7 Dine rettigheter

Som registrert har du følgende rettigheter etter GDPR:

- **Rett til innsyn (art. 15):** Du kan be om kopi av alle personopplysninger vi har om deg.
- **Rett til retting (art. 16):** Du kan be om at feil opplysninger korrigeres.
- **Rett til sletting (art. 17):** Du kan be om at vi sletter dine opplysninger ("retten til å bli glemt").
- **Rett til begrensning (art. 18):** Du kan be om at behandlingen begrenses mens en klage behandles.
- **Rett til dataportabilitet (art. 20):** Du kan be om å få dine data i et maskinlesbart format (JSON).
- **Rett til å protestere (art. 21):** Du kan protestere mot behandling basert på berettiget interesse.
- **Rett til å trekke samtykke:** Samtykke kan trekkes når som helst uten at det påvirker lovligheten av tidligere behandling.

**Slik utøver du rettighetene dine:**
Send e-post til personvern@pianohelse.no. Vi svarer innen 30 dager.

**Klage:**
Du kan klage til **Datatilsynet** (datatilsynet.no | postboks 458 Sentrum, 0105 Oslo | telefon: 22 39 69 00) dersom du mener vi behandler opplysningene dine i strid med GDPR.

### 1.8 Lydopptak — spesielt om mikrofontilgang

*[Brukervendt tekst som skal vises i diagnostikkmodulen, i tillegg til personvernerklæringen]*

> "For å analysere pianoets stemmetilstand, trenger vi tilgang til mobiltelefons mikrofon. **All lydanalyse skjer lokalt i nettleseren din — ingen lyd overføres til våre servere og ingen lyd lagres.** Mikrofonen aktiveres kun under aktiv analysesessjon og slippes umiddelbart etter. Du kan avslutte analysen og trekke mikrofontilgangen tilbake når som helst via nettleserens innstillinger."

> [JURIDISK REVIEW] Bekreft at klient-side lydanalyse uten overføring ikke utgjør "behandling" etter GDPR art. 4(2) utover det lokale. Confirm at "storage" trigger kun ved eksplisitt samtykke til lagring.

---

## 2. Brukervilkår — hovedelementer [BRUKERVENDT TEKST]

> [JURIDISK REVIEW] Disse punktene er en strukturert oversikt — den fullstendige juridiske teksten MÅ skrives av en jurist.

### 2.1 Avtaleparter

Disse vilkårene er en avtale mellom **[BEDRIFTSNAVN] (PianoHelse)** og deg som bruker av pianohelse.no. Ved å bruke tjenesten aksepterer du disse vilkårene.

Tjenesten er delt i to:
- **Pianoeier-tjenesten:** Diagnostikk og booking (tilgjengelig uten innlogging)
- **Stemmer-portalen:** Administrasjon av oppdrag (krever registrering og manuell godkjenning)

### 2.2 Ansvarsbegrensning for diagnostikkresultater

*[Denne teksten MÅ vises direkte på diagnostikk-resultatsiden — ikke bare i vilkårene]*

> "PianoHelse-diagnostikken måler pianoets tonehøyde per note og beregner avvik fra standard referansestemming (A4 = 440 Hz). Tjenesten er **indikativ** og **ikke et substitutt for faglig vurdering**.
>
> Diagnostikken oppdager ikke: mekaniske feil, strukturelle skader (sprukket lydskjell, brutte stifter), hammerslitasje, pedalproblem, intonasjonsfeil eller andre forhold som ikke er relatert til tonehøyde.
>
> PianoHelse AS er ikke ansvarlig for beslutninger tatt på bakgrunn av diagnostikkresultater. Vi anbefaler alltid at en sertifisert pianostemmer foretar en fysisk vurdering av instrumentet."

### 2.3 Krav til pianostemmere

Stemmere som registrerer seg på PianoHelse bekrefter at de:
- Er registrert som næringsdrivende i Brønnøysundregistrene (org.nr. kreves)
- Har nødvendig fagkompetanse for den tjenesten de tilbyr
- Er dekket av relevant ansvarsforsikring
- Ikke vil benytte personopplysninger mottatt via PianoHelse til andre formål enn oppdragets utførelse
- Ikke vil inngå oppdragsavtale med pianoeiere rekruttert via PianoHelse utenom plattformen i 12 måneder etter at plattformforholdet avsluttes

### 2.4 No-show og kanselleringspolicy

**For pianoeiere:**
- Gratis kansellering inntil 48 timer før avtalt tidspunkt
- Kansellering innen 48 timer: stemmer kompenseres for reisetid (fastsatt sats kr 350)
- No-show uten varsling: pianoeier kan ikke sende ny forespørsel i 30 dager

**For pianostemmere:**
- Stemmere MÅ varsle minst 24 timer ved kansellering
- No-show uten varsling: stemmerprofilen suspenderes umiddelbart, gjennomgang innen 24 timer
- Gjentatt no-show: permanent fjerning fra plattformen
- Pianoeier mottar automatisk full refusjon ved stemmer no-show

### 2.5 Tvisteløsning

**Internt:**
Klager sendes til support@pianohelse.no. Vi bekrefter mottak innen 24 timer og behandler innen 7 virkedager.

**Eksternt:**
Forbrukere i Norge har rett til å bringe tvister inn for:
- **Forbrukertilsynet** (forbrukertilsynet.no)
- **Forbrukerrådet** (forbrukerradet.no) for mekling
- **EU-kommisjonens Online Dispute Resolution-plattform** (ec.europa.eu/odr) for kjøp på nett

Norsk lov er gjeldende. Verneting: [Domstol TBD — normalt kjøperens hjemsted for forbrukeravtaler].

> [JURIDISK REVIEW] Bekreft riktig verneting for B2C-tvister i norsk rett.

### 2.6 Endringer i vilkårene

Vi varsler om vesentlige endringer via e-post til registrerte brukere med minimum 30 dagers varsel. Fortsatt bruk etter at endringer trer i kraft utgjør aksept.

---

## 3. Cookie-policy [BRUKERVENDT TEKST]

### 3.1 Hva er informasjonskapsler (cookies)?

Informasjonskapsler er små tekstfiler som lagres i nettleseren din. pianohelse.no bruker informasjonskapsler og lignende teknologier (LocalStorage, SessionStorage, IndexedDB).

### 3.2 Kategorier av informasjonskapsler vi bruker

**Kategori 1: Nødvendige (krever ikke samtykke)**

Disse er nødvendige for at nettsiden skal fungere og kan ikke slås av.

| Navn | Leverandør | Formål | Levetid |
|---|---|---|---|
| `sb-auth-token` | Supabase | Bevarer innloggingssesjon for pianostemmere | Sesjon / 7 dager |
| `scan-progress` | PianoHelse (IndexedDB) | Lagrer fremgang i pågående skanning lokalt | Til skanning fullføres |
| `cookie-consent` | PianoHelse | Registrerer brukerens valg i cookie-banneret | 12 måneder |

**Kategori 2: Analytiske (krever samtykke)**

Disse hjelper oss forstå hvordan nettsiden brukes. Ingen av disse er aktivert uten ditt samtykke.

| Navn | Leverandør | Formål | Levetid |
|---|---|---|---|
| `_ga`, `_ga_*` | Google Analytics (dersom aktivert) | Besøksstatistikk, sideflukt | 2 år |
| Alternativt: Plausible.io | Plausible (anbefalt, personvernvennlig) | Anonymisert trafikktelling, ingen persondata | Sesjon |

> **Anbefaling:** Bruk Plausible Analytics (EU-hostet, ingen cookies, GDPR-compliant uten samtykke) fremfor Google Analytics. Plausible lagrer ingen personopplysninger og krever ikke cookie-banner for egne sporingskoder.

**Kategori 3: Markedsføring (krever samtykke)**

PianoHelse bruker ingen markedsføringscookies i MVP. Facebook Pixel og Google Ads-koder MÅ IKKE settes inn uten aktiv samtykkeinnhenting.

### 3.3 Slik endrer du innstillinger

Du kan endre dine cookie-valg når som helst via cookie-innstillingsknappen i bunnteksten på pianohelse.no. Du kan også slette informasjonskapsler i nettleserens innstillinger.

### 3.4 Krav til cookie-banner

Cookie-banneret MÅ oppfylle følgende krav (Datatilsynets retningslinjer + ekomloven § 2-7b):
- Alle analytiske cookies er deaktivert som standard
- Bruker MÅ aktivt velge å akseptere analytiske cookies (ingen pre-valg)
- "Avvis alle" MÅ være like lett tilgjengelig som "Aksepter alle"
- Banneret MÅ vises ved første besøk og ved cookie-sletning
- Valget lagres i 12 måneder

---

## 4. Aldersgrense og mindreårige

### 4.1 Hvem kan bruke tjenesten?

Diagnostikktjenesten er åpen for alle uten aldersgrense, ettersom ingen personopplysninger samles inn ved bruk av diagnostikken alene.

For å sende bookingforespørsel, opprette konto eller inngå bindende avtale MÅ brukeren:
- Være fylt 18 år (for å inngå bindende avtale i henhold til avtaleloven)
- Alternativt: ha foreldres/foresattes samtykke

Brukere mellom 15 og 18 år kan opprette konto og lagre diagnostikkresultater med foreldresamtykke (GDPR art. 8, personopplysningsloven § 5 — 15-årsgrense i Norge).

### 4.2 Registreringsflyt — alderserklæring

Følgende tekst MÅ vises som obligatorisk avkrysningsrute ved registrering:

> ☐ "Jeg bekrefter at jeg er fylt 18 år, eller at jeg er forelder/foresatt som oppretter konto på vegne av barnet. Jeg bekrefter å ha lest og akseptert personvernerklæringen og brukervilkårene."

### 4.3 Barn under 15 år

PianoHelse er ikke bevisst rettet mot barn under 15 år. Dersom vi blir kjent med at en bruker under 15 år har gitt personopplysninger uten foreldresamtykke, sletter vi disse opplysningene umiddelbart. Foreldre/foresatte som har bekymringer, kan kontakte personvern@pianohelse.no.

---

## 5. GDPR-krav for lydopptak — spesifikt

### 5.1 Er lydopptak "særlige kategorier" av personopplysninger?

**Nei, ikke som utgangspunkt.** GDPR artikkel 9 lister opp "særlige kategorier" som inkluderer biometriske data brukt til å entydig identifisere en fysisk person. Lydopptak av pianotoner er ikke biometrisk data etter denne definisjonen.

Lydopptak er likevel personopplysninger (art. 4(1)) fordi de er knyttet til en brukers konto og kan inneholde bakgrunnsdata (stemmer i hjemmet, adresse-signaler). Eksplisitt samtykke er fortsatt det riktige rettslige grunnlaget.

> [JURIDISK REVIEW] Bekreft at klient-side lydbehandling som ikke overføres til server ikke utgjør "behandling" i GDPR forstand. Teknisk-arkitektur.md bekrefter at ingen lyd overføres, men dette bør bekrefte juridisk.

### 5.2 Samtykketekst for lydopptak (ved valgfri lagring)

*[Tekst som vises som frivillig opt-in checkbox etter diagnostikk er fullfort]*

> ☐ "Jeg samtykker til at PianoHelse lagrer et lydopptak av pianoanalysen min. Opptaket kan deles med stemmeren som aksepterer mitt oppdrag, slik at stemmeren kan forberede seg. Opptaket slettes automatisk 30 dager etter fullfort oppdrag, eller umiddelbart etter mitt ønske. Jeg kan trekke samtykket tilbake når som helst."

Viktig: Diagnostikkresultater (JSON-stemmekurve) lagres uavhengig av lydopptaket og krever separat samtykke.

### 5.3 Klient-side lydanalyse — teknisk personverngaranti

PianoHelse er bygget på et "privacy by design"-prinsipp (GDPR art. 25):

- **Ingen lyd overføres til serveren.** All tonehøydeanalyse skjer i nettleseren via UltimateDetector (JavaScript). Dette er en avgjørende arkitekturell beslutning som MÅ bevares i alle fremtidige versjoner.
- **Mikrofonen aktiveres kun under aktiv skanning.** JavaScript-koden frigjør mikrofon-stream umiddelbart etter at siste note er analysert.
- **Ingen analyse-metadata overføres.** Kun de beregnede cent-avvik per note (numeriske verdier) lagres — ikke rådata, ikke FFT-spekter.

---

## 6. Ansvarsfraskrivelse for diagnoseresultater

### 6.1 Standardtekst for resultatsiden [BRUKERVENDT TEKST]

*[Denne teksten MÅ vises tydelig på diagnostikk-resultatsiden — minimum font-størrelse 14px, tydelig kontrast]*

> **Viktig informasjon om diagnostikkresultatet**
>
> PianoHelse-diagnostikken er et hjelpeverktøy som måler tonehøydeavvik og gir en indikasjon på pianoets stemmetilstand. Tjenesten er **ikke** et substitutt for faglig vurdering av en sertifisert pianostemmer.
>
> Diagnostikken oppdager ikke:
> - Mekaniske feil i hammermekanikk, tangenter eller pedaler
> - Strukturelle skader som sprukket lydskjell, brutte stifter eller rust
> - Intonasjonsfeil (hammerfilsling)
> - Alle feil som påvirker klangkvalitet uten å endre tonehøyde
>
> Et "godt" diagnostikkresultat betyr at tonehøydene er nær referansestemming — det betyr ikke at pianoet er i perfekt stand.
>
> PianoHelse AS påtar seg intet ansvar for beslutninger tatt på grunnlag av diagnostikkresultatet. Kontakt alltid en kvalifisert fagperson for en fullstendig vurdering.

### 6.2 Ansvarsbegrensningsklausul i vilkårene [JURIDISK REVIEW]

Brukervilkårene MÅ inkludere en klausul som:
- Begrenser PianoHelse sitt erstatningsansvar til betalte plattformgebyrer i de siste 12 månedene
- Utelukker indirekte tap, følgeskader og tapt fortjeneste
- Bekrefter at tjenesten leveres "as is" uten garantier for nøyaktighet

> [JURIDISK REVIEW] Ansvarsbegrensningsklausuler i norsk forbrukerrett er underlagt Avtaleloven § 36 (urimelig avtaleklausul). En jurist MÅ bekrefte at begrensningene er juridisk holdbare overfor norske forbrukere.

---

## 7. Forbrukertilsynets krav — Angrerett og prising

### 7.1 Angrerettloven — 14 dagers angrerett

**Angrerettloven (LOV-2014-06-20-27) §§ 20–22** gir norske forbrukere 14 dagers angrerett ved kjøp av tjenester inngått på nettet. For PianoHelse betyr dette:

- En pianoeier som betaler for en stemmetjeneste, kan i teorien angre innen 14 dager — **selv etter at tjenesten er utført**.
- Loven gjør unntak (§ 22(1)(a)) dersom:
  1. Tjenesten er "fullt utført" (stemming gjennomført), OG
  2. Kunden på forhånd har **uttrykkelig bekreftet skriftlig** at angreretten bortfaller ved fullføring av tjenesten

### 7.2 Obligatorisk avkrysning ved bookingbekreftelse [BRUKERVENDT TEKST]

*[Obligatorisk avkrysningsrute — MÅ bekreftes FØR booking sendes]*

> ☐ "Jeg er klar over at stemmetjenesten er planlagt utført umiddelbart, og at jeg ved å krysse av her bekrefter at angreretten etter Angrerettloven § 22(1)(a) bortfaller når tjenesten er fullstendig utført. Jeg er kjent med at jeg likevel kan kansellere kostnadsfritt inntil 48 timer før avtalt tidspunkt."

### 7.3 Prisopplysninger — Forbrukertilsynets krav

Forbrukertilsynet krever at:
- Totalprisen for en tjeneste er tydelig oppgitt inkludert MVA
- Plattformgebyrer (provisjon) er transparente — hvem betaler hva
- Ingen skjulte avgifter legges til i bookingprosessen
- Prisen som vises i søk er lik prisen i bookingbekreftelsen

**PianoHelse-modell (Fase 2):**
- Pianoeier ser stemmerens pris inkl. MVA
- PianoHelse tar provisjon fra stemmeren — dette er synlig for stemmere i portalen
- Pianoeier betaler kun stemmerens pris — ingen ekstra plattformgebyr for pianoeiere

### 7.4 Faktura og kvittering

Alle pianoeiere som betaler via plattformen (Fase 2) MÅ motta:
- E-postkvittering umiddelbart etter betaling
- Faktura fra stemmeren (for B2B-kunder: fullstendig MVA-faktura)
- Oppsummering av utført tjeneste

### 7.5 Markedsføring — krav til annonser

Forbrukertilsynet og Markedsføringsloven krever:
- Annonser MÅ tydelig identifiseres som reklame (Markedsføringsloven § 3)
- Influencer-markedsføring MÅ merkes tydelig (#annonse, #reklame)
- Priser i annonser MÅ matche faktisk pris på nettsiden
- Geofokuserte tilbud MÅ ha klare geografiske begrensninger

---

## 8. Record of Processing Activities (RoPA) — GDPR art. 30

> [JURIDISK REVIEW] Dette er et intern compliance-dokument, ikke brukervendt tekst. Det MÅ holdes oppdatert ved alle endringer i behandlingsaktiviteter.

| ID | Behandlingsformål | Kategorier personopplysninger | Rettslig grunnlag | Mottakere | Lagringsperiode | Overføring til tredjeland |
|---|---|---|---|---|---|---|
| P-01 | Bookingforespørsel fra pianoeier | E-post, postnummer | Avtale (art. 6(1)(b)) | Stemmere i relevant region | 90 dager | Nei |
| P-02 | Lagring av diagnostikkresultat | Stemmekurve (JSON), piano-ID | Samtykke (art. 6(1)(a)) | Ingen (kun eier) | 3 år | Nei |
| P-03 | Valgfritt lydopptak | Lydopptak (binærfil), analyse-ID | Samtykke (art. 6(1)(a)) | Akseptert stemmer | 30 dager etter oppdrag | Nei |
| P-04 | Stemmer-profil og portalbruk | Navn, org.nr., e-post, tlf, kompetanse | Avtale (art. 6(1)(b)) | PianoHelse-admin | Aktiv profil + 60 dager | Nei |
| P-05 | Betalingsadministrasjon (Fase 2) | Betalingsinfo via Stripe | Avtale + rettslig forpliktelse | Stripe Inc. | 5 år (bokføring) | Ja (SCC) |
| P-06 | Sikkerhetslogging | IP-adresse, hendelsestype | Berettiget interesse (art. 6(1)(f)) | Ingen | 30 dager | Nei |
| P-07 | E-postkommunikasjon | E-postadresse, meldingsinnhold | Avtale / samtykke | Resend Inc. | 90 dager | Nei |
| P-08 | Markedsføring (nyhetsbrev) | E-postadresse, preferanser | Samtykke (art. 6(1)(a)) | Resend Inc. | Til avmelding | Nei |

---

## 9. Databehandleravtaler — sjekkliste

| Leverandør | DPA-status | EU-region | SCCs nødvendig | Kommentar |
|---|---|---|---|---|
| Supabase Inc. | [IKKE SIGNERT — MÅ GJØRES] | Frankfurt (EU) | Muligens (via AWS) | Sign via Supabase dashboard → Settings → Legal |
| Resend Inc. | [IKKE SIGNERT — MÅ GJØRES] | EU-hosting bekreftes | Undersøkes | Alternativt: Postmark med EU-hosting |
| Stripe Inc. | [IKKE SIGNERT — MÅ GJØRES] | EU-region | Ja (SCC tilgjengelig) | Standard DPA på stripe.com/legal |
| Vercel / CDN | [IKKE SIGNERT — MÅ GJØRES] | Kontroller region | Undersøkes | Vurder om statisk hosting krever DPA |
| Google Analytics (evt.) | Ikke aktuelt i MVP | Nei (USA) | Krevende | Sterkt anbefalt: bruk Plausible i stedet |

---

## 10. Hendelseshåndtering — personvernbrudd (GDPR art. 33)

PianoHelse MÅ varsle **Datatilsynet innen 72 timer** dersom et personvernbrudd oppdages som medfører risiko for personers rettigheter og friheter.

**Prosedyre:**
1. Brudd oppdaget → umiddelbar varsling til Lead Coordinator
2. Vurdering: Utgjør bruddet "risiko" for berørte personer?
3. Dersom ja: Varsling til Datatilsynet via datatilsynet.no (skjema tilgjengelig)
4. Dersom "høy risiko": OGSÅ direkte varsling til berørte brukere uten unødig opphold (art. 34)
5. Intern loggføring av alle hendelser, uansett alvorlighetsgrad

**Meldeskjema:** datatilsynet.no → "Meld et avvik"
**Kontaktinfo Datatilsynet:** postboks 458 Sentrum, 0105 Oslo | 22 39 69 00

---

## 11. Universell utforming (UU) og Tilgjengelighetserklæring

### 11.1 Rettslig krav

Likestillings- og diskrimineringsloven § 17 krever at IKT-løsninger rettet mot allmennheten oppfyller WCAG 2.1 nivå AA. Digitaliseringsdirektoratet (digdir.no) er tilsynsmyndighet.

### 11.2 Krav til publisert tilgjengelighetserklæring

PianoHelse MÅ publisere en tilgjengelighetserklæring på pianohelse.no/tilgjengelighet som inneholder:
- Angitt nivå av samsvar (AA)
- Kjente avvik fra standarden med begrunnelse
- Kontaktinformasjon for å melde tilgjengelighetsproblemer
- Lenke til Diskrimineringsnemnda for klager

**Mal:** Digitaliseringsdirektoratets verktøy på uutv.no kan brukes til å generere erklæringen.

### 11.3 Minimumskrav ved lansering

- [ ] Alle interaktive elementer er tilgjengelige med tastatur
- [ ] Kontrastratio minimum 4,5:1 for brødtekst (3:1 for store overskrifter)
- [ ] Stemmekurven har alternativ tekstlig representasjon (ARIA-label eller tabell)
- [ ] Feilmeldinger kommuniseres uten å være avhengige av farge alene
- [ ] Automatisk WCAG-skanning gjennomført (axe DevTools, WAVE) og kritiske feil utbedret
- [ ] Tilgjengelighetserklæring publisert

---

## 12. Implementeringsplan — juridisk og compliance

| Oppgave | Ansvarlig | Frist | Status |
|---|---|---|---|
| Signere DPA med Supabase | Developer | Uke 1 | Åpen |
| Signere DPA med Resend | Developer | Uke 1 | Åpen |
| Juridisk review av personvernerklæringen | Lead + jurist | Uke 3 | Åpen |
| Juridisk review av brukervilkår | Lead + jurist | Uke 3 | Åpen |
| Implementere cookie-banner | Developer | Uke 4 | Åpen |
| Implementere angrerettfraskrivelse i bookingflyt | Developer | Uke 5 | Åpen |
| Implementere alderserklæring i registreringsflyt | Developer | Uke 5 | Åpen |
| Publisere personvernerklæring på nettsted | Developer + Lead | Pre-lansering | Åpen |
| Publisere tilgjengelighetserklæring | Designer + Developer | Pre-lansering | Åpen |
| Oppdatere RoPA ved ny datakategori | Lead | Løpende | Åpen |
| MVA-rådgivning for Fase 2 | Economist + revisor | Uke 6–8 | Åpen |

---

*Dette dokumentet er utarbeidet av Lead Coordinator, 20. mars 2026.*
*Status: Arbeidsutkast — MÅ gjennomgås av juridisk rådgiver med GDPR-kompetanse FØR lansering.*
*Alle seksjoner markert [JURIDISK REVIEW] krever kvalifisert juridisk gjennomgang.*
*Dokumenteier: Lead Coordinator*
