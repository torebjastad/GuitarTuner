# Mikrokopi — PianoHelse

*Versjon 1.0 — Mars 2026*
*Ferdig norsk mikrokopi for appen — kopier direkte inn i koden.*

---

## 1. Velkomst-skjerm

### Tittel
```
Ta vare på musikken.
```

### Undertekst
```
Sjekk pianoets helse gratis på fem minutter — direkte fra mobilen.
```

### CTA-knapp
```
Start gratis diagnose
```

### Alternativ CTA (for brukere som har vært her før)
```
Fortsett til skanning
```

### Personverntekst under knapp
```
Lydanalysen skjer lokalt på enheten din. Vi lagrer ikke lydopptak.
```

### Sekundær lenke
```
Hvordan fungerer det?
```

---

## 2. Piano-info-skjerm

### Overskrift
```
Fortell oss om pianoet ditt
```

### Undertekst
```
Dette hjelper oss å tolke resultatene riktig.
```

### Skjemafelt-labels og placeholders

**Pianotype**
- Label: `Type piano`
- Placeholder: `Velg type`
- Alternativer:
  - `🎹 Klaver (oppreist piano)`
  - `🎵 Stutzflygel (liten flygel, under 1,7 m)`
  - `🎶 Flygel (1,7–2,2 m)`
  - `🎼 Konsertflygel (over 2,2 m)`
  - `🎹 Elektrisk / digitalt piano`
  - `❓ Vet ikke`

**Pianoets alder**
- Label: `Omtrentlig alder`
- Placeholder: `Velg aldersgruppe`
- Alternativer:
  - `Nytt (0–5 år)`
  - `Relativt nytt (5–20 år)`
  - `Modent (20–50 år)`
  - `Eldre (50–80 år)`
  - `Antikt (over 80 år)`
  - `Vet ikke`

**Siste stemming**
- Label: `Sist stemt`
- Placeholder: `Velg tidsrom`
- Alternativer:
  - `Innen siste 6 måneder`
  - `1–2 år siden`
  - `3–5 år siden`
  - `Over 5 år siden`
  - `Aldri stemt / vet ikke`

**Nylig flyttet**
- Label: `Har pianoet nylig blitt flyttet?`
- Alternativer: `Ja` / `Nei` / `Vet ikke`
- Hjelpetekst: `Et piano bør vente 2–4 uker i et nytt rom før stemming for best mulig resultat.`

**Merke (valgfritt)**
- Label: `Merke (valgfritt)`
- Placeholder: `F.eks. Yamaha, Kawai, Steinway...`

### Hjelpetekster

**Pianotype:**
```
Pianoets størrelse påvirker hvilken stemmeprofil vi sammenligner med.
Klaver og spinett har normalt større svingninger i stemmingen enn stor flygel.
```

**Alder:**
```
Eldre pianoer har ofte løsere stemmenåler og kan falle raskere ut av stemning.
Et antikt piano (over 80 år) kan kreve vurdering av fagperson utover stemming.
```

**Sist stemt:**
```
Har pianoet stått ustemt i over 5 år, kan det trenge et "opptrekk" (pitch raise)
— en ekstra runde for å løfte tonehøyden gradvis. Dette kan kreve to besøk.
```

### Feil-meldinger

```
Velg type piano for å gå videre.
```
```
Vennligst angi omtrentlig alder på pianoet.
```
```
Angi når pianoet sist ble stemt.
```

### Navigasjonsknapp
```
Neste: Forberedelse →
```

---

## 3. Forberedelse-skjerm

### Overskrift
```
Gjør deg klar til skanning
```

### Undertekst
```
Et par minutter til forberedelse gir mye mer pålitelige resultater.
```

### Sjekkliste-punkter

