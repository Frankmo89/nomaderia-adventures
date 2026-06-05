import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { requireAdmin } from "../_shared/admin-auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const NPS_API_KEY = Deno.env.get("NPS_API_KEY");

const NPS_BASE = "https://developer.nps.gov/api/v1/parks";
const NPS_PAGE_LIMIT = 50;

// Parks with non-resident international surcharge (DOI rule, effective 2025–)
const SURCHARGE_CODES = new Set([
  "acad", "brca", "ever", "glac", "grca", "grte",
  "romo", "sequ", "kica", "yell", "yose", "zion",
]);
const SURCHARGE_AMOUNT = 100;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---------- NPS API types ----------

interface NpsImage {
  url: string;
  altText?: string;
  title?: string;
  caption?: string;
  credit?: string;
}

interface NpsEntranceFee {
  cost: string;
  description: string;
  title: string;
}

interface NpsPark {
  parkCode: string;
  fullName: string;
  description: string;
  designation: string;
  states: string;
  latLong: string;
  entranceFees: NpsEntranceFee[];
  entrancePasses: NpsEntranceFee[];
  url: string;
  images: NpsImage[];
}

interface NpsApiResponse {
  total: string;
  limit: string;
  start: string;
  data: NpsPark[];
}

// ---------- Existing-row shape (only what we read) ----------

interface ExistingRow {
  id: string;
  slug: string;
  is_published: boolean;
}

// ---------- Helpers ----------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")   // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")      // keep alphanumeric/spaces/hyphens
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-{2,}/g, "-");
}

function parseLatLong(latLong: string): { latitude: number | null; longitude: number | null } {
  // Example: "lat:37.84883288, long:-119.5571873"
  const latMatch = latLong.match(/lat:\s*([-\d.]+)/i);
  const lngMatch = latLong.match(/long:\s*([-\d.]+)/i);
  if (!latMatch || !lngMatch) return { latitude: null, longitude: null };
  const latitude = parseFloat(latMatch[1]);
  const longitude = parseFloat(lngMatch[1]);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return { latitude: null, longitude: null };
  return { latitude, longitude };
}

function parseEntranceFee(fees: NpsEntranceFee[]): {
  entrance_fee_usd: number;
  entrance_fee_type: string;
} {
  if (!fees || fees.length === 0) {
    return { entrance_fee_usd: 0, entrance_fee_type: "gratis" };
  }

  const lowerMatch = (f: NpsEntranceFee, term: string) =>
    f.title.toLowerCase().includes(term) || f.description.toLowerCase().includes(term);

  const vehicleFee = fees.find((f) => lowerMatch(f, "vehicle") || lowerMatch(f, "vehículo"));
  if (vehicleFee) {
    const cost = parseFloat(vehicleFee.cost);
    return {
      entrance_fee_usd: Number.isNaN(cost) ? 0 : cost,
      entrance_fee_type: "por vehículo",
    };
  }

  const personFee = fees.find((f) => lowerMatch(f, "person") || lowerMatch(f, "per person"));
  if (personFee) {
    const cost = parseFloat(personFee.cost);
    return {
      entrance_fee_usd: Number.isNaN(cost) ? 0 : cost,
      entrance_fee_type: "por persona",
    };
  }

  // Fallback: first fee in list
  const first = fees[0];
  const cost = parseFloat(first.cost);
  if (Number.isNaN(cost) || cost === 0) {
    return { entrance_fee_usd: 0, entrance_fee_type: "gratis" };
  }
  return { entrance_fee_usd: cost, entrance_fee_type: "por vehículo" };
}

