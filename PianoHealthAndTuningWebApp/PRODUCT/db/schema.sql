-- ============================================================
-- PianoHelse — PostgreSQL / Supabase Databaseskjema
-- Versjon: 1.0
-- Dato: 2026-03-20
-- Beskrivelse: Fullstendig skjema for piano-helse og stemmer-markedsplass
-- ============================================================

-- Aktiver nødvendige utvidelser
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- For fremtidig geosøk

-- ============================================================
-- ENUM-typer
-- ============================================================

CREATE TYPE brukerrolle AS ENUM ('eier', 'stemmer', 'admin');

CREATE TYPE pianotype AS ENUM (
    'flygelformet',   -- Grand piano
    'stuepiano',      -- Upright piano
    'digitalt',       -- Digital piano (ikke stemmbart)
    'ukjent'
);

CREATE TYPE helsestatus AS ENUM (
    'god',              -- Score >= 70, ingen kritiske noter
    'trenger_tilsyn',   -- Score 45–70, noen problematiske noter
    'kritisk',          -- Score < 45 eller mange kritiske noter
    'utilstrekkelig_data'  -- For få noter detektert
);

CREATE TYPE oppdragstatus AS ENUM (
    'apen',         -- Ingen stemmer har akseptert
    'akseptert',    -- Stemmer har akseptert, betaling ikke gjennomført
    'paagaar',      -- Stemmer er på vei eller på jobb
    'fullfort',     -- Jobb ferdig, betaling overfort
    'kansellert',   -- Kansellert av eier eller tatt av markedet
    'avvist'        -- Stemmer avviste jobben etter aksept
);

-- ============================================================
-- TABELLER
-- ============================================================

-- ── 1. Brukerproffiler ──────────────────────────────────────
-- Utvidelse av Supabase auth.users (1-til-1 relasjon)

CREATE TABLE public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    rolle           brukerrolle NOT NULL DEFAULT 'eier',
    fullt_navn      TEXT NOT NULL,
    telefon         TEXT,
    postnummer      TEXT,
    by              TEXT,
    region          TEXT,                   -- Forkortelse for region (f.eks. "oslo", "bergen")
    avatar_url      TEXT,
    opprettet_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    oppdatert_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    slettet_at      TIMESTAMPTZ             -- Soft delete (GDPR: brukeren ber om sletting)
);

COMMENT ON TABLE public.profiles IS
    'Utvidede brukerdata for alle PianoHelse-brukere (pianoeiere og stemmere). Kobler til auth.users.';

-- ── 2. Stemmer-spesifikk profil ─────────────────────────────

