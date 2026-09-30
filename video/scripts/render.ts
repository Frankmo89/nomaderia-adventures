/**
 * Usage (from video/): npm run render -- C01-09
 * Writes out/<id>.mp4
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

// Ensure sample NPS clip is cached when referenced by relative path.
const script = JSON.parse(readFileSync(scriptPath, "utf8")) as {
  scenes?: { type?: string; src?: string }[];
};
const needsClip = (script.scenes ?? []).some(
  (s) =>
    s.type === "clip" &&
    typeof s.src === "string" &&
    s.src.includes("deva-BadwaterBasinBRoll"),
);
if (needsClip) {
  const clip = join(root, "public", "clips", "deva-BadwaterBasinBRoll_1280x720.mp4");
  if (!existsSync(clip)) {
    console.log("Sample NPS clip missing — running download-clips…");
    const dl = spawnSync("npx", ["tsx", "scripts/download-clips.ts"], {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (dl.status !== 0) process.exit(dl.status ?? 1);
  }
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
