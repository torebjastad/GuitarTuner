# PianoHelse — Prosjektstatus
**Versjon:** 1.1
**Dato:** 20. mars 2026
**Oppdatert av:** Lead Coordinator

---

## Siste oppdatering — 20. mars 2026

**Dato:** 20. mars 2026
**Oppdatert av:** Lead Coordinator (agent-revisjon)

### Fullforte agenter (5 av 7)
| Agent | Leveranser | Status |
|---|---|---|
| **Lead Coordinator** | master-plan.md, project-status.md, koordinasjonslogg, gap-analyse.md (v2.0), risiko-register.md, gdpr-og-juridisk.md | Fullfort |
| **Developer** | teknisk-arkitektur.md (komplett med Supabase-arkitektur, databaseskjema, RLS, betalingsinfrastruktur, iOS-hensyn) | Fullfort |
| **Designer** | design-critique.md (konstruktiv gjennomgang av PRD, tilgjengelighetsanalyse, visuell retning, handlingsliste) | Fullfort |
| **Marketing** | lanseringsstrategi.md (supply-first GTM, stemmerliste Oslo, budsjettplan, faseutrulling) | Fullfort |
| **Investor/Pitch** | investorpitch.md (12-slide seed-pitch, TAM/SAM/SOM, finansielle projeksjoner, funding ask kr 3,5M) | Fullfort |

### Under arbeid (3 agenter kjører nå)
| Agent | Forventede leveranser | Status |
|---|---|---|
| **Economist** | forretningsmodell-analyse.md (CAC, LTV, break-even, MVA-analyse, provisjonsvurdering, 3 scenarioer) | Under arbeid |
| **Piano-Tuner Expert** | faglig-terskelverdi.md, stemmer-krav.md, bransjeforhold.md | Under arbeid |
| **App-builder** | Fungerende diagnostikkmodul (HTML/CSS/JS), piano-scanner.js, health-scorer.js, tuning-curve.js | Under arbeid |

### Neste steg
1. **Integrasjon av alle dokumenter:** Når Economist og Piano-Tuner Expert har levert, gjennomfør Lead-synkronisering av alle terskelgrenser og finansielle tall på tvers av dokumenter (løser GAP-12, GAP-20).
2. **App-testing:** App-builder produserer fungerende diagnostikkmodul → Developer integrerer mot backend-skjelett → intern betatest (måluke 10).
3. **GDPR-compliance:** Sign DPA med Supabase, Resend og Stripe (innen uke 1–2). Juridisk review av gdpr-og-juridisk.md (uke 3).
4. **Stemmer-rekruttering:** Marketing og Piano-Tuner Expert starter direkte oppsøking av NPTF og stemmere i Oslo (parallelt med utvikling).
5. **Investordialog:** Lead Coordinator sender investorpitch til Norse VC, Katapult og Innovasjon Norge (uke 1–2).

### Kritiske blokkere per 20. mars 2026
- GAP-12: Cent-terskelgrenser ikke besluttet (blokkerer diagnostikkmodul)
- GAP-11: Prismodell ikke besluttet (blokkerer bookingflyt-design)
- GAP-05: Stemmer-akkrediteringskrav ikke definert (blokkerer stemmer-onboarding)
- Supabase/Resend/Stripe DPA ikke signert (compliance-blokkerer)

---

## Nåværende fase

**FASE 0 — Konseptvalidering og Pre-utvikling**

Prosjektet er i tidlig konseptfase. Teknologigrunnlaget (UltimateDetector i JavaScript) eksisterer og er validert. Teamet er samlet. Dokumentasjonssettet er under utarbeidelse. Ingen kode for PianoHelse-applikasjonen er skrevet ennå.

---

## Overordnet fremdrift

| Milepæl | Status | Ansvarlig | Frist |
|---|---|---|---|
| Masterplan v1.0 | Fullført | Lead Coordinator | 20. mars 2026 |
| Kravspesifikasjon v1.0 | Fullført | Lead Coordinator | 20. mars 2026 |
| Koordinasjonslogg v1.0 | Fullført | Lead Coordinator | 20. mars 2026 |
| Teknisk arkitekturnotat | Ikke startet | Developer | TBD |
| UX-konsept og wireframes | Ikke startet | Designer | TBD |
| Forretningsmodell-analyse | Ikke startet | Economist | TBD |
| Faglig innholdsdokument | Ikke startet | Piano Tuner Expert | TBD |
| Go-to-market plan | Ikke startet | Marketing | TBD |
| UltimateDetector web-integrasjon | Ikke startet | Developer | TBD |
| Betatest med ekte pianoeiere | Ikke startet | Hele teamet | TBD |

---

## Åpne spørsmål per teammedlem

### Developer

