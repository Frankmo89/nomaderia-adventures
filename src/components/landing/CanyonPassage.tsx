import { useMemo, useRef, type CSSProperties, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import { useScrollDepth, type DepthLayer, type ScrollDepth } from "@/hooks/use-scroll-depth";
import { CANYON, canyonMaskUrl, mirrorShape, type CanyonShape } from "@/lib/canyon-silhouettes";
import { cn } from "@/lib/utils";

/**
 * CanyonPassage (ADR-052) — a short, wordless band between the travel
 * insurance block and the FAQ: a canyon seen from inside, drawn as flat
 * silhouettes in the same greens as the hero's range and the promise forest
 * (pale far rim, sage buttes, pine-green middle walls, dark near walls with a
 * few pines on their ledges, a mist-coloured river). The sky starts in the
 * insurance block's green-wash; the band ends in a cloud-coloured rim, so the
 * FAQ below follows with no seam.
 *
 * Scroll effect (useScrollDepth, off with "reduce motion"): as the band
 * crosses the screen the walls part and grow, the near ones most, the far
 * rim hardly at all, so it feels like flying down the canyon.
 */

const mask = (s: CanyonShape) => ({ "--canyon": canyonMaskUrl(s) }) as CSSProperties;
const FAR_RIM = mask(CANYON.farRim);
const BUTTES = mask(CANYON.buttes);
const RIVER = mask(CANYON.river);
const MID = { l: mask(CANYON.midWall), r: mask(mirrorShape(CANYON.midWall)) };
const NEAR = { l: mask(CANYON.nearWall), r: mask(mirrorShape(CANYON.nearWall)) };

/* Same greens as the other scenes: forest far #8DB09C and middle #4F7F66,
   hero middle range #1E3D30. */
const CANYON_CSS = `
.canyon-sky {
  background: linear-gradient(to bottom, #e8f1ea 0%, #dce8e0 45%, #c3d8cb 100%);
}
.canyon-shape {
  position: absolute;
  inset: 0;
  -webkit-mask: var(--canyon) 0 0 / 100% 100% no-repeat;
  mask: var(--canyon) 0 0 / 100% 100% no-repeat;
}
.canyon-haze {
  background: linear-gradient(rgba(251, 250, 247, 0), rgba(251, 250, 247, 0.55) 50%, rgba(251, 250, 247, 0));
}
`;

/** Cloud ground the canyon ends in (matches the FAQ's background). */
const RIM_PATH =
  "M0,40 L0,16 C40,6 80,10 120,14 C160,18 180,8 200,6 C230,4 260,12 300,14 C340,16 370,6 400,10 L400,40 Z";

/** A three-tier pine, same shape family as the forest's. */
const PINE_PATH = "M15,0 L22,15 L19,15 L26,29 L21,29 L30,46 L17,46 L17,50 L13,50 L13,46 L0,46 L9,29 L4,29 L11,15 L8,15 Z";

/** Pines standing on the near wall's ledges: x and ledge height in the wall's 200 × 400 box. */
const LEDGE_PINES = [
  { x: 9, y: 40, size: "h-9 w-[22px] lg:h-11 lg:w-[26px]" },
  { x: 21, y: 41, size: "h-6 w-[15px] lg:h-8 lg:w-[19px]" },
  { x: 45, y: 97, size: "h-7 w-[18px] lg:h-9 lg:w-[22px]" },
  { x: 67, y: 172, size: "h-5 w-3 lg:h-7 lg:w-4" },
] as const;

const Wall = ({
  side,
  near,
  innerRef,
}: {
  side: "l" | "r";
  near: boolean;
  innerRef: RefObject<HTMLDivElement>;
}) => (
  <div
    ref={innerRef}
    className={cn(
      "absolute inset-y-0 w-1/2 will-change-transform",
      side === "l" ? "left-0 origin-bottom-left" : "right-0 origin-bottom-right",
      near ? "lg:w-[36%]" : "lg:w-[44%]",
    )}
  >
    <div className={cn("canyon-shape", near ? "bg-[#1E3D30]" : "bg-[#4F7F66]")} style={(near ? NEAR : MID)[side]} />
    {near &&
      LEDGE_PINES.map((p) => (
        <svg
          key={`${p.x}-${p.y}`}
          viewBox="0 0 30 50"
          className={cn("absolute fill-[#1E3D30]", p.size, side === "l" ? "-translate-x-1/2" : "translate-x-1/2")}
          style={{ [side === "l" ? "left" : "right"]: `${p.x / 2}%`, bottom: `${((400 - p.y) / 400) * 100}%` }}
          focusable="false"
        >
          <path d={PINE_PATH} />
        </svg>
      ))}
  </div>
);

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
      <div ref={farRef} className="absolute inset-0 origin-bottom will-change-transform">
        <div className="canyon-shape bg-[#B3CBBD]" style={FAR_RIM} />
      </div>
      <div ref={buttesRef} className="absolute inset-0 origin-bottom will-change-transform">
        <div className="canyon-shape bg-[#8DB09C]" style={BUTTES} />
      </div>
      <div className="canyon-haze absolute inset-x-0 top-[36%] h-[30%]" />
      <div ref={riverRef} className="absolute inset-0 origin-bottom will-change-transform">
        <div className="canyon-shape bg-mist" style={RIVER} />
      </div>
      <Wall side="l" near={false} innerRef={midLRef} />
      <Wall side="r" near={false} innerRef={midRRef} />
      <Wall side="l" near innerRef={nearLRef} />
      <Wall side="r" near innerRef={nearRRef} />
      {/* The cloud ground the FAQ stands on. */}
      <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-10 w-full" focusable="false">
        <path d={RIM_PATH} fill="#FBFAF7" />
      </svg>
    </div>
  );
};

export default CanyonPassage;