```
☐  Finn et stille rom — skru av TV, musikk og kjøkkenviften
☐  Sett telefonen 20–30 cm fra pianotangentene, ikke bak lokket
☐  Sørg for at lokket er åpent (for klaver: åpne topplokket)
☐  Spill én tangent av gangen og hold den nede i 2–3 sekunder
☐  Spill tydelig (forte) — særlig de dypeste og høyeste tonene
☐  Ikke rør telefonen mens du spiller — vibrasjoner forstyrrer mikrofonen
☐  Slå av automatisk skjermlås under skanningen
☐  Koble til lader hvis batteriet er under 20 %
```

### Informasjonsboks om personvern

```
🔒  Lokal lydanalyse — ditt personvern er ivaretatt

Mikrofonen brukes kun til å analysere pianotoner i sanntid.
Vi lagrer ikke lydopptak, og lyden sendes aldri til en ekstern server.
All behandling skjer direkte på din enhet.
```

### Tips-liste

**Tips-overskrift:**
```
Slik får du best resultat
```

**Tips:**
```
💡  Et stille rom er det viktigste. Selv bakgrunnsmusikk fra en nabo kan gi unøyaktige målinger.

💡  Bruk én finger per tangent, og spill fra topp til bunn — start fra den høyeste C (C8) og jobb deg nedover.

💡  De dypeste basstonene (A0–E1) kan være vanskelige for mobilmikrofoner. Spill dem ekstra tydelig.

💡  Sitter du fast på en tone, trykk "Hopp over" — vi kan beregne en delvis score.

💡  Har pianoet nettopp blitt stemt? Vent minst én uke for et mer representativt resultat.
```

### Navigasjonsknapper
```
← Tilbake        Start skanning →
```

---

## 4. Skanning-skjerm

### Overskrift
```
Skanner pianoet ditt
```

### Aktiv lytting — instruksjonstekst (mal)
```
Spill [NOTE][OKTAV] nå
```

**Eksempler:**
```
Spill C4 nå
Spill A3 nå
Spill F#2 nå
```

### Visuell indikator-tekst (under notenavn)
```
Hold tangenten nede i 2–3 sekunder
```

### Bekreftelsesmelding
```
✓ [NOTE][OKTAV] bekreftet
```

**Eksempler:**
```
✓ C4 bekreftet
✓ A3 bekreftet
✓ F#2 bekreftet
```

### Avvik-indikator (under bekreftelse, vises alltid)
```
Avvik: [X] cent fra referansen
```

### Timeout-melding (etter 8 sekunder uten deteksjon)
```
Vi hørte ikke noen tone.
Sørg for å spille tydelig og hold tangenten nede i 2–3 sekunder.
```

**Knapper under timeout:**
```
Prøv igjen        Hopp over denne tonen
```

### Feil-ton spilt
```
Det ser ut som du spilte en annen tangent enn forventet.
Vi venter på [NOTE][OKTAV] — prøv igjen.
```

### Bakgrunnsstøy-advarsel
```
Vi registrerer for mye bakgrunnsstøy.
Skru av TV, musikk og luftanlegg, og prøv igjen.
```

### Usikker måling-advarsel (lav konfidensverdi)
```
⚠  Usikker måling — spill tonen igjen for å bekrefte, eller hopp over.
```

### Feil-meldinger — mikrofon

**Mikrofontilgang nektet:**
```
Appen trenger mikrofontilgang for å analysere pianoet.

Slik gir du tilgang:
1. Gå til nettleserinnstillingene (...)
2. Velg "Nettstedstillatelser"
3. Slå på mikrofon for denne siden

Oppdater siden og prøv igjen.
```

**Ikke HTTPS:**
```
Mikrofontilgang krever en sikker tilkobling (HTTPS).
Åpne appen via https://pianohelse.no for å starte skanningen.
```

**Nettleser støtter ikke Web Audio:**
```
Nettleseren din støtter ikke lydanalyse.
Åpne appen i Chrome, Safari eller Firefox for best resultat.
```

### Fremgang-tekst
```
[X] av 52 taster skannet
```

**Med estimert tid:**
```
[X] av 52 taster skannet — ca. [Y] minutter igjen
```

### Stopp-bekreftelsesdialog

**Overskrift:**
```
Avbryte skanningen?
```

