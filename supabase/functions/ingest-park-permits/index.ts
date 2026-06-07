import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";
import { requireAdmin } from "../_shared/admin-auth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RIDB_API_KEY = Deno.env.get("RIDB_API_KEY");
const RIDB_BASE = "https://ridb.recreation.gov/api/v1";

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

// ─── RIDB API types ───────────────────────────────────────────────────────────

interface RidbRecArea {
  RecAreaID: string;
  RecAreaName: string;
  RecAreaLatitude: string;
  RecAreaLongitude: string;
  RecAreaReservationURL: string;
}

interface RidbFacility {
  FacilityID: string;
  FacilityName: string;
  FacilityTypeDescription: string;
  FacilityLatitude: string;
  FacilityLongitude: string;
  FacilityReservationURL: string;
  FacilityDescription: string;
}

interface RidbPermitEntrance {
  PermitEntranceID: string;
  PermitEntranceName: string;
  PermitEntranceDescription: string;
  PermitEntranceType: string;
}

interface RidbPermit {
  PermitID: string;
  ResourceDescription: string;
  Type: string;
}

interface RidbCampsiteAttr {
  AttributeName: string;
  AttributeValue: string;
}

interface RidbCampsite {
  CampsiteID: string;
  CampsiteType: string;
  ATTRIBUTES?: RidbCampsiteAttr[];
}

interface RidbResponse<T> {
  RECDATA: T[];
  METADATA: {
    RESULTS: {
      CURRENT_COUNT: number;
      TOTAL_COUNT: number;
    };
  };
}

// ─── Destination DB row (only fields this function reads or writes) ────────────

interface DestRow {
  id: string;
  slug: string;
  park_code: string;
  official_name: string;
  latitude: number | null;
  longitude: number | null;
  is_published: boolean;
  // Owned by this function (write)
  lodging_info: unknown;
  camping_available: boolean | null;
  recreation_gov_url: string | null;
  requires_permit: boolean | null;
  timed_entry_required: boolean | null;
  permits_info: unknown;
  // Append-only
  internal_notes: string | null;
}

// ─── JSONB output shapes (canonical — see docs/jsonb-contracts.md) ────────────

interface LodgingEntry {
  nombre: string;
  tipo: "camping";
  precio_usd: number | null;
  precio_nota: string | null;
  dentro_del_parque: boolean;
  reserva_url: string | null;
}

interface PermitEntry {
  nombre: string;
  tipo: "timed_entry" | "lottery" | "first_come" | "reserved" | "none";
  cuando_abre: null;
  fecha_limite: null;
  como_aplicar: string | null;
  url: string | null;
  nota_escasez: string | null;
}

// ─── Sliding-window rate limiter (target: ≤46 req/min, limit is 50/min) ───────

class RidbRateLimiter {
  private callTimes: number[] = [];

  async acquireSlot(): Promise<void> {
    const now = Date.now();
    this.callTimes = this.callTimes.filter((t) => now - t < 60_000);
    if (this.callTimes.length >= 46) {
      const waitMs = 60_000 - (now - this.callTimes[0]) + 150;
      console.log(
        `[ingest-park-permits] rate limit alcanzado — esperando ${Math.round(waitMs / 1000)}s`,
      );
      await new Promise<void>((r) => setTimeout(r, waitMs));
      this.callTimes = this.callTimes.filter((t) => Date.now() - t < 60_000);
    }
    this.callTimes.push(Date.now());
  }
}

const limiter = new RidbRateLimiter();

