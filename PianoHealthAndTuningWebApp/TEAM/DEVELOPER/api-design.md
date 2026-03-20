# API-design — PianoHelse

**Versjon:** 1.0
**Dato:** 2026-03-20
**Forfatter:** Lead Developer

---

## 1. Overordnet API-filosofi

PianoHelse bruker Supabase som backend. Dette betyr at de fleste operasjoner skjer via:

1. **PostgREST REST API** (auto-generert fra PostgreSQL schema) — for standard CRUD
2. **Supabase Edge Functions (Deno/TypeScript)** — for forretningslogikk som krever server-side kjøring (betalinger, webhooks, komplekse operasjoner)
3. **Supabase Realtime WebSocket** — for sanntidsvarsler til stemmer

Base-URL-er:
```
REST API:      https://{project-id}.supabase.co/rest/v1/
Auth:          https://{project-id}.supabase.co/auth/v1/
Storage:       https://{project-id}.supabase.co/storage/v1/
Edge Func:     https://{project-id}.supabase.co/functions/v1/
Realtime:      wss://{project-id}.supabase.co/realtime/v1/
```

Alle klienter bruker `api-client.js` som en tynn wrapper rundt Supabase JS-klienten (`@supabase/supabase-js`), lastet via CDN som en ES-modul.

---

## 2. Autentisering

### 2.1 Strategi

**JWT-basert autentisering via Supabase Auth (GoTrue).** Alle API-kall inkluderer `Authorization: Bearer {access_token}` i headeren. Supabase JS-klienten håndterer tokenfornyelse automatisk via refresh tokens.

### 2.2 Støttede innloggingsmetoder

| Metode | Bruksmål | Prioritet |
|---|---|---|
| Google OAuth | Pianoeiere (mobil) | Høy — dominant SSO i Norge |
| Apple Sign-In | Pianoeiere (iOS) | Høy — krav for iOS App Store |
| E-post + passord | Stemmer (desktop) | Høy — for profesjonelle som foretrekker det |
| Magic Link (e-post) | Fallback | Medium |

**Begrunnelse for Google/Apple (ikke norsk BankID i MVP):** BankID-integrasjon koster ~50 000 NOK/år i lisens + teknisk integrasjon. For MVP er Google OAuth tilstrekkelig. BankID kan legges til i fase 2 for stemmerverifisering (der identitetssikkerhet er kritisk).

### 2.3 Autentiseringsflyt (vanilla JS)

```javascript
// auth.js

const supabase = window._supabaseClient;  // Globalt initialisert i app.js

const Auth = {
    /**
     * Logg inn med Google OAuth.
     * Redirecter til Google, deretter tilbake til redirectUrl.
     */
    async loggInnMedGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/auth/callback',
                queryParams: { prompt: 'select_account' }
            }
        });
        if (error) throw error;
    },

    /**
     * Logg inn med Apple Sign-In (iOS/macOS Safari).
     */
    async loggInnMedApple() {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: { redirectTo: window.location.origin + '/auth/callback' }
        });
        if (error) throw error;
    },

    /**
     * Logg inn med e-post og passord.
     */
    async loggInnMedEpost(epost, passord) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: epost, password: passord });
        if (error) throw error;
        return data.user;
    },

    /**
     * Hent gjeldende økt. Returnerer null hvis ikke innlogget.
     */
    async hentOkt() {
        const { data } = await supabase.auth.getSession();
        return data.session;
    },

    /**
     * Håndter OAuth callback (kalles på /auth/callback siden).
     */
    async haandterCallback() {
        const { data, error } = await supabase.auth.exchangeCodeForSession(
            new URLSearchParams(window.location.search).get('code')
        );
        if (error) throw error;
        return data.user;
    },

    async loggUt() {
        await supabase.auth.signOut();
    }
};
```

### 2.4 Sesjonshåndtering

Supabase oppdaterer automatisk access token (utløper etter 1 time) via refresh token (utløper etter 7 dager). Applikasjonen lytter på `supabase.auth.onAuthStateChange` for å reagere på tokenfornyelse og øktutløp.

---

## 3. REST API-endepunkter

Alle endepunkter under bruker PostgREST-konvensjoner. `prefer: return=representation` header returnerer det oppdaterte objektet.

### 3.1 Profil

