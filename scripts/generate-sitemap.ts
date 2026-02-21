import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

const SITE_URL =
  process.env.VITE_SITE_URL ||
  "https://id-preview--119157cf-892e-40be-9417-1be6150581ad.lovable.app";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "https://vrixiuvnhvqafmxlcyex.supabase.co",
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""
);

async function generate() {
  const [destinations, gear, blog] = await Promise.all([
    supabase.from("destinations").select("slug, updated_at").eq("is_published", true),
    supabase.from("gear_articles").select("slug, updated_at").eq("is_published", true),
    supabase.from("blog_posts").select("slug, updated_at").eq("is_published", true),
  ]);

  const staticPages = [
    { loc: "/", changefreq: "weekly", priority: "1.0" },
    { loc: "/gear", changefreq: "weekly", priority: "0.8" },
    { loc: "/blog", changefreq: "weekly", priority: "0.8" },
    { loc: "/calculadora", changefreq: "monthly", priority: "0.6" },
    { loc: "/sobre-nosotros", changefreq: "monthly", priority: "0.5" },
    { loc: "/privacidad", changefreq: "yearly", priority: "0.3" },
  ];

  const destPages = (destinations.data || []).map((d) => ({
    loc: `/destinos/${d.slug}`,
    lastmod: d.updated_at?.split("T")[0],
    changefreq: "monthly",
    priority: "0.9",
  }));

  const gearPages = (gear.data || []).map((g) => ({
    loc: `/gear/${g.slug}`,
    lastmod: g.updated_at?.split("T")[0],
    changefreq: "monthly",
    priority: "0.8",
  }));

  const blogPages = (blog.data || []).map((b) => ({
    loc: `/blog/${b.slug}`,
    lastmod: b.updated_at?.split("T")[0],
    changefreq: "weekly",
    priority: "0.7",
  }));

  const allPages = [...staticPages, ...destPages, ...gearPages, ...blogPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (p) => `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    ${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ""}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  writeFileSync("public/sitemap.xml", xml);
  console.log(`✅ Sitemap generado con ${allPages.length} URLs`);
}

generate().catch(console.error);
