# Video pipeline — Remotion vertical reels

Isolated package under `video/` (own `package.json`). Does **not** touch the site
Vite app. Spec / decision: **ADR-032**. Feature reality check: `docs/live-features.md`.

## Requirements

| Item | Value |
|------|--------|
| Size | 1080 × 1920 |
| FPS | 30 |
| Audio | none |
| Brand fonts | Oswald (caps headlines), Permanent Marker (short accents / highlight), Inter (body) via `@remotion/google-fonts` |
| Colors | `#FBFAF7` cloud, `#13211A` ink, `#1F6F43` Trail Green, `#14201A` forest; `#D97706` **only** on the `highlight` word |
| Safe text | Keep copy out of top **250px**, bottom **350px**, right **150px** |
| Ending | Every reel appends a **2 s** CTA card (`cta`); show `credit` small on the last content scene (and again on the CTA) |

## Remotion license (one-person company)

Remotion **Free License** covers individuals and for-profit orgs with **≤ 3
employees**, including commercial video creation. A Company License is required
only when four or more personnel operate the same Remotion project. See
[License](https://www.remotion.dev/docs/license) / ADR-032. Revisit if headcount
grows or you ship paid render automation.

## Setup

```sh
cd video
npm install
pip install -r requirements-clips.txt   # gdown, only for Frank's Drive clips
npm run download-clips   # NPS sample by URL; other missing files by Drive filename
```

Optional Studio preview:

```sh
npm run studio
```

## Script JSON

Create `video/scripts/<id>.json`:

```json
{
  "id": "C01-09",
  "scenes": [
    {
      "type": "clip | image | card | data",
      "src": "<https URL or path under video/public/>",
      "seconds": 3,
      "text": "<on-screen text>",
      "highlight": "<one word>"
    }
  ],
  "data": {
    "park": "",
    "driveFromSD": "",
    "level": "",
    "fee": "",
    "bestSeason": ""
  },
  "credit": "Video: NPS",
  "cta": "Haz el quiz gratis en nomaderia.com"
}
```

### Scene types

| `type` | Behavior |
|--------|----------|
| `clip` | Video, cover-fit, muted (`OffthreadVideo`). `src` = URL or `clips/….mp4` under `public/`. |
| `image` | Still with slow zoom-in. `src` required. **`.jpg` / `.jpeg` / `.png` only.** `.heic` and `.HEIC` (and `.heif`) fail before render with an error telling you to export JPG or PNG. |
| `card` | Full-bleed Trail Green `#1F6F43`, text only. |
| `data` | Green card listing non-empty fields from top-level `data`. |

Sample: `video/scripts/C01-09.json` (Death Valley placeholder + NPS Badwater Basin B-roll).

## Render

```sh
cd video
npm run render -- C01-09
# → video/out/C01-09.mp4
```

The render script:

1. Loads `scripts/<id>.json`.
2. Rejects image scenes whose `src` is `.heic`, `.HEIC`, or `.heif` (accepted: `.jpg`, `.jpeg`, `.png`).
3. Auto-runs `download-clips` for that script id if a local clip/image is missing.
4. Invokes `remotion render` with composition id `Reel` and `--props` pointing at the JSON.
5. Uses `/usr/bin/google-chrome` when present (`REMOTION_BROWSER` overrides).

## Where media comes from

Clips and stills stay **out of git** (`video/.gitignore` ignores `public/clips/*` except `.gitkeep`, plus `out/`).

| Source | How |
|--------|-----|
| NPS sample (Badwater Basin B-roll) | Public URL in `video/scripts/download-clips.ts`. Not Drive. |
| Frank's clips | **By filename** from Google Drive via [gdown](https://github.com/wkentaro/gdown) (`video/scripts/gdown_by_name.py`). |

### Google Drive folder

Default folder (Frank's clips library):

- Link: https://drive.google.com/drive/folders/1gmFEeA1qxxibtFcJL3Xejkejl7YdUM1f
- Folder ID: `1gmFEeA1qxxibtFcJL3Xejkejl7YdUM1f`

Override without editing code: env **`DRIVE_CLIPS_FOLDER`** (folder ID or full folder URL). In GitHub Actions, set the repo secret of the same name; an empty secret keeps the default.

The folder is nested (campaign subfolders). Download matches the **basename** of the script `src` (for example `clips/foo.mp4` looks up `foo.mp4` anywhere in the tree). Basenames must be unique. gdown walks the tree with `download_folder(..., skip_download=True)` and then downloads that one file.

**Sharing:** gdown is anonymous. The folder must be **Anyone with the link → Viewer**. A private folder returns HTTP 401 (`Failed to retrieve folder contents`). As of 2026-09-30 the folder was still private to anonymous clients, so Drive downloads fail until that sharing change. The NPS sample does not need it.

```sh
cd video
pip install -r requirements-clips.txt
# optional: export DRIVE_CLIPS_FOLDER='https://drive.google.com/drive/folders/…'
npm run download-clips -- C01-09
```

## GitHub Actions — "Render reel"

Workflow: `.github/workflows/render-reel.yml`.

| Trigger | What it renders |
|---------|-----------------|
| `workflow_dispatch` input `id` | `video/scripts/<id>.json` (example `C01-09`) |
| pull request that changes `video/**` (or the workflow file) | sample **C01-09** |

Steps: checkout, Node 22, **install Google Chrome stable** (`/usr/bin/google-chrome`, also set as `REMOTION_BROWSER`), venv + `pip install -r video/requirements-clips.txt`, `npm ci` in `video/`, `npm run download-clips`, `npm run render -- <id>`, upload `video/out/<id>.mp4` as artifact `reel-<id>`.

Chrome is installed in the job on purpose. `ubuntu-latest` does not ship a browser Remotion can use, and `video/scripts/render.ts` only passes `--browser-executable` when Chrome is on that path or `REMOTION_BROWSER` is set.

### Chromium locally

Headless render needs Chrome/Chromium. This agent box has `google-chrome`. Otherwise install Chrome or set `REMOTION_BROWSER` to the binary.

## Adding a new reel

1. Put the file in the Drive folder under a **unique** filename (`.mp4`, or `.jpg` / `.png` — not HEIC), shared "Anyone with the link". Or drop it in `video/public/clips/` yourself, or use a public HTTPS URL.
2. Add `video/scripts/MY-ID.json` with `src` like `clips/that-filename.mp4`.
3. `npm run render -- MY-ID` (downloads by filename if the file is not cached).
4. Upload `video/out/MY-ID.mp4` to the social tool of choice (outputs are gitignored). Or run the **Render reel** workflow with input `id` = `MY-ID` and download the artifact.

## Layout on disk

```
video/
├── package.json          # Remotion deps only
├── remotion.config.ts
├── scripts/
│   ├── C01-09.json       # sample
│   ├── render.ts         # npm run render -- <id>
│   ├── download-clips.ts # NPS by URL + Drive by filename
│   └── gdown_by_name.py
├── public/clips/         # large MP4s gitignored
├── src/                  # compositions + scenes
└── out/                  # MP4 outputs gitignored
```
