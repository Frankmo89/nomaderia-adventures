import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { requireAdmin } from "../_shared/admin-auth.ts";
import { NOMADERIA_SOUL } from "../_shared/nomaderia-soul.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o";
const NPS_API_KEY = Deno.env.get("NPS_API_KEY");

const NPS_BASE = "https://developer.nps.gov/api/v1";
const DEFAULT_LIMIT = 3;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── NPS types ─────────────────────────────────────────────────────────────

interface NpsEntranceFee {
  cost: string;
  title: string;
  description: string;
}

interface NpsParkData {
  parkCode: string;
  fullName: string;
  description: string;
  weatherInfo: string;
  directionsInfo: string;
  entranceFees: NpsEntranceFee[];
}

interface NpsThingToDo {
  id: string;
  title: string;
  shortDescription: string;
  duration: string;
  difficulty: string;
  activities: Array<{ name: string }>;
}

// ─── DB row — only fields this function reads or writes ─────────────────────
// Requires migrations: 20260605100000 + 20260606110000

interface ParkRow {
  // identity / context (read only — NEVER write these)
  id: string;
  park_code: string | null;
  official_name: string | null;
  designation: string | null;
  region: string | null;
  is_published: boolean;
  research_status: string | null;
  entrance_fee_usd: number | null;
  entrance_fee_type: string | null;
  // writable content fields
  title: string;
  short_description: string | null;
  why_visit_markdown: string | null;
  difficulty_level: string | null;
  difficulty_description: string | null;
  days_needed: string | null;
  min_days: number | null;
  max_days: number | null;
  best_season: string | null;
  peak_season: string | null;
  season_to_avoid: string | null;
  seasonal_closures: string | null;
  weather_markdown: string | null;
  estimated_budget_usd: number | null;
  getting_there_markdown: string | null;
  nearest_airport: string | null;
  nearest_town: string | null;
  base_city: string | null;
  drive_time_from_la: string | null;
  drive_time_from_san_diego: string | null;
  cell_signal_status: string | null;
  max_elevation_ft: number | null;
  altitude_warning: boolean | null;
  beginner_friendly: boolean | null;
  wildlife: string | null;
  water_availability: string | null;
  safety_markdown: string | null;
  accessibility_markdown: string | null;
  full_guide_markdown: string | null;
  preparation_plan: string | null;
  gear_list_markdown: string | null;
  itinerary_markdown: string | null;
  top_activities: string[] | null;
  signature_hikes: unknown[] | null;
  common_fears: unknown[] | null;
  meta_title: string | null;
  meta_description: string | null;
  tags: string[] | null;
  good_for: string[] | null;
  not_ideal_if: string[] | null;
  internal_notes: string | null;
}

// ─── AI response shape ──────────────────────────────────────────────────────

interface SignatureHike {
  nombre: string;
  distancia_km: number | null;
  duracion_horas: number | null;
  dificultad: string;
  desnivel_m: number | null;
  apto_principiante: boolean;
  nota: string | null;
}

interface CommonFear {
  miedo: string;
  respuesta: string;
}

interface ParkContentAI {
  title?: string;
  short_description?: string;
  why_visit_markdown?: string;
  difficulty_level?: string;
  difficulty_description?: string;
  days_needed?: string;
  min_days?: number;
  max_days?: number;
  best_season?: string;
  peak_season?: string;
  season_to_avoid?: string;
  seasonal_closures?: string;
  weather_markdown?: string;
  estimated_budget_usd?: number;
  getting_there_markdown?: string;
  nearest_airport?: string;
  nearest_town?: string;
  base_city?: string;
  drive_time_from_la?: string;
  drive_time_from_san_diego?: string;
  cell_signal_status?: string;
  max_elevation_ft?: number;
  altitude_warning?: boolean;
  beginner_friendly?: boolean;
  wildlife?: string;
  water_availability?: string;
  safety_markdown?: string;
  accessibility_markdown?: string;
  full_guide_markdown?: string;
  preparation_plan?: string;
  gear_list_markdown?: string;
  itinerary_markdown?: string;
  top_activities?: string[];
  signature_hikes?: unknown[];
  common_fears?: unknown[];
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  good_for?: string[];
  not_ideal_if?: string[];
  verificar?: string[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isEmptyScalar(val: unknown): boolean {
  if (val === null || val === undefined) return true;
  if (typeof val === "string") return val.trim() === "";
  return false; // numbers and booleans are never empty
}

function isEmptyArray(val: unknown): boolean {
  return !Array.isArray(val) || (val as unknown[]).length === 0;
}

function stripJsonFences(raw: string): string {
  return raw
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/im, "")
    .trim();
}

// ─── NPS API ────────────────────────────────────────────────────────────────

async function fetchNpsPark(code: string): Promise<NpsParkData | null> {
  if (!NPS_API_KEY || !code) return null;
  try {
    const url = `${NPS_BASE}/parks?api_key=${encodeURIComponent(NPS_API_KEY)}&parkCode=${encodeURIComponent(code.toLowerCase())}&limit=1`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      console.warn(`[generate-park-content] NPS parks HTTP ${res.status} for ${code}`);
      return null;
    }
    const body = await res.json() as { data?: NpsParkData[] };
    return body.data?.[0] ?? null;
  } catch (e) {
    console.warn(`[generate-park-content] NPS parks error ${code}:`, e);
    return null;
  }
}

