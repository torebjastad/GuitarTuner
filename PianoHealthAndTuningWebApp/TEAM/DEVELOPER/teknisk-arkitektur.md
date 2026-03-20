# Teknisk Arkitektur — PianoHelse

**Versjon:** 1.0
**Dato:** 2026-03-20
**Forfatter:** Lead Developer

---

## 1. Systemoversikt

PianoHelse er en to-sidig markedsplass: pianoeiere bruker en mobiloptimert PWA til å ta opp lyden av pianoet sitt og få en helseanalyse, mens pianostemmer bruker en desktop-nettportal til å se og akseptere oppdrag.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          BRUKERNES ENHETER                              │
│                                                                         │
│  ┌─────────────────────────┐     ┌─────────────────────────────────┐   │
│  │   PIANOEIER (mobil)     │     │   PIANOSTEMMER (desktop)        │   │
│  │                         │     │                                 │   │
│  │  PWA (iOS/Android)      │     │  Web Portal (Chrome/Firefox)    │   │
│  │  ┌───────────────────┐  │     │  ┌───────────────────────────┐  │   │
│  │  │  Mikrofon →       │  │     │  │  Oppdragsfeed (liste)     │  │   │
│  │  │  Web Audio API    │  │     │  │  Diagnostikkoversikt      │  │   │
│  │  │  UltimateDetector │  │     │  │  Jobbstyring              │  │   │
│  │  │  Stemningskurve   │  │     │  │  Kalender                 │  │   │
│  │  │  Helseanalyse     │  │     │  └───────────────────────────┘  │   │
│  │  └───────────────────┘  │     └──────────────┬──────────────────┘   │
│  └──────────────┬──────────┘                    │                       │
│                 │                                │                       │
└─────────────────┼────────────────────────────────┼───────────────────────┘
                  │  HTTPS / REST / WebSocket       │
                  ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            SUPABASE (Backend)                           │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  Auth        │  │  PostgreSQL  │  │  Storage    │  │  Realtime   │ │
│  │  (GoTrue)    │  │  (REST API)  │  │  (S3-komp.) │  │  (WS/SSE)  │ │
│  │  JWT + OAuth │  │  PostgREST   │  │  Lydopptak  │  │  Oppdragsv. │ │
│  └──────────────┘  └──────────────┘  └─────────────┘  └─────────────┘ │
│                                                                         │
│  ┌──────────────┐  ┌──────────────────────────────────────────────────┐ │
│  │  Edge Func.  │  │  Row Level Security (RLS)                        │ │
│  │  (Deno/TS)   │  │  Eiere ser bare egne data                       │ │
│  │  Stripe-hook │  │  Stemmer ser tilgjengelige oppdrag i sin region │ │
│  └──────────────┘  └──────────────────────────────────────────────────┘ │
└──────────────────────────────────────┬──────────────────────────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                   ▼
              ┌──────────┐     ┌─────────────┐    ┌────────────┐
              │  Stripe  │     │  Vipps API  │    │  E-post    │
              │  Connect │     │  (fremtidig)│    │  (Resend)  │
              └──────────┘     └─────────────┘    └────────────┘