```
GET    /rest/v1/profiles?id=eq.{uuid}
       → 200 { id, rolle, fullt_navn, postnummer, by, avatar_url }
       → RLS: Alle kan lese offentlig profil

PATCH  /rest/v1/profiles?id=eq.{uuid}
       Body: { fullt_navn?, telefon?, postnummer?, by?, region? }
       → 200 { ...oppdatert profil }
       → RLS: Kun autentisert bruker kan redigere sin egen profil

GET    /rest/v1/stemmer_profiler?id=eq.{uuid}
       → 200 { rfk_sertifisert, erfaring_aar, rekkevidde_km, stripe_onboarded }
       → Offentlig lesbar

PATCH  /rest/v1/stemmer_profiler?id=eq.{uuid}
       Body: { rekkevidde_km?, servicemerknad?, aktiv? }
       → 200 { ...oppdatert profil }
```

### 3.2 Pianoer

```
GET    /rest/v1/pianoer?eier_id=eq.{uuid}&order=opprettet_at.desc
       → 200 [{ id, merke, modell, type, aarsgang, sist_stemt }, ...]
       → RLS: Kun eier ser sine pianoer

POST   /rest/v1/pianoer
       Body: { merke, modell, type, aarsgang, notat }
       → 201 { id, ...alle felter }
       Header: Prefer: return=representation

PATCH  /rest/v1/pianoer?id=eq.{uuid}
       Body: { sist_stemt?, notat? }
       → 200 { ...oppdatert piano }

DELETE /rest/v1/pianoer?id=eq.{uuid}
       → 204 No Content
       → Kaskaderer til helseanalyser (ON DELETE CASCADE)
```

### 3.3 Helseanalyser

```
GET    /rest/v1/helseanalyser
       ?piano_id=eq.{uuid}
       &order=opprettet_at.desc
       &select=id,helsescore,helsestatus,analysert_taster,gjennomsnitt_avvik,opprettet_at
       → 200 [{ ...metadata uten stemningskurve JSON }]
       → Bruk dette for listvisning (ingen tung JSON)

GET    /rest/v1/helseanalyser?id=eq.{uuid}&select=*
       → 200 { id, stemningskurve, railsback_avvik, ...alle felter }
       → Fullstendig analyse inkl. stemningskurve JSON

POST   /rest/v1/helseanalyser
       Body: {
           piano_id,
           stemningskurve,      ← JSON { "A4": { hz, cents, klarhet }, ... }
           helsescore,
           helsestatus,
           analysert_taster,
           gjennomsnitt_avvik,
           maks_avvik,
           railsback_avvik,     ← JSON { "C4–B4": { gjennomsnittCents, avvikFraRailsback }, ... }
           lyd_format           ← "audio/webm" eller "audio/mp4"
       }
       → 201 { id, ...alle felter }

PATCH  /rest/v1/helseanalyser?id=eq.{uuid}
       Body: { lyd_filsti? }    ← Oppdater etter vellykket Storage-opplasting
       → 200 { ...oppdatert }

DELETE /rest/v1/helseanalyser/{id}/lyd   ← Edge Function
       → Sletter lydfilen fra Storage + setter lyd_slettet=true
       → 200 { slettet: true }
       → GDPR: Brukeren kan slette lyden uten å miste JSON-resultatene
```

### 3.4 Oppdrag

```
GET    /rest/v1/oppdrag
       ?status=eq.apen
       &postnummer=ilike.{søk}*     ← Enkel tekst-matching på postnummer/region
       &order=opprettet_at.desc
       &select=id,adresse,by,fast_pris_nok,piano_id,analyse_id,opprettet_at,
               pianoer(merke,modell),helseanalyser(helsestatus,helsescore)
       → 200 [{ ...oppdrag med innebygd piano og analyse metadata }]
       → RLS: Stemmer ser kun åpne oppdrag + egne aksepterte

GET    /rest/v1/oppdrag?id=eq.{uuid}&select=*,...
       → 200 Fullstendig oppdrag inkl. relatert info

POST   /rest/v1/oppdrag
       Body: { piano_id, analyse_id, adresse, postnummer, by, lat, lon,
               fast_pris_nok, beskrivelse, foretrukket_dato }
       → 201 { id, ...alle felter }
       → Trigger: Database-funksjon beregner plattform_gebyr (10%)

PATCH  /rest/v1/oppdrag?id=eq.{uuid}
       Body: { beskrivelse?, foretrukket_dato? }
       → Kun eier kan redigere sine egne åpne oppdrag

DELETE /rest/v1/oppdrag?id=eq.{uuid}&status=eq.apen
       → 204 (kun kansellering av åpne oppdrag direkte via REST)
```

### 3.5 Meldinger

