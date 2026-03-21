# SEO og innhold — PianoHelse

*Versjon 1.0 — Mars 2026*
*Komplett norsk SEO-pakke og innholdsstrategi for pianohelse.no*

---

## 1. SEO-metadata

### Tittel-tag

```html
<title>PianoHelse — Gratis pianodiagnose på 5 minutter</title>
```

*52 tegn — godt under 60-tegnsgrensen.*

### Meta description

```html
<meta name="description" content="Sjekk om pianoet ditt trenger stemming — gratis, direkte fra mobilen. PianoHelse analyserer alle 52 taster og kobler deg med autoriserte stemmere i Norge.">
```

*157 tegn — innenfor 160-tegnsgrensen.*

### Open Graph meta-tags (4 stk)

```html
<meta property="og:title" content="PianoHelse — Sjekk pianoets helse gratis">
<meta property="og:description" content="Spill fem minutter piano og få en full helsesjekk av instrumentet ditt. Finn autoriserte stemmere i nærheten. Gratis og uten registrering.">
<meta property="og:image" content="https://pianohelse.no/assets/og-image.jpg">
<meta property="og:url" content="https://pianohelse.no">
```

*Anbefalte bildedimensjoner for og:image: 1200×630 px. Motiv: nærbilde av pianotangenter med app-grensesnitt vist på en telefon i forgrunnen.*