1. **Teknisk stack-valg:** Skal vi bruke vanilla JS (som GuitarTuner-basen) eller introdusere et rammeverk som React/Vue for frontend? Fordel med vanilla: ingen build-steg, direkte gjenbruk av UltimateDetector. Ulempe: mer manuell state management for et multi-side-produkt.

2. **Backend-valg:** Node.js + Express, Python/FastAPI, eller en BaaS som Supabase/Firebase? Vurder GDPR-plassering (servere i EØS/Norge er sterkt foretrukket).

3. **Lydanalyse på mobil:** Har du testet UltimateDetector på iOS Safari og Android Chrome? Hva er minste bufferstørrelse som gir reliable pitch-deteksjon for pianotoner (særlig i bassregisteret A0–C2)?

4. **Klient-side vs. server-side analyse:** Masterplanen forutsetter at ALL lydanalyse skjer i nettleseren (ingen lyd sendes til server). Kan vi bekrefte at dette er teknisk gjennomførbart for hele pianoregisteret (A0 = 27,5 Hz til C8 = 4186 Hz)?

5. **API-design:** Hvilke endepunkter er nødvendige for MVP? Forslag: `POST /api/reports` (lagre anonymisert rapport), `POST /api/booking-requests`, `GET /api/tuners?location=&radius=`, `POST /api/tuner-profiles`.

6. **Sikkerhet:** Autentisering i MVP — holder det med e-postverifisering, eller trenger vi BankID/Vipps-innlogging for troverdighetens skyld?

### Designer

1. **Merkevareidentitet:** Vi har foreslått: Varm sort + ivory + suksessgrønn, navn "PianoHelse". Trenger vi en grundig merkevaregjennomgang (logo, typografi, ikonspråk) før MVP?

2. **Diagnostikk-UX:** Hvordan presenter vi stemmekurven på en forståelig måte for ikke-musikere? En fargekode (grønn/gul/rød per note) er intuitivt — men hva er den beste visuelle metaforen for "cent-avvik"?

3. **Onboarding-flyt:** Hvor mange steg bør det være fra "Åpne PianoHelse.no" til "Se diagnostikkresultat"? Hypotese: maks 3 steg (Gi mikrofontilgang → Spill tastene → Se rapport). Kan Designer validere dette med enkel brukertesting?

4. **Responsivt design:** Pianoer stilles gjerne med mobil liggende foran tastene. Mobilfokus er kritisk. Hva er beste praksis for å guide brukeren til riktig avstand fra piano?

5. **Norsk språklig tone:** Designer bør verifisere at "du"-form er konsistent gjennomgående og at teksten er testet på ekte norske brukere for klarhet og vennlighet.

6. **Tilgjengelighet (WCAG):** Hva er minstekravene vi setter oss? Minimum AA for offentlig nettjeneste.

### Piano Tuner Expert

1. **Yrkesorganisering:** Finnes det en norsk pianostemmer-forening eller fagorganisasjon? Hvem er de riktige kontaktene for partnerskap og tidlig stemmer-rekruttering?

2. **Faglig terskelverdi for helsekarakter:** Hva er aksepterte grenser i bransjen for "i stemmning", "trenger stell" og "kritisk"? Kan vi forankre disse i PTG- (Piano Technicians Guild) standarder eller tilsvarende?
   - Forslag: Bra: < ±10 cent gjennomsnitt, Trenger stell: 10–30 cent, Kritisk: > 30 cent
   - Er dette faglig forsvarlig?

3. **Opptrekk (pitch raise):** Diagnostikken bør kunne identifisere om pianoet trenger opptrekk (prisen er høyere). Hvilken avviksgrad fra A440 tilsier opptrekk?

4. **Stemmer-profil-krav:** Hva bør vi kreve av stemmere for å bli godkjent på plattformen? Minimumsdokumentasjon: Org.nummer? PTG-sertifikat? Referanser? Forsikring?

5. **Sesongvariasjon:** Er det spesielle sesonger i Norge der behovet for stemming er høyest? (Hypotese: høst etter sommerferie og januar etter jul pga. luftfuktighetsskift)

6. **Diagnostikkbegrensning:** Hva kan diagnostikken IKKE avdekke? (Regulering, hammerfilter, pedaler, lydstyrke-ubalanse) — dette bør kommuniseres tydelig til pianoeiere så vi ikke overselger.

### Economist

1. **Provisjonsnivå:** Masterplanen foreslår 10–15 % provisjon. Er dette akseptabelt for norske pianostemmere? Sammenlign med Mittanbud (ca. 8–15 % avhengig av kategori) og Thumbtack (20 % lead-fee). Hva tåler markedet?

2. **Prissensitivitet:** Vil pianoeiere betale for diagnostikktjenesten (f.eks. Kr 99 for full rapport med historikk), eller er gratis diagnostikk nødvendig for adopsjon?

