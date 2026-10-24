import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { Link } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import { useScrollDepth, type DepthLayer, type ScrollDepth } from "@/hooks/use-scroll-depth";
import { HERO_RIDGES, ridgeMaskUrl, type HeroRidge } from "@/lib/hero-ridges";
import { FOREST, silhouetteMaskUrl, type Silhouette } from "@/lib/forest-silhouettes";
import { logEvent } from "@/lib/events";
import { cn } from "@/lib/utils";

/**
 * NightCamp (ADR-053, ADR-056) — the home's trip ends at camp, as night
 * falls. The day starts in the hero's photo and goes through the sequoias,
 * the road and the canyon; here you arrive at camp.
 *
 * A full-screen stage stays put (sticky) while the page scrolls one more
 * screen, then the footer follows on plain forest-dark, with nothing moving
 * behind its links. On the stage: the last of the dusk fades into night,
 * two ranges rise with their peaks lit by the moon, the moon comes up from
 * behind them, the stars come out one by one, the pines and the camp's
 * knoll rise into place, the tent and the lantern light up, fireflies come
 * out, and a last "Encuentra tu parque" invites you back to the quiz. At
 * the bottom of the page the camp is still in view above the footer. No
 * people (Frank wants just the camp). Ideas from Grok (staging, stars kept
 * off the links, the last call to action) and Gemini (scene first and big,
 * footer below, moonlit peaks).
 *
 * Only transform and opacity change on scroll; the loops (stars, shooting
 * star, lantern, fireflies) stop off screen. With "reduce motion" it is the
 * finished night, still.
 */

const tile = (s: Silhouette) =>
  ({
    "--night": silhouetteMaskUrl(s),
    "--night-w": `${s.width}px`,
    "--night-h": `${s.height}px`,
  }) as CSSProperties;
/** A range from the hero; its size comes from `.night-range-*` (wider than the screen and taller, so it reads as mountains). */
const range = (r: HeroRidge) => ({ "--night": ridgeMaskUrl(r) }) as CSSProperties;
const FAR_RANGE = range(HERO_RIDGES.back);
const NEAR_RANGE = range(HERO_RIDGES.mid);
const PINES = tile(FOREST.mid);
const HILL = tile(FOREST.near);