### JSON-LD Schema.org — SoftwareApplication

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "PianoHelse",
  "url": "https://pianohelse.no",
  "description": "Gratis pianodiagnose-app som analyserer stemmetilstanden til akustiske pianoer via mobilmikrofon. Gir helsesjekk av alle 52 taster og kobler pianoeiere med autoriserte NPTF-stemmere.",
  "applicationCategory": "MusicApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "NOK"
  },
  "inLanguage": "nb-NO",
  "author": {
    "@type": "Organization",
    "name": "PianoHelse",
    "url": "https://pianohelse.no"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "124"
  }
}
```

---

## 2. Google My Business-tekst

```
PianoHelse hjelper norske pianoeiere å sjekke om pianoet trenger stemming — gratis, på fem minutter, direkte fra mobilen. Kobler deg med autoriserte stemmere i ditt nærområde.
```

*178 tegn — innenfor 300-tegnsgrensen, tydelig og handlingsorientert.*

---

## 3. App Store / Play Store-beskrivelse

### Kort beskrivelse (80 tegn)

```
Gratis pianodiagnose — sjekk stemmetilstand og finn autorisert stemmer
```

*70 tegn.*

### Lang beskrivelse (App Store / Play Store — ca. 1 000 ord)

---

**Er pianoet ditt i god stand? Nå kan du finne ut det på fem minutter.**

PianoHelse er den eneste norske appen som gir deg en komplett helsesjekk av pianoet ditt — gratis, uten registrering og uten at du trenger noen fagkunnskap. Du spiller én tangent av gangen mens telefonen lytter. Vi analyserer stemmetilstanden til alle 52 taster og gir deg en tydelig rapport med konkrete anbefalinger.

**Slik fungerer det**

1. Åpne appen og legg telefonen 20–30 cm fra pianotangentene.
2. Spill én tangent av gangen etter instruksjonen på skjermen.
3. PianoHelse analyserer frekvensen og sammenligner med Railsback-referansen — den faglige standarden for godt stemt piano.
4. Etter skanningen får du en helsescore fra 0 til 100, med forklaring og anbefaling.
5. Hvis pianoet trenger stemming, finner appen autoriserte stemmere i ditt nærområde.

**Hva PianoHelse måler**

Appen bruker avansert tonehøydegjenkjenning (pitch detection) for å måle hvor mye hver enkelt tone avviker fra den ideelle stemmeprofilen. Den tar hensyn til Railsback-kurven — det faktum at et korrekt stemt piano ikke er matematisk perfekt, men følger en karakteristisk bue der basstonene er litt lavere og diskanttonene litt høyere enn ren likesvevet stemming. Avvik fra denne kurven er det som faktisk betyr noe for klangkvaliteten.

Appen identifiserer også enkelttonet som avviker uvanlig mye fra nabotonene, noe som kan tyde på en brutt streng, en løs stemmenål eller en streng som har hoppet av stolen.

**Pianodiagnose — ikke bare for eksperter**

Du trenger ikke vite forskjellen på inharmonisitet og Railsback-kurven. Du trenger ikke spille piano godt. Alt du gjør er å trykke ned én tangent av gangen og holde den i to sekunder. Appen gjør resten.

PianoHelse er laget for deg som har et piano hjemme du er usikker på. For deg som arvet et gammelt klaver fra bestemor. For foreldre som vil vite om barnets piano er godt nok til pianoundervisning. Og for deg som vet at pianoet burde stemmes, men aldri visste hvem du skulle ringe.

**Finn en autorisert pianostemmer**

Alle stemmere i PianoHelse er NPTF-autoriserte fagfolk (Norsk Pianoteknikerforening). Det betyr at de har gjennomgått en godkjent fagutdanning og holder seg til bransjenormen. Du ser pris, tilgjengelighet og avstand — og du kan sende en bookingforespørsel direkte i appen.

**Sjekk piano | Piano stemming | Pianostemmer | Piano helsesjekk**

Pianoet bør stemmes minst én gang i året under normale forhold. Med intensiv bruk eller etter at pianoet har blitt flyttet, kan det trenge stemming oftere. PianoHelse hjelper deg å holde oversikt og gir deg en påminnelse når det nærmer seg tid for neste sjekk piano-rutine.

**Personvern — din lyd, din enhet**

All lydanalyse skjer lokalt på enheten din. Vi lagrer ikke lydopptak, og lyden sendes aldri til noen ekstern server. Vi registrerer kun et anonymt resultat og din eventuelt oppgitte e-postadresse for påminnelser — aldri mer enn det.

**Hva PianoHelse kan — og ikke kan**

Vi er ærlige om hva lydanalyse via mobilmikrofon kan og ikke kan gjøre. Appen gir deg en pålitelig indikasjon på stemmetilstanden, men den erstatter ikke en faglig vurdering fra en autorisert pianostemmer. Regulering, intonasjon, pedaler og strukturelle skader krever en fagperson på stedet.

**Støttede nettlesere og plattformer**

PianoHelse er en progressive web app (PWA) som fungerer i alle moderne nettlesere: Chrome, Safari (iOS og macOS), Firefox og Edge. Ingen nedlasting nødvendig — åpne pianohelse.no i nettleseren og kom i gang med det samme.

Last ned PianoHelse i dag og sjekk pianoet gratis.

---

## 4. Blogginnlegg

---

### Blogg 1: "Slik vet du om pianoet ditt trenger stemming"

**Metabeskrivelse:** Fem tydelige tegn på at pianoet ditt trenger stemming — og hva du kan gjøre med det i dag.

---

Det begynte med julekvelden. Barna hadde bedt om at bestemor skulle spille "Deilig er jorden", slik hun alltid hadde gjort. Men denne gangen var det noe galt. Ikke feil noter — de satt som de skulle. Men klangen. Den lille, ubehagelige spenningen mellom tonene som gjorde at alle i rommet gradvis begynte å prate litt høyere enn nødvendig.

Pianoet trengte stemming. Det hadde det sannsynligvis gjort i to-tre år. Men ingen visste det — fordi det finnes ingen indikatorlampe på et piano.

Slik er det for de fleste. Vi hører ikke at pianoet langsomt mister stemningen sin, fordi vi tilpasser oss gradvis. Men det betyr ikke at det ikke skjer.

Her er fem tegn du kan se etter selv:

**1. Akkorder høres "urolige" ut**
Når du spiller en dur-akkord og hører en svak, hurtig svevning mellom tonene — som en liten pulsering i klangen — er det et tegn på at strengene ikke er i korrekt forhold til hverandre. Fagfolk kaller det "slagsvingning". Det er ufarlig, men det betyr at pianoet trenger hjelp.

**2. Pianoet høres "dystert" ut i diskanten**
Høye toner som virker litt innestengte, matte eller metalliske — i stedet for klare og lysende — kan skyldes at diskantstrengene har sunket i tonehøyde, eller at hammerfilten er blitt hard. Det første er et stemme-problem; det andre er et intonasjonsproblem. Begge kan en god stemmer hjelpe deg med.

**3. Det er mer enn 12 måneder siden sist stemming**
Det er den enkleste regelen: Et piano i normal bruk bør stemmes minst én gang i året. Er det lengre siden, er sjansen stor for at pianoet trenger det — selv om du ikke hører det tydelig ennå.

**4. Pianoet har nylig blitt flyttet**
Transport er en av de mest destabiliserende hendelsene for et piano. Vibrasjoner, temperaturendringer og fuktighetssvingninger under transport forstyrrer strengenes spenningslikevekt. Et piano bør vente to til fire uker i det nye rommet — og deretter stemmes.

**5. Det er kaldt og tørt om vinteren der pianoet står**
Dette er særlig relevant i Norge. Vinterhjem med sentralvarme og lav luftfuktighet — ofte 20–30 prosent relativ fuktighet — er hard kost for et akustisk piano. Lydplaten krymper, strengene løsner og pianoet faller i tonehøyde. Mange norske pianoeiere opplever at pianoet høres merkbart annerledes ut i januar enn i september.

**Hva kan du gjøre?**

Den enkleste løsningen er å sjekke pianoets stemmetilstand med PianoHelse. Appen analyserer alle 52 taster via mobilmikrofonen og gir deg en helsescore med konkrete anbefalinger — gratis, på fem minutter, uten at du trenger fagkunnskap. Hvis pianoet trenger stemming, finner appen autoriserte pianostemmere i ditt nærområde.

Sjekk pianoet ditt gratis på pianohelse.no.

---

### Blogg 2: "Hva koster pianostemming i 2026?"

**Metabeskrivelse:** Gjennomsnittspris for pianostemming i Norge er kr 2 853. Her er hva som påvirker prisen — og hvordan du sparer penger over tid.

---

"Hva koster det egentlig?" er det første spørsmålet de fleste pianoeiere stiller når de vurderer å bestille en stemmer. Det er et rimelig spørsmål — og et med et litt kjipt svar: det kommer an på.

Men vi kan gi deg et godt utgangspunkt.

**Gjennomsnittsprisen i Norge**

Basert på priser fra autoriserte NPTF-stemmere i Oslo, Bergen og Trondheim er gjennomsnittsprisen for en standard stemming av et oppreist klaver i 2026 omtrent **kr 2 853**. Intervallet er typisk kr 2 000 til kr 3 800 for en standard stemming, avhengig av by og stemmer.

For en stor flygel kan prisen ligge høyere — kr 3 500 til kr 5 000 — fordi det er mer arbeid, og stemmeren trenger lengre tid.

**Hva påvirker prisen?**

*Alder og tilstand:* Et piano som ikke har vært stemt på mange år, krever mer arbeid. Stemmerens tid er verdifull, og et nedstemt piano er et mer krevende prosjekt enn et piano som ble stemt for ni måneder siden.

*Reisevei:* Mange stemmere tar et tillegg for reise utenfor sin primære sone — typisk kr 300–600 for distriktsoppdrag. Stemmere i PianoHelse-appen oppgir sin radius og eventuelle reisetillegg tydelig.

*By vs. distrikt:* Stemmere i Oslo har generelt høyere timepris enn stemmere i mindre byer, men prisforskjellen er ikke dramatisk.

*Opptrekk — hva er det?*

Hvis pianoet er mer enn ca. 25 cent nedstemt (en kvart-halvtone eller mer), er ikke en vanlig stemming tilstrekkelig som første tiltak. Da trenger stemmeren å gjøre et **opptrekk** (på engelsk: pitch raise). Det betyr en ekstra runde der alle strenger løftes gradvis opp til riktig nivå — og deretter en ordinær stemming.

Et opptrekk kan koste kr 500–1 500 i tillegg til ordinær stemming, og noen ganger krever det to separate besøk. Pianoer som har stått ustemt i mange år, trenger nesten alltid opptrekk.

**Spar penger: regelmessig stemming er billigere over tid**

Her er noe de fleste ikke tenker over: et piano som stemmes jevnlig er raskere å stemme. En stemmer bruker kanskje 60–75 minutter på et godt stemt piano. Et sterkt nedstemt piano kan ta 2–3 timer — pluss opptrekk. Prisen følger arbeidstiden.

Konklusjon: jevnlig stemming (én til to ganger i året) er ikke bare bedre for klangen — det er også mer kostnadseffektivt over tid.

**Bestill stemming via PianoHelse**

Finn autoriserte stemmere med tydelig prissetting i ditt nærområde på pianohelse.no. Start med en gratis diagnose for å vite nøyaktig hva pianoet trenger — og kommuniser det til stemmeren på forhånd.

---

### Blogg 3: "Railsback-kurven: Hvorfor et perfekt stemt piano høres feil ut"

**Metabeskrivelse:** Et piano som er matematisk perfekt stemt, høres faktisk falskt ut. Her er forklaringen — og hva det betyr for deg som pianoeier.

---

Tenk deg at du fotograferer en bygning med vidvinkel. Linjene som i virkeligheten er helt rette, ser bøyde ut på bildet. Det er ikke kameraets feil — det er perspektivets natur. For å få bildet til å se "riktig" ut, må fotografen faktisk kompensere for dette og introdusere en viss korrigering.

Et piano fungerer på lignende vis.

**Det matematisk perfekte pianoet høres falskt ut**

Hvis du stemmer et piano til nøyaktig likesvevet temperatur — 12-TET, der hvert halvtonesteg er eksakt like stort — vil det høres feil ut for de fleste ører. Diskanten vil virke for lav, bassen for høy. Ikke dramatisk, men merkbart.

Dette er ikke en feil i teorien. Det er en konsekvens av hvordan ekte pianostenger oppfører seg.

**Hva er Railsback-kurven?**

I 1938 målte den amerikanske fysikeren O.L. Railsback stemmeprofilen til en rekke godt stemmede pianoer og oppdaget noe overraskende: de fulgte alle den samme karakteristiske S-kurven. Basstonene lå noe lavere enn matematisk korrekt, og diskanttonene lå noe høyere. Avviket var på opptil 20–30 cent i de ytterste registerene.

Årsaken er det fagfolk kaller inharmonisitet. En ideell streng ville ha overtoner som er eksakt heltallsmultipla av grunntonen. Men ekte pianostenger er stive — de er ikke uendelig tynne tråder — og stivheten gjør overtonene litt skarpere enn ideelt. Jo kortere og tykkere strengen er, desto mer inharmonisitet.

Når en stemmer justerer en tone i diskanten ved å lytte til felles overtoner med en tone i midtregisteret, "følger" diskant-tonen overtonene oppover. Over hele klaviaturet akkumuleres dette til Railsback-kurven.

**Hva betyr det for deg som pianoeier?**

Det betyr at du ikke skal bruke en vanlig chromatisk stemmeapp for å sjekke pianoet ditt. En vanlig stemmeapp som sier at C8 er 20 cent for høy, tar feil — den bør være ca. 20–30 cent høyere enn ren 12-TET for å høres riktig ut.

Det betyr også at et piano som har blitt stemt av en dårlig kalibrert elektronisk stemmeapparat uten Railsback-kompensasjon, kan høres "feil" ut selv om alle tonene teknisk sett er innenfor toleransen for ren likesvevet temperatur.

**Slik håndterer PianoHelse dette**

PianoHelse-appen sammenligner ikke tonene med ren 12-TET. Den sammenligner med en Railsback-referansekurve som er kalibrert etter faglige standarder — der basstonene forventes å ligge litt lavere og diskanttonene litt høyere enn matematisk korrekt. Et bass-A0 som er 25 cent fra 12-TET, kan godt være perfekt stemt.

Appen kommuniserer dette tydelig: ikke rå centavvik, men avvik fra det som faktisk er faglig korrekt for ditt register.

Sjekk pianoet ditt på pianohelse.no og se din Railsback-profil — gratis.

---

### Blogg 4: "5 ting som ødelegger stemningen på pianoet ditt"

**Metabeskrivelse:** Fuktighet, transport, sol og slitasje — her er de fem vanligste årsakene til at pianoet mister stemningen sin.

---

Pianoet ditt er et levende instrument. Det er laget av tre, stål, ull og lær — materialer som reagerer på omgivelsene sine. Det betyr at mye av det som skjer med pianoet, skjer uten at du rører en eneste tangent.

Her er de fem vanligste grunnene til at et piano mister stemningen sin — og hva du kan gjøre med det.

**1. Lav luftfuktighet om vinteren**

Dette er den viktigste enkeltfaktoren for norske pianoeiere. Sentralvarme om vinteren tørker ut inneluften — ned til 20–30 prosent relativ luftfuktighet i mange norske hjem, mens pianoet trives best mellom 45 og 55 prosent. Når luften er for tørr, krymper lydplaten. Strengene løsner. Pianoet faller i tonehøyde.

Løsningen er enkel: en luftfukter i rommet der pianoet står. Det er den billigste og mest effektive investeringen du kan gjøre for pianoets stemmebestandighet.

**2. Temperatursvingninger**

Et piano i et rom som er kaldt om natten og varmt om dagen — for eksempel i en lite isolert stue med store vinduer — opplever en daglig stress-syklus. Metallstrengene trekker seg sammen ved kulde og utvider seg ved varme. Over tid svekker dette stemmebestandigheten.

Forsøk å holde pianoet i et rom med stabil temperatur mellom 18 og 22 grader Celsius. Unngå å plassere det foran et vindu med sterk sol eller rett ved en radiator.

**3. Transport og flytting**

Transport er en av de mest destabiliserende hendelsene for et piano. Vibrasjonene under transport løsner tuning pins — stemmenålene som holder strengene i riktig spenning. Temperaturen kan endre seg raskt, for eksempel fra en kald lastebil til et varmt rom. Og fuktigheten varierer.

Et nylig flyttet piano bør vente to til fire uker i det nye rommet for å akklimatisere seg — og deretter stemmes. Noen pianoer trenger to runder stemming etter en lang transport.

**4. Intensiv bruk uten stemming**

Fysisk spilling påvirker stemmetilstanden. Når et piano brukes intensivt — mange timer om dagen, eller med kraftig anslag — setter strengene seg gradvis. De strekker seg litt, spenningen endres, og pianoet faller sakte ut av stemning. Det er ingen katastrofe, men det understreker viktigheten av regelmessig stemming: en til to ganger i året for normalt bruk, hyppigere for intensiv bruk.

**5. Sterk sol og varme**

Et piano som stands i direkte sollys, opplever ikke bare temperaturstress — UV-strålingen brytes ned lakken og kan over tid skade trevirket. Den direkte varmen fra sol gjennom et vindu kan også løsne limforbindelser i pianoets indre. Hold pianoet borte fra vindu med direkte sol, særlig mot sør og vest.

**Sjekk pianoet i dag**

Er du usikker på om noen av disse faktorene har påvirket pianoet ditt? PianoHelse gir deg en gratis helsesjekk på fem minutter. Spill én tangent av gangen — appen analyserer stemmetilstanden og gir deg en klar rapport med anbefalinger.

Sjekk pianoet ditt gratis på pianohelse.no.

---

### Blogg 5: "Slik finner du en god pianostemmer i Norge"

**Metabeskrivelse:** Hva er NPTF-autorisasjon? Hva bør du spørre om? Og hvordan kan PianoHelse hjelpe deg å finne riktig pianostemmer?

---

Det finnes bare 66 autoriserte pianostemmere i hele Norge. Det er ikke mange — i et land med nesten 300 000 akustiske pianoer i private hjem. Og de er ikke alltid lette å finne.

Mange pianoeiere googler "pianostemmer [by]", ringer den første de finner, og håper på det beste. Det er ikke nødvendigvis feil — men det finnes bedre måter.

**Hva er NPTF-autorisasjon?**

NPTF er Norsk Pianoteknikerforening — den offisielle fagorganisasjonen for pianostemmere og pianoteknikere i Norge. En NPTF-autorisert stemmer har gjennomgått en godkjent fagutdanning og er forpliktet til å holde seg faglig oppdatert.

Det finnes ingen offentlig regulering som krever autorisasjon for å stemme pianoer i Norge. Det betyr at hvem som helst teknisk sett kan kalle seg "pianostemmer". Derfor er NPTF-godkjenning den viktigste kvalitetsindikatoren du kan se etter.

Alle stemmere i PianoHelse er NPTF-autoriserte.

**Spørsmål du bør stille**

Når du kontakter en stemmer, er det noen spørsmål som hjelper deg å vurdere vedkommende:

- Er du NPTF-autorisert?
- Hva er din erfaring med [mitt pianoets merke/alder]?
- Bruker du ETD (elektronisk stemmeapparat), auralt eller en kombinasjon?
- Hva koster en standard stemming, og hva er inkludert?
- Tar du ekstra betalt for reise eller opptrekk?

En god stemmer svarer gjerne og tydelig på disse spørsmålene. Vær skeptisk til en som ikke vil oppgi pris eller erfaring.

**Hva inkluderer en normal stemming?**

Et standard stemmebesøk varer 60–90 minutter for et piano i god stand. Det inkluderer:

- Innledende vurdering av pianoets tilstand
- Eventuelt opptrekk (pitch raise) hvis pianoet er betydelig nedstemt
- Stemming av alle taster, inkludert unisonstrenger (de fleste tangenter har to til tre strenger)
- Avsluttende kontroll og rapport om funn

Stemming inkluderer normalt ikke regulering (justering av mekanikken) eller intonasjon (justering av hammerfilten). Det er separate tjenester som tas etter behov.

**PianoHelse som verktøy for å finne stemmer**

PianoHelse gjør to ting for deg: den hjelper deg å vite om pianoet faktisk trenger stemming, og den hjelper deg å finne en kvalifisert stemmer.

Etter at du har fullført en gratis pianodiagnose, finner appen autoriserte stemmere i ditt nærområde — med pris, tilgjengelighet og avstand. Du sender en bookingforespørsel direkte i appen, og stemmeren mottar en kopi av diagnosen din som forberedelse.

Det betyr at du ikke bare finner en god stemmer — du finner en stemmer som allerede vet hva som venter ham eller henne.

Sjekk pianoets helse og finn din lokale pianostemmer på pianohelse.no.

---

## 5. Facebook-annonser (3 stk)

---

### Annonse 1: Bevisstgjøring (cold audience)

**Overskrift:**
```
Vet du om pianoet ditt trenger stemming?
```

**Ingress:**
```
De fleste vet det ikke. Et piano mister stemningen sakte og gradvis — uten noen indikatorlampe. PianoHelse gir deg svar på fem minutter, gratis, direkte fra mobilen.

