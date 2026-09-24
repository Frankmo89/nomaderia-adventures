-- =============================================================================
-- Security hardening for DEFINER RPCs + rag_itinerary_context view
-- Project: Nomaderia Adventures (vrixiuvnhvqafmxlcyex)
-- Prepared 2026-09-24 — applied via this migration file when FrankMo approves.
--
-- Evidence:
--   All five DEFINER RPCs already had SET search_path TO 'public'.
--   claim/release: only ingest-knowledge (service role).
--   match_knowledge_chunks: concierge-agent uses ANON key — KEEP anon EXECUTE.
--   get_itinerary_by_token: src/hooks/use-itinerary.ts (anon) — KEEP anon.
--   has_role: RLS + admin-auth (authenticated) — REVOKE anon + PUBLIC.
--   rag_itinerary_context: no live app callers; security_invoker=true respects
--     destinations published-only RLS for anon.
--
-- Out of scope: vector extension move, RLS initplan rewrites,
--   leaked-password protection (Auth dashboard toggle).
-- =============================================================================

-- A. View: rag_itinerary_context → security_invoker
ALTER VIEW public.rag_itinerary_context SET (security_invoker = true);

-- B. claim / release locks — service_role only
REVOKE ALL ON FUNCTION public.claim_knowledge_ingest_lock(text, uuid, interval)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_knowledge_ingest_lock(text, uuid, interval)
  TO service_role;

REVOKE ALL ON FUNCTION public.release_knowledge_ingest_lock(text, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_knowledge_ingest_lock(text, uuid)
  TO service_role;

-- C. get_itinerary_by_token — public share pages need anon
REVOKE ALL ON FUNCTION public.get_itinerary_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_itinerary_by_token(text)
  TO anon, authenticated, service_role;
ALTER FUNCTION public.get_itinerary_by_token(text) SET search_path = public;

-- D. match_knowledge_chunks — KEEP anon (concierge-agent uses SUPABASE_ANON_KEY)
REVOKE ALL ON FUNCTION public.match_knowledge_chunks(public.vector, integer, double precision, text)
  FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_knowledge_chunks(public.vector, integer, double precision, text)
  TO anon, authenticated, service_role;
ALTER FUNCTION public.match_knowledge_chunks(public.vector, integer, double precision, text)
  SET search_path = public;

-- E. has_role — needed by authenticated RLS + admin-auth; not by anon RPC
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)
  TO authenticated, service_role;
ALTER FUNCTION public.has_role(uuid, public.app_role) SET search_path = public;

-- Pin search_path on lock helpers (already public; explicit for audit)
ALTER FUNCTION public.claim_knowledge_ingest_lock(text, uuid, interval)
  SET search_path = public;
ALTER FUNCTION public.release_knowledge_ingest_lock(text, uuid)
  SET search_path = public;

-- =============================================================================
-- ROLLBACK (manual — uncomment and run in SQL Editor if something breaks)
-- =============================================================================
/*
ALTER VIEW public.rag_itinerary_context SET (security_invoker = false);

GRANT EXECUTE ON FUNCTION public.claim_knowledge_ingest_lock(text, uuid, interval)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.release_knowledge_ingest_lock(text, uuid)
  TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.get_itinerary_by_token(text)
  TO PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.match_knowledge_chunks(public.vector, integer, double precision, text)
  TO PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)
  TO PUBLIC, anon, authenticated, service_role;
*/
