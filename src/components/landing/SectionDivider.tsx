import { useId } from "react";

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
  const blurId = useId().replace(/:/g, "");

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
         <defs>
           <filter id={blurId} x="-5%" y="-5%" width="110%" height="110%">
             <feGaussianBlur stdDeviation="6" />
           </filter>
         </defs>
          <path
           d="M0,0 H1440 V68 L1332,58 L1236,86 L1114,36 L1008,92 L884,44 L772,84 L650,28 L528,88 L410,40 L286,82 L176,32 L88,74 L0,48 Z"
           fill={crestFill}
           fillOpacity="0.42"
           filter={`url(#${blurId})`}
         />
         <path
           d="M0,0 H1440 V84 L1336,62 L1222,102 L1104,22 L986,108 L864,52 L748,94 L628,16 L502,106 L390,44 L276,96 L158,30 L76,86 L0,54 Z"
           fill={crestFill}
           fillOpacity="0.72"
         />
         <path
           d="M0,0 H1440 V92 L1310,70 L1196,110 L1084,30 L964,112 L846,58 L726,100 L612,18 L486,108 L366,48 L252,98 L140,34 L58,88 L0,60 Z"
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
          d="M0,0 H1440 V100 L1336,86 L1248,44 L1162,94 L1078,18 L990,102 L904,64 L816,98 L726,14 L634,106 L544,46 L454,104 L364,20 L274,96 L186,62 L108,92 L52,40 L0,74 Z"
          fill={crestFill}
        />
        <path d="M1101,39 L1078,18 L1055,40 Z" fill="#FFFFFF" fillOpacity="0.78" />
        <path d="M753,39 L726,14 L700,40 Z" fill="#FFFFFF" fillOpacity="0.78" />
        <path d="M388,43 L364,20 L337,43 Z" fill="#FFFFFF" fillOpacity="0.74" />
        <path d="M72,59 L52,40 L34,52 Z" fill="#FFFFFF" fillOpacity="0.68" />
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
        d="M0,0 H1440 V74 L1360,70 L1296,24 L1218,68 L1138,44 L1052,72 L972,56 L890,74 L804,20 L716,70 L636,42 L548,74 L470,58 L382,72 L294,26 L208,70 L128,46 L58,72 L0,64 Z"
        fill={crestFill}
      />
    </svg>
   </div>
  );
};

export default SectionDivider;
