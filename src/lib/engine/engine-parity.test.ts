/**
 * Parity: vendored `recommend()` vs the Python-pinned fixtures from upstream
 * (`data/engine_fixtures.json` @ the commit in engine.lock.json).
 *
 * Mirrors upstream `ts/src/engine.test.ts`. If this fails after
 * `npm run sync:engine`, the vendored engine and its fixtures are out of step —
 * do not edit the fixtures to make it pass.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { recommend, type TripProfile } from "@engine/engine";
import { ENGINE_DATA } from "@engine/engine-data.generated";

const TOL = 1e-6;

type FixturePark = {
  rank: number;
  score: number;
  match_percent: number;
  tied_with_neighbors: boolean;
  breakdown: {
    content: number;
    days: number;
    difficulty: number;
    budget: number;
    crowd_penalty: number;
    month_penalty: number;
    weighted: Record<"content" | "days" | "difficulty" | "budget" | "crowd_penalty" | "month_penalty", number>;
  };
  facts: { park_code: string; drive_hours: number | null };
};

type FixtureProfile = {
  id: string;
  profile: TripProfile;
  output: {
    engine_version: string;
    k: number;
    n_returned: number;
    empty: boolean;
    tie_groups: string[][];
    parks: FixturePark[];
  };
};

type FixtureBundle = {
  engine_version: string;
  k: number;
  profiles: FixtureProfile[];
};

// jsdom gives import.meta.url an http:// scheme, so resolve from the repo root (Vitest cwd).
const fixtures: FixtureBundle = JSON.parse(
  readFileSync(resolve(process.cwd(), "src/lib/engine/__fixtures__/engine_fixtures.json"), "utf8"),
);

const nearly = (a: number, b: number, tol = TOL) => Math.abs(a - b) <= tol;

describe("vendored engine parity with upstream Python fixtures", () => {
  it("fixture bundle has 26 profiles stamped with the vendored engine_version", () => {
    expect(fixtures.profiles).toHaveLength(26);
    expect(fixtures.engine_version).toBe(ENGINE_DATA.engine_version);
  });

  for (const item of fixtures.profiles) {
    it(`profile ${item.id}`, () => {
      const got = recommend(ENGINE_DATA, item.profile, item.output.k ?? fixtures.k);
      const expected = item.output;

      expect(got.engine_version).toBe(expected.engine_version);
      expect(got.n_returned).toBe(expected.n_returned);
      expect(got.empty).toBe(expected.empty);
      expect(got.tie_groups).toEqual(expected.tie_groups);
      expect(got.parks.map((p) => p.facts.park_code)).toEqual(expected.parks.map((p) => p.facts.park_code));

      for (let i = 0; i < expected.parks.length; i++) {
        const g = got.parks[i];
        const e = expected.parks[i];
        expect(g.rank).toBe(e.rank);
        expect(g.match_percent).toBe(e.match_percent);
        expect(g.tied_with_neighbors).toBe(e.tied_with_neighbors);
        expect(nearly(g.score, e.score), `score ${g.facts.park_code}`).toBe(true);

        for (const key of ["content", "days", "difficulty", "budget", "crowd_penalty", "month_penalty"] as const) {
          expect(nearly(g.breakdown[key], e.breakdown[key]), `breakdown.${key} ${g.facts.park_code}`).toBe(true);
          expect(
            nearly(g.breakdown.weighted[key], e.breakdown.weighted[key]),
            `weighted.${key} ${g.facts.park_code}`,
          ).toBe(true);
        }

        if (e.facts.drive_hours === null) {
          expect(g.facts.drive_hours).toBeNull();
        } else {
          expect(g.facts.drive_hours).not.toBeNull();
          // Fixtures store drive_hours rounded to 4 decimals; compare at that precision.
          const rounded = Math.round((g.facts.drive_hours as number) * 1e4) / 1e4;
          expect(nearly(rounded, e.facts.drive_hours), `drive_hours ${g.facts.park_code}`).toBe(true);
        }
      }
    });
  }
});
