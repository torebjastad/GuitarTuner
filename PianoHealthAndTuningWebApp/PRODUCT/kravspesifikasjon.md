# PianoHelse — Kravspesifikasjon
**Produktnavn:** PianoHelse
**Versjon:** 1.0
**Dato:** 20. mars 2026
**Forfatter:** Lead Coordinator
**Status:** Utkast til review

---

## 1. Produktbeskrivelse

### 1.1 Hva er PianoHelse?

PianoHelse er en norsk, nettbasert plattform som lar pianoeiere diagnostisere pianoets stemmetilstand ved hjelp av mikrofonen på mobiltelefonen eller PC-en, og deretter bestille en sertifisert pianostemmer gjennom en integrert markedsplass.

Plattformen løser to problemer i ett:

**For pianoeieren:**
Det er vanskelig å vite om pianoet trenger stemming uten faglig bakgrunn. PianoHelse gjør diagnosen objektiv, enkel og gratis. I stedet for å spørre seg selv "høres det riktig ut?", kan pianoeieren få et konkret tall: "Pianoet ditt er i gjennomsnitt 18 cent ute av stemmning — det anbefales stemming."

**For pianostemmeren:**
Det er tidkrevende å fylle opp kalenderen, kommunisere med kunder og administrere oppdrag. PianoHelse gir stemmeren en strøm av forhåndsverifiserte leads med diagnostikkrapport vedlagt — slik at de vet hva som møter dem før de ankommer.

### 1.2 Kjernebrukeropplevelse

En typisk sekvens for en privatperson:

1. Besøker pianohelse.no på mobiltelefonen
2. Trykker "Sjekk pianoet ditt" — ingen innlogging nødvendig
3. Gir mikrofontilgang
4. Spiller alle 52 hvite tangenter én etter én (guiding på skjermen)
5. Ser stemmekurven og helsekarakteren: **Bra / Trenger stell / Kritisk**
6. Leser en norsk forklaring av resultatet
7. Trykker "Book en stemmer" — fyller inn postnummer og e-post
8. Mottar tilbud fra stemmere i nærheten innen 24 timer
9. Velger stemmer, bekrefter tid — ferdig

### 1.3 Produktgrenser (scope)

**Inkludert i PianoHelse:**
- Stemmediagnostikk basert på lydanalyse (tonehøydedetektor)
- Visning av stemmekurve og helsekarakter
- Bookingforespørsel til pianostemmere
- Stemmerportal (se jobber, send tilbud, administrer profil)
- Norsk grensesnitt gjennomgående

**Ikke inkludert (Fase 1 MVP):**
- Analyse av regulering, intonasjon, pedaler eller mekanikk
- Betaling via plattformen (stemmere fakturerer direkte)
- Mobilapp (native iOS/Android)
- Automatisk geografisk matching (gjøres manuelt i MVP)

---

## 2. Brukergrupper og Personas

### 2.1 Pianoeier — "Kari"

**Bakgrunn:** Kari er 42 år, har et barn som tar kulturskoleundervisning i piano. Pianoet arvet hun fra moren. Hun spiller lite selv men ønsker at barnet har et godt instrument. Hun er ikke musiker og kjenner ikke fagbegrepene.

**Mål:**
- Forstå om pianoet er i god nok stand
- Finne en pålitelig stemmer uten å måtte spørre venner om tips
- Betale rimelig og vite hva hun betaler for

**Frustrasjon:**
- Vet ikke hvem som er god stemmer
- Synes det er vanskelig å booke — ingen klar oversikt
- Har glemt å stemme pianoet for lenge siden og vet det

**Teknisk nivå:** Vanlig smarttelefonbruker. Bruker Vipps og Finn.no daglig.

---

### 2.2 Pianoeier — "Henrik"

**Bakgrunn:** Henrik er 65 år, pensjonert musiklærer. Har spilt piano hele livet. Eier et Steinway-flygelklaver fra 1978. Er bevisst på pianostellet men ønsker mer kontroll og dokumentasjon.

