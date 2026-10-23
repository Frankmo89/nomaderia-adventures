#!/usr/bin/env bash
# Background video for the home quiz (ADR-042): one looping file made of
# several of Frank's walking clips. Needs ffmpeg with libx264 and libwebp.
# The originals are his phone videos; they are not committed.
#
#   scripts/generate-quiz-video.sh <clips.tsv> [source_dir]
#
# clips.tsv (tab-separated, # comments allowed), one clip per line, in order:
#   file  start_s  length_s  crop_top  grade
#   crop_top: share of the frame cut from the top (sky), 0–0.22
#   grade:    warm | desert | snow (presets below)
# scripts/quiz-video-clips.tsv is the cut on the site.
#
# Steps per clip: cut, crop to the same shape (78% of the height), grade,
# slow to 0.85x, 24 fps. Then cross-fade each clip into the next (0.8 s) and
# the last into the first, so the loop has no jump. Output: two H.264 files
# (phone, desktop) with no audio track and a WebP poster for each.
# public/video/* is cached immutable: a new cut goes in a new folder and
# QUIZ_VIDEO_BASE in src/components/landing/QuizSection.tsx moves with it.
set -euo pipefail

LIST="${1:?usage: $0 <clips.tsv> [source_dir]}"
SRC_DIR="${2:-.}"
VERSION="v3"
NAME="quiz-parks"
FADE="0.8"
KEEP="0.78" # share of the frame height kept after the top crop

grade() {
  case "$1" in
    warm)   echo "eq=contrast=1.10:saturation=1.35:gamma=0.97,colorbalance=rm=0.04:bm=-0.04:rh=0.03:bh=-0.02" ;;
    desert) echo "eq=contrast=1.08:saturation=1.30:gamma=0.97,colorbalance=rm=0.03:bm=-0.02" ;;
    snow)   echo "eq=contrast=1.08:saturation=1.25:gamma=0.90:brightness=-0.04" ;;
    *) echo "unknown grade: $1" >&2; exit 1 ;;
  esac
}
duration() { ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"; }

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/video/$VERSION"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

# 1. Normalise every clip (near-lossless intermediates).
n=0
while IFS=$'\t' read -r file start length crop_top grade_name; do
  [[ -z "${file// }" || "$file" == \#* ]] && continue
  ffmpeg -nostdin -v error -ss "$start" -t "$length" -i "$SRC_DIR/$file" -an \
    -vf "crop=iw:ih*$KEEP:0:ih*$crop_top,$(grade "$grade_name"),setpts=PTS/0.85,scale=1080:1498:flags=lanczos,fps=24,setsar=1" \
    -c:v libx264 -crf 12 -preset fast -pix_fmt yuv420p -y "$TMP/c$n.mp4"
  n=$((n + 1))
done < "$LIST"
(( n >= 1 )) || { echo "no clips in $LIST" >&2; exit 1; }

# 2. Chain the clips with cross-fades.
cp "$TMP/c0.mp4" "$TMP/chain.mp4"
for ((i = 1; i < n; i++)); do
  offset="$(awk -v l="$(duration "$TMP/chain.mp4")" -v f="$FADE" 'BEGIN { printf "%.3f", l - f }')"
  ffmpeg -v error -i "$TMP/chain.mp4" -i "$TMP/c$i.mp4" -filter_complex \
    "[0:v][1:v]xfade=transition=fade:duration=$FADE:offset=$offset,format=yuv420p[v]" \
    -map "[v]" -c:v libx264 -crf 10 -preset fast -y "$TMP/next.mp4"
  mv "$TMP/next.mp4" "$TMP/chain.mp4"
done

# 3. Seamless loop: drop the first FADE seconds, then fade the end into them.
offset="$(awk -v l="$(duration "$TMP/chain.mp4")" -v f="$FADE" 'BEGIN { printf "%.3f", l - 2 * f }')"
ffmpeg -v error -i "$TMP/chain.mp4" -filter_complex \
  "[0:v]trim=start=$FADE,setpts=PTS-STARTPTS[a];[0:v]trim=end=$FADE,setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=$FADE:offset=$offset,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -crf 10 -preset fast -y "$TMP/loop.mp4"

# 4. Delivery files: 720 wide for phones, 1080 wide from 768 px up.
encode() { # width crf
  ffmpeg -v error -i "$TMP/loop.mp4" -an -vf "scale=$1:-2:flags=lanczos" \
    -c:v libx264 -profile:v high -preset slow -crf "$2" -pix_fmt yuv420p \
    -movflags +faststart -y "$OUT/$NAME-$1.mp4"
  # Poster = first frame, so nothing jumps when the video starts.
  ffmpeg -v error -i "$OUT/$NAME-$1.mp4" -frames:v 1 -c:v libwebp -quality 60 -y "$OUT/$NAME-$1.webp"
}
encode 720 34
encode 1080 35

ls -l "$OUT"
echo "loop length: $(duration "$OUT/$NAME-720.mp4") s"
