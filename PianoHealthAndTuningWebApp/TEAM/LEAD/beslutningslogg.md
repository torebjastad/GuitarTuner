# PianoHelse — Beslutningslogg
**Versjon:** 1.0
**Dato:** 21. mars 2026
**Forfatter:** Lead Coordinator
**Status:** Levende dokument — oppdateres ved nye vesentlige beslutninger

---

## Formål

Denne loggen dokumenterer alle vesentlige prosjektbeslutninger med begrunnelse og konsekvenser. Formålet er sporbarhet — fremtidige teammedlemmer og investorer skal forstå *hvorfor* ting er som de er, ikke bare *hva* som ble valgt.

**Konvensjon:** Beslutninger nummereres BES-XX fortlopende. Ingen beslutning slettes — dersom en beslutning reverseres, loggfores reverseringen som en ny beslutning med referanse til den opprinnelige.

---

## BES-01: Klient-side lydanalyse — ingen lyd til server

**Dato:** 20. mars 2026
**Beslutning:** All lydanalyse skjer utelukkende i nettleseren via UltimateDetector (JavaScript). Ingen lyddata overføres til server, hverken som raaopptak, FFT-spekter eller mellomresultater.
**Alternativer vurdert:**
- Server-side analyse (Python/librosa) — ville gitt mer fleksibel prosessering og enklere debugging
- Hybrid: klient-side for rask respons, server-side for arkivering
**Begrunnelse:** GDPR krever eksplisitt samtykke for lydopptak i hjemmet. Klient-side eliminerer kategorien "lydbehandling av personopplysninger" fra RoPA og reduserer juridisk risiko dramatisk. Ytelsen er dessuten bedre (ingen nettverksforsinkelse).
**Konsekvenser:** Arkitekturprinsipp som ALDRI skal brytes i fremtidige versjoner. Dokumentert i gdpr-og-juridisk.md og teknisk-arkitektur.md.

---

## BES-02: Ingen provisjon i MVP — gratis for begge sider

**Dato:** 20. mars 2026
**Beslutning:** PianoHelse tar ingen provisjon i MVP-fasen (maned 1–6). Diagnostikk er gratis. Stemmerprofiler er gratis i 12 maneder.
**Alternativer vurdert:**
- 5 % provisjon fra dag 1 for a teste betalingsvillighet
- Freemium: gratis for pianoeiere, betalt for stemmere
**Begrunnelse:** Loser chicken-and-egg-problemet. Med kun 66 stemmere i Norge er tilbudssidens adopsjon kritisk. Gratis profil i 12 maneder er det sterkeste incentivene for en enkeltpersonforetak som er vant til a ta egne kunder direkte.
**Konsekvenser:** Ingen inntekter i MVP-fasen. Kapitalbehov kr 530 000 (base case). Provisjon aktiveres maned 7 ved 12 %, økes til 15 % maned 13.

---

## BES-03: Supabase Frankfurt (eu-central-1) som backend

**Dato:** 20. mars 2026
**Beslutning:** Supabase velges som BaaS (Backend as a Service) med Frankfurt-region (eu-central-1, AWS) som obligatorisk datalagring.
**Alternativer vurdert:**
- Firebase (Google) — god dokumentasjon, men US-region standard, GDPR-komplisert
- Railway / Render med egendriftet PostgreSQL — mer kontroll, mye mer vedlikeholdskostnad
- Supabase US-region — avvist pga. GDPR-krav om EØS-lagring
**Begrunnelse:** Supabase gir PostgreSQL, Auth, Storage og Edge Functions i ett produkt med EØS-datalagring. Free tier er tilstrekkelig gjennom hele Fase 1 og 2 (estimert 56 MB etter 12 maneder, godt under 500 MB-grensen). DPA er enkelt a signere via Supabase-dashboardet.
**Konsekvenser:** All Supabase-konfigurasjon MÅ bruke eu-central-1. Logg må verifisere region ved oppsett. DPA signeres via Settings → Legal i Supabase-dashboardet.

---

