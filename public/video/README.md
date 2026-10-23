# Videos del home

| Archivo | Qué es |
|---------|--------|
| `v1/quiz-gc-720.mp4` | Fondo del cuestionario en celular (720×1280, ~1.3 MB) |
| `v1/quiz-gc-1080.mp4` | Fondo del cuestionario desde 768 px (1080×1920, ~2.5 MB) |
| `v1/quiz-gc-*.webp` | Póster (primer cuadro) y la imagen fija para quien pide menos movimiento o ahorro de datos |

Es Frank caminando un sendero del Gran Cañón: 9.5 s de su video, a 0.85× y con
un fundido de 0.8 s entre el final y el inicio para que el loop no brinque.

## Cambiar el video

`/video/*` tiene caché `immutable` de un año (`public/_headers`), igual que
`/hero/*` (ADR-038). Un corte nuevo va en una carpeta nueva:

1. Sube `VERSION` en `scripts/generate-quiz-video.sh` (p. ej. `v2`) y
   `QUIZ_VIDEO_BASE` en `src/components/landing/QuizSection.tsx`.
2. Corre `scripts/generate-quiz-video.sh <video.mp4> <inicio_s> <duración_s>`
   (necesita `ffmpeg`). El original no se sube al repo.
3. Borra la carpeta anterior y repite la medición de contraste del encabezado (ADR-042).
