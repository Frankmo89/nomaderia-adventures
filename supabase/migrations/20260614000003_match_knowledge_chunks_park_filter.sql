-- match_knowledge_chunks: add optional park_code pre-filter (FIX 2).
--
-- WHY: the previous signature returned the globally-nearest chunks and the
-- concierge Edge Function post-filtered by metadata.park_code. Parks whose
-- chunks don't rank in the global top-N got starved (zero chunks → escalation),
-- even when the answer existed in their guide. Pre-filtering inside SQL lets the
-- DB return the top-N chunks *within* a single park.
--
-- Behavior: filter_park_code IS NULL  → global search (identical to before).
--           filter_park_code = 'seki' → only chunks whose metadata->>'park_code'
--                                        equals 'seki'.
--
-- park_code FORMAT (verified against production): lowercase 4-char NPS codes
-- (e.g. 'seki', 'kica', 'yose'), stored both in destinations.park_code and in
-- knowledge_chunks.metadata->>'park_code'. The concierge resolves filter_park_code
-- from destinations.park_code, so the two match byte-for-byte. Any mismatch would
-- silently return zero rows — do not change the casing or the metadata key.
--
-- OVERLOAD SAFETY: adding the filter_park_code parameter creates a NEW function
-- signature. A bare CREATE OR REPLACE would leave the old 3-arg overload in place,
-- and PostgREST would then fail with "function ... is not unique". So we DROP the
-- old signature (from migration 20260614000002) explicitly first, then create the
-- new one — all in this single migration.
--
-- SAFE TO PASTE INTO THE SUPABASE SQL EDITOR: every statement is idempotent /
-- re-runnable. Everything except the new parameter is identical to the previous
-- definition (cosine distance <=>, same ORDER BY / threshold / match_count,
-- SECURITY DEFINER, search_path = public, GRANT EXECUTE to anon + authenticated).

-- Drop the previous 3-arg signature so the 4-arg version below is unambiguous.
DROP FUNCTION IF EXISTS public.match_knowledge_chunks(vector, int, float);
-- Drop the new 4-arg signature too, so this migration is safely re-runnable.
DROP FUNCTION IF EXISTS public.match_knowledge_chunks(vector, int, float, text);

CREATE FUNCTION public.match_knowledge_chunks(
  query_embedding  vector(1536),
  match_count      int   DEFAULT 6,
  min_similarity   float DEFAULT 0.4,
  filter_park_code text  DEFAULT NULL
)
RETURNS TABLE (
  id           uuid,
  content      text,
  metadata     jsonb,
  source_table text,
  source_field text,
  similarity   float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    kc.id,
    kc.content,
    kc.metadata,
    kc.source_table,
    kc.source_field,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM public.knowledge_chunks kc
  WHERE 1 - (kc.embedding <=> query_embedding) >= min_similarity
    AND (filter_park_code IS NULL OR kc.metadata->>'park_code' = filter_park_code)
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_knowledge_chunks(vector, int, float, text)
  TO anon, authenticated;