**Mål:**
- Se om pianoet er stabilt mellom stemmingene
- Ha historikk over pianoets utvikling
- Finne stemmere med kompetanse på eldre instrumenter

**Frustrasjon:**
- Stemmeren han brukte sluttet å praktisere — må starte letingen på nytt
- Ønsker mer enn bare stemming: regulering, intonasjon

---

### 2.3 Pianostemmer — "Lars"

**Bakgrunn:** Lars er 38 år, utdannet pianostemmer og pianoteknikker. Driver enkeltpersonforetak. Har 60 faste kunder, jobber i Oslo og Akershus. Bruker e-post og telefon til kommunikasjon i dag.

**Mål:**
- Fylle tomme slots i kalenderen
- Slippe å jage etter leads
- Få informasjon om pianots tilstand FØR han ankommer

**Frustrasjon:**
- No-shows og kunder som ikke vet hva de bestiller
- Bruker for mye tid på administrasjon
- Har ingen online tilstedeværelse utover et enkelt visittkort-nettsted

---

### 2.4 Kulturskolelærer / Institusjonell bruker — "Tone"

**Bakgrunn:** Tone er rektor ved en kulturskole med 8 pianoer. Har ansvar for instrumentstell men lite budsjett. Vil ha dokumentasjon for å begrunne stemmekostnader overfor kommunen.

**Mål:**
- Se status på alle 8 instrumenter samlet
- Booke stemmeoppdrag effektivt for alle pianoer
- Ha dokumentasjon i en rapport

---

## 3. Brukerhistorier

### 3.1 Pianoeier-brukerhistorier

#### US-P-01: Diagnostisere pianoet
> Som **pianoeier** ønsker jeg å **sjekke om pianoet mitt er i stemmning** uten å måtte ha fagkunnskaper, slik at jeg **kan ta en informert beslutning om stemming er nødvendig.**

**Akseptansekriterier:**
- [ ] Brukeren kan starte diagnostikken uten innlogging
- [ ] Diagnostikken ber om mikrofontilgang og forklarer tydelig (norsk) hvorfor
- [ ] Brukeren guides gjennom alle tangentene med visuell og tekstlig anvisning
- [ ] Resultatet vises som en stemmekurve med cent-avvik per note
- [ ] Resultatet vises med en av tre helsekarakterer: "Bra", "Trenger stell", "Kritisk"
- [ ] Norsk forklaring følger helsekarakteren, uten fagsjargong
- [ ] Hele sekvensen tar under 10 minutter for en vanlig bruker
- [ ] Tjenesten fungerer på mobiltelefon (iOS Safari og Android Chrome)

#### US-P-02: Forstå stemmekurven
> Som **pianoeier** ønsker jeg å **forstå hva stemmekurven betyr** slik at jeg **vet hva som er galt med pianoet mitt.**

**Akseptansekriterier:**
- [ ] Kurven viser avvik i cent per note (visuel fargeindikasjon: grønn/gul/rød)
- [ ] En tooltip eller forklaring viser hva "cent" betyr i et enkelt eksempel
- [ ] Kurven viser gjennomsnittlig avvik for bass, midtregister og diskant separat
- [ ] Brukeren kan se hvilke noter som er mest ute av stemmning
- [ ] Rapporten er mulig å dele (lenke eller PDF-nedlasting)

#### US-P-03: Bestille stemming
> Som **pianoeier** ønsker jeg å **bestille en pianostemmer i nærheten** slik at jeg **enkelt får hjelp uten å måtte lete selv.**

**Akseptansekriterier:**
- [ ] Etter diagnostikken vises en "Book stemmer"-knapp
- [ ] Brukeren oppgir: postnummer, kontakt-e-post, og ønsket tidsperiode (uke/måned)
- [ ] Diagnostikkrapporten følger automatisk med bookingforespørselen
- [ ] Brukeren mottar e-postbekreftelse med sammendrag
- [ ] Brukeren mottar tilbud fra stemmere innen rimelig tid (mål: 24 timer)

