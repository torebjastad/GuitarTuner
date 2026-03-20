# Pianohelse — Faglig grunnlag
**Versjon:** 1.0
**Dato:** 20. mars 2026
**Forfatter:** Piano Tuner Expert
**Status:** Faglig referansedokument for hele teamet

---

## 1. Railsback-kurven

### 1.1 Hva er Railsback-kurven?

Railsback-kurven er en empirisk kurve som beskriver **den faktiske stemmeprofilen til et godt stemt piano** — og den avviker systematisk fra matematisk ren likesvevet stemming (12-TET).

Kurven er oppkalt etter O.L. Railsback, som i **1938** målte stemmeprofilen til en rekke auralt stemmede pianoer og oppdaget at de alle viste den samme karakteristiske bueformen: basstonene er **litt lavere** enn 12-TET, og diskanttonene er **litt høyere** enn 12-TET.

### 1.2 Hvorfor fins den? — Inharmonisitet

Årsaken er pianostrengenes **inharmonisitet** (inharmonicity). En ideell streng er perfekt harmonisk: dens overtoner er eksakt heltallsmultipla av grunntonen. En reell pianostreng er derimot ikke uendelig tynn og fleksibel — den har stivhet, og denne stivheten gjør at overtonene blir **litt skarpere** enn ideelle heltallsmultipla. Effekten er størst for korte, tykke strenger (diskant og ytterste bass) og minst for lange, tynne strenger (midtregister).

Når en stemmer auralt tilpasser en tone til en annen (f.eks. stemmer C5 ut fra C4), bruker han felles overtoner som referanse. Men siden overtonene er for høye pga. inharmonisitet, "følger" den stemmede tonen med oppover. Over hele klaviaturet akkumuleres dette til den karakteristiske S-kurven.

### 1.3 Størrelsen på avviket

| Register | Typisk avvik fra 12-TET |
|---|---|
| A0 (laveste tone) | ca. −20 til −30 cent |
| C2–C3 (dyp bass) | ca. −10 til −15 cent |
| C4–C5 (midtregister, ref.) | ca. 0 cent (referansepunkt) |
| C6–C7 (høy diskant) | ca. +10 til +20 cent |
| C8 (høyeste tone) | ca. +20 til +30 cent |

Disse tallene er **typiske gjennomsnittsverdier** og varierer etter pianoets størrelse (stor flygel har lavere inharmonisitet enn liten spinett), alder, strengemateriale og stemmerens preferanser.

### 1.4 Praktisk implikasjon for PianoHelse-appen

Appen skal **ikke** måle avvik fra 12-TET alene og rapportere det som feil. Den skal måle avvik fra den **forventede Railsback-profilen** for det gitte piano-registeret. Et bass-A0 som er −25 cent fra 12-TET kan godt være korrekt stemt — det avhenger av om avviket samsvarer med kurven.

Algorithme-integrasjons-dokumentet har implementert en forenklet kubisk Railsback-referanselinje (±30 cent fra bass til diskant). Dette er en akseptabel tilnærming for diagnostikk, men det bør kommuniseres til brukeren at **Railsback-avvik er normalt og ikke nødvendigvis et problem**.

---

## 2. Hva er "godt stemt" — toleranser

### 2.1 Faglig standard for profesjonell stemming

En profesjonelt stemt piano forventes å ligge innenfor disse grensene **etter stemming**:

| Parameter | Faglig standard | Merknader |
|---|---|---|
| Avvik fra Railsback-kurven | ±2–3 cent per tone | Etter en god stemming |
| Unisonrenshet (toner med 2–3 strenger) | < 1 cent mellom strengene | Hørbart som "slagsvingning" ved > 1–2 cent |
| Oktavrenshet | < 3–4 cent | Større avvik høres som "svevning" |
| Gjennomsnittlig absolutt avvik etter stemming | 1–3 cent | For fullt stemt konsertinstrument |

### 2.2 Toleranser for ikke-profesjonelle ører

Forskning og erfaring viser at:

- **Under 5 cent**: Ikke hørbart for de aller fleste, selv musikere
- **5–10 cent**: Hørbart ved siden av et rent stemt instrument; knapt hørbart isolert
- **10–20 cent**: Merkbart for musikalsk trente ører, og plagsomt for aktive musikanter
- **Over 20 cent**: Tydelig hørbart for de fleste; pianoet oppleves som "falsk"
- **Over 50 cent**: Instrumentet høres åpenbart nedstemt; nær en halvtone feil

### 2.3 Sentkompasset — hva betyr 1, 5, 10, 20 cent i praksis?

| Avvik | Hva det betyr | Hvem hører det? |
|---|---|---|
| ±1 cent | Knapt registrerbart selv av trente ører under ideelle lytteforhold | Svært trente musikere / stemmere |
| ±5 cent | Grensen for "i stemmning" ved konsertbruk | Profesjonelle musikere |
| ±10 cent | Tydelig svevning mellom samtidige toner; pianoet høres "slitent" ut | Alle med noe musikalsk trening |
| ±20 cent | Åpenbart falsk; hemmer musikalsk opplevelse | De aller fleste |
| ±50 cent | Nær en kvart-halvtone feil; instrumentet er ubrukelig for seriøs bruk | Alle |
| ±100 cent | Én hel halvtone feil | Uunngåelig for alle |

