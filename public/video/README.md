# Videos del home

| Archivo | Qué es |
|---------|--------|
| `v3/quiz-parks-720.mp4` | Celular, H.264 (720×998, ~2.0 MB, sin audio) |
| `v3/quiz-parks-720-av1.mp4` | Celular, AV1 (~1.4 MB) — solo si el equipo lo decodifica por hardware |
| `v3/quiz-parks-1080.mp4` | Desde 768 px, H.264 (1080×1498, ~3.7 MB, sin audio) |
| `v3/quiz-parks-1080-av1.mp4` | Desde 768 px, AV1 (~2.4 MB) — solo si el equipo lo decodifica por hardware |
| `v3/quiz-parks-*.webp` | Póster (primer cuadro) y la imagen fija para quien pide menos movimiento o ahorro de datos |

Es Frank caminando en 4 parques, ~4 s cada uno, en un loop de 16.7 s:
Gran Cañón → Joshua Tree (Cholla) → Yosemite (nieve) → Joshua Tree (Arch Rock).
Cada clip va sin el cielo de arriba, con color más vivo, a 0.85× y con fundidos
de 0.8 s entre clips y del último al primero, para que el loop no brinque.
El orden, los cortes y el color de cada clip están en
`scripts/quiz-video-clips.tsv`. `QuizSection` elige AV1 o H.264 con
`navigator.mediaCapabilities` y no baja nada hasta que la sección está cerca.

## Cambiar el video

`/video/*` tiene caché `immutable` de un año (`public/_headers`), igual que
`/hero/*` (ADR-038). Un corte nuevo va en una carpeta nueva:

1. Edita `scripts/quiz-video-clips.tsv` (archivo, inicio, duración, recorte de
   arriba, color: `warm`, `desert` o `snow`).
2. Sube `VERSION` en `scripts/generate-quiz-video.sh` (p. ej. `v4`) y
   `QUIZ_VIDEO_BASE` en `src/components/landing/QuizSection.tsx`.
3. Corre `scripts/generate-quiz-video.sh scripts/quiz-video-clips.tsv <carpeta con los originales>`
   (necesita `ffmpeg`). Los originales no se suben al repo.
4. Borra la carpeta anterior y repite la medición de contraste del encabezado
   en cuadros de cada clip (ADR-042).
