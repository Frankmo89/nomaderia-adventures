import { LocateFixed, MapPin } from "lucide-react";
import { useUserOrigin } from "@/hooks/useUserOrigin";
import { cn } from "@/lib/utils";

// Hubs con mayor población hispana en EE. UU. — fallback manual cuando el
// usuario no quiere compartir su ubicación exacta.
const ORIGIN_CITIES = [
  { key: "san-diego", label: "San Diego", lat: 32.7157, lng: -117.1611 },
  { key: "los-angeles", label: "Los Ángeles", lat: 34.0522, lng: -118.2437 },
  { key: "phoenix", label: "Phoenix", lat: 33.4484, lng: -112.074 },
  { key: "houston", label: "Houston", lat: 29.7604, lng: -95.3698 },
  { key: "dallas", label: "Dallas", lat: 32.7767, lng: -96.797 },
  { key: "chicago", label: "Chicago", lat: 41.8781, lng: -87.6298 },
  { key: "miami", label: "Miami", lat: 25.7617, lng: -80.1918 },
  { key: "nueva-york", label: "Nueva York", lat: 40.7128, lng: -74.006 },
] as const;

const GEO_VALUE = "__geo__";

export function OriginPicker({ className }: { className?: string }) {
  const { origin, isFallback, isLocating, requestLocation, setManualOrigin } = useUserOrigin();

  const matchedCity = ORIGIN_CITIES.find((c) => c.label === origin.label);
  const selectValue = !isFallback && !matchedCity ? GEO_VALUE : matchedCity?.key ?? "san-diego";

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <span className="inline-flex items-center gap-1 shrink-0">
        <MapPin className="h-3.5 w-3.5" />
        Distancias desde:
      </span>

      <select
        aria-label="Elige tu ciudad de origen"
        value={selectValue}
        onChange={(e) => {
          const city = ORIGIN_CITIES.find((c) => c.key === e.target.value);
          if (city) setManualOrigin(city.lat, city.lng, city.label);
        }}
        className="rounded-md border border-stone-200 bg-background px-2 py-1 text-foreground focus:outline-none focus:ring-1 focus:ring-green/50 cursor-pointer"
      >
        {!isFallback && !matchedCity && (
          <option value={GEO_VALUE}>{origin.label ?? "Tu ubicación"}</option>
        )}
        {ORIGIN_CITIES.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={requestLocation}
        disabled={isLocating}
        className="inline-flex items-center gap-1 text-green hover:underline disabled:opacity-60 shrink-0"
      >
        <LocateFixed className="h-3.5 w-3.5" />
        {isLocating ? "ubicando…" : "usar mi ubicación"}
      </button>
    </div>
  );
}

export default OriginPicker;
