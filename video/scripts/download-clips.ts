/**
 * Downloads public-domain NPS B-roll used by sample scripts.
 * Run: npm run download-clips
 */
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const CLIPS: { name: string; url: string }[] = [
  {
    name: "deva-BadwaterBasinBRoll_1280x720.mp4",
    url: "https://www.nps.gov/nps-audiovideo/legacy/deva/55850C7D-FFC3-6103-D5C288C1FF969A31/deva-BadwaterBasinBRoll_1280x720.mp4",
  },
];

const clipsDir = join(process.cwd(), "public", "clips");

async function download(url: string, dest: string): Promise<void> {
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
  // Node 20 fetch body → stream
  const nodeStream = Readable.fromWeb(res.body as import("node:stream/web").ReadableStream);
  await pipeline(nodeStream, createWriteStream(dest));
  console.log(`Saved ${dest}`);
}

async function main() {
  for (const clip of CLIPS) {
    await download(clip.url, join(clipsDir, clip.name));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
