import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const NPS_API_KEY = Deno.env.get("NPS_API_KEY");

const NPS_BASE = "https://developer.nps.gov/api/v1";
const INTER_PARK_DELAY_MS = 300;

// Supabase free-tier limit: cap Edge Function work per invocation so a single
// run never risks the execution-time/CPU ceiling. A weekly pg_cron job (see
// migration 20260707000001) re-runs this on a fixed schedule, so the batch
// cursor below (oldest-synced-first) rotates through all 63 parks over time
// instead of requiring one giant run.
const MAX_BATCH = 5;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Request / response types ─────────────────────────────────────────────────

interface RequestBody {
  park_codes?: string[];
}

// ─── NPS API types ────────────────────────────────────────────────────────────

interface NpsActivity {
  id: string;
  name: string;
}

interface NpsThingToDo {
  id: string;
  url: string;
  title: string;
  shortDescription?: string;
  bodyText?: string;
  duration?: string;
  latitude?: string;
  longitude?: string;
  latLong?: string;
  parkCode: string;
  activities?: NpsActivity[];
}

interface NpsApiResponse<T> {
  data: T[];
}

// ─── destinations source row ──────────────────────────────────────────────────

interface DestRow {
  id: string;
  park_code: string;
  official_name: string | null;
  title: string;
}

// ─── park_trails row shape ────────────────────────────────────────────────────

interface TrailRow {
  park_code: string;
  destination_id: string;
  nps_thing_id: string;
  name: string;
  description_es: string | null;
  distance: string | null;
  difficulty: null;
  coordinates: { lat: number; lng: number } | null;
  nps_url: string | null;
  synced_at: string;
}

interface ParkSyncResult {
  park_code: string;
  status: "synced" | "error";
  trails?: number;
  error?: string;
}

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

