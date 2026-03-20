# PianoHelse — Finansiell Modell (18 måneder)

**Versjon:** 1.0
**Dato:** 20. mars 2026
**Forfatter:** Economist
**Status:** Utkast til review

---

## Antagelser og forutsetninger

### Generelle antagelser

| Parameter | Verdi | Kilde/begrunnelse |
|---|---|---|
| Gjennomsnittlig booking-verdi (GMV) | Kr 2 853 | Pianostemmeren AS, 2026 |
| Provisjonssats (fra mnd 7) | 12 % | Introduksjonssats — se inntektsmodell.md |
| Netto provisjonsinntekt per booking | Kr 277 | Etter Stripe-gebyrer (2 % + kr 1,80 + Stripe Connect 0,25 % + kr 0,10) |
| Supabase kostnad | Kr 0 (gratisnivå) | Passeres ikke i 18 mnd-perioden — se enhetokonomi.md |
| E-post (Sendgrid) | Kr 0 (gratisnivå → kr 150/mnd fra mnd 7) | Free tier: 100 e-poster/dag |
| Domene / SSL | Kr 100/mnd | Annualisert |
| Markedsføring | Varierer per fase | Se fase-antagelser |

### Fase-antagelser

**Fase 0 / Fase 1 (mnd 1–6): MVP — ingen inntekter**
- Ingen provisjon tas
- Fokus: rekruttering av stemmere, diagnostikkbruk, produktvalidering
- Kostnader: infrastruktur (nærmest kr 0), markedsføring (kr 10 000–15 000/mnd), juridisk/etablering (engangspost)

**Fase 2 (mnd 7–18): Markedsplass aktivert**
- Provisjon 12 % aktiveres fra mnd 7
- Nasjonal utrulling mnd 7–12
- Stemmere: vekst fra 20 til 60 aktive nasjonalt
- Bookinger: ramp-up fra 50 til 500+ per måned
- Kostnader: Sendgrid betalt, mer annonsering

### Bookingvekst-antagelse per scenario

**Base case:**
- Mnd 7: 50 bookinger (Oslo, soft launch av betalte bookinger)
- Vekst: +25 % per måned mnd 7–10, +15 % per måned mnd 11–18

**Pessimistisk:**
- Mnd 7: 25 bookinger
- Vekst: +15 % per måned

**Optimistisk:**
- Mnd 7: 80 bookinger
- Vekst: +35 % per måned mnd 7–10, +20 % per måned mnd 11–18

---

## Månedlig P&L — Base Case

| Mnd | Nye stemmere | Aktive stemmere | Bookinger/mnd | GMV (kr) | Provisjonsinntekt (kr) | Driftskost (kr) | EBITDA (kr) | Akk. cash (kr) |
|---|---|---|---|---|---|---|---|---|
| 1 | 5 | 5 | 0 | 0 | 0 | −95 000 | −95 000 | −95 000 |
| 2 | 4 | 9 | 0 | 0 | 0 | −55 000 | −55 000 | −150 000 |
| 3 | 3 | 12 | 0 | 0 | 0 | −45 000 | −45 000 | −195 000 |
| 4 | 2 | 14 | 0 | 0 | 0 | −40 000 | −40 000 | −235 000 |
| 5 | 2 | 16 | 0 | 0 | 0 | −35 000 | −35 000 | −270 000 |
| 6 | 4 | 20 | 0 | 0 | 0 | −45 000 | −45 000 | −315 000 |
| 7 | 5 | 25 | 50 | 142 650 | 13 850 | −50 000 | −36 150 | −351 150 |
| 8 | 4 | 29 | 63 | 179 739 | 17 458 | −48 000 | −30 542 | −381 692 |
| 9 | 4 | 33 | 79 | 225 387 | 21 892 | −48 000 | −26 108 | −407 800 |
| 10 | 5 | 38 | 99 | 282 447 | 27 422 | −45 000 | −17 578 | −425 378 |
| 11 | 4 | 42 | 114 | 325 242 | 31 588 | −42 000 | −10 412 | −435 790 |
| 12 | 5 | 47 | 131 | 373 443 | 36 264 | −42 000 | −5 736 | −441 526 |
| 13 | 4 | 51 | 151 | 430 503 | 41 799 | −40 000 | 1 799 | −439 727 |
| 14 | 3 | 54 | 174 | 496 122 | 48 164 | −40 000 | 8 164 | −431 563 |
| 15 | 3 | 57 | 200 | 570 600 | 55 422 | −40 000 | 15 422 | −416 141 |
| 16 | 3 | 60 | 230 | 656 190 | 63 761 | −38 000 | 25 761 | −390 380 |
| 17 | 2 | 62 | 265 | 755 445 | 73 378 | −38 000 | 35 378 | −355 002 |
| 18 | 2 | 64 | 305 | 869 565 | 84 508 | −38 000 | 46 508 | −308 494 |

