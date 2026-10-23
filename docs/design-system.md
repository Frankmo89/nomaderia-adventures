# Sistema de Diseño — Nomaderia

> **Fuente de verdad del diseño visual de Nomaderia.**
> Toda decisión de color, tipografía, espaciado y componentes sale de aquí.
> Antes de escribir o modificar cualquier UI, lee este archivo. No improvises colores ni estilos.
>
> Dirección de arte: **"Naturaleza viva sobre una base editorial estilo Patagonia."**
> Referencias: AllTrails (tarjetas + verde de confianza), Patagonia (momentos de foto full-bleed), REI (secciones de valor), Outdoor Prolink (tipografía condensada atlética), Komoot (lógica de color outdoor).

---

## 1. Filosofía

- **Verde = confianza y acción.** Es el color protagonista (el "go" de AllTrails/Komoot).
- **Terracota = energía.** Un solo acento cálido. Máximo 1 por pantalla.
- **Oscuro = bosque, no corporativo.** Las secciones oscuras usan verde-carbón tintado, NUNCA negro puro.
- **Blanco = fresco, no beige.** El fondo es un off-white cálido pero limpio.
- **Las fotos cargan el color; la UI se mantiene sobria.** Sobre fotos se usa el degradado natural, no cajas de color planas.
- **Aire y moderación.** La confianza viene del espacio en blanco y la contención, no de saturar.

---

## 2. Paleta de color

> En `tailwind.config.ts` estos son los tokens. Usa siempre el token (ej. `bg-green`), nunca el hex directo en componentes.

| Token | Nombre | Hex | Cuándo usarlo |
|---|---|---|---|
| `green` | Trail Green | `#1F6F43` | **Primario.** Botones de acción, nav activo, precios, tinte de estrellas/rating, marca. El color "go/confianza". |
| `green-dark` | Pine | `#16512F` | Hover/pressed de botones verdes. |
| `green-wash` | Moss Wash | `#E8F1EA` | Fondos verdes suaves: chips seleccionados, notas de éxito, paneles de valor. |
| `terracotta` | Canyon Terracotta | `#C2562F` | **Único acento de energía.** CTA secundario, subrayado de eyebrows, highlights. Máximo 1 por viewport. |
| `sky` | Sky Blue | `#2E6F9E` | Acentos informativos, links dentro de texto, UI de elegibilidad ("¿Puedo ir?"). NUNCA un botón. |
| `amber` | Sun Amber | `#E08A1E` | Decorativo: estrellas de rating en gear, tags "nuevo". Ya NO es color de marca ni botón. |
| `warning` | Warning Amber | `#E08A1E` | Estados de advertencia y acentos cálidos semánticos (alertas, callouts de precaución); nunca para elementos interactivos de marca. Alias semántico de `amber` — mismo hex, intención distinta. |
| `forest-dark` | Forest Charcoal | `#14201A` | **Secciones oscuras**, footer, scrims de foto. Verde-carbón. **Reemplaza al `#1C1917`.** |
| `spruce` | Spruce | `#1E2C24` | Tarjetas/inputs sobre superficie oscura. |
| `cloud` | Cloud | `#FBFAF7` | **Fondo de página por defecto.** Off-white cálido pero fresco (sin beige). |
| `white` | Pure White | `#FFFFFF` | Tarjetas que se sobreponen a fotos, modales. |
| `stone` | Stone | `#E4E2DB` | Bordes de 1px, hairlines, outlines de inputs. |
| `ink` | Ink | `#13211A` | Títulos sobre claro. Casi-negro tintado, nunca `#000`. |
| `slate` | Slate | `#384741` | Párrafos sobre claro. |
| `sage` | Sage Gray | `#6E7A74` | Labels, captions de stats, metadata, placeholders. |
| `mist` | Mist | `#EAF0EC` | Texto de cuerpo sobre Forest Charcoal. |