```

---

## 2. Frontend-arkitektur

### 2.1 Teknologivalg: Vanilla JS PWA

Prosjektet bygger videre på den eksisterende kodebasen (ingen rammeverk, ingen bundler). Dette er et bevisst og riktig valg for dette produktet:

- **Ingen byggsteg** — Direkte deployment av statiske filer til Supabase Storage eller Vercel CDN.
- **Liten bundelstørrelse** — Kritisk for mobil med dårlig dekning (pianoeiere er ofte hjemme, men kan ha variabel nettforbindelse).
- **Eksisterende kode gjenbrukes direkte** — `pitch-common.js`, `ultimate-detector.js` og lydhåndteringslogikk fra `tuner.js` kan brukes uendret.
- **iOS Safari-kompatibilitet** — Færre rammeverks-abstraksjoner betyr færre ukjente kompatibilitetsproblemer.

### 2.2 To separate frontend-applikasjoner

```
pianohelse-app/           ← Pianoeier-PWA (mobiloptimert)
├── index.html
├── manifest.json
├── sw.js                 ← Service Worker
├── pitch-common.js       ← Kopi fra GuitarTuner (uendret)
├── ultimate-detector.js  ← Kopi fra GuitarTuner (uendret)
├── piano-scanner.js      ← Ny: 88-tasters skanneorkestrering
├── health-scorer.js      ← Ny: Helsealgoritme og scoringsmotor
├── tuning-curve.js       ← Ny: Kurvegenerering og Chart.js-rendering
├── api-client.js         ← Ny: REST-klient mot Supabase
├── auth.js               ← Ny: Autentiseringsflyt
├── state.js              ← Ny: Enkel tilstandsmaskin (vanilla JS)
├── screens/
│   ├── screen-home.js
│   ├── screen-scan.js
│   ├── screen-results.js
│   ├── screen-marketplace.js
│   └── screen-profile.js
├── components/
│   ├── piano-keyboard.js ← Visuell tangentmarkering
│   ├── tuning-needle.js  ← Gjenbruk fra tuner.js
│   ├── health-badge.js
│   └── upload-progress.js
└── style.css

pianohelse-portal/        ← Stemmer-portal (desktopoptimert)
├── index.html
├── manifest.json
├── sw.js
├── api-client.js         ← Delt med app (samme modul)
├── auth.js               ← Delt med app
├── screens/
│   ├── screen-feed.js
│   ├── screen-job-detail.js
│   ├── screen-active-jobs.js
│   └── screen-profile.js
└── style.css
```

### 2.3 PWA-konfigurasjon

**manifest.json (pianoeier-app):**
```json
{
  "name": "PianoHelse",
  "short_name": "PianoHelse",
  "description": "Mål pianohelsa og bestill stemmeoppdrag",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1a1a2e",
  "background_color": "#0f0f1a",
  "lang": "nb",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512",
      "type": "image/png", "purpose": "maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/scan.png", "sizes": "390x844", "type": "image/png",
      "form_factor": "narrow", "label": "Skannevisning" },
    { "src": "/screenshots/results.png", "sizes": "390x844", "type": "image/png",
      "form_factor": "narrow", "label": "Helseresultat" }
  ]
}
```

### 2.4 Service Worker-strategi

```
┌─────────────────────────────────────────────────────────┐
│           RESSURSTYPE → CACHE-STRATEGI                  │
├─────────────────────────────────────────────────────────┤
│  App shell (HTML/CSS/JS)    → Cache First               │
│  Pitch-detection JS-filer   → Cache First               │
│  API-kall (pianoliste etc.) → Network First (fallback)  │
│  Lydopplasting              → Network Only              │
│  Stripe/betalingsendepunkt  → Network Only              │
│  Ikoner og statiske assets  → Stale-While-Revalidate    │
└─────────────────────────────────────────────────────────┘
```

Lydopptak og betalinger skal **aldri** mellomlagres i Service Worker-cache. Offline-modus tillater kun å se tidligere resultater og fullføre en pågående scanning hvis AudioContext er aktiv.

---

## 3. Backend-arkitektur: Supabase

### 3.1 Begrunnelse for Supabase

| Krav | Supabase | Alternativ (custom Node.js) |
|---|---|---|
| Rask oppstart | PostgreSQL + PostgREST klar på minutter | Uker med oppsett |
| GDPR (EØS) | EU-region (Frankfurt) tilgjengelig | Avhenger av deploy-valg |
| Realtime-varsler | Innebygd WebSocket-broadcast | Krever Socket.io eller eget oppsett |
| Fillagring | S3-kompatibel innebygd | Trenger AWS S3 eller tilsvarende |
| Autentisering | GoTrue med Google/Apple OAuth innebygd | Passport.js + mye kode |
| RLS (tilgangskontroll) | PostgreSQL Row Level Security | Manuell middleware |
| Skalering | Automatisk | Manuell infrastruktur |
| Pris (oppstart) | Gratis tier rikelig for MVP | Serverkostnader fra dag 1 |

**Dataregion: Frankfurt (eu-central-1)** — Dette er avgjørende. Supabase tilbyr EU-region som sikrer at alle brukerdata, inkludert lydopptak og personopplysninger, lagres innenfor EØS. Dette er et krav for GDPR-overholdelse uten ytterligere Data Transfer Agreements.

### 3.2 Databaseskjema

```sql
-- ══════════════════════════════════════════════
-- BRUKERE OG PROFILER
-- ══════════════════════════════════════════════

