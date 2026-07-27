import { createClient } from "@supabase/supabase-js";

// Manual QA utility — NOT wired into `npm run build` (see package.json).
// Frank runs this by hand after a content update: `npm run audit-images`.
// Checks every destination's cover (hero_image_url) and gallery (gallery_images)
// URL with a HEAD request and prints the dead ones.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) are not set."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data, error } = await supabase
  .from("destinations")
  .select("slug, title, hero_image_url, gallery_images")
  .order("title");

if (error) {
  console.error("Error fetching destinations:", error.message);
  process.exit(1);
}

interface ImageRef {
  slug: string;
  title: string;
  field: string;
  url: string;
}

const refs: ImageRef[] = [];
for (const d of data ?? []) {
  if (d.hero_image_url) {
    refs.push({ slug: d.slug, title: d.title, field: "hero_image_url", url: d.hero_image_url });
  }
  const gallery = (d.gallery_images ?? []) as string[];
  gallery.forEach((url, i) => {
    if (url) refs.push({ slug: d.slug, title: d.title, field: `gallery_images[${i}]`, url });
  });
}

console.log(`Checking ${refs.length} image URLs across ${data?.length ?? 0} destinations...\n`);

const CONCURRENCY = 8;
const TIMEOUT_MS = 8000;

async function checkUrl(url: string): Promise<{ ok: boolean; status?: number; reason?: string }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: "HEAD", signal: controller.signal });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timeout);
  }
}

type DeadRef = ImageRef & { status?: number; reason?: string };
const dead: DeadRef[] = [];
let checked = 0;

async function worker(queue: ImageRef[]) {
  while (queue.length > 0) {
    const ref = queue.shift();
    if (!ref) break;
    const result = await checkUrl(ref.url);
    checked++;
    if (!result.ok) {
      dead.push({ ...ref, status: result.status, reason: result.reason });
      console.log(`x [${ref.slug}] ${ref.field}: ${ref.url} -- ${result.status ?? result.reason}`);
    }
  }
}

const queue = [...refs];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

console.log(`\nChecked ${checked} URLs. ${dead.length} dead.\n`);

if (dead.length > 0) {
  console.log("Dead URLs by destination:");
  const bySlug = new Map<string, DeadRef[]>();
  for (const d of dead) {
    if (!bySlug.has(d.slug)) bySlug.set(d.slug, []);
    bySlug.get(d.slug)!.push(d);
  }
  for (const [slug, items] of bySlug) {
    console.log(`\n  ${slug} (${items[0].title}):`);
    for (const item of items) {
      console.log(`    - ${item.field}: ${item.url} (${item.status ?? item.reason})`);
    }
  }
  process.exitCode = 1;
} else {
  console.log("All image URLs are healthy.");
}