**For PianoHelse-appens brukerkommunikasjon:** Unngå å presentere cent-avvik uten kontekst. Et avvik på 15 cent i en bassstreng er ikke det samme som 15 cent i diskanten. Bruk fargeindikasjon og enkle tekstforklaringer heller enn å liste rå sentall.

---

## 3. Faktorer som påvirker stemmebestandighet

### 3.1 Temperatur og luftfuktighet

Dette er den **viktigste enkeltfaktoren** for stemmebestandighet i norske hjem.

**Ideelle forhold:**
- Temperatur: **18–22 °C**, stabilt (unngå kalde netter / varm dag-syklus)
- Relativ luftfuktighet (RH): **45–55 %**, stabilt gjennom året

**Hva skjer ved avvik:**

| Tilstand | Effekt på piano | Typisk norsk scenario |
|---|---|---|
| For tørt (< 35 % RH) | Lydplaten krymper → strengene løsner → piano faller i tonehøyde | Vinteroppvarming uten luftfukter |
| For fuktig (> 65 % RH) | Lydplaten sveller → strengene strammes → piano stiger i tonehøyde | Sommer på vestlandet / fuktig kjeller |
| Temperaturfall (> 5 °C) | Metallstrenger krymper → piano faller | Kald vinternatt, dårlig isolert rom |
| Raskt temperaturstigning | Metall og tre reagerer ulikt → midlertidig ustabilitet | Sol gjennom vindu |

**Norsk klima og sesong:**
Norge har et kontinentalt inneklima om vinteren med svært lav luftfuktighet i oppvarmede rom (typisk 20–35 % RH). Dette er den vanligste årsaken til at norske pianoer faller i tonehøyde mellom stemminger. Anbefaling til pianoeiere: **luftfukter i rommet** der pianoet står.

### 3.2 Pianoets alder og tilstand

- **Nytt piano (0–5 år):** Strenger og tre settles inn; trenger stemming **4 ganger første år**, deretter 2 ganger per år
- **Modent piano (5–30 år):** Stabilt; 1–2 stemminger per år er standard
- **Eldre piano (30–80 år):** Kan ha svekket pinnebrett (pinblock); strenger holder tonehøyde dårligere; 2 stemminger per år anbefales
- **Antikt piano (> 80 år):** Kan ha strukturelle svakheter; krever vurdering av kvalifisert tekniker — ikke bare stemmer

### 3.3 Bruksintensitet

| Bruksnivå | Typisk bruker | Anbefalt stemmefrekvens |
|---|---|---|
| Lavt (< 1 time/uke) | Arvet piano, sjelden brukt | Minimum 1 gang/år |
| Moderat (1–5 timer/uke) | Privat hjem, barn i kulturskolen | 2 ganger/år |
| Høyt (5–15 timer/uke) | Aktiv amatørmusiker | 2–3 ganger/år |
| Intensivt (> 15 timer/uke) | Musikkskole, konsertlokale | 3–4 ganger/år |
| Konsert | Profesjonell scene | Stemmes foran hvert konsertoppdrag |

### 3.4 Transport og flytting

Transport er en av de **mest destabiliserende hendelsene** for et pianos stemming:

- Vibrasjoner under transport løsner tuning pins og forstyrrer strengenes spenningslikevekt
- Temperatur- og fuktighetsendring under flytt (f.eks. fra kjøletralle til varmt rom) er kumulativt skadelig
- Et nylig flyttet piano **bør vente 2–4 uker** i det nye rommet (for å akklimatisere) **før stemming**
- Noen stemmere krever ekstra betalt for "oppstemmings-besøk" etter transport

**For PianoHelse-appen:** Diagnostikkskjemaet bør spørre: *"Har pianoet nylig blitt flyttet?"* — og informere brukeren om at stemming etter nylig transport kan kreve to besøk.

---

## 4. Vanlige problemer en diagnose-app bør identifisere

### 4.1 Problemer appen KAN detektere (lydanalyse)

| Problem | Hva appen ser | Anbefalt kommunikasjon |
|---|---|---|
| Generell nedstemmning | Alle toner jevnt lavere enn 440 Hz | "Pianoet er nedstemt — bør stemmes" |
| Opptrekk-behov | Gjennomsnittlig avvik > 25–30 cent | "Pianoet er betydelig lavt — opptrekk kan være nødvendig" |
| Register-ubalanse | Bass og diskant avviker systematisk ulikt | "Unormalt stemningsgap mellom bass og diskant" |
| Enkeltton feil (brutt/kram streng) | En tone avviker mye mer enn nabotonene | "Tone [X] avviker uvanlig mye — sjekk streng" |
| Unisonfeil | Tonen høres "slagsvingene" ut (dobbel-lyd) | Vanskelig å detektere pålitelig via mobilmikrofon |
| Ustabil tone | Frekvensen varierer mye under avlesning | "Tone [X] er ustabil — kan indikere løs tuning pin" |

