// Vendors the US parks ranking engine from Frankmo89/us-parks-recommender.
//
// Nothing here is typed by hand: the script downloads the upstream files at a
// pinned commit, writes them (plus a generated .ts wrapper for the JSON so
// both Vite and Deno import it identically), and records provenance + sha256
// in engine.lock.json. Same convention as scripts/build-soul.ts.
//
//   npm run sync:engine -- --to <full-commit-sha>   # move the pin, rewrite vendored files + lock
//   npm run sync:engine                             # re-sync at the pinned sha (idempotent)
//   npm run verify:engine                           # re-fetch at the pinned sha, fail on any drift
//   npm run check:engine-upstream                   # compare pin vs upstream main; exit 2 if newer
//
// Requires network (public GitHub raw URLs, no auth). Set GITHUB_TOKEN to lift
// the anonymous API rate limit in --check-upstream mode.

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const UPSTREAM_REPO = "Frankmo89/us-parks-recommender";
const UPSTREAM_BRANCH = "main";

const VENDOR_DIR = "supabase/functions/_shared/engine";
const FIXTURES_DIR = "src/lib/engine/__fixtures__";
const LOCK_PATH = `${VENDOR_DIR}/engine.lock.json`;

/** Upstream path → vendored path. `transform` turns the bytes into what we commit. */
const FILES = [
  {
    source: "ts/src/engine.ts",
    target: `${VENDOR_DIR}/engine.ts`,
    transform: (bytes: Buffer) => bytes,
  },
  {
    source: "web/engine_data.json",
    target: `${VENDOR_DIR}/engine-data.generated.ts`,
    transform: (bytes: Buffer, sha: string) => Buffer.from(renderEngineDataTs(bytes, sha), "utf8"),
  },
  {
    source: "data/engine_fixtures.json",
    target: `${FIXTURES_DIR}/engine_fixtures.json`,
    transform: (bytes: Buffer) => bytes,
  },
] as const;

interface LockFile {
  upstream_repo: string;
  upstream_commit: string;
  engine_version: string;
  content_hash: string;
  synced_at: string;
  files: Record<string, { source: string; source_sha256: string; sha256: string }>;
}

interface EngineDataHead {
  engine_version: string;
  content_hash: string;
  catalog: unknown[];
}

function die(msg: string, code = 1): never {
  console.error(`[sync-engine] ERROR: ${msg}`);
  process.exit(code);
}

