# PianoHelse — Enhetøkonomi

**Versjon:** 1.0
**Dato:** 20. mars 2026
**Forfatter:** Economist
**Status:** Utkast til review

---

## 1. Markedsstørrelse — TAM / SAM / SOM

### 1.1 TAM — Total Addressable Market (Norge)

TAM beregnes nedenfra og opp («bottom-up») basert på kjente markedsfakta.

**Antagelser:**
- Antall pianoer i Norge: **97 500** (midtpunkt mellom 75 000 og 120 000)
- Andel i aktiv bruk som stemmes regelmessig: **40 %** (konservativt estimat — mange pianoer er arvegods som brukes sjelden)
- Aktive pianoer: **39 000**
- Gjennomsnittlig stemminger per år: **1,5** (mellom minimum 1 og anbefalt 2)
- Gjennomsnittlig pris per stemming: **kr 2 853 inkl. mva.**

**TAM-beregning:**

| Parameter | Verdi |
|---|---|
| Aktive pianoer | 39 000 |
| Stemminger per piano per år | 1,5 |
| Totale stemminger per år (Norge) | 58 500 |
| Pris per stemming | Kr 2 853 |
| **TAM — total markedsverdi** | **Kr 166,9 mill/år** |

TAM inkluderer alle stemminger i Norge, uavhengig av om de skjer via plattform, telefon, Finn-annonse eller fast kunderelasjoner.

### 1.2 SAM — Serviceable Addressable Market

SAM er den andelen av TAM vi realistisk kan adressere med vår plattform innen 3 år, gitt geografisk dekning og plattformadopsjon.

**Antagelser:**
- Vi dekker Oslo, Bergen, Trondheim, Stavanger og Kristiansand innen år 3 (ca. 60 % av norske pianoer)
- Av pianoeiere i dekket geografi anslår vi at 35 % er åpne for å bruke en digital bookingplattform
- Av disse er 50 % allerede i markedet for stemming (dvs. de stemmer faktisk pianoet)

**SAM-beregning:**

| Parameter | Verdi |
|---|---|
| TAM | Kr 166,9 mill/år |
| Geografisk dekningsfaktor (60 %) | Kr 100,2 mill/år |
| Digitaliseringsvilje-faktor (35 %) | Kr 35,1 mill/år |
| Aktiv stemmingsandel (50 %) | Kr 17,5 mill/år |
| **SAM** | **Ca. kr 17–35 mill/år** |

Vi bruker kr 17,5 mill som konservativt SAM og kr 35 mill som optimistisk SAM.

### 1.3 SOM — Serviceable Obtainable Market

SOM er vår realistiske målbare markedsandel innenfor SAM.

| År | GMV-mål | Markedsandel av SAM (konservativt) | Begrunnelse |
|---|---|---|---|
| År 1 (mnd 1–12) | Kr 1,5 mill | 4–9 % av SAM | Tidlig fase, kun Oslo, manuell matching |
| År 2 (mnd 13–24) | Kr 6,0 mill | 17–34 % av SAM | Nasjonal, Stripe live, selvbetjening |
| År 3 (mnd 25–36) | Kr 14,0 mill | 40–80 % av SAM | Moden plattform, nettverk etablert |

---

## 2. Enhetøkonomi per transaksjon

### 2.1 Gjennomsnittlig booking-verdi

| Parameter | Verdi | Kilde/antagelse |
|---|---|---|
| Brutto oppdragsverdi (inkl. mva.) | Kr 2 853 | Pianostemmeren AS, 2026 |
| Opptrekk-tillegg (15 % av oppdrag) | + Kr 1 427 | Ca. halvparten av stemmepris |
| Vektet gjennomsnittlig booking-verdi | **Kr 3 066** | 85 % standard + 15 % opptrekk |

For enkelhets skyld bruker vi **kr 2 853** som base-case i alle beregninger nedenfor (opptrekk er en positiv oppsiderisiko).

### 2.2 Kostnadstruktur per transaksjon (ved 12 % provisjon)

| Post | Beregning | Beløp |
|---|---|---|
| Brutto oppdragsverdi | — | Kr 2 853,00 |
| **Stripe betalingsgebyr** | 2,0 % + kr 1,80 | − Kr 58,86 |
| **PianoHelse-provisjon (12 %)** | 12 % av kr 2 853 | + Kr 342,36 |
| **Stripe Connect Express-utbetaling** | 0,25 % av kr 2 510 + kr 0,10 | − Kr 6,38 |
| **Netto provisjonsinntekt til PianoHelse** | Kr 342 − kr 58,86 − kr 6,38 | **Kr 277,12** |
| **Netto til stemmer** | Kr 2 853 − kr 342 | **Kr 2 511,00** |