**Brødtekst:**
```
Du har skannet [X] av 52 taster. Avbryter du nå, kan vi beregne en delvis helsescore
— men den vil være mindre nøyaktig enn en fullstendig skanning.

Har du skannet færre enn 20 taster, er ikke scoren pålitelig nok til å vise.
```

**Knapper:**
```
Fortsett skanningen        Avslutt og se resultater
```

### Knapper under aktiv skanning
```
⏸  Pause        ⏹  Avslutt skanning
```

---

## 5. Analyse-skjerm

### Overskrift
```
Analyserer pianoet ditt...
```

### Lastetekster (vises sekvensielt, 2–3 sekunder per tekst)

```
Beregner avvik fra Railsback-referansen...
```
```
Identifiserer toner som trenger ekstra oppmerksomhet...
```
```
Vurderer stemmetilstand i bass, midtregister og diskant...
```
```
Setter sammen helsekarakteren din...
```
```
Nesten ferdig — forbereder rapporten...
```

### Undertekst under lastetekst
```
Dette tar vanligvis 5–10 sekunder.
```

---

## 6. Rapport-skjerm

### Overskrift
```
Pianorapporten din
```

### Score-tekster per nivå

#### Score 85–100: Utmerket stand
**Tittel:**
```
Pianoet ditt er i utmerket stemmning
```
**Undertekst:**
```
Pianoet er nylig stemt eller har blitt holdt under gode forhold.
Du trenger ikke bestille stemming nå.
```
**Farge:** Grønn
**Ikon:** ✓

**Handlingsoppfordring:**
```
Bra gjort! Sjekk pianoet igjen om 6–12 måneder, avhengig av bruksintensitet.
Vil du få en påminnelse? Vi sender deg en påminnelse når det nærmer seg.
```
**Knapp:**
```
Sett opp påminnelse
```

---

#### Score 70–84: God stand
**Tittel:**
```
Pianoet ditt er i god stand
```
**Undertekst:**
```
Stemmingen begynner å sige litt, men er fortsatt akseptabel.
Vi anbefaler stemming innen de neste 6–12 månedene.
```
**Farge:** Lysgrønn
**Ikon:** ✓

**Handlingsoppfordring:**
```
Mange pianoeiere merker ikke disse tidlige tegnene selv, men det påvirker
musikkopplevelsen over tid. Book en stemmer når det passer deg — ingen hastverk.
```
**Knapp:**
```
Se tilgjengelige stemmere
```

---

#### Score 50–69: Bør stemmes snart
**Tittel:**
```
Pianoet ditt trenger stemming
```
**Undertekst:**
```
Vi måler et gjennomsnittlig avvik som er merkbart for trente ører.
Vi anbefaler stemming innen 3–6 måneder.
```
**Farge:** Gul/oransje
**Ikon:** ⚠

**Handlingsoppfordring:**
```
For barn som lærer å spille, er dette særlig viktig: å øve på et falskt piano
kan forstyrre gehørutviklingen. Book en autorisert stemmer i ditt nærområde.
```
**Knapp:**
```
Book stemmer nå
```

---

#### Score 30–49: Trenger stemming snart
**Tittel:**
```
Pianoet ditt er tydelig ute av stemning
```
**Undertekst:**
```
Avviket er nå stort nok til at de fleste vil høre det.
Vi anbefaler at du bestiller en stemmer så snart som mulig.
```
**Farge:** Oransje/rød
**Ikon:** ⚠

**Handlingsoppfordring:**
```
Informer gjerne stemmeren om at det kan gå en stund siden sist stemming,
slik at hen kan sette av riktig tid til besøket.
```
**Knapp:**
```
Bestill stemming nå
```

---

#### Score under 30: Kritisk tilstand
**Tittel:**
```
Pianoet ditt er i kritisk stand
```
**Undertekst:**
```
Pianoet har sannsynligvis stått ustemt i mange år.
En vanlig stemming alene er kanskje ikke nok.
```
**Farge:** Rød
**Ikon:** ❗

