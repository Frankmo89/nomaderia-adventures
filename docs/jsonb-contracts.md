# Contratos JSONB — `public.destinations`

> **Fuente de verdad de los contratos de campos `jsonb` en la tabla `destinations`.**
> Todo writer (Edge Function) y todo reader (UI, RAG) deben respetar exactamente estas formas.
> Si un writer produce una forma diferente, **el contrato que manda es este documento** — actualiza el writer, no el contrato.

---

## `common_fears` — `jsonb DEFAULT '[]'`

Preguntas frecuentes / miedos comunes del visitante principiante.

```ts
Array<{
  miedo:     string;  // pregunta en tono natural, ej. "¿Es muy difícil para alguien sin experiencia?"
  respuesta: string;  // respuesta concreta citando condiciones reales del parque
}>
```

**Ejemplo**

```json
[
  { "miedo": "¿Es muy difícil para alguien que nunca ha hecho senderismo?",
    "respuesta": "No. La mayoría de senderos populares en Arches son compactos..." },
  { "miedo": "¿Necesito reservar con meses de anticipación?",
    "respuesta": "El Timed Entry Permit se agota en minutos cuando se libera..." }
]
```

**Writers:**
- `generate-park-content` ✅ — escribe `{ miedo, respuesta }`
- `generate-destination-draft` ✅ — escribe `{ miedo, respuesta }` (corregido 2026-06-06; antes usaba `{ question, answer }`)

**Readers:**
- `DestinationDetail.tsx` — normaliza legacy `{ question, answer }` → `{ miedo, respuesta }` antes de renderizar; silencia filas con ambos campos vacíos.
- `ingest-knowledge` — lee `f.miedo ?? f.question` / `f.respuesta ?? f.answer` (dual-key para compatibilidad con filas pre-2026).
- `AdminDestinationForm.tsx` — espera `{ miedo, respuesta }`.

> **Nota de migración:** filas escritas por versiones anteriores de `generate-destination-draft` pueden tener `{ question, answer }`. Los readers tienen fallback; los writers ya no deben producir esa forma.

---

## `signature_hikes` — `jsonb DEFAULT '[]'`

Senderos destacados del parque.

```ts
Array<{
  nombre:           string;        // nombre oficial, en español si existe
  distancia_km:     number | null; // distancia total (ida y vuelta) en km
  duracion_horas:   number | null; // tiempo estimado en horas
  dificultad:       string;        // "fácil" | "moderada" | "difícil" (en español)
  desnivel_m:       number | null; // ganancia de elevación en metros
  apto_principiante: boolean;      // true si alguien sin experiencia puede completarlo
  nota:             string | null; // 1-2 oraciones con lo único de ESTE sendero en ESTE parque
}>
```

**Ejemplo**

```json
[
  { "nombre": "Delicate Arch Trail", "distancia_km": 4.8, "duracion_horas": 3.0,
    "dificultad": "moderada", "desnivel_m": 147, "apto_principiante": true,
    "nota": "El arco más famoso de EE. UU.; imprescindible al atardecer." }
]
```

**Writers:**
- `generate-park-content` ✅ — escribe este contrato (con coercer `coerceSignatureHike`)

**Readers:**
- `DestinationDetail.tsx` — solo lee `.nombre` (para highlights "Por qué ir"). Seguro con cualquier forma.
- `ingest-knowledge` ✅ — lee todos los campos para construir texto RAG (corregido 2026-06-06; antes leía claves antiguas `distancia`, `tiempo`, `descripcion`).

> **Claves obsoletas** (pre-2026): `distancia` (era string), `tiempo`, `descripcion`, `permiso_requerido`. Ya no deben escribirse. `ingest-knowledge` leerá `null` para esas claves en filas antiguas — no revienta el render.

---

## `lodging_info` — `jsonb DEFAULT '[]'`

Opciones de hospedaje dentro o en las inmediaciones del parque.

### Forma v2 — canónica (writer: `ingest-park-permits`)

```ts
Array<{
  nombre:            string;        // nombre del campground / establecimiento
  tipo:              string;        // "camping" | "lodge" | "hotel" | "hostal"
  precio_usd:        number | null; // tarifa numérica por noche, null si desconocida
  precio_nota:       string | null; // nota textual sobre precio ("Ver Recreation.gov para tarifas actuales")
  dentro_del_parque: boolean;       // true si está ≤20 km del centro del parque
  reserva_url:       string | null; // URL de Recreation.gov — NO inventar
}>
```

### Forma v1 — legacy (writer: `generate-park-content`)

