# Nomaderia video (Remotion)

Vertical reel renderer — **1080×1920 @ 30 fps**, no audio.

Full docs: [`docs/video-pipeline.md`](../docs/video-pipeline.md) · decision: **ADR-032**.

```sh
npm install
npm run download-clips   # caches NPS sample B-roll (~56 MB, gitignored)
npm run render -- C01-09 # → out/C01-09.mp4
npm run studio           # optional preview
```

This package is **isolated** from the site Vite app. Do not import it from `src/`.
