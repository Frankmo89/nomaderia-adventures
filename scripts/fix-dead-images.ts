import { createClient } from "@supabase/supabase-js";

// One-off remediation script — NOT wired into npm run build or any npm script.
// Fixes the 68 dead NPS.gov image URLs (stale structured_data URLs; NPS
// reorganized/removed them) found by `npm run audit-images` on 2026-07-27
// across the 20 parks in AFFECTED_SLUGS below.
//
// Writing to `destinations` requires the service-role key — RLS only allows
// admin roles to INSERT/UPDATE/DELETE (see "Admins can manage destinations"
// policy), the anon/publishable key that audit-images.ts uses is read-only.
// Fetching fresh media also requires NPS_API_KEY, which only exists as a
// Supabase Edge Function secret today (used by ingest-national-parks).
//
// Neither secret belongs in .env. Pass both inline, once, for this run:
//
//   SUPABASE_SERVICE_ROLE_KEY=xxx NPS_API_KEY=xxx npx tsx scripts/fix-dead-images.ts --dry-run
//   SUPABASE_SERVICE_ROLE_KEY=xxx NPS_API_KEY=xxx npx tsx scripts/fix-dead-images.ts

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const NPS_API_KEY = process.env.NPS_API_KEY;
const DRY_RUN = process.argv.includes("--dry-run");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !NPS_API_KEY) {
  console.error(
    "VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and NPS_API_KEY must all be set.\n" +
      "This script writes to `destinations` (needs the service-role key — RLS blocks\n" +
      "the anon key on UPDATE) and calls the NPS API. Pass them inline, never store\n" +
      "them in .env:\n\n" +
      "  SUPABASE_SERVICE_ROLE_KEY=xxx NPS_API_KEY=xxx npx tsx scripts/fix-dead-images.ts --dry-run",
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// 20 parks flagged by the 2026-07-27 audit-images.ts run.
const AFFECTED_SLUGS = [
  "arches-national-park",
  "acadia-national-park",
  "canyonlands-national-park",
  "national-park-of-american-samoa",
  "death-valley-national-park",
  "grand-canyon-national-park",
  "everglades-national-park",
  "gateway-arch-national-park",
  "glacier-national-park",
  "grand-teton-national-park",
  "hot-springs-national-park",
  "isle-royale-national-park",
  "kenai-fjords-national-park",
  "rocky-mountain-national-park",
  "mount-rainier-national-park",
  "shenandoah-national-park",
  "voyageurs-national-park",
  "denali-national-park-preserve",
  "kobuk-valley-national-park",
  "yellowstone-national-park",
];

// ---------- NPS API (same endpoint/shape as ingest-national-parks) ----------

const NPS_BASE = "https://developer.nps.gov/api/v1/parks";

interface NpsImage {
  url: string;
}

interface NpsPark {
  parkCode: string;
  images: NpsImage[];
}

interface NpsApiResponse {
  data: NpsPark[];
}

async function fetchParksByCode(codes: string[]): Promise<NpsPark[]> {
  const url = `${NPS_BASE}?api_key=${encodeURIComponent(NPS_API_KEY!)}&parkCode=${codes.join(",")}&limit=${codes.length}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`NPS API ${res.status}: ${await res.text()}`);
  }
  const body = (await res.json()) as NpsApiResponse;
  return body.data ?? [];
}

// ---------- HEAD-check (same pattern as audit-images.ts) ----------

const CONCURRENCY = 8;
const TIMEOUT_MS = 8000;

async function checkUrl(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkAll(urls: string[]): Promise<Map<string, boolean>> {
  const result = new Map<string, boolean>();
  const queue = [...urls];
  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      if (!url) break;
      result.set(url, await checkUrl(url));
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return result;
}

// ---------- Main ----------

interface DestRow {
  id: string;
  slug: string;
  title: string;
  park_code: string | null;
  hero_image_url: string | null;
  gallery_images: string[] | null;
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN (no writes)" : "APPLY"}\n`);

  const { data, error } = await supabase
    .from("destinations")
    .select("id, slug, title, park_code, hero_image_url, gallery_images")
    .in("slug", AFFECTED_SLUGS);

  if (error) {
    console.error("Error fetching destinations:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []) as DestRow[];
  const missing = AFFECTED_SLUGS.filter((s) => !rows.find((r) => r.slug === s));
  if (missing.length > 0) {
    console.warn(`Warning: slugs not found in destinations: ${missing.join(", ")}\n`);
  }

  const parkCodes = rows.map((r) => r.park_code).filter((c): c is string => !!c);
  console.log(`Fetching fresh NPS media for ${parkCodes.length} parks (one batched call)...`);
  const npsParks = await fetchParksByCode(parkCodes);
  const npsByCode = new Map(npsParks.map((p) => [p.parkCode, p]));

  // HEAD-check current hero/gallery URLs (to find what's actually dead) plus
  // every fresh NPS candidate (to find what's usable) in one pass.
  const urlsToCheck = new Set<string>();
  for (const row of rows) {
    if (row.hero_image_url) urlsToCheck.add(row.hero_image_url);
    for (const g of row.gallery_images ?? []) if (g) urlsToCheck.add(g);
    const npsPark = row.park_code ? npsByCode.get(row.park_code) : undefined;
    for (const img of npsPark?.images ?? []) if (img.url) urlsToCheck.add(img.url);
  }

  console.log(`Verifying ${urlsToCheck.size} URLs with HEAD requests...\n`);
  const liveness = await checkAll([...urlsToCheck]);

  let parksChanged = 0;
  let heroReplaced = 0;
  let galleryReplaced = 0;
  let galleryDropped = 0;
  const unresolved: string[] = [];

  for (const row of rows) {
    const npsPark = row.park_code ? npsByCode.get(row.park_code) : undefined;
    const npsCandidates = (npsPark?.images ?? [])
      .map((img) => img.url)
      .filter((url) => url && liveness.get(url));

    const usedCandidates = new Set<string>();
    const takeCandidate = (): string | null => {
      const next = npsCandidates.find((u) => !usedCandidates.has(u));
      if (next) usedCandidates.add(next);
      return next ?? null;
    };

    const diffLines: string[] = [];
    let changed = false;
    let newHero = row.hero_image_url;

    // hero_image_url
    const heroDead = !row.hero_image_url || !liveness.get(row.hero_image_url);
    if (heroDead) {
      let replacement = takeCandidate();
      if (!replacement) {
        // API returned nothing usable — fall back to a currently-valid gallery entry.
        replacement = (row.gallery_images ?? []).find((g) => g && liveness.get(g)) ?? null;
      }
      if (replacement) {
        diffLines.push(`  hero_image_url: ${row.hero_image_url ?? "(null)"} -> ${replacement}`);
        newHero = replacement;
        changed = true;
        heroReplaced++;
      } else {
        diffLines.push(
          `  hero_image_url: ${row.hero_image_url ?? "(null)"} -> UNRESOLVED (no NPS replacement, no valid gallery fallback)`,
        );
        unresolved.push(`${row.slug} — hero_image_url`);
      }
    }

    // gallery_images
    const newGallery: string[] = [];
    for (const g of row.gallery_images ?? []) {
      if (!g) continue;
      if (liveness.get(g)) {
        newGallery.push(g);
        continue;
      }
      const replacement = takeCandidate();
      if (replacement) {
        diffLines.push(`  gallery_images: ${g} -> ${replacement}`);
        newGallery.push(replacement);
        changed = true;
        galleryReplaced++;
      } else {
        diffLines.push(`  gallery_images: ${g} -> removed, no replacement found`);
        changed = true;
        galleryDropped++;
      }
    }

    if (diffLines.length === 0) continue; // nothing dead for this park — idempotent no-op

    parksChanged++;
    console.log(`${row.slug} (${row.title}):`);
    diffLines.forEach((l) => console.log(l));
    console.log("");

    if (!DRY_RUN && changed) {
      const { error: updErr } = await supabase
        .from("destinations")
        .update({
          hero_image_url: newHero,
          gallery_images: newGallery.length > 0 ? newGallery : null,
        })
        .eq("id", row.id);
      if (updErr) console.error(`  FAILED to write ${row.slug}: ${updErr.message}`);
    }
  }

  console.log(
    `\nSummary: ${parksChanged} parks touched. hero replaced: ${heroReplaced}, gallery replaced: ${galleryReplaced}, gallery entries dropped: ${galleryDropped}.`,
  );

  if (unresolved.length > 0) {
    console.log(`\nUnresolved — needs Frank's manual review (no NPS replacement available):`);
    unresolved.forEach((u) => console.log(`  - ${u}`));
  }

  if (DRY_RUN) {
    console.log("\nDry run only — no writes applied. Re-run without --dry-run to apply.");
  }
}

main();
