import { describe, expect, it } from "vitest";
import {
  chunkPageText,
  extractNpsPage,
  LIVE_MAX_AGE_DAYS,
  NPS_PAGES,
  shortDateEs,
  sourceUuid,
} from "@shared/nps-pages";
import {
  buildCardCandidates,
  detectSafetyTopics,
  EMERGENCY_LINE,
  formatSafetyCards,
  safetyFallback,
} from "@shared/safety-cards";
import { evaluateExpression, questionNumbers, runCalculate } from "@shared/concierge-calc";

const PAGE = `<html><body><nav>Menu Skip</nav>
<h1 class="page-title">Fees &amp; Passes</h1>
<p>Entrance fees are valid for 7 days.</p>
<div class="Fee"><h3>Private Vehicle</h3><div class="Fee__Cost">$12.00</div><p>Admits one car.</p></div>
<p>Last updated: March 1, 2026</p>
<footer>Footer links</footer></body></html>`;

describe("nps-pages", () => {
  it("extracts the main column only, with fee amounts", () => {
    const page = extractNpsPage(PAGE);
    expect(page.title).toBe("Fees & Passes");
    expect(page.text).toContain("Entrance fees are valid for 7 days.");
    expect(page.text).toMatch(/Private Vehicle\s*— \$12\.00/);
    expect(page.text).not.toContain("Footer links");
    expect(page.text).not.toContain("Menu Skip");
  });

  it("chunks long text with overlap and bounded size", () => {
    const text = Array.from({ length: 200 }, (_, i) => `Sentence number ${i} about trails.`).join("\n");
    const chunks = chunkPageText(text, 800, 100);
    expect(chunks.length).toBeGreaterThan(3);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(900);
  });

  it("registry only points at nps.gov and tags every page", () => {
    for (const p of NPS_PAGES) {
      expect(p.url).toMatch(/^https:\/\/www\.nps\.gov\//);
      expect(["evergreen", "live", "safety"]).toContain(p.kind);
    }
    expect(LIVE_MAX_AGE_DAYS).toBe(7);
  });

  it("derives stable uuids and short Spanish dates", async () => {
    const a = await sourceUuid("https://www.nps.gov/xxxx/index.htm");
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(await sourceUuid("https://www.nps.gov/xxxx/index.htm")).toBe(a);
    expect(shortDateEs("2026-10-05T18:00:00Z")).toBe("5 oct 2026");
    expect(shortDateEs("2026-10-06T02:55:00Z")).toBe("5 oct 2026");
    expect(shortDateEs(null)).toBe("");
  });
});

describe("safety-cards", () => {
  const pages = [{
    url: "https://www.nps.gov/xxxx/planyourvisit/safety.htm",
    title: "Safety",
    kind: "safety",
    text: [
      "Stay hydrated: Carry at least a gallon of water per person each day and drink often.",
      "Rivers here are swift and cold; drowning is a leading cause of death. Stay out of the water near rapids.",
      "If you have an emergency, call or text 911. Cell service is limited in much of the park.",
    ].join("\n"),
  }];

  it("picks verbatim NPS paragraphs per topic", () => {
    const cards = buildCardCandidates(pages);
    const byTopic = new Map(cards.map((c) => [c.topic, c.verbatim]));
    expect(byTopic.get("water")).toContain("gallon of water per person");
    expect(byTopic.get("drowning")).toContain("drowning");
    expect(byTopic.get("emergency")).toContain("911");
    for (const c of cards) expect(pages[0].text).toContain(c.verbatim);
  });

  it("detects Spanish safety intent", () => {
    expect(detectSafetyTopics("¿Cuánta agua debo llevar?")).toContain("water");
    expect(detectSafetyTopics("¿Es peligroso meterse al río?")).toContain("drowning");
    expect(detectSafetyTopics("¿Hay humo por incendios?")).toContain("smoke");
    expect(detectSafetyTopics("Quiero hacer una caminata larga", ["deva"])).toContain("heat");
    expect(detectSafetyTopics("¿Cuánto cuesta la entrada?")).toEqual([]);
  });

  it("formats cards with official page and fetch date, and falls back to 911", () => {
    const text = formatSafetyCards([{
      id: "1", park_code: "xxxx", topic: "water", es: "Lleva agua.", verbatim: "Carry water.",
      source_url: "https://www.nps.gov/xxxx/planyourvisit/safety.htm", fetched_at: "2026-10-05T18:00:00Z", park_name: "Test Park",
    }]);
    expect(text).toContain("“Carry water.”");
    expect(text).toContain("consultada 5 oct 2026");
    expect(text).not.toMatch(/\nFuente:/);
    expect(safetyFallback(null)).toContain(EMERGENCY_LINE);
    expect(safetyFallback(null)).toContain("nps.gov");
  });
});

describe("concierge-calc", () => {
  it("evaluates arithmetic with precedence", () => {
    expect(evaluateExpression("(7 + 5) * 3").value).toBe(36);
    expect(evaluateExpression("10 - 4 / 2").value).toBe(8);
    expect(() => evaluateExpression("2 ** 3")).toThrow();
  });

  it("reads Spanish counts from the question", () => {
    const n = questionNumbers("Tres amigos y dos niños");
    expect(n.has("3")).toBe(true);
    expect(n.has("2")).toBe(true);
  });

  it("only computes with grounded operands", () => {
    expect(runCalculate(JSON.stringify({ expression: "(7 + 5) * 3" }), "Base $7. Surcharge $5.", "tres personas"))
      .toBe("CÁLCULO: (7 + 5) × 3 = 36");
    expect(runCalculate(JSON.stringify({ expression: "7 * 9" }), "Base $7.", "dos personas")).toMatch(/^ERROR DE CÁLCULO/);
  });
});