#### US-P-04: Velge stemmer
> Som **pianoeier** ønsker jeg å **se og sammenligne tilbud fra stemmere** slik at jeg **kan velge den som passer best for meg.**

**Akseptansekriterier:**
- [ ] Stemmerprofil viser: navn, erfaring, spesialiteter, prisanslag, anmeldelser
- [ ] Geografisk avstand fra pianoeier er synlig
- [ ] Tilbudet inkluderer estimert pris og foreslåtte tidspunkter
- [ ] Brukeren kan godta et tilbud med ett klikk og bekrefte via e-post

#### US-P-05: Se historikk
> Som **pianoeier** ønsker jeg å **se historikken over pianoets stemmeutvikling** slik at jeg **kan dokumentere tilstanden over tid.**

**Akseptansekriterier:**
- [ ] Registrert bruker kan se alle tidligere diagnostikktester
- [ ] Historikken viser dato, helsekarakter og gjennomsnittlig avvik
- [ ] Tydelig graf som viser utvikling over tid
- [ ] Historikken kan lastes ned som PDF
*[Prioritet: Fase 2]*

#### US-P-06: Motta påminnelse
> Som **pianoeier** ønsker jeg å **motta en påminnelse når det er på tide å stemme pianoet igjen** slik at jeg **ikke glemmer viktig vedlikehold.**

**Akseptansekriterier:**
- [ ] Brukeren kan velge å motta e-postpåminnelse (6 måneder eller 12 måneder)
- [ ] Påminnelsese-posten inneholder lenke til ny diagnostikk
- [ ] Brukeren kan lett avmelde seg
*[Prioritet: Fase 2]*

---

### 3.2 Pianostemmer-brukerhistorier

#### US-S-01: Registrere seg som stemmer
> Som **pianostemmer** ønsker jeg å **opprette en profil på PianoHelse** slik at jeg **kan nå nye kunder og fylle opp kalenderen min.**

**Akseptansekriterier:**
- [ ] Stemmeren kan registrere seg via e-post og passord
- [ ] Profilen samler inn: navn, firma/org.nr., telefon, geografisk dekningsområde (kommuner/postnummerradius)
- [ ] Stemmeren kan laste opp: profilbilde, sertifiseringer, beskrivelse
- [ ] Profilen aktiveres etter manuell godkjenning av PianoHelse-teamet (MVP) eller automatisk verifisering (Fase 2)
- [ ] Stemmeren mottar bekreftelse på e-post

#### US-S-02: Se tilgjengelige oppdrag
> Som **pianostemmer** ønsker jeg å **se forespørsler fra pianoeiere i mitt område** slik at jeg **kan velge oppdrag som passer for meg.**

**Akseptansekriterier:**
- [ ] Innlogget stemmer ser en liste over åpne forespørsler innenfor sitt dekningsområde
- [ ] Hver forespørsel viser: postnummer, pianotype (om oppgitt), diagnostikkrapport, ønsket tidspunkt
- [ ] Stemmeren kan se stemmekurven og helsekarakteren for pianoet
- [ ] Forespørsler kan filtreres på geografisk avstand og tidsperiode

#### US-S-03: Sende tilbud
> Som **pianostemmer** ønsker jeg å **sende et tilbud til en pianoeier** slik at jeg **kan sikre meg oppdraget.**

**Akseptansekriterier:**
- [ ] Stemmeren kan sende tilbud med: estimert pris, foreslåtte tidspunkter (min. 2), og en valgfri kommentar
- [ ] Pianoeier mottar e-postvarsling om tilbudet umiddelbart
- [ ] Stemmeren ser status på sendte tilbud (venter/akseptert/avvist)
- [ ] Stemmeren mottar e-postvarsling når tilbudet aksepteres

#### US-S-04: Administrere bookinger
> Som **pianostemmer** ønsker jeg å **se og administrere mine bekreftede oppdrag** slik at jeg **har full oversikt over kalenderen min.**