CREATE TABLE public.stemmer_profiler (
    id                  UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    nptf_sertifisert    BOOLEAN NOT NULL DEFAULT FALSE,
    nptf_nummer         TEXT,                       -- NPTF-autorisasjonsnummer
    erfaring_aar        SMALLINT,                   -- År med erfaring
    rekkevidde_km       SMALLINT NOT NULL DEFAULT 25,  -- Hvor langt de kjører
    servicemerknad      TEXT,                       -- F.eks. "Spesialist på Steinway"
    stripe_account_id   TEXT,                       -- Stripe Connect Express-konto
    stripe_onboarded    BOOLEAN NOT NULL DEFAULT FALSE,
    aktiv               BOOLEAN NOT NULL DEFAULT TRUE,  -- Kan ta oppdrag
    snitt_vurdering     NUMERIC(3,2),               -- 1.00 – 5.00
    antall_oppdrag      INTEGER NOT NULL DEFAULT 0,
    opprettet_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.stemmer_profiler IS
    'Pianostemmer-spesifikke data: sertifisering, rekkevidde, betalingskonto.';

-- ── 3. Pianoer ───────────────────────────────────────────────

CREATE TABLE public.pianoer (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    eier_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type            pianotype NOT NULL DEFAULT 'ukjent',
    merke           TEXT,                           -- F.eks. "Steinway", "Yamaha"
    modell          TEXT,                           -- F.eks. "Model B", "U1"
    aarsgang        SMALLINT,                       -- Produksjonsår
    sist_stemt      DATE,                           -- Dato for siste stemming
    notat           TEXT,                           -- Eierens egne notater
    opprettet_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    oppdatert_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.pianoer IS
    'Piano-instanser tilknyttet en pianoeier. En eier kan ha flere pianoer.';

-- ── 4. Helseanalyser ────────────────────────────────────────

CREATE TABLE public.helseanalyser (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    piano_id            UUID NOT NULL REFERENCES public.pianoer(id) ON DELETE CASCADE,
    eier_id             UUID NOT NULL REFERENCES public.profiles(id),  -- Redundant for RLS

    -- Scoringdata
    helsescore          NUMERIC(5,1),               -- 0.0 – 100.0
    helsestatus         helsestatus NOT NULL DEFAULT 'utilstrekkelig_data',
    analysert_taster    SMALLINT NOT NULL DEFAULT 0,  -- Antall taster bekreftet
    gjennomsnitt_avvik  NUMERIC(6,2),               -- Gjennomsnittlig cent-avvik (vektet)
    maks_avvik          NUMERIC(6,2),               -- Høyeste enkelt-avvik
    antall_kritiske     SMALLINT NOT NULL DEFAULT 0,  -- Taster med > 20 cent avvik
    antall_advarsel     SMALLINT NOT NULL DEFAULT 0,  -- Taster med 10–20 cent avvik

    -- Stemningskurve (JSON)
    stemningskurve      JSONB,
    -- Format: { "A4": { "noteIndex": 57, "midi": 69, "hz": 440.2, "ideell": 440.0, "cents": 0.8, "klarhet": 0.95 }, ... }

    railsback_avvik     JSONB,
    -- Format: { "C4-B4": { "gjennomsnittCents": 2.3, "avvikFraRailsback": -1.2 }, ... }

    -- Lydopptak (valgfritt, med GDPR-kontroll)
    lyd_filsti          TEXT,                       -- Supabase Storage-sti
    lyd_format          TEXT,                       -- "audio/webm" eller "audio/mp4"
    lyd_slettet         BOOLEAN NOT NULL DEFAULT FALSE,  -- GDPR: slettet av bruker

    opprettet_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.helseanalyser IS
    'Resultat av én piano-skanning. Inneholder stemningskurve, helsescore og (valgfritt) lydopptak.';

CREATE INDEX idx_helseanalyser_piano_id ON public.helseanalyser(piano_id);
CREATE INDEX idx_helseanalyser_eier_id  ON public.helseanalyser(eier_id);
CREATE INDEX idx_helseanalyser_opprettet ON public.helseanalyser(opprettet_at DESC);

-- ── 5. Oppdrag (Markedsplass-jobber) ───────────────────────

CREATE TABLE public.oppdrag (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    piano_id                UUID NOT NULL REFERENCES public.pianoer(id),
    eier_id                 UUID NOT NULL REFERENCES public.profiles(id),
    stemmer_id              UUID REFERENCES public.profiles(id),
    analyse_id              UUID REFERENCES public.helseanalyser(id),

    -- Lokasjon
    adresse                 TEXT NOT NULL,
    postnummer              TEXT NOT NULL,
    by                      TEXT NOT NULL,
    lat                     NUMERIC(9,6),            -- Breddegradskoordinat
    lon                     NUMERIC(9,6),            -- Lengdegradskoordinat

    -- Prising
    fast_pris_nok           INTEGER NOT NULL,        -- Pris i øre (f.eks. 285300 = kr 2853)
    plattform_gebyr         INTEGER NOT NULL DEFAULT 0,  -- 10% i øre, beregnet av trigger
    stemmer_utbetaling      INTEGER,                 -- fast_pris - plattform_gebyr (i øre)

    -- Status og timing
    status                  oppdragstatus NOT NULL DEFAULT 'apen',
    beskrivelse             TEXT,                    -- Tilleggsinformasjon fra eier
    foretrukket_dato        DATE,

    -- Betalingssporing
    stripe_payment_intent_id TEXT,
    stripe_transfer_id      TEXT,

    -- Tidsstempler
    opprettet_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    akseptert_at            TIMESTAMPTZ,
    fullfort_at             TIMESTAMPTZ,
    kansellert_at           TIMESTAMPTZ
);

COMMENT ON TABLE public.oppdrag IS
    'Stemme-oppdrag opprettet av pianoeier. Kobler eier, piano, analyse og stemmer.';

CREATE INDEX idx_oppdrag_status        ON public.oppdrag(status);
CREATE INDEX idx_oppdrag_postnummer    ON public.oppdrag(postnummer);
CREATE INDEX idx_oppdrag_eier_id       ON public.oppdrag(eier_id);
CREATE INDEX idx_oppdrag_stemmer_id    ON public.oppdrag(stemmer_id);
CREATE INDEX idx_oppdrag_opprettet     ON public.oppdrag(opprettet_at DESC);

-- ── 6. Vurderinger ─────────────────────────────────────────

CREATE TABLE public.vurderinger (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oppdrag_id      UUID NOT NULL UNIQUE REFERENCES public.oppdrag(id),
    fra_eier_id     UUID NOT NULL REFERENCES public.profiles(id),
    til_stemmer_id  UUID NOT NULL REFERENCES public.profiles(id),
    stjerner        SMALLINT NOT NULL CHECK (stjerner BETWEEN 1 AND 5),
    kommentar       TEXT,
    opprettet_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.vurderinger IS
    'Eierens vurdering av stemmer etter fullfort oppdrag.';

-- ── 7. Meldinger (Innebygd chat per oppdrag) ───────────────

CREATE TABLE public.meldinger (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    oppdrag_id      UUID NOT NULL REFERENCES public.oppdrag(id) ON DELETE CASCADE,
    sender_id       UUID NOT NULL REFERENCES public.profiles(id),
    mottaker_id     UUID NOT NULL REFERENCES public.profiles(id),
    innhold         TEXT NOT NULL,
    lest            BOOLEAN NOT NULL DEFAULT FALSE,
    sendt_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.meldinger IS
    'Meldinger mellom eier og stemmer tilknyttet et oppdrag.';

CREATE INDEX idx_meldinger_oppdrag_id ON public.meldinger(oppdrag_id);
CREATE INDEX idx_meldinger_ulest ON public.meldinger(mottaker_id) WHERE lest = FALSE;

-- ── 8. Varsler ──────────────────────────────────────────────

CREATE TABLE public.varsler (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bruker_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,      -- F.eks. 'nytt_oppdrag', 'oppdrag_akseptert', 'stemming_paaminnet'
    tittel          TEXT NOT NULL,
    melding         TEXT NOT NULL,
    lenke           TEXT,               -- Intern app-lenke
    lest            BOOLEAN NOT NULL DEFAULT FALSE,
    opprettet_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_varsler_bruker_ulest ON public.varsler(bruker_id) WHERE lest = FALSE;

-- ============================================================
-- DATABASE-FUNKSJONER OG TRIGGERE
-- ============================================================

-- ── Automatisk oppdater oppdatert_at ───────────────────────

CREATE OR REPLACE FUNCTION set_oppdatert_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.oppdatert_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_oppdatert_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION set_oppdatert_at();

CREATE TRIGGER trg_pianoer_oppdatert_at
    BEFORE UPDATE ON public.pianoer
    FOR EACH ROW EXECUTE FUNCTION set_oppdatert_at();

-- ── Beregn plattformgebyr automatisk ───────────────────────

CREATE OR REPLACE FUNCTION beregn_plattform_gebyr()
RETURNS TRIGGER AS $$
BEGIN
    -- 10% plattformgebyr, rundet ned til nærmeste øre
    NEW.plattform_gebyr    := FLOOR(NEW.fast_pris_nok * 0.10);
    NEW.stemmer_utbetaling := NEW.fast_pris_nok - NEW.plattform_gebyr;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_oppdrag_gebyr
    BEFORE INSERT OR UPDATE OF fast_pris_nok ON public.oppdrag
    FOR EACH ROW EXECUTE FUNCTION beregn_plattform_gebyr();

-- ── Oppdater stemmer-statistikk ved fullfort oppdrag ───────

CREATE OR REPLACE FUNCTION oppdater_stemmer_statistikk()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'fullfort' AND OLD.status != 'fullfort' THEN
        UPDATE public.stemmer_profiler
        SET antall_oppdrag = antall_oppdrag + 1
        WHERE id = NEW.stemmer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_oppdrag_stemmer_statistikk
    AFTER UPDATE OF status ON public.oppdrag
    FOR EACH ROW EXECUTE FUNCTION oppdater_stemmer_statistikk();

-- ── Oppdater stemmer-vurdering ved ny rating ───────────────

CREATE OR REPLACE FUNCTION oppdater_stemmer_vurdering()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.stemmer_profiler
    SET snitt_vurdering = (
        SELECT AVG(stjerner::NUMERIC)
        FROM public.vurderinger
        WHERE til_stemmer_id = NEW.til_stemmer_id
    )
    WHERE id = NEW.til_stemmer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vurdering_oppdater_snitt
    AFTER INSERT OR UPDATE ON public.vurderinger
    FOR EACH ROW EXECUTE FUNCTION oppdater_stemmer_vurdering();

-- ── Realtime-broadcast ved nytt åpent oppdrag ──────────────

CREATE OR REPLACE FUNCTION notify_new_oppdrag()
RETURNS TRIGGER AS $$
DECLARE
    v_region TEXT;
    v_payload JSONB;
BEGIN
    IF NEW.status = 'apen' THEN
        v_region := LOWER(NEW.by);  -- Bruk by som kanalidentifikator
        v_payload := jsonb_build_object(
            'oppdrag_id',    NEW.id,
            'by',            NEW.by,
            'postnummer',    NEW.postnummer,
            'pris_nok',      NEW.fast_pris_nok / 100,
            'opprettet_at',  NEW.opprettet_at
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

CREATE TRIGGER trg_notify_new_oppdrag
    AFTER INSERT ON public.oppdrag
    FOR EACH ROW EXECUTE FUNCTION notify_new_oppdrag();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLITIKKER
-- ============================================================

-- Aktiver RLS på alle tabeller
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stemmer_profiler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pianoer          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helseanalyser    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oppdrag          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vurderinger      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meldinger        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.varsler          ENABLE ROW LEVEL SECURITY;

-- ── Profiler: Offentlig les, egen skriv ────────────────────

CREATE POLICY "Alle kan lese profiler"
    ON public.profiles FOR SELECT USING (slettet_at IS NULL);

CREATE POLICY "Kun eier kan oppdatere sin profil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ── Stemmer-profiler: Offentlig les, stemmer skriver sin ───

CREATE POLICY "Alle kan lese stemmer-profiler"
    ON public.stemmer_profiler FOR SELECT USING (TRUE);

CREATE POLICY "Stemmer kan oppdatere sin profil"
    ON public.stemmer_profiler FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Stemmer kan inserere sin profil"
    ON public.stemmer_profiler FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ── Pianoer: Kun eier kan se og endre ─────────────────────

CREATE POLICY "Eier kan lese sine pianoer"
    ON public.pianoer FOR SELECT USING (auth.uid() = eier_id);

CREATE POLICY "Eier kan lage pianoer"
    ON public.pianoer FOR INSERT WITH CHECK (auth.uid() = eier_id);

CREATE POLICY "Eier kan oppdatere sine pianoer"
    ON public.pianoer FOR UPDATE USING (auth.uid() = eier_id);

CREATE POLICY "Eier kan slette sine pianoer"
    ON public.pianoer FOR DELETE USING (auth.uid() = eier_id);

-- ── Helseanalyser: Eier leser sine, stemmer med tilknyttet oppdrag leser ──

CREATE POLICY "Eier kan lese sine analyser"
    ON public.helseanalyser FOR SELECT
    USING (auth.uid() = eier_id);

CREATE POLICY "Stemmer kan lese analyse tilknyttet sitt oppdrag"
    ON public.helseanalyser FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.oppdrag o
            WHERE o.analyse_id = helseanalyser.id
              AND o.stemmer_id = auth.uid()
        )
    );

CREATE POLICY "Eier kan lagre analyser"
    ON public.helseanalyser FOR INSERT
    WITH CHECK (auth.uid() = eier_id);

CREATE POLICY "Eier kan oppdatere sine analyser (lyd-sletting)"
    ON public.helseanalyser FOR UPDATE
    USING (auth.uid() = eier_id);

-- ── Oppdrag: Eier ser sine, stemmere ser åpne + sine ──────

CREATE POLICY "Eier kan se sine oppdrag"
    ON public.oppdrag FOR SELECT
    USING (auth.uid() = eier_id);

CREATE POLICY "Stemmere kan se åpne oppdrag"
    ON public.oppdrag FOR SELECT
    USING (
        status = 'apen' AND
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() AND p.rolle = 'stemmer'
        )
    );

CREATE POLICY "Stemmere kan se sine aksepterte oppdrag"
    ON public.oppdrag FOR SELECT
    USING (auth.uid() = stemmer_id);

CREATE POLICY "Eier kan lage oppdrag"
    ON public.oppdrag FOR INSERT
    WITH CHECK (auth.uid() = eier_id);

CREATE POLICY "Eier kan oppdatere sine åpne oppdrag"
    ON public.oppdrag FOR UPDATE
    USING (auth.uid() = eier_id AND status = 'apen');

-- ── Meldinger: Kun parter i oppdraget ─────────────────────

CREATE POLICY "Parter kan lese meldinger"
    ON public.meldinger FOR SELECT
    USING (
        auth.uid() = sender_id OR auth.uid() = mottaker_id
    );

CREATE POLICY "Parter kan sende meldinger"
    ON public.meldinger FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.oppdrag o
            WHERE o.id = oppdrag_id
              AND (o.eier_id = auth.uid() OR o.stemmer_id = auth.uid())
        )
    );

CREATE POLICY "Mottaker kan markere som lest"
    ON public.meldinger FOR UPDATE
    USING (auth.uid() = mottaker_id);

-- ── Vurderinger: Offentlig les, eier skriver ──────────────

CREATE POLICY "Alle kan lese vurderinger"
    ON public.vurderinger FOR SELECT USING (TRUE);

CREATE POLICY "Eier kan gi vurdering for fullfort oppdrag"
    ON public.vurderinger FOR INSERT
    WITH CHECK (
        auth.uid() = fra_eier_id AND
        EXISTS (
            SELECT 1 FROM public.oppdrag o
            WHERE o.id = oppdrag_id
              AND o.status = 'fullfort'
              AND o.eier_id = auth.uid()
        )
    );

-- ── Varsler: Kun eier ──────────────────────────────────────

CREATE POLICY "Bruker kan se sine varsler"
    ON public.varsler FOR SELECT USING (auth.uid() = bruker_id);

CREATE POLICY "Bruker kan markere varsler som lest"
    ON public.varsler FOR UPDATE USING (auth.uid() = bruker_id);

-- ============================================================
-- SUPABASE STORAGE POLITIKKER
-- ============================================================

-- Kjøres separat i Supabase Storage-innstillinger:

-- CREATE POLICY "Eier kan laste opp egne opptak"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--     bucket_id = 'pianohelse-opptak' AND
--     (storage.foldername(name))[1] = auth.uid()::text
-- );

-- CREATE POLICY "Eier kan slette egne opptak"
-- ON storage.objects FOR DELETE
-- USING (
--     bucket_id = 'pianohelse-opptak' AND
--     (storage.foldername(name))[1] = auth.uid()::text
-- );

-- Ingen direkte SELECT policy — all nedlasting via Edge Function (signed URL)

-- ============================================================
-- TESTDATA (kun for utvikling)
-- ============================================================
-- Kjøres kun mot dev-database, ALDRI mot prod.

-- Se /PRODUCT/db/testdata.sql for dev-fixtures.

-- ============================================================
-- MIGRASJONSHISTORIKK
-- ============================================================
-- 2026-03-20 v1.0: Initiell skjema-opprettelse