### Reglas de paleta (de un vistazo)
- **Verde** es el único color de relleno de botón de marca.
- **Terracota** es la única "energía cálida" — uno por pantalla.
- **Azul** es informativo, nunca un botón.
- **Ámbar** es decorativo, nunca acción.
- Las superficies oscuras son verde-tintadas (`#14201A`), nunca negro puro.
- El blanco es cálido (`#FBFAF7`), nunca beige.
- Sobre fotos: degradado del color de la foto, no bloques de color planos.

---

## 3. Tipografía

Cuatro fuentes, cada una con un trabajo claro. **Nunca mezcles Anton y Playfair en el mismo título** — pelean.

| Fuente | Rol | Ejemplo |
|---|---|---|
| **Anton** | Titulares de momentos de foto full-bleed; tipografía de declaración oversized. Solo mayúsculas. | "TU PRÓXIMA AVENTURA" sobre foto |
| **Oswald** (mayúsculas, `letter-spacing: 0.08em`) | Eyebrows, kickers de sección, labels de dificultad, unidades de stats. | "DESTINOS · CALIFORNIA" |
| **Playfair Display** | Títulos editoriales en secciones claras, títulos de blog/artículos. | "Guías honestas para principiantes" |
| **Inter** | Todo el cuerpo, UI, botones, captions, formularios. | todo lo demás |

**Regla de pareo:** Anton/Oswald van sobre fotografía y superficies oscuras (atlético, fuerte). Playfair va en las secciones claras editoriales (cálido, confiable).

### Escala tipográfica (mobile-first, rem @ base 16px)

| Token | Tamaño / interlineado | Fuente | Uso |
|---|---|---|---|
| `display-hero` | 3.25rem / 0.95 (mobile) → 5.5rem (desktop) | Anton, mayúsculas | Titular de momento de foto |
| `eyebrow` | 0.8125rem / 1.2, +0.08em, mayúsculas | Oswald 600 | Kicker arriba de títulos |
| `h1` | 2rem / 1.1 → 2.75rem | Playfair 700 | Título de página (editorial) |
| `h2` | 1.5rem / 1.15 → 2rem | Playfair 600 | Título de sección |
| `h3` | 1.125rem / 1.25 | Inter 600 | Título de tarjeta |
| `stat-number` | 1.5rem / 1.1 | Inter 700 | Número grande "5.8 mi" |
| `stat-unit` | 0.75rem / 1, mayúsculas | Oswald 500 | "mi / ft" + label de caption |
| `body` | 1rem / 1.6 | Inter 400 | Párrafos |
| `body-sm` | 0.875rem / 1.5 | Inter 400 | Meta, secundario |
| `caption` | 0.75rem / 1.4 | Inter 500 | Labels, badges |

**Fuentes a cargar (Google Fonts):** Oswald (400–700), Playfair Display (ya está), Inter (ya está).

> **Anton retirado (2026-07-14, PR 4):** tenía 0 usos en el repo y se removió del
> request de Google Fonts y del token `font-display` de `tailwind.config.ts`.
> Los roles que este doc le asigna (titulares de foto full-bleed, `display-hero`)
> quedan vacantes: si un diseño futuro los necesita, re-agregar el request y el
> token en el mismo PR que los use.

---

## Logo

El logo aprobado es **El Pin** (2026-10-03). Resumen; el detalle vive en [`docs/brand.md`](brand.md).

- **Marca:** un pin de mapa. La ventana muestra la sierra del próximo parque y un punto naranja (la fogata). El wordmark es `nomader` + `IA` (Oswald, trazado en el SVG). `IA` y el punto van siempre en fogata `#D97706`.
- **En el sitio:** `<Logo>` (`src/components/brand/Logo.tsx`) usa `/brand/nomaderia-horizontal.svg` en fondos claros y `/brand/nomaderia-horizontal-oscuro.svg` (`variant="onDark"`) sobre el hero, el footer y el sidebar admin. El alto lo pone el caller (`h-8` / `md:h-9`).
- **Excepción de color:** el logo es la única excepción a la regla de "naranja solo en el Hero". No recolorear `IA` ni el punto para cumplir esa regla.
- **No** estirar, rotar, redibujar el pin ni reescribir el wordmark como texto vivo. En una foto ocupada, primero un overlay forest.

