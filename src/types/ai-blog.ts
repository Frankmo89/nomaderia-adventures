export interface BlogSource {
  title: string;
  url: string;
}

export interface BlogDraftSource {
  title: string;
  url: string;
  used_for: string;
}

export interface BlogCandidate {
  title: string;
  category: string;
  suggested_slug: string;
  search_intent: string;
  sources: BlogSource[];
}

export interface BlogDraft {
  title: string;
  slug: string;
  category: string;
  short_description: string;
  meta_description: string;
  tags: string[];
  content_markdown: string;
  verify_flags: string[];
  sources: BlogDraftSource[];
}

export interface RagMeta {
  used: boolean;
  chunk_count: number;
  park_code: string | null;
  destination_id: string | null;
}

export interface GenerateBlogResponse {
  draft: BlogDraft;
  sources: BlogDraftSource[];
  verify_flags: string[];
  model: string;
  rag_meta: RagMeta;
}

export interface DiscoverBlogResponse {
  candidates: BlogCandidate[];
}
