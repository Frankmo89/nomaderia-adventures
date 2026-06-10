# Investigación de UX — Vista de Itinerario para el Cliente (Mobile Web)

> **Fecha:** 2026-06-09 · **Método:** Mobbin MCP (iOS), 5 rondas de búsqueda.
> **Alcance:** SOLO INVESTIGACIÓN. Sin cambios de código.

---

## Contexto del problema

Una página web privada (token-protegida) donde el cliente pagador ve su
itinerario personalizado de parque nacional. El cliente típico:
- Hispano residente en EE. UU., 25-45 años, primera vez en senderismo
- Lee en español, opera desde el teléfono
- Tiene miedo legítimo a lo desconocido (permisos, precios, seguridad)
- Necesita sentir que recibió un entregable de agencia premium, no un PDF

La página debe contener: días → bloques por tipo (`ruta`, `comida`,
`alojamiento`, `traslado`, `tip_seguridad`, `permiso`, `costo`, `nota`),
links oficiales (nps.gov / recreation.gov), precios reales con honestidad sobre
volatilidad, y CTAs de reserva afiliada (Viator, etc.) que se sientan como
servicio, no como publicidad.

**Contenido de `common_fears`** (preguntas frecuentes de principiantes, ya en
`destinations.common_fears` como array de `{question, answer}`) debe aparecer
como bloque de seguridad/tranquilización, no enterrado al final.

---

## Fuentes consultadas en Mobbin

| App | Patrón buscado |
|-----|----------------|
| **Airbnb** (Experiences + Trips) | Jerarquía visual, itinerario por día, precios, storytelling |
| **Wanderlog** | Vista de itinerario, nav de días, mapa con pins por día |
| **GetYourGuide** | Precio, trust signals, "About this activity", reviews |
| **AllTrails** | Trail detail: stats, mapa embebido, descripción, CTAs |
| **Hopper** | Presentación honesta de precio + volatilidad + confianza |
| **Trip.com** | Mapa hero + tabs de día, estructura de página completa |
| **Viator** | Itinerario de actividad numerado |
| **Vrbo / TripAdvisor** | "Know before you go", "Expert tips", info pre-viaje |
| **Airbnb "Health & Safety"** | Bloque de seguridad con icono+texto |
| **Nike Run Club** | "Know Before You Go" — checklist de reglas previas |
| **Komoot** | Trail detail: mapa arriba, stats, CTA navigate |
| **Pangea** | Timeline vertical, chips de "Maps" y "Website" por item |
| **Google Maps Timeline** | Timeline con dot izquierdo, tipo de actividad, hora |

---

## Top 3 Patrones Recomendados

### Patrón 1 — Mapa hero estático + nav de días sticky horizontal

**Visto en:** Trip.com (mapa 40% arriba + day tabs), Wanderlog (mapa con pins
por día color-coded), AllTrails (route overlay en mapa), Tripsy (mapa +
bottom sheet del viaje)

**Cómo funciona:**
- La página abre con una imagen/mapa estático del parque (40% de la pantalla),
  mostrando el área o la ruta del primer día con un pin de "Inicio".
- Inmediatamente debajo: título del itinerario en `font-serif` grande
  (Playfair Display) — ej: "Tu Yosemite — 3 días". Debajo: chips de contexto
  pequeños: `● Fácil` / `● 3 días` / `● ~$420 USD total estimado`.
- Una barra horizontal de pills de día (`Día 1`, `Día 2`, `Día 3`) que se
  vuelve sticky al hacer scroll, con el pill activo resaltado en `#D97706`.
  Tap en un pill hace scroll suave hasta esa sección del día.
- Wanderlog usa exactamente este patrón: el mapa codifica cada día con un
  color diferente; los pins numerados corresponden a los stops de ese día.
  Trip.com hace lo mismo con "Overview / Day 1 / Day 2 / Day 3" tabs.

**Por qué es el patrón de entrada para nuestro cliente:**
- El principiante necesita orientación geográfica antes de cualquier texto.
  "¿Dónde estoy yendo?" es la primera pregunta. El mapa la responde en
  medio segundo.
- La nav sticky de días es esencial para un itinerario de 3-5 días — el
  cliente en el Día 2 de su viaje no debería scrollear todo el Día 1.
- Mantiene la página dentro del stack (no requiere Mapbox dinámico si se usa
  un screenshot estático del área del parque — sin costo de tiles, sin
  problema de conectividad en zonas remotas).

