-- =============================================================================
-- Add missing destinations.nps_description (gap from 20260605100000 partial apply)
-- Project: Nomaderia Adventures (vrixiuvnhvqafmxlcyex)
-- Prepared 2026-09-24 — applied via this migration file when FrankMo approves.
-- Idempotent: ADD COLUMN IF NOT EXISTS.
-- Callers: supabase/functions/ingest-national-parks/index.ts
-- =============================================================================

ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS nps_description text;

COMMENT ON COLUMN public.destinations.nps_description IS
  'Raw English description from NPS API — used as AI generation input';
