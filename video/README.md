# Nomaderia video (Remotion)

Vertical reel renderer — **1080×1920 @ 30 fps**, no audio.

Full docs: [`docs/video-pipeline.md`](../docs/video-pipeline.md) · decision: **ADR-032**.

```sh
npm install
pip install -r requirements-clips.txt   # gdown; only needed for Drive clips
npm run download-clips   # NPS sample by URL (~56 MB, gitignored); other files by filename from Drive
npm run render -- C01-09 # → out/C01-09.mp4
npm run studio           # optional preview
```

Frank's clips folder defaults to `1gmFEeA1qxxibtFcJL3Xejkejl7YdUM1f`. Override with `DRIVE_CLIPS_FOLDER` (ID or URL). The folder must be shared **Anyone with the link** or gdown returns 401. NPS B-roll is still fetched by URL.

Stills: `.jpg` / `.png` only. `.heic` / `.HEIC` fails with an explicit error.

CI: workflow **Render reel** (`.github/workflows/render-reel.yml`) installs Chrome, renders, and uploads the MP4.

This package is **isolated** from the site Vite app. Do not import it from `src/`.