---

## 4. Componentes

### 4.1 Tarjeta de destino (estilo AllTrails) — componente clave
- **Forma:** tarjeta vertical, foto full-width arriba (ratio 16:10), luego un panel blanco que se sobrepone a la foto ~16px hacia arriba con radio superior de 20px. Radio exterior de la tarjeta: 16px.
- **Sombra:** suave y baja — `0 4px 16px rgba(20,32,26,0.08)`. Sin bordes duros; 1px `stone` solo si es blanco-sobre-blanco.
- **Foto:** full-bleed, con leve degradado abajo para que el borde del panel lea limpio. Ícono de guardar arriba-derecha en chip circular blanco.
- **Dificultad:** como texto en la línea meta, no como pill ruidoso: `★ 4.5 · Moderado · Yosemite NP`. Estrella tintada de `green`. (Si se quiere badge, pill pequeño `green-wash` con texto verde — NUNCA colores de semáforo rojo/amarillo; esta audiencia es principiante, no asustarla.)
- **Fila de stats:** grid 2×2. Cada celda = `stat-number` (Inter 700, `ink`) con unidad Oswald pequeña, luego caption `sage` debajo. Íconos de línea (16px, `sage`): distancia, elevación (montaña), tiempo (reloj), forma de ruta (loop / ida y vuelta).
- **Acciones:** pill verde primario (`green`, texto blanco, radio completo) + pill neutro secundario (`cloud`/blanco, texto `slate`, borde `stone`). Pareo Ver guía / Mapa.

### 4.2 Sección de valor (estilo REI)
- **Layout:** eyebrow (Oswald mayúsculas, `green`) → título Playfair → 3 columnas (máx 4), apilando a 1 en mobile.
- **Cada columna:** ícono de línea (24px, trazo `green`, opcionalmente en cuadro redondeado `green-wash` de 48px estilo HoneyBook), título h3 Inter 600, 2–3 líneas de cuerpo `slate`.
- **Contenedor:** plano sobre `cloud`, o — para énfasis — un solo bloque redondeado `green-wash` (radio 24px) conteniendo todas las columnas. Padding generoso (32px+). Sin bordes ni sombras en los íconos. La confianza viene del aire + la moderación.

### 4.3 Sección de foto full-bleed (estilo Patagonia)
- **Scrim:** nunca una caja plana. Usa degradado lineal direccional desde donde está el texto: `linear-gradient(to top, rgba(20,32,26,0.72) 0%, rgba(20,32,26,0.25) 45%, transparent 75%)` para texto abajo-izquierda. El degradado usa `forest-dark`, no negro puro, para que los verdes de la foto sigan vivos. En el hero del home el oscuro sigue la posición real del texto y el contraste se mide sobre las fotos (ADR-039). El cuestionario del home va sobre un video de Frank caminando (póster fijo con «reducir movimiento» o ahorro de datos; pausa solo con teclado): primero una portada con el video limpio y vivo, título y botón «Empezar»; luego la tarjeta opaca encima; crestas de divisor arriba y abajo (ADR-042).
- **Posición del texto:** abajo-izquierda por defecto, u óptico-centro para tomas simétricas de valle/montaña.
- **Titular** en Anton mayúsculas blanco; línea de apoyo en Inter `mist`.
- **Eyebrow** arriba en Oswald, opcionalmente con un subrayado corto terracota.
- **Ritmo:** alterna estas secciones de foto full-bleed con secciones claras `cloud` editoriales (Playfair + valor). Patrón: foto → editorial claro → tarjetas → foto → valor claro → CTA oscuro. Nunca dos secciones de foto seguidas.
- **CTA sobre foto:** pill blanco o terracota, nunca verde-sobre-foto-ocupada (el verde se pierde en el follaje).

