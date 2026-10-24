import { describe, expect, it } from "vitest";
import { carOnRoute, nearestStop } from "./use-route-car";

// Origin at 31 px; three parks; the last stop sits past the end of the scroll.
const NODES = [31, 83, 397, 711, 1036];
const MAX = 860;

describe("carOnRoute", () => {
  it("parks on the origin before any swipe", () => {
    expect(carOnRoute(NODES, 31, 0, MAX)).toBe(31);
  });

  it("reaches each park when it comes under the origin's spot", () => {
    expect(carOnRoute(NODES, 31, 83 - 31, MAX)).toBe(83);
    expect(carOnRoute(NODES, 31, 397 - 31, MAX)).toBe(397);
    expect(carOnRoute(NODES, 31, 711 - 31, MAX)).toBe(711);
  });

  it("moves in a straight line between two stops", () => {
    const halfway = (83 - 31 + (397 - 31)) / 2;
    expect(carOnRoute(NODES, 31, halfway, MAX)).toBeCloseTo((83 + 397) / 2);
  });

  it("reaches the last stop at the end of the scroll even if it never gets under the spot", () => {
    expect(carOnRoute(NODES, 31, MAX, MAX)).toBe(1036);
  });

  it("stays on the route when the scroll overshoots (iOS bounce)", () => {
    expect(carOnRoute(NODES, 31, -40, MAX)).toBe(31);
    expect(carOnRoute(NODES, 31, MAX + 40, MAX)).toBe(1036);
  });
});

describe("nearestStop", () => {
  it("finds the closest stop", () => {
    expect(nearestStop(NODES, 30)).toBe(0);
    expect(nearestStop(NODES, 300)).toBe(2);
    expect(nearestStop(NODES, 2000)).toBe(4);
  });
});