**Akseptansekriterier:**
- [ ] Dashboard viser kommende og fullførte oppdrag
- [ ] Hvert oppdrag viser: dato, adresse (postnummer), pianoeiers kontaktinfo, diagnostikkrapport
- [ ] Stemmeren kan markere oppdrag som fullført
- [ ] Fullførte oppdrag lagres i historikk
*[Kalenderintegrasjon: Fase 2]*

#### US-S-05: Motta anmeldelse
> Som **pianostemmer** ønsker jeg at **pianoeiere kan skrive anmeldelse etter oppdraget** slik at jeg **kan bygge omdømme på plattformen.**

**Akseptansekriterier:**
- [ ] Etter et bekreftet oppdrag sendes pianoeier automatisk e-post med forespørsel om anmeldelse
- [ ] Anmeldelsen inneholder: stjernervurdering (1–5) og fritekskommentar
- [ ] Anmeldelsene vises offentlig på stemmerens profil
- [ ] Stemmeren kan svare på anmeldelser
*[Prioritet: Fase 2]*

---

## 4. Funksjonelle Krav

### 4.1 Diagnostikkmodul

| ID | Krav | Prioritet |
|---|---|---|
| F-D-01 | Systemet MÅ be om mikrofontilgang via WebRTC/getUserMedia-API | MVP |
| F-D-02 | Systemet MÅ analysere tonehøyde via UltimateDetector (klient-side JavaScript) | MVP |
| F-D-03 | Systemet MÅ dekke hele pianoregisteret: A0 (27,5 Hz) til C8 (4186 Hz) | MVP |
| F-D-04 | Systemet MÅ presentere stemmekurve som visuel graf (cent-avvik per note) | MVP |
| F-D-05 | Systemet MÅ beregne helsekarakter basert på gjennomsnittlig avvik og spredning | MVP |
| F-D-06 | Systemet MÅ gi tydelig norsk tilbakemelding til bruker i hvert steg | MVP |
| F-D-07 | Systemet MÅ gi feilmelding ved for mye bakgrunnsstøy (SNR-sjekk) | MVP |
| F-D-08 | Systemet BØR støtte ekstern mikrofon via standard 3,5 mm / USB | Fase 2 |
| F-D-09 | Systemet BØR lagre diagnostikkrapport (med samtykke) for historikk | Fase 2 |
| F-D-10 | Systemet KAN tilby eksport av rapport som PDF | Fase 2 |

### 4.2 Helsekarakter-beregning

Helsekarakteren beregnes basert på gjennomsnittlig absolutt avvik (Mean Absolute Deviation, MAD) av cent-avvik over alle spilte noter:

| Helsekarakter | Norsk | Kriterium |
|---|---|---|
| God | "Pianoet er i god stemmning" | MAD ≤ 10 cent |
| Trenger stell | "Pianoet bør stemmes snart" | 10 < MAD ≤ 30 cent |
| Kritisk | "Pianoet er betydelig ute av stemmning" | MAD > 30 cent |

**OBS:** Disse tersklene skal valideres med Piano Tuner Expert (se åpen beslutning O-003).

I tillegg beregnes:
- Gjennomsnittlig absoluttavvik per register (bass / midtregister / diskant)
- Maksimalt avvik (verste enkeltote)
- Indikasjon på om opptrekk (pitch raise) er nødvendig (> 50 cent gjennomsnittlig avvik fra A440)

### 4.3 Bookingmodul (MVP)

