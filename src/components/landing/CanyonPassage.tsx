import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import { useScrollDepth, type DepthLayer, type ScrollDepth } from "@/hooks/use-scroll-depth";
import { CANYON, canyonMaskUrl, mirrorShape, riverAt, type CanyonShape } from "@/lib/canyon-silhouettes";
import { cn } from "@/lib/utils";

/**
 * CanyonPassage (ADR-052) — a wordless stretch between the travel insurance
 * block and the FAQ where you drop into a canyon and follow its river. Flat
 * silhouettes in the same greens as the hero's range and the promise forest.
 *
 * It opens with the insurance block's green-wash ending in waves over the
 * canyon sky, as it closes with the cloud ground.
 *
 * The scene is a full-screen stage that stays put (sticky) while the page
 * scrolls one more screen. You start on a lookout ledge: sun rays, birds
 * soaring, bands of mist between the buttes, the river far below. As you
 * scroll you leave the ledge, the near walls fly past, you go through a bank
 * of mist, the sun fades and the walls darken as you go deeper (their lit
 * faces stay light). At the end the river runs wide past rocks to the bottom
 * of the screen, and clouds rise into the cloud ground the FAQ stands on.
 * Ideas from Gemini (video and stills: the river as the path, darker walls
 * deeper in, lit faces, ledge, rays, birds, flat mist, water streaks, rocks,
 * rising clouds) and Grok (staggered timing).
 *
 * Only transform and opacity change on scroll. The small loops (birds, mist,
 * water) stop when the canyon is off screen. With "reduce motion" it is a
 * still 400–520 px band at the lookout.
 */

const mask = (s: CanyonShape) => ({ "--canyon": canyonMaskUrl(s) }) as CSSProperties;
const FAR_RIM = mask(CANYON.farRim);
const BUTTES = mask(CANYON.buttes);
const RIVER = mask(CANYON.river);
const RIVER_GLOW = mask(CANYON.riverGlow);
const LEDGE = mask(CANYON.ledge);
const BANK_L = mask(CANYON.bank);
const BANK_R = mask(mirrorShape(CANYON.bank));

/** A flat band of mist with wavy edges, tiled across (`--band`). */
const MIST_PATH =
  "M0,26 C30,22 50,15 80,17 C110,19 122,24 152,23 C186,22 202,11 236,12 C270,13 286,22 320,22 C350,22 372,18 400,26 L400,31 C360,33 320,29 280,31 C230,34 170,30 120,32 C70,34 30,30 0,31 Z";
const MIST = {
  "--band": `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 40" preserveAspectRatio="none"><path d="${MIST_PATH}"/></svg>`,
  )}")`,
} as CSSProperties;

type WallKind = "mid" | "near";

/* Same greens as the other scenes: forest far #8DB09C and middle #4F7F66,
   hero ranges #2F5E4A and #1E3D30. `lit` is the colour of the faces that
   catch the light (the tops of the ledges, the sides facing the river);
   `shade` the colour the rest of the wall turns as you go deeper. */
const WALLS: Record<
  WallKind,
  { l: CSSProperties; r: CSSProperties; fill: string; lit: string; shade: string; width: string; face: [number, number] }
> = {
  mid: {
    l: mask(CANYON.midWall),
    r: mask(mirrorShape(CANYON.midWall)),
    fill: "#4F7F66",
    lit: "#6E9A82",
    shade: "#2F5E4A",
    width: "w-1/2 lg:w-[44%]",
    face: [4, 5],
  },
  near: {
    l: mask(CANYON.nearWall),
    r: mask(mirrorShape(CANYON.nearWall)),
    fill: "#1E3D30",
    lit: "#3E6E57",
    shade: "#14201A",
    width: "w-1/2 lg:w-[36%]",
    face: [6, 8],
  },
};