```
GET    /rest/v1/meldinger
       ?oppdrag_id=eq.{uuid}
       &order=sendt_at.asc
       → 200 [{ id, sender_id, innhold, lest, sendt_at,
                profiles!sender_id(fullt_navn, avatar_url) }]

POST   /rest/v1/meldinger
       Body: { oppdrag_id, innhold }
       → 201 { id, ...alle felter }

PATCH  /rest/v1/meldinger?oppdrag_id=eq.{uuid}&mottaker_id=eq.{min_uid}
       Body: { lest: true }
       → 200 — Marker alle meldinger i et oppdrag som lest
```

---

## 4. Edge Functions (Forretningslogikk)

Edge Functions er Deno TypeScript-funksjoner som kjøres server-side. De brukes der PostgREST ikke strekker til.

### 4.1 POST /functions/v1/aksepter-oppdrag

Håndterer stemmerens aksept av et oppdrag. Atomisk operasjon: oppdaterer oppdragsstatus OG oppretter Stripe PaymentIntent i én transaksjon.

```typescript
// Input
{ oppdrag_id: string }

// Logikk:
// 1. Verifiser at caller er stemmer (JWT-rolle)
// 2. Verifiser oppdrag er 'apen'
// 3. Hent stemmerens stripe_account_id
// 4. Opprett Stripe PaymentIntent (amount=fast_pris, currency='nok')
// 5. Oppdater oppdrag: status='akseptert', stemmer_id=caller, stripe_payment_intent_id
// 6. Send Realtime broadcast til eier (varsling)
// 7. Trigger e-postvarsling til eier (via Resend)

// Output
{ client_secret: string }  ← Stripe PaymentIntent client_secret til frontend for kortbetaling
```

### 4.2 POST /functions/v1/fullfør-oppdrag

Kalles av stemmer når jobben er utført. Trigges etter at bruker har bekreftet.

```typescript
// Input
{ oppdrag_id: string }

// Logikk:
// 1. Verifiser stemmer_id matcher caller
// 2. Verifiser status='akseptert' eller 'paagaar'
// 3. Bekraft Stripe PaymentIntent (capture)
// 4. Opprett Stripe Transfer til stemmerens connected account
// 5. Oppdater oppdrag: status='fullfort', fullfort_at=now(), stripe_transfer_id
// 6. Beregn og lagre stemmer_utbetaling
// 7. Send e-post med kvittering til begge parter

// Output
{ success: true, utbetalt_nok: number }
```

### 4.3 GET /functions/v1/signed-lyd-url

Genererer en tidsbegrenset signed URL for nedlasting av lydopptak.

```typescript
// Input (query params)
?analyse_id=string

// Logikk:
// 1. Verifiser at caller har tilgang (eier ELLER stemmer tilknyttet oppdrag)
// 2. Generer Supabase Storage signed URL (utløper etter 3600 sek)

// Output
{ url: string, expires_at: string }
```

### 4.4 DELETE /functions/v1/slett-lydopptak

GDPR-krav: brukeren kan slette lyden sin.

```typescript
// Input
{ analyse_id: string }

// Logikk:
// 1. Verifiser eier_id = caller
// 2. Slett fil fra Supabase Storage
// 3. Oppdater helseanalyser: lyd_slettet=true, lyd_filsti=null

// Output
{ slettet: true }
```

### 4.5 POST /functions/v1/stripe-onboard-stemmer

Starter Stripe Connect Express-onboarding for en ny stemmer.

```typescript
// Input: ingen (bruker auth context)

// Logikk:
// 1. Opprett Stripe Connect Express account (country='NO', currency='nok')
// 2. Lagre stripe_account_id i stemmer_profiler
// 3. Generer Stripe AccountLink (onboarding URL)

// Output
{ onboarding_url: string }  ← Redirect bruker hit
```

### 4.6 POST /functions/v1/stripe-webhook

Mottaker for Stripe-webhooks (betalingshendelser).

```
Lytter på:
- payment_intent.succeeded     → Marker betaling som gjennomført
- payment_intent.payment_failed → Send varsel til eier, sett oppdrag tilbake til 'akseptert'
- transfer.created             → Bekreft utbetaling til stemmer
- account.updated              → Oppdater stripe_onboarded-flagg
```

---

## 5. Fillagring (Supabase Storage)

```
Bucket: pianohelse-opptak  (privat)

Opplasting av lydopptak:
  PUT /storage/v1/object/pianohelse-opptak/{eier_id}/{analyse_id}/opptak.{ext}
  Header: Authorization: Bearer {access_token}
  Header: Content-Type: audio/webm  (eller audio/mp4)
  Body: <raw audio bytes>
  → 200 { Key: "..." }

  Maks filstørrelse: 50 MB (en 10-minutters piano-skanning er typisk 5–15 MB)
  Tillatelse: Kun autentisert eier kan laste opp til sin egen sti ({eier_id}/*)
```

