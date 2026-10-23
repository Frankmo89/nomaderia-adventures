#!/usr/bin/env bash
# Background video for the home quiz (ADR-042). Needs ffmpeg with libx264 and
# libwebp. The source is one of Frank's phone videos; it is not committed.
#
#   scripts/generate-quiz-video.sh <source.mp4> [start_s] [length_s]
#
# Steps: cut [start, start+length), crop the top 22% (overcast sky; keeps the
# trail and the canyon in view), grade it warmer and livelier, slow to 0.85x,
# cross-fade the last 0.8 s into the first so the loop has no jump, then
# encode two H.264 files (phone, desktop) and a WebP poster for each.
# public/video/* is cached immutable: a new cut goes in a new folder (v2, …)
# and QUIZ_VIDEO_BASE in src/components/landing/QuizSection.tsx moves with it.
set -euo pipefail

SRC="${1:?usage: $0 <source.mp4> [start_s] [length_s]}"
START="${2:-4}"
LENGTH="${3:-9.5}"
VERSION="v2"
NAME="quiz-gc"
FADE="0.8"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/video/$VERSION"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$OUT"

# 1. Cut, crop the sky, grade, slow down, 1080 wide at 30 fps (near-lossless).
GRADE="eq=contrast=1.10:saturation=1.35:gamma=0.97,colorbalance=rm=0.04:bm=-0.04:rh=0.03:bh=-0.02"
ffmpeg -v error -ss "$START" -t "$LENGTH" -i "$SRC" -an \
  -vf "crop=iw:ih*0.78:0:ih*0.22,$GRADE,setpts=PTS/0.85,scale=1080:-2:flags=lanczos,fps=30" \
  -c:v libx264 -crf 12 -preset fast -pix_fmt yuv420p -y "$TMP/clip.mp4"

# 2. Seamless loop: drop the first FADE seconds, then fade the end into them.
CLIP_LEN="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$TMP/clip.mp4")"
OFFSET="$(awk -v l="$CLIP_LEN" -v f="$FADE" 'BEGIN { printf "%.3f", l - 2 * f }')"
ffmpeg -v error -i "$TMP/clip.mp4" -filter_complex \
  "[0:v]trim=start=$FADE,setpts=PTS-STARTPTS[a];[0:v]trim=end=$FADE,setpts=PTS-STARTPTS[b];[a][b]xfade=transition=fade:duration=$FADE:offset=$OFFSET,format=yuv420p[v]" \
  -map "[v]" -c:v libx264 -crf 10 -preset fast -y "$TMP/loop.mp4"

# 3. Delivery files: 720 wide for phones, 1080 wide from 768 px up.
encode() { # width height crf
  ffmpeg -v error -i "$TMP/loop.mp4" -an -vf "scale=$1:$2:flags=lanczos" \
    -c:v libx264 -profile:v high -preset slow -crf "$3" -pix_fmt yuv420p \
    -movflags +faststart -y "$OUT/$NAME-$1.mp4"
  # Poster = first frame, so nothing jumps when the video starts.
  ffmpeg -v error -i "$OUT/$NAME-$1.mp4" -frames:v 1 -c:v libwebp -quality 60 -y "$OUT/$NAME-$1.webp"
}
encode 720 -2 30
encode 1080 -2 31

ls -l "$OUT"
