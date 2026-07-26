-- ai_content_meta: add rag_meta (RAG grounding provenance for generate-blog-draft).
--
-- Context: generate-blog-draft now grounds park-specific posts in
-- knowledge_chunks via match_knowledge_chunks (ADR-015/016 convention) before
-- calling the LLM. rag_meta records whether RAG context was used and how many
-- chunks, so citation quality can be audited later without re-running the draft.
-- Shape written by AdminBlogPostForm.tsx: { used: boolean, chunk_count: number,
-- park_code: string | null, destination_id: string | null } (nullable — not
-- every content_type/row will have it, e.g. gear drafts until a follow-up PR).
ALTER TABLE public.ai_content_meta
  ADD COLUMN IF NOT EXISTS rag_meta JSONB;
