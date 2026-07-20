import { motion } from "framer-motion";
import { Sun, CloudSun, Cloud, CloudRain, CloudSnow, Wind, CloudFog } from "lucide-react";
import type { WeatherPayload, WeatherPeriod } from "@/hooks/use-park-live-data";

interface ParkWeatherCardProps {
  weather: WeatherPayload | null | undefined;
  /**
   * "current"  → bloque compacto de condiciones actuales + SOUL tip (header del
   *              parque, bajo el banner de alertas). Info de decisión.
   * "forecast" → strip extendido de próximos períodos (tab Preparación).
   */
  variant: "current" | "forecast";
}

// ─── Localization ──────────────────────────────────────────────────────────────

const DAY_MAP: Record<string, string> = {
  Monday: "Lunes",
  Tuesday: "Martes",
  Wednesday: "Miércoles",
  Thursday: "Jueves",
  Friday: "Viernes",
  Saturday: "Sábado",
  Sunday: "Domingo",
};

// Nombres de período no-día que manda weather.gov
const PERIOD_MAP: Record<string, string> = {
  "Today": "Hoy",
  "Tonight": "Esta noche",
  "This Afternoon": "Esta tarde",
  "Overnight": "Madrugada",
};

function localizePeriodName(name: string): string {
  const mapped = PERIOD_MAP[name];
  if (mapped) return mapped;
  const nightMatch = name.match(/^(\w+)\s+Night$/);
  if (nightMatch) {
    const day = DAY_MAP[nightMatch[1]];
    return day ? `${day} (noche)` : name;
  }
  return DAY_MAP[name] ?? name;
}

// Label del bloque de condiciones actuales: un nombre fuera del mapa cae a
// "Ahora" en vez de mostrar inglés crudo. Solo para el período destacado —
// en el strip de pronóstico "Ahora" sería incorrecto.
function localizeCurrentPeriodName(name: string): string {
  const localized = localizePeriodName(name);
  return localized === name ? "Ahora" : localized;
}

const SHORT_MAP: Record<string, string> = {
  "Sunny": "Soleado",
  "Mostly Sunny": "Mayormente soleado",
  "Partly Sunny": "Mayormente soleado",
  "Partly Cloudy": "Parcialmente nublado",
  "Mostly Cloudy": "Mayormente nublado",
  "Cloudy": "Nublado",
  "Overcast": "Nublado",
  "Clear": "Despejado",
  "Mostly Clear": "Mayormente despejado",
  "Rain": "Lluvia",
  "Showers": "Lluvia",
  "Rain Showers": "Lluvia",
  "Slight Chance Rain Showers": "Lluvia",
  "Chance Rain Showers": "Lluvia",
  "Thunderstorms": "Tormentas",
  "Chance Thunderstorms": "Tormentas",
  "Snow": "Nieve",
  "Chance Snow": "Nieve",
  "Windy": "Ventoso",
  "Fog": "Niebla",
  "Patchy Fog": "Niebla parcial",
  "Haze": "Bruma",
};

function localizeShort(short: string): string {
  return SHORT_MAP[short] ?? short;
}

// ─── Icon mapping ──────────────────────────────────────────────────────────────

type WeatherIcon = typeof Sun | typeof CloudSun | typeof Cloud | typeof CloudRain | typeof CloudSnow | typeof Wind | typeof CloudFog;

function getIcon(short: string, isDaytime: boolean): WeatherIcon {
  const s = short.toLowerCase();
  if (s.includes("thunder")) return CloudRain;
  if (s.includes("snow") || s.includes("blizzard") || s.includes("flurr")) return CloudSnow;
  if (s.includes("rain") || s.includes("shower") || s.includes("drizzle")) return CloudRain;
  if (s.includes("fog") || s.includes("mist")) return CloudFog;
  if (s.includes("haze") || s.includes("smoke") || s.includes("dust")) return CloudFog;
  if (s.includes("wind") && !s.includes("cloud")) return Wind;
  if ((s.includes("sunny") || s.includes("clear")) && !s.includes("mostly") && !s.includes("partly")) {
    return isDaytime ? Sun : Cloud;
  }
  if (s.includes("mostly sunny") || s.includes("partly") || s.includes("mostly clear")) return CloudSun;
  if (s.includes("cloud") || s.includes("overcast")) return Cloud;
  return isDaytime ? Sun : Cloud;
}

// ─── SOUL safety tip ──────────────────────────────────────────────────────────

