# PianoHelse — Prosjektstatus
**Versjon:** 1.3
**Dato:** 20. mars 2026
**Oppdatert av:** Lead Coordinator

---

## Siste oppdatering — 20. mars 2026

**Dato:** 20. mars 2026
**Oppdatert av:** Lead Coordinator (agent-revisjon)

### Applikasjonen er fullt funksjonell (FULLY FUNCTIONAL)

Alle 7 skjermer er bygget, koblet sammen og testet. Diagnostikkmodulen fungerer fra ende til ende — fra velkomstskjerm til rapport og videre til tuner-markedsplass. Alle kjente tekniske beslutninger er implementert og verifisert.

#### Funksjoner bekreftet OK per 20. mars 2026

| Funksjon | Detaljer | Status |
|---|---|---|
| 7-skjerms SPA | velkomst → piano-info → forberedelse → skanning → analyse → rapport → finn-stemmer | Fullfort |
| UltimateDetector integrert | Pitch-deteksjon via `../../pitch-common.js` + `../../ultimate-detector.js` | Fullfort |
| 88-tasters visuelt keyboard | Viser skannefremdrift i sanntid, tast for tast | Fullfort |
| Stabilitetsbasert pitch-deteksjon | Median, min 1,5 s dwell, relStd < 0,3 % | Fullfort |
| 5-nivå helseskoring | Gaussisk vekting sentrert pa A4 | Fullfort |
| Chart.js Railsback-stemmekurve | Scrollbar, bred visning | Fullfort |
| Mock tuner-markedsplass | 3 stemmere, telefonbasert booking | Fullfort |
| Digitalt piano-advarsel | Vises nar bruker velger "digitalt" i piano-info | Fullfort |
| Pitch raise-advarsel | Vises nar gjennomsnittlig avvik er >= 25 cent | Fullfort |
| Scorebasert hastegrad i finn-stemmer | Hastegrad avhenger av helsepoeng | Fullfort |
| Bekreftelsesbiep | 880 Hz, 50 ms — spilles ved bekreftet tast | Fullfort |
| Haptisk tilbakemelding | Vibrasjon pa bekreftede taster | Fullfort |
| iOS PWA-kompatibilitet | Hash-router, ingen History API | Fullfort |
| Service worker deaktivert for dev | Avregistrerer gamle cachede versjoner automatisk | Fullfort |

#### Tekniske nøkkelparametere (bekreftet implementert)

| Parameter | Verdi | Begrunnelse |
|---|---|---|
| UltimateDetector RMS-gate | Ingen (fjernet) | Bruker kun clarity-gate (0,40) |
| Scanner MIN_RMS | 0,0002 | Filtrerer kun digital stillhet |
| Scanner MAKS_REL_STD | 0,003 (0,3 %) | Stabilitetsterskel |
| Scanner MIN_SAMLETID_MS | 1500 ms | Krever 1,5 s innsamlingstid |
| Script-stier | `../../pitch-common.js`, `../../ultimate-detector.js` | Relative stier fra app/-mappen |

---

## Gjenverende blokkere for offentlig lansering

| Blokkerer | Detaljer | Haster |
|---|---|---|
| Ingen ekte Supabase-backend | All data er mock | Kritisk — Fase 1 |
| Ingen ekte stemmer-database | 3 hardkodede mock-stemmere i Oslo | Kritisk — Fase 1 |
| Ingen ekte booking/betalingsflyt | Kun visuell mockup | Kritisk — Fase 1 |
| DPA ikke signert | Supabase, Stripe, Resend | Kritisk pre-lansering |

---

## Tidligere oppdatering — 21. mars 2026

**Dato:** 21. mars 2026
**Oppdatert av:** Lead Coordinator (agent-revisjon)

### Alle 7 team-agenter fullfort

