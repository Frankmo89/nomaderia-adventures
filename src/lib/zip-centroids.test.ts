/**
 * ZIP → lat/lon against the real committed Census table (not a fixture), so a
 * bad regeneration of public/data/zcta-centroids-<year>.txt fails here.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readZipTableText, realZipTable } from "@/test/zcta-table";
import {
  ZCTA_TABLE_PATH,
  isIslandZip,
  isValidZipFormat,
  lookupZip,
  lookupZipIn,
  resetZipTableCacheForTests,
} from "./zip-centroids";

const table = realZipTable();

/** Asserts a lookup lands inside a lat/lon box. */
function expectInBox(zip: string, [latMin, latMax]: [number, number], [lonMin, lonMax]: [number, number]) {
  const c = lookupZipIn(table, zip);
  expect(c, zip).not.toBeNull();
  expect(c!.lat, `${zip} lat`).toBeGreaterThanOrEqual(latMin);
  expect(c!.lat, `${zip} lat`).toBeLessThanOrEqual(latMax);
  expect(c!.lon, `${zip} lon`).toBeGreaterThanOrEqual(lonMin);
  expect(c!.lon, `${zip} lon`).toBeLessThanOrEqual(lonMax);
  return c!;
}

describe("bundled ZCTA table", () => {
  it("has every ZCTA from the gazetteer", () => {
    expect(table.exact.size).toBeGreaterThan(33_000);
  });
});

describe("lookupZipIn — valid ZIPs", () => {
  it("places San Diego, Los Angeles and New York", () => {
    expect(expectInBox("92101", [32.6, 32.8], [-117.3, -117.1]).match).toBe("exact");
    expectInBox("90012", [34.0, 34.1], [-118.3, -118.2]);
    expectInBox("10001", [40.7, 40.8], [-74.0, -73.9]);
  });

  it("places Alaska edge ZIPs (Anchorage, Juneau — not road-connected, Utqiaġvik)", () => {
    expectInBox("99501", [61.1, 61.3], [-150.0, -149.7]);
    expectInBox("99801", [57.8, 58.9], [-135.2, -133.5]);
    expectInBox("99723", [70.9, 71.5], [-157.5, -155.5]);
  });

  it("places Hawaii edge ZIPs (Honolulu, Hilo) and American Samoa inside the 967 prefix", () => {
    expectInBox("96813", [21.2, 21.4], [-157.9, -157.7]);
    expectInBox("96720", [19.3, 19.9], [-155.3, -154.7]);
    // 96799 shares the 967 prefix with Hawaii but sits in the South Pacific.
    expectInBox("96799", [-14.6, -14.0], [-171.0, -169.4]);
  });

  it("falls back to the nearest ZCTA in the same prefix for PO-box-only ZIPs", () => {
    // 90009 is an LA PO-box ZIP with no ZCTA.
    expect(table.exact.has("90009")).toBe(false);
    const c = expectInBox("90009", [33.7, 34.3], [-118.7, -118.0]);
    expect(c.match).toBe("nearby");
  });
});

describe("lookupZipIn — invalid input", () => {
  it.each(["1234", "123456", "abcde", "9210a", "", " 92101", "92101 "])("rejects malformed %j", (zip) => {
    expect(lookupZipIn(table, zip)).toBeNull();
  });

  it("rejects well-formed ZIPs whose 3-digit prefix has no ZCTA at all", () => {
    expect(lookupZipIn(table, "00000")).toBeNull();
    expect(lookupZipIn(table, "00501")).toBeNull(); // IRS unique ZIP, prefix 005 has no ZCTA
  });
});

describe("lookupZip (fetches the static table on demand)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetZipTableCacheForTests();
  });

  it("fetches the table once, from our own origin, and resolves the same result", async () => {
    const fetchMock = vi.fn(async () => new Response(readZipTableText(), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(lookupZip("92101")).resolves.toEqual(lookupZipIn(table, "92101"));
    await expect(lookupZip("99501")).resolves.toEqual(lookupZipIn(table, "99501"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(ZCTA_TABLE_PATH);
  });

  it("never fetches for a malformed ZIP", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(lookupZip("abcde")).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects when the table can't load, and retries on the next call", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(new Response(readZipTableText(), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(lookupZip("92101")).rejects.toThrow(/503/);
    await expect(lookupZip("92101")).resolves.not.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("format + island helpers", () => {
  it("validates 5-digit format only", () => {
    expect(isValidZipFormat("02134")).toBe(true);
    expect(isValidZipFormat("2134")).toBe(false);
  });

  it("flags Hawaii and territories as islands, never Alaska or the mainland", () => {
    for (const zip of ["96813", "96720", "96799", "00601", "00802", "96910"]) expect(isIslandZip(zip), zip).toBe(true);
    for (const zip of ["99501", "99801", "92101", "10001", "04609"]) expect(isIslandZip(zip), zip).toBe(false);
  });
});
