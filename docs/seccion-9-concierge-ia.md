# Sección 9 — Concierge IA con RAG (Decisión: PARKED)

**Última actualización:** 5 junio 2026
**Estado:** ⛔ NO CONSTRUIR TODAVÍA — parqueado hasta cumplir el TRIGGER (ver abajo)

> **Nota sobre `generate-park-content` (2026-06-05):** Se creó la Edge Function
> `generate-park-content` como pipeline de pre-generación de contenido editorial en
> español para los ~63 parques nacionales. Esto NO es el concierge RAG — es un paso
> previo: rellena campos textuales de `destinations` (`title`, `short_description`,
> `why_visit_markdown`, `difficulty_description`, `best_season`, `season_to_avoid`,
> `meta_title`, `meta_description`) con drafts en voz Nomaderia para que Frank los
> revise en `/admin/destinations`. Los drafts alimentan indirectamente el RAG futuro
> porque `ingest-knowledge` indexa esos campos (especialmente `why_visit_markdown`
> y `short_description`). Columna `research_status` added: `pendiente` →
> `ai_draft` → (Frank lo revisa) → `revisado` / `is_published = true`.

> **Para AI agents (Claude / Gemini / Copilot):** Si el usuario pide construir el
> concierge IA, RAG, embeddings, vectorizar tablas, pgvector, tool-calling o el modelo
> de permisos, primero verifica el TRIGGER de este doc. Si no se cumple, recuerda la
> decisión y redirige a las tareas pendientes de `docs/pending-tasks.md`. No re-litigues
> la arquitectura ni propongas Cohere/scraping/LangChain. Leer este doc completo antes
> de responder sobre IA en Nomaderia.

---

## Por qué está parqueado

El concierge IA es la ventaja competitiva de largo plazo, pero viola las reglas del
propio proyecto si se construye ahora:

- **Regla de negocio #6:** "Vende antes de construir features."
- **Regla de negocio #3:** "Cobra manual hasta ~15 clientes/mes."
- **Frank = el concierge hoy.** El canal es `buildWhatsAppLink()` en `src/lib/whatsapp.ts`.
  Cada conversación de WhatsApp es el dataset futuro del agente IA.

**Sin clientes reales no hay:** preguntas reales → mal spec de producto. Data de permisos
real → modelo sin calibrar. Conversaciones reales → chunking equivocado.

---

## TRIGGER para des-parquear

Revisar Sección 9 cuando se cumplan **las tres**:

- [ ] ~10–15 clientes pagados reales (no leads — clientes que completaron el pago)
- [ ] Tareas humanas de Sección 8 completas (WhatsApp Business, diploma.jpg, Pixel ID)
- [ ] Corpus de ~50+ preguntas reales de clientes por WhatsApp, guardadas y etiquetadas

---

## Las 5 decisiones de arquitectura (a resolver cuando se des-parquee)

Estas son las preguntas abiertas del documento técnico maestro. No deben responderse
definitivamente sin data real de clientes. Están aquí para no perder el hilo.

1. **¿Qué contenido se vectoriza y con qué modelo de embeddings?**
2. **¿Cómo se garantizan las citas (chunking, scoring, umbral de confianza)?**
3. **¿Qué herramientas expone el agente y cuál es el handoff al humano?**
4. **¿Dónde corre el modelo de disponibilidad de permisos y de dónde sale la data?**
5. **¿Cómo se mantiene el modelo Wizard-of-Oz (revisión humana) mientras el agente asiste?**

---

## Decisiones tomadas (borrador pre-arquitectura)

Estas no requieren clients reales — son decisiones de dirección que simplifican el
diseño cuando llegue el momento.

### Embeddings
- **Modelo elegido: `text-embedding-3-small` de OpenAI.** Barato, rápido, suficiente
  para español editorial. **No Cohere** (argumento cross-lingual solo aplica si ya
  existe un corpus oficial en inglés — no existe y no se va a scrapear).
- **Qué vectorizar (solo capa editorial propia) — IMPLEMENTADO en `ingest-knowledge`:**
  - `destinations`: **ficha de conocimiento completa** por parque — 13 secciones en
    markdown español (`Cómo llegar`, `Costos`, `Mejor temporada`, `Permisos`,
    `Senderos destacados`, `Dónde dormir`, `Seguridad`, `Guía completa`,
    `Itinerario sugerido`, `Equipo recomendado`, `Preparación`, `Dudas comunes`).
    Chunking por sección con `## ` como separador; cada chunk lleva el label
    `# {title} — {region}` al inicio para ser autónomo. `source_field: "ficha"`.
    Metadata por chunk: `slug`, `title`, `section`, `park_code`, `park_title`,
    `section_title`, `is_published`, `last_verified_at`.
  - `gear_articles`: campo `content_markdown` (por sección Markdown) + `products` jsonb (1 chunk por producto).
  - FAQ por destino → cubierto por el campo `common_fears` dentro de la ficha.