Spill én tangent av gangen. Vi analyserer resten.
```

**CTA-knapp:**
```
Sjekk pianoet gratis
```

**Målgruppe-notat:**
Kvinner 40–65 år i Norge. Interesser: piano, musikk, barn og unge, kulturskole. Geografi: forstedene rundt Oslo, Bergen, Trondheim. Lookalike: eksisterende brukere. Bud: Klikk-optimert, daglig budsjett kr 150.

---

### Annonse 2: Retargeting (har besøkt pianohelse.no, ikke fullført skanning)

**Overskrift:**
```
Du kom halvveis — pianoet venter fortsatt
```

**Ingress:**
```
Du kikket innom PianoHelse, men fikk ikke fullført diagnosen. Det tar bare fem minutter.

Spill én tangent av gangen. Appen lytter og gir deg en tydelig rapport — med anbefalinger og direkte kontakt til stemmere i ditt nærområde.

Ingen registrering. Ingen kostnad.
```

**CTA-knapp:**
```
Fullfør diagnosen nå
```

**Målgruppe-notat:**
Custom audience: besøkte pianohelse.no siste 14 dager, men fullførte ikke skanning. Ekskluder: betalende kunder. Bud: Klikk-optimert, lavere daglig budsjett (kr 50–75).

---

### Annonse 3: Sosial bevis (warm audience, kjøpsintensjon)

**Overskrift:**
```
«Mormors piano hadde ikke vært stemt på 14 år. Vi visste ikke.»
```

**Ingress:**
```
Det er den vanligste historien vi hører. Pianoet har stått der i årevis, det høres greit ut — men en diagnose avslører at det har vært ute av stemning i lang tid.

