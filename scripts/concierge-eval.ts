/**
 * Offline eval of the pre-purchase concierge gates.
 *
 * Runs the 30 first-timer questions in docs/concierge-eval.md against the
 * number / safety / scope guards. Does not call OpenAI. A live pass needs
 * the deployed function plus OPENAI_API_KEY; this environment does not
 * claim that pass.
 *
 *   npx tsx scripts/concierge-eval.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { CONCIERGE_EVAL_QUESTIONS } from "../src/lib/concierge-eval-questions.ts";
import { runOfflineEval } from "../src/lib/concierge-eval-run.ts";

const root = resolve(import.meta.dirname, "..");
const doc = readFileSync(resolve(root, "docs/concierge-eval.md"), "utf8");
const missing = CONCIERGE_EVAL_QUESTIONS.filter((q) => !doc.includes(q.question));
if (missing.length) {
  console.error("docs/concierge-eval.md no incluye estas preguntas:");
  for (const q of missing) console.error(`- ${q.id} ${q.question}`);
  process.exit(1);
}

const report = runOfflineEval();
const pct = Math.round(report.passRate * 100);
console.log(`concierge offline eval: ${report.passed}/${report.total} (${pct}%)`);
if (report.failures.length) {
  console.log("\nFallos:");
  for (const f of report.failures) {
    console.log(`- ${f.id} ${f.question}`);
    for (const r of f.reasons) console.log(`    ${r}`);
  }
}
if (report.numberLeaks.length) {
  console.log("\nCifras inventadas que NO se bloquearon:");
  for (const leak of report.numberLeaks) console.log(`- ${leak.id}`);
}
console.log("\nLive LLM: no corrido. Falta la función desplegada con estas reglas y OPENAI_API_KEY en este entorno.");
process.exit(report.failures.length ? 1 : 0);
