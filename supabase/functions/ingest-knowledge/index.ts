// supabase/functions/ingest-knowledge/index.ts
// Nomaderia Adventures — RAG Ingestion Pipeline (section-based)
// Vectorizes destinations → knowledge_chunks, one chunk per content section per park.
// POST /functions/v1/ingest-knowledge
// Body: { "source": "destinations", "park_codes": ["yose"] | "all", "force": true|false }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { requireAdmin } from "../_shared/admin-auth.ts";

const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SUPA_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EMBED_MODEL = "text-embedding-3-small";
// ~800 tokens × 4 chars/token
const MAX_CHUNK_CHARS = 3_200;
// ~100 tokens overlap between split parts
const OVERLAP_CHARS = 400;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface RequestBody {
  source?: string;
  park_codes?: string[] | "all";
  force?: boolean;
}

interface SignatureHike {
  nombre?: string;
  distancia_km?: number | null;
  duracion_horas?: number | null;
  desnivel_m?: number | null;
  nota?: string | null;
  apto_principiante?: boolean;
}

interface LodgingEntry {
  nombre?: string;
  tipo?: string;
  // v1 fields
  rango_precio_usd?: string;
  notas?: string;
  // v2 fields
  precio_usd?: number | null;
  precio_nota?: string;
  dentro_del_parque?: boolean;
  reserva_url?: string;
}

interface DestRow {
  id: string;
  title: string;
  park_code: string | null;
  slug: string;
  content_version?: string | null;
  short_description: string | null;
  difficulty_description: string | null;
  good_for: string[] | null;
  not_ideal_if: string[] | null;
  why_visit_markdown: string | null;
  full_guide_markdown: string | null;
  itinerary_markdown: string | null;
  preparation_plan: string | null;
  gear_list_markdown: string | null;
  safety_markdown: string | null;
  getting_there_markdown: string | null;
  weather_markdown: string | null;
  accessibility_markdown: string | null;
  signature_hikes: SignatureHike[] | null;
  lodging_info: LodgingEntry[] | null;
}

interface ChunkInput {
  content: string;
  source_field: string;
}

// ── JSONB renderers ───────────────────────────────────────────────────────────

function renderProfile(dest: DestRow): string {
  const parts: string[] = [];
  if (dest.short_description?.trim()) parts.push(dest.short_description.trim());
  if (dest.difficulty_description?.trim()) parts.push(dest.difficulty_description.trim());
  if (dest.good_for?.length) parts.push(`Ideal para: ${dest.good_for.join(", ")}.`);
  if (dest.not_ideal_if?.length) parts.push(`No ideal si: ${dest.not_ideal_if.join(". ")}.`);
  return parts.join("\n\n");
}

function renderHikes(hikes: SignatureHike[]): string {
  return hikes
    .filter((h) => h.nombre)
    .map((h) => {
      const stats: string[] = [];
      if (h.distancia_km != null) stats.push(`${h.distancia_km}km`);
      if (h.duracion_horas != null) stats.push(`${h.duracion_horas}h`);
      const statsStr = stats.length ? ` (${stats.join(", ")})` : "";
      const desnivel = h.desnivel_m != null ? `, ${h.desnivel_m}m desnivel` : "";
      const nota = h.nota ? ` — ${h.nota}` : "";
      const apto = `Apto principiante: ${h.apto_principiante ? "sí" : "no"}`;
      return `• ${h.nombre}${statsStr}${desnivel}${nota} ${apto}`;
    })
    .join("\n");
}

function renderLodging(lodging: LodgingEntry[]): string {
  return lodging
    .filter((l) => l.nombre)
    .map((l) => {
      const tipo = l.tipo ? ` (${l.tipo})` : "";
      // Prefer v2 precio_nota; fall back to v1 fields
      const precio = l.precio_nota ?? l.rango_precio_usd ?? l.notas ?? "";
      return `• ${l.nombre}${tipo}${precio ? ` — ${precio}` : ""}`;
    })
    .join("\n");
}

// ── Section chunker ───────────────────────────────────────────────────────────

