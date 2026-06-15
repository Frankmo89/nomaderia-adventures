# Registro de Decisiones y Lecciones de IA — Nomaderia Adventures

> **Memoria de largo plazo del proyecto.** Cada decisión de arquitectura, pivote
> de negocio o lección técnica dura vive aquí, para que ningún agente vuelva a
> proponer algo que ya descartamos (**AI Drift**).
>
> **Para agentes:** lee este archivo *antes* de proponer cambios. Si una
> propuesta contradice una decisión "Vigente", **detente y avísalo** en vez de
> implementarla. No borres entradas: si una decisión cambia, marca la vieja como
> `Reemplazada` y añade una nueva con el número siguiente.

## Cómo escribir una entrada

Cada decisión es un **ADR** (Architecture Decision Record) corto:

```
### ADR-NNN — Título breve
- **Fecha:** AAAA-MM
- **Estado:** Vigente | Reemplazada (→ ADR-XXX) | Diferida
- **Contexto:** Por qué surgió la decisión.
- **Decisión:** Qué se decidió, en una o dos frases.
- **Consecuencias:** Qué implica para el código / negocio. Qué NO hacer.
```

---

### ADR-001 — Stack congelado
- **Fecha:** 2026-02
- **Estado:** Vigente
- **Contexto:** Riesgo de que agentes propongan "mejoras" de framework que
  fragmentan el proyecto (Next.js para SSR, Vue, Redux para estado, otra librería
  de animación, etc.).
- **Decisión:** El stack es React 18 + TS + Vite + Tailwind + shadcn/ui + Radix +
  Framer Motion + React Router + Supabase + TanStack Query + Zod. Se congela.
- **Consecuencias:** NO proponer Next.js, Vue, Redux ni librerías UI/animación
  adicionales. El estado de servidor se maneja con React Query; el de formularios
  con React Hook Form. Cualquier necesidad nueva se resuelve dentro de este stack.

### ADR-002 — Pivote de mercado: hispanos en EE. UU., USD únicamente
- **Fecha:** 2026-05
- **Estado:** Vigente (reemplaza el enfoque TJ cross-border / CDMX)
- **Contexto:** El enfoque inicial mezclaba Tijuana cross-border, clase media-alta
  con visa, y CDMX vía SEO. Dispersaba el mensaje, el canal de cobro y el
  presupuesto promedio del cliente.
- **Decisión:** Mercado primario = **hispanos residentes en EE. UU.** (SoCal /
  San Diego), 25-45 años, principiantes en senderismo. Moneda: **USD únicamente**.
  Foco en parques nacionales de EE. UU. explicados en español.
- **Consecuencias:** Posicionamiento competitivo vs. AllTrails/Chimani en un solo
  eje: **idioma + audiencia + honestidad con principiantes**. NO reintroducir
  copy, precios o segmentación orientados a TJ cross-border o CDMX como mercado
  primario (pueden existir como secundarios sin reescribir la propuesta de valor).

### ADR-003 — Pivote de precios: 2 productos + bundle, sin MXN
- **Fecha:** 2026-05
- **Estado:** Reemplazada (→ ADR-012)
- **Contexto:** El sistema de 3 tiers por duración (Escapada/Aventura/Expedición)
  con precios duales USD/MXN era difícil de comunicar y de cobrar manualmente.
- **Decisión:** Tres SKUs claros, **USD únicamente**:
  - Alerta de Permisos — **$29 USD** (Stripe Payment Link).
  - Itinerario Personalizado — **$29 USD** (WhatsApp).
  - Solución Completa (bundle) — **$49 USD** (WhatsApp).
- **Consecuencias:** Fuente de verdad en `src/config/pricing.ts`. NO reintroducir
  precios MXN ni los nombres legacy en ningún componente, Edge Function o email.
  *Deuda conocida:* aún quedan referencias MXN/legacy en
  `send-drip-emails/index.ts` y `send-quiz-results/index.ts` (ver pending-tasks).

### ADR-004 — Modelo concierge antes que modelo de contenido
- **Fecha:** 2026-02
- **Estado:** Vigente
- **Contexto:** El SEO + affiliate puro tarda 6-12 meses en generar ingreso. El
  servicio concierge (itinerario armado a mano, cerrado por WhatsApp) puede
  facturar en semanas.