const CANYON_CSS = `
.canyon-sky {
  background: linear-gradient(to bottom, #d8e6dc 0%, #d0e1d6 45%, #c3d8cb 100%);
}
.canyon-shape {
  position: absolute;
  inset: 0;
  -webkit-mask: var(--canyon) 0 0 / 100% 100% no-repeat;
  mask: var(--canyon) 0 0 / 100% 100% no-repeat;
}
.canyon-ray {
  position: absolute;
  top: -10%;
  height: 140%;
  transform-origin: top center;
  transform: rotate(34deg);
  background: linear-gradient(
    to bottom,
    rgba(251, 250, 247, 0),
    rgba(251, 250, 247, 0.45) 22%,
    rgba(251, 250, 247, 0.45) 50%,
    rgba(251, 250, 247, 0)
  );
}
/* Flat mist bands, twice the width of their box so they can drift. */
.canyon-band {
  position: absolute;
  left: 0;
  width: 200%;
  -webkit-mask: var(--band) 0 0 / 50% 100% repeat-x;
  mask: var(--band) 0 0 / 50% 100% repeat-x;
}
.canyon-streak { position: absolute; height: 1.5px; border-radius: 9999px; background: #fbfaf7; opacity: 0; }
@media (prefers-reduced-motion: no-preference) {
  .canyon-drift { animation: canyon-drift 70s linear infinite; }
  .canyon-drift-slow { animation: canyon-drift 110s linear infinite reverse; }
  .canyon-soar { animation: canyon-soar 24s ease-in-out infinite; }
  .canyon-flap { animation: canyon-flap 6s ease-in-out infinite; }
  .canyon-streak { animation: canyon-flow 2.8s ease-in-out infinite; }
  .canyon-paused :is(.canyon-drift, .canyon-drift-slow, .canyon-soar, .canyon-flap, .canyon-streak) {
    animation-play-state: paused;
  }
}
@media (prefers-reduced-motion: reduce) {
  .canyon-streak { opacity: 0.7; }
}
@keyframes canyon-drift { to { transform: translateX(-50%); } }
@keyframes canyon-soar {
  0%, 100% { translate: 0 0; }
  25% { translate: 34px -10px; }
  50% { translate: 66px 2px; }
  75% { translate: 30px 12px; }
}
@keyframes canyon-flap {
  0%, 70%, 82%, 94%, 100% { transform: scaleY(1); }
  76%, 88% { transform: scaleY(0.4); }
}
@keyframes canyon-flow {
  0% { opacity: 0; translate: 0 -3px; }
  45% { opacity: 0.9; }
  100% { opacity: 0; translate: 0 5px; }
}
`;

/** The insurance block's green-wash ends in two waves over the canyon sky (as the cloud ground does at the bottom). */
const TOP_FRONT =
  "M0,0 L400,0 L400,16 C370,28 336,24 300,20 C262,16 232,30 198,28 C166,26 150,10 112,12 C74,14 40,30 0,22 Z";
const TOP_BACK =
  "M0,0 L400,0 L400,30 C362,40 330,30 290,30 C250,30 228,40 188,38 C150,36 130,24 90,26 C52,28 28,40 0,34 Z";

/** Cloud ground the canyon ends in (matches the FAQ's background). */
const RIM_PATH =
  "M0,40 L0,16 C40,6 80,10 120,14 C160,18 180,8 200,6 C230,4 260,12 300,14 C340,16 370,6 400,10 L400,40 Z";
/** The clouds that rise at the end: a back and a front layer. */
const CLOUD_BACK = "M0,100 L0,30 C30,12 60,10 90,22 C120,34 150,8 190,10 C230,12 250,30 290,26 C330,22 360,6 400,14 L400,100 Z";
const CLOUD_FRONT = "M0,100 L0,52 C40,34 80,40 110,50 C140,60 170,36 210,38 C250,40 270,58 310,54 C350,50 370,36 400,40 L400,100 Z";

/** A three-tier pine, same shape family as the forest's. */
const PINE_PATH = "M15,0 L22,15 L19,15 L26,29 L21,29 L30,46 L17,46 L17,50 L13,50 L13,46 L0,46 L9,29 L4,29 L11,15 L8,15 Z";

/** A soaring bird, wings out. */
const BIRD_PATH = "M0,7 C5,1 9,1 12,6 C15,1 19,1 24,7 C19,4 15,4 12,9 C9,4 5,4 0,7 Z";

/** A rock by the water, with its lit top. */
const ROCK_PATH = "M0,10 L2,4 L6,1 L12,0 L16,3 L18,10 Z";
const ROCK_TOP = "M2,4 L6,1 L12,0 L16,3 L11,4 L5,5 Z";

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

/** Sun rays from the top right: where each starts (% from the right) and its width. */
const RAYS = [
  { right: 4, width: 22 },
  { right: 30, width: 9 },
  { right: 44, width: 16 },
] as const;