| Agent | Leveranser | Status |
|---|---|---|
| **Lead Coordinator** | master-plan.md (v1.0, inkl. økonomi- og faglig sammendrag), project-status.md, coordination-log.md, gap-analyse.md (v2.0), risiko-register.md (15 risikoer), beslutningslogg.md (13 beslutninger) | Fullfort |
| **Developer** | teknisk-arkitektur.md (Supabase-arkitektur, databaseskjema, RLS, betalingsinfrastruktur, iOS-hensyn), algoritme-integrasjon.md, api-design.md, frontend-arkitektur.md | Fullfort |
| **Designer** | designsystem.md, brukerflyt.md, ux-research.md, design-critique.md | Fullfort |
| **Marketing** | lanseringsstrategi.md, innholdsstrategi.md, merkevareidentitet.md, malgrupper.md, partnerskap.md, veksttaktikker.md, mikrokopi.md | Fullfort |
| **Economist** | enhetokonomi.md (TAM/SAM/SOM, CAC, LTV, break-even), finansiell-modell.md (18-maneders P&L x 3 scenarier), inntektsmodell.md, prisstrategi.md | Fullfort |
| **Piano-Tuner Expert** | marked-og-fagkunnskap.md, diagnose-validering.md, krav-til-plattformen.md, pianohelse-faglig.md | Fullfort |
| **App-builder** | app/index.html, app/style.css, app/app.js, app/router.js, app/piano-scanner.js, app/piano-keyboard.js, app/health-scorer.js, app/tuning-curve.js, app/sw.js, app/manifest.json, app/stemmer-portal.html, app/icons/icon.svg | Fullfort |

---

## Naværende fase

**FASE 0 — PRE-MVP FULLFORT / FASE 1 KLAR**

Diagnostikkmodulen er ferdig bygget og testet. Alle 7 skjermer fungerer ende til ende. Applikasjonen er fullt funksjonell som PWA i nettleser. Backend (Supabase), ekte bookingflyt og betalingsstrom gjenstaar (Fase 1).

---

## Overordnet fremdrift

| Milepael | Status | Ansvarlig | Fullfort/Frist |
|---|---|---|---|
| Masterplan v1.0 | Fullfort | Lead Coordinator | 20. mars 2026 |
| Kravspesifikasjon v1.0 | Fullfort | Lead Coordinator | 20. mars 2026 |
| Koordinasjonslogg v1.0 | Fullfort | Lead Coordinator | 20. mars 2026 |
| Gap-analyse v2.0 | Fullfort | Lead Coordinator | 20. mars 2026 |
| Risikoregister v1.0 (15 risikoer) | Fullfort | Lead Coordinator | 20. mars 2026 |
| Beslutningslogg v1.0 (13 beslutninger) | Fullfort | Lead Coordinator | 21. mars 2026 |
| Teknisk arkitekturnotat | Fullfort | Developer | 20. mars 2026 |
| UX-konsept og wireframes | Fullfort | Designer | 20. mars 2026 |
| Forretningsmodell-analyse | Fullfort | Economist | 20. mars 2026 |
| Faglig innholdsdokument | Fullfort | Piano Tuner Expert | 20. mars 2026 |
| Go-to-market plan | Fullfort | Marketing | 20. mars 2026 |
| GDPR og juridisk rammeverk | Fullfort (utkast) | Lead Coordinator | 20. mars 2026 |
| Diagnostikkmodul (app/) | Fullfort — alle 7 skjermer fungerer | App-builder | 20. mars 2026 |
| Betatest med ekte piano | Fullfort (lokal, intern) | Hele teamet | 21. mars 2026 |
| Backend — Supabase-oppsett | Ikke startet | Developer | TBD |
| Ekte bookingflyt | Ikke startet | Developer | TBD |
| Stemmer-rekruttering Oslo | Ikke startet | Marketing + Lead | TBD |
| App Store / Google Play | Ikke startet | Developer | TBD |

---

## Kjente bugs fikset