| ID | Krav | Prioritet |
|---|---|---|
| F-B-01 | Brukeren MÅ kunne sende bookingforespørsel uten å opprette konto | MVP |
| F-B-02 | Forespørsel MÅ inneholde: postnummer, e-post, diagnostikkrapport, ønsket periode | MVP |
| F-B-03 | Systemet MÅ sende e-postbekreftelse til pianoeier | MVP |
| F-B-04 | Systemet MÅ varsle relevante stemmere om ny forespørsel | MVP |
| F-B-05 | Stemmere MÅ kunne sende tilbud via plattformen | MVP |
| F-B-06 | Pianoeier MÅ motta e-postvarsling for hvert tilbud | MVP |
| F-B-07 | Pianoeier MÅ kunne akseptere tilbud via e-postlenke | MVP |
| F-B-08 | Betaling via plattformen SKAL ikke kreves i MVP | MVP |
| F-B-09 | Betaling via Vipps og kort BØR implementeres i Fase 2 | Fase 2 |
| F-B-10 | Automatisk geomatch (radius) BØR implementeres i Fase 2 | Fase 2 |

### 4.4 Stemmerportal

| ID | Krav | Prioritet |
|---|---|---|
| F-SP-01 | Stemmere MÅ kunne registrere seg og administrere profil | MVP |
| F-SP-02 | Stemmerportal MÅ vise åpne forespørsler innenfor dekningsområde | MVP |
| F-SP-03 | Stemmere MÅ kunne sende tilbud til pianoeiere | MVP |
| F-SP-04 | Stemmere MÅ ha dashboard med oversikt over aktive og fullførte oppdrag | MVP |
| F-SP-05 | Stemmere MÅ godkjennes manuelt av PianoHelse-teamet (MVP) | MVP |
| F-SP-06 | Stemmere BØR ha kalendervisning og Outlook/Google-integrasjon | Fase 2 |
| F-SP-07 | Stemmere BØR motta anmeldelser og ratings etter oppdrag | Fase 2 |

### 4.5 Brukerkontoer og Autentisering

| ID | Krav | Prioritet |
|---|---|---|
| F-A-01 | Diagnostikk MÅ være tilgjengelig uten innlogging | MVP |
| F-A-02 | Stemmere MÅ logge inn med e-post og passord (HTTPS) | MVP |
| F-A-03 | Pianoeiere KAN opprette konto for å lagre historikk | Fase 2 |
| F-A-04 | Passord MÅ lagres som bcrypt-hash (min. kostfaktor 12) | MVP |
| F-A-05 | Glemt passord-flyt MÅ finnes | MVP |
| F-A-06 | BankID/Vipps-innlogging KAN innføres for høyere tillitsnivå | Fase 3 |

---

## 5. Ikke-funksjonelle Krav

### 5.1 Ytelse

| ID | Krav |
|---|---|
| NF-Y-01 | Diagnostikkmodulen MÅ starte (første analyse) innen 3 sekunder etter mikrofontilgang er gitt |
| NF-Y-02 | Tonehøydeanalyse (UltimateDetector) MÅ returnere resultat innen 500 ms per tone |
| NF-Y-03 | Stemmekurven MÅ rendres innen 1 sekund etter siste analyse |
| NF-Y-04 | Nettsiden (index.html) MÅ ha Lighthouse Performance Score > 85 på mobil |
| NF-Y-05 | Backend-API MÅ svare innen 500 ms for 95 % av forespørsler under normal last |

### 5.2 Tilgjengelighet (UU)

| ID | Krav |
|---|---|
| NF-UU-01 | Grensesnittet MÅ tilfredsstille WCAG 2.1 Nivå AA |
| NF-UU-02 | Alle interaktive elementer MÅ være nåbare med tastatur |
| NF-UU-03 | Kontrastratio MÅ være minimum 4,5:1 for brødtekst |
| NF-UU-04 | Stemmekurven MÅ ha en alternativ tekstlig fremstilling for synshemmede |
| NF-UU-05 | Feilmeldinger MÅ være forståelige uten farger (ingen "kun rød/grønn") |

### 5.3 Sikkerhet