const rand = (i: number, n: number) => {
  const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Stars: fixed positions in the upper sky (no randomness at render). The
 * first 16 are already out at dusk (the night began under the newsletter
 * form); the rest come out one by one as night falls.
 */
const STARS = Array.from({ length: 54 }, (_, i) => ({
  left: rand(i, 1) * 100,
  top: 4 + rand(i, 2) * (i < 16 ? 36 : 48),
  size: rand(i, 3) > 0.85 ? 3 : rand(i, 3) > 0.5 ? 2 : 1.5,
  delay: rand(i, 4) * 4,
  at: i < 16 ? -0.2 : 0.08 + rand(i, 5) * 0.65,
}));

/** Fireflies around the camp (% of the stage). */
const FIREFLIES = Array.from({ length: 8 }, (_, i) => ({
  left: 18 + rand(i + 60, 1) * 64,
  bottom: 6 + rand(i + 60, 2) * 16,
  delay: -rand(i + 60, 3) * 7,
  dur: 6 + rand(i + 60, 4) * 4,
}));

const NIGHT_CSS = `
.night-sky { background: #14201a; }
.night-line {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  -webkit-mask: var(--night) top center / var(--night-w) var(--night-h) repeat-x,
    linear-gradient(#000 0 0) bottom / 100% calc(100% - var(--night-h) + 1px) no-repeat;
  mask: var(--night) top center / var(--night-w) var(--night-h) repeat-x,
    linear-gradient(#000 0 0) bottom / 100% calc(100% - var(--night-h) + 1px) no-repeat;
}
/* One tile of the hero's range, wider than the screen (no seams) and stretched taller. */
.night-range-far { --night-w: 220%; --night-h: 170px; }
.night-range-near { --night-w: 200%; --night-h: 120px; }
@media (min-width: 1024px) {
  .night-range-far { --night-w: 140%; --night-h: 240px; }
  .night-range-near { --night-w: 130%; --night-h: 170px; }
}
.night-glow-night { background: linear-gradient(to bottom, rgba(20, 32, 26, 0), #21402f 40%, #4e8a6a 75%, #4e8a6a 100%); }
.night-glow-dusk { background: linear-gradient(to bottom, rgba(61, 53, 85, 0), #3d3555 30%, #cc7d66 58%, #f2b577 76%, #f2b577 100%); }
.night-star { position: absolute; border-radius: 9999px; background: #eaf0ec; }
.night-star > span { display: block; width: 100%; height: 100%; border-radius: inherit; background: inherit; }
.night-shooting {
  position: absolute;
  top: 14%;
  left: 64%;
  width: 90px;
  height: 1.5px;
  border-radius: 9999px;
  background: linear-gradient(to left, rgba(244, 241, 232, 0.95), rgba(244, 241, 232, 0));
  opacity: 0;
  transform: rotate(-24deg);
}
.night-firefly {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 9999px;
  background: #f4f1e8;
  box-shadow: 0 0 6px 2px rgba(244, 241, 232, 0.45);
  opacity: 0.8;
}
@media (prefers-reduced-motion: no-preference) {
  .night-star > span { animation: night-twinkle 3.6s ease-in-out infinite; }
  .night-shooting { animation: night-shoot 9s ease-in 2s infinite; }
  .night-lantern { animation: night-flicker 2.4s ease-in-out infinite; }
  .night-firefly { animation: night-firefly var(--dur) ease-in-out infinite; }
  .night-paused :is(.night-star > span, .night-shooting, .night-lantern, .night-firefly) { animation-play-state: paused; }
}
@keyframes night-twinkle { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes night-flicker { 0%, 100% { opacity: 1; } 40% { opacity: 0.82; } 60% { opacity: 0.95; } }
@keyframes night-shoot {
  0%, 88% { opacity: 0; translate: 0 0; }
  90% { opacity: 1; }
  97%, 100% { opacity: 0; translate: -160px 72px; }
}
@keyframes night-firefly {
  0%, 100% { opacity: 0; translate: 0 0; }
  20% { opacity: 0.9; }
  45% { opacity: 0.2; translate: 14px -10px; }
  70% { opacity: 0.85; translate: -6px -18px; }
  90% { opacity: 0.1; }
}
`;

/** A three-tier pine, same family as the forest's. */
const PINE_PATH = "M15,0 L22,15 L19,15 L26,29 L21,29 L30,46 L17,46 L17,50 L13,50 L13,46 L0,46 L9,29 L4,29 L11,15 L8,15 Z";

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const smooth = (t: number) => t * t * (3 - 2 * t);
/** 0 → 1 (eased) over the part `from`–`to` of the pinned scroll `p`. */
const span = (p: number, from: number, to: number) => smooth(clamp01((p - from) / (to - from)));
/** 0 → 1 while the stage is pinned (the scene's top has reached the top of the screen). */
const pinned = ({ entered, viewport, height }: ScrollDepth) =>
  height > viewport ? clamp01((entered - viewport) / (height - viewport)) : 0;

type Ref = RefObject<HTMLElement | SVGGElement>;

/** A range (or treeline) with a moonlit rim: a light copy behind, the range itself moved down and away from the moon on top. */
const Lit = ({ shape, fill, lit, className, litRef }: { shape: CSSProperties; fill: string; lit: string; className: string; litRef?: RefObject<HTMLDivElement> }) => (
  <>
    {/* Both copies reach a little past the screen's edges, so the shift never shows a strip at the side. */}
    <div ref={litRef} className={cn("night-line", className)} style={{ ...shape, left: -8, right: -8, backgroundColor: lit }} />
    <div
      className={cn("night-line", className)}
      style={{ ...shape, left: -8, right: -8, backgroundColor: fill, transform: "translate(-4px, 4px)" }}
    />
  </>
);

const NightCamp = ({ children }: { children: ReactNode }) => {
  const reducedMotion = useReducedMotion() ?? false;
  const sceneRef = useRef<HTMLDivElement>(null);
  const refs = {
    dusk: useRef<HTMLDivElement>(null),
    night: useRef<HTMLDivElement>(null),
    moon: useRef<HTMLDivElement>(null),
    far: useRef<HTMLDivElement>(null),
    farLit: useRef<HTMLDivElement>(null),
    near: useRef<HTMLDivElement>(null),
    nearLit: useRef<HTMLDivElement>(null),
    pines: useRef<HTMLDivElement>(null),
    camp: useRef<HTMLDivElement>(null),
    glow: useRef<SVGGElement>(null),
    lamp: useRef<SVGGElement>(null),
    fireflies: useRef<HTMLDivElement>(null),
    shooting: useRef<HTMLDivElement>(null),
    cta: useRef<HTMLDivElement>(null),
  };
  const r = useRef(refs).current;
  const starRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // The loops stop while the scene is off screen.
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = sceneRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // What moves (transform) and what fades (opacity) at pinned progress p.
  const scene = useMemo(() => {
    // Rise into place from `from` % of the element's own height below.
    const rise = (from: number, a: number, b: number) => (p: number) =>
      `translate3d(0, ${((1 - span(p, a, b)) * from).toFixed(2)}%, 0)`;
    const moves: { ref: Ref; at: (p: number, vh: number) => string }[] = [
      { ref: r.far, at: rise(35, 0, 0.45) },
      { ref: r.near, at: rise(45, 0.1, 0.55) },
      { ref: r.pines, at: rise(70, 0.25, 0.65) },
      { ref: r.camp, at: rise(100, 0.4, 0.8) },
      // The moon starts behind the far range and comes up about half the screen.
      { ref: r.moon, at: (p, vh) => `translate3d(0, ${((1 - span(p, 0.15, 0.7)) * 0.5 * vh).toFixed(1)}px, 0)` },
      { ref: r.cta, at: (p) => `translate3d(0, ${((1 - span(p, 0.85, 1)) * 14).toFixed(1)}px, 0)` },
    ];
    const fades: { ref: Ref; at: (p: number) => number }[] = [
      { ref: r.dusk, at: (p) => 1 - span(p, 0.1, 0.6) },
      { ref: r.night, at: (p) => 0.25 + 0.75 * span(p, 0.1, 0.6) },
      { ref: r.farLit, at: (p) => span(p, 0.35, 0.8) },
      { ref: r.nearLit, at: (p) => span(p, 0.45, 0.85) },
      { ref: r.glow, at: (p) => span(p, 0.7, 0.88) },
      { ref: r.lamp, at: (p) => span(p, 0.7, 0.88) },
      { ref: r.fireflies, at: (p) => span(p, 0.75, 0.92) },
      { ref: r.shooting, at: (p) => span(p, 0.6, 0.7) },
      { ref: r.cta, at: (p) => span(p, 0.85, 1) },
    ];
    return { moves, fades };
  }, [r]);

  const apply = useCallback(
    (p: number, vh: number, withMoves: boolean) => {
      if (withMoves) for (const m of scene.moves) if (m.ref.current) m.ref.current.style.transform = m.at(p, vh);
      for (const f of scene.fades) if (f.ref.current) f.ref.current.style.opacity = f.at(p).toFixed(3);
      STARS.forEach((s, i) => {
        const el = starRefs.current[i];
        if (el) el.style.opacity = clamp01((p - s.at) / 0.15).toFixed(2);
      });
      // The last call to action can only be reached once it shows.
      if (r.cta.current) r.cta.current.style.visibility = span(p, 0.85, 1) > 0.05 ? "visible" : "hidden";
    },
    [scene, r],
  );

  const layers = useMemo<readonly DepthLayer[]>(
    () => scene.moves.map((m) => ({ ref: m.ref as RefObject<HTMLElement>, transform: (d: ScrollDepth) => m.at(pinned(d), d.viewport) })),
    [scene],
  );
  const onFrame = useCallback((d: ScrollDepth) => apply(pinned(d), d.viewport, false), [apply]);
  useScrollDepth(sceneRef, layers, { enabled: !reducedMotion, onFrame });

  // "Reduce motion": the finished night, still.
  useEffect(() => {
    if (reducedMotion) apply(1, window.innerHeight || 800, true);
  }, [reducedMotion, apply]);

  return (
    <div className="night-sky relative">
      <style>{NIGHT_CSS}</style>
      <div ref={sceneRef} className={cn("relative", !reducedMotion && "h-[200svh] lg:h-[190vh]")}>
        <div
          className={cn(
            "night-stage overflow-hidden",
            reducedMotion ? "relative h-[100svh] max-h-[860px] min-h-[600px]" : "sticky top-0 h-[100svh]",
            !onScreen && "night-paused",
          )}
        >
          {/* Sky, back to front (decorative). */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div ref={r.night} className="night-glow-night absolute inset-x-0 bottom-0 h-[70%] will-change-[opacity]" />
            <div ref={r.dusk} className="night-glow-dusk absolute inset-x-0 bottom-0 h-[62%] will-change-[opacity]" />
            {STARS.map((s, i) => (
              <span
                key={i}
                ref={(el) => (starRefs.current[i] = el)}
                className="night-star"
                style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, opacity: s.at < 0 ? 1 : 0 }}
              >
                <span style={{ animationDelay: `${s.delay}s` }} />
              </span>
            ))}
            {/* Its own animation sets the streak's opacity, so the scroll fades a wrapper. */}
            <div ref={r.shooting} className="absolute inset-0 opacity-0">
              <span className="night-shooting" />
            </div>
            <div
              ref={r.moon}
              className="absolute right-[14%] top-[16%] h-20 w-20 rounded-full bg-[#F4F1E8] shadow-[0_0_80px_28px_rgba(234,240,236,0.22)] will-change-transform sm:h-24 sm:w-24 lg:right-[18%]"
            />

            {/* Two ranges with moonlit peaks, the pines, then the knoll with the camp. */}
            <div ref={r.far} className="absolute inset-x-0 bottom-0 h-[56%] will-change-transform">
              <Lit shape={FAR_RANGE} fill="#2F5E4A" lit="#6E9A82" className="night-range-far h-full" litRef={r.farLit} />
            </div>
            <div ref={r.near} className="absolute inset-x-0 bottom-0 h-[42%] will-change-transform">
              <Lit shape={NEAR_RANGE} fill="#1E3D30" lit="#3E6E57" className="night-range-near h-full" litRef={r.nearLit} />
            </div>
            <div ref={r.pines} className="absolute inset-x-0 bottom-0 h-[30%] will-change-transform">
              <div className="night-line h-full bg-[#16332A]" style={PINES} />
            </div>
            <div ref={r.camp} className="absolute inset-x-0 bottom-0 h-[24%] will-change-transform">
              <div className="night-line h-[46%] bg-forest-dark" style={HILL} />
              {/* The camp: a knoll with a tent, a lantern and three pines, drawn together so the tent sits on the ground. */}
              <svg
                viewBox="0 0 360 150"
                className="absolute bottom-0 left-1/2 h-[190px] w-[456px] -translate-x-1/2 lg:left-[34%] lg:h-[230px] lg:w-[552px]"
                focusable="false"
              >
                <defs>
                  <radialGradient id="night-camp-glow" cx="50%" cy="50%" r="50%">
                    <stop offset="0" stopColor="#F4F1E8" stopOpacity="0.45" />
                    <stop offset="1" stopColor="#F4F1E8" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <g ref={r.glow} style={{ opacity: 0 }}>
                  <ellipse cx="184" cy="86" rx="80" ry="34" fill="url(#night-camp-glow)" />
                  <ellipse cx="246" cy="60" rx="28" ry="24" fill="url(#night-camp-glow)" />
                </g>
                <path
                  d="M0,150 L0,120 C50,110 100,98 150,94 C200,90 250,94 300,106 C330,112 345,116 360,120 L360,150 Z"
                  fill="#14201A"
                />
                <g fill="#14201A">
                  <path d={PINE_PATH} transform="translate(286 44) scale(1.25)" />
                  <path d={PINE_PATH} transform="translate(318 66) scale(0.85)" />
                  <path d={PINE_PATH} transform="translate(84 62) scale(0.8)" />
                </g>
                {/* Tent */}
                <path d="M146,96 L184,42 L222,96 Z" fill="#0D1A14" />
                <path d="M184,42 L180,34 M184,42 L188,34" stroke="#0D1A14" strokeWidth="2.5" strokeLinecap="round" />
                {/* Lantern on a pole */}
                <path d="M246,98 L246,58" stroke="#0D1A14" strokeWidth="2.5" />
                <path d="M240,56 L252,56" stroke="#0D1A14" strokeWidth="2" />
                {/* What lights up: the tent door and the lantern. */}
                <g ref={r.lamp} fill="#F4F1E8" style={{ opacity: 0 }}>
                  <path d="M176,96 L184,66 L192,96 Z" opacity="0.92" />
                  <rect className="night-lantern" x="242" y="58" width="8" height="10" rx="2" />
                </g>
              </svg>
              <div ref={r.fireflies} className="absolute inset-0 opacity-0">
                {FIREFLIES.map((f, i) => (
                  <span
                    key={i}
                    className="night-firefly"
                    style={{ left: `${f.left}%`, bottom: `${f.bottom * 4}%`, animationDelay: `${f.delay}s`, ["--dur" as string]: `${f.dur}s` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* The last call: back to the quiz. Hidden until it shows. */}
          <div ref={r.cta} className="absolute inset-x-0 top-[34%] z-10 flex justify-center px-5" style={{ visibility: "hidden", opacity: 0 }}>
            <Link
              to="/#quiz"
              onClick={() => logEvent("camp_cta_click", { cta: "quiz" })}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-green px-7 py-3 text-base font-semibold text-cloud ring-1 ring-[#4F7F66] transition-colors hover:bg-green-dark"
            >
              Encuentra tu parque →
            </Link>
          </div>
        </div>
      </div>

      {/* The footer, on plain forest-dark: nothing moves behind its links. */}
      <div className="relative pt-4">{children}</div>
    </div>
  );
};

export default NightCamp;