- **Decisión:** Priorizar el funnel de servicio (quiz → WhatsApp → cobro manual)
  por encima de construir más features de contenido, hasta tener flujo de clientes.
- **Consecuencias:** Cada feature nueva se evalúa por cuánto reduce la fricción
  hacia el mensaje de WhatsApp o el pago en Stripe. "Vender antes de construir."

### ADR-005 — WhatsApp es el canal de cierre, no el sitio
- **Fecha:** 2026-02
- **Estado:** Vigente
- **Contexto:** Intentar cerrar la venta dentro del sitio (carritos, checkout
  complejo) añade fricción que esta audiencia (principiantes) no tolera.
- **Decisión:** El sitio califica y educa; la venta se cierra por WhatsApp (o por
  el Payment Link de Stripe en el caso de Alerta de Permisos).
- **Consecuencias:** Todo CTA de servicio pasa por `buildWhatsAppLink(message)`
  con mensaje contextual pre-llenado. No construir checkout propio mientras el
  volumen no lo justifique.

### ADR-006 — Light theme editorial con dos excepciones dark
- **Fecha:** 2026-05
- **Estado:** Vigente
- **Contexto:** El sitio es luminoso y fotográfico (light theme), pero las
  superficies de conversión y el panel interno necesitan otro tono.
- **Decisión:** Todo el sitio usa light theme (`#FAFAFA` / `#1C1917`, primary
  `#D97706`, secondary `#166534`). **Excepciones dark:** `SentinelLanding`
  (`/sentinel`) y el **admin sidebar/layout**.
- **Consecuencias:** No introducir un toggle de tema. No "oscurecer" páginas
  públicas ni "aclarar" Sentinel/admin sin instrucción explícita. Las variables
  `--sidebar-*` en `src/index.css` definen la paleta oscura del admin.

### ADR-007 — Patrón de fetch: hooks+React Query (público) vs. useEffect (admin)
- **Fecha:** 2026-02
- **Estado:** Vigente
- **Contexto:** Mezclar patrones de data-fetching causa inconsistencia y bugs de
  caching.
- **Decisión:** En componentes **públicos**, fetch siempre vía custom hooks de
  `src/hooks/` con TanStack Query. En el **admin**, `useEffect + useState` directo
  con el cliente Supabase (no requiere caching).
- **Consecuencias:** Contenido estático (destinos, gear, blog) usa `staleTime`
  largo (30 min). No introducir `useEffect + fetch` en componentes públicos.

### ADR-008 — Honestidad de datos: cero social proof falso
- **Fecha:** 2026-02
- **Estado:** Vigente
- **Contexto:** La ventaja competitiva es la confianza con principiantes. Un
  testimonio o estadística inventada destruye esa ventaja de raíz.
- **Decisión:** `SocialProof` y los contadores usan estadísticas reales de
  Supabase (`use-stats.ts`). Datos de permisos (`PermitScarcity`) provienen de
  fuentes oficiales (NPS / Recreation.gov).
- **Consecuencias:** Prohibido generar testimonios, reseñas o números ficticios.
  Si no hay dato real, no se muestra el componente.

### ADR-009 — Casts de Supabase por schema drift (deuda controlada)
- **Fecha:** 2026-05
- **Estado:** Vigente (temporal — se resuelve al regenerar tipos)
- **Contexto:** Las tablas `sentinel_leads` y `media_slider` existen en Supabase
  pero faltan en `src/integrations/supabase/types.ts` porque los tipos no se han
  regenerado (falta `SUPABASE_ACCESS_TOKEN` en el entorno del agente).
- **Decisión:** Usar `(supabase as unknown as SupabaseClient).from("...")` como
  puente temporal en `AdminDashboard.tsx`, `SentinelLanding.tsx` y `use-media.ts`.
- **Consecuencias:** NO editar `types.ts` a mano para "arreglarlo". El fix real es
  que Frank regenere los tipos con la CLI (ver pending-tasks). Una vez regenerados,
  eliminar los casts.

### ADR-010 — Concierge con IA (RAG): diferido hasta primeros clientes
- **Fecha:** 2026-05
- **Estado:** Diferida
- **Contexto:** Existe la idea de un concierge IA tipo RAG sobre el contenido de
  destinos. Construirlo ahora desviaría esfuerzo del objetivo inmediato (cerrar
  los primeros clientes — ADR-004).
