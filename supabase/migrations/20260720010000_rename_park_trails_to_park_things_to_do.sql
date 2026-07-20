-- Rename park_trails -> park_things_to_do (and its sync bookkeeping table
-- park_trails_sync_state -> park_things_to_do_sync_state).
--
-- The DATA was never wrong: sync-park-trails legitimately syncs NPS's
-- /thingstodo endpoint (activity=Hiking) — confirmed by nps_thing_id and the
-- nps_url pattern. The problem was the TABLE NAME, which implied "trails"
-- when /thingstodo actually mixes real named hikes with rides, ranger
-- programs, wildlife viewing, scenic drives, etc. under the identical URL
-- pattern. See docs/decisions.md (ADR-021) and docs/pending-tasks.md.
--
-- ALTER TABLE ... RENAME TO is used throughout (never DROP+CREATE), so all
-- 1,190+ existing rows, the PK, the FK to destinations, indexes and RLS
-- policies carry over untouched — only identifiers are relabeled.

ALTER TABLE public.park_trails RENAME TO park_things_to_do;
ALTER TABLE public.park_trails_sync_state RENAME TO park_things_to_do_sync_state;

ALTER INDEX public.idx_park_trails_park_code RENAME TO idx_park_things_to_do_park_code;

ALTER TRIGGER update_park_trails_updated_at ON public.park_things_to_do
  RENAME TO update_park_things_to_do_updated_at;
ALTER TRIGGER update_park_trails_sync_state_updated_at ON public.park_things_to_do_sync_state
  RENAME TO update_park_things_to_do_sync_state_updated_at;

ALTER POLICY "Anyone can read park trails" ON public.park_things_to_do
  RENAME TO "Anyone can read park things to do";
ALTER POLICY "Admins can manage park trails" ON public.park_things_to_do
  RENAME TO "Admins can manage park things to do";
ALTER POLICY "Anyone can read park trails sync state" ON public.park_things_to_do_sync_state
  RENAME TO "Anyone can read park things to do sync state";
ALTER POLICY "Admins can manage park trails sync state" ON public.park_things_to_do_sync_state
  RENAME TO "Admins can manage park things to do sync state";

-- Cosmetic: rename the auto-generated PK/FK/UNIQUE constraint names too —
-- they still spell out "park_trails" from the original CREATE TABLE's
-- default Postgres naming convention. Wrapped defensively: if the
-- production name differs from the default assumed here (e.g. the original
-- migration was applied with hand-edited names), this logs a NOTICE per
-- mismatch instead of failing the rest of the migration — the identifiers
-- renamed above already carry the meaning that mattered.
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.park_things_to_do RENAME CONSTRAINT park_trails_pkey TO park_things_to_do_pkey;
  EXCEPTION WHEN undefined_object THEN
    RAISE NOTICE 'park_trails_pkey no existe con ese nombre — renombrar manualmente si aplica';
  END;
  BEGIN
    ALTER TABLE public.park_things_to_do RENAME CONSTRAINT park_trails_destination_id_fkey TO park_things_to_do_destination_id_fkey;
  EXCEPTION WHEN undefined_object THEN
    RAISE NOTICE 'park_trails_destination_id_fkey no existe con ese nombre — renombrar manualmente si aplica';
  END;
  BEGIN
    ALTER TABLE public.park_things_to_do RENAME CONSTRAINT park_trails_park_code_nps_thing_id_key TO park_things_to_do_park_code_nps_thing_id_key;
  EXCEPTION WHEN undefined_object THEN
    RAISE NOTICE 'park_trails_park_code_nps_thing_id_key no existe con ese nombre — renombrar manualmente si aplica';
  END;
  BEGIN
    ALTER TABLE public.park_things_to_do_sync_state RENAME CONSTRAINT park_trails_sync_state_pkey TO park_things_to_do_sync_state_pkey;
  EXCEPTION WHEN undefined_object THEN
    RAISE NOTICE 'park_trails_sync_state_pkey no existe con ese nombre — renombrar manualmente si aplica';
  END;
  BEGIN
    ALTER TABLE public.park_things_to_do_sync_state RENAME CONSTRAINT park_trails_sync_state_destination_id_fkey TO park_things_to_do_sync_state_destination_id_fkey;
  EXCEPTION WHEN undefined_object THEN
    RAISE NOTICE 'park_trails_sync_state_destination_id_fkey no existe con ese nombre — renombrar manualmente si aplica';
  END;
END $$;

-- Re-point the weekly cron job at the renamed Edge Function
-- (sync-park-trails -> sync-park-things-to-do). Same guarded pattern as
-- 20260707000001_setup_pg_cron_park_trails.sql — pg_cron/pg_net may not be
-- enabled yet, and the old job may not have been registered yet either.
DO $outer$
DECLARE
  has_pg_cron boolean;
  has_pg_net  boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) INTO has_pg_cron;

  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_net'
  ) INTO has_pg_net;

  IF NOT (has_pg_cron AND has_pg_net) THEN
    RAISE NOTICE 'pg_cron o pg_net no están disponibles; se omite el re-registro del cron job weekly-sync-park-things-to-do.';
    RETURN;
  END IF;

  BEGIN
    PERFORM cron.unschedule('weekly-sync-park-trails');
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'weekly-sync-park-trails no estaba registrado — se continúa con el nuevo registro.';
  END;

  BEGIN
    PERFORM cron.schedule(
      'weekly-sync-park-things-to-do',
      '0 8 * * 1',  -- Lunes 08:00 UTC
      $$
      SELECT net.http_post(
        url := 'https://vrixiuvnhvqafmxlcyex.supabase.co/functions/v1/sync-park-things-to-do',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('supabase.service_role_key'),
          'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
      );
      $$
    );
  EXCEPTION
    WHEN undefined_function THEN
      RAISE NOTICE 'Funciones cron.schedule o net.http_post no están definidas; se omite el registro del cron job weekly-sync-park-things-to-do.';
  END;
END;
$outer$;