/**
 * Birds: position in the sky (% of the stage), size, where in their loop
 * they start, and how they drift as you go down: each rises out of view at
 * its own pace (share of the screen) and glides a little sideways (px).
 */
const BIRDS = [
  { left: 60, top: 19, size: "w-6", delay: 0, rise: 0.3, drift: -40 },
  { left: 70, top: 24, size: "w-[18px]", delay: -7, rise: 0.22, drift: -26 },
  { left: 54, top: 26, size: "w-4", delay: -15, rise: 0.26, drift: -18 },
] as const;

/** Streaks on the water, placed along the river (fixed, no randomness). */
const STREAKS = Array.from({ length: 14 }, (_, i) => {
  const at = riverAt(0.22 + i * 0.055);
  const off = ((i % 3) - 1) * 0.45 * at.half;
  const w = Math.max(at.half * 0.55, 2.5);
  return { left: (at.x + off - w / 2) / 4, top: at.y / 4, width: w / 4, delay: (i * 0.61) % 2.8 };
});

/** Rocks on the banks near the bottom: where along the river, which bank, size. */
const ROCKS = [
  { s: 0.72, side: -1, w: 3.2 },
  { s: 0.8, side: 1, w: 2.6 },
  { s: 0.9, side: -1, w: 4 },
  { s: 0.94, side: 1, w: 4.6 },
  { s: 0.86, side: 1, w: 2 },
].map(({ s, side, w }) => {
  const at = riverAt(s);
  return { left: (at.x + side * at.half * 1.15) / 4 - (side < 0 ? w : 0), top: at.y / 4, width: w };
});

/** A pine standing at (x, bottom) of its box, in % (`side` says which edge x counts from). */
const Pine = ({ at, bottom, size, fill, side = "l" }: { at: string; bottom: string; size: string; fill: string; side?: "l" | "r" }) => (
  <svg
    viewBox="0 0 30 50"
    className={cn("absolute", size, side === "l" ? "-translate-x-1/2" : "translate-x-1/2")}
    style={{ [side === "l" ? "left" : "right"]: at, bottom, fill }}
    focusable="false"
  >
    <path d={PINE_PATH} />
  </svg>
);

/**
 * A flat shape with lit faces: the shape in its light colour, then the shape
 * itself moved by (dx, dy) on top, so a band of light stays on the edges
 * that face the light (the tops of ledges, the sides that face the river).
 */
const Lit = ({
  shape,
  fill,
  lit,
  dx,
  dy,
  children,
}: {
  shape: CSSProperties;
  fill: string;
  lit: string;
  dx: number;
  dy: number;
  children?: ReactNode;
}) => (
  <>
    <div className="canyon-shape" style={{ ...shape, backgroundColor: lit }} />
    <div className="absolute inset-0" style={{ transform: `translate(${dx}px, ${dy}px)` }}>
      <div className="canyon-shape" style={{ ...shape, backgroundColor: fill }} />
      {children}
    </div>
  </>
);

const Wall = ({
  side,
  kind,
  innerRef,
  shadeRef,
}: {
  side: "l" | "r";
  kind: WallKind;
  innerRef: RefObject<HTMLDivElement>;
  shadeRef: RefObject<HTMLDivElement>;
}) => {
  const wall = WALLS[kind];
  const [dx, dy] = wall.face;
  const pines = (fill: string) =>
    PINES[kind].map((p) => (
      <Pine
        key={`${p.x}-${p.y}`}
        at={`${p.x / 2}%`}
        bottom={`${((400 - p.y) / 400) * 100}%`}
        size={p.size}
        fill={fill}
        side={side}
      />
    ));
  return (
    <div
      ref={innerRef}
      className={cn(
        "absolute will-change-transform",
        // The near walls reach a quarter screen below the stage, so they can rise as you go down.
        kind === "near" ? "-bottom-[25%] top-0" : "inset-y-0",
        wall.width,
        side === "l" ? "left-0 origin-bottom-left" : "right-0 origin-bottom-right",
      )}
    >
      <Lit shape={wall[side]} fill={wall.fill} lit={wall.lit} dx={side === "l" ? -dx : dx} dy={dy}>
        {pines(wall.fill)}
        {/* Deeper in, the wall darkens (opacity set on scroll). */}
        <div ref={shadeRef} className="absolute inset-0 opacity-0 will-change-[opacity]">
          <div className="canyon-shape" style={{ ...wall[side], backgroundColor: wall.shade }} />
          {pines(wall.shade)}
        </div>
      </Lit>
    </div>
  );
};

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const smooth = (t: number) => t * t * (3 - 2 * t);
/** 0 → 1 while the stage is pinned (the section's top has reached the top of the screen). */
const pinned = ({ entered, viewport, height }: ScrollDepth) =>
  height > viewport ? clamp01((entered - viewport) / (height - viewport)) : 0;
