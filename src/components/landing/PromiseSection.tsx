import { useMemo, useRef, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useScrollDepth, type DepthLayer, type ScrollDepth } from "@/hooks/use-scroll-depth";
import { FOREST, silhouetteMaskUrl, type Silhouette } from "@/lib/forest-silhouettes";

/**
 * PromiseSection (ADR-050) — the one-line promise between the hero and the
 * park cards, set apart from both (they are dark) as a light, misty forest.
 * Pale sky, a sun low on the right, three treelines (far, middle, forest
 * floor) and two big pines framing the corners. The forest floor ends in
 * forest-dark, so the dark park cards below follow with no seam.
 *
 * Scroll effect (useScrollDepth, off with "reduce motion"): as the section
 * crosses the screen the sun sets behind the trees, the far and middle
 * treelines lag behind the page (depth), and the corner pines start a little
 * inward and step aside, as if you walked into the clearing.
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
const SIDE = { "--forest": silhouetteMaskUrl(FOREST.side) } as CSSProperties;

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
.promise-side {
  -webkit-mask: var(--forest) center / 100% 100% no-repeat;
  mask: var(--forest) center / 100% 100% no-repeat;
}
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
}
@keyframes promise-mist {
  to { transform: translateX(-50%); }
}
`;

const PromiseSection = () => {
  const reducedMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);

  const layers = useMemo<readonly DepthLayer[]>(() => {
    // Centered on the moment the section sits mid-screen (progress 0.5).
    const sink = (px: number) => ({ progress }: ScrollDepth) =>
      `translate3d(0, ${((progress - 0.5) * px).toFixed(1)}px, 0)`;
    // 1 while the section enters, 0 once it is 60 % across.
    const closed = ({ progress }: ScrollDepth) => Math.min(Math.max((0.6 - progress) / 0.6, 0), 1);
    return [
      { ref: sunRef, transform: sink(120) },
      { ref: farRef, transform: sink(56) },
      { ref: midRef, transform: sink(26) },
      { ref: leftRef, transform: (d) => `translate3d(${(closed(d) * 44).toFixed(1)}px, 0, 0)` },
      { ref: rightRef, transform: (d) => `translate3d(${(-closed(d) * 44).toFixed(1)}px, 0, 0)` },
    ];
  }, []);
  useScrollDepth(sectionRef, layers, { enabled: !reducedMotion });

  return (
    <section ref={sectionRef} className="promise-sky relative overflow-hidden">
      <style>{FOREST_CSS}</style>

      {/* Scene (decorative): sun, far trees, mist, middle trees, forest floor, corner pines. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          ref={sunRef}
          className="absolute bottom-[200px] right-[16%] h-16 w-16 rounded-full bg-cloud shadow-[0_0_70px_34px_rgba(251,250,247,0.75)] will-change-transform sm:bottom-[230px] sm:h-24 sm:w-24"
        />
        <div ref={farRef} className="promise-line h-[230px] bg-[#8DB09C] will-change-transform" style={FAR} />
        <div className="promise-mist bottom-[140px] h-[80px]" />
        <div ref={midRef} className="promise-line h-[190px] bg-[#4F7F66] will-change-transform" style={MID} />
        <div className="promise-line h-[90px] bg-forest-dark" style={NEAR} />
        <div ref={leftRef} className="absolute bottom-0 left-0 will-change-transform">
          <div className="promise-side h-[180px] w-[132px] bg-forest-dark sm:h-[300px] sm:w-[220px]" style={SIDE} />
        </div>
        <div ref={rightRef} className="absolute bottom-0 right-0 will-change-transform">
          <div className="promise-side h-[180px] w-[132px] -scale-x-100 bg-forest-dark sm:h-[300px] sm:w-[220px]" style={SIDE} />
        </div>
      </div>

      <div className="container relative mx-auto px-5 pb-[270px] pt-24 sm:pb-[320px] sm:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
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
    </section>
  );
};

export default PromiseSection;