**Margin per transaksjon: kr 277 (9,7 % av GMV)**

Ved 15 % provisjon:

| Post | Beløp |
|---|---|
| Provisjon (15 %) | Kr 427,95 |
| Stripe gebyr | − Kr 58,86 |
| Stripe Connect | − Kr 6,38 |
| **Netto til PianoHelse** | **Kr 362,71** |
| Netto margin % av GMV | 12,7 % |

### 2.3 Oppsummering: netto margin per transaksjon

| Provisjonssats | Netto til PianoHelse | Netto margin |
|---|---|---|
| 10 % | Kr 191,84 | 6,7 % |
| 12 % | Kr 277,12 | 9,7 % |
| 15 % | Kr 362,71 | 12,7 % |
| 18 % | Kr 448,30 | 15,7 % |

---

## 3. Customer Acquisition Cost (CAC)

### 3.1 CAC — Pianoeier

Pianoeiere akkviereres primært gjennom gratisdiagnostikk, SEO, sosiale medier og PR. Direkte betalt annonsering er sekundær kanal.

| Kanal | Estimert kostnad | Estimert konvertering | CAC fra kanalen |
|---|---|---|---|
| Facebook/Instagram-annonse | Kr 35 per klikk | 8 % til diagnose, 20 % til booking | Kr 219 per bookende eier |
| SEO / organisk | Kr 0 direkte; Kr 15 000/mnd content | 300 besøk/mnd → 30 bookinger | Kr 500 per bookende eier |
| PR / pressedekning | Kr 15 000 engangs | 200 besøk → 20 bookinger | Kr 750 per bookende eier |
| Referral fra stemmer | Kr 0 | Høy — stemmeren anbefaler | Ca. Kr 0–50 |
| Partnerskap (pianobutikk, kulturskole) | Kr 5 000/år per partner | 5 bookinger/mnd per partner | Kr 83 per bookende eier |

**Vektet gjennomsnittlig CAC pianoeier (år 1): kr 250–400**

For modelleringsformål bruker vi **kr 300** som base-case CAC for pianoeier.

### 3.2 CAC — Pianostemmer

Stemmere rekrutteres manuelt i tidlig fase via NPTF, LinkedIn og direkte oppsøk. Kostnaden er primært tid.

| Kanal | Estimert kostnad | Estimert konvertering | CAC |
|---|---|---|---|
| NPTF-presentasjon | Kr 5 000 (reise, materiell) | 15 stemmere av 20 tilstede | Kr 333 per stemmer |
| LinkedIn direkte | Kr 2 000/mnd (tid) | 2 stemmere/mnd | Kr 1 000 per stemmer |
| Direkte oppsøk (telefon/e-post) | Kr 3 000/mnd (tid) | 3 stemmere/mnd | Kr 1 000 per stemmer |
| Stemmer-referral | Kr 0 | 1 per eksisterende stemmer per kvartal | Kr 0–100 |

**Vektet gjennomsnittlig CAC stemmer (år 1): kr 400–800**

For modellering bruker vi **kr 600** som base-case CAC for stemmer.

---

## 4. Lifetime Value (LTV)

### 4.1 LTV — Pianoeier

**Antagelser:**
- Gjennomsnittlig booking-frekvens: 1,5 ganger per år
- Gjennomsnittlig oppdragsverdi: kr 2 853
- PianoHelse provisjon (12 %): kr 342 per oppdrag
- Netto provisjonsinntekt per oppdrag: kr 277
- Gjennomsnittlig kundeforhold: 4 år (pianoeiere bytter sjelden plattform)
- Churn rate per år: 20 % (20 % av pianoeiere bruker ikke plattformen igjen etter hvert år)

**LTV-beregning:**

```
Gjennomsnittlig inntekt per år = 1,5 oppdrag × kr 277 = kr 416/år
Gjennomsnittlig livstid = 1 / churn = 1 / 0,20 = 5 år
LTV (pianoeier) = kr 416 × 5 = kr 2 078
```

| Scenario | Churn/år | Inntekt/år | LTV |
|---|---|---|---|
| Pessimistisk | 33 % | Kr 277 | Kr 831 |
| Base case | 20 % | Kr 416 | Kr 2 078 |
| Optimistisk | 15 % | Kr 555 (2 stemminger/år) | Kr 3 700 |

### 4.2 LTV — Pianostemmer

**Antagelser:**
- Gjennomsnittlig oppdrag per stemmer per måned via plattformen: 8 oppdrag (av totalt ca. 25–40 som stemmeren gjør)
- Netto inntekt per oppdrag til PianoHelse: kr 277
- Gjennomsnittlig stemmertilknytning til plattformen: 3 år
- Churn rate per år: 15 % (stemmere er mer stabile enn pianoeiere)

