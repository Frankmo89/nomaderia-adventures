import { useId, useMemo } from "react";
import { useDestinationsDirectory } from "@/hooks/use-destinations";
import { getRegionCodes } from "@/lib/regions";
import { US_STATE_PATHS } from "@/lib/us-state-paths";

// Trail Green (#1F6F43) lightened ~60% toward white — reads clearly against
// forest-dark at higher opacity, unlike the base brand green which is
// already dark-toned and disappears at low opacity.
const HAS_PARK_FILL = "#A5C5B4";
const NO_PARK_FILL = "#E4E2DB"; // stone
const STROKE_COLOR = "#FBFAF7"; // cloud

// Fades the map to fully transparent behind the fixed navbar so state shapes
// never sit directly behind the logo/hamburger — clean forest-dark there
// instead. The fixed navbar measures 76px against this header's ~240px
// mobile height (~32%), so the plateau holds full transparency to 34% (a
// hair past the navbar edge) before ramping to full map opacity by 48%.
// Pure visual mask on this layer; Navbar itself is untouched.
const TOP_FADE_MASK = "linear-gradient(to bottom, transparent 0%, transparent 34%, black 48%)";

const STATE_ENTRIES = Object.entries(US_STATE_PATHS);

// Decorative background layer for the Destinos header — flat state-tint map
// (Mobbin research: Maxima Therapy / Braintrust pattern). Zero pins, zero
// coordinates, zero interactivity. Reuses the same cached
// useDestinationsDirectory() query already fetched by Destinations.tsx, so
// this adds no extra Supabase call.
const USStateTintMap = () => {
  const grainId = useId();
  const clipId = useId();
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
      style={{ maskImage: TOP_FADE_MASK, WebkitMaskImage: TOP_FADE_MASK }}
    >
      <svg
        viewBox="0 0 959 593"
        preserveAspectRatio="xMidYMid meet"
        className="w-[85%] max-w-2xl"
      >
        <defs>
          {/* Same feTurbulence -> feColorMatrix -> feComponentTransfer ->
              feComposite chain as SectionDivider's grainFilter. Applied once
              to a full-viewBox rect (below) instead of per-path like
              SectionDivider does, so 50 states share one filter instance. */}
          <filter id={grainId} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
            <feColorMatrix
              in="noise"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.2126 0.7152 0.0722 0 0"
              result="noiseAlpha"
            />
            <feComponentTransfer in="noiseAlpha" result="grain">
              <feFuncA type="linear" slope="0.045" intercept="0" />
            </feComponentTransfer>
            <feComposite in="grain" in2="SourceGraphic" operator="in" />
          </filter>
          {/* Union of all state shapes — confines the grain rect below to the
              map silhouette so it doesn't bleed into the empty gaps around
              the AK/HI insets. */}
          <clipPath id={clipId}>
            {STATE_ENTRIES.map(([code, d]) => (
              <path key={code} d={d} />
            ))}
          </clipPath>
        </defs>

        {STATE_ENTRIES.map(([code, d]) => {
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

        {/* Grain overlay — purely additive texture, doesn't touch fill
            colors/contrast above. */}
        <rect
          x="0"
          y="0"
          width="959"
          height="593"
          fill="#000000"
          filter={`url(#${grainId})`}
          clipPath={`url(#${clipId})`}
        />
      </svg>
    </div>
  );
};

export default USStateTintMap;