Storage RLS-policy:
```sql
-- Eier kan laste opp til sin egen mappe
CREATE POLICY "Eier kan laste opp egne opptak"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pianohelse-opptak' AND
            (storage.foldername(name))[1] = auth.uid()::text);

-- Eier kan slette egne filer
CREATE POLICY "Eier kan slette egne opptak"
ON storage.objects FOR DELETE
USING (bucket_id = 'pianohelse-opptak' AND
       (storage.foldername(name))[1] = auth.uid()::text);

-- Tilgang til nedlasting kun via Edge Function (signed URL)
-- Ingen direkte SELECT policy — alt går via /functions/v1/signed-lyd-url
```

---

## 6. Sanntid WebSocket (Realtime)

### 6.1 Oppdragsvarsel til stemmer

```javascript
// Stemmer abonnerer ved innlogging
function abonnerOppdragsVarsler(stemmerRegion, onNyttOppdrag) {
    const kanal = supabase.channel(`oppdrag:${stemmerRegion}`)
        .on('broadcast', { event: 'nytt_oppdrag' }, ({ payload }) => {
            onNyttOppdrag(payload);
        })
        .subscribe();
    return kanal;  // Lagre for cleanup
}

// Payload-format for 'nytt_oppdrag':
{
    oppdrag_id:    "uuid",
    by:            "Bergen",
    postnummer:    "5020",
    helsestatus:   "kritisk",
    pris_nok:      3500,
    piano_merke:   "Steinway",
    avstand_km:    12.4  // Beregnet basert på stemmerens registrerte posisjon
}
```

### 6.2 Database trigger for broadcast

```sql
-- Funksjon som sendes ved nytt åpent oppdrag
CREATE OR REPLACE FUNCTION notify_new_oppdrag()
RETURNS TRIGGER AS $$
DECLARE
    v_region TEXT;
    v_payload JSONB;
BEGIN
    IF NEW.status = 'apen' THEN
        -- Beregn region fra postnummer (forenklet mapping)
        v_region := substring(NEW.postnummer FROM 1 FOR 2);  -- F.eks. "50" for Bergen

        v_payload := jsonb_build_object(
            'oppdrag_id',   NEW.id,
            'by',           NEW.by,
            'postnummer',   NEW.postnummer,
            'pris_nok',     NEW.fast_pris_nok / 100,
            'opprettet_at', NEW.opprettet_at
        );

        PERFORM realtime.broadcast_changes(
            'oppdrag:' || v_region,
            'nytt_oppdrag',
            v_payload
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_notify_new_oppdrag
AFTER INSERT ON public.oppdrag
FOR EACH ROW EXECUTE FUNCTION notify_new_oppdrag();
```

### 6.3 Meldingsvarsler (real-time chat)

```javascript
// Begge parter (eier og stemmer) i et oppdrag abonnerer på Postgres Changes
supabase.channel(`meldinger:${oppdragId}`)
    .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'meldinger',
          filter: `oppdrag_id=eq.${oppdragId}` },
        (payload) => {
            if (payload.new.sender_id !== minUid) {
                chat.leggTilMelding(payload.new);
            }
        }
    )
    .subscribe();
```

---

## 7. Hastighetsbegrensning (Rate Limiting)

Supabase gir noe innebygd begrensning, men kritiske endepunkter trenger ekstra beskyttelse.

### 7.1 Supabase innebygde grenser

| Ressurs | Gratis tier | Pro tier |
|---|---|---|
| Database requests | 500 req/sek | Custom |
| Storage opplastinger | 50 MB/fil | 5 GB/fil |
| Auth requests | 3/sek per IP | Higher |
| Edge Function invocations | 500 000/mnd | Custom |

### 7.2 Edge Function-nivå rate limiting

For Edge Functions som er dyre eller misbruksutsatte:

```typescript
// Enkel Redis-basert rate limiting via Upstash (gratis tier)
// Alternativt: Supabase innebygd Postgres-basert counter

async function sjekkRateLimit(bruker_id: string, handling: string, max: number, vindusMinutter: number) {
    const nøkkel = `rl:${handling}:${bruker_id}`;
    const antall = await redis.incr(nøkkel);
    if (antall === 1) await redis.expire(nøkkel, vindusMinutter * 60);
    if (antall > max) {
        throw new Response('For mange forespørsler', { status: 429 });
    }
}

// Bruk:
await sjekkRateLimit(bruker_id, 'opprett_oppdrag', 10, 60);   // Maks 10 oppdrag per time
await sjekkRateLimit(bruker_id, 'last_opp_lyd',    5,  60);   // Maks 5 lydopplastinger per time
await sjekkRateLimit(bruker_id, 'aksepter_oppdrag', 20, 60);  // Maks 20 aksepter per time
```

