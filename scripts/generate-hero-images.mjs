#!/usr/bin/env node
/**
 * Generate responsive AVIF + WebP hero assets from public/hero/sources/*.
 * Usage: node scripts/generate-hero-images.mjs
 * Requires: sharp (devDependency)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const sourcesDir = path.join(root, "public/hero/sources");
// /hero/* is cached `immutable` for a year (public/_headers). New photos MUST
// land in a new folder, or returning visitors keep the old ones. Bump this
// together with HERO_BASE in HeroSection.tsx and the preload in index.html.
const HERO_VERSION = "v2";
const outDir = path.join(root, "public/hero", HERO_VERSION);
const WIDTHS = [640, 1080, 1600];

async function main() {
  if (!fs.existsSync(sourcesDir)) {
    console.error(`Missing ${sourcesDir}. Drop 01.jpeg…06.jpeg there first.`);
    process.exit(1);
  }
  const sources = fs
    .readdirSync(sourcesDir)
    .filter((f) => /^\d{2}\.(jpe?g|png|webp)$/i.test(f))
    .sort();
  if (sources.length === 0) {
    console.error("No numbered sources (01.jpeg …) found.");
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  let count = 0;
  for (const file of sources) {
    const id = path.parse(file).name; // "01"
    const input = path.join(sourcesDir, file);
    const img = sharp(input).rotate(); // honor EXIF
    for (const w of WIDTHS) {
      const base = path.join(outDir, `${id}-${w}`);
      // blur(0.8) drops sensor noise (phone shots of snow, trees) and halves
      // the bytes; it is not visible behind the scrim + Ken Burns zoom.
      await img
        .clone()
        .resize({ width: w, withoutEnlargement: true })
        .blur(0.8)
        .avif({ quality: 50, effort: 4, chromaSubsampling: "4:2:0" })
        .toFile(`${base}.avif`);
      count++;
      await img
        .clone()
        .resize({ width: w, withoutEnlargement: true })
        .blur(0.8)
        .webp({ quality: 65, effort: 4 })
        .toFile(`${base}.webp`);
      count++;
    }
    console.log(`✓ ${id} → ${WIDTHS.join(", ")}px (avif+webp)`);
  }
  console.log(`Done. Generated ${count} files in public/hero/${HERO_VERSION}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
