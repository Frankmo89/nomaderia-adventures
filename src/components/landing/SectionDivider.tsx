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
  const base = dark ? "rgba(229,221,210," : "rgba(61,47,35,";
  const fallbackFill = dark ? "#EAF0EC" : "#14201A";
  const crestFill = fill ?? fallbackFill;

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
          <path
           d="M0,0 H1440 V78 C1300,70 1150,72 1000,66 C850,60 700,68 550,64 C400,60 250,70 100,64 C60,62 20,66 0,64 Z"
           fill={crestFill}
           fillOpacity="0.34"
         />
         <path
           d="M0,0 H1440 V86 C1300,60 1150,80 1000,58 C850,72 700,50 550,74 C400,52 250,78 100,56 C60,60 20,70 0,66 Z"
           fill={crestFill}
           fillOpacity="0.66"
         />
         <path
           d="M0,0 H1440 V90 C1300,40 1150,96 1000,46 C850,88 700,30 550,84 C400,36 250,92 100,42 C60,50 20,62 0,58 Z"
           fill={crestFill}
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
      <path
        d="M0,0 H1440 V46 C1300,70 1150,18 980,34 C810,50 660,68 500,36 C340,10 170,54 0,40 Z"
        fill={crestFill}
      />
    </svg>
   </div>
  );
};

export default SectionDivider;
