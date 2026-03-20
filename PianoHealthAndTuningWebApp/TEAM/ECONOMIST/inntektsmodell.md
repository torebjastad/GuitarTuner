# PianoHelse — Inntektsmodell

**Versjon:** 1.0
**Dato:** 20. mars 2026
**Forfatter:** Economist
**Status:** Utkast til review

---

## Sammendrag

PianoHelse bygger inntekter gjennom fire strømmer i prioritert rekkefølge:

1. **Provisjon per booking** (primær) — aktiveres i Fase 2
2. **Månedlig abonnement for stemmere** (sekundær) — aktiveres sent i Fase 2
3. **Premium-synlighet / "boost"** (tertiær) — aktiveres i Fase 2/3
4. **PianoHelse Pro for pianoeiere** (kvartær) — aktiveres i Fase 3

I MVP-fasen (måneder 1–6) tas ingen inntekter. Fokus er utelukkende på å bygge nettverk, data og tillit.

---

## Inntektsstrøm 1 — Provisjon per booking (Primær)

### Beskrivelse

PianoHelse tar et prosentvis gebyr av brutto oppdragsverdi ved hver gjennomført booking via plattformen. Gebyret trekkes automatisk ved betaling (Stripe Connect), slik at stemmeren utbetales netto etter at provisjonen er trukket.

Gjennomsnittlig oppdragsverdi: **kr 2 853 inkl. mva.**

### Sammenligning av tre provisjonssatser

| Provisjonssats | Provisjon per oppdrag | Stemmerens netto | Konsekvenser for pianoeier | Konsekvenser for stemmer |
|---|---|---|---|---|
| **10 %** | Kr 285 | Kr 2 568 | Ingen merkbar prisøkning | Taper Kr 285 per oppdrag; tilsvarer ett oppdrag i lufta (~1,5–2 t kjøring) |
| **15 %** | Kr 428 | Kr 2 425 | Ingen merkbar prisøkning | Taper Kr 428 per oppdrag; stemmeren beholder 85 % |
| **18 %** | Kr 513 | Kr 2 340 | Marginalt merkbar | Stemmere kan reagere negativt; risiko for bypass |

### Anbefalte satser per fase

| Fase | Sats | Begrunnelse |
|---|---|---|
| Fase 2 (mnd 7–12) | **12 %** | Introduksjonssats som balanserer inntjening og stemmernes aksept |
| Fase 3 (mnd 13–24) | **15 %** | Økes gradvis når plattformverdien er bevist |
| Langsiktig mål | **15 %** | Forsvares av leads-kvalitet, diagnosedata og kalenderverktøy |

**Merk:** 10 % er for lavt til å bære driftskostnader på realistisk transaksjonsvolum. 18 % er konkurranseeksponerende (Mittanbud tar 20–25 %, men er en generalist uten diagnostikk). 15 % er ønskemålet, men 12 % er riktig startpunkt for å etablere tillitt med stemmerne.

### Betalingsflyt

```
Pianoeier betaler kr 2 853
    └── Stripe tar 2,0 % + 1,8 NOK = ca. kr 58,9
    └── PianoHelse-provisjon 12 % = kr 342
    └── Stripe Connect Express-utbetaling: 0,25 % + 0,10 NOK = ca. kr 7,2
    └── Stemmer mottar netto: ca. kr 2 445
```

### Risiko

- **Bypass-risiko:** Stemmere og pianoeiere kan avtale direkte etter første møte. Mottas ved å bygge verdi stemmerne ikke kan kopiere: diagnostikkhistorikk, betalingssikkerhet, anmeldelsessystem, kalenderintegrasjon.
- **Prisresistens hos stemmere:** Selvstendig næringsdrivende er prissensitive. Motvirkes ved å tilby gratis profilering i 12 måneder og demonstrere at leads-kvaliteten er langt høyere enn andre kanaler.
- **Vipps-provisjonsspørsmål:** Vipps eComm tar 1,5–2,5 % avhengig av volum. Inkluder dette i priskalkylen — det erstatter ikke Stripe, men kan kjøres parallelt.

