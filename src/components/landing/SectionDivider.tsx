type SectionDividerProps = {
  variant?: "ridge" | "topo";
  dark?: boolean;
  /**
   * When set, the ridge variant renders as a filled mountain silhouette in
   * this color (use the color of the section ABOVE) that cuts down into the
   * section below — for visible light↔dark transitions. Omit for the original
   * decorative stroke line.
   */
  fill?: string;
};

/**
 * Purely decorative SVG divider that sits on the seam between two sections,
 * evoking topographic ridgelines. h-0 container keeps layout unaffected;
 * the SVG overflows to straddle the boundary.
 *
 * variant="ridge"  — single gentle stroke, warm walnut tint, for light→light transitions
 *                    (or a filled silhouette when `fill` is provided)
 * variant="topo"   — three parallel contour strokes, stronger presence
 * dark             — switches stroke to stone/sand for rendering over dark backgrounds
 */
const SectionDivider = ({ variant = "ridge", dark = false, fill }: SectionDividerProps) => {
  const base = dark ? "rgba(229,221,210," : "rgba(61,47,35,";

  if (variant === "topo") {
    const opacities = dark ? ["0.18", "0.11", "0.06"] : ["0.11", "0.07", "0.04"];
    return (
      <div
        aria-hidden="true"
        className="relative h-0 z-10 pointer-events-none hidden sm:block"
      >
        <svg
          viewBox="0 0 1440 100"
          preserveAspectRatio="none"
          className="absolute left-0 w-full -translate-y-1/2"
          style={{ height: "100px" }}
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

  // variant="ridge" — filled silhouette when `fill` is set (cuts into the
  // section below), otherwise the original decorative stroke line.
  if (fill) {
    return (
      <div
        aria-hidden="true"
        className="relative h-0 z-10 pointer-events-none hidden sm:block"
      >
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          className="absolute left-0 w-full -translate-y-1/2"
          style={{ height: "80px" }}
          xmlns="http://www.w3.org/2000/svg"
          focusable="false"
        >
          {/* Solid ridge silhouette: fills the top (matching the section above)
              with a wavy ridgeline as its bottom edge that bites into the
              section below. */}
          <path
            d="M0,0 L1440,0 L1440,58 C1320,42 1200,66 1080,44 C900,68 720,38 540,64 C360,40 180,70 0,46 Z"
            fill={fill}
          />
        </svg>
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="relative h-0 z-10 pointer-events-none hidden sm:block"
    >
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="absolute left-0 w-full -translate-y-1/2"
        style={{ height: "80px" }}
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
      >
        {/* Asymmetric ridge — peaks vary so it reads as natural terrain */}
        <path
          d="M0,52 C180,24 360,68 540,32 C720,4 900,56 1080,26 C1200,8 1320,50 1440,34"
          fill="none"
          stroke={`${base}0.09)`}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default SectionDivider;