async function fetchAllNationalParks(apiKey: string): Promise<NpsPark[]> {
  const allParks: NpsPark[] = [];
  let start = 0;
  let total = Infinity;

  while (start < total) {
    const url = `${NPS_BASE}?api_key=${encodeURIComponent(apiKey)}&limit=${NPS_PAGE_LIMIT}&start=${start}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });

    if (!res.ok) {
      throw new Error(`NPS API ${res.status}: ${await res.text()}`);
    }

    const body = (await res.json()) as NpsApiResponse;
    total = parseInt(body.total, 10);

    const page = body.data ?? [];
    const nationalParks = page.filter((p) => p.designation.includes("National Park"));
    allParks.push(...nationalParks);

    start += page.length;
    if (page.length === 0) break; // safety — prevent infinite loop on empty page
  }

  return allParks;
}

// ---------- Main handler ----------

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

    // Verify secrets
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variables de Supabase incompletas");
    }
    if (!NPS_API_KEY) {
      throw new Error("NPS_API_KEY no configurada — agrégala en Supabase Dashboard → Edge Functions → Secrets");
    }

    // Require authenticated admin caller
    const { user, error: authError } = await requireAdmin(req, corsHeaders);
    if (authError) return authError;

    console.log(`[ingest-national-parks] iniciado por ${user.email}`);

    // Service-role client for privileged writes (bypasses RLS)
    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // 1. Pull all National Parks from NPS API
    console.log("[ingest-national-parks] consultando NPS API…");
    const parks = await fetchAllNationalParks(NPS_API_KEY);
    console.log(`[ingest-national-parks] parques nacionales encontrados: ${parks.length}`);

    // 2. Process each park
    let inserted = 0;
    let updated = 0;
    const photoStats: Record<string, number> = {};

    for (const park of parks) {
      const code = park.parkCode.toLowerCase();

      const { latitude, longitude } = parseLatLong(park.latLong);
      const { entrance_fee_usd, entrance_fee_type } = parseEntranceFee(park.entranceFees);
      const hasSurcharge = SURCHARGE_CODES.has(code);

      const heroUrl = park.images?.[0]?.url ?? null;
      const galleryUrls = (park.images ?? [])
        .slice(1)
        .map((img) => img.url)
        .filter(Boolean);

      photoStats[park.parkCode] = (heroUrl ? 1 : 0) + galleryUrls.length;

      // Check if this park already exists in destinations
      const { data: existing, error: selectErr } = await db
        .from("destinations")
        .select("id, slug, is_published")
        .eq("park_code", park.parkCode)
        .maybeSingle();

      if (selectErr) {
        console.error(`[ingest-national-parks] error leyendo ${park.parkCode}:`, selectErr.message);
        continue;
      }

      const existingRow = existing as ExistingRow | null;

      if (existingRow) {
        // UPDATE — never touch: slug, title, is_published, or any Spanish-curated column
        const { error: updateErr } = await db
          .from("destinations")
          .update({
            official_name: park.fullName,
            designation: park.designation,
            country: "Estados Unidos",
            region: park.states,
            latitude,
            longitude,
            entrance_fee_usd,
            entrance_fee_type,
            nps_url: park.url,
            experience_type: "parque-nacional",
            hero_image_url: heroUrl,
            gallery_images: galleryUrls.length > 0 ? galleryUrls : null,
            has_nonresident_surcharge: hasSurcharge,
            nonresident_surcharge: hasSurcharge ? SURCHARGE_AMOUNT : 0,
          })
          .eq("park_code", park.parkCode);

        if (updateErr) {
          console.error(`[ingest-national-parks] error actualizando ${park.parkCode}:`, updateErr.message);
          continue;
        }
        updated++;
      } else {
        // INSERT — slug is generated once and never changed after.
        // title is set to the English official name as a required NOT-NULL placeholder;
        // an Opus session will overwrite it with the curated Spanish title.
        const { error: insertErr } = await db
          .from("destinations")
          .insert({
            park_code: park.parkCode,
            official_name: park.fullName,
            title: park.fullName,             // placeholder — Opus will curate the Spanish title
            slug: slugify(park.fullName),
            designation: park.designation,
            country: "Estados Unidos",
            region: park.states,
            latitude,
            longitude,
            entrance_fee_usd,
            entrance_fee_type,
            nps_url: park.url,
            experience_type: "parque-nacional",
            hero_image_url: heroUrl,
            gallery_images: galleryUrls.length > 0 ? galleryUrls : null,
            has_nonresident_surcharge: hasSurcharge,
            nonresident_surcharge: hasSurcharge ? SURCHARGE_AMOUNT : 0,
            is_published: false,
          });

        if (insertErr) {
          console.error(`[ingest-national-parks] error insertando ${park.parkCode}:`, insertErr.message);
          continue;
        }
        inserted++;
      }

      console.log(`[ingest-national-parks] ${existingRow ? "actualizado" : "insertado"} ${park.parkCode} — fotos: ${photoStats[park.parkCode]}`);
    }

    const summary = {
      ok: true,
      total_national_parks: parks.length,
      inserted,
      updated,
      failed: parks.length - inserted - updated,
      photos: photoStats,
    };

    console.log("[ingest-national-parks] completado", {
      inserted,
      updated,
      failed: summary.failed,
    });

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ingest-national-parks] error no controlado", err);
    const message = err instanceof Error ? err.message : "Error inesperado";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
