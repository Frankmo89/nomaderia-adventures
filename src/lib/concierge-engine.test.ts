/**
 * Concierge ↔ engine glue (supabase/functions/_shared): the Spanish tool
 * output the LLM reads, the deterministic fallback, and the park-name matcher
 * behind the answer check (contract §6.1–§6.3).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { recommend, type TripProfile } from "@engine/engine";
import { ENGINE_DATA } from "@engine/engine-data.generated";
import {
  describeEmptyEs,
  describeResultEs,
  describeTiesEs,
  engineDataForParkCodes,
  fallbackAnswerEs,
  toRecommendationEs,
  type ParkDisplay,
} from "@shared/engine-es";
import { buildParkNameIndex, findParkMentions, findUnbackedParks } from "@shared/park-mentions";

const SITE = "https://nomaderia.com";

// Real published titles (destinations) for the parks these tests touch.
const TITLES: Record<string, string> = {
  gaar: "Parque Nacional y Reserva Gates of the Arctic",
  kova: "Parque Nacional Kobuk Valley",
  glac: "Parque Nacional Glacier",
  glba: "Parque Nacional y Reserva Glacier Bay",
  grca: "Parque Nacional del Gran Cañón",
  hale: "Parque Nacional Haleakalā",
  romo: "Parque Nacional Montañas Rocosas",
  sagu: "Parque Nacional Saguaro",
  jotr: "Parque Nacional Joshua Tree",
  yose: "Parque Nacional Yosemite",
  zion: "Parque Nacional Zion",
};
const displayByCode = new Map<string, ParkDisplay>(
  Object.entries(TITLES).map(([code, title]) => [code, { title, slug: `${code}-slug` }]),
);

const index = buildParkNameIndex([
  ...ENGINE_DATA.catalog.map((p) => ({ park_code: p.park_code, name: p.name })),
  ...Object.entries(TITLES).map(([park_code, name]) => ({ park_code, name })),
]);

type FixtureProfile = { id: string; profile: TripProfile; output: { tie_groups: string[][] } };
const fixtures = JSON.parse(
  readFileSync(resolve(__dirname, "engine/__fixtures__/engine_fixtures.json"), "utf8"),
) as { profiles: FixtureProfile[] };
const tieCase = fixtures.profiles.find((p) => p.id === "remote_alaska_backpack")!;

describe("describeResultEs (what the concierge LLM reads)", () => {
  const profile: TripProfile = { biomes: ["desert"], tags: ["hiking", "stargazing"], difficulty: "easy" };
  const result = recommend(engineDataForParkCodes(["jotr", "zion", "yose"]), profile, 3);
  const text = describeResultEs(result, profile, displayByCode, SITE);

  it("lists every returned park with its code, guide link and nps.gov link", () => {
    for (const p of result.parks) {
      expect(text).toContain(`[park_code: ${p.facts.park_code}]`);
      expect(text).toContain(TITLES[p.facts.park_code]);
      expect(text).toContain(`${SITE}/destinos/${p.facts.park_code}-slug`);
      expect(text).toContain(p.facts.nps_url);
    }
    expect(text).toContain("Solo puedes recomendar estos parques.");
  });

  it("never exposes raw scores or breakdown floats", () => {
    for (const p of result.parks) expect(text).not.toContain(String(p.score));
    expect(text).not.toMatch(/\b0\.\d{2,}/);
    expect(text).toContain("puntaje de ajuste, no probabilidad");
  });
});

describe("tie groups (§6.3)", () => {
  const result = recommend(ENGINE_DATA, tieCase.profile, 5);

  it("the fixture really produces the gaar/kova tie", () => {
    expect(result.tie_groups).toEqual(tieCase.output.tie_groups);
  });

  it("are stated as a close call, naming both parks", () => {
    const ties = describeTiesEs(result, displayByCode);
    expect(ties).toContain("EMPATE TÉCNICO");
    expect(ties).toContain(TITLES.gaar);
    expect(ties).toContain(TITLES.kova);
  });

  it("carry through to the fallback answer", () => {
    const answer = fallbackAnswerEs(result, tieCase.profile, displayByCode, SITE);
    expect(answer).toContain("prácticamente empatados");
  });
});

describe("describeEmptyEs (§3: ask which constraint to loosen)", () => {
  it("lists exactly the active hard filters", () => {
    const text = describeEmptyEs({
      biomes: [],
      tags: [],
      origin_lat: 32.72,
      origin_lon: -117.16,
      max_drive_hours: 2,
      allow_remote: false,
    });
    expect(text).toContain("máximo 2 h de manejo");
    expect(text).toContain("sin parques remotos");
    expect(text).not.toContain("permiso");
    expect(text).toContain("NO sugieras parques");
  });
});

describe("fallbackAnswerEs", () => {
  it("names only engine-returned parks, so it always passes the answer check", () => {
    for (const fx of fixtures.profiles) {
      const result = recommend(ENGINE_DATA, fx.profile, 5);
      if (result.empty) continue;
      const answer = fallbackAnswerEs(result, fx.profile, displayByCode, SITE);
      const allowed = new Set(result.parks.map((p) => p.facts.park_code));
      expect(findUnbackedParks(answer, [], allowed, index), fx.id).toEqual([]);
    }
  });
});

describe("toRecommendationEs", () => {
  it("builds the response card fields", () => {
    const profile: TripProfile = { biomes: ["desert"], tags: ["hiking"] };
    const park = recommend(engineDataForParkCodes(["jotr"]), profile, 1).parks[0];
    const rec = toRecommendationEs(park, profile, displayByCode, SITE);
    expect(rec).toMatchObject({
      park_code: "jotr",
      title: TITLES.jotr,
      url: `${SITE}/destinos/jotr-slug`,
      nps_url: park.facts.nps_url,
      match_percent: park.match_percent,
    });
    expect(rec.reasons_es.length).toBeGreaterThan(0);
  });
});

describe("park-mentions (answer check backstop)", () => {
  it("finds every catalog park by its full English name", () => {
    for (const p of ENGINE_DATA.catalog) {
      expect([...findParkMentions(`Te recomiendo ${p.name}.`, index)], p.park_code).toContain(p.park_code);
    }
  });

  it("matches Spanish titles and short names, ignoring accents and case", () => {
    expect(findParkMentions("Ve a haleakala al amanecer", index)).toEqual(new Set(["hale"]));
    expect(findParkMentions("El Parque Nacional del Gran Cañón es enorme", index)).toEqual(new Set(["grca"]));
    expect(findParkMentions("Zion o YOSEMITE", index)).toEqual(new Set(["zion", "yose"]));
  });

  it("counts Glacier Bay once, not also as Glacier", () => {
    expect(findParkMentions("Glacier Bay es de barco", index)).toEqual(new Set(["glba"]));
    expect(findParkMentions("Glacier y Glacier Bay", index)).toEqual(new Set(["glac", "glba"]));
  });

  it("ignores short names that are ordinary words unless the full park name is used", () => {
    expect(findParkMentions("Verás un cactus saguaro y un gran cañón", index).size).toBe(0);
    expect(findParkMentions("las Montañas Rocosas y un joshua tree", index).size).toBe(0);
    expect(findParkMentions("Parque Nacional Saguaro", index)).toEqual(new Set(["sagu"]));
    expect(findParkMentions("Rocky Mountain National Park", index)).toEqual(new Set(["romo"]));
  });

  it("findUnbackedParks flags declared or written parks outside the allowed set", () => {
    const allowed = new Set(["jotr"]);
    expect(findUnbackedParks("Joshua Tree es ideal.", ["jotr"], allowed, index)).toEqual([]);
    expect(findUnbackedParks("Joshua Tree o Zion.", ["jotr"], allowed, index)).toEqual(["zion"]);
    expect(findUnbackedParks("Joshua Tree.", ["jotr", "yose"], allowed, index)).toEqual(["yose"]);
    expect(findUnbackedParks("Joshua Tree.", ["not-a-park"], allowed, index)).toEqual([]);
  });
});
