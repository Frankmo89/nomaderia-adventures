// Guards the content-driven ingest (migration 20260926120000): the trigger that
// bumps destinations.content_version must watch exactly the columns
// ingest-knowledge reads. A field added to the ingest but not the trigger
// would never be re-embedded after an edit — silently.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

const ingestSource = read("supabase/functions/ingest-knowledge/index.ts");
const migration = read("supabase/migrations/20260926120000_knowledge_ingest_content_triggers.sql");

const splitColumns = (list: string) =>
  list.split(",").map((c) => c.trim()).filter(Boolean);

function ingestDestinationColumns(): string[] {
  const block = ingestSource.match(/const baseSelect = \[([\s\S]*?)\]\.join/);
  if (!block) throw new Error("baseSelect not found in ingest-knowledge/index.ts");
  const literals = [...block[1].matchAll(/"([^"]*)"/g)].map((m) => m[1]);
  // id is the row key, not content.
  return splitColumns(literals.join(",")).filter((c) => c !== "id");
}

function ingestCampgroundColumns(): string[] {
  const m = ingestSource.match(/\.from\("campgrounds"\)\s*\.select\("([^"]+)"\)/);
  if (!m) throw new Error('campgrounds select not found in ingest-knowledge/index.ts');
  return splitColumns(m[1]);
}

function triggerColumns(marker: string): { old: string[]; new: string[] } {
  const m = migration.match(new RegExp(`-- ${marker}:start([\\s\\S]*?)-- ${marker}:end`));
  if (!m) throw new Error(`${marker} markers not found in migration`);
  return {
    old: [...m[1].matchAll(/OLD\.(\w+)/g)].map((x) => x[1]),
    new: [...m[1].matchAll(/NEW\.(\w+)/g)].map((x) => x[1]),
  };
}

const sorted = (xs: string[]) => [...xs].sort();

describe("knowledge ingest trigger columns match ingest-knowledge", () => {
  it("destinations: OLD and NEW row lists are identical and in the same order", () => {
    const cols = triggerColumns("ingested-columns");
    expect(cols.new).toEqual(cols.old);
  });

  it("destinations: trigger watches exactly the columns ingest-knowledge selects", () => {
    expect(sorted(triggerColumns("ingested-columns").old)).toEqual(sorted(ingestDestinationColumns()));
  });

  it("campgrounds: OLD and NEW row lists are identical and in the same order", () => {
    const cols = triggerColumns("campground-columns");
    expect(cols.new).toEqual(cols.old);
  });

  it("campgrounds: trigger watches exactly the columns ingest-knowledge selects", () => {
    expect(sorted(triggerColumns("campground-columns").old)).toEqual(sorted(ingestCampgroundColumns()));
  });
});
