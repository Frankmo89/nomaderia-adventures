// supabase/functions/ingest-knowledge/index.ts
// Nomaderia Adventures — RAG Ingestion Pipeline (section-based)
// Vectorizes destinations → knowledge_chunks, one chunk per content section per park.
// POST /functions/v1/ingest-knowledge
// Body: { "source": "destinations", "park_codes": ["yose"] | "all", "force": true|false }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")!;
const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SUPA_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const EMBED_MODEL = "text-embedding-3-small";
const MAX_CHUNK_CHARS = 3_200;
const OVERLAP_CHARS = 400;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody { source?: string; park_codes?: string[] | "all"; force?: boolean; }
interface SignatureHike { nombre?: string; distancia_km?: number | null; duracion_horas?: number | null; desnivel_m?: number | null; nota?: string | null; apto_principiante?: boolean; }
interface LodgingEntry { nombre?: string; tipo?: string; rango_precio_usd?: string; notas?: string; precio_usd?: number | null; precio_nota?: string; dentro_del_parque?: boolean; reserva_url?: string; }
interface FearEntry { miedo?: string; respuesta?: string; question?: string; answer?: string; }
interface FaqEntry { pregunta?: string; respuesta?: string; question?: string; answer?: string; }
interface NearbyPark { slug?: string; nombre?: string; millas?: number; horas?: string; }
interface GatewayAirport { code?: string; nombre?: string; horas_al_parque?: string; }
interface ItineraryBudget { gasolina_estimada_sd_usd?: number; entrada_parque_usd?: number; hospedaje_noche_usd?: number; comida_dia_persona_usd?: number; nota?: string; }
interface CrowdCalendar { evita?: string; ideal?: string; nota?: string; }
interface SpecialDate { nombre?: string; cuando?: string; nota?: string; }
interface ZoneClosure { zona?: string; razon?: string; cuando?: string; nota?: string; }
interface PhotoSpot { nombre?: string; momento?: string; coordenadas?: string; nota?: string; }
interface CampgroundRow { nombre: string; nota_soul?: string | null; precio_usd?: number | null; precio_nota?: string | null; rv_max_pies?: number | null; tiene_agua?: boolean | null; senal_celular?: string | null; es_recomendado?: boolean | null; }

interface DestRow {
  id: string; title: string; park_code: string | null; slug: string; content_version?: string | null;
  short_description: string | null; difficulty_description: string | null; good_for: string[] | null; not_ideal_if: string[] | null;
  why_visit_markdown: string | null; itinerary_markdown: string | null; preparation_plan: string | null;
  gear_list_markdown: string | null; safety_markdown: string | null; getting_there_markdown: string | null; weather_markdown: string | null;
  accessibility_markdown: string | null; with_kids_markdown: string | null; food_nearby_markdown: string | null; pet_policy_markdown: string | null;
  seasonal_closures: string | null; wildlife: string | null;
  signature_hikes: SignatureHike[] | null; lodging_info: LodgingEntry[] | null; common_fears: FearEntry[] | null; faqs: FaqEntry[] | null;
  concierge_quick_facts: string | null; best_basecamp: string | null; signature_experience: string | null;
  crowd_calendar: CrowdCalendar | null; nearby_parks: { vecinos?: NearbyPark[]; nota?: string } | null;
  gateway_airport: GatewayAirport | null; itinerary_budget: ItineraryBudget | null;
  special_dates: SpecialDate[] | null; zone_closures: ZoneClosure[] | null;
  rv_max_length_ft: number | null; backcountry_camping_free: boolean | null; photo_spots: PhotoSpot[] | null;
  campgrounds_list?: CampgroundRow[];
}

interface ChunkInput { content: string; source_field: string; }

