import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");

const INTER_PARK_DELAY_MS = 300;

const NWS_HEADERS: Record<string, string> = {
  "User-Agent": "Nomaderia/1.0 (frank@nomaderia.com)",
  "Accept": "application/geo+json",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

// ─── Local types ──────────────────────────────────────────────────────────────

interface DestRow {
  id: string;
  park_code: string;
  title: string;
  latitude: number | null;
  longitude: number | null;
}

interface SyncErrorEntry {
  step: string;
  error: string;
}

interface ParkLiveRow {
  destination_id: string;
  lat_long: string | null;
  sync_errors: SyncErrorEntry[] | null;
}

interface NwsPointsProperties {
  forecast: string;
}

interface NwsPointsResponse {
  properties: NwsPointsProperties;
}

interface NwsPrecipitation {
  value: number | null;
  unitCode: string;
}

interface NwsPeriod {
  name: string;
  isDaytime: boolean;
  temperature: number;
  shortForecast: string;
  detailedForecast: string;
  probabilityOfPrecipitation?: NwsPrecipitation;
  windSpeed: string;
}

interface NwsForecastProperties {
  periods: NwsPeriod[];
}

interface NwsForecastResponse {
  properties: NwsForecastProperties;
}

interface WeatherPeriod {
  name: string;
  is_daytime: boolean;
  temp_f: number;
  short: string;
  detailed: string;
  precip_pct: number | null;
  wind: string;
}

interface WeatherPayload {
  synced_at: string;
  source: "weather.gov";
  periods: WeatherPeriod[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseLatLong(latLong: string): { lat: number; lng: number } | null {
  // NPS format: "lat:37.74859508, long:-119.53832388"
  const match = latLong.match(/lat:([-\d.]+),?\s*long:([-\d.]+)/i);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
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
    if (!CRON_SECRET) {
      throw new Error("CRON_SECRET no configurada");
    }

    const providedSecret = req.headers.get("x-cron-secret");
    if (!providedSecret || providedSecret !== CRON_SECRET) {
      return new Response(
        JSON.stringify({ error: "No autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ── Fetch all destinations that have a park_code ───────────────────────────
    const { data: destRows, error: destErr } = await db
      .from("destinations")
      .select("id, park_code, title, latitude, longitude")
      .not("park_code", "is", null);

    if (destErr) throw new Error(`Error consultando destinations: ${destErr.message}`);

    const parks = (destRows ?? []) as DestRow[];

    console.log(`[sync-park-weather] parques a procesar: ${parks.length}`);

    // ── Load park_live_data lat_long (coordinate fallback) + sync_errors ──────
    const destIds = parks.map((p) => p.id);
    const liveByDestId = new Map<string, ParkLiveRow>();

    if (destIds.length > 0) {
      const { data: liveRows, error: liveErr } = await db
        .from("park_live_data")
        .select("destination_id, lat_long, sync_errors")
        .in("destination_id", destIds);

      if (liveErr) {
        console.warn(
          "[sync-park-weather] no se pudo cargar lat_long de respaldo:",
          liveErr.message,
        );
      } else {
        for (const row of (liveRows ?? []) as ParkLiveRow[]) {
          liveByDestId.set(row.destination_id, row);
        }
      }
    }

    // sync_errors sin las entradas de weather de corridas previas — para
    // reemplazarlas (no acumularlas) al registrar un fallo nuevo, y limpiarlas
    // en un run exitoso, sin tocar las entradas de otros pasos.
    const nonWeatherErrors = (destId: string): SyncErrorEntry[] => {
      const prev = liveByDestId.get(destId)?.sync_errors;
      return Array.isArray(prev) ? prev.filter((e) => e?.step !== "weather") : [];
    };

    let synced = 0;
    let failed = 0;

    for (let i = 0; i < parks.length; i++) {
      const park = parks[i];

      if (i > 0) {
        await new Promise<void>((r) => setTimeout(r, INTER_PARK_DELAY_MS));
      }

      try {
        // ── Resolve coordinates ────────────────────────────────────────────────
        let lat: number | null = park.latitude;
        let lng: number | null = park.longitude;

        if (lat == null || lng == null) {
          const latLong = liveByDestId.get(park.id)?.lat_long ?? null;
          if (latLong) {
            const parsed = parseLatLong(latLong);
            if (parsed) {
              lat = parsed.lat;
              lng = parsed.lng;
            }
          }
        }

        if (lat == null || lng == null) {
          // Vía el catch para que quede registrado en sync_errors (antes era un
          // continue silencioso que dejaba la fila sin rastro del problema).
          throw new Error(
            "sin coordenadas (destinations.latitude/longitude y park_live_data.lat_long vacíos)",
          );
        }

        const latR = round4(lat);
        const lngR = round4(lng);

        // ── Step 1: weather.gov /points ────────────────────────────────────────
        const pointsRes = await fetch(
          `https://api.weather.gov/points/${latR},${lngR}`,
          { headers: NWS_HEADERS },
        );

        if (!pointsRes.ok) {
          const body = await pointsRes.text().catch(() => "");
          throw new Error(
            `weather.gov /points HTTP ${pointsRes.status}: ${body.slice(0, 200)}`,
          );
        }

        const pointsJson = (await pointsRes.json()) as NwsPointsResponse;
        const forecastUrl = pointsJson.properties?.forecast;

        if (!forecastUrl) {
          throw new Error("weather.gov /points no devolvió forecast URL");
        }

        // ── Step 2: forecast URL ──────────────────────────────────────────────
        const forecastRes = await fetch(forecastUrl, { headers: NWS_HEADERS });

        if (!forecastRes.ok) {
          const body = await forecastRes.text().catch(() => "");
          throw new Error(
            `weather.gov forecast HTTP ${forecastRes.status}: ${body.slice(0, 200)}`,
          );
        }

        const forecastJson = (await forecastRes.json()) as NwsForecastResponse;
        const rawPeriods = forecastJson.properties?.periods ?? [];

        const weather: WeatherPayload = {
          synced_at: new Date().toISOString(),
          source: "weather.gov",
          periods: rawPeriods.slice(0, 7).map((p) => ({
            name: p.name,
            is_daytime: p.isDaytime,
            temp_f: p.temperature,
            short: p.shortForecast,
            detailed: p.detailedForecast,
            precip_pct: p.probabilityOfPrecipitation?.value ?? null,
            wind: p.windSpeed,
          })),
        };

        // ── Update weather + weather_synced_at (NOT synced_at: ese timestamp
        // es de sync-park-live-data/alerts). Si había un error de weather de
        // una corrida previa en sync_errors, se limpia aquí.
        const cleanedErrors = nonWeatherErrors(park.id);
        const hadWeatherError =
          cleanedErrors.length !== (liveByDestId.get(park.id)?.sync_errors?.length ?? 0);

        const { error: updateErr } = await db
          .from("park_live_data")
          .update({
            weather,
            weather_synced_at: weather.synced_at,
            ...(hadWeatherError ? { sync_errors: cleanedErrors } : {}),
          })
          .eq("destination_id", park.id);

        if (updateErr) {
          throw new Error(`Error actualizando DB: ${updateErr.message}`);
        }

        console.log(
          `[sync-park-weather] ✓ ${park.park_code} — ${rawPeriods.length} períodos (${latR},${lngR})`,
        );
        synced++;

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[sync-park-weather] ✗ ${park.park_code}: ${msg}`);
        failed++;

        // Registrar el fallo en sync_errors de la fila (antes se tragaba en
        // silencio y la fila parecía sana). Best-effort: si este update también
        // falla, se loguea y el batch continúa.
        try {
          const { error: recordErr } = await db
            .from("park_live_data")
            .update({
              sync_errors: [
                ...nonWeatherErrors(park.id),
                { step: "weather", error: msg.slice(0, 300) },
              ],
            })
            .eq("destination_id", park.id);
          if (recordErr) {
            console.error(
              `[sync-park-weather] no se pudo registrar sync_error de ${park.park_code}: ${recordErr.message}`,
            );
          }
        } catch (recordErr) {
          console.error(
            `[sync-park-weather] no se pudo registrar sync_error de ${park.park_code}:`,
            recordErr,
          );
        }
      }
    }

    console.log(`[sync-park-weather] completado synced=${synced} failed=${failed}`);

    return new Response(
      JSON.stringify({ synced, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error) {
    console.error("[sync-park-weather] error no controlado", error);
    const message = error instanceof Error ? error.message : "Error inesperado";

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