async function ridbFetch<T>(path: string, apiKey: string): Promise<RidbResponse<T>> {
  await limiter.acquireSlot();
  const url = `${RIDB_BASE}${path}`;
  const res = await fetch(url, {
    headers: { apikey: apiKey, Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`RIDB ${res.status} en ${path}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<RidbResponse<T>>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/national\s+park.*/i, "")
      .replace(/[^a-z0-9\s]/g, " ")
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function nameSimilarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let overlap = 0;
  for (const w of ta) {
    if (tb.has(w)) overlap++;
  }
  return overlap / Math.max(ta.size, tb.size);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Returns all RecAreas that are a plausible match for the park. */
function selectMatchingRecAreas(
  candidates: RidbRecArea[],
  parkName: string,
  parkLat: number | null,
  parkLon: number | null,
): RidbRecArea[] {
  const scored = candidates.map((ra) => {
    const nameSim = nameSimilarity(parkName, ra.RecAreaName);
    const raLat = parseFloat(ra.RecAreaLatitude);
    const raLon = parseFloat(ra.RecAreaLongitude);
    let geoBonus = 0;
    if (parkLat != null && parkLon != null && !isNaN(raLat) && !isNaN(raLon)) {
      const km = haversineKm(parkLat, parkLon, raLat, raLon);
      geoBonus = km <= 50 ? 0.4 : km <= 150 ? 0.2 : 0;
    }
    return { ra, score: nameSim + geoBonus, nameSim };
  });
  scored.sort((a, b) => b.score - a.score);

  // Accept if combined score ≥ 0.35 OR name similarity alone ≥ 0.4
  return scored
    .filter((s) => s.score >= 0.35 || s.nameSim >= 0.4)
    .map((s) => s.ra);
}

/** Try to extract a nightly fee from the facility description text. */
function extractNightlyPrice(description: string): number | null {
  const match = description.match(
    /\$\s*(\d{1,3}(?:\.\d{2})?)\s*(?:\/\s*night|per\s+night|a\s+night|\/night)/i,
  );
  if (match) {
    const price = parseFloat(match[1]);
    return isNaN(price) ? null : price;
  }
  return null;
}

type PermitTipo = "timed_entry" | "lottery" | "first_come" | "reserved" | "none";

function mapPermitType(ridbType: string): { tipo: PermitTipo; uncertain: boolean } {
  const t = ridbType.toLowerCase().trim();
  if (!t) return { tipo: "first_come", uncertain: true };
  if (t.includes("lottery") || t.includes("lotería")) return { tipo: "lottery", uncertain: false };
  if (t.includes("timed") || t.includes("time entry") || t.includes("scheduled"))
    return { tipo: "timed_entry", uncertain: false };
  if (t.includes("reserv")) return { tipo: "reserved", uncertain: false };
  if (t.includes("first come") || t.includes("first-come") || t.includes("walk"))
    return { tipo: "first_come", uncertain: false };
  // Unknown — use most conservative (first_come) and flag
  return { tipo: "first_come", uncertain: true };
}

function comoAplicarForType(tipo: PermitTipo): string {
  switch (tipo) {
    case "lottery":
      return "Participar en la lotería en Recreation.gov durante el período de inscripción";
    case "timed_entry":
      return "Reservar entrada con horario en Recreation.gov";
    case "reserved":
      return "Reservar en Recreation.gov";
    case "first_come":
      return "Llegar temprano (sin reserva previa)";
    default:
      return "Ver Recreation.gov para instrucciones";
  }
}

function buildRecAreaUrl(ra: RidbRecArea): string {
  if (ra.RecAreaReservationURL?.includes("recreation.gov")) {
    return ra.RecAreaReservationURL;
  }
  return `https://www.recreation.gov/camping/gateways/${ra.RecAreaID}`;
}

// ─── Per-park processing ──────────────────────────────────────────────────────

interface ParkResult {
  park_code: string;
  slug: string;
  status: "procesado" | "sin_match" | "saltado" | "error";
  recAreas?: string[];
  campgrounds?: number;
  permits?: number;
  details?: string;
}

async function processOnePark(
  park: DestRow,
  apiKey: string,
  force: boolean,
  db: ReturnType<typeof createClient>,
): Promise<ParkResult> {
  const base = { park_code: park.park_code, slug: park.slug };

  // Published parks are skipped unless force=true
  if (park.is_published && !force) {
    return { ...base, status: "saltado", details: "is_published=true, usa force=true para reprocessar" };
  }

  // ── Step 1: Find RecAreas ──────────────────────────────────────────────────
  const searchTerm = park.official_name.replace(/National Park.*/i, "").trim();
  let matchedRecAreas: RidbRecArea[] = [];

  try {
    const raRes = await ridbFetch<RidbRecArea>(
      `/recareas?query=${encodeURIComponent(searchTerm)}&limit=20`,
      apiKey,
    );
    matchedRecAreas = selectMatchingRecAreas(
      raRes.RECDATA ?? [],
      park.official_name,
      park.latitude,
      park.longitude,
    );
  } catch (err) {
    console.warn(
      `[ingest-park-permits] error buscando RecArea para ${park.park_code}:`,
      err instanceof Error ? err.message : err,
    );
  }

  if (matchedRecAreas.length === 0) {
    console.log(
      `[ingest-park-permits] sin match RIDB para ${park.park_code} (${park.official_name})`,
    );
    return { ...base, status: "sin_match" };
  }

  const primaryRecArea = matchedRecAreas[0];
  console.log(
    `[ingest-park-permits] ${park.park_code} → RecArea(s): ${matchedRecAreas.map((r) => r.RecAreaName).join(", ")}`,
  );

  // ── Step 2: Get facilities from all matched RecAreas ───────────────────────
  const campFacilities: RidbFacility[] = [];
  const permitFacilities: RidbFacility[] = [];
  const seenFacilityIds = new Set<string>();

  for (const ra of matchedRecAreas) {
    try {
      const facRes = await ridbFetch<RidbFacility>(
        `/recareas/${ra.RecAreaID}/facilities?limit=50`,
        apiKey,
      );
      for (const f of facRes.RECDATA ?? []) {
        if (seenFacilityIds.has(f.FacilityID)) continue;
        seenFacilityIds.add(f.FacilityID);
        const desc = (f.FacilityTypeDescription ?? "").toLowerCase();
        if (desc.includes("campground") || desc.includes("camping")) {
          campFacilities.push(f);
        } else if (
          desc.includes("permit entrance") ||
          desc.includes("permit") ||
          desc.includes("timed entry")
        ) {
          permitFacilities.push(f);
        }
      }
    } catch (err) {
      console.warn(
        `[ingest-park-permits] error obteniendo facilities para RecArea ${ra.RecAreaID}:`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  // ── Step 3: Build camping lodging entries ─────────────────────────────────
  const newLodging: LodgingEntry[] = [];

  for (const camp of campFacilities) {
    let price = extractNightlyPrice(camp.FacilityDescription ?? "");

    // Best-effort: try campsites endpoint for first 3 campgrounds if price not found
    if (price === null && newLodging.length < 3) {
      try {
        const siteRes = await ridbFetch<RidbCampsite>(
          `/facilities/${camp.FacilityID}/campsites?limit=1`,
          apiKey,
        );
        const sample = siteRes.RECDATA?.[0];
        if (sample?.ATTRIBUTES) {
          const feeAttr = sample.ATTRIBUTES.find((a) =>
            /fee|cost|rate|price/i.test(a.AttributeName),
          );
          if (feeAttr) {
            const parsed = parseFloat(feeAttr.AttributeValue.replace(/[^0-9.]/g, ""));
            if (!isNaN(parsed) && parsed > 0) price = parsed;
          }
        }
      } catch {
        // Pricing is optional — skip silently
      }
    }

    const reservaUrl = camp.FacilityReservationURL?.includes("recreation.gov")
      ? camp.FacilityReservationURL
      : `https://www.recreation.gov/camping/campgrounds/${camp.FacilityID}`;

    // Determine if campground is inside the park (≤20 km from park center)
    let dentroDelParque = false;
    const facLat = parseFloat(camp.FacilityLatitude);
    const facLon = parseFloat(camp.FacilityLongitude);
    if (
      park.latitude != null &&
      park.longitude != null &&
      !isNaN(facLat) &&
      !isNaN(facLon)
    ) {
      dentroDelParque = haversineKm(park.latitude, park.longitude, facLat, facLon) <= 20;
    }

    newLodging.push({
      nombre: camp.FacilityName,
      tipo: "camping",
      precio_usd: price,
      precio_nota: price != null ? null : "Ver Recreation.gov para tarifas actuales",
      dentro_del_parque: dentroDelParque,
      reserva_url: reservaUrl,
    });
  }

  // ── Step 4: Build permit entries ──────────────────────────────────────────
  const newPermits: PermitEntry[] = [];
  let hasUncertainPermitType = false;

  // 4a: PermitEntrance facilities from the RecArea
  for (const pf of permitFacilities) {
    try {
      const peRes = await ridbFetch<RidbPermitEntrance>(
        `/facilities/${pf.FacilityID}/permitentrances?limit=10`,
        apiKey,
      );
      for (const pe of peRes.RECDATA ?? []) {
        const { tipo, uncertain } = mapPermitType(pe.PermitEntranceType ?? "");
        if (uncertain) hasUncertainPermitType = true;

        const peUrl = `https://www.recreation.gov/permits/${pe.PermitEntranceID}`;
        newPermits.push({
          nombre: pe.PermitEntranceName || pf.FacilityName,
          tipo,
          cuando_abre: null,
          fecha_limite: null,
          como_aplicar: comoAplicarForType(tipo),
          url: peUrl,
          nota_escasez: null,
        });
      }
    } catch {
      // Best effort — skip if endpoint not available
    }
  }

  // 4b: Top-level /permits search for lottery-type permits
  try {
    const permRes = await ridbFetch<RidbPermit>(
      `/permits?query=${encodeURIComponent(searchTerm)}&limit=10`,
      apiKey,
    );
    for (const p of permRes.RECDATA ?? []) {
      const sim = nameSimilarity(park.official_name, p.ResourceDescription ?? "");
      if (sim < 0.2) continue; // Not relevant to this park

      const { tipo, uncertain } = mapPermitType(p.Type ?? "");
      if (uncertain) hasUncertainPermitType = true;

      // Deduplicate by name
      const alreadyAdded = newPermits.some(
        (e) => e.nombre.toLowerCase() === (p.ResourceDescription ?? "").toLowerCase(),
      );
      if (alreadyAdded) continue;

      newPermits.push({
        nombre: p.ResourceDescription,
        tipo,
        cuando_abre: null,
        fecha_limite: null,
        como_aplicar: comoAplicarForType(tipo),
        url: `https://www.recreation.gov/permits/${p.PermitID}`,
        nota_escasez: null,
      });
    }
  } catch {
    // Best effort — /permits endpoint may not be available for all API keys
  }

  // ── Step 5: Merge with existing data and write ────────────────────────────

  const existingLodging = (park.lodging_info as LodgingEntry[] | null) ?? [];
  const existingPermits = (park.permits_info as PermitEntry[] | null) ?? [];

  // Lodging: preserve non-camping entries; replace camping entries only if force or empty
  let finalLodging: LodgingEntry[];
  const nonCampingExisting = existingLodging.filter(
    (e) => (e as { tipo?: string }).tipo !== "camping",
  );
  if (force) {
    finalLodging = [...nonCampingExisting, ...newLodging];
  } else {
    const existingCamping = existingLodging.filter(
      (e) => (e as { tipo?: string }).tipo === "camping",
    );
    finalLodging =
      existingCamping.length === 0
        ? [...nonCampingExisting, ...newLodging]
        : existingLodging;
  }

  // Permits: replace only if force or currently empty
  let finalPermits: PermitEntry[];
  if (force) {
    finalPermits = newPermits;
  } else {
    finalPermits = existingPermits.length === 0 ? newPermits : existingPermits;
  }

  // requires_permit / timed_entry_required: only ever upgrade to true, never downgrade
  let newRequiresPermit = park.requires_permit ?? false;
  let newTimedEntry = park.timed_entry_required ?? false;
  if (finalPermits.length > 0) {
    newRequiresPermit = true;
    if (finalPermits.some((p) => p.tipo === "timed_entry")) {
      newTimedEntry = true;
    }
  }

  // recreation_gov_url: write if empty or force
  const newRecGovUrl =
    force || !park.recreation_gov_url
      ? buildRecAreaUrl(primaryRecArea)
      : park.recreation_gov_url;

  // camping_available: only upgrade if we found campgrounds
  let newCampingAvailable = park.camping_available ?? false;
  if (force || park.camping_available == null) {
    newCampingAvailable = finalLodging.some((l) => l.tipo === "camping");
  }

  // internal_notes: append warning if permit type was uncertain (never overwrite)
  let newInternalNotes = park.internal_notes ?? "";
  if (hasUncertainPermitType) {
    const flag = "[RIDB] ⚠️ VERIFICAR tipo de permiso";
    if (!newInternalNotes.includes(flag)) {
      newInternalNotes = newInternalNotes ? `${newInternalNotes}\n\n${flag}` : flag;
    }
  }

  const patch: Record<string, unknown> = {
    lodging_info: finalLodging.length > 0 ? finalLodging : null,
    camping_available: newCampingAvailable,
    recreation_gov_url: newRecGovUrl,
    requires_permit: newRequiresPermit,
    timed_entry_required: newTimedEntry,
    permits_info: finalPermits.length > 0 ? finalPermits : null,
    internal_notes: newInternalNotes || null,
  };

  const { error: updateErr } = await db.from("destinations").update(patch).eq("id", park.id);

  if (updateErr) {
    console.error(
      `[ingest-park-permits] error actualizando ${park.park_code}:`,
      updateErr.message,
    );
    return { ...base, status: "error", details: updateErr.message };
  }

  console.log(
    `[ingest-park-permits] ✓ ${park.park_code} — campgrounds: ${newLodging.length} | permits: ${finalPermits.length}`,
  );

  return {
    ...base,
    status: "procesado",
    recAreas: matchedRecAreas.map((r) => r.RecAreaName),
    campgrounds: newLodging.length,
    permits: finalPermits.length,
  };
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
    if (!RIDB_API_KEY) {
      throw new Error(
        "RIDB_API_KEY no configurada — agrégala en Supabase Dashboard → Edge Functions → Secrets",
      );
    }

    const { user, error: authError } = await requireAdmin(req, corsHeaders);
    if (authError) return authError;

    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const force = body.force ?? false;
    const limit = Math.min(Math.max(1, body.limit ?? 5), 50);
    const parkCodeFilter = body.park_code?.toLowerCase();

    console.log(
      `[ingest-park-permits] iniciado por ${user.email} — force=${force} limit=${limit}${parkCodeFilter ? ` park=${parkCodeFilter}` : ""}`,
    );

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Fetch parks to process
    // Select only the fields this function owns + identification fields
    let query = db
      .from("destinations")
      .select(
        "id, slug, park_code, official_name, latitude, longitude, is_published, " +
          "lodging_info, camping_available, recreation_gov_url, " +
          "requires_permit, timed_entry_required, permits_info, internal_notes",
      )
      .not("park_code", "is", null)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (parkCodeFilter) {
      query = query.eq("park_code", parkCodeFilter);
    } else if (!force) {
      // Default: only process unpublished parks
      query = query.eq("is_published", false);
    }

    const { data: rows, error: dbErr } = await query;
    if (dbErr) throw new Error(`Error consultando destinos: ${dbErr.message}`);

    const parks = (rows ?? []) as DestRow[];

    // Count remaining unpublished parks (for pagination context)
    const { count: totalPending } = await db
      .from("destinations")
      .select("id", { count: "exact", head: true })
      .not("park_code", "is", null)
      .eq("is_published", false);

    const detalle: ParkResult[] = [];
    let procesados = 0;
    let sin_match = 0;

    for (const park of parks) {
      const result = await processOnePark(park, RIDB_API_KEY, force, db);
      detalle.push(result);
      if (result.status === "procesado") procesados++;
      else if (result.status === "sin_match") sin_match++;
    }

    // "restantes" = unpublished parks not included in this batch
    const restantes = Math.max(0, (totalPending ?? 0) - parks.length);

    const summary = {
      ok: true,
      procesados,
      restantes,
      sin_match,
      detalle,
    };

    console.log("[ingest-park-permits] completado", { procesados, sin_match });

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[ingest-park-permits] error no controlado:", err);
    const message = err instanceof Error ? err.message : "Error inesperado";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