function renderProfile(dest: DestRow): string {
  const parts: string[] = [];
  if (dest.short_description?.trim()) parts.push(dest.short_description.trim());
  if (dest.difficulty_description?.trim()) parts.push(dest.difficulty_description.trim());
  if (dest.good_for?.length) parts.push(`Ideal para: ${dest.good_for.join(", ")}.`);
  if (dest.not_ideal_if?.length) parts.push(`No ideal si: ${dest.not_ideal_if.join(". ")}.`);
  return parts.join("\n\n");
}
function renderHikes(hikes: SignatureHike[]): string {
  return hikes.filter((h) => h.nombre).map((h) => {
    const stats: string[] = [];
    if (h.distancia_km != null) stats.push(`${h.distancia_km}km`);
    if (h.duracion_horas != null) stats.push(`${h.duracion_horas}h`);
    const statsStr = stats.length ? ` (${stats.join(", ")})` : "";
    const desnivel = h.desnivel_m != null ? `, ${h.desnivel_m}m desnivel` : "";
    const nota = h.nota ? ` — ${h.nota}` : "";
    const apto = `Apto principiante: ${h.apto_principiante ? "sí" : "no"}`;
    return `• ${h.nombre}${statsStr}${desnivel}${nota} ${apto}`;
  }).join("\n");
}
function renderLodging(lodging: LodgingEntry[]): string {
  return lodging.filter((l) => l.nombre).map((l) => {
    const tipo = l.tipo ? ` (${l.tipo})` : "";
    const precio = l.precio_nota ?? l.rango_precio_usd ?? l.notas ?? "";
    return `• ${l.nombre}${tipo}${precio ? ` — ${precio}` : ""}`;
  }).join("\n");
}
function renderFears(fears: FearEntry[]): string {
  return fears.map((f) => {
    const q = (f.miedo ?? f.question ?? "").trim();
    const a = (f.respuesta ?? f.answer ?? "").trim();
    return q && a ? `P: ${q}\nR: ${a}` : (q || a);
  }).filter(Boolean).join("\n\n");
}
function renderFaqs(faqs: FaqEntry[]): string {
  return faqs.map((f) => {
    const q = (f.pregunta ?? f.question ?? "").trim();
    const a = (f.respuesta ?? f.answer ?? "").trim();
    return q && a ? `P: ${q}\nR: ${a}` : (q || a);
  }).filter(Boolean).join("\n\n");
}
function renderNearbyParks(data: { vecinos?: NearbyPark[]; nota?: string }): string {
  const parts: string[] = [];
  if (data.vecinos?.length) {
    const lines = data.vecinos.filter((v) => v.nombre).map((v) => `• ${v.nombre} — ${v.millas ?? "?"} millas (${v.horas ?? "tiempo variable"})`);
    if (lines.length) parts.push(lines.join("\n"));
  }
  if (data.nota?.trim()) parts.push(data.nota.trim());
  return parts.join("\n\n");
}
function renderGatewayAirport(a: GatewayAirport): string {
  if (!a.code) return "";
  return `Aeropuerto de entrada: ${a.code} (${a.nombre ?? ""}) — ${a.horas_al_parque ?? ""} al parque.`;
}
function renderItineraryBudget(b: ItineraryBudget): string {
  const parts: string[] = [];
  if (b.gasolina_estimada_sd_usd != null) parts.push(`Gasolina estimada desde San Diego: $${b.gasolina_estimada_sd_usd} USD`);
  if (b.entrada_parque_usd != null) parts.push(`Entrada al parque: $${b.entrada_parque_usd} USD`);
  if (b.hospedaje_noche_usd != null) parts.push(`Hospedaje por noche: ~$${b.hospedaje_noche_usd} USD`);
  if (b.comida_dia_persona_usd != null) parts.push(`Comida por día por persona: ~$${b.comida_dia_persona_usd} USD`);
  if (b.nota?.trim()) parts.push(b.nota.trim());
  return parts.join("\n");
}
function renderCrowdCalendar(c: CrowdCalendar): string {
  const parts: string[] = [];
  if (c.evita?.trim()) parts.push(`Evita: ${c.evita.trim()}`);
  if (c.ideal?.trim()) parts.push(`Momento ideal: ${c.ideal.trim()}`);
  if (c.nota?.trim()) parts.push(c.nota.trim());
  return parts.join("\n");
}
function renderSpecialDates(dates: SpecialDate[]): string {
  return dates.filter((d) => d.nombre).map((d) => {
    const nota = d.nota ? ` — ${d.nota}` : "";
    return `• ${d.nombre}: ${d.cuando ?? ""}${nota}`;
  }).join("\n");
}
function renderPhotoSpots(spots: PhotoSpot[]): string {
  return spots.filter((s) => s.nombre).map((s) => {
    const nota = s.nota ? ` — ${s.nota}` : "";
    const momento = s.momento ? ` (mejor momento: ${s.momento})` : "";
    const coords = s.coordenadas ? ` [${s.coordenadas}]` : "";
    return `• ${s.nombre}${momento}${coords}${nota}`;
  }).join("\n");
}
function renderCampgrounds(campgrounds: CampgroundRow[]): string {
  return campgrounds.filter((c) => c.nombre).map((c) => {
    const precio = c.precio_nota ?? (c.precio_usd != null ? `$${c.precio_usd}/noche` : "");
    const rv = c.rv_max_pies ? `, RV máx ${c.rv_max_pies} ft` : "";
    const agua = c.tiene_agua === false ? ", sin agua potable" : "";
    const senal = c.senal_celular ? `, señal: ${c.senal_celular}` : "";
    const nota = c.nota_soul ? ` — ${c.nota_soul}` : "";
    return `• ${c.nombre}${c.es_recomendado ? " (recomendado)" : ""}: ${precio}${rv}${agua}${senal}${nota}`;
  }).join("\n");
}
function renderZoneClosures(closures: ZoneClosure[]): string {
  return closures.filter((z) => z.zona).map((z) => {
    const nota = z.nota ? ` — ${z.nota}` : "";
    return `• ${z.zona}: cierra por ${z.razon ?? "?"}, ${z.cuando ?? "?"}${nota}`;
  }).join("\n");
}