async function fetchNpsThingsToDo(code: string): Promise<NpsThingToDo[]> {
  if (!NPS_API_KEY || !code) return [];
  try {
    const url = `${NPS_BASE}/thingstodo?api_key=${encodeURIComponent(NPS_API_KEY)}&parkCode=${encodeURIComponent(code.toLowerCase())}&limit=8`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) return [];
    const body = await res.json() as { data?: NpsThingToDo[] };
    return body.data ?? [];
  } catch {
    return [];
  }
}

// ─── Prompt ─────────────────────────────────────────────────────────────────

const TASK_INSTRUCTION = `
## Tu tarea: borrador editorial de parque nacional

Genera el borrador completo en español para un parque nacional de EE. UU. en la plataforma Nomaderia.
Responde SOLO con un objeto JSON válido — sin markdown fences, sin texto antes ni después.
Incluye solo los campos sobre los que tienes confianza razonable; omite los demás.
Agrega en el campo "verificar" los nombres de campos con datos que deberían confirmarse en fuentes oficiales.

CONTRATOS JSONB OBLIGATORIOS:
- signature_hikes: [{nombre:string, distancia_km:number|null, duracion_horas:number|null, dificultad:string, desnivel_m:number|null, apto_principiante:boolean, nota:string|null}]
- common_fears: [{miedo:string, respuesta:string}]

RESTRICCIONES DE LONGITUD:
- full_guide_markdown: ≤400 palabras, Markdown con secciones ##
- itinerary_markdown: ≤250 palabras, formato por días
- preparation_plan: ≤150 palabras, lista Markdown
- gear_list_markdown: ≤150 palabras, lista por categoría
- weather_markdown, getting_there_markdown, safety_markdown: ≤150 palabras cada uno
- accessibility_markdown: ≤100 palabras
- Texto plano (best_season, wildlife, etc.): 1-3 oraciones

REGLAS EXACTAS:
- difficulty_level: EXACTAMENTE "easy", "moderate" o "challenging" (sin más texto)
- beginner_friendly: boolean (true si alguien sin experiencia puede disfrutar el parque)
- altitude_warning: boolean (true si > 7000 pies con ganancia de elevación significativa)
- estimated_budget_usd: número entero — USD por persona, ~3 noches (transporte terrestre + entrada + alojamiento + comida, sin vuelos intercontinentales)
- min_days / max_days: números enteros
- meta_title: ≤60 caracteres, incluye nombre del parque
- meta_description: ≤155 caracteres
- No inventes datos de recreation.gov, permisos ni camping — esos campos son de otra función
`.trim();

