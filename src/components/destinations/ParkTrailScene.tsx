import { useEffect, useRef, useState } from "react";
import { SCENE_COLORS, SCENE_TILE_URLS } from "@/lib/park-scene-tiles";

// Header scene for /destinos (ADR-043), drawn in code: a hiker walks along a
// ridge at night while park landmarks drift past in four layers (far ranges,
// landmarks, pines, the ridge). Each layer slides one tile per loop, so the
// seam never shows; nearer layers move faster. Styles and keyframes live in
// src/index.css under `.trail-scene`.
//
// Decorative only (aria-hidden). It stops when off screen and stands still
// with "reduce motion". Everything stays below the subtitle, so the title and
// subtitle only ever sit on dark sky.

/**
 * Star positions as [left %, top %]. None sits behind the title or subtitle
 * (33–58% down, center): those rows keep stars at the edges.
 */
const STARS: ReadonlyArray<readonly [number, number]> = [
  [8, 18], [17, 40], [26, 12], [37, 22], [46, 8], [58, 20],
  [84, 46], [73, 14], [95, 30], [93, 10], [4, 48], [6, 60],
];

/** The hiker: legs, arm and pole swing (keyframes in index.css). */
const Hiker = () => (
  <svg className="trail-scene__hiker" viewBox="0 0 60 100" focusable="false">
    <g fill={SCENE_COLORS.ridge} stroke={SCENE_COLORS.ridge} strokeLinecap="round" strokeLinejoin="round">
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

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="trail-scene" data-paused={offscreen ? "" : undefined}>
      <div className="trail-scene__glow" />
      {STARS.map(([left, top], i) => (
        <span
          key={`${left}-${top}`}
          className="trail-scene__star"
          style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${-i * 0.7}s` }}
        />
      ))}
      <div className="trail-scene__moon" />
      <div className="trail-scene__layer trail-scene__far" style={{ backgroundImage: SCENE_TILE_URLS.far }} />
      <div className="trail-scene__layer trail-scene__landmarks" style={{ backgroundImage: SCENE_TILE_URLS.landmarks }} />
      <div className="trail-scene__layer trail-scene__trees" style={{ backgroundImage: SCENE_TILE_URLS.trees }} />
      <Hiker />
      <div className="trail-scene__layer trail-scene__ridge" style={{ backgroundImage: SCENE_TILE_URLS.ridge }} />
    </div>
  );
};

export default ParkTrailScene;
