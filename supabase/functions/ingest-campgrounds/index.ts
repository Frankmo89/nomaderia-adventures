import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { requireAdmin } from "../_shared/admin-auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const NPS_API_KEY = Deno.env.get("NPS_API_KEY");
const NPS_BASE = "https://developer.nps.gov/api/v1";
const NPS_PAGE_SIZE = 50;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Request / response types ─────────────────────────────────────────────────

interface RequestBody {
  park_code?: string;
  force?: boolean;
  limit?: number;
}

// ─── NPS /campgrounds response types ─────────────────────────────────────────

interface NpsCampAddress {
  postalCode: string;
  city: string;
  stateCode: string;
  line1: string;
  line2?: string;
  line3?: string;
  type: string;
}

interface NpsCampFee {
  cost: string;
  description: string;
  title: string;
}

interface NpsCampsites {
  totalSites: string;
  group?: string;
  horse?: string;
  tentOnly?: string;
  electricalHookups?: string;
  rvOnly?: string;
  walkBoatTo?: string;
  other?: string;
}

interface NpsCampAmenities {
  potableWater: string[];
  toilets: string[];
  cellPhoneReception: string;
  amphitheater: string;
  dumpStation: string;
  campStore: string;
  trashRecyclingCollection: string;
  internetConnectivity: string;
  foodStorageLockers: string;
}

interface NpsCampAccessibility {
  rvMaxLength: number;
}

interface NpsCampground {
  id: string;
  name: string;
  parkCode: string;
  latitude: string;
  longitude: string;
  latLong: string;
  numberOfSitesReservable: string;
  numberOfSitesFirstComeFirstServe: string;
  reservationUrl: string;
  campsites: NpsCampsites;
  amenities: NpsCampAmenities;
  accessibility: NpsCampAccessibility;
  addresses: NpsCampAddress[];
  fees: NpsCampFee[];
}

interface NpsCampgroundsResponse {
  total: string;
  limit: string;
  start: string;
  data: NpsCampground[];
}

// ─── Destination row (only what this function reads) ──────────────────────────

interface DestRow {
  id: string;
  title: string;
  park_code: string;
  is_published: boolean;
}

// ─── Amenidades JSONB shape ────────────────────────────────────────────────────

interface AmenidadesJsonb {
  agua_potable: boolean;
  banos: string;
  internet: boolean;
  recoleccion_basura: boolean;
  casilleros_comida: boolean;
  tienda: boolean;
  estacion_vaciado_rv: boolean;
  anfiteatro: boolean;
}

// ─── Per-park result ──────────────────────────────────────────────────────────

interface ParkDetalle {
  park_code: string;
  status: "procesado" | "saltado" | "error";
  inserted: number;
  updated: number;
  reason?: string;
}

// ─── NPS fetch with pagination ────────────────────────────────────────────────