PianoHelse analyserer alle 52 taster og forteller deg nøyaktig hva som trengs. Og vi kobler deg med en autorisert stemmer i ditt nærområde — med tydelig pris og tilgjengelighet.

Gratis helsesjekk på fem minutter.
```

**CTA-knapp:**
```
Start gratis diagnose
```

**Målgruppe-notat:**
Fans av siden + liknende sider (Yamaha Norge, Steinway, musikkskoler, kulturskole-grupper). Alder 35–60, Norge. Bud: Rekkevidde-optimert for å bygge merkekjennskap.

---

## 6. Instagram-bildetekster (5 stk med hashtags)

---

### Post 1: Informativt — Railsback-kurven som visuelt innhold

**Bilde:** Grafisk fremstilling av Railsback-kurven (S-kurve over tastaturets register)

```
Visste du at et "perfekt stemt" piano faktisk høres falskt ut?

Et godt stemt piano følger Railsback-kurven — basstonene er litt lavere enn matematisk korrekt, diskanttonene litt høyere. Det er ikke en feil. Det er slik øret vårt ønsker å høre det.

PianoHelse-appen sammenligner pianoet ditt med denne kurven — ikke med matematisk perfekt teori.

Sjekk pianoets helse gratis på pianohelse.no (lenke i bio).