-- Supabase Auth håndterer auth.users automatisk.
-- Vi lager en offentlig profiltabell som speiler den.

CREATE TABLE public.profiles (
    id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    rolle         TEXT NOT NULL CHECK (rolle IN ('eier', 'stemmer')),
    fullt_navn    TEXT NOT NULL,
    telefon       TEXT,
    postnummer    TEXT,
    by            TEXT,
    region        TEXT,                          -- For geografisk matching
    avatar_url    TEXT,
    opprettet_at  TIMESTAMPTZ DEFAULT now(),
    oppdatert_at  TIMESTAMPTZ DEFAULT now()
);

-- Stemmer-spesifikk profil
CREATE TABLE public.stemmer_profiler (
    id                UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    rfk_sertifisert   BOOLEAN DEFAULT false,     -- Riksforbundet for Klaverstemming
    erfaring_aar      INTEGER,
    servicemerknad    TEXT,                       -- "Tilbyr akuttoppdrag" etc.
    rekkevidde_km     INTEGER DEFAULT 50,
    stripe_account_id TEXT,                      -- Stripe Connect konto-ID
    stripe_onboarded  BOOLEAN DEFAULT false,
    aktiv             BOOLEAN DEFAULT true
);

-- ══════════════════════════════════════════════
-- PIANOER
-- ══════════════════════════════════════════════

