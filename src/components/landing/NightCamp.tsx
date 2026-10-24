import { useCallback, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { useScrollDepth, type DepthLayer, type ScrollDepth } from "@/hooks/use-scroll-depth";
import { HERO_RIDGES, ridgeMaskUrl } from "@/lib/hero-ridges";
import { FOREST, silhouetteMaskUrl, type Silhouette } from "@/lib/forest-silhouettes";

/**
 * NightCamp (ADR-053) — the home's trip ends at camp. It wraps the footer:
 * the footer's text sits on a night sky, and the page closes on a landscape
 * (as in the Duna and Corgi footers on Mobbin). The day starts in the hero's
 * photo and goes through the forest, the road and the canyon; here the sun
 * has just set. Same flat silhouettes as the other scenes: the hero's range,
 * a line of pines, the last hill and, on a knoll, a tent, a lantern and a
 * hiker sitting out under the sky.
 *
 * Scroll effect (useScrollDepth), over the last scroll of the page: the
 * sunset glow behind the range fades into night, the stars come out one by
 * one, the moon rises from behind the mountains, the range and pines climb
 * into place, and the camp lights up when you reach the bottom. With
 * "reduce motion" it shows the finished night, still.
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

/** Stars: fixed positions (no randomness at render); each comes out at its own point of the scroll. */
const STARS = Array.from({ length: 54 }, (_, i) => {
  const r = (n: number) => {
    const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  return {
    left: r(1) * 100,
    top: r(2) * 70,
    size: r(3) > 0.85 ? 3 : r(3) > 0.5 ? 2 : 1.5,
    delay: r(4) * 4,
    at: 0.45 + r(5) * 0.45,
  };
});

/* Night palette of the /destinos scene; the sunset glow is its dusk sky. */
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
.night-glow-night { background: linear-gradient(to bottom, rgba(20, 32, 26, 0), #21402f 35%, #4e8a6a 62%, #4e8a6a 100%); }
/* Warm band placed just above the peaks (the lower part hides behind the range). */
.night-glow-dusk { background: linear-gradient(to bottom, rgba(61, 53, 85, 0), #3d3555 22%, #cc7d66 48%, #f2b577 64%, #f2b577 100%); }
.night-star { position: absolute; border-radius: 9999px; background: #eaf0ec; }
.night-star > span { display: block; width: 100%; height: 100%; border-radius: inherit; background: inherit; }
.night-shooting {
  position: absolute;
  top: 12%;
  left: 64%;
  width: 90px;
  height: 1.5px;
  border-radius: 9999px;
  background: linear-gradient(to left, rgba(244, 241, 232, 0.95), rgba(244, 241, 232, 0));
  opacity: 0;
  transform: rotate(-24deg);
}
@media (prefers-reduced-motion: no-preference) {
  .night-star > span { animation: night-twinkle 3.6s ease-in-out infinite; }
  .night-shooting { animation: night-shoot 9s ease-in 2s infinite; }
  .night-lantern { animation: night-flicker 2.4s ease-in-out infinite; }
}
@keyframes night-twinkle { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
@keyframes night-flicker { 0%, 100% { opacity: 1; } 40% { opacity: 0.82; } 60% { opacity: 0.95; } }
@keyframes night-shoot {
  0%, 88% { opacity: 0; translate: 0 0; }
  90% { opacity: 1; }
  97%, 100% { opacity: 0; translate: -160px 72px; }
}
`;

/** A three-tier pine, same family as the forest's. */
const PINE_PATH = "M15,0 L22,15 L19,15 L26,29 L21,29 L30,46 L17,46 L17,50 L13,50 L13,46 L0,46 L9,29 L4,29 L11,15 L8,15 Z";

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const smooth = (t: number) => t * t * (3 - 2 * t);
/**
 * 0 → 1 while the landscape comes into view: over the last scroll of the
 * page (half a screen, at most 420 px), reaching 1 at the very bottom. Any
 * earlier and the sunset would be over before you see it.
 */
const nightfall = ({ entered, viewport, height }: ScrollDepth) =>
  smooth(clamp01(1 - (height - entered) / Math.min(viewport * 0.5, 420)));

const NightCamp = ({ children }: { children: ReactNode }) => {
  const reducedMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLDivElement>(null);
  const duskRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLDivElement>(null);
  const pinesRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<SVGGElement>(null);
  const lampRef = useRef<SVGGElement>(null);
  const starRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const layers = useMemo<readonly DepthLayer[]>(() => {
    const rise = (px: number) => (d: ScrollDepth) => `translate3d(0, ${((1 - nightfall(d)) * px).toFixed(1)}px, 0)`;
    return [
      { ref: moonRef, transform: rise(150) },
      { ref: rangeRef, transform: rise(56) },
      { ref: pinesRef, transform: rise(26) },
    ];
  }, []);
  // Colour and light: the sunset fades, stars come out, the camp lights up.
  const onFrame = useCallback((d: ScrollDepth) => {
    const t = nightfall(d);
    // The sunset holds while the range comes up, then fades in the second half.
    if (duskRef.current) duskRef.current.style.opacity = (1 - smooth(clamp01((t - 0.45) / 0.55))).toFixed(3);
    STARS.forEach((s, i) => {
      const el = starRefs.current[i];
      if (el) el.style.opacity = clamp01((t - s.at) / 0.2).toFixed(2);
    });
    const lit = clamp01((t - 0.7) / 0.3).toFixed(3);
    if (glowRef.current) glowRef.current.style.opacity = lit;
    if (lampRef.current) lampRef.current.style.opacity = lit;
  }, []);
  useScrollDepth(sectionRef, layers, { enabled: !reducedMotion, onFrame });

  return (
    <div ref={sectionRef} className="night-sky relative overflow-hidden">
      <style>{NIGHT_CSS}</style>

      {/* Sky (decorative). With "reduce motion" it is the finished night. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {STARS.map((s, i) => (
          <span
            key={i}
            ref={(el) => (starRefs.current[i] = el)}
            className="night-star"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, opacity: reducedMotion ? 0.8 : 0 }}
          >
            <span style={{ animationDelay: `${s.delay}s` }} />
          </span>
        ))}
        <span className="night-shooting" />
      </div>

      {/* The footer's text, on the night sky. */}
      <div className="relative z-10 pt-16 sm:pt-20">{children}</div>

      {/* The landscape the page ends on. */}
      <div aria-hidden="true" className="pointer-events-none relative h-[250px] sm:h-[280px] lg:h-[320px]">
        <div className="night-glow-night absolute inset-x-0 bottom-0 h-[300px] lg:h-[340px]" />
        <div
          ref={duskRef}
          className="night-glow-dusk absolute inset-x-0 bottom-0 h-[300px] lg:h-[340px]"
          style={{ opacity: reducedMotion ? 0 : 1 }}
        />
        <div
          ref={moonRef}
          className="absolute bottom-[150px] right-[14%] h-14 w-14 rounded-full bg-[#F4F1E8] shadow-[0_0_60px_22px_rgba(234,240,236,0.22)] will-change-transform sm:h-16 sm:w-16 lg:bottom-[190px]"
        />
        <div ref={rangeRef} className="night-line h-[190px] bg-[#2F5E4A] will-change-transform lg:h-[230px]" style={RANGE} />
        <div ref={pinesRef} className="night-line h-[140px] bg-[#16332A] will-change-transform lg:h-[160px]" style={PINES} />
        <div className="night-line h-[70px] bg-forest-dark" style={HILL} />

        {/* The camp: a knoll with a tent, a lantern, two pines and a hiker
            looking at the sky, drawn together so the tent sits on the ground. */}
        <svg
          viewBox="0 0 360 150"
          className="absolute bottom-0 left-1/2 h-[150px] w-[360px] -translate-x-1/2 lg:left-[30%] lg:h-[175px] lg:w-[420px]"
          focusable="false"
        >
          <defs>
            <radialGradient id="night-camp-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#F4F1E8" stopOpacity="0.45" />
              <stop offset="1" stopColor="#F4F1E8" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g ref={glowRef} style={{ opacity: reducedMotion ? 1 : 0 }}>
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
          </g>
          {/* Tent */}
          <path d="M146,96 L184,42 L222,96 Z" fill="#0D1A14" />
          <path d="M184,42 L180,34 M184,42 L188,34" stroke="#0D1A14" strokeWidth="2.5" strokeLinecap="round" />
          {/* Lantern on a pole */}
          <path d="M246,98 L246,58" stroke="#0D1A14" strokeWidth="2.5" />
          <path d="M240,56 L252,56" stroke="#0D1A14" strokeWidth="2" />
          {/* Hiker sitting on the knoll, looking up */}
          <g fill="#0D1A14">
            <circle cx="104" cy="70" r="6" />
            <path d="M98,77 L110,77 L113,94 L96,94 Z" />
            <path d="M110,88 L128,90 L130,98 L112,98 Z" />
            <path d="M92,79 L99,79 L99,92 L90,92 Z" />
          </g>
          {/* What lights up: the tent door and the lantern. */}
          <g ref={lampRef} fill="#F4F1E8" style={{ opacity: reducedMotion ? 1 : 0 }}>
            <path d="M176,96 L184,66 L192,96 Z" opacity="0.92" />
            <rect className="night-lantern" x="242" y="58" width="8" height="10" rx="2" />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default NightCamp;
