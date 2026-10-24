import { useMemo, useRef, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { useScrollDepth, type DepthLayer, type ScrollDepth } from "@/hooks/use-scroll-depth";
import { CANYON, canyonMaskUrl, mirrorShape, type CanyonShape } from "@/lib/canyon-silhouettes";

/**
 * CanyonPassage (ADR-052) — a short, wordless band between the travel
 * insurance block and the FAQ: the Grand Canyon seen from inside. Sky that
 * starts in the insurance block's green-wash, a far rim of mesas, two buttes,
 * a river, and two pairs of stepped walls in banded red rock; it ends in a
 * cloud-coloured rim, so the FAQ below follows with no seam.
 *
 * Scroll effect (useScrollDepth, off with "reduce motion"): as the band
 * crosses the screen the walls part and grow, the near ones most, the far
 * rim hardly at all, so it feels like flying down the canyon.
 */

const mask = (s: CanyonShape) => ({ "--canyon": canyonMaskUrl(s) }) as CSSProperties;
const FAR_RIM = mask(CANYON.farRim);
const BUTTES = mask(CANYON.buttes);
const RIVER = mask(CANYON.river);
const MID_L = mask(CANYON.midWall);
const MID_R = mask(mirrorShape(CANYON.midWall));
const NEAR_L = mask(CANYON.nearWall);
const NEAR_R = mask(mirrorShape(CANYON.nearWall));

/* Rock is flat colour in horizontal bands (the strata), cut by each shape.
   Illustration colours only: no UI here uses them. */
const CANYON_CSS = `
.canyon-sky {
  background: linear-gradient(to bottom, #e8f1ea 0%, #f1eadf 38%, #f2dcc6 70%, #efcdb0 100%);
}
.canyon-layer {
  position: absolute;
  top: 0;
  bottom: 0;
  -webkit-mask: var(--canyon) 0 0 / 100% 100% no-repeat;
  mask: var(--canyon) 0 0 / 100% 100% no-repeat;
}
.canyon-far { background: repeating-linear-gradient(#ebd3c6 0 8px, #e3c5b5 8px 12px); }
.canyon-buttes { background: repeating-linear-gradient(#e2ac8a 0 10px, #d99c79 10px 16px, #e8b898 16px 26px); }
.canyon-river { background: linear-gradient(#a9d0c6, #4e8c86); }
.canyon-mid {
  background: repeating-linear-gradient(#cb7e54 0 13px, #bd6f47 13px 20px, #d58e63 20px 34px, #b4653f 34px 40px);
}
.canyon-near {
  background: repeating-linear-gradient(
    #a6492b 0 18px, #913f25 18px 28px, #b3573a 28px 50px, #7e3620 50px 58px, #9a4429 58px 74px
  );
}
.canyon-haze {
  background: linear-gradient(rgba(246, 236, 226, 0), rgba(246, 236, 226, 0.6) 50%, rgba(246, 236, 226, 0));
}
`;

/** Cloud ground the canyon ends in (matches the FAQ's background). */
const RIM_PATH =
  "M0,40 L0,16 C40,6 80,10 120,14 C160,18 180,8 200,6 C230,4 260,12 300,14 C340,16 370,6 400,10 L400,40 Z";

const CanyonPassage = () => {
  const reducedMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLDivElement>(null);
  const farRef = useRef<HTMLDivElement>(null);
  const buttesRef = useRef<HTMLDivElement>(null);
  const riverRef = useRef<HTMLDivElement>(null);
  const midLRef = useRef<HTMLDivElement>(null);
  const midRRef = useRef<HTMLDivElement>(null);
  const nearLRef = useRef<HTMLDivElement>(null);
  const nearRRef = useRef<HTMLDivElement>(null);

  const layers = useMemo<readonly DepthLayer[]>(() => {
    // 0 when the band sits a little below mid-screen; negative while it enters.
    const at = ({ progress }: ScrollDepth) => progress - 0.45;
    const grow = (o: number, k: number) => (1 + Math.max(o, 0) * k).toFixed(3);
    // Side walls part (left goes left, right goes right) and grow.
    const wall = (side: -1 | 1, spread: number, sink: number, zoom: number) => (d: ScrollDepth) => {
      const o = at(d);
      return `translate3d(${(side * o * spread).toFixed(2)}%, ${(o * sink).toFixed(1)}px, 0) scale(${grow(o, zoom)})`;
    };
    const centre = (sink: number, zoom: number) => (d: ScrollDepth) => {
      const o = at(d);
      return `translate3d(0, ${(o * sink).toFixed(1)}px, 0) scale(${grow(o, zoom)})`;
    };
    return [
      { ref: farRef, transform: centre(30, 0.03) },
      { ref: buttesRef, transform: centre(18, 0.18) },
      { ref: riverRef, transform: centre(10, 0.25) },
      { ref: midLRef, transform: wall(-1, 18, 8, 0.18) },
      { ref: midRRef, transform: wall(1, 18, 8, 0.18) },
      { ref: nearLRef, transform: wall(-1, 40, 0, 0.4) },
      { ref: nearRRef, transform: wall(1, 40, 0, 0.4) },
    ];
  }, []);
  useScrollDepth(sectionRef, layers, { enabled: !reducedMotion });

  return (
    <div ref={sectionRef} aria-hidden="true" className="canyon-sky relative h-[400px] overflow-hidden sm:h-[460px] lg:h-[520px]">
      <style>{CANYON_CSS}</style>
      <div ref={farRef} className="canyon-layer canyon-far inset-x-0 origin-bottom will-change-transform" style={FAR_RIM} />
      <div ref={buttesRef} className="canyon-layer canyon-buttes inset-x-0 origin-bottom will-change-transform" style={BUTTES} />
      <div className="canyon-haze absolute inset-x-0 top-[36%] h-[30%]" />
      <div ref={riverRef} className="canyon-layer canyon-river inset-x-0 origin-bottom will-change-transform" style={RIVER} />
      <div ref={midLRef} className="canyon-layer canyon-mid left-0 w-1/2 origin-bottom-left will-change-transform lg:w-[44%]" style={MID_L} />
      <div ref={midRRef} className="canyon-layer canyon-mid right-0 w-1/2 origin-bottom-right will-change-transform lg:w-[44%]" style={MID_R} />
      <div ref={nearLRef} className="canyon-layer canyon-near left-0 w-1/2 origin-bottom-left will-change-transform lg:w-[36%]" style={NEAR_L} />
      <div ref={nearRRef} className="canyon-layer canyon-near right-0 w-1/2 origin-bottom-right will-change-transform lg:w-[36%]" style={NEAR_R} />
      {/* The cloud ground the FAQ stands on. */}
      <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-10 w-full" focusable="false">
        <path d={RIM_PATH} fill="#FBFAF7" />
      </svg>
    </div>
  );
};

export default CanyonPassage;