**LTV-beregning:**

```
Inntekt per stemmer per måned = 8 × kr 277 = kr 2 216
Inntekt per stemmer per år = kr 26 592
Gjennomsnittlig livstid = 1 / 0,15 = 6,7 år
LTV (stemmer) = kr 26 592 × 6,7 = kr 178 165
```

Stemmere er klart den mest verdifulle siden av markedsplassen — en etablert stemmer med jevnt volum genererer inntekter tilsvarende LTV på ca. kr 178 000 over livsløpet.

### 4.3 LTV:CAC-ratio — Vurdering

| Kundesegment | LTV (base case) | CAC (base case) | LTV:CAC | Vurdering |
|---|---|---|---|---|
| Pianoeier | Kr 2 078 | Kr 300 | 6,9 : 1 | God — tommelfingerregelen er > 3:1 |
| Pianostemmer | Kr 178 165 | Kr 600 | 297 : 1 | Utmerket — høyt på grunn av volum |

**Konklusjon:** Enhetøkonomien er fundamental sterk. Særlig stemmersiden har ekstremt gunstig LTV:CAC-ratio. Pianoeier-siden er solid med 6,9:1, men avhenger av at vi klarer å holde churn under 25 %.

**Kritisk risiko:** LTV på pianoeier-siden er svært sensitiv for bookingfrekvens. Dersom vi ikke klarer å aktivere den gjennomsnittlige eieren til å bestille minst én stemming per år, faller LTV drastisk.

---

## 5. Break-even-analyse

### 5.1 Månedlige faste kostnader (Fase 2 — mnd 7–18)

| Kostnad | Per måned | Antagelse |
|---|---|---|
| Supabase (Pro-tier) | Kr 250 ($25) | Aktiveres når vi nærmer oss 500 MB DB eller 50 000 brukere |
| Domene / SSL | Kr 50 | Annualisert |
| E-posttjeneste (Sendgrid) | Kr 150 | Inntil 40 000 e-poster/mnd |
| Stripe-månedlig fee | Kr 0 | Pay-per-transaction |
| Markedsføring (betalt) | Kr 10 000 | Fase 2, redusert fra fase 1 |
| Juridisk / revisjon | Kr 2 000 | Annualisert månedskost |
| Forsikring / org. | Kr 500 | Annualisert |
| **Totale faste kostnader** | **Kr 12 950** | Ekskl. lønn/utviklerkostnad |

**Merk:** Lønn er ikke inkludert i break-even-analysen for den operative driften — dette forutsetter at teamet i Fase 2 enten er bootstrapped (ubetalt) eller finansiert av ekstern investering. Se Finansiell modell for fullstendig P&L inkl. lønnskostnad.

### 5.2 Antall transaksjoner for driftsbreak-even

```
Faste kostnader per måned: kr 12 950
Netto inntekt per transaksjon (12 % provisjon): kr 277

Break-even = kr 12 950 / kr 277 = 47 transaksjoner per måned
```

**47 bookinger per måned er nok til å dekke alle operative driftskostnader.**

Dette tilsvarer ca. 6 stemmere som hver gjennomfører 8 oppdrag per måned via plattformen — et svært oppnåelig mål allerede i tidlig Fase 2.

### 5.3 Break-even ved ulike provisjonssatser

| Provisjonssats | Netto/transaksjon | Break-even transaksjoner/mnd |
|---|---|---|
| 10 % | Kr 192 | 67 |
| 12 % | Kr 277 | 47 |
| 15 % | Kr 363 | 36 |
| 18 % | Kr 448 | 29 |

### 5.4 Supabase-terskel

Supabase Free tier gir:
- 50 000 månedlig aktive brukere (MAU)
- 500 MB database
- 5 GB fillagring

**Estimert overgang til betalt tier:**

| Parameter | Estimat |
|---|---|
| Registrerte pianoeiere etter 12 mnd | 5 000 |
| Registrerte stemmere etter 12 mnd | 60 |
| Diagnostikk-resultater lagret (gjennomsnitt 2 KB per diagnose × 3 000 diagnosesesjoner) | Ca. 6 MB |
| Bookingdata, brukerdata, logger | Ca. 50 MB/år |
| **Estimert databasebruk etter 12 mnd** | **Ca. 56 MB** |

Konklusjon: Vi overstiger sannsynligvis ikke 500 MB database-grensen i løpet av de første 18 månedene. Den første betalingsutløsende grensen er heller **50 000 MAU** — som vi ikke vil nå før tidligst år 2–3. Supabase-kostnaden forblir kr 0 gjennom hele Fase 1 og Fase 2.

---

*Dokumenteier: Economist*
*Neste revisjon: Etter 3 måneder med reelle transaksjonsdata fra Fase 2.*