/** 0 → 1 (eased) over the part `from`–`to` of the pinned scroll. */
const span = (d: ScrollDepth, from: number, to: number) => smooth(clamp01((pinned(d) - from) / (to - from)));

const CanyonPassage = () => {
  const reducedMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLDivElement>(null);
  const birdRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const birdsRef = useRef(birdRefs).current;
  const farRef = useRef<HTMLDivElement>(null);
  const buttesRef = useRef<HTMLDivElement>(null);
  const raysRef = useRef<HTMLDivElement>(null);
  const riverRef = useRef<HTMLDivElement>(null);
  const midLRef = useRef<HTMLDivElement>(null);
  const midRRef = useRef<HTMLDivElement>(null);
  const nearLRef = useRef<HTMLDivElement>(null);
  const nearRRef = useRef<HTMLDivElement>(null);
  const midShadeLRef = useRef<HTMLDivElement>(null);
  const midShadeRRef = useRef<HTMLDivElement>(null);
  const nearShadeLRef = useRef<HTMLDivElement>(null);
  const nearShadeRRef = useRef<HTMLDivElement>(null);
  const ledgeRef = useRef<HTMLDivElement>(null);
  const mistRef = useRef<HTMLDivElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const bankLRef = useRef<HTMLDivElement>(null);
  const bankRRef = useRef<HTMLDivElement>(null);

  // The loops stop while the canyon is off screen.
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const layers = useMemo<readonly DepthLayer[]>(() => {
    const move = (x: number, y: number, s: number) =>
      `translate3d(${x.toFixed(2)}%, ${y.toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
    // Each wall pair parts by `spread` % of its width and grows by `zoom`.
    // To leave the screen (or open the floor), a wall must move more than it
    // grows: spread ≥ zoomed width.
    // `rise` lifts the pair by that share of the screen: near walls pass up
    // past you as you go down.
    const wall = (side: -1 | 1, spread: number, zoom: number, from: number, rise = 0) => (d: ScrollDepth) => {
      const t = span(d, from, 1);
      return move(side * t * spread, -t * rise * d.viewport, 1 + t * zoom);
    };
    const bank = (d: ScrollDepth) => `translate3d(0, ${((1 - span(d, 0.6, 1)) * 105).toFixed(1)}%, 0)`;
    // Buttes and river share a window and zoom, so the river stays on the canyon floor.
    // At most 1.65×, so the tops of the buttes keep some sky above them.
    const floor = (d: ScrollDepth) => move(0, 0, 1 + span(d, 0.12, 1) * 0.65);
    return [
      ...BIRDS.map((b, i) => ({
        ref: birdsRef[i],
        transform: (d: ScrollDepth) => {
          const t = span(d, 0, 1);
          return `translate3d(${(t * b.drift).toFixed(1)}px, ${(-t * b.rise * d.viewport).toFixed(1)}px, 0)`;
        },
      })),
      { ref: farRef, transform: (d) => move(0, 0, 1 + span(d, 0.25, 1) * 0.3) },
      { ref: buttesRef, transform: floor },
      { ref: riverRef, transform: floor },
      { ref: midLRef, transform: wall(-1, 80, 0.65, 0.15) },
      { ref: midRRef, transform: wall(1, 80, 0.65, 0.15) },
      { ref: nearLRef, transform: wall(-1, 150, 1.1, 0, 0.2) },
      { ref: nearRRef, transform: wall(1, 150, 1.1, 0, 0.2) },
      { ref: bankLRef, transform: bank },
      { ref: bankRRef, transform: bank },
      {
        ref: ledgeRef,
        transform: (d) => {
          const t = span(d, 0, 0.4);
          return `translate3d(0, ${(t * 115).toFixed(1)}%, 0) scale(${(1 + t * 0.25).toFixed(3)})`;
        },
      },
      {
        ref: mistRef,
        transform: (d) => {
          const t = clamp01((pinned(d) - 0.28) / 0.6);
          return `translate3d(0, ${(-t * 0.95 * d.viewport).toFixed(1)}px, 0) scale(${(1 + t * 0.6).toFixed(3)})`;
        },
      },
      { ref: cloudRef, transform: (d) => `translate3d(0, ${((1 - span(d, 0.7, 1)) * 100).toFixed(1)}%, 0)` },
    ];
  }, [birdsRef]);

  // Light and colour: the sun fades, the walls darken, the mist comes and goes.
  const onFrame = useCallback((d: ScrollDepth) => {
    const set = (ref: RefObject<HTMLDivElement>, v: number) => {
      if (ref.current) ref.current.style.opacity = v.toFixed(3);
    };
    set(raysRef, 1 - span(d, 0.08, 0.55));
    const near = span(d, 0.15, 0.85);
    set(nearShadeLRef, near);
    set(nearShadeRRef, near);
    const mid = 0.85 * span(d, 0.3, 1);
    set(midShadeLRef, mid);
    set(midShadeRRef, mid);
    set(mistRef, Math.sin(Math.PI * clamp01((pinned(d) - 0.28) / 0.6)));
  }, []);
  useScrollDepth(sectionRef, layers, { enabled: !reducedMotion, onFrame });

  return (
    <div ref={sectionRef} aria-hidden="true" className={cn("relative", !reducedMotion && "h-[200svh] lg:h-[190vh]")}>
      <style>{CANYON_CSS}</style>
      <div
        className={cn(
          "canyon-sky overflow-hidden",
          reducedMotion ? "relative h-[400px] sm:h-[460px] lg:h-[520px]" : "sticky top-0 h-[100svh]",
          !onScreen && "canyon-paused",
        )}
      >
        {/* Birds soaring high over the canyon; each glides away and rises out of view at its own pace as you go down. */}
        {BIRDS.map((b, i) => (
          <div
            key={b.left}
            ref={birdsRef[i]}
            className={cn("absolute will-change-transform", b.size)}
            style={{ left: `${b.left}%`, top: `${b.top}%` }}
          >
            <div className="canyon-soar" style={{ animationDelay: `${b.delay}s` }}>
              <svg
                viewBox="0 0 24 10"
                className="canyon-flap w-full fill-[#1E3D30]"
                style={{ animationDelay: `${b.delay * 0.4}s` }}
                focusable="false"
              >
                <path d={BIRD_PATH} />
              </svg>
            </div>
          </div>
        ))}

        {/* The canyon keeps its drawn proportions at the bottom of the stage. */}
        <div className="absolute inset-x-0 bottom-0 h-full max-h-[185vw]">
          <div ref={farRef} className="absolute inset-0 origin-bottom will-change-transform">
            <div className="canyon-shape bg-[#B3CBBD]" style={FAR_RIM} />
            <div className="absolute inset-x-0 top-[41%] h-[5%] overflow-hidden">
              <div className="canyon-band canyon-drift-slow inset-y-0 bg-[rgba(251,250,247,0.5)]" style={MIST} />
            </div>
          </div>
          <div ref={buttesRef} className="absolute inset-0 origin-bottom will-change-transform">
            <div className="canyon-shape bg-[#8DB09C]" style={BUTTES} />
          </div>
          {/* Sun rays from the top right, over the whole stage. */}
          <div
            ref={raysRef}
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[100svh] overflow-hidden will-change-[opacity]"
          >
            {RAYS.map((r) => (
              <span key={r.right} className="canyon-ray" style={{ right: `${r.right}%`, width: `${r.width}%` }} />
            ))}
          </div>
          <div ref={riverRef} className="absolute inset-0 origin-bottom will-change-transform">
            <div className="canyon-shape bg-[rgba(251,250,247,0.3)]" style={RIVER_GLOW} />
            <div className="canyon-shape bg-mist" style={RIVER} />
            {/* Mist at the feet of the buttes, over the river's source, so the river does not start at a cut. */}
            <div className="absolute inset-x-0 top-[62%] h-[7%] overflow-hidden">
              <div className="canyon-band canyon-drift inset-y-0 bg-[rgba(251,250,247,0.66)]" style={MIST} />
            </div>
            {STREAKS.map((s, i) => (
              <span
                key={i}
                className="canyon-streak"
                style={{ left: `${s.left}%`, top: `${s.top}%`, width: `${s.width}%`, animationDelay: `${s.delay}s` }}
              />
            ))}
            {ROCKS.map((r) => (
              <svg
                key={`${r.left}-${r.top}`}
                viewBox="0 0 18 10"
                className="absolute max-w-[26px] -translate-y-full"
                style={{ left: `${r.left}%`, top: `${r.top}%`, width: `${r.width}%` }}
                focusable="false"
              >
                <path d={ROCK_PATH} fill="#1E3D30" />
                <path d={ROCK_TOP} fill="#3E6E57" />
              </svg>
            ))}
          </div>
          <Wall side="l" kind="mid" innerRef={midLRef} shadeRef={midShadeLRef} />
          <Wall side="r" kind="mid" innerRef={midRRef} shadeRef={midShadeRRef} />
        </div>
        {/* The near walls rise the full height: you stand between them. */}
        <Wall side="l" kind="near" innerRef={nearLRef} shadeRef={nearShadeLRef} />
        <Wall side="r" kind="near" innerRef={nearRRef} shadeRef={nearShadeRRef} />
        {/* The banks you land by at the end, with pines; they rise from the bottom corners. */}
        <div ref={bankLRef} className="absolute bottom-0 left-0 h-[30%] w-[48%] translate-y-full will-change-transform lg:w-[34%]">
          <Lit shape={BANK_L} fill="#1E3D30" lit="#3E6E57" dx={-4} dy={6} />
          <Pine at="10%" bottom="72%" size="h-12 w-7" fill="#1E3D30" />
          <Pine at="19%" bottom="73%" size="h-9 w-[22px]" fill="#1E3D30" />
          <Pine at="27%" bottom="73%" size="h-7 w-4" fill="#1E3D30" />
        </div>
        <div ref={bankRRef} className="absolute bottom-0 right-0 h-[30%] w-[44%] translate-y-full will-change-transform lg:w-[30%]">
          <Lit shape={BANK_R} fill="#1E3D30" lit="#3E6E57" dx={4} dy={6} />
          <Pine at="9%" bottom="72%" size="h-11 w-[26px]" fill="#1E3D30" side="r" />
          <Pine at="18%" bottom="73%" size="h-8 w-5" fill="#1E3D30" side="r" />
        </div>
        {/* The lookout you start on, with its lit top; it drops away as you leave it. */}
        <div
          ref={ledgeRef}
          className="absolute bottom-0 left-0 h-[16%] w-[78%] origin-bottom-left will-change-transform lg:h-[22%] lg:w-[52%]"
        >
          <Lit shape={LEDGE} fill="#14201A" lit="#2F5E4A" dx={-5} dy={7} />
          <Pine at="5%" bottom="66%" size="h-10 w-6" fill="#14201A" />
          <Pine at="10%" bottom="67%" size="h-7 w-[17px]" fill="#14201A" />
        </div>
        {/* The bank of mist you go through (opacity and position set on scroll). */}
        <div ref={mistRef} className="pointer-events-none absolute inset-x-0 top-[50%] h-[50%] opacity-0 will-change-transform">
          <div className="absolute inset-x-0 top-0 h-[36%] overflow-hidden">
            <div className="canyon-band canyon-drift-slow inset-y-0 bg-[rgba(251,250,247,0.85)]" style={MIST} />
          </div>
          <div className="absolute inset-x-0 top-[40%] h-[28%] overflow-hidden">
            <div className="canyon-band canyon-drift inset-y-0 bg-[rgba(251,250,247,0.7)]" style={MIST} />
          </div>
        </div>
        {/* Clouds that rise at the end, into the FAQ's cloud ground. */}
        <div ref={cloudRef} className="absolute inset-x-0 bottom-0 h-[22%] translate-y-full will-change-transform">
          <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" focusable="false">
            <path d={CLOUD_BACK} fill="#EAF0EC" />
            <path d={CLOUD_FRONT} fill="#FBFAF7" />
          </svg>
        </div>
        {/* The cloud ground the FAQ stands on. */}
        <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-10 w-full" focusable="false">
          <path d={RIM_PATH} fill="#FBFAF7" />
        </svg>
      </div>
      {/* The top edge: waves from the insurance block, at the top of the
          section (not the stage), so they scroll away under the navbar. */}
      <svg
        viewBox="0 0 400 40"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-14 w-full sm:h-16"
        focusable="false"
      >
        <path d={TOP_BACK} fill="#E0ECE4" />
        <path d={TOP_FRONT} fill="#E8F1EA" />
      </svg>
    </div>
  );
};

export default CanyonPassage;