## BES-04: Vanilla JS — ingen rammeverk, ingen bundler

**Dato:** 20. mars 2026
**Beslutning:** Applikasjonen bygges i ren HTML/CSS/JavaScript uten rammeverk (ingen React, Vue, Angular, Svelte), uten bundler (ingen Webpack, Vite, Rollup) og uten pakkehåndterer (ingen npm, yarn).
**Alternativer vurdert:**
- React + Vite — bedre component-modell, men introduserer byggsteg og npm-avhengigheter
- Svelte — lite bundle-size, men ukjent for de fleste JS-utviklere som joiner prosjektet
- Vue 3 CDN — rammeverk uten byggsteg, men fortsatt ekstra abstraksjonslag
**Begrunnelse:** UltimateDetector er vanilla JS. GuitarTuner-codebasen er vanilla JS. Et byggsteg og npm introduserer vedlikeholdsgjeld, dependency-konflikter og kompleksitet som ikke er nodvendig for et produkt av denne storrelsen. Alle filer er lesbare uten tooling.
**Konsekvenser:** Ingen automatisk tree-shaking. State management er manuell. Nye moduler legges til som `<script>`-tagger i HTML-hodet i avhengighetsrekkefolge.

---

## BES-05: Hash-basert router (iOS PWA-kompatibilitet)

**Dato:** 20. mars 2026
**Beslutning:** SPA-routing implementeres via URL-hash (`#/diagnose`, `#/resultater`, `#/booking`) fremfor `history.pushState`.
**Alternativer vurdert:**
- `history.pushState` / HTML5 History API — renere URLer, men krever server-side fallback
- Server-side rendering med separate HTML-sider — enklere, men mister SPA-opplevelsen
**Begrunnelse:** iOS PWA (lagt til pa hjemmeskjermen) har kjente bugs med `history.pushState` som medforer at navigasjon bryter og viser blank side. Hash-basert routing fungerer reliabelt pa alle iOS-versjoner. Siden vi primært retter oss mot mobilbrukere med piano ved siden av seg, er iOS-kompatibilitet ikke valgfritt.
**Konsekvenser:** URLer er pa formen `pianohelse.no/#/diagnose`. SEO pavirkes marginalt (Google indekserer hash-ruter). Alle interne lenker MÅ bruke `#/`-format.

---

## BES-06: 12 % provisjon ved oppstart

**Dato:** 20. mars 2026
**Beslutning:** Provisjonssats ved aktivering (maned 7) settes til 12 % av oppdragsverdi, med planlagt økning til 15 % fra maned 13.
**Alternativer vurdert:**
- 10 % — lavere motstand fra stemmere, men 67 transaksjoner/maned for break-even (vs. 47)
- 15 % fra start — raskere break-even (36 transaksjoner/maned), men okonomisk risiko for stemmere i oppstartsfasen
- 18 % — for aggressivt ved oppstart, disintermediation-risiko øker markant
**Begrunnelse:** 12 % gir kr 277 netto per transaksjon etter Stripe-gebyrer (2,0 % + kr 1,80 + Connect 0,25 % + kr 0,10). Break-even pa 47 bookinger/maned tilsvarer 6 stemmere med 8 oppdrag/maned — oppnaelig tidlig i Fase 2. Sammenlignbart med Mittanbud (8–15 %) og godt under Thumbtack (20 % lead-fee).
**Konsekvenser:** Netto per transaksjon: kr 277 (12 %) → kr 363 (15 % fra maned 13). EBITDA-positivt ved maned 13. Akkumulert kapitalbehov base case: kr 530 000.

---

## BES-07: Gratis diagnose som freemium-hook

