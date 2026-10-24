import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useScrollDepth, type DepthLayer, type ScrollDepth } from "@/hooks/use-scroll-depth";
import { FOREST, silhouetteMaskUrl, type Silhouette } from "@/lib/forest-silhouettes";
import { GROVE, groveMaskUrl, mirror, type GroveShape } from "@/lib/sequoia-silhouettes";
import { cn } from "@/lib/utils";

/**
 * PromiseSection (ADR-050, ADR-055) — the one-line promise between the hero
 * and the park cards, as a walk into a grove of giant sequoias. Flat
 * silhouettes in the brand greens, like the canyon further down.
 *
 * A full-screen stage stays put (sticky) while the page scrolls 1.2 screens
 * more, in three moments: the clearing (pale sky, low sun, treelines, mist,
 * giant trunks at the edges, the promise), among the giants (the promise
 * rises away, a second pair of trunks steps in, far trunks rise from the
 * mist, light comes through, boughs reach in from the corners) and under the
 * canopy (the boughs close overhead, the trunks close in, the light dims and
 * the forest-dark floor rises into the park cards below). While the promise
 * is on screen the trunks keep to the edges, so it always sits on open sky. Ideas from Gemini (layers, timing, canopy, floor) and
 * Grok (text window, staging).
 *
 * Only transform and opacity change on scroll; the small loops (mist,
 * needles in the light) stop off screen. With "reduce motion" the stage is
 * one still frame in the heart of the grove.
 */

const tile = (s: Silhouette) =>
  ({
    "--forest": silhouetteMaskUrl(s),
    "--forest-w": `${s.width}px`,
    "--forest-h": `${s.height}px`,
  }) as CSSProperties;
const FAR = tile(FOREST.far);
const MID = tile(FOREST.mid);
const NEAR = tile(FOREST.near);

const grove = (s: GroveShape) => ({ "--grove": groveMaskUrl(s) }) as CSSProperties;
const TRUNK = { l: grove(GROVE.trunk), r: grove(mirror(GROVE.trunk)) };
const GROOVES = { l: grove(GROVE.grooves), r: grove(mirror(GROVE.grooves)) };
const CANOPY = { l: grove(GROVE.canopy), r: grove(mirror(GROVE.canopy)) };

/* Each treeline is a flat colour cut by its silhouette (repeated sideways)
   and solid below it, so the layers stack with no seam. */
const FOREST_CSS = `
.promise-sky {
  background: linear-gradient(to bottom, #e9f0eb 0%, #dce8e0 45%, #c3d8cb 100%);
}
.promise-line {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  -webkit-mask: var(--forest) top center / var(--forest-w) var(--forest-h) repeat-x,
    linear-gradient(#000 0 0) bottom / 100% calc(100% - var(--forest-h) + 1px) no-repeat;
  mask: var(--forest) top center / var(--forest-w) var(--forest-h) repeat-x,
    linear-gradient(#000 0 0) bottom / 100% calc(100% - var(--forest-h) + 1px) no-repeat;
}
.grove-shape {
  position: absolute;
  inset: 0;
  -webkit-mask: var(--grove) 0 0 / 100% 100% no-repeat;
  mask: var(--grove) 0 0 / 100% 100% no-repeat;
}
/* Far trunks rise out of the mist and fade into the sky above. */
.grove-fade {
  -webkit-mask-image: linear-gradient(to bottom, transparent 30%, #000 62%);
  mask-image: linear-gradient(to bottom, transparent 30%, #000 62%);
}
.grove-veil {
  background: linear-gradient(to bottom, #6e9a82 0%, #8db09c 45%, #c3d8cb 100%);
}
.grove-ray {
  position: absolute;
  top: -10%;
  height: 130%;
  transform-origin: top center;
  transform: rotate(26deg);
  background: linear-gradient(
    to bottom,
    rgba(251, 250, 247, 0),
    rgba(251, 250, 247, 0.5) 20%,
    rgba(251, 250, 247, 0.4) 55%,
    rgba(251, 250, 247, 0)
  );
}
.grove-needle { position: absolute; width: 2px; height: 2px; border-radius: 9999px; background: #fbfaf7; opacity: 0; }
.promise-mist {
  position: absolute;
  left: 0;
  width: 200%;
  background-image:
    radial-gradient(ellipse 16% 40% at 12% 60%, rgba(251, 250, 247, 0.7), transparent 72%),
    radial-gradient(ellipse 13% 32% at 36% 42%, rgba(251, 250, 247, 0.5), transparent 70%),
    radial-gradient(ellipse 18% 44% at 64% 58%, rgba(251, 250, 247, 0.65), transparent 72%),
    radial-gradient(ellipse 11% 30% at 87% 46%, rgba(251, 250, 247, 0.45), transparent 70%);
  background-size: 50% 100%;
  background-repeat: repeat-x;
}
@media (prefers-reduced-motion: no-preference) {
  .promise-mist { animation: promise-mist 80s linear infinite; }
  .grove-needle { animation: grove-needle 9s linear infinite; }
  .grove-paused :is(.promise-mist, .grove-needle) { animation-play-state: paused; }
}
@media (prefers-reduced-motion: reduce) {
  .grove-needle { opacity: 0.6; }
}
@keyframes promise-mist {
  to { transform: translateX(-50%); }
}
@keyframes grove-needle {
  0% { opacity: 0; translate: 0 0; }
  15% { opacity: 0.9; }
  50% { translate: -10px 70px; }
  85% { opacity: 0.7; }
  100% { opacity: 0; translate: 6px 140px; }
}
`;

