# AI Destination Pipeline Audit

TypeScript check: EXIT:0 (0 errors)
Date: 2026-06-01

## Auto-fixes applied
- Updated refusal detection to handle both output-level and content-level refusal shapes in both edge functions.
- Removed dead helper function not used in discovery.

## Bugs found
- none in the scoped edge-function changeset after applying fixes.

## Token efficiency findings
- Discovery call now has max_output_tokens cap set to 1500.
- Generate Step A now has max_output_tokens cap set to 3000.
- Generate Step B now has max_output_tokens cap set to 4000.
- Step B research handoff is now compact JSON (no pretty-print indentation).
- Discovery catalog context is now capped to 40 slugs.
- Few-shot style block now keeps short_description + common_fears only (full_guide excerpt removed).

## Recommendations
- [IMPACT: medium] [EFFORT: low] — Consider capping source list length in Step A before passing to Step B to keep context stable as web_search returns grow. File: supabase/functions/generate-destination-draft/index.ts:433.
- [IMPACT: low] [EFFORT: low] — Consider adding an explicit unit test for refusal-shape parsing against both API variants to prevent regressions. Files: supabase/functions/discover-trending-destinations/index.ts:70 and supabase/functions/generate-destination-draft/index.ts:71.

## Fixes applied
- FIX 1 (refusal hardening):
  - Added output-item refusal detection (item.type === "refusal") and first-content refusal detection in discovery: supabase/functions/discover-trending-destinations/index.ts:70, supabase/functions/discover-trending-destinations/index.ts:76, supabase/functions/discover-trending-destinations/index.ts:85.
  - Added output-item refusal detection (item.type === "refusal") and first-content refusal detection in generate: supabase/functions/generate-destination-draft/index.ts:71, supabase/functions/generate-destination-draft/index.ts:73, supabase/functions/generate-destination-draft/index.ts:82.
- FIX 2 (max_output_tokens caps):
  - Discovery call cap added: supabase/functions/discover-trending-destinations/index.ts:236.
  - Generate Step A cap added: supabase/functions/generate-destination-draft/index.ts:393.
  - Generate Step B cap added: supabase/functions/generate-destination-draft/index.ts:422.
- FIX 3 (compact Step A -> Step B payload):
  - Switched to compact JSON.stringify without indentation: supabase/functions/generate-destination-draft/index.ts:433.
- FIX 4 (catalog cap to 40 slugs):
  - Catalog now slices first 40 entries and passes slug-only joined string: supabase/functions/discover-trending-destinations/index.ts:96.
- FIX 5 (reduce few-shot payload):
  - Removed full_guide_markdown excerpt from few-shot block, keeping short_description + common_fears: supabase/functions/generate-destination-draft/index.ts:257 and supabase/functions/generate-destination-draft/index.ts:260.
- FIX 6 (dead code removal):
  - Deleted unused escapeJsonString helper from discovery function file (removed block previously between hasRefusal and buildPrompt; buildPrompt now starts at supabase/functions/discover-trending-destinations/index.ts:95).