/**
 * Splits one section's text into ≤MAX_CHUNK_CHARS chunks at paragraph boundaries.
 * Each chunk is prefixed with "Parque: {title} — Sección: {source_field}".
 * When splitting is needed every part gets " (parte N)" appended to source_field.
 */
function chunkSection(title: string, sourceField: string, text: string): ChunkInput[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const prefix = `Parque: ${title} — Sección: ${sourceField}\n\n`;

  if (prefix.length + trimmed.length <= MAX_CHUNK_CHARS) {
    return [{ content: `${prefix}${trimmed}`, source_field: sourceField }];
  }

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const parts: string[] = [];
  let current = "";
  let lastPara = "";

  for (const para of paragraphs) {
    const candidate = current ? `${current}\n\n${para}` : para;
    if (prefix.length + candidate.length > MAX_CHUNK_CHARS && current.length > 0) {
      parts.push(`${prefix}${current.trim()}`);
      // ~100-token overlap: carry the last paragraph into the next chunk
      const overlap =
        lastPara.length <= OVERLAP_CHARS ? lastPara : lastPara.slice(-OVERLAP_CHARS);
      current = overlap ? `${overlap}\n\n${para}` : para;
    } else {
      current = candidate;
    }
    lastPara = para;
  }
  if (current.trim()) parts.push(`${prefix}${current.trim()}`);

  // Degenerate case: all content fit into one part after splitting logic
  if (parts.length === 1) {
    return [{ content: parts[0], source_field: sourceField }];
  }

  return parts.map((content, i) => ({
    content,
    source_field: `${sourceField} (parte ${i + 1})`,
  }));
}

// ── Build all section chunks for one destination ──────────────────────────────

function buildChunks(dest: DestRow): ChunkInput[] {
  const all: ChunkInput[] = [];

  // Direct markdown text sections (one chunk group per column)
  const textSections: Array<[string | null, string]> = [
    [dest.why_visit_markdown, "why_visit"],
    [dest.full_guide_markdown, "guide"],
    [dest.itinerary_markdown, "itinerary"],
    [dest.preparation_plan, "preparation"],
    [dest.gear_list_markdown, "gear"],
    [dest.safety_markdown, "safety"],
    [dest.getting_there_markdown, "getting_there"],
    [dest.weather_markdown, "weather"],
    [dest.accessibility_markdown, "accessibility"],
  ];

  for (const [text, sf] of textSections) {
    if (text?.trim()) all.push(...chunkSection(dest.title, sf, text));
  }

  // Profile: composite text from 4 columns
  const profileText = renderProfile(dest);
  if (profileText.trim()) all.push(...chunkSection(dest.title, "profile", profileText));

  // Hikes: JSONB → readable bullets
  if (Array.isArray(dest.signature_hikes) && dest.signature_hikes.length > 0) {
    const hikesText = renderHikes(dest.signature_hikes as SignatureHike[]);
    if (hikesText.trim()) all.push(...chunkSection(dest.title, "hikes", hikesText));
  }

  // Lodging: JSONB → readable bullets
  if (Array.isArray(dest.lodging_info) && dest.lodging_info.length > 0) {
    const lodgingText = renderLodging(dest.lodging_info as LodgingEntry[]);
    if (lodgingText.trim()) all.push(...chunkSection(dest.title, "lodging", lodgingText));
  }

  return all;
}

// ── OpenAI embeddings ─────────────────────────────────────────────────────────

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.data as Array<{ index: number; embedding: number[] }>)
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

