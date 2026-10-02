# Home hero images

Curated set of **6** photos served as responsive AVIF + WebP
(`NN-640|1080|1600.{avif,webp}`).

## Replace photos (Frank)

1. Drop masters as `public/hero/sources/01.jpeg` … `06.jpeg` (sources are
   gitignored).
2. Run `npm run generate:hero` (needs `sharp`).
3. Commit the regenerated files under `public/hero/` (not the sources).

Until custom shots land, these six were downloaded once from the previous
hero Supabase `media_gallery` URLs (not nps.gov hotlinks).
