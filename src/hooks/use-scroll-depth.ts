import { useEffect, type RefObject } from "react";

/**
 * Scroll depth (parallax) for layered scenes: the home hero's mountains
 * (ADR-049), the promise forest (ADR-050), the canyon (ADR-052) and the night
 * camp (ADR-053). Each layer gets a CSS transform
 * computed from how far its section has crossed the screen. One passive
 * scroll listener, one transform write per layer per frame, nothing written
 * while the section is off screen. Plain JS (no Framer Motion), so it runs on
 * every iPhone and never holds up first paint.
 */

export interface ScrollDepth {
  /** Px the section has scrolled into view: 0 when its top meets the bottom of the screen. */
  entered: number;
  /** 0 → 1 while the section crosses the screen (its top at the bottom → its bottom at the top). */
  progress: number;
  /** Screen height in px. */
  viewport: number;
  /** The section's own height in px. */
  height: number;
}

export interface DepthLayer {
  ref: RefObject<HTMLElement>;
  transform: (depth: ScrollDepth) => string;
}

/** Pure part, for tests: where a section stands given its box and the screen. */
export function scrollDepth(top: number, height: number, viewport: number): ScrollDepth {
  const entered = viewport - top;
  const span = viewport + height;
  const progress = span > 0 ? Math.min(Math.max(entered / span, 0), 1) : 0;
  return { entered, progress, viewport, height };
}

interface Options {
  /** Off when false (e.g. "reduce motion"). */
  enabled: boolean;
  /** Media query the effect is limited to; omit for every width. */
  media?: string;
  /** Called on each written frame, for effects that are not a transform (opacity, colour). */
  onFrame?: (depth: ScrollDepth) => void;
}

export function useScrollDepth(
  targetRef: RefObject<HTMLElement>,
  layers: readonly DepthLayer[],
  { enabled, media, onFrame }: Options,
): void {
  useEffect(() => {
    const query = media ? window.matchMedia?.(media) : null;
    if (media && !query) return;
    let frame = 0;
    let listening = false;

    const write = () => {
      frame = 0;
      const target = targetRef.current;
      if (!target) return;
      const vh = window.innerHeight || 1;
      const box = target.getBoundingClientRect();
      // Off screen (with a margin so layers settle at the edges): skip.
      if (box.bottom < -vh * 0.25 || box.top > vh * 1.25) return;
      const depth = scrollDepth(box.top, box.height, vh);
      for (const layer of layers) {
        const el = layer.ref.current;
        if (el) el.style.transform = layer.transform(depth);
      }
      onFrame?.(depth);
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(write);
    };
    const clear = () => {
      for (const layer of layers) if (layer.ref.current) layer.ref.current.style.transform = "";
    };
    const sync = () => {
      const on = enabled && (!query || query.matches);
      if (on && !listening) {
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        listening = true;
        write();
      } else if (!on && listening) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        listening = false;
        clear();
      }
    };

    sync();
    query?.addEventListener?.("change", sync);
    return () => {
      query?.removeEventListener?.("change", sync);
      if (listening) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
      if (frame) window.cancelAnimationFrame(frame);
      clear();
    };
  }, [targetRef, layers, enabled, media, onFrame]);
}
