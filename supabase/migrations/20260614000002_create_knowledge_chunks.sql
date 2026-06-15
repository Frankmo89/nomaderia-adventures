-- knowledge_chunks: stores embedded content chunks for RAG retrieval.
--
-- NOTE: This table and match_knowledge_chunks were originally created via the
-- Supabase Dashboard SQL editor (not tracked in migrations). This file documents
-- the authoritative schema and adds missing indexes + RLS so the setup is
-- fully reproducible from migrations alone.
--
-- The table may already exist in the live DB. All DDL uses IF NOT EXISTS /
-- CREATE OR REPLACE so this migration is safe to apply to both a fresh DB
-- and the existing production DB.
--
-- Design decisions (ADR-013):
--   - Embedding model: text-embedding-3-small (1536 dims, cosine similarity)
--   - Distance metric: cosine (<=> operator, vector_cosine_ops index class)
--   - Vector index: HNSW (pgvector >= 0.5.0, faster queries vs IVFFlat)
--   - No volatile data (park_live_data) ever embedded here

-- Enable pgvector (no-op if already active)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS public.knowledge_chunks (
  id           uuid        NOT NULL DEFAULT gen_random_uuid(),
  content      text        NOT NULL,
  embedding    vector(1536),
  source_table text        NOT NULL,
  source_id    uuid        NOT NULL,
  source_field text        NOT NULL,
  metadata     jsonb,
  created_at   timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- HNSW index for fast approximate cosine-similarity search.
-- Operator class vector_cosine_ops matches the <=> operator used in
-- match_knowledge_chunks — must be consistent to benefit from the index.
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_hnsw_idx
  ON public.knowledge_chunks
  USING hnsw (embedding vector_cosine_ops);

-- Composite index to speed up the per-park DELETE + version-check queries
-- issued by ingest-knowledge before each re-embed cycle.
CREATE INDEX IF NOT EXISTS knowledge_chunks_source_idx
  ON public.knowledge_chunks (source_table, source_id);

-- RLS: anon/authenticated reach knowledge_chunks only through the SECURITY
-- DEFINER function below. Direct table SELECT is admin-only.
-- Service-role (ingest-knowledge Edge Function) bypasses RLS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename   = 'knowledge_chunks'
      AND policyname  = 'Admins can manage knowledge chunks'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Admins can manage knowledge chunks"
        ON public.knowledge_chunks FOR ALL TO authenticated
        USING  (public.has_role(auth.uid(), 'admin'))
        WITH CHECK (public.has_role(auth.uid(), 'admin'))
    $p$;
  END IF;
END $$;

-- match_knowledge_chunks: cosine-similarity vector search for the concierge.
--
-- Called via supabase.rpc() with the anon key; SECURITY DEFINER lets it
-- read knowledge_chunks without the caller needing direct SELECT rights.
--
-- Filtering by park_code is currently done post-retrieval in the Edge Function
-- (retrieves match_count rows globally, then filters by metadata.park_code).
-- Pre-filtering inside SQL would improve scoped precision — see PROPOSED in
-- the audit findings for migration instructions when Frank evaluates this.
CREATE OR REPLACE FUNCTION public.match_knowledge_chunks(
  query_embedding vector(1536),
  match_count     int   DEFAULT 6,
  min_similarity  float DEFAULT 0.4
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
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_knowledge_chunks(vector, int, float)
  TO anon, authenticated;
