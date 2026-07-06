import { useId } from "react";

type SectionDividerProps = {
  variant?: "simple" | "layered" | "topo";
  dark?: boolean;
  /**
   * When set, the mountain variants render as filled silhouettes in
   * this color (use the color of the section ABOVE) that cuts down into the
   * section below — for visible light↔dark transitions. When omitted, it falls
   * back to #14201A in light mode and #EAF0EC in dark mode.
   */
  fill?: string;
};

/**
 * Purely decorative SVG divider that sits on the seam between two sections,
 * evoking topographic ridgelines. h-0 container keeps layout unaffected;
 * the SVG overflows to straddle the boundary.
 *
 * variant="simple"      — soft, organic wave/hill silhouette
 * variant="layered"     — overlapping rolling ridgelines with depth
 * variant="topo"   — three parallel contour strokes, stronger presence
 * dark             — switches stroke to stone/sand for rendering over dark backgrounds
 */
const SectionDivider = ({
  variant = "simple",
  dark = false,
  fill,
}: SectionDividerProps) => {
  const grainId = useId();
  const base = dark ? "rgba(229,221,210," : "rgba(61,47,35,";
  const fallbackFill = dark ? "#EAF0EC" : "#14201A";
  const crestFill = fill ?? fallbackFill;

  // Fine-grain texture: fractal noise reduced to a low-alpha black speckle,
  // then clipped to the host element's own shape via feComposite "in" so it
  // can never bleed past the crest (the earlier feGaussianBlur approach did).
  const grainFilter = (
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
  );

  if (variant === "topo") {
    const opacities = dark ? ["0.18", "0.11", "0.06"] : ["0.11", "0.07", "0.04"];
    return (
      <div
        aria-hidden="true"
        className="relative h-0 z-10 pointer-events-none"
      >
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="absolute left-0 w-full -translate-y-1/2 h-[72px] sm:h-[100px]"
          xmlns="http://www.w3.org/2000/svg"
          focusable="false"
        >
          <defs>{grainFilter}</defs>
          <rect x="0" y="0" width="1440" height="100" fill="#000000" filter={`url(#${grainId})`} />
          {/* Three contour lines spaced ~20px apart in the viewBox */}
          <path
            d="M0,22 C200,6 400,40 600,16 C800,0 1000,34 1200,12 L1440,22"
            fill="none"
            stroke={`${base}${opacities[0]})`}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M0,44 C200,28 400,62 600,38 C800,20 1000,56 1200,34 L1440,44"
            fill="none"
            stroke={`${base}${opacities[1]})`}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M0,66 C200,50 400,84 600,60 C800,42 1000,78 1200,56 L1440,66"
            fill="none"
            stroke={`${base}${opacities[2]})`}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  if (variant === "layered") {
    return (
      <div
        aria-hidden="true"
        className="relative h-0 z-10 pointer-events-none"
      >
        <svg
         viewBox="0 0 1440 112"
         preserveAspectRatio="none"
         className="absolute left-0 w-full -translate-y-1/2 h-[76px] sm:h-[112px]"
         xmlns="http://www.w3.org/2000/svg"
         focusable="false"
        >
          <defs>{grainFilter}</defs>
          <path
           d="M0,0 H1440 V68 C1367,68 1293,60 1220,60 C1113,60 1007,72 900,72 C800,72 700,64 600,64 C500,64 400,70 300,70 C200,70 100,62 0,62 Z"
           fill={crestFill}
           fillOpacity="0.34"
         />
         <path
           d="M0,0 H1440 V68 C1367,68 1293,60 1220,60 C1113,60 1007,72 900,72 C800,72 700,64 600,64 C500,64 400,70 300,70 C200,70 100,62 0,62 Z"
           fill="#000000"
           fillOpacity="0.34"
           filter={`url(#${grainId})`}
         />
         <path
           d="M0,0 H1440 V78 C1327,78 1213,52 1100,52 C1020,52 940,72 860,72 C747,72 633,58 520,58 C420,58 320,74 220,74 C147,74 73,66 0,66 Z"
           fill={crestFill}
           fillOpacity="0.66"
         />
         <path
           d="M0,0 H1440 V78 C1327,78 1213,52 1100,52 C1020,52 940,72 860,72 C747,72 633,58 520,58 C420,58 320,74 220,74 C147,74 73,66 0,66 Z"
           fill="#000000"
           fillOpacity="0.66"
           filter={`url(#${grainId})`}
         />
         <path
           d="M0,0 H1440 V86 C1380,86 1320,56 1260,56 C1167,56 1073,26 980,26 C920,26 860,66 800,66 C660,66 520,50 380,50 C300,50 220,78 140,78 C93,78 47,60 0,60 Z"
           fill={crestFill}
         />
         <path
           d="M0,0 H1440 V86 C1380,86 1320,56 1260,56 C1167,56 1073,26 980,26 C920,26 860,66 800,66 C660,66 520,50 380,50 C300,50 220,78 140,78 C93,78 47,60 0,60 Z"
           fill="#000000"
           filter={`url(#${grainId})`}
         />
       </svg>
     </div>
   );
  }

  return (
   <div
    aria-hidden="true"
    className="relative h-0 z-10 pointer-events-none"
   >
    <svg
      viewBox="0 0 1440 92"
      preserveAspectRatio="none"
      className="absolute left-0 w-full -translate-y-1/2 h-[50px] sm:h-[92px]"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
    >
      <defs>{grainFilter}</defs>
      <path
        d="M0,0 H1440 V46 C1300,70 1150,18 980,34 C810,50 660,68 500,36 C340,10 170,54 0,40 Z"
        fill={crestFill}
      />
      <path
        d="M0,0 H1440 V46 C1300,70 1150,18 980,34 C810,50 660,68 500,36 C340,10 170,54 0,40 Z"
        fill="#000000"
        filter={`url(#${grainId})`}
      />
    </svg>
   </div>
  );
};

export default SectionDivider;