### Timing

- **Aktiveres:** Måned 7 (Fase 2-start)
- **Forutsetning:** Stripe Connect integrasjon fullført; betalingsvilkår godkjent av Finanstilsynet (vurder om PianoHelse er betalingsinstitusjon eller agent)

---

## Inntektsstrøm 2 — Månedlig abonnement for stemmere (Sekundær)

### Beskrivelse

Et valgfritt månedlig abonnement for stemmere som ønsker ekstra synlighet, verktøy eller redusert provisjonssats. Abonnementet er ikke påkrevd — stemmere kan operere på ren provisjon.

### Sammenligning av tre abonnementsnivåer

| Abonnement | Pris/mnd | Innhold | Effektiv provisjon | Break-even oppdrag/mnd |
|---|---|---|---|---|
| **Basis** | Kr 199 | Fremhevet profil, månedlig statistikk | 12 % provisjon (ingen rabatt) | 1 oppdrag |
| **Profesjonell** | Kr 299 | Fremhevet profil + kalenderintegrasjon + 2 % provisjonsrabatt (10 %) | 10 % provisjon | 1,5 oppdrag |
| **Premium** | Kr 399 | Topp-plassering, prioritert match, 3 % provisjonsrabatt (9 %), månedlig rapport | 9 % provisjon | 2 oppdrag |

**Anbefalte priser:** Basis kr 199 er for lav til å skape meningsfull inntekt men nok til å gi lav friksjon. Profesjonell kr 299 gir best verdi for etablerte stemmere med jevn bookingstrøm. Premium kr 399 er for de med høyt volum som ønsker synlighetsfordel.

### Beregning: provisjonsrabatt ved abonnement

En stemmer med 10 oppdrag per måned à kr 2 853:
- Uten abonnement (12 % provisjon): betaler kr 3 424/mnd i provisjon
- Med Profesjonell (kr 299 + 10 % provisjon): betaler kr 2 853 + kr 299 = kr 3 152/mnd — **sparer kr 272/mnd**
- Med Premium (kr 399 + 9 % provisjon): betaler kr 2 568 + kr 399 = kr 2 967/mnd — **sparer kr 457/mnd**

Abonnementet er lønnsomt for stemmeren fra ca. 3 oppdrag per måned.

### Risiko

- **Adopsjon:** Stemmere er vante med å betale enten ingenting eller en fast annonsepris. Abonnementsmønstre er ukjente i bransjen — forvent lav adopsjon initialt.
- **Kanibaliseringsrisiko:** Redusert provisjon ved abonnement reduserer provisjonsinntekten. Motvirkes ved at abonnementet reelt sett øker stemmernes lojalitet og volum.
- **Churnskrisiko:** Hvis en stemmer avslutter abonnementet, kan det signalisere at plattformen ikke leverer nok verdi.

### Timing

- **Aktiveres:** Måned 10–12 (sent i Fase 2), når vi har minst 30 aktive stemmere
- **Forutsetning:** Kalenderintegrasjon og statistikkdashboard er bygget

---

## Inntektsstrøm 3 — Premium-synlighet / "Boost" (Tertiær)

### Beskrivelse

Stemmere kan betale for å bli vist øverst i søkeresultater eller som "Anbefalt stemmer" i sin region i en definert periode.

### Prisliste (forslag)

| Produkt | Pris | Varighet | Hva det gir |
|---|---|---|---|
| Regionboost — Oslo | Kr 299 | 7 dager | Øverst i Oslo-listen |
| Regionboost — Bergen/Trondheim | Kr 199 | 7 dager | Øverst i region-listen |
| Ukens stemmer (nasjonal) | Kr 499 | 7 dager | Fremhevet på forsiden |
| Sesongkampanje (vår/høst) | Kr 799 | 30 dager | Fremhevet i sesong-e-poster |

### Begrunnelse

Dette er en kjent og akseptert mekanisme fra Finn.no, Mittanbud og Bark.com. Stemmere forstår konseptet. Inntekten er forutsigbar (forhåndsbetalt) og tilleggsinntekt uten ekstra driftskostnad.

