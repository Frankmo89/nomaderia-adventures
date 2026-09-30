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
npm run download-clips   # caches NPS sample B-roll under public/clips/ (~56 MB, gitignored)
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
| `image` | Still with slow zoom-in. `src` required. |
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
2. Auto-runs `download-clips` if the sample Death Valley clip is referenced and missing.
3. Invokes `remotion render` with composition id `Reel` and `--props` pointing at the JSON.
4. Uses `/usr/bin/google-chrome` when present (`REMOTION_BROWSER` overrides).

### Chromium / CI notes

Headless render needs a Chrome/Chromium binary. On this agent box,
`google-chrome` is available. In CI without a browser, install Chromium or set
`REMOTION_BROWSER`, or skip the render job and keep `npm install` only.

## Adding a new reel

1. Drop media into `video/public/clips/` or `video/public/` (or use a public HTTPS URL).
2. Add `video/scripts/MY-ID.json`.
3. `npm run render -- MY-ID`.
4. Upload `video/out/MY-ID.mp4` to the social tool of choice (outputs are gitignored).

## Layout on disk

```
video/
├── package.json          # Remotion deps only
├── remotion.config.ts
├── scripts/
│   ├── C01-09.json       # sample
│   ├── render.ts         # npm run render -- <id>
│   └── download-clips.ts
├── public/clips/         # large MP4s gitignored
├── src/                  # compositions + scenes
└── out/                  # MP4 outputs gitignored
```
