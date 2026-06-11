import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const NPS_API_KEY = Deno.env.get("NPS_API_KEY");
const RIDB_API_KEY = Deno.env.get("RIDB_API_KEY"); // optional — campgrounds skipped if absent

const NPS_BASE = "https://developer.nps.gov/api/v1";
const RIDB_BASE = "https://ridb.recreation.gov/api/v1";
const INTER_PARK_DELAY_MS = 300;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Request / response types ─────────────────────────────────────────────────

interface RequestBody {
  park_codes?: string[];
  mode?: "alerts" | "full";
}

// ─── NPS API types ────────────────────────────────────────────────────────────

interface NpsEntranceFee {
  cost: string;
  description: string;
  title: string;
}

interface NpsStandardHours {
  sunday: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
}

interface NpsHoursException {
  name: string;
  startDate: string;
  endDate: string;
  exceptionHours: Partial<NpsStandardHours>;
}

interface NpsOperatingHours {
  name: string;
  description: string;
  standardHours: NpsStandardHours;
  exceptions: NpsHoursException[];
}

interface NpsImage {
  url: string;
  altText?: string;
  title?: string;
  caption?: string;
  credit?: string;
}

interface NpsParkData {
  parkCode: string;
  entranceFees: NpsEntranceFee[];
  operatingHours: NpsOperatingHours[];
  images: NpsImage[];
  latLong: string;
}

interface NpsAlert {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  lastIndexedDate: string;
}

interface NpsApiResponse<T> {
  data: T[];
}

// ─── RIDB API types ───────────────────────────────────────────────────────────

interface RidbRecArea {
  RecAreaID: string;
  RecAreaName: string;
}

interface RidbFacility {
  FacilityID: string;
  FacilityName: string;
  FacilityTypeDescription: string;
  FacilityReservationURL: string;
}

interface RidbApiResponse<T> {
  RECDATA: T[];
}

// ─── park_live_data shapes ────────────────────────────────────────────────────

interface CampgroundEntry {
  facilityId: string;
  nombre: string;
  reservation_url: string;
}

interface SyncError {
  step: string;
  error: string;
}

// ─── destinations source row ──────────────────────────────────────────────────

interface DestRow {
  id: string;
  park_code: string;
  official_name: string | null;
  title: string;
}

// ─── Per-park sync result (for function response) ────────────────────────────

interface ParkSyncResult {
  park_code: string;
  status: "synced" | "error";
  alerts?: number;
  campgrounds?: number;
  sync_errors?: number;
  error?: string;
}

// ─── RIDB rate limiter (target: ≤46 req/min; RIDB limit is 50/min) ────────────

class RidbRateLimiter {
  private callTimes: number[] = [];

  async acquireSlot(): Promise<void> {
    const now = Date.now();
    this.callTimes = this.callTimes.filter((t) => now - t < 60_000);
    if (this.callTimes.length >= 46) {
      const waitMs = 60_000 - (now - this.callTimes[0]) + 150;
      console.log(
        `[sync-park-live-data] RIDB rate limit — esperando ${Math.round(waitMs / 1000)}s`,
      );
      await new Promise<void>((r) => setTimeout(r, waitMs));
      this.callTimes = this.callTimes.filter((t) => Date.now() - t < 60_000);
    }
    this.callTimes.push(Date.now());
  }
}

const ridbLimiter = new RidbRateLimiter();

// ─── API helpers ──────────────────────────────────────────────────────────────

