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

export interface GenerateBlogResponse {
  draft: BlogDraft;
  sources: BlogDraftSource[];
  verify_flags: string[];
  model: string;
}

export interface DiscoverBlogResponse {
  candidates: BlogCandidate[];
}
