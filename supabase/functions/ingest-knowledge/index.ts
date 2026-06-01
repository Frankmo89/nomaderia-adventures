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

// ─── Chunking ─────────────────────────────────────────────────────────────────

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
      if (!body.record.is_published) {
        return new Response(
          JSON.stringify({ skipped: "no publicado" }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    }
    const pending: ChunkRow[] = [];

    // ── destinations ──────────────────────────────────────────────────────────
    if (!filterTable || filterTable === "destinations") {
      let q = supabase
        .from("destinations")
        .select(
          "id, slug, title, short_description, full_guide_markdown, itinerary_markdown, preparation_plan, gear_list_markdown, common_fears"
        )
        .eq("is_published", true);

      if (filterId) q = q.eq("id", filterId);

      const { data: dests, error } = await q;
      if (error) throw error;

      for (const dest of dests ?? []) {
        const meta = { slug: dest.slug, title: dest.title };

        // full_guide_markdown
        for (const { content, section } of chunkMarkdown(dest.full_guide_markdown, "Guía completa")) {
          pending.push({
            source_table: "destinations",
            source_id:    dest.id,
            source_field: "full_guide_markdown",
            content,
            metadata:     { ...meta, section },
          });
        }

        // itinerary_markdown
        for (const { content, section } of chunkMarkdown(dest.itinerary_markdown, "Itinerario")) {
          pending.push({
            source_table: "destinations",
            source_id:    dest.id,
            source_field: "itinerary_markdown",
            content,
            metadata:     { ...meta, section },
          });
        }

        // preparation_plan
        for (const { content, section } of chunkMarkdown(dest.preparation_plan, "Preparación física")) {
          pending.push({
            source_table: "destinations",
            source_id:    dest.id,
            source_field: "preparation_plan",
            content,
            metadata:     { ...meta, section },
          });
        }

        // gear_list_markdown
        for (const { content, section } of chunkMarkdown(dest.gear_list_markdown, "Equipo recomendado")) {
          pending.push({
            source_table: "destinations",
            source_id:    dest.id,
            source_field: "gear_list_markdown",
            content,
            metadata:     { ...meta, section },
          });
        }

        // common_fears — cada miedo = 1 chunk
        if (Array.isArray(dest.common_fears)) {
          (dest.common_fears as Array<{ question?: string; answer?: string }>)
            .forEach((fear, i) => {
              if (fear.question && fear.answer) {
                pending.push({
                  source_table: "destinations",
                  source_id:    dest.id,
                  source_field: "common_fears",
                  content:      `Pregunta: ${fear.question}\nRespuesta: ${fear.answer}`,
                  metadata:     { ...meta, section: "Dudas frecuentes", fear_index: i },
                });
              }
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
        JSON.stringify({ message: "Sin contenido publicado para ingestar." }),
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