| Bug | Beskrivelse | Fikset |
|---|---|---|
| SW-caching | Service Worker cachet for aggressivt — appen ble ikke oppdatert etter endringer | Ja — cache-busting med versjonsnokkel i sw.js |
| Feil filstier | UltimateDetector-avhengigheter pekte pa feil relative stier fra app/-mappen | Ja — oppdatert til riktige stier mot GuitarTuner-rotkatalog |
| RMS-gate for aggressiv | MIN_RMS-gaten avslo gyldige pianotoner i bass | Ja — MIN_RMS fjernet, replaced med clarity-gate (BES-12) |

---

## Kritiske blokkere per 20. mars 2026

Folgende blokkerer offentlig lansering. Intet er prosjektdodende; alle er adresserbare med ressurser.

| Blokkerer | GAP-ref | Ansvarlig | Haster |
|---|---|---|---|
| Supabase/Resend/Stripe DPA ikke signert | GAP-17 / R-03 | Developer + Lead | Kritisk — uke 1 |
| Ekte bookingflyt ikke implementert | — | Developer | Kritisk |
| Personvernerklæring ikke publisert | GAP-01 | Lead + jurist | Kritisk pre-lansering |
| Cookie-banner ikke implementert | GAP-08 | Developer | Kritisk pre-lansering |
| RoPA ikke opprettet | GAP-16 | Lead | Kritisk pre-lansering |
| Prismodell (fast vs. anbud) ikke besluttet | GAP-11 | Lead | Blokkerer bookingflyt-design |

---

## Naeste steg

1. **Backend-oppsett:** Opprette Supabase-prosjekt i Frankfurt-regionen, kjore `schema.sql`, sette opp RLS-policyer.
2. **DPA-signering:** Sign DPA med Supabase (Settings → Legal), Resend og Stripe (innen uke 1).
3. **Bookingflyt:** Implementer frontend-steg for pianoeier → bookingforespørsel → stemmer-matching.
4. **Stemmer-rekruttering:** Marketing og Lead starter direkte oppsøking av NPTF-stemmere i Oslo (maal: 15–20 stemmere registrert før soft launch).
5. **GDPR-compliance:** Juridisk review av personvernerklæringen og brukervilkaarene (uke 3). Publiser personvernerklæring pa pianohelse.no.
6. **Investordialog:** Send investorpitch til Norse VC, Katapult og Innovasjon Norge (parallelt, ikke sekvensielt).

---

## Risikoovervaakning

| Risiko | Siste vurdering | Trend |
|---|---|---|
| Lav stemmer-tilgang ved lansering (R-01) | Kritisk — rekruttering ikke startet | Uendret |
| Diagnostisk noyaktighet pa mobil (R-02) | Under kontroll — testet pa ekte piano, mobiltest gjenstaar | Bedret |
| GDPR-samsvar for lydopptak (R-03) | Middels — teknisk architektur korrekt, DPA mangler | Under kontroll |
| Disintermediation (R-04) | Kritisk — motmekanismer ikke implementert ennaa | Uendret |
| Seed-finansiering (R-09) | Kritisk — ingen dialog startet | Uendret |

---

## Beslutningslogg — hurtigreferanse

Se `TEAM/LEAD/beslutningslogg.md` for fullstendig logg. Nokkelbesl utninger:

| ID | Beslutning |
|---|---|
| BES-01 | Klient-side lydanalyse — ingen lyd til server |
| BES-02 | Ingen provisjon i MVP |
| BES-03 | Supabase Frankfurt (eu-central-1) |
| BES-04 | Vanilla JS, ingen rammeverk |
| BES-05 | Hash-basert router (iOS PWA) |
| BES-06 | 12 % provisjon ved oppstart (maned 7) |
| BES-07 | Gratis diagnose som freemium-hook |
| BES-08 | UltimateDetector for piano |
| BES-09 | Chart.js for stemmekurve |
| BES-10 | 52 hvite taster som standard |
| BES-11 | Median (ikke mean) for pitch per note |
| BES-12 | MIN_RMS fjernet — clarity-basert gate |
| BES-13 | Mobilmikrofon-advarsel for A0–E1 (noteIndex < 10) |

---

*Neste statusoppdatering: Etter Supabase-oppsett og DPA-signering.*
*Dokumenteier: Lead Coordinator*