**Dato:** 20. mars 2026
**Beslutning:** Diagnostikktjenesten er og forblir gratis for pianoeiere. Det er ikke en freemium-funksjon med betalt oppgradert rapport.
**Alternativer vurdert:**
- Kr 99 for full rapport med historikk, gratis for enkel score
- Gratis første diagnose, deretter abonnement for historikk og paminnelser
**Begrunnelse:** Konverteringsfunnel er: gratis diagnose → overraskelse over pianoets tilstand → booking. Enhver betalingsfriksjon i diagnostikksteget reduserer toppen av trakten og skader booking-volumet pa tilbuds- og ettersporselssiden. Diagnostikken er varet vi gir bort for a selge bookinger — analogt med gratis vin-testing pa en vinbutikk.
**Konsekvenser:** Diagnostikk-siden er alltid apen uten innlogging. Premium-funksjoner (historikk, paminnelser) kan introduseres fra Fase 2 som opt-in, men aldri som betalingsport for selve skanningen.

---

## BES-08: UltimateDetector for piano (ikke YIN eller McLeod isolert)

**Dato:** 20. mars 2026
**Beslutning:** PianoScanner bruker `UltimateDetector` som eneste pitchdetektor. YIN, McLeod, Autocorrelation, HPS og MUSIC brukes ikke isolert for pianodiagnostikk.
**Alternativer vurdert:**
- YIN — god ytelse i midtregister, men smalere frekvensomraade
- McLeod MPM — rask, men isolert ikke optimal for diskantregisteret C6–C8
- HPS — frekvensdomenemetode, men darligere pa bass
**Begrunnelse:** UltimateDetector er en hybrid (McLeod MPM + frekvensvektet spektraltopp + beslutningsmotor) som dekker hele pianoregisteret A0–C8. Det er den eneste detektoren i codebasen som er validert for piano i fokuserte tester (Python-ekvivalent). Inharmonisitets-robusthet med stigende toleranse (`tol = baseTolerance + 0.005 * n`) er direkte relevant for piano.
**Konsekvenser:** UltimateDetector importeres fra GuitarTuner-prosjektet (`../../ultimate-detector.js` og avhengigheter). Versjonskontroll av detektoren MÅ koordineres mellom GuitarTuner og PianoHelse.

---

## BES-09: Chart.js for stemmekurve

**Dato:** 20. mars 2026
**Beslutning:** Stemmekurven visualiseres med Chart.js (CDN-versjon) fremfor custom Canvas-kode eller andre diagrambiblioteker.
**Alternativer vurdert:**
- Custom Canvas-kode — full kontroll, ingen avhengighet, men mye arbeid for aksjer, labels, tooltip
- D3.js — kraftig, men stor bundle og bratt laringskurve for et enkelt linjediagram
- Plotly.js — for tung (3+ MB)
**Begrunnelse:** Chart.js er lett (~60 KB gzipped), vel dokumentert, og gir ferdig støtte for linjediagram med Railsback-referanselinje og per-note fargemerking. CDN-lastet, saa ingen byggsteg.
**Konsekvenser:** Chart.js er eneste tredjeparts bibliotek i klientkoden. Versjon MÅ pins i `<script>`-taggen for a unngå breaking changes ved CDN-oppdatering.

---

## BES-10: 52 hvite taster som standard (ikke alle 88)

**Dato:** 20. mars 2026
**Beslutning:** PianoScanner skanner de 52 hvite tastene (A0–C8 hvite, det vil si hele oktavrekken exklusive svarte taster) som standard, ikke alle 88 taster inkludert svarte.
**Alternativer vurdert:**
- Alle 88 taster — mer komplett diagnose, men dobbelt sa lang skannetid (8–10 minutter)
- Bare oktavene A1–A5 (40 taster) — raskere, men mister bass og diskant
- Brukervalg: 52 eller 88 — mer fleksibelt, men okter kompleksiteten
**Begrunnelse:** Stemmernes faglige tommelfingerregel er at de hvite tastene avslorer stemtilstanden for hele pianoet — svarte taster stemmes konsekvent relativt til sine hvite naber. 52 taster gir en diagnostikktid pa ca. 5 minutter, under drop-off-terskelen pa 8 minutter. Full 88-tasters skanning er en Fase 2-funksjon.
**Konsekvenser:** `piano-scanner.js` er konfigurert med `ANTALL_TASTER = 52`. Helsescoren baseres pa de 52 hvite tastene. Stemmekurven viser 52 datapunkter.