**Merk:** EBITDA er positivt fra måned 13. Akkumulert cash-underskudd ved slutt av mnd 18: ca. kr 308 000.

### Notater til tabellen

**Driftskost per fase (base case):**

| Mnd 1 | Høy (kr 95 000) — juridisk etablering (kr 40 000), design/logo (kr 20 000), hosting-oppsett, markedsføring |
|---|---|
| Mnd 2–6 | Kr 35 000–55 000/mnd — primært markedsføring og tid |
| Mnd 7–12 | Kr 42 000–50 000/mnd — Sendgrid betalt, økt markedsføring for nasjonal lansering |
| Mnd 13–18 | Kr 38 000–40 000/mnd — stabil drift, markedsføring optimalisert |

**Provisjonsinntekt-beregning:** Bookinger × kr 2 853 × 12 % × (1 − Stripe-andel på ca. 19 %)
Forenklet: Bookinger × kr 277 per booking.

---

## Scenarioer

### Pessimistisk scenario

**Antagelse:** Stemmernes adopsjon er treg (10 aktive stemmere ved mnd 6), bookinger starter lavt (25/mnd), vekst på 15 %/mnd.

| Mnd | Bookinger/mnd | GMV (kr) | Provisjonsinntekt (kr) | Driftskost (kr) | EBITDA (kr) | Akk. cash (kr) |
|---|---|---|---|---|---|---|
| 1–6 | 0 | 0 | 0 | −270 000 (totalt) | −270 000 | −270 000 |
| 7 | 25 | 71 325 | 6 925 | −50 000 | −43 075 | −313 075 |
| 8 | 29 | 82 737 | 8 035 | −48 000 | −39 965 | −353 040 |
| 9 | 33 | 94 149 | 9 145 | −48 000 | −38 855 | −391 895 |
| 10 | 38 | 108 414 | 10 527 | −45 000 | −34 473 | −426 368 |
| 11 | 44 | 125 532 | 12 190 | −42 000 | −29 810 | −456 178 |
| 12 | 51 | 145 503 | 14 131 | −42 000 | −27 869 | −484 047 |
| 13 | 59 | 168 327 | 16 349 | −40 000 | −23 651 | −507 698 |
| 14 | 68 | 194 004 | 18 843 | −40 000 | −21 157 | −528 855 |
| 15 | 78 | 222 534 | 21 610 | −40 000 | −18 390 | −547 245 |
| 16 | 90 | 256 770 | 24 933 | −38 000 | −13 067 | −560 312 |
| 17 | 104 | 296 712 | 28 803 | −38 000 | −9 197 | −569 509 |
| 18 | 120 | 342 360 | 33 249 | −38 000 | −4 751 | −574 260 |

**Konklusjon pessimistisk:** EBITDA-positivt ikke nådd innen 18 måneder. Akkumulert underskudd: ca. kr 574 000. Ekstern finansiering nødvendig.

---

### Optimistisk scenario

**Antagelse:** 20 aktive stemmere ved mnd 6, 80 bookinger ved mnd 7, vekst 35 %/mnd mnd 7–10, 20 %/mnd mnd 11–18.