### Risiko

- **Troverdighetsrisiko:** Brukere kan oppleve betalte plasseringer som uærlige. Må merkes tydelig som "Annonsert" eller "Fremhevet".
- **Lavt volum tidlig:** Med få stemmere er konkurransen om synlighet lav — stemmere har liten grunn til å betale. Relevant først når vi har 20+ stemmere i én by.

### Timing

- **Aktiveres:** Måned 12–15, når geografisk konkurranse mellom stemmere er reell

---

## Inntektsstrøm 4 — PianoHelse Pro for pianoeiere (Kvartær)

### Beskrivelse

Et valgfritt abonnement for pianoeiere som ønsker mer enn gratisdiagnosen.

### Innhold

| Funksjon | Gratis | PianoHelse Pro (Kr 99/mnd eller Kr 799/år) |
|---|---|---|
| Én stemmekurve-analyse | Ja | Ja |
| Diagnostikkhistorikk (alle analyser) | Nei | Ja |
| Automatisk påminnelse (6 eller 12 mnd) | Nei | Ja |
| PDF-rapport for nedlasting | Nei | Ja |
| Sammenligning av stemmekurver over tid | Nei | Ja |
| Prioritert behandling ved booking | Nei | Ja |
| Institusjonell konto (flere pianoer) | Nei | Kr 299/mnd |

### Begrunnelse

Kr 99/mnd er relativt lavt men relevant for den engasjerte pianoeieren. Årsabonnementet til Kr 799 gir 2 måneders rabatt og bedre forutsigbarhet. Institusjonell pris på Kr 299/mnd er rimelig for kulturskoler med 8+ pianoer.

### Risiko

- **Lav betalingsvilje hos private:** De fleste pianoeiere stemmer pianoet 1–2 ganger per år. Månedlig abonnement kan virke overkill. Årsmodellen er sannsynligvis mer relevant.
- **Innholdskrav:** Pro-funksjoner krever at backend lagrer og behandler diagnostikkdata, noe som øker GDPR-kompleksiteten.
- **Churnskrisiko:** Brukere som glemmer å stemme pianoet vil ikke fornye abonnementet.

### Timing

- **Aktiveres:** Fase 3 (måned 18+)
- **Forutsetning:** Historikk-funksjonalitet implementert, GDPR-vurdering gjennomført

---

## Anbefalt modell-mix

### Fase 1 (måneder 1–6): Ingen inntekter

Fokus er utelukkende på å bygge nettverk og validere produktet. All provisjon og abonnement utsettes.

### Fase 2 (måneder 7–18): Provisjon som eneste inntektskilde

| Tidspunkt | Aktivt |
|---|---|
| Måned 7 | Provisjon 12 % aktiveres |
| Måned 10 | Abonnement for stemmere lanseres |
| Måned 12 | Boost/fremhevet plassering lanseres |

**Begrunnelse:** Provisjonsmodellen er enkel å kommunisere, krever ingen ny teknologi utover Stripe Connect, og gir direkte inntekter per transaksjon. Det er den naturlige første monetiseringsmodellen for en markedsplass i tidlig fase.

### Fase 3 (måned 18+): Full modell-mix

Alle fire inntektsstrømmer aktive. PianoHelse Pro lanseres for å øke LTV for pianoeier-siden.

### Langsiktig mix-mål (år 3)

| Inntektsstrøm | Andel av total omsetning |
|---|---|
| Provisjon per booking | 70 % |
| Stemmer-abonnement | 15 % |
| Premium-synlighet | 8 % |
| PianoHelse Pro | 7 % |

Provisjonen vil alltid dominere fordi den skalerer direkte med antall oppdrag. De øvrige strømmene fungerer som margin-forbedring og demper risikoen ved volumnedgang.

---

*Dokumenteier: Economist*
*Neste revisjon: Etter at Fase 2 er aktivert og de første 3 månedene med provisjonsdata foreligger.*
