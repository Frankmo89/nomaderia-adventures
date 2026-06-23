import { motion } from "framer-motion";
import { Sun, CloudSun, Cloud, CloudRain, CloudSnow, Wind, CloudFog } from "lucide-react";
import type { WeatherPayload, WeatherPeriod } from "@/hooks/use-park-live-data";

interface ParkWeatherCardProps {
  weather: WeatherPayload | null | undefined;
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

function localizePeriodName(name: string): string {
  if (name === "Today") return "Hoy";
  if (name === "Tonight") return "Esta noche";
  const nightMatch = name.match(/^(\w+)\s+Night$/);
  if (nightMatch) {
    const day = DAY_MAP[nightMatch[1]];
    return day ? `${day} (noche)` : name;
  }
  return DAY_MAP[name] ?? name;
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

export default function ParkWeatherCard({ weather }: ParkWeatherCardProps) {
  if (!weather || !weather.periods || weather.periods.length === 0) return null;

  const [featured, ...rest] = weather.periods;
  const scrollPeriods = rest.slice(0, 5);
  const FeaturedIcon = getIcon(featured.short, featured.is_daytime);
  const soulTip = getSoulTip(featured);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-8"
    >
      <h3
        className="font-serif font-bold text-[#1C1917]"
        style={{ fontSize: 22, marginBottom: 16 }}
      >
        El tiempo
      </h3>

      {/* Featured period */}
      <div
        className="bg-white border border-[#E5E7EB] rounded-2xl"
        style={{ padding: 20, marginBottom: 12 }}
      >
        <div className="flex items-start gap-4">
          <FeaturedIcon className="h-10 w-10 text-[#D97706] shrink-0 mt-1" />
          <div className="flex-1 min-w-0">
            <p
              className="font-sans text-[#6B7280] uppercase tracking-[0.06em]"
              style={{ fontSize: 11, fontWeight: 500, marginBottom: 4 }}
            >
              {localizePeriodName(featured.name)}
            </p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="font-serif font-bold text-[#1C1917]"
                style={{ fontSize: 40, lineHeight: 1 }}
              >
                {featured.temp_f}°F
              </span>
              <span className="font-sans text-[#9CA3AF]" style={{ fontSize: 15 }}>
                {toCelsius(featured.temp_f)}°C
              </span>
            </div>
            <p className="font-sans text-[#4B5563]" style={{ fontSize: 15, marginTop: 4 }}>
              {localizeShort(featured.short)}
            </p>
            {featured.precip_pct != null && featured.precip_pct > 0 && (
              <p className="font-sans text-[#6B7280]" style={{ fontSize: 13, marginTop: 2 }}>
                {featured.precip_pct}% de lluvia
              </p>
            )}
          </div>
        </div>

        {/* SOUL safety tip — highlighted amber block */}
        {soulTip && (
          <div
            className="flex items-start gap-3 rounded-xl mt-4"
            style={{ background: "#FEF3C7", padding: "12px 14px" }}
          >
            <div
              className="shrink-0 rounded-full"
              style={{ width: 3, background: "#D97706", alignSelf: "stretch" }}
            />
            <p
              className="font-sans text-[#92400E] leading-relaxed"
              style={{ fontSize: 14 }}
            >
              {soulTip}
            </p>
          </div>
        )}
      </div>

      {/* Horizontal scroll — next periods */}
      {scrollPeriods.length > 0 && (
        <div
          className="flex gap-3 overflow-x-auto scrollbar-hide"
          style={{ paddingBottom: 4 }}
        >
          {scrollPeriods.map((period, i) => {
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
                <Icon className="h-6 w-6 text-[#D97706]" />
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
      )}

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