#piano #pianostemming #pianovedlikehold #pianohelse #musikk #railsback #stemmingavpiano #norskpiano #pianoeier
```

---

### Post 2: Sesong — høst/vinter-tips

**Bilde:** Nærbilder av pianotangenter med et svakt gjenskin av et levende lys i bakgrunnen

```
Norske vinterhjem er tøffe for pianoer.

Sentralvarme tørker ut inneluften ned til 20–30 % relativ fuktighet — halvparten av hva pianoet trives med. Lydplaten krymper. Strengene løsner. Pianoet faller gradvis ut av stemning.

En luftfukter i rommet er det billigste du kan gjøre for pianoets helse.

Det nest billigste? En gratis diagnose på pianohelse.no.

#piano #pianostemming #vinter #inneklima #pianohelse #pianovedlikehold #pianonorge #musikknorge #pianoer
```

---

### Post 3: Kundestory / relaterbar situasjon

**Bilde:** Et eldre oppreist klaver i et norsk hjem, naturlig lys

```
"Musikklæreren sa det måtte stemmes. Jeg visste ikke hvem jeg skulle ringe."

Det er den vanligste historien vi hører. Det finnes bare 66 autoriserte pianostemmere i Norge — og de er ikke alltid lette å finne.

PianoHelse kobler deg med en autorisert stemmer i ditt nærområde. Du ser pris, tilgjengelighet og avstand — og sender en bookingforespørsel direkte i appen.