/** Rays through the trunks: where each starts (% from the right) and its width. */
const RAYS = [
  { right: 16, width: 13 },
  { right: 33, width: 6 },
  { right: 44, width: 10 },
] as const;

/** Needles drifting down in the light (fixed positions, no randomness). */
const NEEDLES = Array.from({ length: 10 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return { left: 36 + r(1) * 40, top: 26 + r(2) * 34, delay: -r(3) * 9 };
});

/** Far trunks, pale, rising out of the mist (left % and width %). */
const FAR_TRUNKS = [
  { left: 21, width: 7 },
  { left: 34, width: 5 },
  { left: 60, width: 5.5 },
  { left: 73, width: 7.5 },
] as const;

/**
 * A sequoia trunk with its bark grooves and a lit face on the side that
 * faces the clearing: the trunk in its light colour, then the trunk itself
 * moved `dx` px away from the clearing on top.
 */
const Trunk = ({
  side,
  fill,
  lit,
  groove,
  dx,
  className,
  style,
  innerRef,
}: {
  side: "l" | "r";
  fill: string;
  lit: string;
  groove: string;
  dx: number;
  className?: string;
  style?: CSSProperties;
  innerRef?: RefObject<HTMLDivElement>;
}) => (
  <div ref={innerRef} className={cn("absolute inset-y-0", innerRef && "will-change-transform", className)} style={style}>
    <div className="grove-shape" style={{ ...TRUNK[side], backgroundColor: lit }} />
    <div className="absolute inset-0" style={{ transform: `translateX(${side === "l" ? -dx : dx}px)` }}>
      <div className="grove-shape" style={{ ...TRUNK[side], backgroundColor: fill }} />
      <div className="grove-shape" style={{ ...GROOVES[side], backgroundColor: groove }} />
    </div>
  </div>
);