| ID | Krav |
|---|---|
| NF-S-01 | All kommunikasjon MÅ skje over HTTPS (TLS 1.2 minimum, TLS 1.3 anbefalt) |
| NF-S-02 | API-endepunkter MÅ beskyttes mot SQL-injeksjon (parameteriserte spørringer) |
| NF-S-03 | CSRF-beskyttelse MÅ implementeres for alle POST/PUT/DELETE-endepunkter |
| NF-S-04 | Rate limiting MÅ implementeres på alle offentlige API-endepunkter |
| NF-S-05 | Brukerpassord MÅ aldri lagres i klartekst |
| NF-S-06 | E-postadresser og postnummer er personopplysninger og MÅ behandles etter GDPR |
| NF-S-07 | Applikasjonen MÅ ha en ansvarlig offentliggjøringspolicy (security.txt) |

### 5.4 Personvern og GDPR

PianoHelse behandler personopplysninger og er underlagt GDPR (Personopplysningsloven, LOV-2018-06-15-38) samt Datatilsynets retningslinjer.

| ID | Krav |
|---|---|
| NF-P-01 | All lydanalyse MÅ behandles klient-side — ingen lyd overføres til server |
| NF-P-02 | Brukeren MÅ informeres tydelig om hvilke opplysninger som samles (navn, e-post, postnummer) |
| NF-P-03 | Samtykke MÅ innhentes aktivt (ikke forhåndsavkrysset) for lagring av diagnostikkresultater |
| NF-P-04 | Brukeren MÅ ha rett til innsyn i egne opplysninger (jf. GDPR art. 15) |
| NF-P-05 | Brukeren MÅ ha rett til sletting ("retten til å bli glemt", jf. GDPR art. 17) |
| NF-P-06 | Behandlingsgrunnlag MÅ dokumenteres for alle kategorier personopplysninger |
| NF-P-07 | Servere for personopplysninger MÅ ligge innenfor EØS |
| NF-P-08 | Personvernerklæringen MÅ være skrevet på norsk, klart og forståelig språk |
| NF-P-09 | Databehandleravtale MÅ inngås med alle underleverandører (skyplattform, e-posttjeneste, betaling) |
| NF-P-10 | Brudd på personvernet MÅ varsles til Datatilsynet innen 72 timer (jf. GDPR art. 33) |

**Spesielt om mikrofontilgang:**
Siden all lydanalyse skjer klient-side, sendes ingen lyd til serveren. Dette er kjernen i vår personvernarkitektur. Applikasjonen MÅ på hvert tidspunkt kommunisere dette tydelig til brukeren. Mikrofonen aktiveres kun under aktiv diagnosesessjon og slippes umiddelbart etter.

### 5.5 Kompatibilitet

| ID | Krav |
|---|---|
| NF-K-01 | Applikasjonen MÅ fungere på iOS Safari (iOS 15+) |
| NF-K-02 | Applikasjonen MÅ fungere på Android Chrome (Chrome 100+) |
| NF-K-03 | Applikasjonen MÅ fungere på desktop Chrome, Firefox og Edge (siste 2 versjoner) |
| NF-K-04 | Web Audio API (AudioContext, getUserMedia) er PÅKREVD — applikasjonen MÅ gi tydelig feilmelding på nettlesere som ikke støtter dette |
| NF-K-05 | Applikasjonen SKAL fungere på skjermstørrelser fra 320 px til 1920 px bredde |

### 5.6 Reliabilitet og Drift

| ID | Krav |
|---|---|
| NF-R-01 | Systemet MÅ ha oppetid på minimum 99,5 % (månedlig) |
| NF-R-02 | Kritiske feil i produksjon MÅ ha responsplan med mål om løsning innen 4 timer |
| NF-R-03 | Database-backup MÅ kjøres daglig |
| NF-R-04 | Backup MÅ testes månedlig (gjenoppretting) |

### 5.7 Lokalisering og Språk

| ID | Krav |
|---|---|
| NF-L-01 | Norsk bokmål er primærspråk — ALL brukervendt tekst MÅ være på norsk bokmål |
| NF-L-02 | Uformelt "du"-form MÅ brukes konsistent i alle henvendelser til brukeren |
| NF-L-03 | Feilmeldinger MÅ aldri vise teknisk sjargong til sluttbrukeren |
| NF-L-04 | Valuta vises i norske kroner (NOK) |
| NF-L-05 | Datoer vises i norsk format (DD.MM.ÅÅÅÅ) |
| NF-L-06 | Nynorsk og engelsk er sekundærspråk — ikke i scope for MVP |