---

## BES-11: Median (ikke mean) for pitch-beregning per note

**Dato:** 20. mars 2026
**Beslutning:** For hver note beregner PianoScanner medianen av godkjente pitchmaalinger (ikke gjennomsnittet) for a bestemme cent-avvik.
**Alternativer vurdert:**
- Mean (gjennomsnitt) — matematisk enklere, men sensitiv for outliers
- Trimmed mean (beskjaer 10 % i hver ende) — kompromiss, men mer kode
- Modus (hyppigst forekommende verdi) — ikke egnet for kontinuerlige frekvensdata
**Begrunnelse:** Pianotoner har transienter (anslag), overtoner og bakgrunnsstoy som kan gi enkeltmaalinger langt utenfor reell tonehøyde. Medianen er robust mot outliers uten a kreve parametertuning av trim-faktoren. Tilsvarer UltimateDetectors interne smoothing-filosofi.
**Konsekvenser:** `health-scorer.js` bruker `medianFrekvens` per note. Ved fa maalinger (< 3) flagges noten som usikker og ekskluderes fra helsescoren.

---

## BES-12: MIN_RMS fjernet — klarhet-basert gate

**Dato:** 21. mars 2026
**Beslutning:** Den opprinnelige `MIN_RMS`-gaten i PianoScanner er fjernet. Stillhetsdeteksjon styres utelukkende av UltimateDetectors interne klarhet-gate (clarity < 0,4 → returnerer -1).
**Alternativer vurdert:**
- Beholde MIN_RMS = 0.002 (GuitarTuner-standard) — enkel, men for aggressiv for pianotoner
- Tilpasningsbar MIN_RMS per register (bass lavere, diskant høyere) — mer noyaktig, men kompleks
**Begrunnelse:** UltimateDetector er designet uten RMS-gate — den bruker klarhet (signal-til-harmonisk-ratio) som primær kvalitetsindikator. MIN_RMS-gaten avviste gyldige pianotoner i bassregisteret (A0–C2) der RMS er naturlig lavere. Fjerning av MIN_RMS matcher detektorens interne design og oyker recall i bass uten a pavirke precision negativt.
**Konsekvenser:** PianoScanner stoler fullt pa UltimateDetectors clarity-retur. `piano-scanner.js` har ingen RMS-sjekk. Mobilmikrofon-advarsel for noteIndex < 10 kompenserer for redusert noyaktighet i sub-bass.

---

## BES-13: Mobilmikrofon-advarsel for A0–E1 (noteIndex < 10)

**Dato:** 21. mars 2026
**Beslutning:** Appen viser en eksplisitt advarsel for toner med noteIndex < 10 (tilsvarer A0 til E1, under ca. 41 Hz): "Lav note — mikrofonen pa denne telefonen kan ha begrenset noyaktighet her. Spill forte."
**Alternativer vurdert:**
- Ekskludere sub-bass-notene helt fra diagnostikken
- Vise advarsel for alle toner under 80 Hz (noteIndex < 21)
- Ingen advarsel — la brukeren oppdage problemet selv
**Begrunnelse:** Mobilmikrofoner har typisk rolloff under 80 Hz, med kritisk degradering under 41 Hz. Avsla noter helt fra diagnostikken reduserer nytteverdien for brukere med Steinway-flygel eller andre pianoer der bassbeskrivelse er viktig. Advarsel gir brukeren handlingsrom (forte-anslag) og setter riktige forventninger uten a ekskludere dataene.
**Konsekvenser:** `piano-scanner.js` sjekker `noteIndex < 10` og legger til visuell advarsel pa klaviaturvisningen. Klarhet-terskelen for godkjenning er lavere for disse notene (0,35 mot standard 0,40).

---

*Dokumenteier: Lead Coordinator*
*Neste revisjon: Etter beslutning om prismodell (fast vs. anbud, GAP-11) og valg av MVA-struktur (GAP-09).*