- **Decisión de publicación (2026-06-05):** se indexan **todos** los rows de
  `destinations` independientemente de `is_published`. El campo `is_published` se
  almacena en `metadata` para que el concierge pueda desclamer contenido no revisado
  (`is_published: false`) en tiempo de respuesta. Esto permite que los ~63 parques
  ingresados por `ingest-national-parks` sean consultables en draft mientras Opus los
  cura en español.
- **Qué NO vectorizar:** scraping de nps.gov / recreation.gov / CBP. Un chunk
  desactualizado miente con confianza — contradice la marca "revisado por agente TAP".
  Si se necesita info oficial, se enlaza a la fuente, nunca se copia.

### Vector store
- **pgvector en Supabase** — ya está en el mismo proyecto (`vrixiuvnhvqafmxlcyex`).
  Sin infra nueva. Nueva tabla: `knowledge_chunks` con columnas `content text`,
  `embedding vector(1536)`, `source_table text`, `source_id uuid`, `metadata jsonb`.

### Agente
- **Un solo agente con tool-calling.** NO un enjambre multi-agente. NO LangChain.
- El agente **borronea propuestas**; Frank **siempre aprueba** antes de cobrar o
  confirmar. Cero acciones irreversibles automáticas.
- Herramientas tentativas (a refinar con preguntas reales de clientes):
  - `buscar_destino(query)` → similarity search en `knowledge_chunks`
  - `verificar_permisos(destino)` → consulta `destinations.affiliate_links.permit_alert_url`
  - `armar_borrador_itinerario(destino, dias, fitness_level)` → draft en markdown
  - `escalar_a_frank(contexto)` → handoff vía `buildWhatsAppLink()` con contexto prellenado

### Citas
- **Enfoque A: citas visibles al cliente** (link a tu propio contenido en nomaderia.com).
  Encaja con la promesa "honesto y revisado por TAP". El cliente puede verificar.

### Modelo de disponibilidad de permisos (≠ cancelaciones de clientes)
- **Qué es:** predecir *cuándo se liberan cupos* en recreation.gov basado en patrones
  históricos de scraping de disponibilidad. NO es predecir si un cliente cancela
  (imposible sin data de clientes).
- **Por qué es defendible:** es data propietaria que nadie más recolecta en español para
  esta audiencia. Ventaja real si el scraping se hace bien y consistentemente.
- **Condición para construir:** requiere al menos 6–12 meses de scraping histórico
  de recreation.gov *antes* de entrenar. Empezar el scraper simple mucho antes que
  el modelo ML.
- **Stack tentativo:** scraper cron (Supabase `pg_cron` o cron-job.org, ya en
  `pending-tasks.md`) → tabla `permit_availability_log` → modelo clásico (XGBoost /
  Random Forest, no deep learning) → Edge Function de predicción.

---

## Lo que NO vamos a construir (lecciones de la sesión de arquitectura con Gemini)

| Propuesta | Por qué no |
|---|---|
| Cohere `embed-multilingual-v3.0` bloqueado desde el día 1 | Cero pruebas, cero corpus inglés real. Prematuro. |
| Pipeline de scraping masivo de nps.gov / recreation.gov / CBP | Pasivo de mantenimiento. Reglas cambian. Un chunk desactualizado arruina vacaciones. |
| Modelo de predicción de *cancelaciones de clientes* | Requiere data histórica de clientes — hoy hay cero. Confusión con el modelo de disponibilidad de permisos, que es distinto y válido. |
| LangChain / orquestador externo | Over-engineering. Un agente con tool-calling nativo es suficiente. |
| Multi-agente / "enjambre" | Complejidad innecesaria para el volumen actual y previsible. |

---

## Conexión con el stack actual

Cuando se construya, usar los patrones establecidos en `CLAUDE.md`:

- **Fetch de datos:** custom hook `useKnowledgeSearch()` en `src/hooks/` con TanStack Query
- **Edge Function del agente:** `src/supabase/functions/concierge-agent/` siguiendo el
  patrón de `send-quiz-email` (Deno, `Deno.env.get("OPENAI_API_KEY")`)
- **Handoff a Frank:** siempre vía `buildWhatsAppLink()` de `src/lib/whatsapp.ts`
- **UI del concierge:** componente en `src/components/` (NO en `src/pages/`), sin
  librerías UI adicionales (shadcn + Framer Motion cubren todo)
- **Tipos:** regenerar `src/integrations/supabase/types.ts` con CLI cuando se agregue
  la tabla `knowledge_chunks`
- **Variables de entorno nuevas a agregar:** `VITE_OPENAI_API_KEY` (o mejor: clave solo
  en Edge Function, no expuesta al frontend)

---

## Nota sobre el Chatbot WhatsApp (pending-tasks backlog)

El backlog en `docs/pending-tasks.md` menciona "Chatbot WhatsApp: integración con
WhatsApp Business API para automatizar mensajes del servicio principal". Eso es una pieza de este puzzle pero
es independiente del RAG — se puede hacer un bot simple de WhatsApp que solo enrute y
prellenee mensajes sin necesitar embeddings. Separar las dos iniciativas.

---

*Actualizar este doc cuando se cumplan los triggers o cuando se tome una decisión
de arquitectura. Guardar en `docs/seccion-9-concierge-ia.md` del repo.*