**Handlingsoppfordring:**
```
Stemmeren kan trenge å gjennomføre et "opptrekk" (pitch raise) — en ekstra runde
for å løfte tonehøyden gradvis opp til riktig nivå. Dette kan bety to separate besøk
og noe høyere kostnad enn en vanlig stemming. Kontakt en stemmer så snart du kan.
```
**Knapp:**
```
Kontakt stemmer nå — det haster
```

---

### Ansvarsfraskrivelse (vises alltid i rapporten)

```
Denne rapporten er basert på lydanalyse via mobilmikrofon og gir en indikasjon
på stemmebehov. Den erstatter ikke faglig vurdering av en autorisert pianostemmer.
Miljøfaktorer som bakgrunnsstøy, rommets akustikk og telefonmodell kan påvirke nøyaktigheten.
```

### Spesifikke funn-meldinger (vises ved spesielle avvik)

**Enkelt tone avviker mye:**
```
⚠  Tone [NOTE][OKTAV] avviker uvanlig mye fra nabotonene.
Det kan tyde på en brutt streng, løs stemmenål eller en streng som har hoppet av stolen.
Be stemmeren sjekke dette spesielt.
```

**Lav konfidensverdi på basstonerene:**
```
ℹ  Målinger for de dypeste basstonene ([NOTE]-[NOTE]) er usikre.
Mobilmikrofoner har begrenset rekkevidde i dette registeret.
Stemmeren vil sjekke disse manuelt.
```

**Stor register-ubalanse:**
```
⚠  Det er uvanlig stor forskjell i stemmetilstand mellom bass og diskant.
Dette kan tyde på at pianoet ble stemt uferdig sist, eller at det er spesielle
forhold i ett register. Be stemmeren se nærmere på dette.
```

**For få toner analysert:**
```
⚠  Færre enn 20 tangenter ble analysert. Scoren er usikker og bør ikke brukes
som grunnlag for avgjørelse uten fullstendig skanning.
```

### Delingsmelding (Web Share API)

**Del-knapp tekst:**
```
Del rapport
```

**Delt innhold — tittel:**
```
Pianorapporten min fra PianoHelse
```

**Delt innhold — tekst:**
```
Jeg sjekket pianoets helse med PianoHelse-appen. Score: [X]/100 — [NIVÅ].
Sjekk ditt piano gratis på pianohelse.no
```

**Delt innhold — fallback-tekst (hvis Web Share ikke støttes):**
```
Kopier lenken og del med andre:
```

### PDF-rapport

**Tittel:**
```
Pianodiagnose — PianoHelse
```

**Undertittel:**
```
Generert [DATO] · [PIANOTYPE] · [MERKE hvis oppgitt]
```

**Bunntekst:**
```
Denne rapporten er generert av PianoHelse (pianohelse.no) og er et indikativt screeningverktøy.
Rapporten er ikke en faglig sertifisering av pianoets tilstand. Kun en autorisert pianostemmer
kan gi en fullstendig vurdering av instrumentet, inkludert mekanikk, regulering og strukturelle forhold.
```

**PDF-knapptekst:**
```
Last ned PDF-rapport
```

---

## 7. Finn stemmer-skjerm

### Overskrift
```
Autoriserte stemmere i ditt område
```

### Undertekst
```
Alle stemmere i PianoHelse er NPTF-autoriserte fagfolk.
```

### Filter-labels
```
By / poststed:
```
```
Tilgjengelig:
```

### Stemmer-kort — knapper

```
Book nå
```
```
Se profil
```
```
Ring
```

### Stemmer-kort — informasjonsetiketter

```
NPTF-autorisert
```
```
[X] km unna
```
```
Tilgjengelig fra [DATO]
```
```
Typisk pris: kr [X]–[Y]
```

### Tom tilstand (ingen stemmere i ditt område)

**Overskrift:**
```
Ingen registrerte stemmere i ditt område ennå
```

