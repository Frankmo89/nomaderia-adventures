import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { requireAdmin } from "../_shared/admin-auth.ts";
import {
  MAX_PARK_IMAGES,
  DESTINATIONS_BUCKET,
  assembleMirroredUrls,
  creditLooksCopyrighted,
  destinationsPublicUrl,
  evaluateDownloadedImage,
  mirrorObjectPath,
  planMirrorWrite,
  type ImageSkipReason,
  type NpsImageMeta,
} from "../_shared/mirror-park-images.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const NPS_API_KEY = Deno.env.get("NPS_API_KEY");

const NPS_BASE = "https://developer.nps.gov/api/v1/parks";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DestinationRow {
  id: string;
  slug: string;
  park_code: string | null;
  title: string;
  hero_image_url: string | null;
  gallery_images: string[] | null;
}

interface NpsApiResponse {
  data: Array<{
    parkCode: string;
    images: NpsImageMeta[];
  }>;
}

interface MirrorRequestBody {
  slug?: string;
  dry_run?: boolean;
}

interface SkippedImage {
  url: string;
  reason: ImageSkipReason;
}

interface MirrorResponse {
  slug: string;
  hero: "replaced" | "kept" | "missing";
  gallery: number;
  skipped: SkippedImage[];
  dry_run: boolean;
  needs_manual_photo?: boolean;
  message?: string;
}

async function fetchParkImages(
  apiKey: string,
  parkCode: string,
): Promise<NpsImageMeta[]> {
  const url =
    `${NPS_BASE}?api_key=${encodeURIComponent(apiKey)}` +
    `&parkCode=${encodeURIComponent(parkCode)}&limit=1`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`NPS API ${res.status}: ${await res.text()}`);
  }
  const body = (await res.json()) as NpsApiResponse;
  const park = body.data?.[0];
  if (!park) return [];
  return (park.images ?? []).filter((img) => !!img?.url).slice(0, MAX_PARK_IMAGES);
}

interface GoodCandidate {
  sourceUrl: string;
  bytes: Uint8Array;
  contentType: string;
}