### 4.4 Botones

| Variante | Relleno | Texto | Borde | Hover |
|---|---|---|---|---|
| Primario | `green` #1F6F43 | blanco | ninguno | `green-dark` #16512F |
| Secundario | transparente / `cloud` | `slate` | 1px `stone` | bg `green-wash` |
| Acento (raro) | `terracotta` #C2562F | blanco | ninguno | oscurecer 8% |
| Sobre-foto primario | blanco | `ink` | ninguno | `cloud` |
| Sobre-oscuro | `green` | blanco | ninguno | `green-dark` |

**Forma:** radio de pill completo, altura 48px mobile, Inter 600, padding horizontal generoso (24px+). Máximo un botón terracota por pantalla.

### 4.5 Divisores de curva de montaña
Hacerlos sentir intencionales, no clip-art decorativo:
- Una sola curva de cresta calmada (un pico suave, no un zigzag ocupado), altura ~48–72px, como SVG que toma el color de fondo de la sección siguiente como relleno — para que lea como la tierra encontrando el cielo, no como un sticker.
- Solo colocar un divisor en una transición de tema: claro editorial → foto/CTA oscuro, o `cloud` → footer `forest-dark`. NO dividir cada sección (ese fue el error del tema café — demasiadas olas ornamentales).
- Parear el color de la curva con la sección que introduce.
- Opcional: hairline de 1px `green` o `amber` en la cresta para un toque de "luz de horizonte" — máximo una o dos veces por página.
- Relleno plano, sin trazos; la dirección de arte es realismo fotográfico + calma editorial, así que el divisor debe ser geometría callada.

### 4.6 Tarjeta de foto con vidrio (parques del home, ADR-040)
Variante oscura de 4.1, solo para la sección «¿A cuántas horas está tu próximo parque?» sobre `forest-dark`.
- **Forma:** foto a todo lo alto (500 px celular, 540 px desktop), radio 24 px. Panel de vidrio abajo, a 10–12 px de los bordes, radio 18 px.
- **Vidrio:** `forest-dark` al 70% + `backdrop-blur-lg`, borde 1 px `cloud/20`. Pill de nivel al 65% + `backdrop-blur-md`. Sin soporte de `backdrop-filter`: 85% sin blur. Texto blanco ≥4.5:1 aunque la foto sea blanca; no bajar estas opacidades sin volver a medir.
- **Tipo:** nombre del parque y título de la sección en Oswald (regla de pareo: Oswald sobre oscuro). Datos en Inter 600 con íconos de línea 18 px; bajo 380 px de ancho bajan a 13 px con íconos de 16 px para que días y entrada quepan en una fila.
- **«No te pierdas»:** debajo de los datos, tras una línea `cloud/20`: etiqueta Oswald mayúsculas con estrella y la frase de `signature_experience` en Inter 400.
- **Ruta:** línea punteada `cloud/35`, nodo de inicio `cloud`, nodos de parque `green` con borde `cloud` de 3 px. Nada en fogata.
- **CTA:** pill `cloud` con texto `ink` («Ver guía →»; desde `xl`, «Ver guía de X →»). Toda la tarjeta es el link.
- **Origen (ADR-041):** al lado del eyebrow, pill chico «📍 Cambiar» (borde `cloud/30`, 32 px de alto, área de toque de 48 px). Abre un formulario en línea: etiqueta visible, campo de código postal en pill (`cloud/10`) y botón `cloud` «Ver mi ruta». Las horas estimadas llevan «≈» y una nota `cloud/80` bajo la ruta; las reales desde San Diego van sin «≈».

