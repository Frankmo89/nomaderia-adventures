import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL =
  process.env.VITE_SITE_URL ||
  "https://nomaderia.com";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    "Skipping sitemap generation: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) are not set."
  );
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const { data: destinations, error: destErr } = await supabase
  .from("destinations")
  .select("slug, updated_at")
  .eq("is_published", true)
  .order("title");

const { data: blogs, error: blogErr } = await supabase
  .from("blog_posts")
  .select("slug, updated_at")
  .eq("is_published", true)
  .order("title");

const { data: gear, error: gearErr } = await supabase
  .from("gear_articles")
  .select("slug, updated_at")
  .eq("is_published", true)
  .order("title");

if (destErr) console.error("destinations error:", destErr.message);
if (blogErr) console.error("blog_posts error:", blogErr.message);
if (gearErr) console.error("gear_articles error:", gearErr.message);

if (destErr || blogErr || gearErr) {
  console.error("Aborting sitemap generation due to database errors.");
  process.exit(1);
}

const destSlugs = (destinations ?? []).map(
  (d: { slug: string; updated_at: string }) => d
);
const blogSlugs = (blogs ?? []).map(
  (b: { slug: string; updated_at: string }) => b
);
const gearSlugs = (gear ?? []).map(
  (g: { slug: string; updated_at: string }) => g
);

console.log(
  `Destinations (${destSlugs.length}):`,
  destSlugs.map((d) => d.slug)
);
console.log(
  `Blog posts  (${blogSlugs.length}):`,
  blogSlugs.map((b) => b.slug)
);
console.log(
  `Gear articles (${gearSlugs.length}):`,
  gearSlugs.map((g) => g.slug)
);

function url(
  loc: string,
  changefreq: string,
  priority: string,
  lastmod?: string
): string {
  const lastmodTag = lastmod
    ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>`
    : "";
  return `  <url>\n    <loc>${loc}</loc>${lastmodTag}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

const staticPages = [
  url(`${SITE_URL}/`, "daily", "1.0"),
  url(`${SITE_URL}/gear`, "weekly", "0.8"),
  url(`${SITE_URL}/blog`, "weekly", "0.8"),
  url(`${SITE_URL}/calculadora`, "monthly", "0.5"),
  url(`${SITE_URL}/sobre-nosotros`, "monthly", "0.5"),
  url(`${SITE_URL}/privacidad`, "yearly", "0.5"),
];

const lines: string[] = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  "  <!-- Páginas estáticas -->",
  ...staticPages,
];

if (destSlugs.length > 0) {
  lines.push("", "  <!-- Destinos -->");
  for (const { slug, updated_at } of destSlugs) {
    lines.push(url(`${SITE_URL}/destinos/${slug}`, "monthly", "0.9", updated_at));
  }
}

if (gearSlugs.length > 0) {
  lines.push("", "  <!-- Gear Articles -->");
  for (const { slug, updated_at } of gearSlugs) {
    lines.push(url(`${SITE_URL}/gear/${slug}`, "weekly", "0.7", updated_at));
  }
}

if (blogSlugs.length > 0) {
  lines.push("", "  <!-- Blog Posts -->");
  for (const { slug, updated_at } of blogSlugs) {
    lines.push(url(`${SITE_URL}/blog/${slug}`, "weekly", "0.7", updated_at));
  }
}

lines.push("</urlset>");

const xml = lines.join("\n") + "\n";
const outPath = join(__dirname, "../public/sitemap.xml");
writeFileSync(outPath, xml, "utf-8");
console.log(`\nSitemap written to ${outPath}`);
console.log(
  `Total URLs: ${staticPages.length + destSlugs.length + blogSlugs.length + gearSlugs.length}`
);
