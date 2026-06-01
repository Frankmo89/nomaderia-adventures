export interface DraftSource {
  title: string;
  url: string;
  used_for: string;
}

export interface TrendingCandidate {
  title: string;
  country: string;
  suggested_slug: string;
  reason_trending: string;
  difficulty_level: "easy" | "moderate" | "challenging";
  sources: Array<{
    title: string;
    url: string;
  }>;
}

export interface DestinationDraft {
  title: string;
  slug: string;
  country: string;
  region: string | null;
  base_city: string | null;
  access_type: string | null;
  cell_signal_status: string | null;
  short_description: string;
  difficulty_level: "easy" | "moderate" | "challenging";
  difficulty_description: string | null;
  days_needed: string | null;
  best_season: string | null;
  estimated_budget_usd: number | null;
  preparation_plan: string;
  gear_list_markdown: string;
  itinerary_markdown: string;
  full_guide_markdown: string;
  common_fears: Array<{
    question: string;
    answer: string;
  }>;
  experience_type: string | null;
  tags: string[];
  verify_flags: string[];
  sources: DraftSource[];
}

export interface GenerateDraftResponse {
  draft: DestinationDraft;
  sources: DraftSource[];
  verify_flags: string[];
  model: string;
}

export interface DiscoverResponse {
  candidates: TrendingCandidate[];
}