```ts
Array<{
  nombre:           string;
  tipo:             string;        // "hotel" | "lodge" | "cabañas" | "camping" | "glamping" | "hostel"
  rango_precio_usd: string | null; // ej. "$25–$50/noche"
  reserva_url:      string | null;
  notas:            string | null;
}>
```

**Ejemplo v2 (camping, RIDB)**

```json
[
  { "nombre": "Upper Pines Campground", "tipo": "camping",
    "precio_usd": 36, "precio_nota": null,
    "dentro_del_parque": true,
    "reserva_url": "https://www.recreation.gov/camping/campgrounds/232447" }
]
```

**Regla de coexistencia:** `ingest-park-permits` solo escribe entradas `tipo:"camping"` y preserva entradas con `tipo != "camping"` escritas por otros writers. Los readers deben soportar ambas formas.

**Writers:**
- `generate-park-content` ✅ — escribe forma v1 (con coercer `coerceLodgingInfo`)
- `ingest-park-permits` ✅ — escribe forma v2, solo `tipo:"camping"` (añadido 2026-06-07)

**Readers:**
- `HowToGetThere.tsx` (`LodgingOption`) ✅ — soporta v1 y v2 (backward-compat añadido 2026-06-07)
- `ingest-knowledge` (`LodgingInfo`) — lee `reserva_url` (campo presente en ambas formas); ignora campos de precio

---

## `permits_info` — `jsonb DEFAULT '[]'`

Permisos requeridos para senderos, zonas o entradas con horario programado.

### Forma v2 — canónica (writer: `ingest-park-permits`)

```ts
Array<{
  nombre:       string;        // nombre oficial del permiso, ej. "Half Dome Day Hike Permit"
  tipo:         string;        // "timed_entry" | "lottery" | "first_come" | "reserved" | "none"
  cuando_abre:  null;          // SIEMPRE null — nunca inventar fechas (ADR-008)
  fecha_limite: null;          // SIEMPRE null — nunca inventar fechas (ADR-008)
  como_aplicar: string | null; // instrucción breve: "Reservar en Recreation.gov", "Lotería en rec.gov"
  url:          string | null; // enlace oficial Recreation.gov — NO inventar
  nota_escasez: string | null; // null (RIDB no provee datos de escasez); completar manualmente
}>
```

**Ejemplo v2**

```json
[
  { "nombre": "Half Dome Day Hike Permit", "tipo": "lottery",
    "cuando_abre": null, "fecha_limite": null,
    "como_aplicar": "Participar en la lotería en Recreation.gov durante el período de inscripción",
    "url": "https://www.recreation.gov/permits/4988808",
    "nota_escasez": null }
]
```

### Forma v1 — legacy (de referencia, nunca se escribió a prod)

```ts
Array<{
  nombre:                  string;
  tipo:                    string;        // "lottery" | "reservation" | "first_come" | "timed_entry"
  dificultad_de_conseguir: string | null;
  cuando_abre:             string | null;
  reserva_url:             string | null;
  notas:                   string | null;
}>
```

> La forma v1 estuvo documentada pero nunca fue escrita a producción (`generate-park-content` no escribe `permits_info`). `ingest-knowledge` lee opcionalmente `p.dificultad_de_conseguir`, `p.reserva_url`, `p.notas` — campos que estarán ausentes en entradas v2, lo que causa degradación suave del texto RAG (sin crash). Actualizar `ingest-knowledge` para leer también los campos v2 es una mejora futura.

**Writers:**
- `generate-park-content` — **NO escribe `permits_info`** (instrucción explícita: no inventar datos de permisos).
- `ingest-park-permits` ✅ — escribe forma v2 (implementado 2026-06-07)

**Readers:**
- `ingest-knowledge` — lee forma v1; degrada suavemente con forma v2 (no crash)
- `DestinationDetail.tsx` — **no renderiza `permits_info` todavía** (pendiente sección UI en backlog)

---

## Reglas generales

1. **`nombre` es la clave obligatoria de cada ítem.** Un objeto sin `nombre` válido se descarta en todos los coercers de `generate-park-content`.
2. **Claves opcionales → `null`, nunca ausentes.** Si un campo no tiene dato, escribe `null` (no omitas la clave del objeto).
3. **URLs:** nunca inventar. Si no se conoce, escribir `null`.
4. **Unidades:** distancias en km, elevación en metros, duración en horas (todos numéricos, sin la unidad en el valor).
5. **Los coercers en `generate-park-content`** (`coerceSignatureHike`, `coerceCommonFear`, `coerceLodgingInfo`) son la última línea de defensa: descartan ítems malformados en vez de escribir datos corruptos a la DB.
