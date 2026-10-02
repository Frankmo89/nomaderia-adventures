/**
 * Cloudflare Pages Function — per-route Open Graph / meta tags for the Vite SPA.
 *
 * Facebook and other no-JS crawlers only see the static `index.html` shell.
 * This middleware rewrites <title> + description/OG/Twitter tags for:
 *   - /blog/:slug       ← blog_posts (published only)
 *   - /destinos/:slug   ← destinations (published only)
 *
 * Failures (missing row, missing env, Supabase error/timeout) fall through to
 * the existing index.html tags. Never blocks the page.
 *
 * Env (Cloudflare Pages → Settings → Environment variables):
 *   SUPABASE_URL          (or VITE_SUPABASE_URL)
 *   SUPABASE_ANON_KEY     (or VITE_SUPABASE_PUBLISHABLE_KEY) — anon/publishable, read-only
 *
 * See ADR-032.
 */

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SITE_URL?: string;
}

interface OgMeta {
  title: string;
  description: string;
  image: string | null;
  url: string;
}

const DEFAULT_SITE = "https://nomaderia.com";
const DEFAULT_DESCRIPTION =
  "Guía completa en español para tu aventura en parques nacionales.";
const CACHE_TTL_SECONDS = 3600;
const SUPABASE_TIMEOUT_MS = 1500;

const BLOG_PATH = /^\/blog\/([^/]+)\/?$/;
const DEST_PATH = /^\/destinos\/([^/]+)\/?$/;

type ContentKind = "blog" | "destination";

function siteUrl(env: Env): string {
  const raw = env.VITE_SITE_URL?.trim();
  return raw && raw.length > 0 ? raw.replace(/\/$/, "") : DEFAULT_SITE;
}

function supabaseConfig(env: Env): { url: string; key: string } | null {
  const url = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || "").trim();
  const key = (
    env.SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ""
  ).trim();
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

function absoluteImage(image: string | null | undefined, site: string): string | null {
  if (!image || !image.trim()) return null;
  const trimmed = image.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return `${site}${trimmed}`;
  return `${site}/${trimmed}`;
}

function brandTitle(cmsTitle: string): string {
  return `${cmsTitle} — Nomaderia`;
}

async function fetchPublishedMeta(
  env: Env,
  kind: ContentKind,
  slug: string,
  pageUrl: string,
): Promise<OgMeta | null> {
  const cfg = supabaseConfig(env);
  if (!cfg) return null;

  const table = kind === "blog" ? "blog_posts" : "destinations";
  const endpoint = new URL(`${cfg.url}/rest/v1/${table}`);
  endpoint.searchParams.set("select", "title,short_description,hero_image_url");
  endpoint.searchParams.set("slug", `eq.${slug}`);
  endpoint.searchParams.set("is_published", "eq.true");
  endpoint.searchParams.set("limit", "1");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SUPABASE_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint.toString(), {
      method: "GET",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const rows = (await res.json()) as Array<{
      title: string | null;
      short_description: string | null;
      hero_image_url: string | null;
    }>;
    const row = rows[0];
    if (!row?.title) return null;

    const site = siteUrl(env);
    return {
      title: brandTitle(row.title),
      description: row.short_description?.trim() || DEFAULT_DESCRIPTION,
      image: absoluteImage(row.hero_image_url, site),
      url: pageUrl,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

class MetaContentSetter {
  constructor(private readonly value: string) {}
  element(element: { setAttribute(name: string, value: string): void }) {
    // HTMLRewriter encodes attribute values; pass the raw string.
    element.setAttribute("content", this.value);
  }
}

class TitleSetter {
  constructor(private readonly value: string) {}
  element(element: {
    setInnerContent(content: string, options?: { html?: boolean }): void;
  }) {
    element.setInnerContent(this.value, { html: false });
  }
}

class ImageSizeAppender {
  element(element: { append(content: string, options: { html: boolean }): void }) {
    element.append(
      `<meta property="og:image:width" content="1200" />` +
        `<meta property="og:image:height" content="630" />`,
      { html: true },
    );
  }
}

function rewriteHtml(response: Response, meta: OgMeta): Response {
  let rewriter = new HTMLRewriter()
    .on("title", new TitleSetter(meta.title))
    .on('meta[name="description"]', new MetaContentSetter(meta.description))
    .on('meta[property="og:title"]', new MetaContentSetter(meta.title))
    .on(
      'meta[property="og:description"]',
      new MetaContentSetter(meta.description),
    )
    .on('meta[property="og:url"]', new MetaContentSetter(meta.url))
    .on('meta[name="twitter:card"]', new MetaContentSetter("summary_large_image"))
    .on('meta[name="twitter:title"]', new MetaContentSetter(meta.title))
    .on(
      'meta[name="twitter:description"]',
      new MetaContentSetter(meta.description),
    );

  if (meta.image) {
    rewriter = rewriter
      .on('meta[property="og:image"]', new MetaContentSetter(meta.image))
      .on('meta[name="twitter:image"]', new MetaContentSetter(meta.image))
      .on("head", new ImageSizeAppender());
  }

  return rewriter.transform(response);
}

function withCacheHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set(
    "Cache-Control",
    `public, s-maxage=${CACHE_TTL_SECONDS}, max-age=0, must-revalidate`,
  );
  // Hint for Cloudflare edge cache of the Function response
  headers.set("CDN-Cache-Control", `public, max-age=${CACHE_TTL_SECONDS}`);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function matchContent(
  pathname: string,
): { kind: ContentKind; slug: string } | null {
  const blog = pathname.match(BLOG_PATH);
  if (blog?.[1]) return { kind: "blog", slug: decodeURIComponent(blog[1]) };
  const dest = pathname.match(DEST_PATH);
  if (dest?.[1]) return { kind: "destination", slug: decodeURIComponent(dest[1]) };
  return null;
}

export async function onRequest(context: {
  request: Request;
  next: () => Promise<Response>;
  env: Env;
  waitUntil: (promise: Promise<unknown>) => void;
}): Promise<Response> {
  const { request, next, env, waitUntil } = context;

  if (request.method !== "GET" && request.method !== "HEAD") {
    return next();
  }

  const url = new URL(request.url);
  const matched = matchContent(url.pathname);
  if (!matched) {
    return next();
  }

  // Skip anything that looks like a static asset under these prefixes
  if (/\.[a-zA-Z0-9]{1,8}$/.test(url.pathname)) {
    return next();
  }

  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: "GET" });

  try {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  } catch {
    // Cache API unavailable in some local contexts — continue
  }

  const originResponse = await next();
  const contentType = originResponse.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return originResponse;
  }

  const pageUrl = `${siteUrl(env)}${url.pathname.replace(/\/$/, "") || "/"}`;
  const meta = await fetchPublishedMeta(env, matched.kind, matched.slug, pageUrl);

  const bodyResponse = meta
    ? rewriteHtml(originResponse, meta)
    : originResponse;

  const finalResponse = withCacheHeaders(bodyResponse);

  try {
    waitUntil(cache.put(cacheKey, finalResponse.clone()));
  } catch {
    // ignore cache put failures
  }

  return finalResponse;
}
