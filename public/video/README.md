# Videos del home

| Archivo | Qué es |
|---------|--------|
| `v2/quiz-gc-720.mp4` | Fondo del cuestionario en celular (720×998, ~1.5 MB, sin audio) |
| `v2/quiz-gc-1080.mp4` | Fondo del cuestionario desde 768 px (1080×1498, ~2.6 MB, sin audio) |
| `v2/quiz-gc-*.webp` | Póster (primer cuadro) y la imagen fija para quien pide menos movimiento o ahorro de datos |

Es Frank caminando un sendero del Gran Cañón: 9.5 s de su video sin el cielo de
arriba, con color más vivo, a 0.85× y con un fundido de 0.8 s entre el final y
el inicio para que el loop no brinque. `v1` (sin recorte ni color) se borró.

## Cambiar el video

`/video/*` tiene caché `immutable` de un año (`public/_headers`), igual que
`/hero/*` (ADR-038). Un corte nuevo va en una carpeta nueva:

1. Sube `VERSION` en `scripts/generate-quiz-video.sh` (p. ej. `v2`) y
   `QUIZ_VIDEO_BASE` en `src/components/landing/QuizSection.tsx`.
2. Corre `scripts/generate-quiz-video.sh <video.mp4> <inicio_s> <duración_s>`
   (necesita `ffmpeg`). El original no se sube al repo.
3. Borra la carpeta anterior y repite la medición de contraste del encabezado (ADR-042).