**Brødtekst:**
```
PianoHelse ruller ut by for by. Vi er foreløpig tilgjengelig i Oslo, Bergen og Trondheim.

Legg igjen e-postadressen din, så varsler vi deg når det er stemmere i nærheten av deg.
```

**E-postfelt placeholder:**
```
Din e-postadresse
```

**Knapp:**
```
Varsle meg
```

**Bekreftelse etter registrering:**
```
Takk! Vi gir deg beskjed når PianoHelse er tilgjengelig i ditt område.
```

### Bookingbekreftelses-skjerm

**Overskrift:**
```
Bookingforespørsel sendt!
```

**Brødtekst:**
```
[STEMMER-NAVN] mottar din forespørsel og vil bekrefte innen 24 timer.
Du mottar en e-postbekreftelse til [E-POST].

Stemmeren vil ha tilgang til din pianorapport som forberedelse.
```

**Merknad til stemmer (vises i bookingforespørsel):**
```
Diagnostikkrapporten er generert automatisk og er ment som veiledning.
Stemmerens faglige vurdering på stedet har alltid forrang.
```

---

## 8. Feilmeldinger (generelle)

### Nettverksfeil
```
Ingen nettverkstilkobling

Vi klarte ikke å hente informasjon. Sjekk at du er koblet til internett og prøv igjen.
```
**Knapp:**
```
Prøv igjen
```

### Mikrofon nektet
```
Mikrofontilgang er nødvendig

Appen trenger mikrofontilgang for å analysere pianoet.
Gå til nettleserinnstillingene og tillat mikrofon for pianohelse.no, og oppdater siden.
```
**Knapp:**
```
Åpne innstillinger
```

### Nettleser ikke støttet
```
Nettleseren din støtter ikke denne funksjonen

For best opplevelse, åpne PianoHelse i Chrome, Safari 14+, Firefox eller Edge.
Internet Explorer støttes ikke.
```
**Knapp:**
```
Åpne i annen nettleser
```

### Timeout (generell)
```
Noe tok for lang tid

Vi fikk ikke svar innen rimelig tid. Det kan skyldes dårlig nettverksforbindelse.
Prøv igjen, eller last inn siden på nytt.
```
**Knapper:**
```
Prøv igjen        Last inn siden på nytt
```

### Generell ukjent feil
```
Noe gikk galt

Vi klarte ikke å fullføre denne handlingen. Prøv igjen, eller kontakt oss på hei@pianohelse.no
hvis problemet vedvarer.
```

---

## 9. Varslingstekster (for fremtidig push-varsling)

### Diagnose klar
```
Tittel: Pianorapporten din er klar
Tekst: Vi har analysert pianoet ditt. Se resultatet og finn ut hva som bør gjøres.
```

### Booking bekreftet — pianoeier
```
Tittel: Booking bekreftet!
Tekst: [STEMMER-NAVN] har bekreftet besøket ditt [DATO] kl. [TIDSPUNKT].
```

### Booking akseptert — stemmer
```
Tittel: Ny bookingforespørsel
Tekst: [PIANOEIERNAVN] ønsker å booke deg til [DATO]. Se forespørselen i appen.
```

### Stemmer har akseptert din bookingforespørsel
```
Tittel: Stemmer [NAVN] har akseptert forespørselen din
Tekst: Besøket er bekreftet til [DATO] kl. [TIDSPUNKT]. Vi gleder oss til å hjelpe!
```

### Stemming-påminnelse
```
Tittel: Pianoet ditt kan trenge stemming snart
Tekst: Det er [X] måneder siden siste stemming. Sjekk pianoets helse på 5 minutter.
```

### Sesongpåminnelse (høst)
```
Tittel: Høst er den beste tiden for pianostemming
Tekst: Tørr inneluft om vinteren påvirker stemningen. Book en stemmer nå, mens det er god kapasitet.
```

### Re-engasjement (inaktive brukere)
```
Tittel: Hvordan har pianoet hatt det i sommer?
Tekst: Fuktighet og temperatur kan ha påvirket stemningen. Sjekk pianoets helse gratis.
```