function buildUserPrompt(
  row: ParkRow,
  npsData: NpsParkData | null,
  things: NpsThingToDo[],
): string {
  const lines: string[] = ["## FUENTE: NPS API\n"];

  lines.push(`Nombre oficial: ${row.official_name ?? row.title}`);
  lines.push(`Código NPS: ${row.park_code ?? "—"}`);
  lines.push(`Designación: ${row.designation ?? "National Park"}`);
  lines.push(`Estado(s): ${row.region ?? "EE. UU."}`);

  if (npsData) {
    if (npsData.description)    lines.push(`\nDescripción NPS:\n${npsData.description}`);
    if (npsData.weatherInfo)    lines.push(`\nClima NPS:\n${npsData.weatherInfo}`);
    if (npsData.directionsInfo) lines.push(`\nDirecciones NPS:\n${npsData.directionsInfo}`);
    if (npsData.entranceFees?.length) {
      const feeStr = npsData.entranceFees
        .map((f) => `  - ${f.title}: $${f.cost} — ${f.description}`)
        .join("\n");
      lines.push(`\nTarifas de entrada NPS:\n${feeStr}`);
    }
  }

  if (things.length > 0) {
    lines.push("\n## ACTIVIDADES (thingstodo NPS)\n");
    for (const t of things.slice(0, 6)) {
      const acts = t.activities?.map((a) => a.name).join(", ") ?? "";
      lines.push(`- ${t.title} | ${t.difficulty || "N/D"} | ${t.duration || "N/D"} | ${acts}`);
      if (t.shortDescription) lines.push(`  ${t.shortDescription}`);
    }
  }

  // Surface any existing content as reference so the model doesn't contradict it
  const hasExisting = !isEmptyScalar(row.short_description) || !isEmptyScalar(row.why_visit_markdown);
  if (hasExisting) {
    lines.push("\n## CONTENIDO YA EXISTENTE (solo referencia)\n");
    if (!isEmptyScalar(row.short_description)) lines.push(`short_description: ${row.short_description}`);
    if (!isEmptyScalar(row.best_season))       lines.push(`best_season: ${row.best_season}`);
    if (!isEmptyScalar(row.why_visit_markdown)) lines.push("why_visit_markdown: (ya existe)");
  }

  lines.push(`
## ESQUEMA DE RESPUESTA

Devuelve SOLO este JSON. Omite campos que no puedas rellenar con seguridad.

{
  "title": "Nombre natural en español",
  "short_description": "2-3 oraciones. Voz Nomaderia. Perfil ideal del visitante.",
  "why_visit_markdown": "1 párrafo — gancho emocional para alguien que nunca ha salido de la ciudad",
  "difficulty_level": "easy|moderate|challenging",
  "difficulty_description": "Evaluación honesta para principiante. Qué puede hacer sin entrenamiento especial.",
  "days_needed": "2-3 días",
  "min_days": 2,
  "max_days": 4,
  "best_season": "Primavera y otoño. Razón concreta.",
  "peak_season": "Julio-agosto.",
  "season_to_avoid": "Verano por calor extremo.",
  "seasonal_closures": "Tioga Road cerrada noviembre-mayo (null si no aplica).",
  "weather_markdown": "## Clima\\n...",
  "estimated_budget_usd": 350,
  "getting_there_markdown": "## Cómo Llegar\\n...",
  "nearest_airport": "SFO — San Francisco International",
  "nearest_town": "Mariposa, CA",
  "base_city": "Merced",
  "drive_time_from_la": "5 horas en coche",
  "drive_time_from_san_diego": "6 horas en coche",
  "cell_signal_status": "Sin señal en la mayor parte del parque",
  "max_elevation_ft": 8000,
  "altitude_warning": false,
  "beginner_friendly": true,
  "wildlife": "Osos negros, ciervos de cola negra, coyotes, aves rapaces...",
  "water_availability": "Agua potable en visitor centers. No disponible en senderos remotos.",
  "safety_markdown": "## Seguridad\\n...",
  "accessibility_markdown": "## Accesibilidad\\n...",
  "full_guide_markdown": "## Guía Completa\\n### Introducción\\n...\\n### Qué hacer\\n...",
  "preparation_plan": "## Preparación\\n- Reserva con 6 meses de anticipación\\n- ...",
  "gear_list_markdown": "## Qué Llevar\\n### Esencial\\n- Botas de trail\\n### Opcional\\n- ...",
  "itinerary_markdown": "## Itinerario Sugerido\\n### Día 1\\n...",
  "top_activities": ["senderismo", "observación de fauna", "fotografía de paisajes"],
  "signature_hikes": [
    { "nombre": "Nombre del sendero", "distancia_km": 4.8, "duracion_horas": 3.0, "dificultad": "moderada", "desnivel_m": 147, "apto_principiante": true, "nota": "El sendero más icónico" }
  ],
  "common_fears": [
    { "miedo": "¿Es muy difícil para alguien sin experiencia?", "respuesta": "..." },
    { "miedo": "¿Qué hago si me encuentro con un oso?", "respuesta": "..." },
    { "miedo": "¿Puedo ir sin reservar nada?", "respuesta": "..." }
  ],
  "meta_title": "Parque Nacional X | Guía en español para principiantes",
  "meta_description": "Qué ver y hacer en el Parque Nacional X. Guía completa en español para hispanohablantes.",
  "tags": ["parque-nacional", "california", "senderismo"],
  "good_for": ["familias con niños", "principiantes en outdoor", "fotógrafos"],
  "not_ideal_if": ["necesitas sombra constante en verano", "tienes movilidad reducida en senderos"],
  "verificar": ["drive_time_from_la", "max_elevation_ft"]
}`);

  return lines.join("\n");
}