### 7.3 Endepunkter og begrensninger

| Endepunkt | Maks per time per bruker | Begrunnelse |
|---|---|---|
| POST /helseanalyser | 20 | Unngå spam av analyser |
| PUT /storage/lyd | 5 | Lydopplasting er dyr operasjon |
| POST /aksepter-oppdrag | 20 | Forhindre automatisk aksept-botting |
| POST /meldinger | 60 | Rimelig chatfrekvens |
| GET /oppdrag (feed) | 120 | Åpen feed, men beskytt mot scraping |

---

## 8. Feilhåndtering og HTTP-statuskoder

| Statuskode | Brukstilfelle |
|---|---|
| 200 OK | Vellykket GET/PATCH |
| 201 Created | Vellykket POST |
| 204 No Content | Vellykket DELETE |
| 400 Bad Request | Ugyldig input-data |
| 401 Unauthorized | Manglende eller ugyldig JWT |
| 403 Forbidden | Gyldig JWT men utilstrekkelig tilgang (RLS) |
| 404 Not Found | Ressurs eksisterer ikke |
| 409 Conflict | Ressurs allerede eksisterer (f.eks. duplikat oppdrag) |
| 422 Unprocessable Entity | Validering feilet |
| 429 Too Many Requests | Rate limit nådd |
| 500 Internal Server Error | Uventet serverfeil |

Alle feirsvar fra Edge Functions følger dette formatet:
```json
{
    "feil": "LESBAR_FEILKODE",
    "melding": "Menneskelig lesbar feilmelding på norsk"
}
```

Eksempel:
```json
{
    "feil": "OPPDRAG_ALLEREDE_AKSEPTERT",
    "melding": "Dette oppdraget har allerede blitt akseptert av en annen stemmer."
}
```

---

## 9. API-klient (vanilla JS)

```javascript
// api-client.js
// Enkel wrapper rundt Supabase JS-klient

const ApiKlient = {
    // ── Profil ──
    async hentProfil(uid) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', uid)
            .single();
        if (error) throw error;
        return data;
    },

    // ── Helseanalyse ──
    async opprettAnalyse(payload) {
        const { data, error } = await supabase
            .from('helseanalyser')
            .insert(payload)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async lastOppLyd(analyseId, eier_id, blob, mimeType) {
        const sti    = `${eier_id}/${analyseId}/opptak.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`;
        const { error } = await supabase.storage
            .from('pianohelse-opptak')
            .upload(sti, blob, { contentType: mimeType, upsert: false });
        if (error) throw error;
        // Oppdater analyse med filsti
        await supabase.from('helseanalyser').update({ lyd_filsti: sti }).eq('id', analyseId);
        return sti;
    },

    // ── Oppdrag ──
    async hentAapneOppdrag(region) {
        const { data, error } = await supabase
            .from('oppdrag')
            .select(`id, adresse, by, fast_pris_nok, helsestatus,
                     opprettet_at,
                     pianoer(merke, modell),
                     helseanalyser(helsestatus, helsescore)`)
            .eq('status', 'apen')
            .ilike('postnummer', `${region}%`)
            .order('opprettet_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async aksepterOppdrag(oppdragId) {
        const { data, error } = await supabase.functions.invoke('aksepter-oppdrag', {
            body: { oppdrag_id: oppdragId }
        });
        if (error) throw error;
        return data;  // { client_secret }
    },

    // ── Edge Functions ──
    async hentSignertLydUrl(analyseId) {
        const { data, error } = await supabase.functions.invoke('signed-lyd-url', {
            body: { analyse_id: analyseId }
        });
        if (error) throw error;
        return data.url;
    }
};
```

---

## 10. Versjonering

API-versjonen er foreløpig implisitt (v1). For fremtidige bruddendringer:

- PostgREST-baserte endepunkter har ikke innebygd versjonering — bruddendringer håndteres via schema-migrasjoner med bakoverkompatibilitet (legg til kolonner, aldri slett/gi nytt navn uten migrasjonsperiode).
- Edge Functions kan prefikses: `/functions/v1/` og `/functions/v2/` ved behov.
- En `api_versjon` felt i tabeller (som `helseanalyser.analyse_versjon`) muliggjør fremtidige parsing-endringer uten å bryte gamle klienter.
