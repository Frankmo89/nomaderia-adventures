import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { SCENE_PALETTES, currentScenePhase, sceneTileUrls } from "@/lib/park-scene-tiles";
import Hiker from "@/components/shared/Hiker";

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

/**
 * Star positions as [left %, top %]. None sits behind the title or subtitle
 * (33–58% down, center): those rows keep stars at the edges.
 */
const STARS: ReadonlyArray<readonly [number, number]> = [
  [8, 18], [17, 40], [26, 12], [37, 22], [46, 8], [58, 20],
  [84, 46], [73, 14], [95, 30], [93, 10], [4, 48], [6, 60],
];

const ParkTrailScene = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [offscreen, setOffscreen] = useState(false);
  const [phase] = useState(currentScenePhase);
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
