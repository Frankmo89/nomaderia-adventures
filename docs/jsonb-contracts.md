# JSONB Contracts — Nomaderia Adventures

> Fuente de verdad para los contratos de columnas JSONB en `public.destinations`.
> Cualquier función que escriba a estas columnas debe validar la forma antes de hacerlo.

---

## `signature_hikes` — JSONB (`DEFAULT '[]'`)

**Productor:** `generate-park-content` (v2)
**Consumidor:** `ingest-knowledge` (para embeddings RAG), `DestinationDetail.tsx`

### Forma exacta

```typescript
Array<{
  nombre:          string;        // Nombre del sendero en español o inglés conocido
  distancia_km:    number | null; // Distancia total de ida y vuelta en km
  duracion_horas:  number | null; // Duración estimada en horas
  dificultad:      string;        // "fácil" | "moderada" | "difícil" (libre, en español)
  desnivel_m:      number | null; // Ganancia de elevación en metros
  apto_principiante: boolean;     // true si alguien sin experiencia puede completarlo
  nota:            string | null; // Una línea de contexto (el más icónico, vistas 360°, etc.)
}>
```

### Ejemplo

```json
[
  {
    "nombre": "Delicate Arch Trail",
    "distancia_km": 4.8,
    "duracion_horas": 3.0,
    "dificultad": "moderada",
    "desnivel_m": 147,
    "apto_principiante": true,
    "nota": "El arco más famoso de EE. UU. — imprescindible al atardecer"
  },
  {
    "nombre": "Park Avenue Trail",
    "distancia_km": 3.2,
    "duracion_horas": 1.5,
    "dificultad": "fácil",
    "desnivel_m": 35,
    "apto_principiante": true,
    "nota": null
  }
]
```

---

## `common_fears` — JSONB (`DEFAULT '[]'`)

**Productor:** `generate-park-content` (v2)
**Consumidor:** `ingest-knowledge` (para embeddings RAG), `DestinationDetail.tsx`

> **Nota de migración:** La v1 usaba `{question, answer}`. La v2 usa `{miedo, respuesta}`.
> `ingest-knowledge` lee ambas formas con `f.miedo ?? f.question` / `f.respuesta ?? f.answer`
> para compatibilidad con filas antiguas.

### Forma exacta

```typescript
Array<{
  miedo:     string; // Pregunta o duda real del visitante principiante (primera persona)
  respuesta: string; // Respuesta honesta y concreta en voz Nomaderia
}>
```

### Ejemplo

```json
[
  {
    "miedo": "¿Es muy difícil para alguien que nunca ha hecho senderismo?",
    "respuesta": "No. La mayoría de senderos populares en Arches son paved o compactos, y puedes llegar a las vistas principales caminando menos de 2 km desde el estacionamiento."
  },
  {
    "miedo": "¿Qué hago si me encuentro con un oso?",
    "respuesta": "En Arches los osos son raros. En parques donde sí hay, la regla es: no corras, habla con voz firme, hazte grande y retrocede despacio. Los ataques a humanos son extremadamente infrecuentes."
  },
  {
    "miedo": "¿Necesito reservar con meses de anticipación?",
    "respuesta": "El Timed Entry Permit se agota en minutos cuando se libera (6 meses antes). Usa recreation.gov y activa alertas — Nomaderia Alerta de Permisos hace este trabajo por ti."
  }
]
```

---

## `affiliate_links` — JSONB (`DEFAULT '{}'`)

Esto es de solo lectura para `generate-park-content`.

```typescript
{
  flights_url?:      string;
  hotels_url?:       string;
  insurance_url?:    string;
  permit_alert_url?: string;
}
```

---

## `permits_info` — JSONB (`DEFAULT '[]'`)

Esto es de solo lectura para `generate-park-content` (lo gestiona `ingest-knowledge`).

```typescript
Array<{
  permit_type: string;
  url:         string;
  notes?:      string;
}>
```

---

## `lodging_info` — JSONB (`DEFAULT '[]'`)

Esto es de solo lectura para `generate-park-content` (lo gestiona `ingest-knowledge`).

```typescript
Array<{
  name:    string;
  type:    string;  // "lodge" | "campground" | "glamping" | "hotel"
  url?:    string;
  notas?:  string;
}>
```