CREATE TABLE public.pianoer (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eier_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    merke         TEXT,
    modell        TEXT,
    type          TEXT CHECK (type IN ('flygel', 'klaver', 'digitalklaver')),
    aarsgang      INTEGER,
    sist_stemt    DATE,
    notat         TEXT,
    opprettet_at  TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════
-- OPPTAK OG HELSEANALYSER
-- ══════════════════════════════════════════════

CREATE TABLE public.helseanalyser (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    piano_id          UUID NOT NULL REFERENCES public.pianoer(id) ON DELETE CASCADE,
    eier_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Lydopptak (referanse til Supabase Storage)
    lyd_filsti        TEXT,                      -- storage bucket path, kan være NULL
    lyd_varighet_sek  REAL,
    lyd_format        TEXT DEFAULT 'audio/webm', -- MIME-type
    lyd_slettet       BOOLEAN DEFAULT false,     -- GDPR: bruker kan slette opptaket

    -- Analyseresultater (JSON)
    stemningskurve    JSONB,                     -- { "A4": { hz: 441.2, cents: +4.9 }, ... }
    helsescore        REAL,                      -- 0.0–100.0
    helsestatus       TEXT CHECK (helsestatus IN ('god', 'trenger_tilsyn', 'kritisk')),
    analysert_taster  INTEGER,                   -- Antall taster med gyldig avlesning
    gjennomsnitt_avvik REAL,                     -- Gjennomsnittlig absoluttavvik i cent
    maks_avvik        REAL,                      -- Høyeste enkeltavvik

    -- Railsback-analyse
    railsback_avvik   JSONB,                     -- Avvik fra ideell strekningskurve per oktav

    -- Metadata
    opprettet_at      TIMESTAMPTZ DEFAULT now(),
    analyse_versjon   TEXT DEFAULT '1.0'         -- For fremtidig migrasjonskompatibilitet
);

-- ══════════════════════════════════════════════
-- OPPDRAG (JOBBMARKED)
-- ══════════════════════════════════════════════

CREATE TYPE oppdrag_status AS ENUM (
    'apen',         -- Tilgjengelig for stemmer
    'akseptert',    -- Tatt av en stemmer
    'paagaar',      -- Stemmer er på stedet
    'fullfort',     -- Jobb fullført, betaling trigges
    'kansellert'    -- Avlyst av eier eller stemmer
);

CREATE TABLE public.oppdrag (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eier_id           UUID NOT NULL REFERENCES public.profiles(id),
    piano_id          UUID NOT NULL REFERENCES public.pianoer(id),
    analyse_id        UUID REFERENCES public.helseanalyser(id),
    stemmer_id        UUID REFERENCES public.profiles(id),

    -- Sted og logistikk
    adresse           TEXT NOT NULL,
    postnummer        TEXT NOT NULL,
    by                TEXT NOT NULL,
    lat               FLOAT8,                    -- For avstandsberegning
    lon               FLOAT8,

    -- Økonomi
    fast_pris_nok     INTEGER NOT NULL,          -- Pris i øre (NOK)
    plattform_gebyr   INTEGER,                   -- Beregnet ved aksept
    stemmer_utbetaling INTEGER,                  -- fast_pris - plattform_gebyr

    -- Stripe
    stripe_payment_intent_id TEXT,
    stripe_transfer_id       TEXT,

    -- Status
    status            oppdrag_status DEFAULT 'apen',
    akseptert_at      TIMESTAMPTZ,
    fullfort_at       TIMESTAMPTZ,

    -- Innhold
    beskrivelse       TEXT,
    foretrukket_dato  DATE,

    opprettet_at      TIMESTAMPTZ DEFAULT now(),
    oppdatert_at      TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════
-- MELDINGER (ENKEL CHAT)
-- ══════════════════════════════════════════════

CREATE TABLE public.meldinger (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oppdrag_id  UUID NOT NULL REFERENCES public.oppdrag(id) ON DELETE CASCADE,
    sender_id   UUID NOT NULL REFERENCES public.profiles(id),
    innhold     TEXT NOT NULL,
    lest        BOOLEAN DEFAULT false,
    sendt_at    TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════
-- ANMELDELSER
-- ══════════════════════════════════════════════

CREATE TABLE public.anmeldelser (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    oppdrag_id  UUID NOT NULL REFERENCES public.oppdrag(id),
    fra_eier_id UUID NOT NULL REFERENCES public.profiles(id),
    til_stemmer_id UUID NOT NULL REFERENCES public.profiles(id),
    stjerner    INTEGER NOT NULL CHECK (stjerner BETWEEN 1 AND 5),
    kommentar   TEXT,
    opprettet_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════
-- INDEKSER FOR YTELSE
-- ══════════════════════════════════════════════

CREATE INDEX idx_oppdrag_status       ON public.oppdrag(status);
CREATE INDEX idx_oppdrag_postnummer   ON public.oppdrag(postnummer);
CREATE INDEX idx_oppdrag_eier         ON public.oppdrag(eier_id);
CREATE INDEX idx_oppdrag_stemmer      ON public.oppdrag(stemmer_id);
CREATE INDEX idx_helseanalyser_piano  ON public.helseanalyser(piano_id);
CREATE INDEX idx_meldinger_oppdrag    ON public.meldinger(oppdrag_id);

-- Geografisk indeks for avstandssøk (krever PostGIS-utvidelse)
-- CREATE INDEX idx_oppdrag_geo ON public.oppdrag USING GIST(ST_Point(lon, lat));
```

### 3.3 Row Level Security (RLS)

```sql
-- Aktiver RLS på alle tabeller
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pianoer          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helseanalyser    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oppdrag          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meldinger        ENABLE ROW LEVEL SECURITY;

-- Profiles: Alle kan lese offentlig profil, kun eier kan redigere
CREATE POLICY "Profiler er offentlig lesbare"
    ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Eier kan redigere egen profil"
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Pianoer: Kun eier ser og redigerer
CREATE POLICY "Eier ser egne pianoer"
    ON public.pianoer FOR SELECT USING (auth.uid() = eier_id);
CREATE POLICY "Eier kan opprette piano"
    ON public.pianoer FOR INSERT WITH CHECK (auth.uid() = eier_id);

-- Helseanalyser: Eier ser egne; stemmer ser hvis knyttet til åpent oppdrag
CREATE POLICY "Eier ser egne analyser"
    ON public.helseanalyser FOR SELECT USING (auth.uid() = eier_id);
CREATE POLICY "Stemmer ser analyse for relevante oppdrag"
    ON public.helseanalyser FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.oppdrag o
            WHERE o.analyse_id = helseanalyser.id
            AND (o.status = 'apen' OR o.stemmer_id = auth.uid())
        )
    );

-- Oppdrag: Eiere ser egne, stemmer ser åpne oppdrag + sine aksepterte
CREATE POLICY "Eier ser egne oppdrag"
    ON public.oppdrag FOR SELECT USING (auth.uid() = eier_id);
CREATE POLICY "Stemmer ser apne oppdrag"
    ON public.oppdrag FOR SELECT USING (
        status = 'apen' AND
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rolle = 'stemmer')
    );
CREATE POLICY "Stemmer ser aksepterte oppdrag"
    ON public.oppdrag FOR SELECT USING (auth.uid() = stemmer_id);
```

---

## 4. Lydpipeline: Browser til helseanalyse

```
MIKROFON
   │
   │ getUserMedia({
   │   audio: {
   │     echoCancellation: false,
   │     noiseSuppression: false,
   │     autoGainControl: false,
   │     channelCount: 1
   │   }
   │ })
   │
   ▼
AudioContext (sampleRate: helst 48000 Hz, aksepterer 44100)
   │
   ├─── AnalyserNode (fftSize: 8192)
   │       │
   │       │ getFloatTimeDomainData()  ← 8192 samples (~170ms ved 48kHz)
   │       ▼
   │    UltimateDetector.getPitch(buffer, sampleRate)
   │       │
   │       ├── Stage 1: McLeod MPM (FFT-basert autokorrelasjon)
   │       ├── Stage 2: 65536-punkts spektral-FFT
   │       └── Stage 3: Beslutningsmotor
   │       │
   │       └── Returnerer Hz eller -1
   │
   ├─── MediaRecorder
   │       │
   │       │ ondataavailable (timeslice: 250ms)
   │       │ Akkumulerer Blob-chunks
   │       │
   │       └── Ved fullføring: Blob → ArrayBuffer
   │
   ▼
PianoScanner.processNote(noteHz, noteIndex)
   │
   ├── Valider deteksjon (confidence check)
   ├── Lagre til noteResultater[noteIndex]
   ├── Beregn avvik i cent fra idealfrekvens
   └── Oppdater UI (tastaturmarkering, nål)
   │
   ▼ (etter alle taster)
HealthScorer.score(noteResultater)
   │
   ├── Beregn vektet gjennomsnitt
   ├── Railsback-avviksanalyse
   └── Klassifiser: 'god' / 'trenger_tilsyn' / 'kritisk'
   │
   ▼
TuningCurve.generate(noteResultater)
   │
   └── Produserer JSON-payload + Chart.js-datastrukturer
   │
   ▼
API-opplasting (hvis bruker samtykker)
   │
   ├── POST /api/analyser  (JSON-metadata)
   └── PUT /storage/lyd/{analyse_id}  (lydblob, kun hvis samtykke)
```

### 4.1 iOS Safari-spesifikke hensyn

iOS Safari har historisk sett vært den mest restriktive plattformen for Web Audio:

1. **AudioContext-opprettelse krever brukerinteraksjon.** `AudioContext` må opprettes inne i en click/touch-handler. Dette er allerede korrekt håndtert i den eksisterende `tuner.js`.

2. **`getUserMedia`-lyd på iOS.** Fra iOS 11+ støttes `getUserMedia` i Safari. Fra iOS 14.5+ støttes de fleste audio-constraints. Constraints som `sampleRate` ignoreres imidlertid stille — iOS velger alltid 48000 Hz internt. `echoCancellation: false` støttes og er kritisk for pianomålinger.

3. **MediaRecorder på iOS.** Fra iOS 14.5+ støttes `MediaRecorder`. På iOS er `audio/mp4` den eneste pålitelige MIME-typen. Implementasjonen må velge riktig format:
   ```javascript
   const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
       ? 'audio/webm;codecs=opus'   // Android Chrome, desktop
       : 'audio/mp4';               // iOS Safari
   ```

4. **AudioWorklet på iOS.** Støttes fra iOS 14.5+. Dette er det anbefalte mønsteret fremfor den deprecerte `ScriptProcessorNode`. For piano-scanning-brukstilfellet der `AnalyserNode + getFloatTimeDomainData()` fungerer godt, er AudioWorklet et fremtidig optimaliseringspunkt, ikke et krav i MVP.

5. **PWA på iOS.** Fra iOS 16.4+ kan PWA installeres fra Share-menyen i Safari, Chrome og Firefox. `beforeinstallprompt`-eventet støttes **ikke** på iOS — vis en manuell installasjons-guide med en `<aside>`-banner som oppdages via `navigator.standalone`.

---

## 5. Fillagring og GDPR

### 5.1 Lagringsoppsett i Supabase Storage

```
Bucket: pianohelse-opptak  (privat, ikke offentlig)
   └── {eier_id}/
       └── {analyse_id}/
           └── opptak.webm   (eller .mp4 på iOS)
```

Bucket er konfigurert som **privat**. Tilgang kontrolleres via signed URLs med 1 times utløp, generert server-side via Supabase Edge Function. En stemmer som aksepterer et oppdrag, kan generere en signed URL for det tilknyttede opptaket via API — RLS verifiserer at stemmeren faktisk er tilknyttet oppdraget.

### 5.2 GDPR-krav og implementasjonstiltak

Lydopptak av piano er **ikke** biometrisk data per GDPR artikkel 9 (det er ikke data som brukes til å identifisere en person biologisk). Det er likevel personopplysninger fordi det er knyttet til en brukers konto og lokasjon.

| GDPR-krav | Implementasjon |
|---|---|
| **Formålsbegrensning** | Opptak brukes kun til tuning-analyse og deling med akseptert stemmer. Eksplisitt formulert i personvernvilkår. |
| **Dataminimering** | Lydopptak lagres valgfritt — kun JSON-resultatene er påkrevd. UI spør eksplisitt "Vil du lagre lydopptaket for stemmer å lytte til?" |
| **Rett til sletting** | `DELETE /api/analyser/{id}/lyd` setter `lyd_slettet = true` og sletter filen fra Storage. JSON-analysedataene kan beholdes for historikk. |
| **Rett til innsyn** | `GET /api/bruker/mine-data` returnerer alle data, inkludert signed URL for nedlasting av egne opptak. |
| **Dataoppbevaring** | Automatisk sletting av lydopptak etter 180 dager via Supabase scheduled function (eller cron Edge Function). |
| **Samtykke** | Eksplisitt opt-in checkbox ved opplasting. Ikke pre-avkrysset. Lagres som `lyd_samtykke_gitt_at TIMESTAMPTZ`. |
| **Dataportabilitet** | Export-funksjon som pakker ned JSON-analyser + lydopptak som ZIP. |
| **Databehandleravtale** | Supabase tilbyr DPA — signeres som del av onboarding for kommersielt bruk. |
| **Geografisk lagring** | Supabase Frankfurt-region. Ingen data forlater EØS. |

---

## 6. Betalingsinfrastruktur

### 6.1 Stripe Connect for markedsplass

Stripe støtter NOK fullt ut. Plattformen bruker **Stripe Connect med "collect then transfer"-modellen**:

```
BRUKER betaler  →  PLATTFORM  →  STEMMER
 (pianoeier)       (PianoHelse)    (connected account)

  3000 NOK     →   300 NOK (10%)  →  2700 NOK
                   + Stripe-fee
```

**Flyt:**
1. Pianoeier betaler 3000 NOK via Stripe.
2. Betalingen holdes på plattformens Stripe-konto.
3. Når jobb er merket `fullfort`, trigges en Stripe Transfer på 2700 NOK til stemmerens connected account.
4. Stripe sender ut til stemmerens bankkonto (norsk bankkonto via IBAN).

**Stripe Connect-kontotype for stemmer: Express** — Stripe håndterer all KYC/AML-verifisering og onboarding. Stemmer oppretter Stripe Express-konto via redirect, og PianoHelse mottar `stripe_account_id` via webhook.

### 6.2 Vipps-integrasjon (fremtidig fase)

Vipps er den dominerende betalingsmetoden i Norge (>4 millioner brukere). Vipps tilbyr Vipps eCom API og Vipps Login. Stripe støtter p.t. ikke Vipps direkte. To alternativer for fremtidig integrasjon:
- **Nets Easy (tidligere Nets/Dibs)** — norsk betalingsleverandør med innebygd Vipps-støtte og NOK.
- **Vipps MobilePay API direkte** — krever eget partnerskap med Vipps/MobilePay.

MVP bruker Stripe kun med kortbetaling (Visa/Mastercard). Vipps er fase 2.

### 6.3 Stripe-webhook (Supabase Edge Function)

```typescript
// supabase/functions/stripe-webhook/index.ts
Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();

  // Verifier webhook-signatur
  const event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handleBetalingLyktes(event.data.object);
      break;
    case 'transfer.created':
      await handleUtbetalingOpprettet(event.data.object);
      break;
    case 'account.updated':
      await handleStemmmerOnboarding(event.data.object);
      break;
  }
  return new Response(JSON.stringify({ received: true }));
});
```

---

## 7. Sanntidsfunksjoner

Supabase Realtime WebSocket-broadcast brukes for øyeblikkelig varsling til stemmer når et nytt oppdrag er lagt ut i deres region.

```javascript
// Stemmer abonnerer på oppdrag i sin region
const kanal = supabase.channel(`oppdrag:region:${stemmerRegion}`)
    .on('broadcast', { event: 'nytt_oppdrag' }, (payload) => {
        ui.visBanner(`Nytt oppdrag i ${payload.by}: ${payload.pris} NOK`);
        feed.leggTilOppdrag(payload.oppdrag);
    })
    .subscribe();