| Mnd | Bookinger/mnd | GMV (kr) | Provisjonsinntekt (kr) | Driftskost (kr) | EBITDA (kr) | Akk. cash (kr) |
|---|---|---|---|---|---|---|
| 1–6 | 0 | 0 | 0 | −315 000 (totalt) | −315 000 | −315 000 |
| 7 | 80 | 228 240 | 22 166 | −50 000 | −27 834 | −342 834 |
| 8 | 108 | 308 124 | 29 944 | −48 000 | −18 056 | −360 890 |
| 9 | 146 | 416 538 | 40 475 | −48 000 | −7 525 | −368 415 |
| 10 | 197 | 562 041 | 54 622 | −45 000 | 9 622 | −358 793 |
| 11 | 237 | 676 461 | 65 738 | −42 000 | 23 738 | −335 055 |
| 12 | 284 | 810 252 | 78 694 | −42 000 | 36 694 | −298 361 |
| 13 | 341 | 972 273 | 94 493 | −40 000 | 54 493 | −243 868 |
| 14 | 409 | 1 167 777 | 113 435 | −40 000 | 73 435 | −170 433 |
| 15 | 491 | 1 398 243 | 135 888 | −40 000 | 95 888 | −74 545 |
| 16 | 589 | 1 679 517 | 163 155 | −38 000 | 125 155 | 50 610 |
| 17 | 707 | 2 016 171 | 195 891 | −38 000 | 157 891 | 208 501 |
| 18 | 848 | 2 418 744 | 234 929 | −38 000 | 196 929 | 405 430 |

**Konklusjon optimistisk:** EBITDA-positivt fra mnd 10. Akkumulert positiv cash ved mnd 16. Ingen ekstern finansiering strengt nødvendig dersom kr 315 000 er tilgjengelig ved oppstart.

---

## Kapitalbehov

### Base case — nødvendig startkapital

Maksimalt akkumulert underskudd (cash low point) i base case: **ca. kr 441 526** (mnd 12).

Anbefalt buffer: 20 % overskudd → **kr 530 000 i total finansiering ved oppstart**.

### Pessimistisk — nødvendig startkapital

Maksimalt underskudd: **ca. kr 574 000** (mnd 18, ingen break-even innen perioden).
Anbefalt buffer: **kr 700 000 i finansiering**, og plan for Serie A-runde dersom optimistisk scenario ikke materialiseres ved mnd 12.

### Optimistisk — nødvendig startkapital

Maksimalt underskudd: **ca. kr 368 000** (mnd 9).
Anbefalt buffer: **kr 450 000** tilgjengelig.

### Sammenfattet kapitalbehov

| Scenario | Minimum startkapital | Anbefalt buffer | Ekstern finansiering nødvendig? |
|---|---|---|---|
| Pessimistisk | Kr 574 000 | Kr 700 000 | Ja — foreslå kr 1 mill (gir 6 mnd ekstra runway) |
| Base case | Kr 442 000 | Kr 530 000 | Mulig uten ekstern kapital om grunnleggerne bootstrapper |
| Optimistisk | Kr 368 000 | Kr 450 000 | Nei |

### Finansieringskilder

1. **Bootstrapping / grunnleggernes kapital:** Kr 200 000–400 000 kan dekke early MVP-fasen
2. **Innovasjon Norge — Oppstartslån:** Inntil kr 500 000 for tidligfasebedrifter. Relevant pga. kulturteknologi-vinkel.
3. **Kulturdepartementet — utviklingstilskudd:** Musikk som kulturarv er et prioritert område.
4. **Engelinvestorer / Pre-seed:** En musikk-entusiast investor vil typisk se etter kr 500 000–1 500 000 for 10–20 % eierandel.
5. **Norsk musikkbransje:** NMF, NPTF eller pianoforhandlere kan bidra med mindre beløp i bytte for partnerskap.

---

*Dokumenteier: Economist*
*Neste revisjon: Mnd 6 — ved overgang til Fase 2. Faktiske tall erstatter estimater.*