- **Decisión:** **Parquear** el concierge IA hasta cumplir el TRIGGER definido en
  el documento de trabajo completo → **`docs/seccion-9-concierge-ia.md`** (esa es
  la fuente de verdad; este ADR es solo el registro de la decisión). Dirección ya
  fijada ahí: **un solo agente con tool-calling + `pgvector` en Supabase**,
  embeddings con **OpenAI `text-embedding-3-small`** (NO Cohere), vectorizando solo
  la capa editorial propia (NO scraping de nps.gov/recreation.gov/CBP), sin
  LangChain ni multi-agente. El modelo de *cancelaciones de clientes* queda
  descartado (≠ el modelo de *disponibilidad de permisos*, que sí es válido y
  también diferido).
- **TRIGGER de des-parqueo (las tres):** ~10-15 clientes pagados reales + tareas
  humanas de Sección 8 completas + corpus de ~50+ preguntas reales de WhatsApp.
- **Consecuencias:** No agregar `pgvector`, colas, workers ni SDKs de embeddings
  al stack todavía. Si el usuario pide construir RAG/embeddings/concierge, leer
  primero `docs/seccion-9-concierge-ia.md` y verificar el TRIGGER antes de
  responder. No re-litigar la arquitectura.

### ADR-011 — `lodging_info` y `permits_info`: evolución de contratos JSONB (v1 → v2)
- **Fecha:** 2026-06
- **Estado:** Vigente
- **Contexto:** `ingest-park-permits` introduce un writer nuevo para `permits_info` (antes sin writer) y un writer alternativo para `lodging_info` (antes solo `generate-park-content`). Las formas v1 usan campos string (`rango_precio_usd`, `notas`, `dificultad_de_conseguir`, `reserva_url`); las formas v2 usan campos más precisos (`precio_usd` numérico, `precio_nota`, `dentro_del_parque`, `url`, `nota_escasez`, `como_aplicar`).
- **Decisión:** Adoptar formas v2 como canónicas. Los readers (`HowToGetThere.tsx`) soportan ambas formas con fallback. `ingest-knowledge` degrada suavemente con v2 (no crash; actualización futura). `ingest-park-permits` preserva entradas `lodging_info` con `tipo != "camping"` escritas por otros writers.
- **Consecuencias:** Ver `docs/jsonb-contracts.md` para los contratos exactos. No reintroducir campos v1 en nuevos writers. Completar `ingest-knowledge` para leer v2 cuando se requiera RAG con permisos más completo.

### ADR-012 — Catálogo simplificado: Producto único a $49 USD
- **Fecha:** 2026-06
- **Estado:** Vigente (reemplaza ADR-003)
- **Contexto:** Se detectó que ofrecer múltiples SKUs (Alerta a $29, Itinerario a $29, Bundle a $49) generaba fricción. En `src/config/pricing.ts` se colapsó el catálogo a una sola oferta.
- **Decisión:** Un solo producto: **Itinerario Completo Nomaderia a $49 USD**. Todo CTA de venta, componente visual y Edge Function (emails) debe referenciar exclusivamente este producto.
- **Consecuencias:** No reintroducir SKUs de $29 USD ni modelos separados. Refactorizar las Edge Functions `send-drip-emails` y `send-quiz-results` para eliminar paquetes antiguos y usar solo el producto de $49 USD.

### ADR-013 — `ingest-knowledge`: section-based chunking + regla de exclusión de datos volátiles
- **Fecha:** 2026-06
- **Estado:** Vigente (reemplaza el enfoque "ficha monolítica" de 2026-06-05)
- **Contexto:** El pipeline anterior generaba una "ficha" única por parque y la dividía en secciones genéricas (`section: "Presentación"`, etc.). Esto hacía difícil recuperar secciones específicas por relevancia y mezclaba contenido de distintas secciones en un mismo chunk.
- **Decisión:** Un chunk por sección por parque. Cada sección tiene un `source_field` fijo (`why_visit`, `guide`, `itinerary`, `preparation`, `gear`, `safety`, `getting_there`, `weather`, `accessibility`, `profile`, `hikes`, `lodging`). El prefijo `"Parque: {title} — Sección: {source_field}\n\n"` hace cada chunk auto-contenido. Secciones > ~800 tokens se dividen con ~100 tokens de overlap. **Regla de exclusión de datos volátiles:** `park_live_data` (entrance fees, alerts, campground availability) NUNCA se embebe — sus datos cambian con frecuencia y embeddings obsoletos inducen respuestas incorrectas. Solo se embebe contenido editorial estable de `destinations`.
- **Consecuencias:** `ingest-knowledge` lee únicamente `public.destinations`. No debe leer `park_live_data` en ninguna versión futura sin repensar la estrategia de refresh de chunks. Cuando `content_version` exista en destinations, usarla para omitir parques sin cambios. La columna `section` en metadata se preserva para compatibilidad con `concierge-agent`.