async function npsGet<T>(path: string, apiKey: string): Promise<NpsApiResponse<T>> {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${NPS_BASE}${path}${sep}api_key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`NPS ${res.status} en ${path}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<NpsApiResponse<T>>;
}

async function ridbGet<T>(path: string, apiKey: string): Promise<RidbApiResponse<T>> {
  await ridbLimiter.acquireSlot();
  const url = `${RIDB_BASE}${path}`;
  const res = await fetch(url, {
    headers: { apikey: apiKey, Accept: "application/json" },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`RIDB ${res.status} en ${path}: ${body.slice(0, 200)}`);
  }
  return res.json() as Promise<RidbApiResponse<T>>;
}

// ─── Name similarity (for RIDB RecArea matching) ─────────────────────────────

function tokenize(s: string): Set<string> {
  return new Set(
    s.toLowerCase()
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

// ─── Per-park data collection ─────────────────────────────────────────────────

interface CollectedData {
  entrance_fees: NpsEntranceFee[] | null;
  operating_hours: NpsOperatingHours[] | null;
  images: NpsImage[] | null;
  lat_long: string | null;
  alerts: NpsAlert[] | null;
  campgrounds: CampgroundEntry[] | null;
  sync_errors: SyncError[];
}

async function collectParkData(
  park: DestRow,
  mode: "alerts" | "full",
  npsKey: string,
  ridbKey: string | undefined,
): Promise<CollectedData> {
  const errors: SyncError[] = [];
  let entrance_fees: NpsEntranceFee[] | null = null;
  let operating_hours: NpsOperatingHours[] | null = null;
  let images: NpsImage[] | null = null;
  let lat_long: string | null = null;
  let alerts: NpsAlert[] | null = null;
  let campgrounds: CampgroundEntry[] | null = null;

  // ── NPS /parks (full mode only) ───────────────────────────────────────────
  if (mode === "full") {
    try {
      const res = await npsGet<NpsParkData>(
        `/parks?parkCode=${encodeURIComponent(park.park_code)}&limit=1`,
        npsKey,
      );
      const p = res.data?.[0];
      if (p) {
        entrance_fees = p.entranceFees?.length > 0 ? p.entranceFees : null;
        operating_hours = p.operatingHours?.length > 0 ? p.operatingHours : null;
        images = p.images?.length > 0 ? p.images : null;
        lat_long = p.latLong || null;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[sync-park-live-data] NPS parks error ${park.park_code}:`, msg);
      errors.push({ step: "nps_parks", error: msg.slice(0, 300) });
    }
  }

  // ── NPS /alerts (both modes) ──────────────────────────────────────────────
  try {
    const res = await npsGet<NpsAlert>(
      `/alerts?parkCode=${encodeURIComponent(park.park_code)}&limit=50`,
      npsKey,
    );
    alerts = res.data?.length > 0 ? res.data : null;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[sync-park-live-data] NPS alerts error ${park.park_code}:`, msg);
    errors.push({ step: "nps_alerts", error: msg.slice(0, 300) });
  }

  // ── RIDB campgrounds (full mode only; skipped if no key) ──────────────────
  if (mode === "full" && ridbKey) {
    try {
      const searchName = (park.official_name ?? park.title)
        .replace(/National Park.*/i, "")
        .trim();

      const raRes = await ridbGet<RidbRecArea>(
        `/recareas?query=${encodeURIComponent(searchName)}&limit=20`,
        ridbKey,
      );

      // Keep top 3 RecAreas by name similarity
      const matched = (raRes.RECDATA ?? [])
        .map((ra) => ({
          ra,
          sim: nameSimilarity(park.official_name ?? park.title, ra.RecAreaName),
        }))
        .filter((s) => s.sim >= 0.3)
        .sort((a, b) => b.sim - a.sim)
        .slice(0, 3)
        .map((s) => s.ra);

      const campList: CampgroundEntry[] = [];
      const seenIds = new Set<string>();

      for (const ra of matched) {
        try {
          const facRes = await ridbGet<RidbFacility>(
            `/recareas/${ra.RecAreaID}/facilities?limit=50`,
            ridbKey,
          );
          for (const f of facRes.RECDATA ?? []) {
            if (seenIds.has(f.FacilityID)) continue;
            const typeDesc = (f.FacilityTypeDescription ?? "").toLowerCase();
            if (typeDesc.includes("campground") || typeDesc.includes("camping")) {
              seenIds.add(f.FacilityID);
              const reservationUrl =
                f.FacilityReservationURL?.includes("recreation.gov")
                  ? f.FacilityReservationURL
                  : `https://www.recreation.gov/camping/campgrounds/${f.FacilityID}`;
              campList.push({
                facilityId: f.FacilityID,
                nombre: f.FacilityName,
                reservation_url: reservationUrl,
              });
            }
          }
        } catch {
          // Best effort — skip RecArea if facilities call fails
        }
      }

      if (campList.length > 0) {
        campgrounds = campList;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[sync-park-live-data] RIDB error ${park.park_code}:`, msg);
      errors.push({ step: "ridb_campgrounds", error: msg.slice(0, 300) });
    }
  }

  return { entrance_fees, operating_hours, images, lat_long, alerts, campgrounds, sync_errors: errors };
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

    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const mode: "alerts" | "full" = body.mode === "alerts" ? "alerts" : "full";
    const filterCodes = (body.park_codes ?? []).map((c: string) => c.toLowerCase());

    console.log(
      `[sync-park-live-data] iniciado — mode=${mode}` +
        (filterCodes.length > 0
          ? ` park_codes=[${filterCodes.join(",")}]`
          : " (todos los parques)"),
    );

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ── Fetch destination rows to process ─────────────────────────────────────
    let query = db
      .from("destinations")
      .select("id, park_code, official_name, title")
      .not("park_code", "is", null);

    if (filterCodes.length > 0) {
      query = query.in("park_code", filterCodes);
    }

    const { data: rows, error: dbErr } = await query;
    if (dbErr) throw new Error(`Error consultando destinations: ${dbErr.message}`);

    const parks = (rows ?? []) as DestRow[];
    console.log(`[sync-park-live-data] parques a sincronizar: ${parks.length}`);

    const detalle: ParkSyncResult[] = [];
    let synced = 0;
    let failed = 0;

    for (let i = 0; i < parks.length; i++) {
      const park = parks[i];

      if (i > 0) {
        await new Promise<void>((r) => setTimeout(r, INTER_PARK_DELAY_MS));
      }

      try {
        const data = await collectParkData(park, mode, NPS_API_KEY, RIDB_API_KEY);

        // Build upsert payload — alerts mode only updates alerts + metadata
        const payload: Record<string, unknown> = {
          park_code: park.park_code,
          destination_id: park.id,
          alerts: data.alerts,
          sync_errors: data.sync_errors,
          synced_at: new Date().toISOString(),
        };

        if (mode === "full") {
          payload.entrance_fees = data.entrance_fees;
          payload.operating_hours = data.operating_hours;
          payload.images = data.images;
          payload.lat_long = data.lat_long;
          payload.campgrounds = data.campgrounds;
        }

        const { error: upsertErr } = await db
          .from("park_live_data")
          .upsert(payload, { onConflict: "park_code" });

        if (upsertErr) {
          console.error(
            `[sync-park-live-data] upsert error ${park.park_code}:`,
            upsertErr.message,
          );
          detalle.push({ park_code: park.park_code, status: "error", error: upsertErr.message });
          failed++;
        } else {
          const alertCount = data.alerts?.length ?? 0;
          const campCount = data.campgrounds?.length ?? 0;
          const errCount = data.sync_errors.length;
          console.log(
            `[sync-park-live-data] ✓ ${park.park_code} — alerts:${alertCount}` +
              (mode === "full" ? ` campgrounds:${campCount}` : "") +
              (errCount > 0 ? ` api_errors:${errCount}` : ""),
          );
          detalle.push({
            park_code: park.park_code,
            status: "synced",
            alerts: alertCount,
            ...(mode === "full" ? { campgrounds: campCount } : {}),
            ...(errCount > 0 ? { sync_errors: errCount } : {}),
          });
          synced++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[sync-park-live-data] error ${park.park_code}:`, msg);
        detalle.push({ park_code: park.park_code, status: "error", error: msg.slice(0, 300) });
        failed++;
      }
    }

    const summary = {
      ok: true,
      mode,
      total: parks.length,
      synced,
      failed,
      detalle,
    };

    console.log("[sync-park-live-data] completado", { synced, failed });

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[sync-park-live-data] error no controlado:", err);
    const message = err instanceof Error ? err.message : "Error inesperado";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
