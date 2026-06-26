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

**Fuentes a cargar (Google Fonts):** Anton, Oswald (400–700), Playfair Display (ya está), Inter (ya está).

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
- **Scrim:** nunca una caja plana. Usa degradado lineal direccional desde donde está el texto: `linear-gradient(to top, rgba(20,32,26,0.72) 0%, rgba(20,32,26,0.25) 45%, transparent 75%)` para texto abajo-izquierda. El degradado usa `forest-dark`, no negro puro, para que los verdes de la foto sigan vivos.
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