async function fetchNpsCampgrounds(
  parkCode: string,
  apiKey: string,
): Promise<NpsCampground[]> {
  const all: NpsCampground[] = [];
  let start = 0;
  let total = Infinity;

  while (start < total) {
    const url =
      `${NPS_BASE}/campgrounds?api_key=${encodeURIComponent(apiKey)}` +
      `&parkCode=${encodeURIComponent(parkCode)}` +
      `&limit=${NPS_PAGE_SIZE}&start=${start}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `NPS campgrounds HTTP ${res.status} para ${parkCode}: ${body.slice(0, 200)}`,
      );
    }
    const json = (await res.json()) as NpsCampgroundsResponse;
    const page = json.data ?? [];
    all.push(...page);
    if (start === 0) {
      const parsed = parseInt(json.total ?? "0", 10);
      total = isNaN(parsed) ? page.length : parsed;
    }
    start += page.length;
    if (page.length === 0) break;
  }

  return all;
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function parseLatLon(c: NpsCampground): { lat: number | null; lon: number | null } {
  const lat = parseFloat(c.latitude);
  const lon = parseFloat(c.longitude);
  if (!isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)) return { lat, lon };
  const latM = (c.latLong ?? "").match(/lat:\s*([-\d.]+)/i);
  const lonM = (c.latLong ?? "").match(/long:\s*([-\d.]+)/i);
  if (latM && lonM) {
    const la = parseFloat(latM[1]);
    const lo = parseFloat(lonM[1]);
    if (!isNaN(la) && !isNaN(lo)) return { lat: la, lon: lo };
  }
  return { lat: null, lon: null };
}

function parseDireccion(addresses: NpsCampAddress[]): string | null {
  const addr = addresses.find((a) => a.type === "Physical") ?? addresses[0];
  if (!addr) return null;
  const parts = [
    addr.line1?.trim(),
    addr.city?.trim(),
    `${addr.stateCode?.trim() ?? ""} ${addr.postalCode?.trim() ?? ""}`.trim(),
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function parseNumSitios(c: NpsCampground): number | null {
  const total = parseInt(c.campsites?.totalSites ?? "", 10);
  if (!isNaN(total) && total > 0) return total;
  const reservable = parseInt(c.numberOfSitesReservable ?? "0", 10);
  const fcfs = parseInt(c.numberOfSitesFirstComeFirstServe ?? "0", 10);
  const sum = (isNaN(reservable) ? 0 : reservable) + (isNaN(fcfs) ? 0 : fcfs);
  return sum > 0 ? sum : null;
}

function parsePrecioUsd(fees: NpsCampFee[]): number | null {
  if (!fees || fees.length === 0) return null;
  const excluded = (title: string) => {
    const l = title.toLowerCase();
    return l.includes("group") || l.includes("senior") || l.includes("access");
  };
  const standard = fees.filter((f) => !excluded(f.title ?? ""));
  const best =
    standard.find((f) => {
      const t = (f.title ?? "").toLowerCase();
      return t.includes("campsite") || t.includes("per night") || t.includes("night");
    }) ?? standard[0];
  if (!best) return null;
  const val = parseFloat((best.cost ?? "").replace(/[^0-9.]/g, ""));
  return !isNaN(val) && val > 0 ? val : null;
}

function parseTieneAgua(potableWater: string[]): boolean {
  return (potableWater ?? []).some((v) => v.trim().toLowerCase() !== "no");
}

function parseBanos(toilets: string[]): string {
  const joined = (toilets ?? []).join(" ").toLowerCase();
  if (joined.includes("flush")) return "con descarga";
  if (joined.includes("vault") || joined.includes("pit")) return "pozo";
  return "ninguno";
}

function parseRvMaxPies(accessibility: NpsCampAccessibility): number | null {
  const v = accessibility?.rvMaxLength;
  return typeof v === "number" && v > 0 ? v : null;
}

function parseSenalCelular(cellPhoneReception: string): string | null {
  const v = (cellPhoneReception ?? "").toLowerCase().trim();
  if (v === "no") return "Sin señal";
  if (v.includes("yes")) return "Hay señal";
  return null;
}

function buildAmenidades(amenities: NpsCampAmenities): AmenidadesJsonb {
  const yesLike = (s: string) => (s ?? "").toLowerCase().includes("yes");
  return {
    agua_potable: parseTieneAgua(amenities?.potableWater ?? []),
    banos: parseBanos(amenities?.toilets ?? []),
    internet: yesLike(amenities?.internetConnectivity ?? ""),
    recoleccion_basura: yesLike(amenities?.trashRecyclingCollection ?? ""),
    casilleros_comida: yesLike(amenities?.foodStorageLockers ?? ""),
    tienda: yesLike(amenities?.campStore ?? ""),
    estacion_vaciado_rv: yesLike(amenities?.dumpStation ?? ""),
    anfiteatro: yesLike(amenities?.amphitheater ?? ""),
  };
}

function buildWritePayload(c: NpsCampground): Record<string, unknown> {
  const { lat, lon } = parseLatLon(c);
  return {
    nps_code: c.id,
    latitude: lat,
    longitude: lon,
    direccion: parseDireccion(c.addresses ?? []),
    num_sitios: parseNumSitios(c),
    precio_usd: parsePrecioUsd(c.fees ?? []),
    reservable: parseInt(c.numberOfSitesReservable ?? "0", 10) > 0,
    reserva_url: c.reservationUrl || null,
    tiene_agua: parseTieneAgua(c.amenities?.potableWater ?? []),
    banos: parseBanos(c.amenities?.toilets ?? []),
    rv_max_pies: parseRvMaxPies(c.accessibility),
    senal_celular: parseSenalCelular(c.amenities?.cellPhoneReception ?? ""),
    amenidades: buildAmenidades(c.amenities),
  };
}

// ─── Match by nps_code or nombre, then update or insert ───────────────────────

type DbClient = ReturnType<typeof createClient>;

async function upsertCampground(
  c: NpsCampground,
  destinationId: string,
  db: DbClient,
): Promise<"inserted" | "updated"> {
  const payload = buildWritePayload(c);
  const nombre = (c.name ?? "").trim();

  // 1. Match by nps_code (preferred — stable NPS identifier)
  const { data: rawByCode, error: codeErr } = await db
    .from("campgrounds")
    .select("id")
    .eq("destination_id", destinationId)
    .eq("nps_code", c.id)
    .limit(1);
  if (codeErr) throw new Error(`Error buscando por nps_code: ${codeErr.message}`);
  const byCode = (rawByCode ?? []) as Array<{ id: string }>;
  if (byCode.length > 0) {
    const { error: upErr } = await db
      .from("campgrounds")
      .update(payload)
      .eq("id", byCode[0].id);
    if (upErr) throw new Error(`Error actualizando por nps_code: ${upErr.message}`);
    return "updated";
  }

  // 2. Match by nombre (case-insensitive trimmed equality)
  if (nombre) {
    const { data: rawByName, error: nameErr } = await db
      .from("campgrounds")
      .select("id")
      .eq("destination_id", destinationId)
      .ilike("nombre", nombre)
      .limit(1);
    if (nameErr) throw new Error(`Error buscando por nombre: ${nameErr.message}`);
    const byName = (rawByName ?? []) as Array<{ id: string }>;
    if (byName.length > 0) {
      const { error: upErr } = await db
        .from("campgrounds")
        .update(payload)
        .eq("id", byName[0].id);
      if (upErr) throw new Error(`Error actualizando por nombre: ${upErr.message}`);
      return "updated";
    }
  }

  // 3. Insert — write cols + nombre + destination_id; curated cols left null/default
  const { error: insErr } = await db.from("campgrounds").insert({
    ...payload,
    nombre,
    destination_id: destinationId,
  });
  if (insErr) throw new Error(`Error insertando campamento: ${insErr.message}`);
  return "inserted";
}

// ─── Main handler ─────────────────────────────────────────────────────────────

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

    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const force = body.force ?? false;
    const limit = Math.min(Math.max(1, body.limit ?? 5), 50);
    const parkCodeFilter = body.park_code?.toLowerCase();

    console.log(
      `[ingest-campgrounds] iniciado por ${user.email} — force=${force} limit=${limit}${parkCodeFilter ? ` park=${parkCodeFilter}` : ""}`,
    );

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Fetch destinations to process (same query shape as ingest-park-permits)
    let query = db
      .from("destinations")
      .select("id, title, park_code, is_published")
      .not("park_code", "is", null)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (parkCodeFilter) {
      query = query.eq("park_code", parkCodeFilter);
    } else if (!force) {
      query = query.eq("is_published", false);
    }

    const { data: rows, error: dbErr } = await query;
    if (dbErr) throw new Error(`Error consultando destinos: ${dbErr.message}`);

    const destinations = (rows ?? []) as DestRow[];

    const { count: totalPending } = await db
      .from("destinations")
      .select("id", { count: "exact", head: true })
      .not("park_code", "is", null)
      .eq("is_published", false);

    let totalInserted = 0;
    let totalUpdated = 0;
    let procesados = 0;
    const detalle: ParkDetalle[] = [];

    for (const dest of destinations) {
      // Published parks skipped unless force=true (same guard as ingest-park-permits)
      if (dest.is_published && !force) {
        detalle.push({
          park_code: dest.park_code,
          status: "saltado",
          inserted: 0,
          updated: 0,
          reason: "is_published=true, usa force=true para reprocesar",
        });
        continue;
      }

      try {
        console.log(`[ingest-campgrounds] procesando ${dest.park_code} (${dest.title})`);
        const campgrounds = await fetchNpsCampgrounds(dest.park_code, NPS_API_KEY);
        console.log(
          `[ingest-campgrounds] ${dest.park_code} → ${campgrounds.length} campamentos en NPS`,
        );

        let inserted = 0;
        let updated = 0;

        for (const c of campgrounds) {
          const action = await upsertCampground(c, dest.id, db);
          if (action === "inserted") inserted++;
          else updated++;
        }

        totalInserted += inserted;
        totalUpdated += updated;
        procesados++;

        console.log(
          `[ingest-campgrounds] ✓ ${dest.park_code} — insertados: ${inserted} | actualizados: ${updated}`,
        );
        detalle.push({ park_code: dest.park_code, status: "procesado", inserted, updated });
      } catch (err) {
        const reason = err instanceof Error ? err.message : "Error inesperado";
        console.error(`[ingest-campgrounds] error en ${dest.park_code}:`, reason);
        detalle.push({
          park_code: dest.park_code,
          status: "error",
          inserted: 0,
          updated: 0,
          reason,
        });
      }
    }

    const restantes = Math.max(0, (totalPending ?? 0) - destinations.length);

    const summary = {
      ok: true,
      procesados,
      campamentos_insertados: totalInserted,
      campamentos_actualizados: totalUpdated,
      restantes,
      detalle,
    };

    console.log("[ingest-campgrounds] completado", {
      procesados,
      campamentos_insertados: totalInserted,
      campamentos_actualizados: totalUpdated,
    });

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ingest-campgrounds] error no controlado:", err);
    const message = err instanceof Error ? err.message : "Error inesperado";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