// Supabase database trigger + Edge Function sender broadcast
// når ny rad settes inn i public.oppdrag med status = 'apen'
```

Database-trigger kaller `realtime.broadcast_changes()` som sender til alle tilkoblede klienter på riktig regional kanal. Dette sikrer at en stemmer i Bergen ikke mottar varsler om oppdrag i Tromsø.

---

## 8. WebAssembly — vurdering og konklusjon

**Anbefaling: Ikke i MVP. Vurder i fase 2 for mobil ytelse.**

`UltimateDetector` kjører en 65536-punkts FFT + McLeod MPM per måling. På desktop er dette ~5–15ms per analyse. På eldre mobiltelefoner kan dette ta 50–200ms.

For piano-scanning er dette akseptabelt fordi:
- Brukeren spiller én tast om gangen, venter på bekreftelse.
- Vi trenger ikke 60fps-analyse — 4–8 analyser per sekund er mer enn nok.
- Analysen kan kjøres i et `AudioWorklet` for å ikke blokkere UI-tråden.

Hvis ytelsesmålinger i fase 2 viser at billige Android-enheter sliter, er løsningen å kompilere FFT-kjernen til WebAssembly via Emscripten (C++ → WASM). MessagePort-mønsteret fra AudioWorklet gjør det enkelt å bytte ut JavaScript-FFT med WASM-FFT uten endringer i resten av systemet.
