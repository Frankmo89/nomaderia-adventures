import { describe, expect, it } from "vitest";
import { detectRuleIntents, diversifyChunks, pickRuleChunks, RULE_INTENTS, sourceKey } from "@shared/retrieval-rules";

type C = { id: string; similarity: number; source_table: string; content: string; metadata: { source_url?: string; slug?: string; park_code?: string } };
const nps = (id: string, sim: number, url: string, content = "text"): C => ({ id, similarity: sim, source_table: "nps_pages", content, metadata: { source_url: url, park_code: "xxxx" } });
const guide = (id: string, sim: number, slug: string): C => ({ id, similarity: sim, source_table: "destinations", content: "guía", metadata: { slug } });

describe("diversifyChunks", () => {
  it("keeps at most 2 chunks per source_url and refills from the rest", () => {
    const pool = [
      nps("a1", 0.9, "https://www.nps.gov/xxxx/a.htm"), nps("a2", 0.89, "https://www.nps.gov/xxxx/a.htm"),
      nps("a3", 0.88, "https://www.nps.gov/xxxx/a.htm"), nps("a4", 0.87, "https://www.nps.gov/xxxx/a.htm"),
      guide("g1", 0.86, "xxxx-guide"), guide("g2", 0.85, "xxxx-guide"), guide("g3", 0.84, "xxxx-guide"),
      nps("b1", 0.6, "https://www.nps.gov/xxxx/b.htm"), nps("c1", 0.5, "https://www.nps.gov/xxxx/c.htm"),
    ];
    const out = diversifyChunks(pool, 8);
    expect(out.map((c) => c.id)).toEqual(["a1", "a2", "g1", "g2", "b1", "c1"]);
    const perKey = new Map<string, number>();
    for (const c of out) perKey.set(sourceKey(c), (perKey.get(sourceKey(c)) ?? 0) + 1);
    expect(Math.max(...perKey.values())).toBeLessThanOrEqual(2);
  });
  it("puts pinned chunks first, still under the per-source cap and the limit", () => {
    const pool = Array.from({ length: 10 }, (_, i) => nps(`p${i}`, 0.9 - i * 0.01, `https://www.nps.gov/xxxx/p${i}.htm`));
    const rule = nps("r1", 0.45, "https://www.nps.gov/xxxx/camping.htm");
    const out = diversifyChunks(pool, 8, 2, [rule]);
    expect(out).toHaveLength(8);
    expect(out[0].id).toBe("r1");
  });
});

describe("rule intents", () => {
  it("detects overnight, closures and permits in fresh questions", () => {
    expect(detectRuleIntents("¿Me puedo quedar durmiendo en la camioneta en el estacionamiento del parque xxxx?").map((r) => r.id)).toContain("overnight");
    expect(detectRuleIntents("¿Está abierto el camino al mirador xxxx esta semana?").map((r) => r.id)).toContain("closures");
    expect(detectRuleIntents("¿Necesito permiso para subir al pico xxxx en un día?").map((r) => r.id)).toContain("permits");
    expect(detectRuleIntents("¿Qué sendero fácil hay para ver atardecer?")).toEqual([]);
  });
  it("only pins a chunk whose text states the rule", () => {
    const overnight = RULE_INTENTS.find((r) => r.id === "overnight")!;
    const results = [
      nps("x1", 0.7, "https://www.nps.gov/xxxx/a.htm", "Visitor centers and shuttle schedule."),
      nps("x2", 0.55, "https://www.nps.gov/xxxx/camping.htm", "Sleeping in a vehicle is only permitted in a campsite you reserved."),
    ];
    expect(pickRuleChunks(overnight, results, 0.4).map((c) => c.id)).toEqual(["x2"]);
    expect(pickRuleChunks(overnight, [results[0]], 0.4)).toEqual([]);
  });
});

describe("fire restrictions intent", () => {
  it("detects campfire questions", () => {
    expect(detectRuleIntents("¿Se puede prender una fogata con leña en el campamento xxxx?").map((r) => r.id)).toContain("fires");
  });
});