---

## 6. Systemkontekst og Integrasjoner

### 6.1 Integrasjonskart (MVP)

```
[Nettleser]
    ├── Web Audio API (lokal, ingen serverkobling)
    │       └── UltimateDetector.js (pitch detection)
    └── HTTP/HTTPS → [PianoHelse Backend API]
                            ├── Brukerdata → [Database (PostgreSQL/SQLite)]
                            ├── E-post → [Sendgrid / Postmark API]
                            └── Geolokasjon → [Postnummer-API Norge]
```

### 6.2 Integrasjonskart (Fase 2 tillegg)

```
[PianoHelse Backend]
    ├── Betaling → [Vipps eCom API]
    ├── Betaling → [Stripe API]
    ├── Kalender → [Google Calendar API / iCal]
    └── SMS-varsler → [Twilio / Vonage Norge]
```

### 6.3 Ekstern data — Postnummerregister

For geografisk matching brukes Bring / Posten Norges åpne postnummerregister (fritt tilgjengelig API).

---

## 7. Datamodell (Konseptuell)

### Entiteter

**Diagnose**
- `id`, `opprettet_dato`, `noter[]` (note + cent-avvik), `helsekarakter`, `gjennomsnittlig_avvik`, `maksimalt_avvik`, `stemmers_kommentar`, `piano_id` (Fase 2)

**Bruker (Pianoeier)**
- `id`, `e-post`, `postnummer`, `samtykke_dato`, `samtykke_type`

**Stemmer**
- `id`, `navn`, `firma_navn`, `org_nummer`, `e-post`, `telefon`, `postnumre_dekning[]`, `sertifiseringer[]`, `aktiv`, `godkjent_dato`

**Bookingforespørsel**
- `id`, `pianoeier_epost`, `pianoeier_postnummer`, `ønsket_periode`, `diagnose_id`, `status` (åpen/tilbudt/akseptert/fullført/avbrutt), `opprettet_dato`

**Tilbud**
- `id`, `forespørsel_id`, `stemmer_id`, `pris_nok`, `foreslåtte_tidspunkter[]`, `kommentar`, `status`, `opprettet_dato`

**Anmeldelse** *(Fase 2)*
- `id`, `stemmer_id`, `booking_id`, `stjerner` (1–5), `tekst`, `publisert_dato`

---

## 8. Brukergrensesnittskrav (UX-prinsipper)

### 8.1 Overordnede designprinsipper
1. **Mobil-først** — all design starter med 375 px bredde
2. **Progressiv avsløring** — vis kun det brukeren trenger akkurat nå
3. **Nulltilstand er hjelpsom** — tomme tilstander gir instruksjoner, ikke bare blanke sider
4. **Feil er forventede** — gi spesifikke, konstruktive feilmeldinger på norsk
5. **Minst mulig friksjon** — diagnostikk MÅ være mulig uten konto, e-post, eller passord

### 8.2 Navigasjonsstruktur (MVP)

```
/ (Forside)
├── /sjekk         → Diagnostikkmodul
│       └── /sjekk/resultat → Stemmekurve + helsekarakter
├── /book          → Bookingforespørselsflyt
│       └── /book/bekreftet → Bekreftelsesside
├── /stemmere      → Offentlig stemmer-liste (valgfritt)
├── /stemmer-portal → Innloggingsbeskyttet stemmerportal
│       ├── /stemmer-portal/dashboard
│       ├── /stemmer-portal/forespørsler
│       ├── /stemmer-portal/mine-oppdrag
│       └── /stemmer-portal/profil
└── /om-oss
```

### 8.3 Diagnostikk-flow (detaljert)