---

## 10. E-post drip-kampanje (7 e-poster med full kropp)

### E-post 1 — Velkomst (umiddelbart etter signup)

**Emnelinje:**
```
Velkommen til PianoHelse — la oss se hvordan pianoet ditt har det
```

**Kropp:**
```
Hei,

Takk for at du er med!

PianoHelse er laget for deg som har et piano hjemme og vil vite om det er i god stand — uten å måtte ringe rundt til ukjente stemmere og håpe på det beste.

Slik kommer du i gang:

1. Åpne pianohelse.no på mobilen
2. Legg telefonen 20–30 cm fra pianotangentene
3. Spill én tangent av gangen etter instruksjonen på skjermen
4. Appen analyserer alle 52 taster og gir deg en helsescore med konkrete anbefalinger

Det tar fem minutter og er helt gratis.

Start diagnosen her: pianohelse.no

Hilsen,
PianoHelse-teamet
```

---

### E-post 2 — Utdanning (dag 2)

**Emnelinje:**
```
Visste du at norske vinterhjem er særlig hardt for pianoer?
```

**Kropp:**
```
Hei,

Her er noe de fleste pianoeiere ikke vet:

Sentralvarme tørker ut inneluften i norske hjem om vinteren — ofte ned til 20–30 % relativ luftfuktighet. Et piano trives best mellom 45 og 55 %. Forskjellen betyr at lydplaten krymper, strengene løsner, og pianoet faller gradvis ut av stemning.

Det skjer uten at du hører det. Fordi vi tilpasser oss gradvis.

Den enkleste løsningen er en luftfukter i rommet der pianoet står. Den nest enkleste? En gratis diagnose med PianoHelse — slik at du vet om pianoet faktisk har lidd.

Sjekk pianoet gratis: pianohelse.no

Hilsen,
PianoHelse-teamet
```

---

### E-post 3 — Sosial bevis (dag 4)

**Emnelinje:**
```
Mormors piano hadde ikke vært stemt på 18 år. Her er hva vi fant.
```

**Kropp:**
```
Hei,

En av de første PianoHelse-brukerne fortalte oss dette:

"Mormors gamle Østerberg-klaver hadde stått i stua i 18 år. Vi visste ikke engang at det kunne stemmes. Jeg prøvde PianoHelse nesten som en vits — og fikk en rapport som viste at pianoet var 40 cent nedstemt i bassregisteret. Stemmeren sa det var nær grensen for opptrekk. Etter stemming hørtes det ut som et nytt instrument."

Det er den historien vi hører oftest. Pianoet ser greit ut, det høres "akseptabelt" ut — men en diagnose forteller en annen historie.

Er du nysgjerrig på pianoet ditt? Sjekk det gratis på planohelse.no.

Hilsen,
PianoHelse-teamet
```

---

### E-post 4 — Produktfeature (dag 7)

**Emnelinje:**
```
Slik fungerer pianodiagnostikken — steg for steg
```

**Kropp:**
```
Hei,

Mange lurer på hva PianoHelse faktisk måler — og hvorfor det er mer enn en vanlig stemmeapp.

Her er forskjellen:

En vanlig stemmeapp sammenligner tonehøyden med matematisk ren likesvevet temperatur (12-TET). Men et korrekt stemt piano avviker systematisk fra 12-TET — dette kalles Railsback-kurven. Basstonene skal ligge litt lavere enn perfekt, diskanttonene litt høyere.

PianoHelse sammenligner pianoet ditt med Railsback-referansen, ikke med 12-TET. Det betyr at du får en diagnose som stemmer overens med hva en profesjonell pianostemmer faktisk måler.

Appen analyserer:
- Avvik fra Railsback-referansen per tone
- Register-ubalanse (bass vs. diskant)
- Enkelttonet som avviker uvanlig mye fra nabotonene
- Samlet helsescore fra 0 til 100

Start diagnosen på pianohelse.no

Hilsen,
PianoHelse-teamet
```

