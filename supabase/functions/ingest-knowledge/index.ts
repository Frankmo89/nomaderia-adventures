// supabase/functions/ingest-knowledge/index.ts
// Nomaderia Adventures — RAG Ingestion Pipeline
// Vectoriza destinations + gear_articles → knowledge_chunks
// Invocar: POST /functions/v1/ingest-knowledge
// Body opcional: { "source_table": "destinations", "source_id": "uuid" }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Config ──────────────────────────────────────────────────────────────────
const OPENAI_KEY   = Deno.env.get("OPENAI_API_KEY")!;
const SUPA_URL     = Deno.env.get("SUPABASE_URL")!;
const SUPA_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMBED_MODEL  = "text-embedding-3-small";
const CHUNK_SIZE   = 1200;
const BATCH_SIZE   = 50;

// ─── Gear chunking (unchanged — used only for gear_articles) ─────────────────

function chunkPlainText(text: string, prefix = ""): string[] {
  if (!text?.trim()) return [];
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 30);
  const chunks: string[] = [];
  let current = prefix ? `${prefix}\n` : "";
  for (const para of paragraphs) {
    if (current.length + para.length > CHUNK_SIZE && current.trim()) {
      chunks.push(current.trim());
      current = prefix ? `${prefix}\n` : "";
    }
    current += `${para}\n\n`;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function chunkMarkdown(
  markdown: string,
  fallbackLabel: string
): Array<{ content: string; section: string }> {
  if (!markdown?.trim()) return [];
  const rawSections = markdown.split(/(?=^#{1,3} .+)/m);
  const result: Array<{ content: string; section: string }> = [];
  for (const raw of rawSections) {
    const lines    = raw.split("\n");
    const firstLine = lines[0] ?? "";
    const isHeader  = firstLine.startsWith("#");
    const section   = isHeader
      ? firstLine.replace(/^#+\s+/, "").trim()
      : fallbackLabel;
    const body = lines.slice(isHeader ? 1 : 0).join("\n");
    const chunks = chunkPlainText(body, `[${section}]`);
    for (const content of chunks) {
      result.push({ content, section });
    }
  }
  if (!result.length) {
    return chunkPlainText(markdown, `[${fallbackLabel}]`).map((content) => ({
      content,
      section: fallbackLabel,
    }));
  }
  return result;
}

// ─── Destination ficha types ─────────────────────────────────────────────────

interface PermitInfo {
  nombre?: string;
  tipo?: string;
  dificultad_de_conseguir?: string;
  cuando_abre?: string;
  reserva_url?: string;
  notas?: string;
}

interface SignatureHike {
  nombre?: string;
  distancia?: string;
  dificultad?: string;
  tiempo?: string;
  permiso_requerido?: boolean;
  descripcion?: string;
}

interface LodgingInfo {
  nombre?: string;
  tipo?: string;
  rango_precio_usd?: string;
  reserva_url?: string;
  notas?: string;
}

interface CommonFear {
  question?: string;
  answer?: string;
}

interface DestinationRow {
  id: string;
  slug: string;
  title: string;
  official_name?: string | null;
  region?: string | null;
  park_code?: string | null;
  why_visit_markdown?: string | null;
  short_description?: string | null;
  drive_time_from_la?: string | null;
  drive_time_from_san_diego?: string | null;
  nearest_airport?: string | null;
  nearest_town?: string | null;
  getting_there_markdown?: string | null;
  entrance_fee_usd?: number | null;
  entrance_fee_type?: string | null;
  has_nonresident_surcharge?: boolean | null;
  best_season?: string | null;
  season_to_avoid?: string | null;
  seasonal_closures?: string | null;
  weather_markdown?: string | null;
  requires_permit?: boolean | null;
  timed_entry_required?: boolean | null;
  permits_info?: PermitInfo[] | null;
  signature_hikes?: SignatureHike[] | null;
  lodging_info?: LodgingInfo[] | null;
  wildlife?: string | null;
  water_availability?: string | null;
  altitude_warning?: boolean | null;
  max_elevation_ft?: number | null;
  safety_markdown?: string | null;
  full_guide_markdown?: string | null;
  itinerary_markdown?: string | null;
  gear_list_markdown?: string | null;
  preparation_plan?: string | null;
  common_fears?: CommonFear[] | null;
  is_published: boolean;
  updated_at: string;
}

// ─── Destination ficha helpers ────────────────────────────────────────────────

/** Returns a non-empty, non-"null" string or null. */
function val(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s && s !== "null" && s !== "undefined" ? s : null;
}

/** The one-line park identity header prepended to every section chunk. */
function buildParkLabel(dest: DestinationRow): string {
  const namepart =
    dest.official_name && dest.official_name !== dest.title
      ? `${dest.title} (${dest.official_name})`
      : dest.title;
  return dest.region ? `# ${namepart} — ${dest.region}` : `# ${namepart}`;
}

/**
 * Assembles a full Spanish "ficha de conocimiento" for one destination.
 * Sections whose fields are all empty are silently omitted.
 */
function buildDestinationFicha(dest: DestinationRow): string {
  const blocks: string[] = [];

  // ── Intro (# header + opening description) ───────────────────────────────
  const introText = val(dest.why_visit_markdown) ?? val(dest.short_description);
  const introHeader = buildParkLabel(dest);
  blocks.push(introText ? `${introHeader}\n\n${introText}` : introHeader);

  // ── Cómo llegar ──────────────────────────────────────────────────────────
  {
    const lines: string[] = [];
    if (val(dest.drive_time_from_la))
      lines.push(`Desde Los Ángeles: ${val(dest.drive_time_from_la)}.`);
    if (val(dest.drive_time_from_san_diego))
      lines.push(`Desde San Diego: ${val(dest.drive_time_from_san_diego)}.`);
    if (val(dest.nearest_airport))
      lines.push(`Aeropuerto: ${val(dest.nearest_airport)}.`);
    if (val(dest.nearest_town))
      lines.push(`Pueblo de apoyo: ${val(dest.nearest_town)}.`);
    if (val(dest.getting_there_markdown))
      lines.push(val(dest.getting_there_markdown)!);
    if (lines.length)
      blocks.push(`## Cómo llegar\n${lines.join("\n")}`);
  }

  // ── Costos ───────────────────────────────────────────────────────────────
  {
    const lines: string[] = [];
    if (dest.entrance_fee_usd !== null && dest.entrance_fee_usd !== undefined) {
      const fee = dest.entrance_fee_usd;
      const type = val(dest.entrance_fee_type);
      lines.push(
        fee === 0
          ? "Entrada gratuita."
          : `Entrada: ${fee} USD${type ? ` ${type}` : ""}.`
      );
    }
    if (dest.has_nonresident_surcharge) {
      lines.push(
        "Recargo para no residentes (16+): 100 USD por persona. " +
        "El pase America the Beautiful para no residentes (250 USD) cubre todo el vehículo " +
        "y conviene con 2+ parques con recargo."
      );
    }
    if (lines.length)
      blocks.push(`## Costos\n${lines.join("\n")}`);
  }

  // ── Mejor temporada ──────────────────────────────────────────────────────
  {
    const lines: string[] = [];
    if (val(dest.best_season))
      lines.push(`Mejor época: ${val(dest.best_season)}.`);
    if (val(dest.season_to_avoid))
      lines.push(`Evitar: ${val(dest.season_to_avoid)}.`);
    if (val(dest.seasonal_closures))
      lines.push(`Cierres: ${val(dest.seasonal_closures)}.`);
    if (val(dest.weather_markdown))
      lines.push(val(dest.weather_markdown)!);
    if (lines.length)
      blocks.push(`## Mejor temporada\n${lines.join("\n")}`);
  }

  // ── Permisos ─────────────────────────────────────────────────────────────
  {
    const lines: string[] = [];
    if (dest.requires_permit)
      lines.push("Este parque requiere permiso para ciertos senderos o zonas.");
    if (dest.timed_entry_required)
      lines.push("Se requiere entrada con horario programado (timed entry).");
    if (Array.isArray(dest.permits_info)) {
      for (const p of dest.permits_info as PermitInfo[]) {
        if (!p) continue;
        const parts: string[] = [];
        if (val(p.nombre)) parts.push(val(p.nombre)!);
        if (val(p.tipo))   parts.push(`(${val(p.tipo)})`);
        const suffix: string[] = [];
        if (val(p.dificultad_de_conseguir))
          suffix.push(`dificultad ${val(p.dificultad_de_conseguir)}`);
        if (val(p.cuando_abre))
          suffix.push(`abre ${val(p.cuando_abre)}`);
        if (val(p.reserva_url))
          suffix.push(`reserva: ${val(p.reserva_url)}`);
        if (suffix.length) parts.push(`: ${suffix.join(". ")}.`);
        if (val(p.notas))  parts.push(` ${val(p.notas)}`);
        const line = parts.join(" ").trim();
        if (line) lines.push(line);
      }
    }
    if (lines.length)
      blocks.push(`## Permisos\n${lines.join("\n")}`);
  }

  // ── Senderos destacados ──────────────────────────────────────────────────
  {
    const lines: string[] = [];
    if (Array.isArray(dest.signature_hikes)) {
      for (const h of dest.signature_hikes as SignatureHike[]) {
        if (!h) continue;
        const parts: string[] = [];
        if (val(h.nombre))    parts.push(val(h.nombre)!);
        if (val(h.distancia)) parts.push(`: ${val(h.distancia)}`);
        if (val(h.dificultad)) parts.push(`, dificultad ${val(h.dificultad)}`);
        if (val(h.tiempo))    parts.push(`, ${val(h.tiempo)}`);
        parts.push(".");
        if (h.permiso_requerido) parts.push(" Requiere permiso.");
        if (val(h.descripcion))  parts.push(` ${val(h.descripcion)}`);
        const line = parts.join("").trim();
        if (line) lines.push(line);
      }
    }
    if (lines.length)
      blocks.push(`## Senderos destacados\n${lines.join("\n")}`);
  }

  // ── Dónde dormir ─────────────────────────────────────────────────────────
  {
    const lines: string[] = [];
    if (Array.isArray(dest.lodging_info)) {
      for (const l of dest.lodging_info as LodgingInfo[]) {
        if (!l) continue;
        const parts: string[] = [];
        if (val(l.nombre)) parts.push(val(l.nombre)!);
        if (val(l.tipo))   parts.push(` (${val(l.tipo)})`);
        if (val(l.rango_precio_usd)) parts.push(`, ${val(l.rango_precio_usd)}`);
        if (val(l.reserva_url)) parts.push(`. Reserva: ${val(l.reserva_url)}`);
        if (val(l.notas))  parts.push(`. ${val(l.notas)}`);
        const line = parts.join("").trim();
        if (line) lines.push(line);
      }
    }
    if (lines.length)
      blocks.push(`## Dónde dormir\n${lines.join("\n")}`);
  }

  // ── Seguridad ────────────────────────────────────────────────────────────
  {
    const lines: string[] = [];
    if (val(dest.wildlife))
      lines.push(`Fauna: ${val(dest.wildlife)}.`);
    if (val(dest.water_availability))
      lines.push(`Agua: ${val(dest.water_availability)}.`);
    if (dest.altitude_warning && dest.max_elevation_ft)
      lines.push(`Altitud hasta ${dest.max_elevation_ft} pies — riesgo de mal de altura.`);
    if (val(dest.safety_markdown))
      lines.push(val(dest.safety_markdown)!);
    if (lines.length)
      blocks.push(`## Seguridad\n${lines.join("\n")}`);
  }

  // ── Long-form markdown sections ──────────────────────────────────────────
  if (val(dest.full_guide_markdown))
    blocks.push(`## Guía completa\n${val(dest.full_guide_markdown)!}`);
  if (val(dest.itinerary_markdown))
    blocks.push(`## Itinerario sugerido\n${val(dest.itinerary_markdown)!}`);
  if (val(dest.gear_list_markdown))
    blocks.push(`## Equipo recomendado\n${val(dest.gear_list_markdown)!}`);
  if (val(dest.preparation_plan))
    blocks.push(`## Preparación\n${val(dest.preparation_plan)!}`);

  // ── Dudas comunes ─────────────────────────────────────────────────────────
  if (Array.isArray(dest.common_fears)) {
    const qaLines: string[] = [];
    for (const f of dest.common_fears as CommonFear[]) {
      if (f.question && f.answer)
        qaLines.push(`**P: ${f.question}**\nR: ${f.answer}`);
    }
    if (qaLines.length)
      blocks.push(`## Dudas comunes\n${qaLines.join("\n\n")}`);
  }

  return blocks.join("\n\n");
}

/**
 * Splits a ficha on "## " headers into self-contained chunks.
 * The park identity label is prepended to every ## section chunk.
 * Large sections are further split by paragraph while preserving context.
 */
function chunkFicha(
  ficha: string,
  parkLabel: string,
): Array<{ content: string; section: string }> {
  if (!ficha.trim()) return [];

  const blocks = ficha.split(/(?=^## )/m).filter((b) => b.trim());
  const result: Array<{ content: string; section: string }> = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    const firstLine = trimmed.split("\n")[0];
    const isSection = firstLine.startsWith("## ");
    const section = isSection
      ? firstLine.replace(/^## /, "").trim()
      : "Presentación";

    // Intro block already contains the # park label.
    // Section blocks get the park label prepended so each chunk is self-contained.
    const prefix = isSection ? `${parkLabel}\n\n` : "";
    const fullContent = `${prefix}${trimmed}`;

    if (fullContent.length <= CHUNK_SIZE) {
      result.push({ content: fullContent, section });
      continue;
    }

    // Paragraph-level sub-chunking for large sections
    const sectionHeader = `${prefix}${firstLine}\n`;
    const bodyText = trimmed.split("\n").slice(1).join("\n");
    const paragraphs = bodyText
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    let current = sectionHeader;
    for (const para of paragraphs) {
      if (
        current.length + para.length + 2 > CHUNK_SIZE &&
        current.trim().length > sectionHeader.trim().length
      ) {
        result.push({ content: current.trim(), section });
        current = sectionHeader;
      }
      current += `${para}\n\n`;
    }
    const leftover = current.trim();
    if (leftover.length > sectionHeader.trim().length) {
      result.push({ content: leftover, section });
    }
  }

  return result;
}

// ─── OpenAI Embeddings ────────────────────────────────────────────────────────

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return (data.data as Array<{ index: number; embedding: number[] }>)
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

// ─── Tipos internos ───────────────────────────────────────────────────────────

interface ChunkRow {
  source_table: string;
  source_id:    string;
  source_field: string;
  content:      string;
  metadata:     Record<string, unknown>;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const supabase = createClient(SUPA_URL, SUPA_SERVICE);
    const body = await req.json().catch(() => ({})) as {
      source_table?: string;
      source_id?:    string;
      type?:         string;
      table?:        string;
      record?:       Record<string, unknown>;
    };

    // Detectar formato: webhook de Supabase vs llamada directa
    let filterTable = body.source_table;
    let filterId    = body.source_id;

    if (body.record && body.table) {
      filterTable = body.table as string;
      filterId    = body.record.id as string;
      // All destinations are ingested regardless of is_published.
      // is_published is stored in chunk metadata so the concierge can disclaim
      // unreviewed (draft) content at query time. (Decision: option 3, 2026-06-05)
    }

    const pending: ChunkRow[] = [];

    // ── destinations ──────────────────────────────────────────────────────────
    if (!filterTable || filterTable === "destinations") {
      let q = supabase
        .from("destinations")
        .select(
          [
            "id, slug, title, official_name, region, park_code",
            "why_visit_markdown, short_description",
            "drive_time_from_la, drive_time_from_san_diego",
            "nearest_airport, nearest_town, getting_there_markdown",
            "entrance_fee_usd, entrance_fee_type, has_nonresident_surcharge",
            "best_season, season_to_avoid, seasonal_closures, weather_markdown",
            "requires_permit, timed_entry_required, permits_info",
            "signature_hikes, lodging_info",
            "wildlife, water_availability, altitude_warning, max_elevation_ft, safety_markdown",
            "full_guide_markdown, itinerary_markdown, gear_list_markdown, preparation_plan",
            "common_fears, is_published, updated_at",
          ].join(", ")
        );
      // No is_published filter — all destinations are indexed.
      // Unpublished rows are marked in chunk metadata.

      if (filterId) q = q.eq("id", filterId);

      const { data: dests, error } = await q;
      if (error) throw error;

      for (const dest of (dests ?? []) as DestinationRow[]) {
        const parkLabel = buildParkLabel(dest);
        const ficha     = buildDestinationFicha(dest);

        const baseMeta = {
          slug:             dest.slug,
          title:            dest.title,
          park_code:        dest.park_code ?? null,
          park_title:       dest.title,
          is_published:     dest.is_published,
          last_verified_at: dest.updated_at,
        };

        for (const { content, section } of chunkFicha(ficha, parkLabel)) {
          pending.push({
            source_table: "destinations",
            source_id:    dest.id,
            source_field: "ficha",
            content,
            metadata: {
              ...baseMeta,
              section,        // backward-compat key used by concierge-agent
              section_title:  section,
            },
          });
        }
      }
    }

    // ── gear_articles ─────────────────────────────────────────────────────────
    if (!filterTable || filterTable === "gear_articles") {
      let q = supabase
        .from("gear_articles")
        .select("id, slug, title, content_markdown, products");

      if (filterId) q = q.eq("id", filterId);

      const { data: articles, error } = await q;
      if (error) throw error;

      for (const article of articles ?? []) {
        const meta = { slug: article.slug, title: article.title };

        // content principal
        for (const { content, section } of chunkMarkdown(article.content_markdown, article.title)) {
          pending.push({
            source_table: "gear_articles",
            source_id:    article.id,
            source_field: "content",
            content,
            metadata:     { ...meta, section },
          });
        }

        // products jsonb — cada producto = 1 chunk
        if (Array.isArray(article.products)) {
          (article.products as Array<{ name?: string; description?: string; price?: string }>)
            .forEach((p, i) => {
              if (!p.name) return;
              const content = [
                `Producto: ${p.name}`,
                p.description ? `Descripción: ${p.description}` : null,
                p.price       ? `Precio aproximado: ${p.price}`  : null,
              ]
                .filter(Boolean)
                .join("\n");
              pending.push({
                source_table: "gear_articles",
                source_id:    article.id,
                source_field: "products",
                content,
                metadata:     { ...meta, section: "Producto recomendado", product_index: i },
              });
            });
        }
      }
    }

    if (!pending.length) {
      return new Response(
        JSON.stringify({ message: "Sin contenido para ingestar." }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Embeddings en lotes ───────────────────────────────────────────────────
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const texts = pending.slice(i, i + BATCH_SIZE).map((c) => c.content);
      const batch = await embedBatch(texts);
      allEmbeddings.push(...batch);
    }

    // ── Borrar chunks anteriores del scope ────────────────────────────────────
    if (filterTable && filterId) {
      await supabase
        .from("knowledge_chunks")
        .delete()
        .eq("source_table", filterTable)
        .eq("source_id", filterId);
    } else if (filterTable) {
      await supabase
        .from("knowledge_chunks")
        .delete()
        .eq("source_table", filterTable);
    } else {
      await supabase
        .from("knowledge_chunks")
        .delete()
        .in("source_table", ["destinations", "gear_articles"]);
    }

    // ── Insert en lotes de 100 ────────────────────────────────────────────────
    const rows = pending.map((chunk, i) => ({
      content:      chunk.content,
      embedding:    allEmbeddings[i],
      source_table: chunk.source_table,
      source_id:    chunk.source_id,
      source_field: chunk.source_field,
      metadata:     chunk.metadata,
    }));

    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await supabase
        .from("knowledge_chunks")
        .insert(rows.slice(i, i + 100));
      if (error) throw error;
    }

    const destCount = pending.filter((c) => c.source_table === "destinations").length;
    const gearCount = pending.filter((c) => c.source_table === "gear_articles").length;

    console.log(`✅ ${rows.length} chunks (destinos: ${destCount}, gear: ${gearCount})`);

    return new Response(
      JSON.stringify({
        success:         true,
        chunks_ingested: rows.length,
        breakdown: {
          destinations:  destCount,
          gear_articles: gearCount,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("ingest-knowledge error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