1. **Velkomstside:** "Sjekk pianoet ditt på 5 minutter." Stor CTA-knapp. Enkel forklaring av hva som skjer.
2. **Forberedelse:** "Sørg for at rommet er stille. Plasser telefonen 20–30 cm fra pianotangentene."
3. **Mikrofontilgang:** Nettleserdialog + forklaring: "Mikrofonilgang brukes kun for å analysere tonen. Ingen lyd lagres."
4. **Tangentguide:** Visuell klaviaturillustrasjon. Aktuell tangent markeres. Lysdetektor gir grønt lys når tonen er registrert.
5. **Fremdriftsindikator:** "23 av 52 tangenter analysert"
6. **Analysering:** "Beregner stemmetilstand..."
7. **Resultat:** Stor helsekarakter, stemmekurve-graf, norsk forklaring, CTA "Book stemmer" eller "Del rapporten"

---

## 9. Akseptansekriterier for Release

For at MVP kan defineres som ferdig og klar for lansering MÅ følgende være oppfylt:

### Funksjonell akseptanse
- [ ] Diagnostikken fungerer korrekt for alle 52 hvite tangenter (A0–C8)
- [ ] Diagnostikkfeil < 2 % på referanseinstrument (testet i stille rom)
- [ ] Bookingforespørsel kan sendes og bekreftes via e-post
- [ ] Stemmerprofil kan opprettes, redigeres og aktiveres
- [ ] Stemmere kan se og svare på forespørsler
- [ ] Alle tekster er på norsk bokmål, "du"-form konsistent

### Teknisk akseptanse
- [ ] HTTPS aktivert og sertifikat gyldig
- [ ] Lighthouse Score > 85 (Performance, Accessibility, Best Practices) på mobil
- [ ] WCAG 2.1 AA — ingen kritiske feil i automatisk scan (axe/WAVE)
- [ ] GDPR-samsvar bekreftet av jurist (eller intern review etter sjekkliste)
- [ ] Personvernerklæring publisert på norsk
- [ ] Cookiesamtykke implementert
- [ ] Ingen brukerdata lagret uten eksplisitt samtykke

### Driftsakseptanse
- [ ] Applikasjonen kjører stabilt i produksjonsmiljø i 48 timer uten kritiske feil
- [ ] Backup-prosedyre bekreftet
- [ ] Overvåking og feillogging aktivert

---

## 10. Ordliste (norsk/faglig)

| Term | Forklaring |
|---|---|
| **Stemmning / stemmung** | Pianoets tonehøyde-innstilling — om hver tone svarer til riktig frekvens |
| **Cent** | Musikalsk enhet for tonehøydeavvik. 100 cent = ett halvtonetrinn. ±10 cent er knapt hørbart for de fleste. |
| **A440** | Standardreferanse: A i 4. oktav er 440 Hz (kammertone) |
| **Opptrekk (pitch raise)** | Prosedyre der pianoet løftes fra lavere til korrekt tonehøyde — nødvendig hvis det er sterkt nedstemt |
| **Regulering** | Justering av pianoets mekanikk (tangentfall, hammerslag) — ikke det samme som stemming |
| **Intonasjon** | Forming av hammerfilten for å justere klangkvalitet — skilles fra stemming |
| **MAD** | Mean Absolute Deviation — gjennomsnittlig absolutt avvik, brukt som helseindikator |
| **Pianostemmer / pianotemmer** | Fagperson som stemmer pianoer. Begge former brukes; "pianostemmer" er vanligst. |
| **UltimateDetector** | Navn på den JavaScript-baserte tonehøydedetektoren som brukes i diagnostikken |
| **GDPR** | General Data Protection Regulation — EUs personvernforordning, gjelder i Norge via EØS |
| **Datatilsynet** | Norsk tilsynsmyndighet for personvern |

---

*Kravspesifikasjonen skal reviewes av alle teammedlemmer.*
*Endringer krever godkjenning fra Lead Coordinator.*
*Versjonsnummer økes ved alle vesentlige endringer.*
