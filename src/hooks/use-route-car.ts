import { useEffect, useState, type RefObject } from "react";

/**
 * The car on the home's park route (ADR-051). It drives along the dashed
 * route and leaves a solid trail behind it:
 *  - Phones: driven by the sideways swipe. It reaches each stop exactly when
 *    that stop's card snaps into place, and turns around when you swipe back.
 *  - lg+: driven by the page scroll, from the origin to the last stop while
 *    the route crosses the upper part of the screen.
 * Stops are the elements marked `data-route-node` inside the track (hidden
 * ones are skipped). One rAF write per frame; positions are re-measured when
 * the track resizes. The hook returns the stop nearest the car and whether
 * the car is parked on it, so the section can light that stop up.
 */

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/**
 * Car x (track px) for a sideways scroll. Each stop is "reached" at the
 * scroll that brings it under the spot where the first stop starts
 * (`anchor`), clamped to the scroll range; in between the car moves
 * linearly.
 */
export function carOnRoute(nodes: readonly number[], anchor: number, scroll: number, maxScroll: number): number {
  if (nodes.length === 0) return 0;
  const reachAt = nodes.map((x) => clamp(x - anchor, 0, Math.max(maxScroll, 0)));
  if (scroll <= reachAt[0]) return nodes[0];
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = reachAt[i];
    const b = reachAt[i + 1];
    if (scroll <= b) {
      if (b <= a) return nodes[i + 1];
      return nodes[i] + ((nodes[i + 1] - nodes[i]) * (scroll - a)) / (b - a);
    }
  }
  return nodes[nodes.length - 1];
}

/** Index of the stop nearest x. */
export function nearestStop(nodes: readonly number[], x: number): number {
  let best = 0;
  for (let i = 1; i < nodes.length; i++) if (Math.abs(nodes[i] - x) < Math.abs(nodes[best] - x)) best = i;
  return best;
}

export interface RouteCarState {
  /** Stop nearest the car (0 = origin). */
  stop: number;
  /** True when the car is parked on that stop. */
  parked: boolean;
}

interface Refs {
  track: RefObject<HTMLElement>;
  scroller: RefObject<HTMLElement>;
  car: RefObject<HTMLElement>;
  /** Inner element that flips to face the way the car is going. */
  carBody: RefObject<HTMLElement>;
  trail: RefObject<HTMLElement>;
}

const PARKED_PX = 8;

/** `routeKey` changes whenever the stops change (data loaded, new origin). */
export function useRouteCar(refs: Refs, routeKey: string): RouteCarState {
  const [state, setState] = useState<RouteCarState>({ stop: 0, parked: true });

  useEffect(() => {
    const track = refs.track.current;
    const scroller = refs.scroller.current;
    const car = refs.car.current;
    const body = refs.carBody.current;
    const trail = refs.trail.current;
    if (!track || !scroller || !car || !body || !trail) return;

    const desktop = window.matchMedia?.("(min-width: 1024px)");
    let nodes: number[] = [];
    let frame = 0;
    let lastX = Number.NaN;
    let idle = 0;
    let shown: RouteCarState = { stop: -1, parked: false };

    const measure = () => {
      const box = track.getBoundingClientRect();
      nodes = Array.from(track.querySelectorAll<HTMLElement>("[data-route-node]"))
        .map((n) => n.getBoundingClientRect())
        .filter((r) => r.width > 0)
        .map((r) => r.left - box.left + r.width / 2);
      if (nodes.length > 1) {
        trail.style.left = `${nodes[0]}px`;
        trail.style.width = `${nodes[nodes.length - 1] - nodes[0]}px`;
      }
    };

    const position = () => {
      if (desktop?.matches) {
        const vh = window.innerHeight || 1;
        const top = track.getBoundingClientRect().top;
        const p = clamp((vh * 0.8 - top) / (vh * 0.45), 0, 1);
        return nodes[0] + (nodes[nodes.length - 1] - nodes[0]) * p;
      }
      return carOnRoute(nodes, nodes[0], scroller.scrollLeft, scroller.scrollWidth - scroller.clientWidth);
    };

    const write = () => {
      frame = 0;
      if (nodes.length < 2) return;
      const x = position();
      car.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
      trail.style.transform = `scaleX(${((x - nodes[0]) / (nodes[nodes.length - 1] - nodes[0])).toFixed(4)})`;

      if (!Number.isNaN(lastX) && Math.abs(x - lastX) > 0.5) {
        // Face the way it is going, and bob while it moves.
        body.style.transform = x < lastX ? "scaleX(-1)" : "";
        car.dataset.driving = "true";
        window.clearTimeout(idle);
        idle = window.setTimeout(() => delete car.dataset.driving, 180);
      }
      lastX = x;

      const stop = nearestStop(nodes, x);
      const parked = Math.abs(nodes[stop] - x) < PARKED_PX;
      if (stop !== shown.stop || parked !== shown.parked) {
        shown = { stop, parked };
        setState(shown);
      }
    };

    const onMove = () => {
      if (!frame) frame = window.requestAnimationFrame(write);
    };

    measure();
    write();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => (measure(), onMove())) : null;
    ro?.observe(track);
    scroller.addEventListener("scroll", onMove, { passive: true });
    window.addEventListener("scroll", onMove, { passive: true });
    window.addEventListener("resize", onMove, { passive: true });
    return () => {
      ro?.disconnect();
      scroller.removeEventListener("scroll", onMove);
      window.removeEventListener("scroll", onMove);
      window.removeEventListener("resize", onMove);
      if (frame) window.cancelAnimationFrame(frame);
      window.clearTimeout(idle);
    };
    // refs are stable objects; routeKey says when the stops changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  return state;
}
