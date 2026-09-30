#!/usr/bin/env python3
"""Download one file by filename from a Google Drive folder via gdown.

The folder is walked recursively (Frank's clips folder is nested). Match is by
basename unless --name contains a slash, in which case the Drive-relative path
must match. Does not use cookies. NPS B-roll is NOT handled here.

Requires: pip install -r requirements-clips.txt
Folder must be shared as "Anyone with the link" (Viewer). A private folder
returns HTTP 401 from the anonymous embedded folder view gdown uses.
"""

from __future__ import annotations

import argparse
import os
import sys


def folder_id(raw: str) -> str:
    raw = raw.strip()
    marker = "/folders/"
    if marker in raw:
        tail = raw.split(marker, 1)[1]
        return tail.split("?", 1)[0].split("/", 1)[0]
    if "id=" in raw:
        tail = raw.split("id=", 1)[1]
        return tail.split("&", 1)[0]
    return raw


def norm(path: str) -> str:
    return path.replace("\\", "/").lstrip("./")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--folder", required=True, help="Drive folder ID or URL")
    parser.add_argument("--name", required=True, help="Filename or relative path")
    parser.add_argument("--out", required=True, help="Local output path")
    args = parser.parse_args()

    try:
        import gdown
        from gdown.exceptions import DownloadError
    except ImportError:
        print(
            "gdown is not installed. From video/: pip install -r requirements-clips.txt",
            file=sys.stderr,
        )
        return 1

    fid = folder_id(args.folder)
    want = norm(args.name)
    print(f"Listing Drive folder {fid} for {want!r}", file=sys.stderr)
    try:
        listed = gdown.download_folder(
            id=fid,
            skip_download=True,
            quiet=True,
            use_cookies=False,
        )
    except DownloadError as exc:
        print(
            f"Could not list Google Drive folder {fid}.\n"
            f"gdown: {exc}\n"
            "Share the folder as Anyone with the link (Viewer). "
            "Anonymous gdown cannot read a private folder (HTTP 401).\n"
            "Override with env DRIVE_CLIPS_FOLDER (folder ID or URL). "
            "NPS sample clips are downloaded by URL and do not use Drive.",
            file=sys.stderr,
        )
        return 1

    files = [f for f in listed if getattr(f, "id", None) and getattr(f, "path", None)]

    if "/" in want:
        matches = [
            f
            for f in files
            if norm(f.path) == want or norm(f.path).endswith("/" + want)
        ]
    else:
        exact = [f for f in files if norm(f.path).split("/")[-1] == want]
        matches = exact or [
            f for f in files if norm(f.path).split("/")[-1].lower() == want.lower()
        ]

    if not matches:
        print(
            f'No file named "{want}" in Drive folder {fid} (searched subfolders).',
            file=sys.stderr,
        )
        return 1
    if len(matches) > 1:
        paths = "\n".join(f"  - {norm(f.path)}" for f in matches)
        print(
            f'Multiple Drive files match "{want}". Rename one so basenames are unique:\n{paths}',
            file=sys.stderr,
        )
        return 1

    chosen = matches[0]
    out = args.out
    os.makedirs(os.path.dirname(os.path.abspath(out)) or ".", exist_ok=True)
    print(
        f"Downloading {norm(chosen.path)} ({chosen.id}) → {out}",
        file=sys.stderr,
    )
    try:
        saved = gdown.download(
            id=chosen.id,
            output=out,
            quiet=False,
            use_cookies=False,
        )
    except DownloadError as exc:
        print(f"gdown failed to download {want}: {exc}", file=sys.stderr)
        return 1
    if not saved or not os.path.isfile(out):
        print(f"gdown did not write {out}", file=sys.stderr)
        return 1
    print(f"Saved {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
