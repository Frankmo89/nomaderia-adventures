import { useMemo, useRef, type CSSProperties, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import { useScrollDepth, type DepthLayer, type ScrollDepth } from "@/hooks/use-scroll-depth";
import { CANYON, canyonMaskUrl, mirrorShape, type CanyonShape } from "@/lib/canyon-silhouettes";
import { cn } from "@/lib/utils";

/**
 * CanyonPassage (ADR-052) — a wordless stretch between the travel insurance
 * block and the FAQ where you fly into a canyon. Flat silhouettes in the same
 * greens as the hero's range and the promise forest: pale far rim, sage
 * buttes, a mist-coloured river, pine-green middle walls and dark near walls
 * with pines on their ledges. The sky starts in the insurance block's
 * green-wash; the scene ends in a cloud-coloured rim, so the FAQ below
 * follows with no seam.
 *
 * The scene is a full-screen stage that stays put (sticky) while the page
 * scrolls most of one more screen. The near walls rise the full height of
 * the screen; the rest of the canyon keeps its drawn proportions at the
 * bottom (at most 165vw tall), so it is never squeezed into a slit. Over the
 * pinned scroll the near walls fly past you, the middle walls part and the
 * buttes and river come closer. With "reduce motion" it is a still 400–520 px
 * band instead.
 */

const mask = (s: CanyonShape) => ({ "--canyon": canyonMaskUrl(s) }) as CSSProperties;
const FAR_RIM = mask(CANYON.farRim);
const BUTTES = mask(CANYON.buttes);
const RIVER = mask(CANYON.river);

type WallKind = "mid" | "near";

/* Same greens as the other scenes: forest far #8DB09C and middle #4F7F66,
   hero middle range #1E3D30. */
const WALLS: Record<WallKind, { l: CSSProperties; r: CSSProperties; fill: string; width: string }> = {
  mid: { l: mask(CANYON.midWall), r: mask(mirrorShape(CANYON.midWall)), fill: "#4F7F66", width: "w-1/2 lg:w-[44%]" },
  near: { l: mask(CANYON.nearWall), r: mask(mirrorShape(CANYON.nearWall)), fill: "#1E3D30", width: "w-1/2 lg:w-[36%]" },
};

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

/** Pines on ledges: x and ledge height in the wall's 200 × 400 box. */
const PINES: Record<WallKind, readonly { x: number; y: number; size: string }[]> = {
  mid: [],
  near: [
    { x: 9, y: 40, size: "h-9 w-[22px] lg:h-11 lg:w-[26px]" },
    { x: 21, y: 41, size: "h-6 w-[15px] lg:h-8 lg:w-[19px]" },
    { x: 45, y: 97, size: "h-7 w-[18px] lg:h-9 lg:w-[22px]" },
    { x: 67, y: 172, size: "h-5 w-3 lg:h-7 lg:w-4" },
  ],
};

const Wall = ({ side, kind, innerRef }: { side: "l" | "r"; kind: WallKind; innerRef: RefObject<HTMLDivElement> }) => {
  const wall = WALLS[kind];
  return (
    <div
      ref={innerRef}
      className={cn(
        "absolute inset-y-0 will-change-transform",
        wall.width,
        side === "l" ? "left-0 origin-bottom-left" : "right-0 origin-bottom-right",
      )}
    >
      <div className="canyon-shape" style={{ ...wall[side], backgroundColor: wall.fill }} />
      {PINES[kind].map((p) => (
        <svg
          key={`${p.x}-${p.y}`}
          viewBox="0 0 30 50"
          className={cn("absolute", p.size, side === "l" ? "-translate-x-1/2" : "translate-x-1/2")}
          style={{ [side === "l" ? "left" : "right"]: `${p.x / 2}%`, bottom: `${((400 - p.y) / 400) * 100}%`, fill: wall.fill }}
          focusable="false"
        >
          <path d={PINE_PATH} />
        </svg>
      ))}
    </div>
  );
};

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const smooth = (t: number) => t * t * (3 - 2 * t);
/** 0 → 1 while the stage is pinned (the section's top has reached the top of the screen). */
const pinned = ({ entered, viewport, height }: ScrollDepth) =>
  height > viewport ? clamp01((entered - viewport) / (height - viewport)) : 0;

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
    const move = (x: number, y: number, s: number) =>
      `translate3d(${x.toFixed(2)}%, ${y.toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
    // Each wall pair parts by `spread` % of its width and grows by `zoom`,
    // over the part of the pinned scroll given by `from`–`to`. To leave the
    // screen, a wall must move more than it grows (spread ≥ zoomed width).
    const wall = (side: -1 | 1, spread: number, zoom: number, from = 0, to = 1) => (d: ScrollDepth) => {
      const t = smooth(clamp01((pinned(d) - from) / (to - from)));
      return move(side * t * spread, 0, 1 + t * zoom);
    };
    const centre = (sink: number, zoom: number) => (d: ScrollDepth) => {
      const t = smooth(pinned(d));
      return move(0, t * sink, 1 + t * zoom);
    };
    return [
      { ref: farRef, transform: centre(0, 0.3) },
      { ref: buttesRef, transform: centre(24, 0.9) },
      { ref: riverRef, transform: centre(0, 1.5) },
      { ref: midLRef, transform: wall(-1, 48, 0.65) },
      { ref: midRRef, transform: wall(1, 48, 0.65) },
      { ref: nearLRef, transform: wall(-1, 150, 1.1, 0.1, 1) },
      { ref: nearRRef, transform: wall(1, 150, 1.1, 0.1, 1) },
    ];
  }, []);
  useScrollDepth(sectionRef, layers, { enabled: !reducedMotion });

  return (
    <div ref={sectionRef} aria-hidden="true" className={cn("relative", !reducedMotion && "h-[180svh] lg:h-[170vh]")}>
      <style>{CANYON_CSS}</style>
      <div
        className={cn(
          "canyon-sky overflow-hidden",
          reducedMotion ? "relative h-[400px] sm:h-[460px] lg:h-[520px]" : "sticky top-0 h-[100svh]",
        )}
      >
        {/* The canyon keeps its drawn proportions at the bottom of the stage. */}
        <div className="absolute inset-x-0 bottom-0 h-full max-h-[165vw]">
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
          <Wall side="l" kind="mid" innerRef={midLRef} />
          <Wall side="r" kind="mid" innerRef={midRRef} />
        </div>
        {/* The near walls rise the full height: you stand between them. */}
        <Wall side="l" kind="near" innerRef={nearLRef} />
        <Wall side="r" kind="near" innerRef={nearRRef} />
        {/* The cloud ground the FAQ stands on. */}
        <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-10 w-full" focusable="false">
          <path d={RIM_PATH} fill="#FBFAF7" />
        </svg>
      </div>
    </div>
  );
};

export default CanyonPassage;
