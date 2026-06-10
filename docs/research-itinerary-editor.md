# Investigación de UX — Editor de Itinerario por Bloques (Admin Mobile)

> **Fecha:** 2026-06-09 · **Método:** Mobbin MCP (iOS), ~5 rondas de búsqueda.
> **Alcance:** SOLO INVESTIGACIÓN. Sin cambios de código.

---

## Contexto del problema

El admin (operador único, a menudo en teléfono) necesita editar itinerarios
estructurados por parque, organizados día a día, donde cada día contiene bloques
de contenido tipados:

| Tipo | Descripción |
|------|-------------|
| `ruta` | Nombre de sendero, distancia, desnivel |
| `comida` | Restaurante, cantina, dónde comer |
| `alojamiento` | Hotel, camping, lodge |
| `traslado` | Cómo llegar, transporte, ruta de acceso |
| `tip_seguridad` | Advertencia, precaución, equipo obligatorio |
| `permiso` | Tipo de permiso, cómo conseguirlo, fechas |
| `costo` | Monto + descripción del gasto |
| `nota` | Texto libre, contexto editorial |

**Stack existente relevante:** dnd-kit ya instalado (`AdminGallery`),
shadcn `Sheet` ya usado (`AdminPermitWindows`), Framer Motion disponible.

---

## Fuentes consultadas en Mobbin

- **Wanderlog** — editor de itinerarios de viaje (iOS)
- **Notion** — editor de bloques mobile (iOS)
- **Tiimo** — planificador por secciones de tiempo (iOS)
- **Linear Mobile** — issue detail con chips de tipo/estado (iOS)
- **Craft** — selector de tipo de bloque con categorías (iOS)
- **TripIt / Pangea** — timeline con columna de tiempo y agrupación por día (iOS)
- **Patrones genéricos:** drag-to-reorder, bottom sheet editor, swipe-to-delete,
  block type picker categorizado

---

## Top 3 Patrones Recomendados

### Patrón 1 — Secciones de día colapsables + FAB para añadir bloque

**Visto en:** Wanderlog (day view), Tiimo (MORNING/AFTERNOON/EVENING sections)

**Cómo funciona:**
- La pantalla principal muestra los días como secciones con encabezado grande
  (`Día 1`, `Día 2`, etc.) y un chevron para colapsar/expandir.
- El día activo se expande mostrando sus bloques en una lista vertical.
- Los otros días quedan colapsados (solo encabezado visible) — reduce el scroll
  al editar días concretos.
- Un FAB fijo (`+`) en la esquina inferior derecha, accesible con el pulgar,
  añade un bloque al día actualmente expandido.
- Tiimo muestra un `+` también en cada encabezado de sección para añadir
  directamente a ese día/sección sin scrollear al FAB.

**Por qué es el patrón base para nosotros:**
- Se mapea directamente al modelo de datos: `itinerario → días → bloques`.
- Los 8 tipos de bloque caben sin sobrecargar la pantalla; el tipo se muestra
  como icono pequeño al inicio de cada fila.
- Es el patrón que el operador ya conoce si ha visto Wanderlog o apps similares.
- Implementación: lista de días con `Collapsible` de shadcn/ui; `motion.div`
  de Framer Motion para la transición de expand/collapse.

---

### Patrón 2 — Sheet de creación/edición tipada con selector de bloque categorizado

**Visto en:** Wanderlog (block type picker), Craft (categorized block picker),
Notion (block actions sheet), shadcn `Sheet` ya en el proyecto

**Cómo funciona:**
1. Al tocar FAB → abre un **half-sheet** (50 % de altura de pantalla) con el
   selector de tipo de bloque: lista de iconos + etiqueta en filas, agrupados
   por categoría si hace falta.
2. Al seleccionar tipo → el sheet sube a **full-height** y muestra los campos
   específicos de ese tipo (p.ej. `ruta` → campos nombre, distancia, desnivel;
   `costo` → monto, moneda, descripción).
3. Botón `Guardar` / `Cancelar` en el header del sheet. Feedback visual al
   guardar (toast breve).
4. Al tocar un bloque existente en la lista → mismo sheet full-height, pero ya
   con los campos precargados. No hay edición inline en la lista.

**Por qué encaja:**
- Wanderlog usa exactamente este patrón con 10+ tipos de bloque (Place, Note,
  Flight, Hotel, Restaurant, Train…).
- Notion confirma la acción de "Turn into" para cambiar tipo post-creación —
  útil si el operador se equivoca de tipo.
- La `Sheet` de shadcn ya está instalada y probada en `AdminPermitWindows.tsx`;
  no requiere dependencia nueva.
- Los formularios específicos por tipo se implementan con React Hook Form + Zod
  (patrón obligatorio del proyecto), que ya soporta schemas condicionales.

---

### Patrón 3 — Modo Reordenar dedicado con handles ≡ y dnd-kit

**Visto en:** Wanderlog "Edit days and reorder" sheet, drag-to-reorder screens
de SiriusXM/Spotify/TimeTree

**Cómo funciona:**
- Un botón de toolbar (`≡` o "Reordenar") entra en **modo reordenación**:
  el header cambia a `Reordenar / Listo` (Cancel/Done), y cada bloque de la
  lista muestra un handle `⠿` a la derecha.
- El operador mantiene presionado el handle y arrastra. El resto de la pantalla
  sigue siendo estática.
- Al tocar `Listo` → vuelve al modo normal y guarda el nuevo orden.
- SiriusXM muestra un banner instructivo explícito: "Press and drag an item to
  move it" — útil para onboarding del admin.

