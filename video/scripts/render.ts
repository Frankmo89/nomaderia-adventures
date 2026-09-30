/**
 * Usage (from video/): npm run render -- C01-09
 * Writes out/<id>.mp4
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { assertImageScenes } from "../src/imageFormat";

const id = process.argv[2];
if (!id) {
  console.error("Usage: npm run render -- <script-id>");
  console.error("Example: npm run render -- C01-09");
  process.exit(1);
}

const root = process.cwd();
const scriptPath = join(root, "scripts", `${id}.json`);
if (!existsSync(scriptPath)) {
  console.error(`Script not found: ${scriptPath}`);
  process.exit(1);
}

const script = JSON.parse(readFileSync(scriptPath, "utf8")) as {
  scenes?: { type?: string; src?: string }[];
};

try {
  assertImageScenes(script.scenes ?? []);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

const missingLocal = (script.scenes ?? []).some((s) => {
  if ((s.type !== "clip" && s.type !== "image") || typeof s.src !== "string") return false;
  if (/^https?:\/\//i.test(s.src)) return false;
  const rel = s.src.replace(/^\.?\//, "").split("?")[0]?.split("#")[0] ?? s.src;
  return !existsSync(join(root, "public", rel));
});
if (missingLocal) {
  console.log("Local media missing — running download-clips…");
  const dl = spawnSync("npx", ["tsx", "scripts/download-clips.ts", id], {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (dl.status !== 0) process.exit(dl.status ?? 1);
}

mkdirSync(join(root, "out"), { recursive: true });
const outPath = join(root, "out", `${id}.mp4`);

const browser =
  process.env.REMOTION_BROWSER ||
  (existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined);

const args = [
  "remotion",
  "render",
  "src/index.ts",
  "Reel",
  outPath,
  `--props=${scriptPath}`,
];
if (browser) {
  args.push(`--browser-executable=${browser}`);
}

console.log(`Rendering ${id} → ${outPath}`);
const result = spawnSync("npx", args, {
  cwd: root,
  stdio: "inherit",
  shell: process.platform === "win32",
  env: { ...process.env, REMOTION_BROWSER: browser ?? "" },
});
process.exit(result.status ?? 1);