/** A canopy corner with a lit lower edge: the canopy in its light colour, the canopy itself moved up on top. */
const Canopy = ({ side, fill, lit, className, innerRef }: { side: "l" | "r"; fill: string; lit: string; className: string; innerRef: RefObject<HTMLDivElement> }) => (
  <div
    ref={innerRef}
    className={cn("absolute top-0 -translate-y-full will-change-transform", side === "l" ? "origin-top-left" : "origin-top-right", className)}
  >
    <div className="grove-shape" style={{ ...CANOPY[side], backgroundColor: lit }} />
    <div className="absolute inset-0" style={{ transform: "translateY(-4px)" }}>
      <div className="grove-shape" style={{ ...CANOPY[side], backgroundColor: fill }} />
    </div>
  </div>
);

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const smooth = (t: number) => t * t * (3 - 2 * t);
/** 0 → 1 (eased) over the part `from`–`to` of the pinned scroll `p`. */
const span = (p: number, from: number, to: number) => smooth(clamp01((p - from) / (to - from)));
/** 0 → 1 while the stage is pinned (the section's top has reached the top of the screen). */
const pinned = ({ entered, viewport, height }: ScrollDepth) =>
  height > viewport ? clamp01((entered - viewport) / (height - viewport)) : 0;
/** Where "reduce motion" holds the scene: among the trunks, the promise still on screen. */
const STILL_AT = 0.22;

type Ref = RefObject<HTMLDivElement>;