// ── Handler ───────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authResult = await requireAdmin(req, corsHeaders);
  if (authResult.error) return authResult.error;

  try {
    const supabase = createClient(SUPA_URL, SUPA_SERVICE);
    const body = (await req.json().catch(() => ({}))) as RequestBody;

    if (body.source && body.source !== "destinations") {
      return new Response(
        JSON.stringify({ ok: false, error: `source "${body.source}" not supported. Use "destinations".` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const force = body.force === true;
    const isAll =
      !body.park_codes ||
      body.park_codes === "all" ||
      (Array.isArray(body.park_codes) && body.park_codes.length === 0);
    const requestedCodes = isAll ? null : (body.park_codes as string[]);

    // ── Fetch destinations ─────────────────────────────────────────────────

    const baseSelect = [
      "id, title, park_code, slug",
      "short_description, difficulty_description, good_for, not_ideal_if",
      "why_visit_markdown, full_guide_markdown, itinerary_markdown, preparation_plan",
      "gear_list_markdown, safety_markdown, getting_there_markdown, weather_markdown",
      "accessibility_markdown, signature_hikes, lodging_info",
    ].join(", ");

    // Try with content_version; if the column doesn't exist PostgREST returns
    // error code 42703 — fall back silently and skip version-based skipping.
    let destinations: DestRow[] = [];
    let hasContentVersion = false;

    try {
      let q = supabase.from("destinations").select(`${baseSelect}, content_version`);
      if (requestedCodes) q = q.in("park_code", requestedCodes);
      const { data, error } = await q;
      if (error) throw error;
      destinations = (data ?? []) as DestRow[];
      hasContentVersion = true;
    } catch (err) {
      const msg = String(err);
      if (msg.includes("content_version") || msg.includes("42703")) {
        let q = supabase.from("destinations").select(baseSelect);
        if (requestedCodes) q = q.in("park_code", requestedCodes);
        const { data, error } = await q;
        if (error) throw error;
        destinations = (data ?? []) as DestRow[];
      } else {
        throw err;
      }
    }

    if (destinations.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, total_parks: 0, total_chunks: 0, skipped: 0, errors: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Process each park ──────────────────────────────────────────────────

    let totalChunks = 0;
    let skipped = 0;
    const errors: Array<{ park_code: string; error: string }> = [];

    for (const dest of destinations) {
      const parkCode = dest.park_code ?? dest.slug;

      try {
        // ── Version check: skip if content unchanged ────────────────────────
        if (!force && hasContentVersion && dest.content_version) {
          const { data: existing } = await supabase
            .from("knowledge_chunks")
            .select("metadata")
            .eq("source_table", "destinations")
            .eq("source_id", dest.id)
            .limit(1);

          if (existing?.length) {
            const storedVersion =
              (existing[0].metadata as Record<string, unknown>)?.content_version;
            if (storedVersion === dest.content_version) {
              skipped++;
              continue;
            }
          }
        }

        // ── Build section chunks for this destination ───────────────────────
        const chunks = buildChunks(dest);

        // Always delete stale chunks before inserting (idempotent)
        await supabase
          .from("knowledge_chunks")
          .delete()
          .eq("source_table", "destinations")
          .eq("source_id", dest.id);

        if (chunks.length === 0) continue;

        // ── Embed all chunks for this park in one API call ──────────────────
        const embeddings = await embedBatch(chunks.map((c) => c.content));

        // ── Insert new chunks ───────────────────────────────────────────────
        const rows = chunks.map((chunk, i) => ({
          content: chunk.content,
          embedding: embeddings[i],
          source_table: "destinations",
          source_id: dest.id,
          source_field: chunk.source_field,
          metadata: {
            park_code: dest.park_code,
            title: dest.title,
            section: chunk.source_field,
            content_version: hasContentVersion ? (dest.content_version ?? null) : null,
          },
        }));

        for (let i = 0; i < rows.length; i += 100) {
          const { error } = await supabase
            .from("knowledge_chunks")
            .insert(rows.slice(i, i + 100));
          if (error) throw error;
        }

        totalChunks += chunks.length;
      } catch (err) {
        errors.push({ park_code: parkCode, error: String(err) });
      }
    }

    console.log(
      `✅ ingest-knowledge: ${destinations.length} parques encontrados, ` +
        `${skipped} omitidos, ${totalChunks} chunks insertados, ${errors.length} errores`,
    );

    return new Response(
      JSON.stringify({
        ok: errors.length === 0,
        total_parks: destinations.length,
        total_chunks: totalChunks,
        skipped,
        errors,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("ingest-knowledge error:", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