// ─── OpenAI ───────────────────────────────────────────────────────────────────

async function callOpenAI(userPrompt: string): Promise<ParkContentAI> {
  const systemPrompt = `${NOMADERIA_SOUL}\n\n---\n\n${TASK_INSTRUCTION}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      max_tokens: 4500,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new Error("OpenAI no devolvió contenido");

  return JSON.parse(stripJsonFences(raw)) as ParkContentAI;
}

// ─── JSONB coercers ───────────────────────────────────────────────────────────

function coerceSignatureHike(item: unknown): SignatureHike | null {
  if (typeof item !== "object" || item === null) return null;
  const h = item as Record<string, unknown>;
  if (typeof h.nombre !== "string" || !h.nombre.trim()) return null;
  return {
    nombre: h.nombre.trim(),
    distancia_km: typeof h.distancia_km === "number" ? h.distancia_km : null,
    duracion_horas: typeof h.duracion_horas === "number" ? h.duracion_horas : null,
    dificultad: typeof h.dificultad === "string" ? h.dificultad : "moderada",
    desnivel_m: typeof h.desnivel_m === "number" ? h.desnivel_m : null,
    apto_principiante: typeof h.apto_principiante === "boolean" ? h.apto_principiante : true,
    nota: typeof h.nota === "string" ? h.nota : null,
  };
}

function coerceCommonFear(item: unknown): CommonFear | null {
  if (typeof item !== "object" || item === null) return null;
  const f = item as Record<string, unknown>;
  const miedo = typeof f.miedo === "string" ? f.miedo.trim() : "";
  const respuesta = typeof f.respuesta === "string" ? f.respuesta.trim() : "";
  if (!miedo || !respuesta) return null;
  return { miedo, respuesta };
}

// ─── Patch builder ───────────────────────────────────────────────────────────

function buildPatch(
  row: ParkRow,
  ai: ParkContentAI,
  force: boolean,
  npsData: NpsParkData | null,
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};

  const writeStr = (col: string, val: string | undefined | null, existing: unknown) => {
    if (!val || (typeof val === "string" && !val.trim())) return;
    if (!force && !isEmptyScalar(existing)) return;
    patch[col] = val;
  };

  const writeNum = (col: string, val: number | undefined | null, existing: unknown) => {
    if (typeof val !== "number" || !Number.isFinite(val)) return;
    if (!force && !isEmptyScalar(existing)) return;
    patch[col] = val;
  };

  const writeBool = (col: string, val: boolean | undefined, existing: unknown) => {
    if (typeof val !== "boolean") return;
    if (!force && existing !== null && existing !== undefined) return;
    patch[col] = val;
  };

  const writeArr = (col: string, val: string[] | undefined | null, existing: unknown) => {
    if (!Array.isArray(val) || val.length === 0) return;
    if (!force && !isEmptyArray(existing)) return;
    patch[col] = val;
  };

  // title: only if still the English NPS placeholder or force
  const isTitlePlaceholder = row.official_name != null && row.title === row.official_name;
  if (ai.title?.trim() && (force || isTitlePlaceholder || isEmptyScalar(row.title))) {
    patch.title = ai.title.trim();
  }

  writeStr("short_description",        ai.short_description,        row.short_description);
  writeStr("why_visit_markdown",        ai.why_visit_markdown,        row.why_visit_markdown);
  writeStr("difficulty_description",   ai.difficulty_description,   row.difficulty_description);
  writeStr("days_needed",              ai.days_needed,              row.days_needed);
  writeNum("min_days",                 ai.min_days,                 row.min_days);
  writeNum("max_days",                 ai.max_days,                 row.max_days);
  writeStr("best_season",              ai.best_season,              row.best_season);
  writeStr("peak_season",              ai.peak_season,              row.peak_season);
  writeStr("season_to_avoid",          ai.season_to_avoid,          row.season_to_avoid);
  writeStr("seasonal_closures",        ai.seasonal_closures,        row.seasonal_closures);
  writeStr("weather_markdown",         ai.weather_markdown,         row.weather_markdown);
  writeNum("estimated_budget_usd",     ai.estimated_budget_usd != null ? Math.round(ai.estimated_budget_usd) : null, row.estimated_budget_usd);
  writeStr("getting_there_markdown",   ai.getting_there_markdown,   row.getting_there_markdown);
  writeStr("nearest_airport",          ai.nearest_airport,          row.nearest_airport);
  writeStr("nearest_town",             ai.nearest_town,             row.nearest_town);
  writeStr("base_city",                ai.base_city,                row.base_city);
  writeStr("drive_time_from_la",       ai.drive_time_from_la,       row.drive_time_from_la);
  writeStr("drive_time_from_san_diego", ai.drive_time_from_san_diego, row.drive_time_from_san_diego);
  writeStr("cell_signal_status",       ai.cell_signal_status,       row.cell_signal_status);
  writeNum("max_elevation_ft",         ai.max_elevation_ft != null ? Math.round(ai.max_elevation_ft) : null, row.max_elevation_ft);
  writeBool("altitude_warning",        ai.altitude_warning,         row.altitude_warning);
  writeBool("beginner_friendly",       ai.beginner_friendly,        row.beginner_friendly);
  writeStr("wildlife",                 ai.wildlife,                 row.wildlife);
  writeStr("water_availability",       ai.water_availability,       row.water_availability);
  writeStr("safety_markdown",          ai.safety_markdown,          row.safety_markdown);
  writeStr("accessibility_markdown",   ai.accessibility_markdown,   row.accessibility_markdown);
  writeStr("full_guide_markdown",      ai.full_guide_markdown,      row.full_guide_markdown);
  writeStr("preparation_plan",         ai.preparation_plan,         row.preparation_plan);
  writeStr("gear_list_markdown",       ai.gear_list_markdown,       row.gear_list_markdown);
  writeStr("itinerary_markdown",       ai.itinerary_markdown,       row.itinerary_markdown);
  writeArr("top_activities",           ai.top_activities,           row.top_activities);
  writeArr("tags",                     ai.tags,                     row.tags);
  writeArr("good_for",                 ai.good_for,                 row.good_for);
  writeArr("not_ideal_if",             ai.not_ideal_if,             row.not_ideal_if);
  writeStr("meta_title",               ai.meta_title,               row.meta_title);
  writeStr("meta_description",         ai.meta_description,         row.meta_description);

  // difficulty_level: validate enum
  if (
    typeof ai.difficulty_level === "string" &&
    ["easy", "moderate", "challenging"].includes(ai.difficulty_level)
  ) {
    writeStr("difficulty_level", ai.difficulty_level, row.difficulty_level);
  }

  // signature_hikes: validate JSONB contract before writing
  if (Array.isArray(ai.signature_hikes) && ai.signature_hikes.length > 0) {
    if (force || isEmptyArray(row.signature_hikes)) {
      const valid = ai.signature_hikes
        .map(coerceSignatureHike)
        .filter((h): h is SignatureHike => h !== null);
      if (valid.length > 0) patch.signature_hikes = valid;
    }
  }

  // common_fears: validate JSONB contract ({miedo, respuesta}) before writing
  if (Array.isArray(ai.common_fears) && ai.common_fears.length > 0) {
    if (force || isEmptyArray(row.common_fears)) {
      const valid = ai.common_fears
        .map(coerceCommonFear)
        .filter((f): f is CommonFear => f !== null);
      if (valid.length > 0) patch.common_fears = valid;
    }
  }

  // entrance fees: only from NPS source, only when currently empty
  if (
    npsData?.entranceFees?.length &&
    (row.entrance_fee_usd === null || row.entrance_fee_usd === 0)
  ) {
    const vehicleFee = npsData.entranceFees.find(
      (f) =>
        f.title.toLowerCase().includes("vehicle") ||
        f.description.toLowerCase().includes("vehicle"),
    );
    if (vehicleFee) {
      const cost = parseFloat(vehicleFee.cost);
      if (!Number.isNaN(cost) && cost > 0) {
        patch.entrance_fee_usd = Math.round(cost);
        patch.entrance_fee_type = "por vehículo";
      }
    }
  }

  // research_status: advance to ai_draft, never degrade verificado/publicado
  const status = row.research_status;
  if (status !== "verificado" && status !== "publicado") {
    patch.research_status = "ai_draft";
  }

  // internal_notes: append verificar flags (never replace existing notes)
  if (Array.isArray(ai.verificar) && ai.verificar.length > 0) {
    const flag = `⚠️ VERIFICAR (IA) [${new Date().toISOString().slice(0, 10)}]: ${ai.verificar.join(", ")}`;
    const existing = row.internal_notes?.trim() ?? "";
    patch.internal_notes = existing ? `${existing}\n\n${flag}` : flag;
  }

  return patch;
}

// ─── Main handler ────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Método no permitido" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Variables de Supabase incompletas");
    }
    if (!OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY no configurada — agrégala en Supabase Dashboard → Edge Functions → Secrets",
      );
    }

    const { user, error: authError } = await requireAdmin(req, corsHeaders);
    if (authError) return authError;

    let body: { park_code?: string; force?: boolean; limit?: number } = {};
    try { body = await req.json(); } catch { /* empty body is ok */ }

    const parkCodeFilter: string | undefined = body.park_code;
    const force: boolean = body.force === true;
    const limit: number =
      typeof body.limit === "number" ? Math.min(Math.max(1, body.limit), 10) : DEFAULT_LIMIT;

    console.log(
      `[generate-park-content] iniciado por ${user.email} | park_code=${parkCodeFilter ?? "batch"} | force=${force} | limit=${limit}`,
    );

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const SELECT_COLS = [
      "id, park_code, official_name, title, designation, region",
      "research_status, is_published",
      "entrance_fee_usd, entrance_fee_type",
      "short_description, why_visit_markdown",
      "difficulty_level, difficulty_description, days_needed, min_days, max_days",
      "best_season, peak_season, season_to_avoid, seasonal_closures, weather_markdown",
      "estimated_budget_usd",
      "getting_there_markdown, nearest_airport, nearest_town, base_city",
      "drive_time_from_la, drive_time_from_san_diego, cell_signal_status",
      "max_elevation_ft, altitude_warning, beginner_friendly",
      "wildlife, water_availability, safety_markdown, accessibility_markdown",
      "full_guide_markdown, preparation_plan, gear_list_markdown, itinerary_markdown",
      "top_activities, signature_hikes, common_fears",
      "meta_title, meta_description, tags",
      "good_for, not_ideal_if, internal_notes",
    ].join(", ");

    let query = db
      .from("destinations")
      .select(SELECT_COLS)
      .eq("experience_type", "parque-nacional");

    if (parkCodeFilter) {
      // Single park by code — no eligibility filter
      query = query.eq("park_code", parkCodeFilter);
    } else if (force) {
      // force=true: re-run ai_draft parks too, still skip verified/published
      query = query
        .filter("research_status", "not.in", "(verificado,publicado)")
        .eq("is_published", false);
    } else {
      // Default: only parks awaiting first generation
      query = query.eq("research_status", "pendiente").eq("is_published", false);
    }

    const { data: rows, error: fetchErr } = await query.limit(limit);
    if (fetchErr) throw fetchErr;

    const batch = (rows ?? []) as ParkRow[];
    console.log(`[generate-park-content] batch: ${batch.length} parque(s)`);

    let procesados = 0;
    const detalle: Array<{
      park_code: string | null;
      status: "ok" | "error";
      fields?: string[];
      reason?: string;
    }> = [];

    for (const row of batch) {
      procesados++;
      const code = row.park_code ?? "";
      try {
        const [npsData, things] = await Promise.all([
          fetchNpsPark(code),
          fetchNpsThingsToDo(code),
        ]);

        const ai = await callOpenAI(buildUserPrompt(row, npsData, things));
        const patch = buildPatch(row, ai, force, npsData);

        const { error: updateErr } = await db
          .from("destinations")
          .update(patch)
          .eq("id", row.id);

        if (updateErr) throw new Error(updateErr.message);

        const writtenFields = Object.keys(patch).filter(
          (k) => k !== "research_status" && k !== "internal_notes",
        );
        console.log(
          `[generate-park-content] ok: ${row.official_name ?? code} | ${writtenFields.length} campos`,
        );
        detalle.push({ park_code: code, status: "ok", fields: writtenFields });
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        console.error(`[generate-park-content] error ${code}:`, reason);
        detalle.push({ park_code: code, status: "error", reason });
      }
    }

    // Count parks still awaiting generation
    const { count: restantes } = await db
      .from("destinations")
      .select("id", { count: "exact", head: true })
      .eq("experience_type", "parque-nacional")
      .eq("research_status", "pendiente")
      .eq("is_published", false);

    const summary = { ok: true, procesados, restantes: restantes ?? 0, detalle };
    console.log("[generate-park-content] completado", { procesados, restantes: restantes ?? 0 });

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[generate-park-content] error no controlado", err);
    const message = err instanceof Error ? err.message : "Error inesperado";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
