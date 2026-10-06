-- Official NPS pages in the concierge knowledge base (ADR-036).
--
-- Additive only: four nullable columns on knowledge_chunks, two indexes, a
-- helper that posts to the ingest-nps-pages edge function, and two daily
-- pg_cron jobs. No existing column, row, function or RPC changes;
-- match_knowledge_chunks keeps its signature and body.
--
--   source_url  nps.gov page a chunk was cut from (null for destinations rows)
--   fetched_at  when the source text was fetched. Backfilled with created_at
--               for existing destinations-derived rows; the concierge shows
--               this date in its "verificado" line, never today's date.
--   park_code   NPS park code ('nps' = service-wide pages)
--   kind        evergreen | live | safety. live = conditions/alerts/closures,
--               re-fetched daily and deleted after 7 days.
--
-- Daily refresh (America/Tijuana ≈ UTC-7/-8):
--   nps-pages-refresh-daily  11:15 UTC — one ingest-nps-pages call per park group
--   nps-live-prune-daily     11:50 UTC — delete live chunks older than 7 days
-- The edge function needs a legacy service_role JWT (verify_jwt = true). It is
-- read from the existing Vault secret "ingest_knowledge_jwt"; nothing is
-- inlined here. Without the secret the helper logs a WARNING and skips.
--
-- Idempotent: safe to run more than once.

ALTER TABLE public.knowledge_chunks ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.knowledge_chunks ADD COLUMN IF NOT EXISTS fetched_at timestamptz;
ALTER TABLE public.knowledge_chunks ADD COLUMN IF NOT EXISTS park_code text;
ALTER TABLE public.knowledge_chunks ADD COLUMN IF NOT EXISTS kind text;

ALTER TABLE public.knowledge_chunks ALTER COLUMN fetched_at SET DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'knowledge_chunks_kind_check'
  ) THEN
    ALTER TABLE public.knowledge_chunks
      ADD CONSTRAINT knowledge_chunks_kind_check
      CHECK (kind IS NULL OR kind IN ('evergreen', 'live', 'safety'));
  END IF;
END $$;

-- Existing destinations-derived rows: their date is when they were embedded.
UPDATE public.knowledge_chunks
   SET fetched_at = created_at
 WHERE fetched_at IS NULL;

UPDATE public.knowledge_chunks
   SET park_code = metadata->>'park_code'
 WHERE park_code IS NULL AND metadata ? 'park_code';

UPDATE public.knowledge_chunks
   SET kind = 'evergreen'
 WHERE kind IS NULL AND source_table = 'destinations';

CREATE INDEX IF NOT EXISTS knowledge_chunks_kind_fetched_at_idx
  ON public.knowledge_chunks (kind, fetched_at);
CREATE INDEX IF NOT EXISTS knowledge_chunks_park_code_kind_idx
  ON public.knowledge_chunks (park_code, kind);

-- Keep the new columns right for writers that don't know them (ingest-knowledge):
-- park_code/kind from metadata, and a fresh fetched_at when the text changes.
CREATE OR REPLACE FUNCTION public.knowledge_chunks_fill_source_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $fn$
BEGIN
  IF NEW.park_code IS NULL AND NEW.metadata ? 'park_code' THEN
    NEW.park_code := NEW.metadata->>'park_code';
  END IF;
  IF NEW.kind IS NULL AND NEW.source_table = 'destinations' THEN
    NEW.kind := 'evergreen';
  END IF;
  IF TG_OP = 'UPDATE'
     AND NEW.content IS DISTINCT FROM OLD.content
     AND NEW.fetched_at IS NOT DISTINCT FROM OLD.fetched_at THEN
    NEW.fetched_at := now();
  END IF;
  IF NEW.fetched_at IS NULL THEN
    NEW.fetched_at := now();
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS knowledge_chunks_fill_source_columns ON public.knowledge_chunks;
CREATE TRIGGER knowledge_chunks_fill_source_columns
  BEFORE INSERT OR UPDATE ON public.knowledge_chunks
  FOR EACH ROW EXECUTE FUNCTION public.knowledge_chunks_fill_source_columns();

-- ── Helper: one async POST per park group ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.request_nps_pages_ingest(p_park_codes text[] DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $fn$
DECLARE
  v_jwt text;
  v_group text;
  v_groups text[] := COALESCE(p_park_codes, ARRAY['nps', 'jotr', 'deva', 'chis', 'pinn', 'seki', 'yose', 'grca']);
  v_sent integer := 0;
BEGIN
  SELECT decrypted_secret INTO v_jwt
    FROM vault.decrypted_secrets
   WHERE name = 'ingest_knowledge_jwt'
   LIMIT 1;
  IF v_jwt IS NULL OR v_jwt = '' THEN
    RAISE WARNING 'request_nps_pages_ingest: Vault secret ingest_knowledge_jwt missing; skipped';
    RETURN 0;
  END IF;

  FOREACH v_group IN ARRAY v_groups LOOP
    PERFORM net.http_post(
      url := 'https://vrixiuvnhvqafmxlcyex.supabase.co/functions/v1/ingest-nps-pages',
      body := jsonb_build_object('park_codes', jsonb_build_array(v_group)),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || v_jwt
      ),
      timeout_milliseconds := 150000
    );
    v_sent := v_sent + 1;
  END LOOP;
  RETURN v_sent;
END;
$fn$;

REVOKE ALL ON FUNCTION public.request_nps_pages_ingest(text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.request_nps_pages_ingest(text[]) FROM anon, authenticated;

-- ── Daily jobs ────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nps-pages-refresh-daily') THEN
      PERFORM cron.unschedule('nps-pages-refresh-daily');
    END IF;
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nps-live-prune-daily') THEN
      PERFORM cron.unschedule('nps-live-prune-daily');
    END IF;
    PERFORM cron.schedule(
      'nps-pages-refresh-daily',
      '15 11 * * *',
      $job$SELECT public.request_nps_pages_ingest();$job$
    );
    PERFORM cron.schedule(
      'nps-live-prune-daily',
      '50 11 * * *',
      $job$DELETE FROM public.knowledge_chunks WHERE kind = 'live' AND fetched_at < now() - interval '7 days';$job$
    );
  ELSE
    RAISE NOTICE 'pg_cron no está instalado; se omiten los jobs nps-pages-refresh-daily y nps-live-prune-daily.';
  END IF;
END $$;