**Implementación sugerida:**
- Imagen estática: `<img>` con `object-fit: cover`, altura `40vh`.
  El admin sube la foto del parque (campo existente `hero_image_url`).
- Pills sticky: `position: sticky; top: 0; z-index: 10`, scroll horizontal
  con `overflow-x: auto; scrollbar-width: none`. Framer Motion para scroll
  suave al hacer tap.
- Active pill tracking: IntersectionObserver en cada `<section id="dia-N">`.

---

### Patrón 2 — Timeline vertical con dot izquierdo + tarjetas por tipo de bloque

**Visto en:** Airbnb "Your Itinerary" (dot izquierdo, foto + título + texto +
"Show more"), Pangea (time column izquierda + card derecha + chips Maps/Website),
Google Maps Timeline (dot izquierdo con icono de tipo), GetYourGuide (stat rows
con icono: ✓ Free cancellation, ⏱ Duration, 👥 Guide language)

**Cómo funciona:**
- Dentro de cada sección de día, los bloques se presentan como una lista
  vertical con una línea delgada a la izquierda y un punto de color por
  bloque. El tipo de bloque determina el color del dot y el icono:

| Tipo | Icono | Dot color | Tratamiento especial |
|------|-------|-----------|---------------------|
| `ruta` | 🥾 | `#166534` (secondary) | Stats chip: distancia + desnivel |
| `comida` | 🍽 | `#D97706` (primary) | — |
| `alojamiento` | 🏕 | `#4B5563` | "CHECK IN" badge si aplica |
| `traslado` | 🚗 | `#6B7280` | Duración + modo de transporte |
| `tip_seguridad` | ⚠️ | `#B45309` | Fondo `#FEF3C7`, borde izquierdo amber |
| `permiso` | 🎫 | `#D97706` | Link oficial + precio con nota volatilidad |
| `costo` | 💲 | `#4B5563` | Monto grande + descripción pequeña |
| `nota` | 📝 | none | Solo texto, sin dot — bloque editorial |

- Cada tarjeta tiene: icono + título en semi-bold + 2-3 líneas de descripción
  + "Ver más" si el texto es largo.
- Los bloques `tip_seguridad` usan fondo `#FEF3C7` (amarillo muy suave) con
  un borde izquierdo de 3px en `#D97706` — el mismo tratamiento visual que
  Airbnb usa para su sección "Health & safety". Esto hace que el principiante
  los encuentre sin buscarlos.
- Los bloques `permiso` terminan siempre con un CTA de texto puro:
  `→ Verifica en recreation.gov` (link tappable, color `#166534`). Nunca
  presentar el precio del permiso como definitivo (ver Patrón 3).

**Por qué es el patrón correcto para el contenido tipado:**
- Airbnb es la referencia premium exacta: su "Your Itinerary" muestra la
  misma estructura (dot timeline, foto, título, texto, "Show more"). Los
  clientes ya conocen ese mental model.
- El dot de color por tipo permite al cliente identificar visualmente los
  bloques que le interesan (permiso, seguridad) sin leer todo el texto.
- Las tarjetas de `tip_seguridad` con fondo diferenciado reflejan directamente
  el contenido `common_fears` — en lugar de un FAQ enterrado al final, la
  información de tranquilización aparece en el lugar justo donde genera ansiedad
  (junto a la ruta que la causa).

**Implementación sugerida:**
- CSS: `div.timeline-rail` con `border-left: 2px solid #E5E7EB; margin-left: 12px`
  y los dots como `::before` absolute.
- `tip_seguridad` cards: `className="bg-amber-50 border-l-4 border-amber-500"`.
- Texto de bloques: tipografía Inter 15px, line-height 1.6. Títulos de sección
  de día: Playfair Display, 24px.

---

### Patrón 3 — Precios honestos con nota de volatilidad + CTAs afiliados como servicio

