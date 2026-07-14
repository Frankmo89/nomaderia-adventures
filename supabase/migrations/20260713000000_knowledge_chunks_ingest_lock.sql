-- knowledge_chunks_ingest_lock + claim/release RPCs + unique constraint on
-- knowledge_chunks. Prevents the pefo/gumo duplication bug: overlapping
-- ingest-knowledge invocations for the same park each ran their own
-- DELETE-then-INSERT and raced past each other, leaving N full copies of
-- every section (observed: 23x for "pefo", 8x for "gumo" — see
-- docs/pending-tasks.md, julio 2026 audit).
--
-- Why a lock table instead of pg_advisory_xact_lock: ingest-knowledge makes
-- several separate supabase-js calls per park (claim → select existing →
-- delete → insert × N batches). Under Supabase's PostgREST/pgbouncer
-- transaction-pooling, each of those calls gets its own short-lived
-- connection/transaction, so an advisory lock acquired in one call would
-- already be released by the time the next call runs — it can't span the
-- multiple round-trips this loop needs. A real committed row survives
-- across separate calls/connections, which is what we need here.
--
-- IMPORTANT — run order: the unique constraint below will FAIL if applied
-- before the existing pefo/gumo duplicate rows are cleaned up (they violate
-- it as-is). Run the pefo/gumo cleanup SQL first, THEN this migration.
-- See docs/pending-tasks.md for the exact order Frank should follow.

CREATE TABLE IF NOT EXISTS public.knowledge_chunks_ingest_lock (
  source_table text        NOT NULL,
  source_id     uuid        NOT NULL,
  locked_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source_table, source_id)
);

ALTER TABLE public.knowledge_chunks_ingest_lock ENABLE ROW LEVEL SECURITY;

-- Internal bookkeeping only — no public read, admin-only management (service
-- role used by the Edge Function bypasses RLS entirely, same as every other
-- ingest/sync bookkeeping table in this project).
CREATE POLICY "Admins can manage knowledge ingest locks"
  ON public.knowledge_chunks_ingest_lock FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Atomically claims the lock for (source_table, source_id): succeeds if no
-- row exists yet, or if the existing row is older than p_stale_after (so a
-- crashed/timed-out invocation can't hold the lock forever). The WHERE
-- clause inside ON CONFLICT DO UPDATE is the atomic part — if it evaluates
-- false (a live lock already held by someone else), Postgres skips the
-- update and the row does not appear in RETURNING, so this returns false
-- without erroring and without touching the existing lock.
CREATE OR REPLACE FUNCTION public.claim_knowledge_ingest_lock(
  p_source_table text,
  p_source_id uuid,
  p_stale_after interval DEFAULT '5 minutes'
) RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $fn$
  WITH claimed AS (
    INSERT INTO public.knowledge_chunks_ingest_lock (source_table, source_id, locked_at)
    VALUES (p_source_table, p_source_id, now())
    ON CONFLICT (source_table, source_id)
    DO UPDATE SET locked_at = now()
    WHERE public.knowledge_chunks_ingest_lock.locked_at < now() - p_stale_after
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM claimed);
$fn$;

CREATE OR REPLACE FUNCTION public.release_knowledge_ingest_lock(
  p_source_table text,
  p_source_id uuid
) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $fn$
  DELETE FROM public.knowledge_chunks_ingest_lock
  WHERE source_table = p_source_table AND source_id = p_source_id;
$fn$;

-- Only the Edge Function (service_role) should ever call these — not anon/authenticated.
REVOKE ALL ON FUNCTION public.claim_knowledge_ingest_lock(text, uuid, interval) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_knowledge_ingest_lock(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_knowledge_ingest_lock(text, uuid, interval) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_knowledge_ingest_lock(text, uuid) TO service_role;

-- Defense-in-depth: even with the lock above, guarantee at the DB level that
-- no codepath can ever leave two rows for the same (source_table, source_id,
-- source_field). Safe against "parte N" chunk splitting — chunkSection() in
-- ingest-knowledge/index.ts already suffixes each split part's source_field
-- with " (parte N)", so legitimate multi-part chunks never collide on this
-- constraint; only true duplicates (the pefo/gumo bug) would.
ALTER TABLE public.knowledge_chunks
  ADD CONSTRAINT knowledge_chunks_source_field_unique
  UNIQUE (source_table, source_id, source_field);
