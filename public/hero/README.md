# Home hero images

**6** fotos de Frank servidas como AVIF + WebP responsivos en
`public/hero/v2/` (`NN-640|1080|1600.{avif,webp}`):

| ID | Foto |
|----|------|
| 01 | Grand Canyon — amanecer junto a O'Neill Butte (LCP, se precarga en `index.html`) |
| 02 | Joshua Tree — yuca y rocas |
| 03 | Yosemite — carretera con nieve y túnel |
| 04 | Grand Canyon — sendero con excursionista |
| 05 | Joshua Tree — Skull Rock |
| 06 | Yosemite — Yosemite Falls con nieve |

## Cambiar fotos

`/hero/*` tiene caché `immutable` de un año (`public/_headers`). Si se
reusan los mismos nombres, quien ya visitó el sitio sigue viendo las fotos
viejas. Por eso cada set nuevo va en una carpeta nueva (ADR-038):

1. Pon los originales en `public/hero/sources/01.jpeg` … `06.jpeg`
   (la carpeta está en `.gitignore`).
2. Sube `HERO_VERSION` en `scripts/generate-hero-images.mjs` (p. ej. `v3`),
   `HERO_BASE` en `src/components/landing/HeroSection.tsx` y las rutas del
   preload de la foto 01 en `index.html`.
3. Corre `npm run generate:hero` (usa `sharp`).
4. Borra la carpeta anterior y haz commit de la nueva (no de `sources/`).

El script aplica `blur(0.8)` antes de comprimir (AVIF q50 4:2:0, WebP q65):
quita el ruido del sensor del celular y baja el peso a la mitad sin que se
note detrás del degradado y el zoom.