const PromiseSection = () => {
  const reducedMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement>(null);
  const refs = {
    sun: useRef<HTMLDivElement>(null),
    veil: useRef<HTMLDivElement>(null),
    far: useRef<HTMLDivElement>(null),
    farTrunks: useRef<HTMLDivElement>(null),
    mid: useRef<HTMLDivElement>(null),
    rays: useRef<HTMLDivElement>(null),
    backL: useRef<HTMLDivElement>(null),
    backR: useRef<HTMLDivElement>(null),
    midL: useRef<HTMLDivElement>(null),
    midR: useRef<HTMLDivElement>(null),
    foreL: useRef<HTMLDivElement>(null),
    foreR: useRef<HTMLDivElement>(null),
    canopyL: useRef<HTMLDivElement>(null),
    canopyR: useRef<HTMLDivElement>(null),
    floor: useRef<HTMLDivElement>(null),
    text: useRef<HTMLDivElement>(null),
  };
  const r = useRef(refs).current;

  // The loops stop while the grove is off screen.
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // What moves (transform) and what fades (opacity) at pinned progress p.
  const scene = useMemo(() => {
    const px = (x: number, y: number) => `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    // Trunks step in from the sides (-1 left, 1 right); later they widen and close in.
    // The middle pair waits outside the screen until the promise has gone.
    const midTrunk = (side: -1 | 1) => (p: number) =>
      `translate3d(${(side * 100 * (1 - span(p, 0.32, 0.7))).toFixed(2)}%, 0, 0) scaleX(${(1 + 0.12 * span(p, 0.74, 0.98)).toFixed(3)})`;
    const foreTrunk = (side: -1 | 1) => (p: number) =>
      `${px(-side * (10 * span(p, 0.32, 0.6) + 26 * span(p, 0.6, 1)), 0)} scale(${(1 + 0.18 * span(p, 0.6, 1)).toFixed(3)})`;
    // Canopy: hidden above, reaches in from the corners, then closes overhead (% of its own height).
    const canopy = (reach: number, from: number, close: number, grow: number) => (p: number) => {
      const y = -100 + reach * span(p, from, from + 0.33) + (100 - reach) * close * span(p, 0.55, 0.95);
      return `translate3d(0, ${y.toFixed(1)}%, 0) scale(${(1 + grow * span(p, 0.7, 0.98)).toFixed(3)})`;
    };
    const moves: { ref: Ref; at: (p: number) => string }[] = [
      { ref: r.sun, at: (p) => px(-24 * p, 145 * p) },
      { ref: r.far, at: (p) => px(0, 46 * p) },
      { ref: r.farTrunks, at: (p) => px(0, (1 - span(p, 0.1, 0.6)) * 120 - span(p, 0.6, 1) * 30) },
      { ref: r.mid, at: (p) => px(0, 24 * p - span(p, 0.65, 1) * 38) },
      { ref: r.backL, at: canopy(55, 0.35, 0.85, 0.08) },
      { ref: r.backR, at: canopy(55, 0.35, 0.85, 0.08) },
      { ref: r.midL, at: midTrunk(-1) },
      { ref: r.midR, at: midTrunk(1) },
      { ref: r.foreL, at: foreTrunk(-1) },
      { ref: r.foreR, at: foreTrunk(1) },
      { ref: r.canopyL, at: canopy(45, 0.12, 0.8, 0.12) },
      { ref: r.canopyR, at: canopy(45, 0.12, 0.8, 0.12) },
      // The floor (half the stage) shows only its 90 px hill, then rises to fill the bottom.
      {
        ref: r.floor,
        at: (p) => {
          const hidden = 1 - span(p, 0.65, 1);
          return `translate3d(0, calc(${(hidden * 100).toFixed(2)}% - ${(hidden * 90).toFixed(1)}px), 0)`;
        },
      },
      { ref: r.text, at: (p) => px(0, -34 * span(p, 0.28, 0.4)) },
    ];
    const fades: { ref: Ref; at: (p: number) => number }[] = [
      { ref: r.veil, at: (p) => 0.5 * span(p, 0.45, 0.98) },
      { ref: r.sun, at: (p) => 1 - 0.65 * span(p, 0.7, 0.98) },
      { ref: r.rays, at: (p) => span(p, 0.12, 0.38) * (1 - 0.8 * span(p, 0.78, 0.98)) },
      { ref: r.text, at: (p) => 1 - span(p, 0.28, 0.4) },
    ];
    return { moves, fades };
  }, [r]);

  const layers = useMemo<readonly DepthLayer[]>(
    () => scene.moves.map((m) => ({ ref: m.ref, transform: (d: ScrollDepth) => m.at(pinned(d)) })),
    [scene],
  );
  const setFades = useCallback(
    (p: number) => {
      for (const f of scene.fades) if (f.ref.current) f.ref.current.style.opacity = f.at(p).toFixed(3);
    },
    [scene],
  );
  const onFrame = useCallback((d: ScrollDepth) => setFades(pinned(d)), [setFades]);
  useScrollDepth(sectionRef, layers, { enabled: !reducedMotion, onFrame });

  // "Reduce motion": hold one still frame in the heart of the grove.
  useEffect(() => {
    if (!reducedMotion) return;
    for (const m of scene.moves) if (m.ref.current) m.ref.current.style.transform = m.at(STILL_AT);
    setFades(STILL_AT);
  }, [reducedMotion, scene, setFades]);

  return (
    <section ref={sectionRef} className={cn("relative", !reducedMotion && "h-[220svh] lg:h-[200vh]")}>
      <style>{FOREST_CSS}</style>
      <div
        className={cn(
          "promise-sky overflow-hidden",
          reducedMotion ? "relative h-[100svh] max-h-[900px] min-h-[600px]" : "sticky top-0 h-[100svh]",
          !onScreen && "grove-paused",
        )}
      >
        {/* Scene (decorative), back to front. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div
            ref={r.sun}
            className="absolute right-[16%] top-[58%] h-16 w-16 rounded-full bg-cloud shadow-[0_0_70px_34px_rgba(251,250,247,0.75)] will-change-transform sm:h-24 sm:w-24"
          />
          {/* The light dims as you go in (opacity set on scroll). */}
          <div ref={r.veil} className="grove-veil absolute inset-0 opacity-0 will-change-[opacity]" />
          <div ref={r.far} className="absolute inset-x-0 bottom-0 h-[230px] will-change-transform">
            <div className="promise-line h-full bg-[#B3CBBD]" style={{ ...FAR, transform: "translate(2px, -3px)" }} />
            <div className="promise-line h-full bg-[#8DB09C]" style={FAR} />
          </div>
          <div ref={r.farTrunks} className="grove-fade absolute inset-0 will-change-transform">
            {FAR_TRUNKS.map((t) => (
              <Trunk
                key={t.left}
                side={t.left < 50 ? "l" : "r"}
                fill="#6E9A82"
                lit="#8DB09C"
                groove="#6E9A82"
                dx={2}
                style={{ left: `${t.left}%`, width: `${t.width}%` }}
              />
            ))}
          </div>
          <div className="promise-mist bottom-[140px] h-[80px]" />
          <div ref={r.mid} className="absolute inset-x-0 bottom-0 h-[190px] will-change-transform">
            <div className="promise-line h-full bg-[#6E9A82]" style={{ ...MID, transform: "translate(2px, -3px)" }} />
            <div className="promise-line h-full bg-[#4F7F66]" style={MID} />
          </div>
          {/* Light through the trunks, with needles drifting down in it. */}
          <div ref={r.rays} className="absolute inset-0 overflow-hidden opacity-0 will-change-[opacity]">
            {RAYS.map((ray) => (
              <span key={ray.right} className="grove-ray" style={{ right: `${ray.right}%`, width: `${ray.width}%` }} />
            ))}
            {NEEDLES.map((n, i) => (
              <span key={i} className="grove-needle" style={{ left: `${n.left}%`, top: `${n.top}%`, animationDelay: `${n.delay}s` }} />
            ))}
          </div>
          {/* Canopy, back tier. */}
          <Canopy side="l" fill="#2F5E4A" lit="#4F7F66" innerRef={r.backL} className="left-[12%] h-[26%] w-[56%] lg:left-[18%] lg:h-[30%] lg:w-[36%]" />
          <Canopy side="r" fill="#2F5E4A" lit="#4F7F66" innerRef={r.backR} className="right-[12%] h-[26%] w-[56%] lg:right-[18%] lg:h-[30%] lg:w-[36%]" />
          {/* Giant trunks: a middle pair that steps in, a front pair at the edges. */}
          <Trunk side="l" fill="#3E6E57" lit="#6E9A82" groove="#2F5E4A" dx={4} innerRef={r.midL} className="left-[6%] w-[30%] lg:left-[9%] lg:w-[13%]" />
          <Trunk side="r" fill="#3E6E57" lit="#6E9A82" groove="#2F5E4A" dx={4} innerRef={r.midR} className="right-[6%] w-[30%] lg:right-[9%] lg:w-[13%]" />
          <Trunk
            side="l"
            fill="#1E3D30"
            lit="#3E6E57"
            groove="#14201A"
            dx={5}
            innerRef={r.foreL}
            className="-left-[14%] w-[34%] origin-bottom-left lg:-left-[6%] lg:w-[16%]"
          />
          <Trunk
            side="r"
            fill="#1E3D30"
            lit="#3E6E57"
            groove="#14201A"
            dx={5}
            innerRef={r.foreR}
            className="-right-[14%] w-[34%] origin-bottom-right lg:-right-[6%] lg:w-[16%]"
          />
          {/* Canopy, front tier. */}
          <Canopy side="l" fill="#14201A" lit="#2F5E4A" innerRef={r.canopyL} className="left-0 h-[34%] w-[70%] lg:h-[40%] lg:w-[48%]" />
          <Canopy side="r" fill="#14201A" lit="#2F5E4A" innerRef={r.canopyR} className="right-0 h-[34%] w-[70%] lg:h-[40%] lg:w-[48%]" />
          {/* The forest floor; at the end it rises into the park cards below. */}
          <div
            ref={r.floor}
            className="absolute inset-x-0 bottom-0 h-1/2 will-change-transform"
            style={{ transform: "translate3d(0, calc(100% - 90px), 0)" }}
          >
            <div className="promise-line h-full bg-forest-dark" style={NEAR} />
          </div>
        </div>

        {/* The promise, on open sky between the trunks; it fades as the canopy closes. */}
        <div ref={r.text} className="absolute inset-x-0 top-[19%] z-10 px-5 will-change-transform">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-[17rem] text-center sm:max-w-lg lg:max-w-3xl"
          >
            <p className="font-condensed text-xs font-semibold uppercase tracking-[0.18em] text-green sm:text-sm">
              Nuestra promesa
            </p>
            <p className="mt-4 font-serif text-3xl italic leading-snug text-ink sm:text-4xl">
              Los parques más increíbles de EE.UU. te están esperando — y por fin alguien te explica{" "}
              <span className="text-green">cómo llegar</span>.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PromiseSection;