### 4.7 Escena del excursionista (cabecera de /destinos, ADR-043)
Ilustración en silueta, no foto: la única de este tipo en el sitio, para una cabecera ancha que un video vertical no llena.
- **Paletas por hora (`SCENE_PALETTES`):** noche (la de marca: cresta `#0D1A14`, pinos `#16332A`, íconos `#22473A`, cordilleras `#3A6E55`, cielo de `forest-dark` a `#5E9C7A`, luna y estrellas), amanecer y atardecer (cielo índigo a durazno/rosa, siluetas azul-verde o ciruela, sol bajo detrás de las cordilleras) y día (cielo azul, nubes blancas, sol alto, siluetas verdes). Los cielos cálidos son propios de la escena: nunca fogata ni terracota. En todas, la franja de arriba es oscura (navbar y título blancos).
- **Siluetas:** formas planas reconocibles (Half Dome, sequoias, Delicate Arch, el faro de Acadia…), sin contornos ni texto. Para sumar un parque, dibujarlo en la tesela de íconos de `src/lib/park-scene-tiles.ts` sin pasar de la altura de Half Dome.
- **Movimiento:** calmado pero visible (la cresta ~40 px/s, los íconos ~17 px/s en celular). Quieto con «reducir movimiento», detenido fuera de pantalla.
- **Texto:** el título y el subtítulo solo van sobre cielo oscuro; ninguna figura, nube ni estrella pasa detrás de ellos. Si una paleta aclara el cielo, lleva oscurecido radial detrás del texto y se vuelve a medir.

---

## 5. Resumen de tokens (para Tailwind config)

```
colors:
  green:        #1F6F43   // primario
  green-dark:   #16512F
  green-wash:   #E8F1EA
  terracotta:   #C2562F   // acento — energía, 1 por pantalla
  sky:          #2E6F9E   // info / links
  amber:        #E08A1E   // acento decorativo solamente
  warning:      #E08A1E   // advertencias semánticas (alias de amber) — nunca interactivo de marca
  forest-dark:  #14201A   // secciones oscuras — reemplaza #1C1917
  spruce:       #1E2C24   // oscuro elevado
  cloud:        #FBFAF7   // fondo
  white:        #FFFFFF
  stone:        #E4E2DB   // bordes
  ink:          #13211A   // títulos
  slate:        #384741   // cuerpo
  sage:         #6E7A74   // muted
  mist:         #EAF0EC   // texto sobre oscuro

fonts:
  display:   'Anton'            // titulares de foto, mayúsculas
  condensed: 'Oswald'           // eyebrows, unidades de stats, labels
  serif:     'Playfair Display' // títulos editoriales
  sans:      'Inter'            // cuerpo + UI

radius:      card 16, panel-top 20, pill 9999
shadow-card: 0 4px 16px rgba(20,32,26,0.08)
```

---

## 6. Excepciones conocidas
- (Documentar aquí cualquier pantalla que legítimamente se salga del sistema, con la razón.)
- **Admin sidebar (`AdminLayout.tsx`) — excepción dark, pero NO de color de marca:** el sidebar es oscuro (ADR-006), pero su estado activo de navegación usa el mismo verde de marca que el resto del sitio (`text-primary` / `bg-primary/10`, token `--primary` remapeado a Trail Green `#1F6F43` en PR 4). **[2026-07-27]** El estado activo tenía un bug: usaba `bg-[rgba(217,119,6,0.10)]` + `text-[#FBBF24]` (ámbar/naranja, el `--sidebar-primary` legacy que nunca se remapeó junto con `--primary`), mientras el ícono activo y la barra lateral de acento ya usaban `text-primary`/`bg-primary` (verde) — dos colores distintos en el mismo ítem activo. Corregido a `bg-primary/10 text-primary` para que todo el ítem activo sea consistente. El ícono de alerta (`BellPlus`, `text-[#F59E0B]` en "Leads de Alerta") es un color de **estado** (pendiente/advertencia), no de navegación — se conserva ámbar a propósito, no es parte de este fix. Si se vuelve a ver ámbar/naranja en el nav activo del admin, es una regresión de este fix.
