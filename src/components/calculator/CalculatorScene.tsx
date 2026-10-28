import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { SCENE_PALETTES, currentScenePhase, sceneTileUrls } from "@/lib/park-scene-tiles";
import { groupScale, landmarkUrl, walkSeconds, type LandmarkId } from "@/lib/calculator-scene";
import Hiker from "@/components/shared/Hiker";

// Header scene for /calculadora (ADR-061). Same sky, stars and moon as the
// /destinos scene (ADR-043), but the land stands still: the chosen park's
// landmark rises behind the pines, and the travelers (one hiker per person)
// walk across toward it. Styles live in src/index.css under `.calc-scene`.
//
// Decorative only (aria-hidden). It stops when off screen; with "reduce
// motion" the group stands still and the landmark just appears.

interface CalculatorSceneProps {
  /** null until a park is chosen. */
  landmark: LandmarkId | null;
  /** How many hikers walk (1–8). */
  people: number;
}

/** Hiker height in px: phones, then 640 px and up (matches index.css). */
const HIKER_PX = { phone: 40, wide: 52 } as const;

const CalculatorScene = ({ landmark, people }: CalculatorSceneProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [offscreen, setOffscreen] = useState(false);
  const [width, setWidth] = useState(390);
  const [phase] = useState(currentScenePhase);
  const palette = SCENE_PALETTES[phase];
  const tiles = useMemo(() => sceneTileUrls(palette), [palette]);
  const landmarkSrc = useMemo(() => (landmark ? landmarkUrl(landmark, palette) : null), [landmark, palette]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.clientWidth);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const count = Math.min(Math.max(Math.round(people) || 1, 1), 8);
  const hikerPx = width >= 640 ? HIKER_PX.wide : HIKER_PX.phone;
  const hikers = Array.from({ length: count }, (_, i) => groupScale(i));
  const gap = Math.round(hikerPx * 0.12);
  const groupPx = Math.round(hikers.reduce((sum, s) => sum + hikerPx * 0.6 * s, 0) + gap * (count - 1));
  // Off the left edge to off the right edge, at the pace of their stride.
  const seconds = walkSeconds(width + groupPx, hikerPx);

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

  const groupVars = {
    "--from": `${-groupPx}px`,
    "--to": `${Math.round(width)}px`,
    "--dur": `${seconds.toFixed(2)}s`,
    "--gap": `${gap}px`,
  } as CSSProperties;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="trail-scene calc-scene"
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
      <div className="calc-scene__layer calc-scene__far" style={{ backgroundImage: tiles.far }} />
      {landmarkSrc && (
        <img key={landmark} className="calc-scene__landmark calc-landmark-fade" src={landmarkSrc} alt="" decoding="async" />
      )}
      <div className="calc-scene__layer calc-scene__trees" style={{ backgroundImage: tiles.trees }} />
      <div className="calc-scene__group" style={groupVars}>
        {hikers.map((scale, i) => (
          <Hiker
            key={i}
            color={palette.ridge}
            className="calc-scene__hiker"
            style={
              {
                height: `${hikerPx * scale}px`,
                width: `${hikerPx * 0.6 * scale}px`,
                // Shorter legs take quicker steps, so every boot keeps pace
                // with the group without sliding; and nobody walks in step.
                "--step": `${(0.8 * scale).toFixed(3)}s`,
                "--d": `${-((i * 0.29) % 0.8).toFixed(2)}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="calc-scene__layer calc-scene__ridge" style={{ backgroundImage: tiles.ridge }} />
    </div>
  );
};

/** Star positions as [left %, top %], clear of the title and subtitle (as on /destinos). */
const STARS: ReadonlyArray<readonly [number, number]> = [
  [8, 18], [17, 40], [26, 12], [37, 22], [46, 8], [58, 20],
  [84, 46], [73, 14], [95, 30], [93, 10], [4, 48], [6, 60],
];

export default CalculatorScene;
