type SectionDividerProps = {
  variant?: "simple" | "layered" | "snow-capped" | "topo";
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
 * variant="simple"      — one jagged crest silhouette
 * variant="layered"     — overlapping ridgelines with depth
 * variant="snow-capped" — taller peaks with light alpine cap accents
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
           d="M0,0 H1440 V80 L1380,64 L1300,58 L1250,72 L1170,60 L1120,74 L1030,58 L970,68 L900,60 L830,72 L760,58 L700,66 L630,74 L560,60 L500,70 L430,58 L360,68 L290,60 L220,74 L140,58 L60,68 L0,64 Z"
           fill={crestFill}
           fillOpacity="0.34"
         />
         <path
           d="M0,0 H1440 V86 L1400,52 L1330,84 L1260,48 L1194,80 L1128,44 L1064,82 L1000,52 L932,78 L864,46 L800,80 L734,50 L668,84 L602,46 L536,78 L470,52 L404,84 L338,48 L272,80 L206,50 L140,82 L74,46 L0,74 Z"
           fill={crestFill}
           fillOpacity="0.66"
         />
         <path
           d="M0,0 H1440 V90 L1372,58 L1316,94 L1246,22 L1182,66 L1122,44 L1058,96 L992,16 L932,54 L868,32 L806,92 L742,48 L678,68 L612,22 L548,64 L482,38 L416,92 L354,50 L292,72 L228,20 L164,58 L100,90 L40,36 L0,66 Z"
           fill={crestFill}
         />
       </svg>
     </div>
   );
  }

  if (variant === "snow-capped") {
   return (
    <div
      aria-hidden="true"
      className="relative h-0 z-10 pointer-events-none"
    >
      <svg
        viewBox="0 0 1440 124"
        preserveAspectRatio="none"
        className="absolute left-0 w-full -translate-y-1/2 h-[60px] sm:h-[124px]"
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
      >
        <path
          d="M0,0 H1440 V102 L1370,60 L1318,110 L1256,24 L1192,72 L1128,46 L1060,114 L996,14 L930,58 L876,34 L814,108 L752,50 L686,70 L626,18 L566,64 L500,40 L436,112 L374,52 L316,76 L254,20 L196,60 L132,96 L70,36 L0,68 Z"
          fill={crestFill}
        />
        <path d="M1020,52 L996,14 L972,30 Z" fill="#FFFFFF" fillOpacity="0.95" />
        <path d="M648,37 L626,18 L604,35 Z" fill="#FFFFFF" fillOpacity="0.9" />
        <path d="M276,40 L254,20 L232,35 Z" fill="#FFFFFF" fillOpacity="0.88" />
        <path d="M90,55 L70,36 L50,45 Z" fill="#FFFFFF" fillOpacity="0.85" />
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
        d="M0,0 H1440 V68 L1382,52 L1338,74 L1268,18 L1204,58 L1150,40 L1088,76 L1020,14 L966,50 L902,30 L840,72 L768,46 L706,64 L642,22 L580,58 L516,36 L452,74 L388,48 L330,66 L270,20 L206,52 L150,70 L86,34 L28,60 L0,50 Z"
        fill={crestFill}
      />
    </svg>
   </div>
  );
};

export default SectionDivider;