function getSoulTip(period: WeatherPeriod): string | null {
  const { temp_f, short } = period;
  const s = short.toLowerCase();

  if (temp_f >= 100) return "🥵 Calor extremo. Lleva mínimo 4 L de agua por persona, camina al amanecer o al atardecer y evita el mediodía.";
  if (temp_f >= 90) return "Hace calor. Lleva 3+ L de agua por persona, sombrero y bloqueador. Evita las horas pico de sol.";
  if (temp_f <= 32) return "🥶 Bajo cero. Capas térmicas, gorro y guantes — el desierto se enfría muchísimo de noche.";
  if (temp_f <= 45) return "Hace frío, sobre todo de noche. Lleva chamarra abrigadora y capas.";
  if (s.includes("rain") || s.includes("shower") || s.includes("thunderstorm")) {
    return "Posible lluvia o tormenta. En cañones evita zonas de inundación repentina y revisa el clima antes de salir.";
  }
  if (s.includes("snow")) return "Posible nieve — algunos caminos pueden cerrar. Confirma condiciones antes de ir.";
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toCelsius(f: number): number {
  return Math.round(((f - 32) * 5) / 9);
}

function formatSyncedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Los_Angeles",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ParkWeatherCard({ weather, variant }: ParkWeatherCardProps) {
  if (!weather || !weather.periods || weather.periods.length === 0) return null;

  const [featured] = weather.periods;
  const FeaturedIcon = getIcon(featured.short, featured.is_daytime);

  // ── variant="current": bloque compacto en el header del parque ─────────────
  if (variant === "current") {
    const soulTip = getSoulTip(featured);

    return (
      <div className="border-b border-border bg-white">
        <div className="container mx-auto px-4 max-w-3xl" style={{ paddingTop: 12, paddingBottom: 12 }}>
          <div className="flex items-center gap-3">
            <FeaturedIcon className="h-6 w-6 text-amber shrink-0" />
            <p className="flex-1 min-w-0 font-sans text-ink" style={{ fontSize: 14 }}>
              <span
                className="uppercase text-sage"
                style={{ fontSize: 11, letterSpacing: "0.06em", fontWeight: 500, marginRight: 8 }}
              >
                {localizeCurrentPeriodName(featured.name)}
              </span>
              <span className="font-semibold" style={{ fontSize: 15 }}>
                {featured.temp_f}°F
              </span>
              <span className="text-sage"> / {toCelsius(featured.temp_f)}°C</span>
              <span> · {localizeShort(featured.short)}</span>
              {featured.precip_pct != null && featured.precip_pct > 0 && (
                <span className="text-sage"> · {featured.precip_pct}% de lluvia</span>
              )}
            </p>
          </div>

          {/* SOUL safety tip — highlighted amber block */}
          {soulTip && (
            <div
              className="flex items-start gap-3 rounded-xl bg-amber/10"
              style={{ padding: "10px 12px", marginTop: 10 }}
            >
              <div
                className="shrink-0 rounded-full bg-amber"
                style={{ width: 3, alignSelf: "stretch" }}
              />
              <p className="font-sans text-slate leading-relaxed" style={{ fontSize: 13 }}>
                {soulTip}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── variant="forecast": strip extendido en el tab Preparación ──────────────
  // El período actual vive en el header inline; el strip arranca en el siguiente.
  const stripPeriods = weather.periods.slice(1, 7);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-8"
    >
      <h3
        className="font-serif font-bold text-[#1C1917]"
        style={{ fontSize: 22, marginBottom: 12 }}
      >
        El tiempo
      </h3>

      {/* Small inline current header — context only; the strip is the emphasis */}
      <p className="font-sans text-slate" style={{ fontSize: 14, marginBottom: 12 }}>
        <span
          className="uppercase text-sage"
          style={{ fontSize: 11, letterSpacing: "0.06em", fontWeight: 500, marginRight: 8 }}
        >
          {localizeCurrentPeriodName(featured.name)}
        </span>
        <span className="font-semibold text-ink" style={{ fontSize: 15 }}>
          {featured.temp_f}°F
        </span>
        <span className="text-sage"> / {toCelsius(featured.temp_f)}°C</span>
        <span> · {localizeShort(featured.short)}</span>
      </p>

      {/* Horizontal scroll — upcoming periods */}
      <div
        className="flex gap-3 overflow-x-auto scrollbar-hide"
        style={{ paddingBottom: 4 }}
      >
        {stripPeriods.map((period, i) => {
          const Icon = getIcon(period.short, period.is_daytime);
          return (
            <div
              key={i}
              className="flex-none flex flex-col items-center bg-white border border-[#E5E7EB] rounded-xl"
              style={{ minWidth: 80, padding: "10px 12px", gap: 5 }}
            >
              <p
                className="font-sans text-[#6B7280] text-center leading-tight"
                style={{ fontSize: 11, fontWeight: 500 }}
              >
                {localizePeriodName(period.name)}
              </p>
              <Icon className="h-6 w-6 text-amber" />
              <p
                className="font-sans font-semibold text-[#1C1917]"
                style={{ fontSize: 15 }}
              >
                {period.temp_f}°F
              </p>
              {period.precip_pct != null && period.precip_pct > 0 && (
                <p className="font-sans text-[#6B7280]" style={{ fontSize: 11 }}>
                  {period.precip_pct}%
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer attribution */}
      <p
        className="font-sans text-[#9CA3AF] mt-3"
        style={{ fontSize: 11 }}
      >
        Actualizado {formatSyncedAt(weather.synced_at)} · Fuente: Servicio Meteorológico Nacional (NWS)
      </p>
    </motion.section>
  );
}