async function downloadAndFilter(
  images: NpsImageMeta[],
): Promise<{ good: GoodCandidate[]; skipped: SkippedImage[] }> {
  const good: GoodCandidate[] = [];
  const skipped: SkippedImage[] = [];

  for (const img of images) {
    if (creditLooksCopyrighted(img.credit)) {
      skipped.push({ url: img.url, reason: "copyrighted" });
      continue;
    }

    try {
      const res = await fetch(img.url, {
        headers: { Accept: "image/*,*/*" },
        redirect: "follow",
      });
      if (!res.ok) {
        skipped.push({ url: img.url, reason: "download_failed" });
        continue;
      }
      const contentType = res.headers.get("content-type");
      const buf = new Uint8Array(await res.arrayBuffer());
      const reason = evaluateDownloadedImage({
        downloadOk: true,
        contentType,
        byteLength: buf.byteLength,
        credit: img.credit,
      });
      if (reason) {
        skipped.push({ url: img.url, reason });
        continue;
      }
      good.push({
        sourceUrl: img.url,
        bytes: buf,
        contentType: (contentType ?? "image/jpeg").split(";")[0].trim(),
      });
    } catch {
      skipped.push({ url: img.url, reason: "download_failed" });
    }
  }

  return { good, skipped };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método no permitido" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variables de Supabase incompletas");
    }
    if (!NPS_API_KEY) {
      throw new Error(
        "NPS_API_KEY no configurada — agrégala en Supabase Dashboard → Edge Functions → Secrets",
      );
    }

    const { user, error: authError } = await requireAdmin(req, corsHeaders);
    if (authError) return authError;

    let body: MirrorRequestBody;
    try {
      body = (await req.json()) as MirrorRequestBody;
    } catch {
      return new Response(
        JSON.stringify({ error: "JSON inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const slug = typeof body.slug === "string" ? body.slug.trim() : "";
    const dryRun = body.dry_run === true;

    if (!slug) {
      return new Response(
        JSON.stringify({ error: "Falta 'slug' (un parque por llamada)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log(
      `[mirror-park-images] slug=${slug} dry_run=${dryRun} by=${user.email}`,
    );

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: row, error: selectErr } = await db
      .from("destinations")
      .select("id, slug, park_code, title, hero_image_url, gallery_images")
      .eq("slug", slug)
      .maybeSingle();

    if (selectErr) {
      throw new Error(`Error leyendo destino: ${selectErr.message}`);
    }
    if (!row) {
      return new Response(
        JSON.stringify({ error: `Destino no encontrado: ${slug}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dest = row as DestinationRow;
    if (!dest.park_code) {
      const response: MirrorResponse = {
        slug,
        hero: "missing",
        gallery: 0,
        skipped: [],
        dry_run: dryRun,
        needs_manual_photo: true,
        message: "needs manual photo (sin park_code)",
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotent fast-path: hero ours + no nps.gov in gallery → do nothing.
    const earlyPlan = planMirrorWrite({
      currentHero: dest.hero_image_url,
      currentGallery: dest.gallery_images,
      goodCandidateCount: 0,
      supabaseUrl: SUPABASE_URL,
    });
    if (earlyPlan.noop) {
      const response: MirrorResponse = {
        slug,
        hero: "kept",
        gallery: earlyPlan.keepGalleryUrls.length,
        skipped: [],
        dry_run: dryRun,
        message: "already on our Storage",
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const npsImages = await fetchParkImages(NPS_API_KEY, dest.park_code);
    const { good, skipped } = await downloadAndFilter(npsImages);

    const plan = planMirrorWrite({
      currentHero: dest.hero_image_url,
      currentGallery: dest.gallery_images,
      goodCandidateCount: good.length,
      supabaseUrl: SUPABASE_URL,
    });

    if (plan.leaveRowAlone) {
      const response: MirrorResponse = {
        slug,
        hero: plan.heroStatus,
        gallery: plan.keepGalleryUrls.length,
        skipped,
        dry_run: dryRun,
        needs_manual_photo: plan.needsManualPhoto || undefined,
        message: plan.needsManualPhoto ? "needs manual photo" : undefined,
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // dry_run: download+check only — no upload, no DB write.
    if (dryRun) {
      const wouldUpload = plan.uploadCandidateIndexes.length;
      let galleryCount: number;
      if (plan.galleryReplaceNpsOnly) {
        // Ours stay; each nps.gov slot becomes one upload (or drops if none).
        galleryCount =
          plan.keepGalleryUrls.length +
          Math.min(wouldUpload, plan.npsGallerySlots);
      } else if (plan.heroStatus === "kept") {
        galleryCount = plan.keepGalleryUrls.length;
      } else {
        galleryCount =
          plan.keepGalleryUrls.length + Math.max(0, wouldUpload - 1);
      }
      const response: MirrorResponse = {
        slug,
        hero: plan.heroStatus,
        gallery: galleryCount,
        skipped,
        dry_run: true,
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uploadedUrls: string[] = [];
    for (const idx of plan.uploadCandidateIndexes) {
      const candidate = good[idx];
      if (!candidate) continue;
      const objectPath = mirrorObjectPath(slug, idx);
      const { error: uploadErr } = await db.storage
        .from(DESTINATIONS_BUCKET)
        .upload(objectPath, candidate.bytes, {
          contentType: candidate.contentType || "image/jpeg",
          cacheControl: "31536000",
          upsert: true,
        });
      if (uploadErr) {
        console.error(
          `[mirror-park-images] upload failed ${objectPath}:`,
          uploadErr.message,
        );
        skipped.push({ url: candidate.sourceUrl, reason: "download_failed" });
        continue;
      }
      uploadedUrls.push(destinationsPublicUrl(SUPABASE_URL, objectPath));
    }

    if (uploadedUrls.length === 0 && plan.heroStatus !== "kept") {
      const response: MirrorResponse = {
        slug,
        hero: "missing",
        gallery: plan.keepGalleryUrls.length,
        skipped,
        dry_run: false,
        needs_manual_photo: true,
        message: "needs manual photo",
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const assembled = assembleMirroredUrls({
      heroStatus: plan.heroStatus,
      keepHeroUrl: plan.keepHeroUrl,
      keepGalleryUrls: plan.keepGalleryUrls,
      currentGalleryUrls: plan.currentGalleryUrls,
      galleryReplaceNpsOnly: plan.galleryReplaceNpsOnly,
      uploadedUrls,
      supabaseUrl: SUPABASE_URL,
    });

    if (!assembled.hero) {
      const response: MirrorResponse = {
        slug,
        hero: "missing",
        gallery: plan.keepGalleryUrls.length,
        skipped,
        dry_run: false,
        needs_manual_photo: true,
        message: "needs manual photo",
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateErr } = await db
      .from("destinations")
      .update({
        hero_image_url: assembled.hero,
        gallery_images: assembled.gallery.length > 0 ? assembled.gallery : null,
      })
      .eq("id", dest.id);

    if (updateErr) {
      throw new Error(`Error actualizando destino: ${updateErr.message}`);
    }

    const response: MirrorResponse = {
      slug,
      hero: plan.heroStatus === "kept" ? "kept" : "replaced",
      gallery: assembled.gallery.length,
      skipped,
      dry_run: false,
    };

    console.log(`[mirror-park-images] done`, response);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[mirror-park-images] error no controlado", err);
    const message = err instanceof Error ? err.message : "Error inesperado";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