### ADR-014 — `friendly_slug ?? share_token` como identificador canónico de itinerarios de cliente
- **Fecha:** 2026-06
- **Estado:** Vigente
- **Contexto:** Las URLs de itinerario usaban el `share_token` (24 hex chars opaco, ej. `a3f2b1c4d5e6...`). Se añadió `friendly_slug` para URLs legibles (`nomaderia.com/i/maria-yosemite-x8k2`), pero los registros legacy no tienen slug.
- **Decisión:** El identificador público es siempre `friendly_slug ?? share_token`. Todo código que construya una URL `/i/...` usa este patrón. El RPC `get_itinerary_by_token` acepta ambos (`WHERE share_token = p_token OR friendly_slug = p_token`). Colisión entre slugs y tokens es imposible en la práctica: los tokens son hex puro (0-9, a-f, sin guiones) y los slugs siempre contienen guiones.
- **Consecuencias:** No construir URLs de itinerario con `share_token` directamente — siempre ir por el fallback `friendly_slug ?? share_token`. No eliminar `share_token` de la tabla (es el fallback para registros legacy y la fuente de generación del slug en el futuro).

### ADR-015 — RAG: distancia coseno + índice HNSW + upsert leave-last-known-good
- **Fecha:** 2026-06
- **Estado:** Vigente
- **Contexto:** Auditoría RAG reveló dos gaps: (1) `knowledge_chunks` y `match_knowledge_chunks` existían en la DB de producción pero sin migración local → imposible verificar o reproducir el schema; (2) `sync-park-live-data` sobreescribía datos buenos (`alerts`, `entrance_fees`, etc.) con `null` cuando la API fallaba parcialmente.
- **Decisión:** (1) Migración `20260614000002_create_knowledge_chunks.sql` documenta el schema y agrega índice HNSW con `vector_cosine_ops` (métrica coseno, alineada con `text-embedding-3-small`). (2) El upsert de `sync-park-live-data` solo incluye un campo en el payload si la API que lo sirve no reportó error — preservando el último valor conocido en la DB.
- **Consecuencias:** La métrica de distancia es coseno (`<=>`, `vector_cosine_ops`) en toda la cadena (índice, función SQL, modelo de embeddings). No cambiar a L2 (`<->`, `vector_l2_ops`) sin regenerar todos los embeddings. El upsert idempotente hace que una llamada fallida de NPS no borre alertas válidas de parques. Ver `PROPUESTO` en el changelog de la auditoría para cambios de comportamiento pendientes de evaluación (pre-filtro `park_code`, ajuste de `MIN_SIMILARITY`).

---

## Lecciones técnicas (bugs no obvios)

> Entradas cortas. Una lección por viñeta. Sirven para que un agente no repita un
> error ya pagado.

- **RLS de `sentinel_leads`:** la tabla tenía solo `INSERT` para `anon` y faltaba
  política `SELECT` para admin, por lo que el contador del dashboard siempre
  mostraba 0. Fix: política `FOR SELECT TO authenticated USING has_role`. Lección:
  un contador en 0 en el admin suele ser un problema de RLS, no de query.
- **Contraste WCAG AA:** subir `--muted-foreground` de `45%` → `40%` lightness en
  `src/index.css` arregla *todos* los usos de `text-muted-foreground` de una sola
  vez sobre `#FAFAFA` (~4.1:1 → ~5.0:1). Lección: preferir el fix en la variable
  CSS antes que tocar componentes uno por uno.
- **Stripe fallback:** "Alerta de Permisos" caía a `"#"` cuando
  `VITE_STRIPE_SENTINEL_URL` no estaba seteada. Hardcodear el Payment Link real
  como fallback evita CTAs muertos en producción.
