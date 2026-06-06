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

```ts
Array<{
  nombre:           string;        // nombre del establecimiento o campsite
  tipo:             string;        // "hotel" | "lodge" | "cabañas" | "camping" | "glamping" | "hostel"
  rango_precio_usd: string | null; // ej. "$25–$50/noche" o null si se desconoce
  reserva_url:      string | null; // URL de Recreation.gov, sitio oficial, o null — NO inventar
  notas:            string | null; // distancia al parque, temporada, disponibilidad, etc.
}>
```

**Ejemplo**

```json
[
  { "nombre": "Yosemite Valley Lodge", "tipo": "lodge",
    "rango_precio_usd": "$300–$500/noche", "reserva_url": null, "notas": "Única opción dentro del valle." },
  { "nombre": "Upper Pines Campground", "tipo": "camping",
    "rango_precio_usd": "$36/noche", "reserva_url": "https://www.recreation.gov/camping/campgrounds/232447",
    "notas": "Requiere reserva con hasta 5 meses de anticipación." }
]
```

**Writers:**
- `generate-park-content` ✅ — escribe este contrato (añadido 2026-06-06, con coercer `coerceLodgingInfo`)

**Readers:**
- `HowToGetThere.tsx` (`LodgingOption`) ✅ — misma forma
- `ingest-knowledge` (`LodgingInfo`) ✅ — misma forma

---

## `permits_info` — `jsonb DEFAULT '[]'`

Permisos requeridos para senderos, zonas o entradas con horario programado.

```ts
Array<{
  nombre:                  string;        // nombre del permiso, ej. "Half Dome Day Hike Permit"
  tipo:                    string;        // "lottery" | "reservation" | "first_come" | "timed_entry"
  dificultad_de_conseguir: string | null; // ej. "Alta — lotería, 1-2% de prob." o null
  cuando_abre:             string | null; // ej. "Marzo (para temporada mayo–oct)" o fecha específica
  reserva_url:             string | null; // URL de Recreation.gov o sitio oficial — NO inventar
  notas:                   string | null; // alternativas, fechas, cupos, consejos
}>
```

**Ejemplo**

```json
[
  { "nombre": "Half Dome Day Hike Permit", "tipo": "lottery",
    "dificultad_de_conseguir": "Alta — lotería previa al día, ~1-2% de aceptación",
    "cuando_abre": "Marzo (para temporada mayo–octubre)",
    "reserva_url": "https://www.recreation.gov/permits/4988808",
    "notas": "También disponible lotería el día anterior. Máximo 6 personas por grupo." }
]
```

**Writers:**
- `generate-park-content` — **NO escribe `permits_info`** (instrucción explícita: no inventar datos de permisos).
- `ingest-park-permits` — **TODO: función futura**. Cuando se implemente, debe escribir exactamente este contrato.

**Readers:**
- `ingest-knowledge` ✅ — lee este contrato para construir texto RAG
- `DestinationDetail.tsx` — **no renderiza `permits_info` todavía** (pendiente sección UI en backlog)

> **Para quien implemente `ingest-park-permits`:** las claves exactas son `nombre`, `tipo`, `dificultad_de_conseguir`, `cuando_abre`, `reserva_url`, `notas`. No usar `permit_type`, `url` ni otras variantes.

---

## Reglas generales

1. **`nombre` es la clave obligatoria de cada ítem.** Un objeto sin `nombre` válido se descarta en todos los coercers de `generate-park-content`.
2. **Claves opcionales → `null`, nunca ausentes.** Si un campo no tiene dato, escribe `null` (no omitas la clave del objeto).
3. **URLs:** nunca inventar. Si no se conoce, escribir `null`.
4. **Unidades:** distancias en km, elevación en metros, duración en horas (todos numéricos, sin la unidad en el valor).
5. **Los coercers en `generate-park-content`** (`coerceSignatureHike`, `coerceCommonFear`, `coerceLodgingInfo`) son la última línea de defensa: descartan ítems malformados en vez de escribir datos corruptos a la DB.
