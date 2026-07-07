import { useMemo } from "react";
import { useDestinationsDirectory } from "@/hooks/use-destinations";
import { getRegionCodes } from "@/lib/regions";
import { US_STATE_PATHS } from "@/lib/us-state-paths";

// Trail Green (#1F6F43) lightened ~60% toward white — reads clearly against
// forest-dark at higher opacity, unlike the base brand green which is
// already dark-toned and disappears at low opacity.
const HAS_PARK_FILL = "#A5C5B4";
const NO_PARK_FILL = "#E4E2DB"; // stone
const STROKE_COLOR = "#FBFAF7"; // cloud

// Decorative background layer for the Destinos header — flat state-tint map
// (Mobbin research: Maxima Therapy / Braintrust pattern). Zero pins, zero
// coordinates, zero interactivity. Reuses the same cached
// useDestinationsDirectory() query already fetched by Destinations.tsx, so
// this adds no extra Supabase call.
const USStateTintMap = () => {
  const { data: parks = [] } = useDestinationsDirectory();

  const statesWithParks = useMemo(() => {
    const set = new Set<string>();
    parks.forEach((p) => getRegionCodes(p.region).forEach((c) => set.add(c)));
    return set;
  }, [parks]);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <svg
        viewBox="0 0 959 593"
        preserveAspectRatio="xMidYMid meet"
        className="w-[85%] max-w-2xl"
      >
        {Object.entries(US_STATE_PATHS).map(([code, d]) => {
          const hasPark = statesWithParks.has(code);
          return (
            <path
              key={code}
              d={d}
              fill={hasPark ? HAS_PARK_FILL : NO_PARK_FILL}
              fillOpacity={hasPark ? 0.55 : 0.08}
              stroke={STROKE_COLOR}
              strokeOpacity={0.1}
              strokeWidth={0.75}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default USStateTintMap;
