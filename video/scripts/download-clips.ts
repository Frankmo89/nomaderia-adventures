/**
 * Caches media referenced by video/scripts/*.json.
 *
 * - NPS sample B-roll: downloaded by public URL (not Drive).
 * - Anything else missing under video/public/: by filename from Frank's
 *   Google Drive clips folder via gdown (scripts/gdown_by_name.py).
 *
 * Run: npm run download-clips
 *      npm run download-clips -- C01-09   # only that script's local files
 *
 * Folder: env DRIVE_CLIPS_FOLDER (ID or URL). Default is Frank's clips folder.
 * The folder must be shared "Anyone with the link" or gdown returns 401.
 * Clips are gitignored.
 */
import { spawnSync } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { assertImageScenes } from "../src/imageFormat";

/** Frank's clips folder. Override with DRIVE_CLIPS_FOLDER (ID or folder URL). */
export const DEFAULT_DRIVE_CLIPS_FOLDER = "1gmFEeA1qxxibtFcJL3Xejkejl7YdUM1f";

const NPS_CLIPS: { name: string; url: string }[] = [
  {
    name: "deva-BadwaterBasinBRoll_1280x720.mp4",
    url: "https://www.nps.gov/nps-audiovideo/legacy/deva/55850C7D-FFC3-6103-D5C288C1FF969A31/deva-BadwaterBasinBRoll_1280x720.mp4",
  },
];

const root = process.cwd();
const scriptsDir = join(root, "scripts");

type Scene = { type?: string; src?: string };
type ScriptFile = { scenes?: Scene[] };

export function driveFolderRaw(): string {
  const fromEnv = process.env.DRIVE_CLIPS_FOLDER?.trim();
  return fromEnv || DEFAULT_DRIVE_CLIPS_FOLDER;
}

function isRemote(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

/** Path under video/public/ for a script src. */
function publicRel(src: string): string {
  return src.replace(/^\.?\//, "").split("?")[0]?.split("#")[0] ?? src;
}

function loadScripts(onlyId?: string): { id: string; data: ScriptFile }[] {
  const files = readdirSync(scriptsDir).filter(
    (name) => name.endsWith(".json") && (!onlyId || name === `${onlyId}.json`),
  );
  if (onlyId && files.length === 0) {
    throw new Error(`Script not found: ${join(scriptsDir, `${onlyId}.json`)}`);
  }
  return files.map((name) => ({
    id: name.replace(/\.json$/, ""),
    data: JSON.parse(readFileSync(join(scriptsDir, name), "utf8")) as ScriptFile,
  }));
}

async function downloadUrl(url: string, dest: string): Promise<void> {
  mkdirSync(dirname(dest), { recursive: true });
  if (existsSync(dest)) {
    console.log(`Already cached: ${dest}`);
    return;
  }
  console.log(`Downloading ${url}`);
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }
  const nodeStream = Readable.fromWeb(res.body as import("node:stream/web").ReadableStream);
  await pipeline(nodeStream, createWriteStream(dest));
  console.log(`Saved ${dest}`);
}

function downloadFromDrive(filename: string, dest: string): void {
  if (existsSync(dest)) {
    console.log(`Already cached: ${dest}`);
    return;
  }
  const helper = join(root, "scripts", "gdown_by_name.py");
  const result = spawnSync(
    "python3",
    [helper, "--folder", driveFolderRaw(), "--name", filename, "--out", dest],
    { cwd: root, stdio: "inherit" },
  );
  if (result.error) {
    throw new Error(
      `Could not run python3 for gdown (${result.error.message}). Install Python 3 and gdown.`,
    );
  }
  if (result.status !== 0) {
    throw new Error(
      `Drive download failed for "${filename}". See gdown output above. ` +
        `pip install -r requirements-clips.txt (from video/). ` +
        `DRIVE_CLIPS_FOLDER is ${driveFolderRaw()}.`,
    );
  }
}

async function main() {
  const onlyId = process.argv[2];
  const scripts = loadScripts(onlyId);
  for (const script of scripts) {
    try {
      assertImageScenes(script.data.scenes ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`${script.id}: ${message}`);
    }
  }

  const needed = new Map<string, string>(); // public rel -> basename for drive lookup
  for (const script of scripts) {
    for (const scene of script.data.scenes ?? []) {
      if ((scene.type !== "clip" && scene.type !== "image") || !scene.src) continue;
      if (isRemote(scene.src)) continue;
      const rel = publicRel(scene.src);
      const base = rel.split("/").pop() ?? rel;
      needed.set(rel, base);
    }
  }

  // With no script id, also cache the known NPS sample even if a script drops it.
  if (!onlyId) {
    for (const clip of NPS_CLIPS) {
      if (![...needed.values()].includes(clip.name)) {
        needed.set(`clips/${clip.name}`, clip.name);
      }
    }
  }

  for (const [rel, base] of needed) {
    const dest = join(root, "public", rel);
    const nps = NPS_CLIPS.find((clip) => clip.name === base);
    if (nps) {
      await downloadUrl(nps.url, dest);
      continue;
    }
    console.log(`Not an NPS URL — Drive lookup by filename: ${base}`);
    downloadFromDrive(base, dest);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
