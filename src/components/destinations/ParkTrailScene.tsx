import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  SCENE_PALETTES,
  scenePhaseForHour,
  sceneTileUrls,
  type ScenePhase,
} from "@/lib/park-scene-tiles";

// Header scene for /destinos (ADR-043), drawn in code: a hiker walks along a
// ridge while park landmarks drift past in four layers (far ranges,
// landmarks, pines, the ridge). Each layer slides one tile per loop, so the
// seam never shows; nearer layers move faster. Styles and keyframes live in
// src/index.css under `.trail-scene`.
//
// The palette follows the visitor's clock (dawn, day, dusk, night). For
// previews, `?escena=amanecer|dia|atardecer|noche` forces one.
//
// Decorative only (aria-hidden). It stops when off screen and stands still
// with "reduce motion". Everything stays below the subtitle, and the sky stays
// dark behind the title, subtitle and navbar in every palette.

const PHASE_PARAM: Record<string, ScenePhase> = {
  amanecer: "dawn",
  dia: "day",
  atardecer: "dusk",
  noche: "night",
};

function currentPhase(): ScenePhase {
  try {
    const forced = new URLSearchParams(window.location.search).get("escena");
    if (forced && PHASE_PARAM[forced]) return PHASE_PARAM[forced];
  } catch {
    // No URL access: fall back to the clock.
  }
  return scenePhaseForHour(new Date().getHours());
}

/**
 * Star positions as [left %, top %]. None sits behind the title or subtitle
 * (33–58% down, center): those rows keep stars at the edges.
 */
const STARS: ReadonlyArray<readonly [number, number]> = [
  [8, 18], [17, 40], [26, 12], [37, 22], [46, 8], [58, 20],
  [84, 46], [73, 14], [95, 30], [93, 10], [4, 48], [6, 60],
];

/** The hiker: legs, arm and pole swing (keyframes in index.css). */
const Hiker = ({ color }: { color: string }) => (
  <svg className="trail-scene__hiker" viewBox="0 0 60 100" focusable="false">
    <g fill={color} stroke={color} strokeLinecap="round" strokeLinejoin="round">
      <g className="trail-scene__leg trail-scene__leg--back">
        <path fill="none" strokeWidth="7" d="M30,57 L30,77" />
        <g className="trail-scene__shin">
          <path fill="none" strokeWidth="6" d="M30,77 L30,94" />
          <path strokeWidth="1" d="M26,93 L36,94.5 Q39,99 35.5,99 L26,99 Z" />
        </g>
      </g>
      <g className="trail-scene__upper">
        <rect x="14" y="29" width="14" height="27" rx="4" transform="rotate(-6 21 42)" />
        <ellipse cx="20" cy="28" rx="7.5" ry="3.2" />
        <path strokeWidth="2" d="M25,31 L37,32 L35.5,58 L25,58 Z" />
        <circle cx="35" cy="21" r="6.4" />
        <path strokeWidth="1" d="M29.5,16 L30.5,10.5 Q35,8 39.5,10.5 L40.5,16 Z" />
        <ellipse cx="35" cy="16" rx="9.5" ry="1.9" />
        <g className="trail-scene__arm">
          <path fill="none" strokeWidth="5" d="M33,34 L36.5,45 L41,52" />
          <path fill="none" strokeWidth="1.7" d="M40,49 L47,99" />
        </g>
      </g>
      <g className="trail-scene__leg">
        <path fill="none" strokeWidth="7" d="M30,57 L30,77" />
        <g className="trail-scene__shin">
          <path fill="none" strokeWidth="6" d="M30,77 L30,94" />
          <path strokeWidth="1" d="M26,93 L36,94.5 Q39,99 35.5,99 L26,99 Z" />
        </g>
      </g>
    </g>
  </svg>
);

const ParkTrailScene = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [offscreen, setOffscreen] = useState(false);
  const [phase] = useState(currentPhase);
  const palette = SCENE_PALETTES[phase];
  const tiles = useMemo(() => sceneTileUrls(palette), [palette]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const [s0, s1, s2, s3, s4] = palette.sky;
  const vars = {
    "--trail-sky": `linear-gradient(to bottom, ${s0} 0%, ${s1} 38%, ${s2} 58%, ${s3} 82%, ${s4} 100%)`,
    "--trail-glow": palette.glow,
    "--trail-orb": palette.orb.color,
    "--trail-orb-glow": palette.orb.glow,
    "--trail-stars": String(palette.stars),
    "--trail-rim": palette.rim,
    "--trail-scrim": palette.scrim,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="trail-scene"
      data-phase={phase}
      data-paused={offscreen ? "" : undefined}
      style={vars}
    >
      <div className="trail-scene__glow" />
      <div className="trail-scene__scrim" />
      {palette.stars > 0 &&
        STARS.map(([left, top], i) => (
          <span
            key={`${left}-${top}`}
            className="trail-scene__star"
            style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${-i * 0.7}s` }}
          />
        ))}
      <div className={`trail-scene__orb trail-scene__orb--${palette.orb.position}`} />
      {palette.clouds && (
        <div className="trail-scene__layer trail-scene__clouds" style={{ backgroundImage: tiles.clouds }} />
      )}
      <div className="trail-scene__layer trail-scene__far" style={{ backgroundImage: tiles.far }} />
      <div className="trail-scene__layer trail-scene__landmarks" style={{ backgroundImage: tiles.landmarks }} />
      <div className="trail-scene__layer trail-scene__trees" style={{ backgroundImage: tiles.trees }} />
      <Hiker color={palette.ridge} />
      <div className="trail-scene__layer trail-scene__ridge" style={{ backgroundImage: tiles.ridge }} />
    </div>
  );
};

export default ParkTrailScene;
