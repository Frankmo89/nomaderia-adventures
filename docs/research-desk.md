# Research Desk — Google Drive bot

> **Estado:** **planned** (parte del content engine, ADR-024 / `docs/ai-roadmap.md`).
> Describe el contrato de reports que el bot de research debe producir en Drive.
> No hay parser en el repo todavía. Cuando exista, **debe tolerar drift pequeño
> de formato** (títulos con guiones distintos, secciones extra, metadata
> parcial) sin tumbar el pipeline.

---

## 1. Propósito

Agentes de research escriben reportes en Google Drive. Esos reportes alimentan
RAG (`knowledge_chunks` / ingest) y luego drafts de artículos, posts y reels.
Frank aprueba antes de publish. Métricas vuelven al loop (planned, Fase 3–4).

## 2. Carpetas de tema (01–07)

Convención de carpetas en Drive (nombres estables; el número es el ID de tema):

| # | Carpeta (sugerida) | Enfoque |
|---|--------------------|---------|
| 01 | `01-parques-socal` | Parques y monumento cerca de SoCal / San Diego |
| 02 | `02-permisos-reservas` | Permisos, loterías, reservation.gov, ventanas |
| 03 | `03-clima-alertas` | Clima, cierres, alertas NPS, incendios |
| 04 | `04-senderos-niveles` | Hikes por nivel (principiante → desafiante) |
| 05 | `05-gear-presupuesto` | Equipo, costos, affiliate-safe facts |
| 06 | `06-logistica` | Cómo llegar, lodging, cell signal, driving |
| 07 | `07-contenido-social` | Ángulos para posts/reels (no hechos volátiles solos) |

Si Drive usa nombres distintos, mapear por el número `01`…`07` en el título del
report (ver §3).

## 3. Formato de report

**Título del archivo / doc:**

```
YYYY-MM-DD | <topic number> | <park or topic> | <headline>
```

Ejemplo:

```
2026-09-24 | 03 | Joshua Tree | Alerta de calor y cierres de trailheads
```

**Cuerpo (Markdown):**

```markdown
## Metadata
- park_codes: josh   # códigos NPS; lista o CSV
- category: alertas  # libre pero estable: alertas|permisos|senderos|gear|...
- valid_from: 2026-09-24
- valid_until: 2026-10-15   # o null si evergreen
- impact: high|medium|low
- affects_itineraries: true|false

## Resumen
2–4 frases en español. Qué pasó y por qué importa a un principiante.

## Hechos
- Hechos verificables, uno por viñeta.
- Fechas, montos en USD, nombres oficiales de trails/permits.

## Qué cambia para clientes Nomaderia
Impacto concreto en itinerarios $49 (desvíos, Plan B, timing, gear).

## Borrador para redes
Copy corto listo para adaptar (IG/TikTok/FB). Sin inventar fees.

## Idea de reel
Hook + 3 beats + CTA suave a quiz / itinerario. Sin promesas médicas/legales.

## Fuentes
- URL oficial (nps.gov, weather.gov, recreation.gov, …)
- Fecha de consulta
```

## 4. Tolerancia del parser futuro

El parser **planned** debe aceptar, sin fallar duro:

- Separadores de título `|` vs `—` vs `-` con espacios irregulares.
- Metadata como lista `- key: value` o como tabla de 2 columnas.
- Secciones renombradas levemente (`## Fuentes` / `## Sources` / `## Referencias`).
- `park_codes` como string único, CSV o lista YAML.
- Reports sin `valid_until` o sin `Idea de reel` (campos opcionales).
- Drift de encoding / smart quotes.

Debe **rechazar o poner en cuarentena** (no publicar) si faltan: título con
fecha, `## Hechos`, y al menos una entrada en `## Fuentes` cuando
`category` sea volátil (alertas, permisos, clima).

## 5. Relación con el código actual

| Pieza | Estado |
|-------|--------|
| Drive bot / sync | **planned** — no hay integración Drive en el repo |
| `ingest-knowledge` + `knowledge_chunks` | Existe (Edge Function + pgvector) |
| `generate-blog-draft` / `generate-gear-draft` | Existe (admin) |
| Verifier pre-publish | **planned** (`docs/ai-roadmap.md` §7) |
| Cola de aprobación Frank | **planned** (hoy: publish manual en `/admin`) |

## 6. Reglas de contenido

- Idioma del report: **español** (audiencia). Fuentes oficiales pueden citarse en inglés.
- No inventar tarifas ni cierres: si no hay fuente, marcar `⚠️ VERIFICAR`.
- USD only. No posicionar CDMX / TJ cross-border como mercado.
- Hechos volátiles llevan `valid_from` / `valid_until` cuando sea posible.