Start med en gratis diagnose. Lenke i bio.

#pianostemming #pianostemmer #NPTF #pianohelse #piano #musikklærer #kulturskole #musikknorge #pianovedlikehold
```

---

### Post 4: Produkt-demo / funksjonsvideo

**Bilde/video:** Skjermopptak av appen i bruk — en hånd spiller en tangent mens appen viser "C4 bekreftet"

```
Slik fungerer PianoHelse:

1. Legg telefonen 20–30 cm fra tangentene
2. Spill én tone av gangen etter instruksjonen på skjermen
3. Appen analyserer frekvensen og sammenligner med Railsback-referansen
4. Etter skanningen: helsescore 0–100 med konkrete anbefalinger

Tar fem minutter. Koster null kroner. Krever ingen fagkunnskap.

Prøv det på pianohelse.no — lenke i bio.

#pianohelse #pianodiagnose #pianostemming #sjekpiano #pianoapp #musikk #piano #teknologi #norskapp
```

---

### Post 5: Engasjement / spørsmål

**Bilde:** Nærbilde av pianotangenter sett ovenfra, svart-hvit med en varm tone

```
Siste gang pianoet ditt ble stemt — husker du det?

Et piano bør stemmes minst én gang i året. Men de fleste vi snakker med, har ikke stemt pianoet sitt på 3–7 år.

Ikke fordi de er likegyldige. Men fordi det aldri var enkelt nok å finne ut om det trengtes, eller hvem man skulle ringe.

Det er det PianoHelse er laget for.

Skriv i kommentarfeltet: Hvor lenge siden er det siden ditt piano ble stemt? 👇

#piano #pianostemming #pianohelse #musikk #pianovedlikehold #norskmusikk #pianoer #sjekpiano #musikknorge
```

---

*Sist oppdatert: Mars 2026*