**Por qué funciona en mobile:**
- El drag inline (sin modo dedicado) es propenso a activarse por error al hacer
  scroll vertical — todos los patrones exitosos separan el gesto de scroll del
  de drag.
- dnd-kit está instalado y ya funciona en `AdminGallery.tsx` con `SortableContext`
  y `DndContext` — reutilizable directamente.
- La misma lógica aplica a reordenar días y a reordenar bloques dentro de un día;
  dos instancias del mismo patrón.

---

## Anti-patrones a Evitar

### 1. Edición inline tipo spreadsheet
Hacer cada campo editable directamente en la fila de la lista (como Airtable
desktop) requiere precisión de tapping que el teléfono no perdona. Siempre usar
un sheet para editar, aunque sea un bloque simple de texto.

### 2. Acciones en hover
"Botón `···` que aparece en hover" no existe en mobile. Todos los patrones
revisados usan: **toque → abre sheet** o **long-press → action menu**.
No diseñar ninguna acción que dependa de hover.

### 3. Drag handles siempre visibles
Clutters la lista. Wanderlog, Tiimo y los patrones de drag-to-reorder solo
muestran los handles en modo reordenación explícito. En el modo de lectura/edición
normal, las filas son compactas: icono de tipo + título + flecha `>`.

### 4. Selector de tipo como `<select>` nativo
Un `<select>` de HTML muestra un picker genérico del sistema que no diferencia
tipos visualmente. Craft, Wanderlog y Notion usan sheets con iconos y etiquetas;
el operador debe poder distinguir `permiso` de `tip_seguridad` de un vistazo sin
leer el texto.

### 5. Todos los campos de un bloque visibles en la lista
La fila en la lista muestra solo lo necesario para identificar el bloque: tipo
(icono), título/resumen corto. El detalle (todos los campos) solo aparece al abrir
el sheet de edición. Linear Mobile confirma este patrón: el issue detail tiene un
header compacto con chips de estado/tipo; el cuerpo completo está en el scroll del
sheet.

### 6. Acción de eliminar sin confirmación ni undo
Swipe-to-delete (visto en TimeTree, MyFitnessPal) es eficiente pero debe mostrar
al menos un toast de deshacer ("Eliminado — Deshacer") como hace Wanderlog al
borrar un día. Sin undo, una eliminación accidental en campo destruye trabajo del
operador.

---

## Preguntas Abiertas para la Fase de Mockup

1. **¿Los itinerarios son plantillas de parque o instancias por cliente?**
   Si son plantillas reutilizables (p.ej. "Yosemite 3 días" aplicado a múltiples
   clientes), necesitamos un modelo de `itinerary_templates` separado de
   `itinerary_requests`. Si son por-cliente, cada request tiene su propio
   conjunto de bloques. Esta decisión cambia el schema de base de datos.

2. **¿Cuál es el set mínimo de campos por tipo de bloque?**
   Necesitamos especificar exactamente qué campos tiene cada tipo antes de
   diseñar los schemas Zod. Propuesta inicial:
   - `ruta` → nombre, distancia_km, desnivel_m, dificultad
   - `comida` → nombre_lugar, tipo (desayuno/almuerzo/cena/snack), notas
   - `alojamiento` → nombre, tipo (camping/hotel/lodge), precio_aprox_usd, notas
   - `traslado` → descripcion, duracion, modo (auto/shuttle/bus/caminar)
   - `tip_seguridad` → texto (un campo de texto largo)
   - `permiso` → tipo, como_conseguir, ventana_fechas, costo_usd
   - `costo` → monto_usd, descripcion
   - `nota` → texto (un campo de texto largo)

3. **¿Se reordenan bloques dentro del día además de reordenar días entre sí?**
   Wanderlog lo permite en ambos niveles. Empezar solo con reorden de bloques
   dentro del día es más simple; reorden de días es añadible después.

4. **¿Cómo se relaciona el block editor con `itinerary_markdown` en `destinations`?**
   La tabla `destinations` ya tiene `itinerary_markdown` (markdown plano). ¿El
   editor de bloques reemplaza ese campo, lo genera automáticamente, o conviven?
   Aclarar antes de crear el schema de `itinerary_blocks`.

5. **¿El operador necesita previsualizar el itinerario tal como lo verá el cliente?**
   Wanderlog tiene una vista "cliente" vs. vista "editor". Si sí, considerar un
   botón "Vista cliente" que renderiza los bloques como markdown o HTML formateado.

---

## Referencias de Pantallas Clave (Mobbin)

| App | Pantalla | Patrón ilustrado |
|-----|----------|-----------------|
| Wanderlog | Day view con stops numerados | Lista por día, tipo icono + thumbnail + FAB |
| Wanderlog | Block type picker sheet | 10+ tipos con iconos, lista vertical en half-sheet |
| Wanderlog | "Edit days and reorder" | Modal con tabs Days/Places, drag handles ≡ |
| Notion | Block actions sheet | Delete / Duplicate / Turn into → / Move to → |
| Tiimo | Day sections (MORNING/AFTERNOON) | Secciones con count badge + chevron + `+` por sección |
| Linear Mobile | Issue detail | Chips de estado/tipo en header, cuerpo expandible |
| Craft | Block type picker | Categorías (LISTS / IMAGE / RICH BLOCKS) con buscador |
| TimeTree | Swipe-to-delete | Swipe izquierda revela botón rojo Delete + undo toast |