function chunkSection(title: string, sourceField: string, text: string): ChunkInput[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const prefix = `Parque: ${title} — Sección: ${sourceField}\n\n`;
  if (prefix.length + trimmed.length <= MAX_CHUNK_CHARS) {
    return [{ content: `${prefix}${trimmed}`, source_field: sourceField }];
  }
  const paragraphs = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 0);
  const parts: string[] = [];
  let current = "";
  let lastPara = "";
  for (const para of paragraphs) {
    const candidate = current ? `${current}\n\n${para}` : para;
    if (prefix.length + candidate.length > MAX_CHUNK_CHARS && current.length > 0) {
      parts.push(`${prefix}${current.trim()}`);
      const overlap = lastPara.length <= OVERLAP_CHARS ? lastPara : lastPara.slice(-OVERLAP_CHARS);
      current = overlap ? `${overlap}\n\n${para}` : para;
    } else { current = candidate; }
    lastPara = para;
  }
  if (current.trim()) parts.push(`${prefix}${current.trim()}`);
  if (parts.length === 1) return [{ content: parts[0], source_field: sourceField }];
  return parts.map((content, i) => ({ content, source_field: `${sourceField} (parte ${i + 1})` }));
}

function buildChunks(dest: DestRow): ChunkInput[] {
  const all: ChunkInput[] = [];
  const textSections: Array<[string | null, string]> = [
    [dest.why_visit_markdown, "why_visit"], [dest.itinerary_markdown, "itinerary"], [dest.preparation_plan, "preparation"],
    [dest.gear_list_markdown, "gear"], [dest.safety_markdown, "safety"], [dest.getting_there_markdown, "getting_there"],
    [dest.weather_markdown, "weather"], [dest.accessibility_markdown, "accessibility"], [dest.with_kids_markdown, "with_kids"],
    [dest.food_nearby_markdown, "food_nearby"], [dest.pet_policy_markdown, "pet_policy"], [dest.seasonal_closures, "seasonal_closures"],
    [dest.wildlife, "wildlife"], [dest.concierge_quick_facts, "quick_facts"], [dest.best_basecamp, "basecamp"], [dest.signature_experience, "signature_experience"],
  ];
  for (const [text, sf] of textSections) { if (text?.trim()) all.push(...chunkSection(dest.title, sf, text)); }
  const profileText = renderProfile(dest);
  if (profileText.trim()) all.push(...chunkSection(dest.title, "profile", profileText));
  if (Array.isArray(dest.signature_hikes) && dest.signature_hikes.length > 0) {
    const t = renderHikes(dest.signature_hikes as SignatureHike[]);
    if (t.trim()) all.push(...chunkSection(dest.title, "hikes", t));
  }
  if (Array.isArray(dest.lodging_info) && dest.lodging_info.length > 0) {
    const t = renderLodging(dest.lodging_info as LodgingEntry[]);
    if (t.trim()) all.push(...chunkSection(dest.title, "lodging", t));
  }
  if (Array.isArray(dest.common_fears) && dest.common_fears.length > 0) {
    const t = renderFears(dest.common_fears as FearEntry[]);
    if (t.trim()) all.push(...chunkSection(dest.title, "common_fears", t));
  }
  if (Array.isArray(dest.faqs) && dest.faqs.length > 0) {
    const t = renderFaqs(dest.faqs as FaqEntry[]);
    if (t.trim()) all.push(...chunkSection(dest.title, "faqs", t));
  }
  if (dest.nearby_parks && (dest.nearby_parks.vecinos?.length || dest.nearby_parks.nota)) {
    const t = renderNearbyParks(dest.nearby_parks);
    if (t.trim()) all.push(...chunkSection(dest.title, "nearby_parks", t));
  }
  if (dest.gateway_airport?.code) {
    const t = renderGatewayAirport(dest.gateway_airport);
    if (t.trim()) all.push(...chunkSection(dest.title, "gateway_airport", t));
  }
  if (dest.itinerary_budget && Object.keys(dest.itinerary_budget).length > 0) {
    const t = renderItineraryBudget(dest.itinerary_budget);
    if (t.trim()) all.push(...chunkSection(dest.title, "budget", t));
  }
  if (dest.crowd_calendar && (dest.crowd_calendar.evita || dest.crowd_calendar.ideal)) {
    const t = renderCrowdCalendar(dest.crowd_calendar);
    if (t.trim()) all.push(...chunkSection(dest.title, "crowd_calendar", t));
  }
  if (Array.isArray(dest.special_dates) && dest.special_dates.length > 0) {
    const t = renderSpecialDates(dest.special_dates);
    if (t.trim()) all.push(...chunkSection(dest.title, "special_dates", t));
  }
  if (Array.isArray(dest.zone_closures) && dest.zone_closures.length > 0) {
    const t = renderZoneClosures(dest.zone_closures);
    if (t.trim()) all.push(...chunkSection(dest.title, "zone_closures", t));
  }
  if (Array.isArray(dest.photo_spots) && dest.photo_spots.length > 0) {
    const t = renderPhotoSpots(dest.photo_spots);
    if (t.trim()) all.push(...chunkSection(dest.title, "photo_spots", t));
  }
  const rvParts: string[] = [];
  if (dest.rv_max_length_ft != null) rvParts.push(`RV/tráiler máximo: ${dest.rv_max_length_ft} pies.`);
  if (dest.backcountry_camping_free) rvParts.push("Se permite acampar libre en backcountry sin campground establecido (apto mochilero).");
  if (rvParts.length) all.push(...chunkSection(dest.title, "rv_backcountry_info", rvParts.join(" ")));
  if (dest.campgrounds_list && dest.campgrounds_list.length > 0) {
    const t = renderCampgrounds(dest.campgrounds_list);
    if (t.trim()) all.push(...chunkSection(dest.title, "campgrounds", t));
  }
  return all;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST", headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: EMBED_MODEL, input: texts }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return (data.data as Array<{ index: number; embedding: number[] }>).sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(SUPA_URL, SUPA_SERVICE);
    const body = (await req.json().catch(() => ({}))) as RequestBody;
    if (body.source && body.source !== "destinations") {
      return new Response(JSON.stringify({ ok: false, error: `source "${body.source}" not supported. Use "destinations".` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const force = body.force === true;
    const isAll = !body.park_codes || body.park_codes === "all" || (Array.isArray(body.park_codes) && body.park_codes.length === 0);
    const requestedCodes = isAll ? null : (body.park_codes as string[]);
    const baseSelect = [
      "id, title, park_code, slug", "short_description, difficulty_description, good_for, not_ideal_if",
      "why_visit_markdown, itinerary_markdown, preparation_plan", "gear_list_markdown, safety_markdown, getting_there_markdown, weather_markdown",
      "accessibility_markdown, signature_hikes, lodging_info", "with_kids_markdown, food_nearby_markdown, pet_policy_markdown",
      "seasonal_closures, common_fears, faqs, wildlife", "concierge_quick_facts, best_basecamp, signature_experience",
      "crowd_calendar, nearby_parks, gateway_airport, itinerary_budget", "special_dates, zone_closures",
      "rv_max_length_ft, backcountry_camping_free, photo_spots",
    ].join(", ");
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
      } else { throw err; }
    }
    if (destinations.length === 0) {
      return new Response(JSON.stringify({ ok: true, total_parks: 0, total_chunks: 0, skipped: 0, errors: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    let totalChunks = 0; let skipped = 0;
    const errors: Array<{ park_code: string; error: string }> = [];
    for (const dest of destinations) {
      const parkCode = dest.park_code ?? dest.slug;
      try {
        if (!force && hasContentVersion && dest.content_version) {
          const { data: existing } = await supabase.from("knowledge_chunks").select("metadata").eq("source_table", "destinations").eq("source_id", dest.id).limit(1);
          if (existing?.length) {
            const storedVersion = (existing[0].metadata as Record<string, unknown>)?.content_version;
            if (storedVersion === dest.content_version) { skipped++; continue; }
          }
        }
        const chunks = buildChunks(dest);
        await supabase.from("knowledge_chunks").delete().eq("source_table", "destinations").eq("source_id", dest.id);
        if (chunks.length === 0) continue;
        const embeddings = await embedBatch(chunks.map((c) => c.content));
        const rows = chunks.map((chunk, i) => ({
          content: chunk.content, embedding: embeddings[i], source_table: "destinations", source_id: dest.id, source_field: chunk.source_field,
          metadata: { park_code: dest.park_code, title: dest.title, section: chunk.source_field, content_version: hasContentVersion ? (dest.content_version ?? null) : null },
        }));
        for (let i = 0; i < rows.length; i += 100) {
          const { error } = await supabase.from("knowledge_chunks").insert(rows.slice(i, i + 100));
          if (error) throw error;
        }
        totalChunks += chunks.length;
      } catch (err) { errors.push({ park_code: parkCode, error: String(err) }); }
    }
    console.log(`✅ ingest-knowledge: ${destinations.length} parques encontrados, ${skipped} omitidos, ${totalChunks} chunks insertados, ${errors.length} errores`);
    return new Response(JSON.stringify({ ok: errors.length === 0, total_parks: destinations.length, total_chunks: totalChunks, skipped, errors }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("ingest-knowledge error:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