function sha256(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

async function fetchRaw(sha: string, path: string): Promise<Buffer> {
  const url = `https://raw.githubusercontent.com/${UPSTREAM_REPO}/${sha}/${path}`;
  const res = await fetch(url);
  if (!res.ok) die(`GET ${url} → ${res.status} ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}

async function resolveUpstreamHead(): Promise<string> {
  const url = `https://api.github.com/repos/${UPSTREAM_REPO}/commits/${UPSTREAM_BRANCH}`;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (!res.ok) die(`GET ${url} → ${res.status} ${res.statusText}`);
  const json = (await res.json()) as { sha?: string };
  if (!json.sha) die(`Could not resolve ${UPSTREAM_REPO}@${UPSTREAM_BRANCH}`);
  return json.sha;
}

function parseEngineData(bytes: Buffer, label: string): EngineDataHead {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch (e) {
    return die(`${label} is not valid JSON: ${e instanceof Error ? e.message : String(e)}`);
  }
  const d = parsed as Partial<EngineDataHead>;
  if (typeof d.engine_version !== "string" || !/^\d+\.\d+\.\d+$/.test(d.engine_version)) {
    die(`${label}: engine_version missing or not semver`);
  }
  if (typeof d.content_hash !== "string" || !/^[0-9a-f]{64}$/.test(d.content_hash)) {
    die(`${label}: content_hash missing or not sha256 hex`);
  }
  if (!Array.isArray(d.catalog) || d.catalog.length === 0) {
    die(`${label}: catalog missing or empty`);
  }
  return d as EngineDataHead;
}

function renderEngineDataTs(jsonBytes: Buffer, sha: string): string {
  const data = JSON.parse(jsonBytes.toString("utf8")) as EngineDataHead;
  return (
    `// AUTO-GENERATED from web/engine_data.json (${UPSTREAM_REPO} @ ${sha}) by scripts/sync-engine.ts — DO NOT EDIT BY HAND.\n` +
    `// engine_version ${data.engine_version} · content_hash ${data.content_hash}\n` +
    `// Re-sync: npm run sync:engine\n\n` +
    `import type { EngineData } from "./engine.ts";\n\n` +
    `export const ENGINE_DATA: EngineData = ${JSON.stringify(data, null, 2)};\n`
  );
}

function readLock(): LockFile | null {
  const p = join(ROOT, LOCK_PATH);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf8")) as LockFile;
}

interface Built {
  lock: LockFile;
  outputs: Map<string, Buffer>;
}

async function build(sha: string): Promise<Built> {
  if (!/^[0-9a-f]{40}$/.test(sha)) die(`Pin must be a full 40-char commit sha, got "${sha}"`);
  const outputs = new Map<string, Buffer>();
  const files: LockFile["files"] = {};
  let head: EngineDataHead | null = null;

  for (const f of FILES) {
    const src = await fetchRaw(sha, f.source);
    if (f.source === "web/engine_data.json") head = parseEngineData(src, f.source);
    const out = f.transform(src, sha);
    outputs.set(f.target, out);
    files[f.target] = { source: f.source, source_sha256: sha256(src), sha256: sha256(out) };
  }
  if (!head) die("engine_data.json was not fetched");

  const lock: LockFile = {
    upstream_repo: UPSTREAM_REPO,
    upstream_commit: sha,
    engine_version: head.engine_version,
    content_hash: head.content_hash,
    synced_at: new Date().toISOString(),
    files,
  };
  return { lock, outputs };
}

function writeBuilt(built: Built): void {
  for (const [target, bytes] of built.outputs) {
    const abs = join(ROOT, target);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, bytes);
    console.log(`[sync-engine] Written: ${target}`);
  }
  writeFileSync(join(ROOT, LOCK_PATH), JSON.stringify(built.lock, null, 2) + "\n", "utf8");
  console.log(`[sync-engine] Written: ${LOCK_PATH}`);
  console.log(
    `[sync-engine] Done — ${UPSTREAM_REPO}@${built.lock.upstream_commit.slice(0, 7)} ` +
      `engine_version=${built.lock.engine_version} content_hash=${built.lock.content_hash.slice(0, 12)}…`,
  );
}

/** Re-fetch at the pinned sha and compare byte-for-byte with what is committed. */
async function verify(lock: LockFile): Promise<void> {
  const built = await build(lock.upstream_commit);
  const problems: string[] = [];

  if (built.lock.engine_version !== lock.engine_version) {
    problems.push(`lock engine_version=${lock.engine_version} but upstream@pin has ${built.lock.engine_version}`);
  }
  if (built.lock.content_hash !== lock.content_hash) {
    problems.push(`lock content_hash=${lock.content_hash} but upstream@pin has ${built.lock.content_hash}`);
  }
  for (const [target, bytes] of built.outputs) {
    const abs = join(ROOT, target);
    if (!existsSync(abs)) {
      problems.push(`${target} is missing`);
      continue;
    }
    const committed = readFileSync(abs);
    if (!committed.equals(bytes)) problems.push(`${target} differs from upstream@pin (hand-edited or stale)`);
    const rec = lock.files[target];
    if (!rec) problems.push(`${target} has no entry in ${LOCK_PATH}`);
    else if (rec.sha256 !== sha256(committed)) problems.push(`${target} sha256 does not match ${LOCK_PATH}`);
  }

  if (problems.length > 0) {
    for (const p of problems) console.error(`[sync-engine] DRIFT: ${p}`);
    die("vendored engine drifted from its pin — run `npm run sync:engine` and commit, or fix the lock");
  }
  console.log(
    `[sync-engine] OK — vendored engine matches ${UPSTREAM_REPO}@${lock.upstream_commit.slice(0, 7)} ` +
      `(engine_version ${lock.engine_version})`,
  );
}

/** Compare the pin against upstream main. Exit 2 when upstream moved in a way that matters. */
async function checkUpstream(lock: LockFile): Promise<void> {
  const headSha = await resolveUpstreamHead();
  const dataBytes = await fetchRaw(headSha, "web/engine_data.json");
  const head = parseEngineData(dataBytes, `web/engine_data.json@${headSha.slice(0, 7)}`);
  const engineTs = await fetchRaw(headSha, "ts/src/engine.ts");
  const fixtures = await fetchRaw(headSha, "data/engine_fixtures.json");

  const pinnedEngineTs = lock.files[`${VENDOR_DIR}/engine.ts`]?.source_sha256;
  const pinnedFixtures = lock.files[`${FIXTURES_DIR}/engine_fixtures.json`]?.source_sha256;

  const changes: string[] = [];
  if (head.engine_version !== lock.engine_version) {
    changes.push(`engine_version ${lock.engine_version} → ${head.engine_version}`);
  }
  if (head.content_hash !== lock.content_hash) {
    changes.push(`content_hash ${lock.content_hash.slice(0, 12)}… → ${head.content_hash.slice(0, 12)}… (parks.csv changed)`);
  }
  if (pinnedEngineTs && sha256(engineTs) !== pinnedEngineTs) changes.push("ts/src/engine.ts changed");
  if (pinnedFixtures && sha256(fixtures) !== pinnedFixtures) changes.push("data/engine_fixtures.json changed");

  const report = {
    upstream_repo: UPSTREAM_REPO,
    pinned_commit: lock.upstream_commit,
    pinned_engine_version: lock.engine_version,
    upstream_commit: headSha,
    upstream_engine_version: head.engine_version,
    changes,
    compare_url: `https://github.com/${UPSTREAM_REPO}/compare/${lock.upstream_commit}...${headSha}`,
    sync_command: `npm run sync:engine -- --to ${headSha}`,
  };

  if (process.env.GITHUB_OUTPUT) {
    writeFileSync(
      process.env.GITHUB_OUTPUT,
      `changed=${changes.length > 0}\nreport<<EOF\n${JSON.stringify(report, null, 2)}\nEOF\n`,
      { flag: "a" },
    );
  }

  console.log(JSON.stringify(report, null, 2));
  if (changes.length > 0) {
    console.error(`[sync-engine] upstream moved: ${changes.join("; ")}`);
    process.exit(2);
  }
  console.log(`[sync-engine] pin is current with ${UPSTREAM_REPO}@${UPSTREAM_BRANCH}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const lock = readLock();

  if (args.includes("--verify")) {
    if (!lock) die(`${LOCK_PATH} not found — run \`npm run sync:engine -- --to <sha>\` first`);
    await verify(lock);
    return;
  }

  if (args.includes("--check-upstream")) {
    if (!lock) die(`${LOCK_PATH} not found — nothing to compare against`);
    await checkUpstream(lock);
    return;
  }

  const toIdx = args.indexOf("--to");
  const sha = toIdx >= 0 ? args[toIdx + 1] : lock?.upstream_commit;
  if (!sha) die("No pin: pass `--to <full-commit-sha>` (no lock file exists yet)");
  writeBuilt(await build(sha));
}

main().catch((e: unknown) => die(e instanceof Error ? e.message : String(e)));
