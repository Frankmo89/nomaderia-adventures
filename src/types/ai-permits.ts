export interface DraftSource {
  title: string;
  url: string;
  used_for: string;
}

export interface PermitWindowDraft {
  park: string;
  permit_name: string;
  window_type: "lottery" | "reservation_release" | "first_come";
  opens_at: string | null;
  closes_at: string | null;
  how_to_apply_url: string | null;
  source_url: string | null;
  year: number;
  notes: string | null;
}

export interface PermitWindowsDraftResponse {
  windows: PermitWindowDraft[];
  verify_flags: string[];
  sources: DraftSource[];
  model: string;
}