3. **CAC og LTV:** Hva er estimert Customer Acquisition Cost (CAC) for pianoeiere og for stemmere i norsk digital markedsføring? Og hva er LTV over 5 år (2 stemminger/år × Kr 2 850 × 12 % provisjon × 5 år = Kr 3 420 per pianoeier)?

4. **Break-even-analyse:** Når er plattformen lønnsom? Modeller minimum 3 scenarier: optimistisk, realistisk, pessimistisk.

5. **Vipps-integrasjon:** Hva er transaksjonskostnadene for Vipps eCom vs. Stripe for norske kunder? Vipps er forventet av norske forbrukere.

6. **Investorcase:** Hva er realistisk verdsettelse ved seed-runde? Sammenlignbare selskaper (PropTech service marketplaces) i Norge/Norden?

### Marketing

1. **Go-to-market sekvens:** Skal vi lansere diagnostikken som en frittstående gratisapp FØRST for å bygge interesse, og deretter aktivere bookingmarkedsplassen? Eller lanserer vi begge deler samtidig?

2. **SEO-mulighet:** Nøkkelord som "pianostemming Oslo", "pianostemmer pris", "piano ut av stemmning" har sannsynligvis lav konkurranse i Norge. Hva er søkevolumet?

3. **Samarbeidspartnere:** Hvem er de naturlige distribusjonspartnerne?
   - Musikkorps og korps-organisasjoner
   - Kulturskolen (900+ kulturskoler i Norge)
   - Steinway Gallery Oslo, Yamaha-forhandlere
   - NMF (Norsk Musikkforlag) og lignende

4. **PR-vinkel:** Hva er den journalistiske vinkelen? Forslag: "For første gang kan du sjekke om pianoet ditt er i stemmning — gratis og på 5 minutter."

5. **Referral-mekanikk:** Stemmere som er fornøyde med plattformen er de beste ambassadørene. Hva er en god referral-incentiv for dem?

6. **Sosiale medier:** Hvilke kanaler er relevante? (Facebook-grupper for pianoeiere, Instagram for det estetiske aspektet, LinkedIn for institusjonelle kunder)

---

## Beslutningslogg

| ID | Dato | Beslutning | Begrunnelse | Tatt av |
|---|---|---|---|---|
| D-001 | 20.03.2026 | All lydanalyse skjer klient-side | Personvern (GDPR), ytelse, ingen serverbelastning | Lead Coordinator |
| D-002 | 20.03.2026 | MVP bruker ingen provisjon — gratis for begge sider | Løser chicken-and-egg, prioriterer adopsjon over inntjening | Lead Coordinator |
| D-003 | 20.03.2026 | Norsk er primærspråk; engelsk kun for interndokumenter | Målgruppen er norsk; norsk SEO er verdifullt | Lead Coordinator |
| D-004 | 20.03.2026 | Uformelt "du" gjennomgående i brukergrensesnittet | Norsk digital konvensjon, gjennomgående i Vipps, DNB, Finn.no | Lead Coordinator |
| D-005 | 20.03.2026 | Oslo som første geografi for lansering | Høyest tetthet av både pianoeiere og stemmere | Lead Coordinator |
| D-006 | 20.03.2026 | Mobiltelefon (nettleser) er primær plattform for diagnostikk | Pianoer har ikke PC-er ved siden av seg; mobil-first er naturlig | Lead Coordinator |

---

## Åpne beslutninger (som trenger input fra teamet)

| ID | Spørsmål | Ansvarlig for innspill | Frist |
|---|---|---|---|
| O-001 | Teknisk stack — React vs. Vanilla JS | Developer | TBD |
| O-002 | Backend-plattform og serverplassering (Norge/EØS) | Developer | TBD |
| O-003 | Terskelverdi for helsekarakterer (cent-grenser) | Piano Tuner Expert | TBD |
| O-004 | Provisjonsnivå og stemmer-prissensitivitet | Economist | TBD |
| O-005 | MVP: Gratis diagnose vs. freemium | Economist + Marketing | TBD |
| O-006 | Krav til stemmer-akkreditering på plattformen | Piano Tuner Expert | TBD |

---

## Risikoovervåking

| Risiko | Siste vurdering | Trend |
|---|---|---|
| Lav stemmer-tilgang ved lansering | Høy — aktivt tiltak nødvendig | Uendret |
| Diagnostisk nøyaktighet på mobil | Ukjent — krever testing | Ny |
| GDPR-samsvar for lydopptak | Middels — teknisk løsning klar | Under kontroll |
| Konkurranse fra Mittanbud | Lav på kort sikt | Uendret |
| Markedsvolum for lavt | Middels — validering trengs | Uendret |

---

*Neste statusoppdatering: Etter at alle teammedlemmer har levert sine første bidrag.*