---

### E-post 5 — FOMO + verdi (dag 9)

**Emnelinje:**
```
De første 100 brukerne i Oslo får 15 % rabatt — er du én av dem?
```

**Kropp:**
```
Hei,

Som en av de første PianoHelse-brukerne i Oslo tilbyr vi deg 15 % rabatt på din første bestilte stemming via appen.

Slik bruker du tilbudet:

1. Fullfør en gratis pianodiagnose på pianohelse.no
2. Finn en autorisert stemmer i ditt nærområde
3. Book via appen — rabatten legges til automatisk

Tilbudet gjelder for de første 100 bookingene. Vi er ikke der ennå, men det nærmer seg.

Start diagnosen her: pianohelse.no

Hilsen,
PianoHelse-teamet

P.S. Uansett om du benytter tilbudet eller ikke — selve diagnosen er alltid gratis.
```

---

### E-post 6 — Stemmer-introduksjon (dag 12)

**Emnelinje:**
```
Møt stemmerne bak PianoHelse — autoriserte fagfolk i ditt nærområde
```

**Kropp:**
```
Hei,

Det finnes bare 66 autoriserte pianostemmere i hele Norge.

De er alle medlemmer av Norsk Pianoteknikerforening (NPTF) — og de har alle gjennomgått en godkjent fagutdanning. Stemmerne i PianoHelse er valgt fordi de oppfyller disse kravene, og fordi de har sagt ja til å vise pris og tilgjengelighet åpent.

Ingen skjulte kostnader. Ingen ukjente kvalifikasjoner.

Etter at du har fullført en gratis pianodiagnose, finner appen den nærmeste tilgjengelige stemmeren i ditt område. Stemmeren mottar en kopi av diagnosen din som forberedelse — slik at besøket går raskere og mer presist.

Finn din lokale stemmer: pianohelse.no

Hilsen,
PianoHelse-teamet
```

---

### E-post 7 — Launch-invitasjon (dag 14)

**Emnelinje:**
```
PianoHelse er live i Oslo — din tur til å sjekke pianoet
```

**Kropp:**
```
Hei,

PianoHelse er nå fullt tilgjengelig i Oslo, med stemmere i Bergen og Trondheim på vei.

Nå er det din tur.

Fem minutter. Et piano. En gratis diagnose. Og et tydelig svar på om pianoet ditt trenger stemming — og hvem du skal ringe.

Start her: pianohelse.no

Vi er glade for at du er med fra starten.

Hilsen,
PianoHelse-teamet

P.S. Har du en venn med piano som burde sjekke det? Del pianohelse.no med dem — diagnosen er alltid gratis.
```

---

### Re-engasjement (30 dager uten aktivitet)

**Emnelinje:**
```
Vet du om pianoet ditt trenger stemming? Sjekk det gratis nå.
```

**Kropp:**
```
Hei,

Det er en stund siden vi hørte fra deg — og fra pianoet ditt.

Et piano som ikke er stemt på over ett år, kan ha falt merkbart ut av stemning — selv om det ikke er åpenbart å høre. En fem-minutters diagnose med PianoHelse gir deg et tydelig svar.

Kom tilbake og sjekk pianoet: pianohelse.no

Hilsen,
PianoHelse-teamet
```

---

### Re-engasjement (sesong)

**Emnelinje:**
```
Ny sesong, nytt sjekk — er pianoet klart for høsten?
```

**Kropp:**
```
Hei,

Høst er den travleste perioden for pianostemmere i Norge — og det er ikke tilfeldig.

Etter en sommer med fuktighetssvingninger, og rett før innesesongen begynner med tørr sentralvarmeluft, er dette det ideelle tidspunktet for en stemming. Pianoet starter sesongen friskt, og du slipper å konkurrere med alle andre om ledigkapasitet hos stemmerne i desember.

Sjekk pianoets helse gratis, og book en stemmer mens det fortsatt er god kapasitet: pianohelse.no

Hilsen,
PianoHelse-teamet
```