### 4.2 Problemer appen IKKE kan detektere

Disse krever fysisk inspeksjon av en fagperson:

- **Regulering** (tangentfall, hammerslag, escapement) — kun hørbar/taktil vurdering
- **Intonasjon** (hammerfilthardhet og -form) — klangkvalitet, ikke tonehøyde
- **Pedaler** (demperfeil, sustain-pedal, una corda-funksjon)
- **Strukturelle skader** (sprekker i lydplate, svekket ramme, rust på strenger)
- **Pinnebrett-tilstand** (kan ikke styre av lydanalyse alene)
- **Tangentmisfarging eller -blokkering** — visuell/mekanisk

Dette bør kommuniseres tydelig til brukeren som del av appens ansvarsfraskrivelse.

---

## 5. Regulering og intonasjon — hva er det og når trengs det?

### 5.1 Regulering (Action Regulation)

Regulering er justering av pianoets **mekaniske aksjonskomponenter** for å sikre at alle tangenter responderer jevnt og korrekt. Det er ikke det samme som stemming.

Reguleringen inkluderer typisk:
- Justering av **hammerfallet** (tangentdybde og hammerens slagpunkt)
- Innstilling av **escapement** (det mekaniske frikobling-punktet som gir pianissimo-kontroll)
- Justering av **aftertouch** (frigang etter tasteanslag)
- **Damper-regulering** (sikrer at demperne løfter jevnt og raskt)

**Når trengs regulering?**
- Når tangenttyngden er ujevn (noen tangenter tunge, andre lette)
- Når det er vanskelig å spille pianissimo
- Etter ca. **5–10 år** med regelmessig bruk, eller ved endring i fuktighetsforhold
- Etter at et piano har stått lenge ubrukt

**Kostnad i Norge (estimert 2026):** Kr 3 000–10 000 for fullt reguleringsjobb på spinett/klaver; kr 8 000–20 000 for flygel. Regulering er langt mer tidkrevende enn stemming.

### 5.2 Intonasjon (Voicing)

Intonasjon (voicing på engelsk) er prosessen med å **justere klangkvaliteten** til hammernes filthetter ved å stikke dem med spesielle nåler eller behandle dem med spesialvæske. Det endrer tonefargen (lys/mørk, myk/hard) men ikke tonehøyden.

**Når trengs intonasjon?**
- Pianoet høres hardt og "metallisk" ut
- Ujevn klang mellom registrene (mørkt i bass, strident i diskant)
- Etter lang tids intensiv bruk der hammerene er blitt hardt komprimerte

Intonasjon krever svært god fagkompetanse og gjøres sjeldnere enn stemming — typisk hvert 3–5 år ved normalt bruk.

---

## 6. Hva en stemmer gjør på et typisk servicebesøk — trinn for trinn

Et standard stemmebesøk varer **60–90 minutter** for et normalt stemt piano i god stand. For et nedstemt piano kan det ta opptil 2–3 timer.

### Trinn 1: Innledende vurdering (5–10 min)
- Visuell inspeksjon: strenger, hammere, tangenter, pedaler
- Spiller et utvalg toner for å bedømme generell stemmetilstand
- Vurderer om opptrekk er nødvendig
- Informerer kunden om funn og estimert arbeidstid/pris

### Trinn 2: Eventuelt opptrekk / grov-stemming (10–20 min)
- Dersom pianoet er mer enn 25 cent nedstemt: kjøres én runde grov-opptrekk
- Dette er en hurtig gjennomkjøring der alle strenger løftes til omtrent riktig nivå
- Etter opptrekk må pianoet "sette seg" i noen minutter før fin-stemming

### Trinn 3: Sette temperament — midtregisteret (15–25 min)
- Stemmer bruker ETD (elektronisk stemmeapparat) og/eller gehørbasert metode
- Stemmingen begynner i midtregisteret (typisk F3–F4 eller F3–C5)
- Referansepunktet er a' = 440 Hz
- Temperamentet etablerer forholdene mellom alle 12 halvtoner i midtoktaven

### Trinn 4: Stemme bass og diskant (20–35 min)
- Fra det stemmede midtregisteret utvides stemmingen opp og ned
- Oktaver, kvinter og kvarter brukes som kontrolintervaller
- Railsback-strekkingen legges inn gradvis mot bass og diskant

### Trinn 5: Unison-stemming (10–15 min)
- De fleste piano-tangenter har 2–3 strenger per tone
- Stemmer justerer disse slik at de er perfekt unisone (ingen slagsvingning)

### Trinn 6: Avsluttende kontroll og spill-inn (5–10 min)
- Full gjennomspilling av skalaer og akkorder
- Eventuelle fine justeringer
- Stemmeren "spiller inn" pianoet litt hardere for å stabilisere stemmingen

### Trinn 7: Rapport til kunde
- Stemmer informerer om funn (løse tangenter, slitte hammere, aktuelle reparasjoner)
- Gir anbefaling om neste stemmetid
- Faktura (i dag typisk kontant, Vipps eller e-post faktura)
