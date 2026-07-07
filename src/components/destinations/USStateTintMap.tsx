import { useMemo } from "react";
import { useDestinationsDirectory } from "@/hooks/use-destinations";
import { getRegionCodes } from "@/lib/regions";
import { US_STATE_PATHS } from "@/lib/us-state-paths";

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
        className="w-[85%] max-w-2xl opacity-[0.18] sm:opacity-20"
      >
        {Object.entries(US_STATE_PATHS).map(([code, d]) => (
          <path key={code} d={d} fill={statesWithParks.has(code) ? "#1F6F43" : "#E4E2DB"} />
        ))}
      </svg>
    </div>
  );
};

export default USStateTintMap;
