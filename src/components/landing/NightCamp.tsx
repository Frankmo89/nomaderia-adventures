import { useMemo, useRef, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { useScrollDepth, type DepthLayer, type ScrollDepth } from "@/hooks/use-scroll-depth";
import { HERO_RIDGES, ridgeMaskUrl } from "@/lib/hero-ridges";
import { FOREST, silhouetteMaskUrl, type Silhouette } from "@/lib/forest-silhouettes";

/**
 * NightCamp (ADR-053) — where the home's trip ends: a night at camp, between
 * the newsletter and the footer. The day starts in the hero's photo, goes
 * through the forest, the road and the canyon, and ends here: a night sky
 * with stars and a shooting star, a moon, the hero's mountain range far
 * away, a line of pines, and a lit tent on the last hill. Same flat
 * silhouettes as the other scenes, in the /destinos night palette. The hill
 * is forest-dark, the footer's colour, so the footer follows with no seam.
 *
 * Scroll effect (useScrollDepth, off with "reduce motion"): the moon rises
 * as the scene comes up, and the mountains and pines lag behind the page.
 */

const tile = (s: Silhouette) =>
  ({
    "--night": silhouetteMaskUrl(s),
    "--night-w": `${s.width}px`,
    "--night-h": `${s.height}px`,
  }) as CSSProperties;
const PINES = tile(FOREST.mid);
const HILL = tile(FOREST.near);
const RANGE = {
  "--night": ridgeMaskUrl(HERO_RIDGES.back),
  "--night-w": "100%",
  "--night-h": `${HERO_RIDGES.back.height}px`,
} as CSSProperties;

/** Stars: fixed positions (no randomness at render), a few brighter ones. */
const STARS = Array.from({ length: 46 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return { left: r(1) * 100, top: r(2) * 62, size: r(3) > 0.85 ? 3 : r(3) > 0.5 ? 2 : 1.5, delay: r(4) * 4 };
});

/* /destinos night palette (park-scene-tiles: sky, trees, orb); the range is
   the hero's far-peak green (#2F5E4A). */
const NIGHT_CSS = `
.night-sky {
  background: linear-gradient(to bottom, #14201a 0%, #182c22 40%, #21402f 72%, #4e8a6a 100%);
}
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
.night-star {
  position: absolute;
  border-radius: 9999px;
  background: #eaf0ec;
  opacity: 0.75;
}
.night-shooting {
  position: absolute;
  top: 14%;
  left: 62%;
  width: 90px;
  height: 1.5px;
  border-radius: 9999px;
  background: linear-gradient(to left, rgba(244, 241, 232, 0.95), rgba(244, 241, 232, 0));
  opacity: 0;
  transform: rotate(-24deg);
}
@media (prefers-reduced-motion: no-preference) {
  .night-star { animation: night-twinkle 3.6s ease-in-out infinite; }
  .night-shooting { animation: night-shoot 9s ease-in 2s infinite; }
}
@keyframes night-twinkle {
  0%, 100% { opacity: 0.75; }
  50% { opacity: 0.25; }
}
@keyframes night-shoot {
  0%, 88% { opacity: 0; translate: 0 0; }
  90% { opacity: 1; }
  97% { opacity: 0; translate: -160px 72px; }
  100% { opacity: 0; translate: -160px 72px; }
}
`;

const NightCamp = () => {
  const reducedMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const pinesRef = useRef<HTMLDivElement>(null);

  const layers = useMemo<readonly DepthLayer[]>(() => {
    // The scene sits at the end of the page, so it never scrolls past mid-
    // screen: time the moon on how far it has come up (0 → 1 over 80 % of a screen).
    const up = ({ entered, viewport }: ScrollDepth) => Math.min(Math.max(entered / (viewport * 0.8), 0), 1);
    return [
      { ref: moonRef, transform: (d) => `translate3d(0, ${((1 - up(d)) * 90).toFixed(1)}px, 0)` },
      { ref: rangeRef, transform: (d) => `translate3d(0, ${((1 - up(d)) * 46).toFixed(1)}px, 0)` },
      { ref: pinesRef, transform: (d) => `translate3d(0, ${((1 - up(d)) * 20).toFixed(1)}px, 0)` },
    ];
  }, []);
  useScrollDepth(sectionRef, layers, { enabled: !reducedMotion });

  return (
    <div ref={sectionRef} aria-hidden="true" className="night-sky relative h-[340px] overflow-hidden sm:h-[400px] lg:h-[440px]">
      <style>{NIGHT_CSS}</style>
      {STARS.map((s, i) => (
        <span
          key={i}
          className="night-star"
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
        />
      ))}
      <span className="night-shooting" />
      <div
        ref={moonRef}
        className="absolute right-[16%] top-[26%] h-14 w-14 rounded-full bg-[#F4F1E8] shadow-[0_0_60px_22px_rgba(234,240,236,0.22)] will-change-transform sm:h-16 sm:w-16"
      />
      <div ref={rangeRef} className="night-line h-[210px] bg-[#2F5E4A] will-change-transform lg:h-[250px]" style={RANGE} />
      <div ref={pinesRef} className="night-line h-[160px] bg-[#16332A] will-change-transform lg:h-[180px]" style={PINES} />
      <div className="night-line h-[90px] bg-forest-dark" style={HILL} />
      {/* The tent, lit from inside, on the last hill. */}
      <svg viewBox="0 0 120 70" className="absolute bottom-[34px] left-[18%] h-[62px] w-[106px] sm:left-[22%]" focusable="false">
        <defs>
          <radialGradient id="night-tent-glow" cx="50%" cy="78%" r="55%">
            <stop offset="0" stopColor="#F4F1E8" stopOpacity="0.4" />
            <stop offset="1" stopColor="#F4F1E8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="60" cy="56" rx="58" ry="22" fill="url(#night-tent-glow)" />
        <path d="M24,62 L60,10 L96,62 Z" fill="#0D1A14" />
        <path d="M60,10 L64,4 M60,10 L56,4" stroke="#0D1A14" strokeWidth="2" strokeLinecap="round" />
        <path d="M51,62 L60,36 L69,62 Z" fill="#F4F1E8" opacity="0.85" />
        <path d="M10,62 L110,62 L110,70 L10,70 Z" fill="#14201A" />
      </svg>
    </div>
  );
};

export default NightCamp;