// Resolves the NPS activity id for "Hiking" at runtime instead of hardcoding
// a GUID — /activities is the source of truth and its ids aren't documented
// as stable public constants. Falls back to null (caller then filters
// /thingstodo results client-side by activity name) if this lookup fails.
async function resolveHikingActivityId(apiKey: string): Promise<string | null> {
  try {
    const res = await npsGet<NpsActivity>("/activities?limit=50", apiKey);
    const hit = (res.data ?? []).find((a) => (a.name ?? "").toLowerCase() === "hiking");
    return hit?.id ?? null;
  } catch (err) {
    console.warn(
      "[sync-park-trails] no se pudo resolver activityId de Hiking, se usará filtro por nombre:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

function parseCoordinates(t: NpsThingToDo): { lat: number; lng: number } | null {
  const lat = t.latitude ? parseFloat(t.latitude) : NaN;
  const lng = t.longitude ? parseFloat(t.longitude) : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };

  if (t.latLong) {
    // NPS fallback format: "lat:37.74859508, long:-119.53832388"
    const match = t.latLong.match(/lat:([-\d.]+),?\s*long:([-\d.]+)/i);
    if (match) {
      const lat2 = parseFloat(match[1]);
      const lng2 = parseFloat(match[2]);
      if (Number.isFinite(lat2) && Number.isFinite(lng2)) return { lat: lat2, lng: lng2 };
    }
  }
  return null;
}

async function collectParkTrails(
  park: DestRow,
  npsKey: string,
  hikingActivityId: string | null,
): Promise<{ trails: TrailRow[]; error: string | null }> {
  try {
    const activityParam = hikingActivityId
      ? `&activityId=${encodeURIComponent(hikingActivityId)}`
      : "";
    const res = await npsGet<NpsThingToDo>(
      `/thingstodo?parkCode=${encodeURIComponent(park.park_code)}&limit=50${activityParam}`,
      npsKey,
    );

    let items = res.data ?? [];
    if (!hikingActivityId) {
      // No resolved activity id — filter client-side by activity name instead.
      items = items.filter((t) =>
        (t.activities ?? []).some((a) => (a.name ?? "").toLowerCase().includes("hiking")),
      );
    }

    const syncedAt = new Date().toISOString();
    const trails: TrailRow[] = items.map((t) => ({
      park_code: park.park_code,
      destination_id: park.id,
      nps_thing_id: t.id,
      name: t.title,
      description_es: t.shortDescription || t.bodyText || null,
      distance: t.duration || null,
      difficulty: null,
      coordinates: parseCoordinates(t),
      nps_url: t.url || null,
      synced_at: syncedAt,
    }));

    return { trails, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { trails: [], error: msg.slice(0, 300) };
  }
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
    const filterCodes = (body.park_codes ?? []).map((c: string) => c.toLowerCase());

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ── Fetch candidate destination rows ───────────────────────────────────────
    let query = db
      .from("destinations")
      .select("id, park_code, official_name, title")
      .not("park_code", "is", null);

    if (filterCodes.length > 0) {
      query = query.in("park_code", filterCodes);
    }

    const { data: rows, error: dbErr } = await query;
    if (dbErr) throw new Error(`Error consultando destinations: ${dbErr.message}`);

    const candidates = (rows ?? []) as DestRow[];

    // ── Prioritize least-recently-synced parks first ───────────────────────────
    // Never-synced parks (no park_trails rows yet) are treated as highest
    // priority so a fresh table backfills before the rotation settles into a
    // steady weekly cadence.
    const { data: syncedRows, error: syncedErr } = await db
      .from("park_trails")
      .select("park_code, synced_at");
    if (syncedErr) throw new Error(`Error consultando park_trails: ${syncedErr.message}`);

    const lastSyncByCode = new Map<string, string>();
    for (const row of (syncedRows ?? []) as { park_code: string; synced_at: string }[]) {
      const prev = lastSyncByCode.get(row.park_code);
      if (!prev || row.synced_at > prev) lastSyncByCode.set(row.park_code, row.synced_at);
    }

    const prioritized = candidates
      .map((park) => ({ park, lastSynced: lastSyncByCode.get(park.park_code) ?? null }))
      .sort((a, b) => {
        if (a.lastSynced === b.lastSynced) return 0;
        if (a.lastSynced === null) return -1;
        if (b.lastSynced === null) return 1;
        return a.lastSynced.localeCompare(b.lastSynced);
      });

    const batch = prioritized.slice(0, MAX_BATCH).map((p) => p.park);
    const restantes = Math.max(0, candidates.length - batch.length);

    console.log(
      `[sync-park-trails] iniciado — candidatos=${candidates.length} batch=${batch.length} restantes=${restantes}`,
    );

    const hikingActivityId = await resolveHikingActivityId(NPS_API_KEY);

    const detalle: ParkSyncResult[] = [];
    let synced = 0;
    let failed = 0;

    for (let i = 0; i < batch.length; i++) {
      const park = batch[i];

      if (i > 0) {
        await new Promise<void>((r) => setTimeout(r, INTER_PARK_DELAY_MS));
      }

      const { trails, error } = await collectParkTrails(park, NPS_API_KEY, hikingActivityId);

      if (error) {
        console.error(`[sync-park-trails] error ${park.park_code}:`, error);
        detalle.push({ park_code: park.park_code, status: "error", error });
        failed++;
        continue;
      }

      if (trails.length === 0) {
        console.log(`[sync-park-trails] ✓ ${park.park_code} — 0 trails de hiking`);
        detalle.push({ park_code: park.park_code, status: "synced", trails: 0 });
        synced++;
        continue;
      }

      const { error: upsertErr } = await db
        .from("park_trails")
        .upsert(trails, { onConflict: "park_code,nps_thing_id" });

      if (upsertErr) {
        console.error(`[sync-park-trails] upsert error ${park.park_code}:`, upsertErr.message);
        detalle.push({ park_code: park.park_code, status: "error", error: upsertErr.message });
        failed++;
      } else {
        console.log(`[sync-park-trails] ✓ ${park.park_code} — ${trails.length} trails`);
        detalle.push({ park_code: park.park_code, status: "synced", trails: trails.length });
        synced++;
      }
    }

    const summary = {
      ok: true,
      total: candidates.length,
      batch: batch.length,
      synced,
      failed,
      restantes,
      detalle,
    };

    console.log("[sync-park-trails] completado", { synced, failed, restantes });

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[sync-park-trails] error no controlado:", err);
    const message = err instanceof Error ? err.message : "Error inesperado";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
