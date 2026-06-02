export interface GearSource {
  title: string;
  url: string;
}

export interface GearDraftSource {
  title: string;
  url: string;
  used_for: string;
}

export interface GearCandidate {
  title: string;
  category: string;
  suggested_slug: string;
  reason_trending: string;
  sources: GearSource[];
}

export interface GearProductDraft {
  name: string;
  price: string | null;
  rating: number | null;
  pros: string[];
  cons: string[];
  affiliate_url: string;
}

export interface GearDraft {
  title: string;
  slug: string;
  category: string;
  short_description: string;
  content_markdown: string;
  products: GearProductDraft[];
  verify_flags: string[];
  sources: GearDraftSource[];
}

export interface GenerateGearResponse {
  draft: GearDraft;
  sources: GearDraftSource[];
  verify_flags: string[];
  model: string;
}

export interface DiscoverGearResponse {
  candidates: GearCandidate[];
}