**Visto en:** Hopper (precio con predicción + "You should book now" copy +
strikethrough), GetYourGuide ("From $X · Check availability" sticky bar +
"Likely to sell out" badge), Booking.com (strikethrough + descuento visible),
IHG ("Prices may increase if you wait"), Viator (itinerario con "Admission
included" vs "extra" por stop)

**Cómo funciona:**

**Para bloques `costo` y `permiso`:**
```
~$35 USD por vehículo
ℹ️ Este precio puede cambiar · Verifica en nps.gov antes de pagar
```
El precio va en bold Inter 18px. La nota de volatilidad va en `text-muted-
foreground` 12px, con el link en `#166534`. No hay urgency copy ("¡Últimas
plazas!") — eso sería contrario a ADR-008 (cero social proof falso) y a la
voz de la marca.

**Para CTAs afiliados (Viator, Klook, etc.):**
- Aparecen al final del bloque `alojamiento` o `ruta` relevante, nunca como
  elemento flotante ni como tarjeta destacada.
- Formato: botón outlined secundario, texto: `Reservar en Viator →`.
  Color: `border-primary text-primary` (amber outline, texto amber).
- GetYourGuide confirma: la descripción y los trust signals van primero;
  el CTA es consecuencia, no protagonista. Lo mismo aplica aquí.
- Nunca usar la palabra "anuncio" ni poner logos de afiliado prominentes.
  El copy frame es siempre: "te ayudamos a reservar esto".

**Para bloques `permiso` con Recreation.gov:**
- Resaltar como tarjeta especial (fondo `#FEF3C7`, icono `🎫`):
  ```
  Permiso requerido: Yosemite Valley Wilderness
  Temporada: Mayo – Octubre · Precio: ~$10 USD/persona
  Cómo obtenerlo: Recreation.gov (abre hasta 168 días antes)
  ℹ️ Los precios y ventanas de reserva cambian cada temporada —
     verifica en recreation.gov antes de comprar.
  → Ir a Recreation.gov  (link externo, opens in browser)
  ```

**Por qué esta estrategia diferencia a Nomaderia:**

| Competidor | Problema |
|------------|----------|
| AllTrails | No muestra precios de permisos; el usuario descubre la sorpresa al llegar |
| GetYourGuide | Precio estático "From $X" — no advierte sobre cambios de temporada |
| Hopper | Excelente para vuelos; su modelo de predicción de precio no aplica a NPS |
| Viator | "Admission included / extra" — binario, sin contexto de cómo obtenerlo |

**Nuestra posición:** La honestidad sobre precios volátiles + el link a la fuente
oficial no nos hace perder conversiones — nos hace ganar confianza. Un cliente
que descubre un precio distinto al del itinerario y ya tiene el link de
recreation.gov no se siente engañado; un cliente sin ese link sí.

---

## Anti-patrones a Evitar

### 1. Full-screen Mapbox interactivo como hero
Un mapa interactivo en la parte superior (tiles dinámicos, zoom, pan) falla en
zonas con señal débil — exactamente donde está el cliente cuando más necesita
la página (en el parque, antes de empezar la ruta). Usar imagen estática.

### 2. Sticky bottom bar con precio + CTA
Airbnb y GetYourGuide la usan para convertir ventas. Nosotros ya vendimos — la
transacción está hecha. Una sticky bar en la vista del cliente distraería del
contenido y añadiría chrome innecesario. Reservar este patrón para páginas de
venta, no de entrega.

### 3. Rating stars y review counts en el itinerario
GetYourGuide los usa para generar confianza pre-compra. En la vista post-compra
del cliente, las estrellas son ruido. La confianza ya está ganada; lo que
necesita ahora es claridad de información.

### 4. Texto de miedo disfrazado de urgencia
Frases como "¡Los permisos se agotan rápido!" o "Solo quedan X cupos" — el
patrón de Booking.com "We have 1 left". Válido para e-commerce; incompatible
con la voz de marca Nomaderia (honestidad con principiantes, no manipulación).
La nota de volatilidad debe informar, no presionar.

### 5. Bloques de costo enterrados al final
Si todos los costos aparecen al final como "Resumen de gastos", el cliente
construye ansiedad durante toda la lectura sin saber qué va a costar cada cosa.
Poner el costo relevante junto al bloque que lo genera (el `costo` del camping
va junto al bloque `alojamiento` de ese campamento).

### 6. Affiliate CTAs como tarjetas prominentes con logo
"Reservar en" con el logo de Viator en grande → el cliente siente que le están
vendiendo algo dentro del entregable que ya pagó. El patrón correcto (visto en
GetYourGuide para sus propios proveedores) es texto + outline button, integrado
en el flujo del contenido.

---

## Cómo Presentan Precios los Competidores — y Cómo Nos Diferenciamos

| Competidor | Formato de precio | Transparencia sobre cambios | Link oficial |
|------------|------------------|-----------------------------|-------------|
| AllTrails | No muestra precios; solo "Permits required" | ❌ | ❌ |
| GetYourGuide | "From $X per person" sticky bar | ❌ (precio estático) | ❌ |
| Viator | "Admission included" o "extra" por stop | ❌ | ❌ |
| Hopper | Precio actual + predicción + strikethrough | ✓ (para vuelos) | ❌ |
| Trip.com | Precio por noche + desglose | ❌ | ❌ |
| **Nomaderia** | **~$X USD estimado · verifica en [fuente]** | **✓ siempre** | **✓ siempre** |

La columna "Link oficial" es nuestra ventaja más clara: somos la única
entrega que da el link exacto de Recreation.gov / NPS para cada permiso,
con instrucciones de cómo aplicar. Eso convierte el itinerario de un
documento informativo en una herramienta de acción.

---

## Preguntas Abiertas para la Fase de Mockup

1. **¿Token-based o Supabase Auth?**
   La página es privada. ¿El token es un UUID en la URL
   (`/itinerary/abc123xyz`) sin autenticación, o requiere que el cliente
   tenga una sesión de Supabase? La primera opción es más simple de entregar
   (el operador manda el link por WhatsApp), pero es menos segura si el link
   se filtra. Decidir antes de diseñar el flujo de acceso.

2. **¿Conectividad offline?**
   El cliente puede estar en zonas sin señal al consultar el itinerario.
   ¿Necesitamos service worker / PWA para cachear la página? Si sí, la imagen
   del mapa debe ser un asset en vez de tiles dinámicos.

3. **¿Cuántos días tiene un itinerario típico?**
   La nav sticky de días funciona bien para 2-6 días; si hay más de 7 días,
   los pills se vuelven ilegibles. Definir el máximo para diseñar el overflow.

4. **¿El cliente puede compartir la página?**
   "Compartir con mi pareja / familia" es un caso de uso fuerte (logística,
   números de permiso, quién lleva qué). ¿La página pública a cualquier
   portador del link, o solo el cliente original? Impacta la política del token.

5. **¿`common_fears` van por día o al final?**
   La tabla `destinations.common_fears` es un array global de Q&A del destino.
   ¿Cada pregunta relevante se surfea junto al bloque que la genera (ej: la
   pregunta "¿Es difícil conseguir el permiso?" aparece junto al bloque
   `permiso`), o hay una sección "Preguntas frecuentes" al final? La primera
   opción es mejor UX pero requiere que el operador etiquete cada `common_fear`
   con el tipo de bloque al que corresponde.

6. **¿Affiliate links son personalizados por cliente o genéricos?**
   Un link de Viator genérico a la actividad es fácil de insertar. Un link
   personalizado con las fechas del cliente (tracking de conversión) requiere
   que el operador genere el link durante la creación del itinerario. Decidir
   el nivel de personalización antes de diseñar el bloque `alojamiento`.

---

## Referencias de Pantallas Clave (Mobbin)

| App | Pantalla | Patrón ilustrado |
|-----|----------|-----------------|
| Airbnb | "Your Itinerary" scroll | Dot timeline izq., foto, título, "Show more", price bar |
| Airbnb | "What you'll do" | Lista numerada con thumbnails y 1-line desc |
| Airbnb | "Health & safety" | Icono+texto por item, "You must also acknowledge" subheader |
| GetYourGuide | Activity detail | Hero → title → stat rows (✓ Free cancel, ⏱ Duration, 👥 Guide) → reviews |
| GetYourGuide | Availability | Precio desglosado (N adults × $X = $Y), "All taxes included", Book now |
| Hopper | Price prediction | Precio actual + predicción temporal + strikethrough + confidence copy |
| AllTrails | Trail detail | Stats grid, "Show more", mapa embebido, Download/Navigate CTAs |
| Trip.com | Itinerary overview | Mapa 40% + day tabs + itinerary list |
| Wanderlog | Itinerary day view | Sticky day tabs, numbered stops con thumbnails, transit chips |
| Vrbo | "Expert tips" | Tabbed pre-trip info (Get ready / Health & safety / Don't forget) |
| Nike Run Club | "Know Before You Go" | Reglas pre-experiencia en texto limpio, single CTA |
| Viator | Itinerary screen | Numbered list, "Read More", duration + admission status |
