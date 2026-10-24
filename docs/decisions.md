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

### ADR-003 — Pivote de precios intermedio, sin MXN
- **Fecha:** 2026-05
- **Estado:** Reemplazada (→ ADR-012)
- **Contexto:** El sistema de tiers por duración y precios duales USD/MXN era
  difícil de comunicar y de cobrar manualmente.
- **Decisión:** Se simplificó temporalmente el catálogo a un modelo USD-only más
  claro que el esquema legacy por duración. Esa simplificación intermedia quedó
  posteriormente reemplazada por ADR-012.
- **Consecuencias:** La fuente de verdad vigente para pricing es ADR-012. NO usar
  ADR-003 como referencia operativa ni reintroducir precios MXN o nombres legacy
  en componentes, Edge Functions o emails.

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
- **Estado:** Vigente (acotada por ADR-032: compra = Stripe Payment Link; WhatsApp = dudas + entrega/post-pago)
- **Contexto:** Intentar cerrar la venta dentro del sitio (carritos, checkout
  complejo) añade fricción que esta audiencia (principiantes) no tolera.
- **Decisión:** El sitio califica y educa; la venta se cierra por WhatsApp.
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
  Supabase (`use-public-stats.ts`). Datos de permisos (`PermitScarcity`)
  provienen de fuentes oficiales (NPS / Recreation.gov).
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
  *(2026-09-26: `media_slider` ya está en `types.ts`; se quitó el puente de
  `use-media.ts` y `AdminGallery.tsx` — ADR-027. Si un puente hace falta, usar
  `SupabaseClient`, **nunca** `ReturnType<typeof createClient>`.)*
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
- **Contexto:** Se detectó que ofrecer múltiples SKUs y precios de entrada generaba fricción. En `src/config/pricing.ts` se colapsó el catálogo a una sola oferta.
- **Decisión:** Un solo producto: **Itinerario Completo Nomaderia a $49 USD**. Todo CTA de venta, componente visual y Edge Function (emails) debe referenciar exclusivamente este producto.
- **Consecuencias:** No reintroducir precios de entrada retirados ni modelos separados. Refactorizar las Edge Functions `send-drip-emails` y `send-quiz-results` para usar solo el producto vigente de $49 USD.

### ADR-013 — `ingest-knowledge`: section-based chunking + regla de exclusión de datos volátiles
- **Fecha:** 2026-06
- **Estado:** Vigente para `ingest-knowledge` (reemplaza el enfoque "ficha monolítica" de 2026-06-05). La regla "nunca embeber datos volátiles" queda **reemplazada por ADR-036** para páginas oficiales NPS, que sí tienen estrategia de refresh.
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

### ADR-016 — Concierge: pre-filtro `park_code` en SQL + alias de live-data + escalación que respeta datos en vivo
- **Fecha:** 2026-06
- **Estado:** Vigente (aplica el PROPUESTO (a) de ADR-015; deja (b) `MIN_SIMILARITY` SIN cambios a propósito)
- **Contexto:** Pruebas manuales del concierge en producción mostraron que escalaba a WhatsApp en la mayoría de preguntas aunque la respuesta existiera. Diagnóstico (verificado contra la DB de producción, no asumido):
  1. **Starvation de chunks:** `match_knowledge_chunks` devolvía los chunks globalmente más cercanos y el Edge Function post-filtraba por `park_code`; los parques cuyos chunks no entraban en el top-N global quedaban sin chunks → escalación.
  2. **Escalación ciega:** el concierge escalaba ante chunks vacíos e ignoraba el bloque de datos en vivo (`park_live_data`) ya inyectado en el contexto.
  3. **Linkage seki/kica:** la guía de Sequoia (`slug=sequoia-kings-canyon-national-parks`) tiene `park_code=seki` y SÍ alcanza su fila de live-data (tarifas $35 vehículo + $100 no residente). Pero la guía de Kings Canyon (`slug=kings-canyon-national-park`) tiene `park_code=kica`, cuya fila en `park_live_data` está **vacía** — NPS trata Sequoia & Kings Canyon como un solo parque "seki". **No existe ningún `park_code=sequ`** en la DB (la hipótesis inicial "sequ" era incorrecta).
- **Decisión:**
  - **Pre-filtro en SQL:** migración `20260614000003_match_knowledge_chunks_park_filter.sql` añade el parámetro `filter_park_code text DEFAULT NULL`. `NULL` = búsqueda global (comportamiento previo); un código = `AND kc.metadata->>'park_code' = filter_park_code`. Se hace DROP explícito de la firma vieja de 3 args (de `20260614000002`) antes del CREATE de la de 4 args para evitar overload ambiguo ("function is not unique"). Formato de `park_code` verificado: códigos NPS de 4 chars en minúscula (`seki`, `kica`, `yose`) idénticos en `destinations.park_code` y en `knowledge_chunks.metadata->>'park_code'`.
  - **Alias de live-data (`LIVE_DATA_PARK_ALIAS` en `concierge-agent`):** `kica → seki` (y `sequ → seki` defensivo). SOLO afecta la consulta a `park_live_data`; el retrieval de chunks usa el `park_code` editorial sin cambios. Se eligió un mapa minúsculo en código en vez de columna `nps_code` para no requerir migración de schema + regeneración de tipos (bloqueada).
  - **Escalación que respeta datos en vivo:** los datos en vivo se cargan ANTES del guardrail; se siembra el parque en contexto en el mapa aunque ningún chunk lo aporte; se escala **solo si no hay NI chunks NI datos en vivo**. El bloque DATOS EN VIVO ahora también expone la tarifa de no residentes ($100) además de la de vehículo.
- **Consecuencias:** NO subir `MIN_SIMILARITY` (el problema era *pocos* resultados, no ruido). NO tocar `shouldEscalate` — solo añade el botón "Hablar con Frank" junto a una respuesta real; no oculta la respuesta. Si se re-codifican parques o NPS fusiona otros, extender `LIVE_DATA_PARK_ALIAS`. La migración se aplica pegando el SQL en el editor de Supabase (db push bloqueado).

### ADR-017 — Flujo IA de descubrimiento/borrador de destinos: retirado (catálogo cerrado)
- **Fecha:** 2026-07
- **Estado:** Vigente
- **Contexto:** El catálogo de 63 parques nacionales está completo y congelado — no se agregarán destinos nuevos. El flujo "Destino Inteligente" (`docs/ai-destinos-plan.md`: botón "✦ Descubrir Trending", `discover-trending-destinations`, `generate-destination-draft`, autofill `?candidate=`, tabla `destination_ai_meta`) era peso muerto que un agente podía re-cablear por error.
- **Decisión:** Eliminado del código: panel de descubrimiento en `AdminDestinations`, path de draft en `AdminDestinationForm`, hooks/tipos/card asociados y las 2 edge functions. El breakdown IA del dashboard cuenta solo `ai_content_meta` (gear/blog).
- **Consecuencias:** NO re-implementar descubrimiento/borrador IA para destinos; `docs/ai-destinos-plan.md` es solo histórico. La misma arquitectura **sigue viva y en uso para Gear y Blog** — no tocar `discover-trending-gear/blog`, `generate-gear/blog-draft` ni `_shared/`. `destination_ai_meta` ya no tiene lectores ni escritores: si existe en producción puede droppearse cuando Frank quiera; su migración (`20260601000000`) queda como histórico. Los componentes compartidos `AIDraftProgressOverlay`/`AIDraftSourcesPanel`/`VerifyFieldBadge` se conservan (los usan gear/blog/permit-windows).

### ADR-018 — Contrato v1 de itinerarios es canónico; features tipo Travefy se extienden aditivamente
- **Fecha:** 2026-07-19
- **Estado:** Vigente
- **Contexto:** Un prompt de "fundación del itinerary builder" asumía que `client_itineraries` e `itinerary_templates` eran placeholders vacíos y proponía re-modelarlas a un contrato nuevo en inglés (`days`/`blocks`, status `draft|shared|archived`). La auditoría previa (patrón audit-first) demostró lo contrario: el builder existe desde 2026-06 y está **en producción** — 4 filas reales (3 con links `/i/:token` entregados a clientes), RPC `get_itinerary_by_token`, `ClientItineraryView`, editor admin completo (`ItineraryBlockEditor` con sheet de edición, autosave, undo y DnD) y 5 páginas admin. Re-modelar habría roto los links vivos y violado ADR-014.
- **Decisión:** El contrato JSONB v1 en español (`content.dias[].bloques[]`, tipos `ruta|comida|alojamiento|traslado|tip_seguridad|permiso|costo|nota`, status `borrador|entregado|viaje_activo|completado|archivado`) es **canónico e intocable**: sin renames, sin cambios de tipo. Toda feature nueva estilo Travefy se implementa como (a) campos **opcionales** en el JSONB (p.ej. `extra.reservado`, `extra.confirmacion_ref`, `extra.trail_id`, `dia.fecha`), (b) columnas aditivas en la tabla (`title`, `destination_id`, `show_costs`, `internal_notes` — migración `20260719150000`), o (c) UI pura. Cambios al RPC solo backward-compatible: columnas de retorno aditivas al final; el stripping de costos (`show_costs=false` ⇒ quitar `precio_usd`/`precio_nota` server-side) se añadió sin alterar los campos ya devueltos (verificado por md5 de `content` en los 3 tokens vivos, idéntico antes/después). Tipos canónicos centralizados en `src/types/itinerary.ts` (re-exportados desde `ItineraryBlockEditor` y `use-itinerary` para no romper imports); Zod tolerante (`passthrough`) en `src/lib/itinerary-schema.ts`.
- **Consecuencias:** NO introducir un contrato paralelo en inglés ni una segunda tabla de itinerarios de cliente. Los datos legacy pueden traer extras de `ruta`/`traslado` aplanados en la raíz del bloque (así los lee `/i/:token`); el editor los escribe anidados en `extra` — cualquier consumidor nuevo debe tolerar ambas formas. `show_costs` defaultea `false` para filas nuevas; las pre-existentes se backfillearon a `true` para no cambiar el rendering de links vivos. Precios escritos a mano dentro de `contenido_md` no se pueden strippear — no poner montos en el markdown si se quiere poder ocultarlos. Lección meta: ante un prompt que declare una tabla "placeholder/sin uso", verificar contra la DB viva y el grep del repo ANTES de escribir la migración.

### ADR-019 — Itinerary builder: reorden por menú/sheet, sin drag & drop
- **Fecha:** 2026-07-19
- **Estado:** Vigente
- **Contexto:** El editor de bloques original usaba `@dnd-kit` para reordenar dentro de un día (long-press de 200 ms en touch), y mover un bloque a OTRO día no existía. En mobile —el contexto real de uso de Frank— el DnD táctil compite con el scroll, es difícil de descubrir y frágil con listas largas; el research de patrones (Wanderlog/Mindtrip vía Mobbin, patrón Travefy) mostró que los builders móviles resuelven reordenamiento con controles explícitos, no con arrastre.
- **Decisión:** Todo reordenamiento del builder es por controles explícitos: Sheet "Reordenar" con botones ↑/↓ (pestañas: bloques del día y días completos, con renumeración automática `dia = posición`) y Sheet "Mover a día…" (tap en el día destino, el bloque se agrega al final). `@dnd-kit` se eliminó de `ItineraryBlockEditor`; la dependencia permanece en el repo porque `AdminGallery` la usa. Toda operación destructiva o de movimiento dispara toast con "Deshacer" (snapshot del array `dias` previo en un ref). Guardado por acción explícita (un UPDATE de `content` por acción, sin debounce), con indicador "Guardado" en el header.
- **Consecuencias:** NO reintroducir drag & drop en el builder ni instalar librerías dnd nuevas para él — el reorden por menú/sheet es una decisión de diseño, no una limitación técnica. Si algún día se elimina `AdminGallery` o su DnD, `@dnd-kit` puede desinstalarse (el builder ya no lo importa). Los títulos de día auto ("Día N") se re-sincronizan al reordenar/insertar/borrar días; los títulos personalizados se preservan tal cual.

### ADR-020 — Stats de parque en `/destinos/:slug`: `season_short` aditivo + coordenadas de mapa desde `destinations`, no `park_live_data`
- **Fecha:** 2026-07-20
- **Estado:** Vigente
- **Contexto:** QA de producción de Frank: la celda TEMPORADA de `QuickFactsRow` mostraba el párrafo largo de `best_season` (~40-60 palabras) dentro de una celda de stat angosta, estirando la fila a 2 pantallas en mobile. Por separado, el mapa de senderos (`TrailsSection`) hacía `fitBounds` solo sobre los pines de senderos sincronizados — con pocos pines (rotación de batch, o simplemente pocos `signature_hikes` con coordenadas) el mapa centraba y encuadraba una esquina al azar del parque en vez del parque completo, leyéndose como "zoom absurdo" aunque el número de zoom (12, fijo) nunca cambiaba.
- **Decisión:**
  1. **`season_short`** (columna nueva en `destinations`, migración `20260720000000`) es una etiqueta corta derivada por IA de `best_season` extrayendo meses — `best_season` sigue intacto como texto fuente, ahora relocado a su propia sección "Cuándo ir" (verbatim, sin reescribir). ~35% de los 63 valores quedaron marcados ⚠️ VERIFICAR (IA) por requerir inferencia (ventanas dobles sin rango único, "primavera/verano" sin meses explícitos, eventos puntuales vs. clima general) — ver tabla completa en el changelog de abajo. **La migración quedó escrita pero NO aplicada a producción** a propósito: escribir contenido generado por IA (con ~1/3 marcado incierto) a una tabla live sin que Frank la revise primero viola la instrucción explícita de la tarea ("before this ships"). El código tolera `season_short` NULL/undefined en todo momento (celda oculta, grid se adapta) — aplicar la migración en cualquier momento activa la celda sin requerir otro deploy de código.
  2. **Coordenadas del mapa vienen de `destinations.latitude`/`longitude`, NO de `park_live_data.coordinates`.** La tarea original asumía que `park_live_data.coordinates` (jsonb) tenía el shape correcto y pedía agregarla al `select` de `use-park-live-data.ts`. Verificación contra producción (grep de escritores + `execute_sql`) mostró que **ningún Edge Function escribe esa columna — está NULL en las 63 filas**, mientras que `destinations.latitude`/`longitude` (double precision, columnas viejas y estables) están pobladas para los 63 parques y ya viajan en el objeto `dest` de `useDestinationBySlug` (`select("*")`) sin costo de query adicional. Esto además replica una decisión ya documentada en `use-destinations.ts` (`useDestinationsMapData`, comentario in-line) para el mismo trade-off. `entrance_fee_usd` sí se agregó al select de `use-park-live-data.ts` como pedía la tarea — ese campo sí tiene writer real (`sync-park-live-data`) y está poblado.
  3. **Encuadre del mapa (`TrailsSection.tsx`):** con coordenadas de parque disponibles, `MapContainer` usa `bounds` (no `center`+`zoom` fijo) = un cuadro de ±0.15° alrededor del centro del parque, extendido (`L.latLngBounds.extend`) con cada pin de sendero, con `boundsOptions={{ maxZoom: 11 }}` como tope duro — nunca se acerca más que "escala de parque" aunque haya 1 solo pin sincronizado. Sin coordenadas de parque (NULL), se preserva el comportamiento anterior (promedio de pines + zoom fijo 12) como fallback.
- **Consecuencias:** NO reintroducir `park_live_data.coordinates` como fuente de coordenadas sin verificar primero que algún Edge Function la escriba — a 2026-07-20 sigue siendo una columna fantasma en el schema (documentada así en `docs/supabase-schema.md`). Antes de dar por buenos los 63 valores de `season_short`, Frank debe revisar la tabla del changelog y aplicar la migración (pegar el SQL en el editor de Supabase — mismo patrón que ADR-018/ADR-016, `db push` bloqueado) + regenerar tipos. El patrón "cuadro mínimo + fitBounds + maxZoom" para mapas Leaflet con pocos puntos es reutilizable si aparece el mismo problema en otro mapa del sitio.

### ADR-021 — `park_trails` renombrada a `park_things_to_do`; autocomplete de rutas con dos fuentes (curada + NPS)
- **Fecha:** 2026-07-20
- **Estado:** Vigente
- **Contexto:** La entrada "ALTA PRIORIDAD" de `docs/pending-tasks.md` (2026-07-20) asumía que los datos de `park_trails` estaban mal en la raíz y proponía re-sincronizar desde una fuente distinta. Verificación contra el sync real (`sync-park-trails`, ahora `sync-park-things-to-do`) mostró lo contrario: los datos son un sync legítimo del endpoint `/thingstodo` de NPS (`activity=Hiking`), confirmado por la columna `nps_thing_id` (dedup key propio de NPS) y el patrón `nps_url` (`nps.gov/thingstodo/*`). El problema real era el **nombre de la tabla**: "trails" prometía senderos, pero `/thingstodo` mezcla senderos reales con paseos guiados, programas de guardaparques, remo, ciclismo, miradores, etc. bajo el mismo patrón de URL — de ahí el filtro heurístico STOPGAP por palabras clave en `useParkTrails()` (documentado en el propio código y en `docs/pending-tasks.md`, ahora retirado — ver punto 3 abajo).
- **Decisión:**
  1. **Rename, no re-sync.** Migración `20260720010000_rename_park_trails_to_park_things_to_do.sql` usa `ALTER TABLE ... RENAME TO` (nunca DROP+CREATE) para `park_trails → park_things_to_do` y `park_trails_sync_state → park_things_to_do_sync_state`, preservando las 1,190+ filas, el FK a `destinations`, los índices y las políticas RLS. También renombra los nombres por defecto de PK/FK/UNIQUE y re-registra el cron job semanal (`weekly-sync-park-trails → weekly-sync-park-things-to-do`) apuntando a la Edge Function renombrada.
  2. **Edge Function renombrada:** `supabase/functions/sync-park-trails` → `supabase/functions/sync-park-things-to-do` (vía `git mv`, preserva historial). Lógica interna sin cambios — sigue sincronizando `activity=Hiking` de `/thingstodo`.
  3. **Hook renombrado y filtro heurístico eliminado:** `src/hooks/use-park-trails.ts` → `src/hooks/use-park-things-to-do.ts` (`useParkTrails` → `useParkThingsToDo`). El filtro `looksLikeTrail()` (regex de palabras clave en el título) se retira por completo — ya no hace falta adivinar qué filas son senderos, porque la tabla ya no afirma serlo.
  4. **Autocomplete de bloques `ruta` con dos fuentes, agrupadas visualmente:** el combobox del itinerary builder (`SuggestTitleField` en `ItineraryBlockEditor.tsx`) ahora combina `destinations.signature_hikes` (contenido editorial curado a mano, hook nuevo `useSignatureHikes`) bajo el encabezado "Senderos curados", y `park_things_to_do` (sync NPS sin curar, hook `useParkThingsToDo`) bajo "Otras actividades NPS". Las dos fuentes tienen naturaleza distinta y **no se mezclan silenciosamente** — el encabezado deja claro cuál es cuál. Un sendero curado no tiene id de tabla propio: al seleccionarlo, `extra.trail_id` queda `null` (solo se precargan título/distancia/desnivel/nota); una actividad NPS sí persiste su `id` real en `extra.trail_id`, como antes.
  5. **Sin `cmdk`/shadcn `Command`:** el plan original pedía "CommandGroup, patrón shadcn Command estándar", pero ese componente no existe en el repo (`src/components/ui/command.tsx` ausente, `cmdk` no es dependencia) — instalarlo violaría ADR-001 (stack congelado, prohibido instalar librerías UI adicionales). Se extendió el combobox ligero ya existente (`Input` + lista filtrada client-side, sin dependencias nuevas) para renderizar encabezados de grupo, en vez de agregar `cmdk`.
  6. **Bridge de tipos (mismo patrón ADR-009):** `src/integrations/supabase/types.ts` no se edita a mano — sigue teniendo la tabla bajo la clave vieja `park_trails` hasta que Frank aplique la migración y regenere tipos. El hook `use-park-things-to-do.ts` usa el mismo bridge que `use-media.ts` (`supabase as unknown as ReturnType<typeof createClient>`) para que `.from("park_things_to_do")` compile mientras tanto.
- **Consecuencias:** NO reintroducir el filtro heurístico de `useParkTrails` — la razón de ser (tabla mal nombrada) ya no existe. NO instalar `cmdk` ni el componente shadcn `Command` para este ni otros autocompletes sin una excepción explícita a ADR-001. Al aplicar la migración `20260720010000` y regenerar tipos, quitar el bridge cast de `use-park-things-to-do.ts` (mismo ciclo de vida que ADR-009). Si se agregan más autocompletes con múltiples fuentes en el builder, replicar el patrón de `group` en `Suggestion`/`SuggestTitleField` en vez de crear un componente de combobox nuevo.

### ADR-022 — Rutas SPA fallback necesitan los mismos headers no-cache que `/`
- **Fecha:** 2026-07-26
- **Estado:** Vigente
- **Contexto:** Incidente en producción: `nomaderia.com/admin` mostraba página en blanco con error `'text/html' is not a valid JavaScript MIME type`, reproducible incluso en incognito. Investigación descartó primero la hipótesis obvia (PR #153 sin mergear) — el mismo contenido de `public/_headers` ya estaba en `main` desde el commit `2404058`, y los headers en vivo para `/` ya eran correctos (`no-cache, no-store, must-revalidate`, `cf-cache-status: DYNAMIC`). El hallazgo real: `curl -I https://nomaderia.com/admin` devolvía `Cache-Control: public, max-age=0, must-revalidate` — el default de Cloudflare Pages para el fallback SPA — mientras que `/` y `/index.html` sí recibían la regla custom. Confirmado también que un build local fresco ya no contiene el chunk `index-BMIzDE9w.js` que la producción actual sigue sirviendo: el próximo deploy dejará huérfanas las referencias a ese chunk en cualquier HTML cacheado de rutas cliente.
- **Decisión:** Las reglas de `_headers` en Cloudflare Pages hacen match contra la ruta **solicitada**, no contra el archivo que Cloudflare termina sirviendo tras el rewrite de `_redirects` (`/* /index.html 200`). Por eso reglas literales como `/` e `/index.html` NO cubren rutas cliente (`/admin`, `/admin/*`, `/i/:token`, `/destinos/:slug`, etc.) que también reciben el contenido de `index.html` vía ese rewrite. Se reemplazaron las dos reglas literales por una sola `/*` con `Cache-Control: no-cache, no-store, must-revalidate`, dejando que las reglas más específicas (`/assets/*`, `/favicon.ico`, `/manifest.webmanifest`, `/hero-mask.svg`) sigan ganando por especificidad, como ya ocurría antes.
- **Consecuencias:** Cualquier regla de `_headers` pensada para "la página HTML" debe escribirse contra `/*` (o excluir explícitamente los paths estáticos), nunca solo contra `/` e `/index.html` — de lo contrario cualquier ruta cliente nueva queda con el `Cache-Control` default de Cloudflare Pages. Pendiente como PR separado: acotar el catch-all de `_redirects` para que un chunk `/assets/*.js` ya borrado devuelva 404 real en vez de `index.html` con 200 (ver `docs/pending-tasks.md`).

---

### ADR-023 — CI: retry en deploy de Edge Functions; retiro del workflow de GitHub Pages
- **Fecha:** 2026-07-27
- **Estado:** Vigente
- **Contexto:** Dos hallazgos al auditar `.github/workflows/`. (1) `deploy.yml`
  ("Deploy to GitHub Pages") es un remanente de antes de la migración a
  Cloudflare Pages — no referenciado en ningún doc ni otro workflow, y sin
  relación con cómo se sirve producción hoy. (2) Una corrida manual de
  `deploy-edge-functions.yml` (run `30236052876`, 2026-07-27) falló 5 de 21
  funciones (`generate-blog-draft`, `send-drip-emails`, `send-welcome-email`,
  `unsubscribe`, `check-permit-alerts`) con `Import '...esm.sh/@supabase/
  supabase-js@2.48.0' failed: 522` — `supabase functions deploy` resuelve
  imports remotos de esm.sh al momento del bundling, y un 522 transitorio de
  esm.sh tumbaba el deploy de una función sana. Nota aparte: las fallas de
  `deploy.yml` desde el 2026-07-26 eran en realidad la cuenta de GitHub
  bloqueada por facturación (afecta a todos los workflows por igual), no un
  bug propio del workflow — igual se retiró por apuntar a un target que no se
  usa.
- **Decisión:** Se eliminó `deploy.yml` (PR #166). Se agregó retry con
  backoff (hasta 3 intentos, 10s/20s) alrededor de cada `supabase functions
  deploy` en `deploy-edge-functions.yml`, para que un 522 transitorio de
  esm.sh no cuente como fallo real (PR #167).
- **Consecuencias:** Producción sigue siendo exclusivamente Cloudflare Pages
  (ADR ya implícito en `CLAUDE.md` — no había ADR explícito para esto antes).
  Si `deploy-edge-functions.yml` sigue fallando *después* de 3 intentos por
  función, tratarlo como fallo real (no reintentar más ni subir el cap sin
  evidencia nueva). La cuenta de GitHub estuvo billing-locked el 2026-07-27 —
  verificar que ya no lo esté antes de asumir que el fix de retry se probó en
  producción.

### ADR-024 — Phase 1 AI funnel vía cola de cloud agents
- **Fecha:** 2026-09
- **Estado:** Vigente
- **Contexto:** El funnel de conversión (quiz → ranking → lead → Stripe $49 →
  draft IA → review de Frank → `/i/:token` → emails) debe construirse por
  agentes autónomos sin reescribir auth, pricing, ni queries SELECT existentes.
  Hacía falta una cola explícita y reglas always-on para evitar AI Drift y PRs
  monolíticos.
- **Decisión:** Phase 1 se ejecuta como tasks `T01`–`T11` en
  `docs/agent-queue.md`, una task = un branch = un Draft PR. Reglas alwaysApply
  en `.cursor/rules/nomaderia.mdc`. Migraciones solo aditivas (Frank pega SQL);
  Edge Functions requieren confirmación de `deploy-edge-functions.yml`. Phase 2
  (closure alerts, assistant in-page, botones WhatsApp) queda fuera de la cola.
- **Consecuencias:** Agentes deben leer `CLAUDE.md` + `docs/agent-queue.md`
  antes de codear; marcar DONE solo en su rama; listar FRANK: en PR +
  `pending-tasks.md`. No inventar tablas que ya existen bajo otro nombre
  (`admin_events` ≠ `events`; builder manual ≠ drafts post-pago). No tocar
  `supabase.auth`, `has_role`, config de precio/producto Stripe, ni SELECTs
  existentes.

### ADR-025 — Quiz ranking wire + client UUID leads + quiz-preview
- **Fecha:** 2026-09
- **Estado:** Vigente
- **Contexto:** T05 necesita top-3 del ranker híbrido (T03), preview IA gratis
  con datos NPS reales, y un `lead_id` estable para Stripe (T06) sin dar a
  anon SELECT sobre la fila del lead.
- **Decisión:**
  1. Bridge `quiz-ranking.ts` + catálogo estático `ranking-catalog.ts` (parks.csv)
     mapea `destinations.park_code` → `RankingPark`; `use-quiz.fetchResults` llama
     `rankQuizDestinations` (ya no el scorer heurístico).
  2. Tabla nueva `leads` (no reusar `sentinel_leads`/`quiz_responses`): RLS igual
     que `events` (INSERT público, SELECT solo `has_role` admin). El browser
     genera `id` con `crypto.randomUUID()` y **nunca** hace SELECT del lead.
  3. EF `quiz-preview` reutiliza `OPENAI_API_KEY` + gpt-4o-mini + patrón de
     `park_live_data`/alias de `concierge-agent`. Tarifas y alertas salen de NPS
     live; si `alerts` es null, el copy lo dice — no se inventa un número.
- **Consecuencias:** T06 puede pasar `lead_id` a Stripe `client_reference_id`
  sin leer la DB. Frank pega el SQL y deja que `deploy-edge-functions.yml`
  despliegue `quiz-preview` (mismo secreto OpenAI). Cast ADR-009 en inserts a
  `leads` hasta regenerar tipos.

### ADR-026 — Motor de ranking vendorizado por script con pin a commit (no copia a mano, no npm)
- **Fecha:** 2026-09
- **Estado:** Vigente (reemplaza el punto 1 de ADR-025 y el enfoque "port" de T03)
- **Contexto:** T03 portó a mano `Frankmo89/us-parks-recommender` a
  `src/lib/ranking.ts` + `ranking-catalog.ts`. En días ya había derivado del
  upstream (filtro duro de mes vs. penalización suave, un bioma por parque vs.
  multi-bioma en 21/63, tags distintos en 33/63, IDF sobre subset, sin
  tie-break/`tie_groups`, sin validación, `match_percent` inventado 40–100).
  Upstream ahora publica un contrato (`docs/engine-contract.md`), un port TS
  puro sin dependencias (`ts/src/engine.ts`), un export versionado
  (`web/engine_data.json` con `engine_version` + `content_hash`) y fixtures de
  paridad Python (`data/engine_fixtures.json`). Hay dos runtimes consumidores:
  Vite/npm (quiz) y Deno (Edge Functions, imports por URL/relativos, sin
  `deno.json`/`npm:`). Opciones evaluadas: (a) paquete npm — exige publicar
  desde upstream (`ts/` es `private`, sin build/tags/release), `npm:` en Deno
  se resuelve en deploy (misma fragilidad que ADR-023) y dos mecanismos de
  resolución distintos; (b) vendorizar por script con pin. Se descartó también
  importar `engine.ts` por URL raw de GitHub (solo Deno; fetch en deploy).
- **Decisión:** (b). `scripts/sync-engine.ts` (tsx, sin deps nuevas) descarga
  `ts/src/engine.ts` **byte a byte**, `web/engine_data.json` (emitido como
  `engine-data.generated.ts` para que Vite y Deno lo importen igual, sin
  `resolveJsonModule`/import attributes) y `data/engine_fixtures.json`, y
  escribe `supabase/functions/_shared/engine/engine.lock.json` con
  `upstream_commit`, `engine_version`, `content_hash` y sha256 por archivo.
  **Una sola copia**, en `_shared/engine/` (la importan las EF por ruta
  relativa) con alias `@engine` para Vite/Vitest/tsconfig. Mismo patrón que
  `build-soul.ts`. El adaptador `src/lib/quiz-ranking.ts` no puntúa nada:
  mapea respuestas → `TripProfile`, acota el catálogo a destinos publicados
  **conservando `vocab.tag_idf`/pesos** del export (scores idénticos a los
  fixtures), usa `match_percent` del motor tal cual, traduce `facts`/`breakdown`
  a chips en español y relaja una vez el radio de manejo si vacía el catálogo
  (§3). **Sin overrides** del catálogo desde `destinations` (lat/lon,
  `requires_permit`): editar el catálogo es cambio breaking del motor.
  `quiz-preview` re-corre el motor server-side sobre los mismos candidatos y
  solo cita hechos del motor si devolvió el parque elegido (§6.1);
  `InvalidProfileError` → 400. Detección de bumps: (1) nada cambia sin un
  commit que mueva el lock; (2) `engine-upstream-check.yml` compara el pin con
  upstream `main` cada semana y mantiene un issue `engine-upstream`;
  (3) `SUPPORTED_ENGINE_VERSION` en el adaptador + guard Vitest fallan hasta
  que un humano relea CHANGELOG/contrato y lo suba; (4) `engine_version` viaja
  en eventos (`quiz_results_ranked`, `quiz_completed`) y en la respuesta de
  `quiz-preview` (`engine_mismatch` marca skew Cloudflare vs. EF). `ci.yml`
  corre tsc/test/`verify:engine`/build en PRs.
- **Consecuencias:** NO editar nada en `_shared/engine/` salvo el README —
  `npm run verify:engine` re-descarga en el pin y falla ante cualquier byte
  distinto. Para actualizar: `npm run sync:engine -- --to <sha completo>`,
  leer upstream CHANGELOG + contrato, ajustar el adaptador si aplica, subir
  `SUPPORTED_ENGINE_VERSION`, todo en el mismo PR. NO reintroducir un port a
  mano, un catálogo estático ni remapeos del `match_percent`. NO llamar al
  motor con el catálogo completo cuando el producto solo ofrece destinos
  publicados (acotar por `park_code`, nunca recalcular IDF). El texto del
  motor (`why`) es inglés: traducir en presentación, jamás alterar el orden.
  `concierge-agent` (tool-calling §6) es tarea separada — usará el mismo
  `_shared/engine/`.

### ADR-027 — Type check real: tsc por proyecto + `deno check` de Edge Functions, bloqueantes en CI
- **Fecha:** 2026-09-26
- **Estado:** Vigente
- **Contexto:** El gate "tsc debe pasar" (CLAUDE.md regla 6 y `ci.yml`) corría
  `tsc --noEmit` sobre el `tsconfig.json` raíz, que es `"files": []` +
  `references`. Sin `-b`, tsc no sigue references: revisaba **0 archivos** y
  pasaba siempre. Con `-p tsconfig.app.json` aparecían 7 errores latentes.
  Aparte, `supabase/functions/` (Deno) nunca estuvo en ningún tsconfig; un
  `deno check` mostró 6 errores más.
- **Decisión:** `npm run typecheck` = `tsc --noEmit -p tsconfig.app.json && -p
  tsconfig.node.json` (explícito, no `tsc -b`: evita `composite` y archivos
  `.tsbuildinfo`). `npm run typecheck:functions` = `deno check --no-lock
  supabase/functions` (todo el directorio, incl. `_shared` no importado).
  Ambos **bloqueantes** en `ci.yml` desde el PR que los agrega — nunca en modo
  "solo reportar". Deno pineado a 2.9.7 (el `deno check` usa su TS embebido).
  En CI la red se aísla: `deno cache` con 3 reintentos (esm.sh 522, ADR-023) y
  luego `deno check --cached-only`, que no se reintenta. `--no-lock` para no
  crear un `deno.lock` que el deploy de funciones pudiera recoger. Los 13
  errores se arreglaron antes, en commits propios.
- **Consecuencias:** No volver a `tsc --noEmit` a secas en docs/CI. Tipar los
  clientes de las EF con `Database` **no** era el fix (se probó: no resuelve
  ninguno de los 6) y además `types.ts` vive fuera del bundle de funciones —
  si algún día se hace, es un proyecto aparte. Ver lecciones técnicas sobre
  `.returns<T>()` y `ReturnType<typeof createClient>`.

### ADR-028 — Ingesta RAG dirigida por contenido: triggers de `content_version` + webhook por parque
- **Fecha:** 2026-09-26
- **Estado:** Vigente (pendiente de aplicar en prod — ver `pending-tasks.md`)
- **Contexto:** Nada subía `destinations.content_version`, así que una edición
  real de un parque nunca se re-embebía salvo que alguien lo recordara. En
  paralelo, dos webhooks del dashboard (`auto-ingest-destinations`,
  `auto-ingest-gear_articles`) posteaban el payload fijo de
  `supabase_functions.http_request` en **cada** insert/update; `ingest-knowledge`
  ignora ese shape y escaneaba los 63 parques por fila (~1,800 llamadas desde
  junio). El de gear solo disparaba escaneos de destinos: gear no se ingesta.
  Ambos tenían la service key en texto plano en la definición del trigger.
- **Decisión:** Migración `20260926120000_knowledge_ingest_content_triggers.sql`:
  (1) `BEFORE UPDATE` en `destinations` sube `content_version` si cambia alguna
  columna que lee `ingest-knowledge` (si el mismo UPDATE fija la versión a mano,
  gana el valor manual); (2) insert/update/delete en `campgrounds` sube la
  versión del parque padre; (3) trigger propio con `pg_net` que postea
  `{source:"destinations", park_codes:[park_code]}` en INSERT y cuando cambia
  `content_version`, con el JWT leído de Vault (`ingest_knowledge_jwt`); si falta
  el secret, WARNING y sigue — nunca rompe un guardado; (4) se borran los dos
  webhooks del dashboard. Cuando exista ingesta de gear, se le agrega su propio
  trigger con este mismo patrón.
- **Consecuencias:** Las listas de columnas viven en dos lugares (migración y
  `baseSelect`); `src/lib/knowledge-ingest-columns.test.ts` falla CI si divergen
  o si las filas OLD/NEW cambian de orden. El comportamiento (6 escenarios de
  bump + campgrounds + body del webhook + secret faltante) se prueba en el job
  `sql-tests` de CI contra un Postgres 17 desechable con `pg_net`/Vault
  simulados (`scripts/test-sql.sh`). Agregar un campo a la ingesta = agregarlo
  también a la migración (nueva migración `CREATE OR REPLACE`). Re-embeber los
  63 parques completos cuesta menos de 1 centavo (~250k tokens con
  `text-embedding-3-small`), así que el alcance por parque es por higiene, no por costo.

### ADR-029 — Concierge recomienda parques solo vía el motor (tool `recommend_parks`) + revisión de la respuesta
- **Fecha:** 2026-09-26
- **Estado:** Vigente (cumple el contrato upstream `docs/engine-contract.md` §6)
- **Contexto:** El concierge es global (`ConciergeLauncher` en todas las rutas) y
  su bienvenida ofrece ayuda con "los 63 parques". En modo global, "¿qué parque me
  recomiendas…?" se respondía con los 6 chunks RAG más parecidos: el modelo
  elegía y justificaba parques sin el motor (viola §6.1/§6.2). Además los chunks
  `nearby_parks` sugieren otros parques, las tarifas/alertas en caché se daban
  como actuales, y los chunks de cierres/clima de la guía podían citarse como
  datos vivos (§6.4). Todo dependía solo del prompt.
- **Decisión:**
  1. **Herramienta `recommend_parks`** (un solo agente con tool-calling, como fijó
     seccion-9): schema = contrato §1 con enums exactos de `ENGINE_DATA`; el
     modelo llena el perfil, nunca elige parques. El servidor corre `recommend()`
     sobre los destinos publicados (`engineDataForParkCodes`, IDF upstream intacto).
     `InvalidProfileError` → el modelo corrige y reintenta una vez. Resultado
     vacío → el modelo pregunta qué filtro aflojar (§3); **no** se relaja el
     radio de manejo en silencio (a diferencia del quiz).
  2. **Salida del motor en español, sin floats** (`_shared/engine-es.ts`): niveles
     cualitativos del breakdown, `EMPATE TÉCNICO` explícito para `tie_groups`,
     link a la guía y a nps.gov. No hay número crudo que el modelo pueda citar mal.
  3. **Revisión de la respuesta (la garantía real, no el prompt):** el modelo
     devuelve `{answer, parks_mentioned}`; `_shared/park-mentions.ts` además
     escanea el texto (nombres del catálogo + títulos en español, sin acentos,
     alias largos primero; nombres cortos que son palabras comunes — "gran cañón",
     "saguaro", "Montañas Rocosas"… — solo cuentan con el nombre completo).
     Permitidos: parques del motor, la guía abierta (+ parque conjunto seki/kica),
     los que nombró el usuario, y en modo parque los de `nearby_parks`. Si hay
     otro → una regeneración; si persiste → respuesta fija desde el resultado del
     motor (o escalación al quiz — ADR-030 — si no hubo motor). Cuesta ~1 llamada
     extra a OpenAI solo cuando falla la revisión; se aceptó por ser la garantía.
  4. **Datos vivos:** tarifas/alertas en caché se conservan (igual que
     quiz-preview) pero siempre con fecha de verificación + liga de nps.gov;
     "0 alertas" = "NPS no reportaba alertas al {fecha}". Chunks de
     `seasonal_closures`/`zone_closures`/`special_dates`/`weather` van marcados
     como GUÍA EDITORIAL.
  5. **Modo parque** conserva su regla de alcance ("Me enfoco solo en este
     parque") y no recibe la herramienta.
- **Consecuencias:** La respuesta suma `engine_version`, `recommendations[]` y
  `answer_check` (`ok`/`regenerated`/`fallback`, para monitoreo). **Single-turn:**
  el cliente no manda historial, así que "¿y el segundo?" no funciona todavía;
  cuando se agregue historial, re-correr el motor en el servidor, nunca confiar
  en un ranking mandado por el cliente. NO reintroducir recomendaciones desde
  chunks ni quitar la revisión "porque el prompt ya lo dice". Si el motor sube de
  versión, revisar `engine-es.ts` junto con `SUPPORTED_ENGINE_VERSION`.

### ADR-030 — WhatsApp solo para clientes que ya pagaron: el concierge escala al quiz + captura de correo
- **Fecha:** 2026-09-27
- **Estado:** Vigente
- **Contexto:** Decisión de producto: WhatsApp es el canal de cierre para
  clientes que ya pagaron (botón propio en `/i/:token`, ver `ClientItineraryLayout.tsx`),
  no un canal de soporte abierto a cualquier visitante anónimo. El concierge
  (`ConciergeLauncher`, global en todas las rutas excepto `/admin` y `/i/:token`,
  o sea usado **solo** por visitantes) devolvía `whatsapp_url` en tres casos:
  el guardrail de escalación por palabra clave, el fallback sin contexto, y —
  frontend-only, sin pasar por el backend — cualquier mensaje con intención de
  compra (`PURCHASE_INTENT_PATTERN` en `ConciergeChat.tsx`). El caso (A) SCOPE de
  modo parque ("¿qué otro parque me recomiendas?") ni siquiera ofrecía eso: la
  respuesta fija "Me enfoco solo en este parque. Para otras preguntas, Frank
  puede ayudarte." no traía ningún link — un callejón sin salida real.
- **Decisión:** `concierge-agent` ya no construye ni devuelve `whatsapp_url` en
  ningún caso. `escalate: true` ahora viaja con `quiz_url: "/#quiz"` en su lugar
  (guardrail sin contexto, fallback, y el caso SCOPE de modo parque, que el
  modelo ahora marca con un campo nuevo `out_of_scope` en su salida JSON — más
  robusto que comparar el string literal). El frontend (`ConciergeChat.tsx`)
  quita el link persistente "Hablar por WhatsApp" del footer, el CTA de
  WhatsApp por burbuja, y el `PURCHASE_INTENT_PATTERN` que lo forzaba client-side
  (esas palabras — "$49", "itinerario completo" — se suben a la lista de
  `shouldEscalate` del backend, una sola fuente de verdad). En su lugar,
  `EscalationCTA` ofrece un link al quiz (`react-router` `Link`, mismo patrón que
  `BlogPostDetail.tsx`/`GearArticleDetail.tsx`) + un mini-form de captura de
  correo que inserta en `newsletter_subscribers` (`source: "concierge_escalation"`,
  mismo patrón 23505-es-éxito de `NewsletterSignup.tsx`, dispara
  `send-welcome-email` igual). El prompt del sistema deja de prometer "Frank
  puede ayudarte" (regla 3, caso B de modo parque) y suma una prohibición
  explícita: nunca prometer conectar por WhatsApp desde este chat.
- **Consecuencias:** El botón de WhatsApp real para comprar sigue en `/servicios`,
  Navbar, `StickyMobileCTA`, etc. — **sin tocar**, es el funnel de conversión
  vigente (`docs/content-strategy.md`); esta ADR es específica al chat del
  concierge. Si el concierge alguna vez se monta dentro de un contexto
  autenticado (p. ej. una futura cuenta de cliente), decidir ahí si
  `whatsapp_url` reaparece condicionado a esa sesión — hoy no existe tal sesión,
  así que no se construyó ningún chequeo de auth especulativo. `answer_check`
  ahora también se loguea a `public.events` (`concierge_answer_check`, desde
  `use-concierge.ts`, mismo patrón fire-and-forget que `quiz_results_ranked`)
  para monitorear la tasa `ok`/`regenerated`/`fallback` — antes solo viajaba en
  la respuesta HTTP, sin quedar registrado.

### ADR-031 — Quiz: origen por código postal + modo de viaje; mes en vez de fechas; `allow_remote` nunca depende de la ciudad
- **Fecha:** 2026-09-27
- **Estado:** Vigente
- **Contexto:** Nomaderia vende solo a quien vive en EE. UU. El quiz preguntaba
  "¿Desde qué ciudad sales?" con 4 opciones (SoCal "mercado primario", LA,
  resto de EE. UU., "Otro lugar — fuera de EE. UU."): solo SoCal/LA tenían
  coordenadas, con un radio fijo de 12 h, y `allow_remote` salía de la ciudad
  (SoCal → `false`, así que un sandieguino nunca veía Channel Islands ni
  parques de Alaska/Hawái aunque volara). Además pedía fechas exactas y una
  temporada relativa ("en 3 meses") que se convertía a mes con la fecha de hoy.
- **Decisión:**
  1. **Código postal → lat/lon** con la tabla de centroides ZCTA del Census
     (dominio público), en el repo como archivo estático
     `public/data/zcta-centroids-2025.txt` (una línea por ZIP), generada por
     `npm run build:zip-centroids` (nunca a mano; 1 decimal ≈ 11 km). Sin API
     externa: se sirve desde nuestro propio dominio. `src/lib/zip-centroids.ts`
     la pide con `fetch` solo cuando alguien enfoca el campo de ZIP (~570 KB,
     comprimible; `_headers` le da `/data/*` con caché de 1 día). No es un
     módulo JS a propósito: como string literal de 530 KB, `vite build` pasó
     de ~15 s a 6+ minutos (ver lecciones técnicas). ZIP sin ZCTA (apartados postales, p. ej. 90009) → el ZCTA
     numéricamente más cercano del mismo prefijo de 3 dígitos, nunca un
     promedio del prefijo (967xx mezcla Hawái y Samoa Americana). Prefijo sin
     ningún ZCTA (00000, 00501) → error inline, no avanza. Territorios (PR, VI,
     GU, AS) cuentan como EE. UU.
  2. **Modo de viaje** en la misma pantalla que el ZIP (el quiz se queda en 10
     pasos): Manejando (chips 3/6/10 h) → origen + `max_drive_hours`;
     Volando / Todavía no sé → sin filtro de manejo. Manejando desde Hawái o un
     territorio → sin filtro (el motor estima manejo en línea recta e ignoraría
     el océano). Alaska sí conserva el filtro.
  3. **`allow_remote: true` siempre.** El límite de horas decide el alcance, no
     la bandera de remoto. Costo aceptado: un conductor de Anchorage puede ver
     Lake Clark (sin carretera); la revisión de itinerario de Frank lo detecta.
  4. **Mes** ("¿En qué mes piensas ir?", 12 meses + "Aún no sé" = `null`)
     reemplaza fechas y temporada. Las fechas exactas pasan al intake
     post-pago, no al quiz.
  5. **Privacidad:** el ZIP completo y sus coordenadas viven en las respuestas
     (llegan a `leads.quiz_answers`, que el itinerario necesita). `events`
     acepta inserts anónimos ligados a una sesión, así que solo recibe el
     prefijo de 3 dígitos (`zip3`) + `zip_match` — nunca el ZIP completo ni
     las coordenadas (`originAnswerFields`, con test). La política de
     privacidad lista ahora el código postal y su propósito.
  6. `quiz_responses.travel_style` pasa a guardar el modo de viaje
     (`drive`/`fly`/`unsure`); los labels viejos de ciudad se conservan en el
     admin para filas históricas.
- **Consecuencias:** NO volver a derivar `allow_remote` de la ubicación (hay un
  test que recorre ZIPs × modos × horas). NO convertir la tabla en un módulo
  `.ts`/`.json` importado. Para refrescarla: subir `ZCTA_GAZETTEER_YEAR` en
  `src/lib/zip-centroids.ts` (el script y la app leen esa constante; el año va
  en el nombre del archivo) y correr `npm run build:zip-centroids`. La calculadora de presupuesto tenía
  la misma lista de ciudades pero era solo una etiqueta — se elimina aparte, no
  se migra a ZIP.

---

### ADR-032 — Phase 1: cobro en sitio vía Stripe Payment Link (WhatsApp solo para clientes que ya pagaron)
- **Fecha:** 2026-10
- **Estado:** Vigente (acota ADR-005 para el path de compra público; desde 2026-10-16 alineado con ADR-030)
- **Contexto:** El Payment Link $49 ya existía en producción; el sitio seguía cerrando por WhatsApp y `STRIPE_LINK_ITINERARIO_49` era placeholder. Hacía falta vender sin backend nuevo.
- **Decisión:** Todo CTA de **compra** abre el Payment Link live con label `Comprar mi itinerario – $49`. Si el visitante terminó el quiz (lead en `localStorage`), se añaden `client_reference_id` y `prefilled_email`. ~~WhatsApp en superficies públicas es **solo** «¿Dudas? Escríbenos».~~ **[Actualizado 2026-10-16, Frank]** WhatsApp es solo para clientes que ya pagaron. Antes de pagar, los visitantes usan el FAQ (`/#faq`) y, más adelante, el asistente IA cuando apruebe su examen (ADR-035). Ahora coincide con ADR-030. Los links «¿Dudas? Escríbenos» → WhatsApp que siguen en superficies públicas son deuda: ver `docs/pending-tasks.md`. Tras pagar, `/gracias` (noindex) + Success URL en Dashboard. Sin webhook/`orders` en este paso (resto de T06).
- **Consecuencias:** NO volver a poner WhatsApp como botón primario de compra en home/servicios/destinos/quiz. NO tocar price/product Stripe ni auth/queries. Frank debe setear Success URL → `/gracias`. Webhook sigue en T06.



### ADR-034 — Concierge pre-compra: RAG con candado de cifras, correo después de 2 respuestas
- **Fecha:** 2026-10-03
- **Estado:** Vigente (acota ADR-016, ADR-029, ADR-030 y ADR-032 en el chat de visitantes)
- **Contexto:** El concierge ya respondía con RAG + DATOS EN VIVO + motor, pero el launcher no estaba montado y «¿Dudas? Escríbenos» seguía abriendo WhatsApp. No había candado de cifras, ni la frase fija cuando el retrieval queda vacío, ni tope por visitante.
- **Decisión:**
  1. `match_count` 8 y `min_similarity` 0.4 se mantienen en la llamada. Si ningún chunk pasa el umbral, la respuesta es exactamente «Eso no lo tengo confirmado.» — no se llama al modelo y no se contestan tarifas solo con datos en vivo.
  2. Toda cifra de la respuesta del modelo tiene que aparecer en los chunks, en el bloque DATOS EN VIVO o en el texto de la herramienta del motor. Si tras un reintento sigue habiendo una cifra suelta, se sustituye la respuesta por la frase fija. La fuente, la fecha y el «llama al 911» se agregan después, en código.
  3. Calor, agua, fauna, clima y emergencias llevan la orientación del NPS y «En una emergencia, llama al 911».
  4. El correo se pide a partir de la tercera respuesta (`prior_answers >= 2`) y se inserta en `leads` (`quiz_answers.source = concierge`). No va a `newsletter_subscribers` desde el chat.
  5. Cada turno se inserta en `events` (`type = concierge_turn`, pregunta, respuesta, `chunk_ids`) con la service role. Tope: 40 turnos por `session_id` por hora. Si no hay service role, no se bloquea y el navegador registra el turno.
  6. Los CTA «¿Dudas?» de visitantes abren el concierge. WhatsApp queda para quien ya pagó (`/gracias`, `/i/:token`).
- **Consecuencias:** Hay que desplegar `concierge-agent` (no hay migración nueva). Un `session_id` nuevo salta el tope; un límite por IP queda pendiente. El eval en vivo contra el LLM no corre sin la función desplegada y `OPENAI_API_KEY`.


### ADR-035 — Concierge pre-compra detrás de flag; examen en vivo aparte del fixture
- **Fecha:** 2026-10-03
- **Estado:** Vigente (acota el punto 6 de ADR-034)
- **Contexto:** El PR del concierge reemplazaba «¿Dudas? Escríbenos» por el chat antes de tener un examen en vivo contra el modelo desplegado. Mergearlo así dejaría el sitio sin el botón de WhatsApp de dudas.
- **Decisión:** `VITE_CONCIERGE_ENABLED` solo es verdadero con el string `true`. Si no, los CTA de dudas siguen en WhatsApp y `ConciergeLauncher` no se monta. `npm run eval:concierge` sigue siendo el fixture de 30 preguntas, sin modelo. `npm run exam` llama a la función **desplegada**, guarda chunk ids y fuentes, y escribe `eval/report.md`. `eval/` no se sirve, no entra al bundle y está en la lista de ignore de la ingesta. El gold del examen no se edita; si choca con el sitio cuando el flag está on, se anota en «Gold conflicts».
- **Consecuencias:** No encender el flag hasta que Frank acepte el reporte (cero críticos; accuracy 100% en C, E y G; D abstiene ≥90%; coverage ≥80% en A y B). Desplegar con `supabase functions deploy concierge-agent` y correr `npm run exam` con el flag todavía off. CI debe correr `npm run exam` si cambian la función, sus prompts o el harness (el workflow no se pudo pushear: el token no tiene scope `workflow`; el YAML quedó en pending-tasks).

### ADR-036 — Páginas oficiales NPS en `knowledge_chunks` con refresh diario; retrieval bilingüe; tarjetas de seguridad textuales
- **Fecha:** 2026-10-05
- **Estado:** Vigente. **Reemplaza** la regla de ADR-013 "nunca embeber datos volátiles": ahora existe una estrategia de refresh (fetch diario + borrado de lo `live` con más de 7 días). Acota ADR-034 §3 (seguridad) y la fecha del footer.
- **Contexto:** El examen v25 dio NO PASA. El diagnóstico (`eval/diagnosis.md`) mostró que casi todo era falta de datos: los 1,768 chunks venían solo de `destinations`, ninguno de nps.gov, y solo 3 mencionaban la tarifa de no residente. Las preguntas llegan en español y las páginas oficiales están en inglés. Los riesgos (calor, río) no activaban `isSafetyTopic`, y la fecha "verificado" era la de hoy o la de sync, no la del texto citado.
- **Decisión:**
  1. Columnas aditivas en `knowledge_chunks`: `source_url`, `fetched_at` (backfill = `created_at` para los de `destinations`), `park_code`, `kind` (`evergreen | live | safety`). `match_knowledge_chunks` no cambia.
  2. Edge Function `ingest-nps-pages` (solo service_role): baja las páginas del registro `_shared/nps-pages.ts` (tarifas, pases, FAQ de no residente, hiking, condiciones, seguridad, alertas) de jotr, deva, chis, pinn, seki, yose, grca y nps.gov general. Las parte en chunks de 1500 caracteres con 250 de overlap, las embebe con `text-embedding-3-small` y hace upsert con `source_table = nps_pages`. Si una página falla, se queda la última versión buena. Las fuentes son **solo nps.gov**.
  3. Refresh: `pg_cron` `nps-pages-refresh-daily` (11:15 UTC) llama `public.request_nps_pages_ingest()`, que hace un POST por grupo de parque con el JWT de Vault `ingest_knowledge_jwt`. `nps-live-prune-daily` (11:50 UTC) borra `kind = live` con `fetched_at` de más de 7 días. No usa un workflow de GitHub porque el token no tiene scope `workflow`.
  4. Retrieval bilingüe en `concierge-agent`: la pregunta se traduce al inglés, se embeben las dos en una llamada y se llama `match_knowledge_chunks` dos veces con los mismos parámetros (8 / 0.4). Se fusiona por id con la mejor similitud y se aplican el mismo umbral y el top 8. Las tarjetas no compiten en el retrieval. Si la pregunta es de tarifas o pases, una tercera llamada a la misma función con `filter_park_code = 'nps'` reserva hasta 3 lugares del top 8 para las páginas generales (FAQ de no residente, pases), que las páginas de cada parque desplazaban.
  5. Seguridad: nunca se genera libremente. Por parque se guardan tarjetas (`source_table = nps_safety_cards`, `kind = safety`) con un párrafo **textual** del NPS y su traducción fiel; la traducción se descarta si trae una cifra que no está en el original. Si la pregunta tiene intención de seguridad (`isSafetyTopic` o el detector ES por tema), se anexan hasta 2 tarjetas con la página y la fecha de consulta. Si no hay tarjeta: «En una emergencia, llama al 911.» + la página de seguridad del parque.
  6. Fecha: el footer muestra el `fetched_at` de cada fuente citada ("verificado …" para la guía y "consultada …" para nps.gov). Si no hay fuente, no hay fecha. Nunca se pone la fecha de hoy.
  7. Cuentas: la herramienta `calculate` es determinista. Sus operandos tienen que estar en el contexto, en DATOS EN VIVO o ser cantidades escritas en la pregunta. Su salida entra al corpus del candado de cifras. La corrección del candado puede pedir una ronda más de `calculate` (solo esa herramienta). La regla de abstención y el candado no cambian.
  8. El examen (`scripts/concierge-exam.ts`) acepta como no inventada una fecha igual al `fetched_at` de un chunk de la evidencia, y una fecha en español que repite una fecha que el texto NPS da en inglés. También lee `tool_outputs`.
  9. Inmigración: una pregunta legal de inmigración (estatus, visas, quedarse a vivir, deportación) recibe una respuesta fija sin llamar al modelo (`isImmigrationQuestion` / `immigrationAnswer` en `_shared/concierge-guard.ts`). Empieza con "Eso no lo tengo confirmado.", no tranquiliza ni alarma y manda a un abogado de inmigración (NOMADERIA_SOUL: "cedes ante el profesional").
  10. El examen tampoco cuenta como inventada una cifra que el usuario escribió en la pregunta (p. ej. edades). El candado de cifras del agente no cambió.
- **Consecuencias:** Hay 20+1 Edge Functions (`ingest-nps-pages`). Para agregar un parque o una página, se edita `NPS_PAGES` y se despliega `ingest-nps-pages`. `npm run nps:preview` hace un dry run. El fetch de nps.gov puede romperse si cambia el HTML; el extractor busca `h1.page-title` … "Last updated". Si Vault pierde `ingest_knowledge_jwt`, el cron solo deja un WARNING. Cada pregunta hace una llamada extra a gpt-4o-mini para la traducción.

### ADR-037 — Tarifas como datos (`park_fees` / `pass_rules` + `calculate_fees`), diversidad de retrieval, tarjeta de producto, regla estricta del examen
- **Fecha:** 2026-10-05
- **Estado:** Vigente. Amplía ADR-036 (puntos 4 y 7) y la ship rule de ADR-035.
- **Contexto:** Con la regla estricta (un dato equivocado es crítico aunque la cifra aparezca en algún chunk), el re-score de v43 dio 20 críticos, casi todos tarifas: gpt-4o-mini decidía mal quién paga, qué cubre un pase o qué parque cobra la Tarifa de NO-RESIDENTE. Además, 4–5 chunks de una misma página (Half Dome) sacaban del top 8 la regla de dormir en el carro (F10). Las preguntas de producto (G) no tenían fuente.
- **Decisión:**
  1. **Tablas** aditivas (`20261006120000_park_fees_pass_rules.sql`, RLS: lectura pública, escritura solo service_role). `park_fees` tiene una fila por parque (jotr, deva, chis, pinn, seki, yose, grca) con carro, moto, por persona, pase anual del parque, edad mínima que paga, días de validez, `nonresident_fee_on_page`, `on_nonresident_list`, `nonresident_fee`, `parse_ok`, `issues`, `source_url` y `fetched_at`. `pass_rules` guarda America the Beautiful residente ($80) y no residente ($250), más el pase anual del parque, cada uno con su frase textual del NPS (`evidence`).
  2. **Origen y verificación:** las llena `ingest-nps-pages` con el texto de `fees.htm` de cada parque. La Tarifa de NO-RESIDENTE solo aplica si la página del parque lo dice **y** el parque está en la lista oficial de `passes.htm` («At the following national parks…»). Si los dos no coinciden, `parse_ok = false`, se conservan los últimos valores buenos y `calculate_fees` se niega a calcular. Las reglas de cobertura vienen del FAQ `aboutus/nonresident-fees.htm`: el pase cubre al titular y a los pasajeros del carro (o 2 motos); donde se cobra por persona, al titular y a 3 adultos más. Las tablas se refrescan con el mismo cron diario (`nps-pages-refresh-daily`). No hizo falta un job nuevo.
  3. **`calculate_fees`** (herramienta de OpenAI en `concierge-agent`): recibe visitas (`park_code`, `entry` vehicle|motorcycle|on_foot), adultos que viven y que no viven en EE. UU., menores de 16, el pase que ya tienen y `compare_passes`. **El código suma** (`_shared/park-fees.ts`) y devuelve la fórmula, el TOTAL y las FUENTES (URL + fecha de consulta). La salida entra al corpus del candado de cifras. Una revisión determinista contra la pregunta convierte «¿conviene comprar el pase?» en una comparación sin pase. Si la pregunta dice que alguien no vive en EE. UU. y nadie quedó contado como no residente, pide que se rehaga la cuenta. En preguntas de tarifas con parque, el contexto lleva el bloque TARIFAS OFICIALES de la tabla. La tabla o la tarjeta también cuentan como contexto para la regla «sin chunks no hay respuesta». La abstención y el candado no cambian.
  4. **Diversidad:** con todos los candidatos de las llamadas ES y EN (mismo umbral 0.4), el top 8 admite como máximo **2 chunks por fuente** (`source_url`, o la guía de Nomaderia), y los lugares se rellenan con los siguientes candidatos. Se aplica en el código de la función; la SQL no se tocó. Hay tres intenciones de regla (cierres, dormir o pernoctar, permisos). Si la pregunta coincide y hay un parque (nombrado, la guía abierta, o un lugar nombrado que aparece en los chunks), se hace una llamada más a la misma RPC (8 / 0.4) con una consulta fija en inglés y filtrada a ese parque. Se fija el mejor chunk cuyo texto enuncia la regla (máximo 1 por intención).
  5. **Tarjeta de producto** (`_shared/product-card.ts`): es texto fijo tomado de la página viva `nomaderia.com/servicios` (DOM renderizado y respuestas del FAQ, consultada el 5 oct 2026): $49 USD, qué incluye, entrega en 24 a 48 h, una ronda de ajustes, pago con tarjeta en el sitio (Stripe), WhatsApp después de pagar y durante el viaje. Se adjunta a toda pregunta de producto (por detección de intención) y entra al contexto. Si no hay parque en juego, la tarjeta es el único contexto y la única fuente. La constante del link de Stripe no cambió. Si la página cambia, se actualiza este archivo.
  6. Temperatura del chat: 0 (antes 0.3), para que el examen se pueda reproducir.
  7. **Examen:** hay críticos nuevos. `wrong_fee`: en una pregunta de tarifas, la polaridad sí/no contraria al gold, o un total declarado que no coincide con la fórmula del gold. `contradicts_gold`: el juez (gpt-4o) marca una contradicción con el gold. `--rescore` vuelve a calificar `eval/results.jsonl` sin llamar a la función. **Ship rule:** cero críticos; accuracy 100% en C, E y G; D se abstiene ≥90%; coverage ≥80% en A, B y E, y ≥90% en G.
- **Consecuencias:** Para agregar un parque a las tarifas, se agrega a `FEE_PARKS` (y su `fees.htm` a `NPS_PAGES`). Si el NPS cambia el formato de «Private Vehicle — $35.00», la fila queda en `parse_ok = false` (no se inventa) hasta ajustar el parser. Las preguntas con parque y una regla detectada hacen hasta 2–3 llamadas RPC extra.

### ADR-033 — Logo: El Pin
- **Fecha:** 2026-10-03
- **Estado:** Vigente
- **Decisión:** El pin se lee como "te llevamos a un lugar", funciona a tamaño favicon y conserva nomaderIA con `IA` en fogata. Slogan: "Aquí nadie se pierde… nomás se encuentra." Archivos en `public/` y `docs/brand.md`.


### ADR-038 — Fotos del hero en carpeta versionada (`/hero/vN/`)
- **Fecha:** 2026-10-21
- **Estado:** Vigente.
- **Contexto:** `public/_headers` sirve `/hero/*` con `Cache-Control: public, max-age=31536000, immutable`. Al cambiar las 6 fotos placeholder por las de Frank con los mismos nombres (`01-1080.avif`…), el navegador de quien ya visitó no vuelve a pedirlas durante un año.
- **Decisión:** cada set de fotos vive en una carpeta nueva (`/hero/v2/`, luego `v3`…). Tres lugares se mueven juntos: `HERO_VERSION` en `scripts/generate-hero-images.mjs`, `HERO_BASE` en `HeroSection.tsx` y el preload de la foto 01 en `index.html`. El set anterior se borra en el mismo commit. La regla `immutable` de `_headers` no cambia.
- **Consecuencias:** cambiar fotos no requiere purgar caché en Cloudflare. Si alguien cambia una foto sin subir la versión, el cambio no llega a visitantes que ya tienen la vieja en caché: el README de `public/hero/` lo explica.

### ADR-039 — Hero: luz dirigida y contraste medido sobre las fotos reales
- **Fecha:** 2026-10-21
- **Estado:** Reemplazada por ADR-045 (el texto ya no va sobre la foto). La regla de medir contraste pixel a pixel sigue para cualquier texto sobre foto. Reemplazaba el scrim uniforme de #208.
- **Contexto:** #208 puso 84% forest sobre toda la foto para que la línea fogata (#D97706) pasara AA texto grande (≥3:1). Pasaba, pero las fotos de Frank se veían opacas y el hero no daba ganas de ir. `docs/design-system.md` ya decía «scrim: nunca una caja plana».
- **Decisión:**
  1. Oscuro solo donde va el texto. Menos de `lg`: empieza en `--hero-text-top` (posición real del bloque de texto, medida con ResizeObserver) y deja limpia la foto de arriba. `lg`+: degradado a la izquierda hasta `--hero-col-right` (borde de la columna: `container` + `px-5` + `max-w`); la mitad derecha queda limpia.
  2. La primera foto se elige por cómo se ve **arriba** en celular, porque ahí es lo único limpio. Hoy: Joshua Tree (02). El preload de `index.html` sigue a `HERO_SLIDES[0]`.
  3. El contraste se mide, no se estima: por cada foto y tamaño de pantalla, captura con el texto transparente (fondo) y con el texto magenta (máscara de glifos), sin text-shadow, y se calcula el contraste WCAG en cada pixel de glifo. Umbrales: H1 ≥3:1 (texto grande), el resto ≥4.5:1. Resultado 2026-10-21: 0 fallas en 6 fotos × 8 tamaños; peor pixel del H1 fogata 3.32.
- **Consecuencias:** al cambiar fotos u orden, repetir la medición (sobre todo fotos con nieve o cielo blanco). Si una foto falla, subir el oscuro en ese tramo o cambiar el orden; no volver a la manta uniforme.

### ADR-040 — Parques en la landing: «ruta + vidrio», ordenados por distancia desde San Diego
- **Fecha:** 2026-10-22
- **Estado:** Vigente. Reemplaza las pestañas por dificultad de `DestinationsCatalog`. El origen ya no es fijo: ADR-041 deja empezar la ruta desde cualquier código postal, y el orden pasó a `src/lib/landing-origin.ts`.
- **Contexto:** Frank vio las tarjetas de parques «muy básicas». Además había dos bugs: `useDestinations()` no ordena, así que los 3 parques del home salían al azar, y la fila de abajo de las tarjetas se cortaba (cuerpo `h-full` dentro de una tarjeta `h-full` con `overflow-hidden`). Frank eligió el diseño «3 + 5» del canvas: ruta punteada desde San Diego + tarjetas de foto con panel de vidrio.
- **Decisión:**
  1. Los parques salen por horas en carro desde San Diego (`drive_time_from_san_diego`), el más cercano primero; empates por nivel y luego A–Z. Solo cuenta un manejo directo: «3 horas en coche a Ventura» (Channel Islands, luego barco), «Sin carretera…» y «Vuelo vía…» no entran a la ruta. El parseo y las etiquetas viven en `src/lib/landing-parks.ts` (con test sobre valores reales); si un dato no se lee limpio, la etiqueta no sale en vez de inventarla. Hoy (63 publicados): Joshua Tree 3 h, Saguaro 5.5 h, Kings Canyon 6 h.
  2. Query nueva `useLandingParks()` en `use-destinations.ts`; `useDestinations()` no se tocó.
  3. Celular: carrusel horizontal con snap; desktop (`lg`): 3 columnas bajo una sola ruta. Cada tarjeta es un solo link a la guía (nombre accesible = «Ver guía de X»).
  4. Vidrio: panel `forest-dark` 70% + blur 16 px; pill de nivel 65% + blur 12 px; sin `backdrop-filter`, 85%. Contraste en el peor caso (foto blanca detrás, sin contar el blur): texto del panel 5.9:1, línea del estado (90%) 5.2:1, pill 5.0:1. Todo ≥4.5.
  5. Sin fogata (#D97706): el canvas la usaba en el eyebrow y en los puntos de la ruta; en código van `cloud` y `green` (regla: fogata solo en el Hero).
  6. Sin filtros. El canvas de desktop traía «Más cerca / Fácil / Sin permiso / Con niños», pero los 3 más cercanos pasan los cuatro: los botones no cambiarían nada. Los filtros viven en `/destinos`.
  7. (Mismo día, después de verlo en producción.) «Primer sendero» → **«No te pierdas»** con `signature_experience` (los 63 parques lo tienen; 85 caracteres en promedio, 111 máximo). Frank: «Primer sendero» no decía nada: ¿primero de qué?, y un nombre en inglés con km no ayuda a quien nunca ha caminado. La frase va como está, bajo una etiqueta Oswald, para no tocar su mayúscula («El Capitan…» no se puede pasar a minúscula). Se descartaron `good_for` (no es parejo entre parques), señal de celular (asusta en una tarjeta que vende) y `estimated_budget_usd` (no dice si es por persona o por viaje).
- **Consecuencias:** si cambia el formato de `drive_time_from_san_diego`, revisar `parseDriveFromSanDiego` (un parque que no se lee sale de la ruta, no rompe). Para filtros en el home, que filtren por algo que cambie las 3 tarjetas (p. ej. tramos de horas), no por atributos que los cercanos ya cumplen.

### ADR-041 — La ruta de parques puede salir de tu código postal; horas estimadas con «≈»
- **Fecha:** 2026-10-22
- **Estado:** Vigente. Amplía ADR-040.
- **Contexto:** Frank: «¿y si la persona no es de San Diego?». La ruta del home solo tenía horas reales desde San Diego (`drive_time_from_san_diego`, capturadas a mano). Para alguien de Phoenix o Chicago, «3 h en carro» no le decía nada. El quiz ya convierte cualquier código postal de EE. UU. en lat/lon (ADR-031) y los 63 parques tienen `latitude`/`longitude`.
- **Decisión:**
  1. «Desde San Diego · Cambiar» en la sección: la persona escribe su código postal y la ruta se reordena desde ahí. San Diego sigue siendo el arranque (ahí van los anuncios). Un código a ≤0.5 h estimada del centro de San Diego (Chula Vista, etc.) cuenta como San Diego y ve las horas reales.
  2. Horas desde otro código = la estimación del motor (`driveHours` de `@engine`: millas en línea recta × 1.25 / 65 mph, la misma con la que filtra el quiz), **redondeada hacia arriba** (medias horas bajo 10 h, horas enteras desde 10 h) y con «≈». Nota debajo de la ruta: «Horas estimadas en línea recta… Antes de salir, revisa la ruta en tu mapa».
  3. Medición (2026-10-22). Contra las 33 horas reales de San Diego sin «+»: error mediano +3%, del −12% al +27% (p10–p90). Contra 31 viajes conocidos desde 10 ciudades (cifras públicas aproximadas): error medio 0.55 h; 7 de 31 se quedan cortos por más de media hora. Los cortos son caminos de montaña o rodeos: Las Vegas → Sequoia ≈4 h contra ~6 h (la Sierra Nevada no se cruza en línea recta), Denver → Black Canyon ≈3.5 contra ~5 h, Seattle → Olympic ≈1.5 contra ~2.5 h. Se probó multiplicar la estimación ×1.1–1.2: empeora el total. Se quedó ×1.
  4. Los parques de la ruta son los mismos desde cualquier origen: los que tienen manejo directo desde San Diego (49 de 63). Hawái, territorios (`isIslandZip`) y Alaska (995–999) no reordenan: mensaje que manda al quiz.
  5. El código se guarda en `localStorage` (`nomaderia_route_origin`, con lat/lon para no bajar la tabla de 570 KB al volver). Lectura y escritura en try/catch; sin storage, la ruta funciona igual en esa visita.
  6. Evento `landing_origin_set` (`events` + GA4/Pixel) con `zip3` y `result` (`zip` / `san_diego_area` / `off_route`), igual que el quiz guarda `zip3`. Sirve para ver cuántas visitas no son de San Diego.
- **Consecuencias:** las horas desde otro código son orientativas; nunca mostrarlas sin «≈» ni sin la nota. Si alguien reporta un error grande, no meter correcciones a mano por parque: el arreglo de fondo es una tabla de tiempos reales por carretera (requiere un servicio de rutas). El motor no se toca aquí (ADR-026); si cambia la fórmula upstream, la ruta la hereda.

### ADR-042 — El cuestionario del home va sobre un video de Frank caminando
- **Fecha:** 2026-10-22
- **Estado:** Vigente.
- **Contexto:** Frank: entre «La diferencia Nomaderia» y el cuestionario «está todo muy blanco y se ve mal». Las dos secciones eran `bg-cloud` con `py-16`/`py-24` y quedaban ~130 px de blanco entre el botón de compra y el cuestionario. De parques (oscuro) al seguro (verde claro) todo se leía como una pared blanca. Eligió poner el cuestionario sobre una foto y, al verla, mandó 4 videos suyos caminando y pidió uno de fondo.
- **Decisión:**
  1. Las vistas de preguntas y de carga van sobre su video del Gran Cañón (sendero en el borde, `public/video/v1/`), con la tarjeta del cuestionario opaca (`bg-cloud`, antes `bg-card/50` con blur) para que el texto oscuro nunca quede sobre el video. Encabezado en `cloud`; la pastilla «Cuestionario personalizado» en vidrio oscuro.
  2. El video (`v3`, Frank: «solo se ve el Gran Cañón») es un loop de 16.7 s con 4 de sus videos, ~4 s cada uno, en este orden: Gran Cañón (sendero del borde) → Joshua Tree (boardwalk de Cholla) → Yosemite (boardwalk con nieve) → Joshua Tree (bajo Arch Rock), con fundidos de 0.8 s entre clips y del último al primero. Cada clip: recorte del cielo de arriba (para que se vean sendero y paisaje), color más vivo por escena (`warm`, `desert`, `snow`; Frank: «se ve muy opaco»), 0.85× y 24 fps. Un solo archivo para que iOS no tenga que arrancar otro video a mitad del loop. Sin pista de audio, en dos formatos por tamaño: H.264 (todos los navegadores) 720×998 ~2.0 MB / 1080×1498 ~3.7 MB, y AV1 ~1.4 MB / ~2.4 MB (−31 % / −35 % al mismo SSIM: 0.89 / 0.90 contra el maestro). AV1 solo donde `navigator.mediaCapabilities.decodingInfo` dice `powerEfficient` (decodificación por hardware), para no gastar batería en software; si no, H.264. HEVC se midió y ahorraba poco (~15–20 %); se dejó fuera. Póster WebP = primer cuadro. Lo generan `scripts/generate-quiz-video.sh` + `scripts/quiz-video-clips.tsv` (archivo, inicio, duración, recorte, color); los originales no se suben. `/video/*` con caché `immutable` y carpeta versionada, como `/hero/*` (ADR-038).
  3. Carga y reproducción: nada (ni el póster) baja al abrir la página; el archivo y el póster se asignan cuando la sección está a ~600 px de entrar en pantalla, así ya corre cuando llega la persona; se reproduce solo mientras la sección está en pantalla (IntersectionObserver) y se pausa al salir. Con «reducir movimiento» o ahorro de datos (`navigator.connection.saveData`) no hay video: se ve el póster fijo. Sin botón visible de pausa: Frank no lo quiere sobre la portada. Se queda solo para teclado (aparece al enfocarlo con Tab); quien tiene «reducir movimiento» en su sistema ve la imagen fija. Riesgo aceptado frente a WCAG 2.2.2, que pide pausa visible para movimiento de más de 5 s.
  4. Scrim «luz, no manta» (ADR-039): tinte `forest-dark/35`, degradado más oscuro arriba detrás del encabezado y sólido abajo para que la cresta oscura siguiente continúe sin línea. Cresta `cloud` arriba y `forest-dark` abajo, dentro de `QuizSection`, así solo aparecen con el video.
  5. Contraste medido pixel a pixel con el texto oculto, en 4 cuadros del video (0, 3, 6 y 9 s) × 360/390/1024/1280 px: título ≥6.5, subtítulo ≥5.6, pastilla ≥4.8. Todo ≥4.5.
  6. Los resultados se quedan en `bg-cloud`: ahí está el botón de compra y su texto (links verdes, notas `stone-500`) no pasa contraste sobre oscuro. Cambiarlos es otro PR.
  7. **Portada antes de la primera pregunta** (Frank: «la caja tapa mucho el video»). Referencias en Mobbin: las portadas de quiz de Cleo AI, Centr y How We Feel (video a pantalla completa, título y un solo botón abajo). La sección abre a 88 % de la altura de la pantalla con el video limpio (sin tinte; oscuro solo en el 64 % de abajo, detrás del texto), el título, una línea y un botón «Empezar» (sin la pastilla, para dejarle más espacio al video). Al tocarlo aparece la tarjeta y la página baja a ella; el video sigue sin recargarse (mismo árbol). Si ya hay respuestas, no hay portada. Evento `quiz_intro_start` (`events` + GA4) para medir cuánta gente deja de entrar por el paso extra. Contraste con el loop de 4 parques, 8 cuadros (2 por clip) × 4 anchos: portada título ≥3.7 (texto grande, pide 3:1; además lleva sombra) y subtítulo ≥10.9; vista de preguntas título ≥6.3, subtítulo ≥5.3, pastilla ≥12.7. La nieve de Yosemite es el peor caso: por eso su color va un poco más oscuro (`snow`).
  8. **iPhone en Modo de bajo consumo** no reproduce video solo (así lo vio Frank: batería amarilla). Cualquier toque en la página lo arranca, porque un toque es un gesto del usuario. Si alguien lo pausó con el teclado, ningún toque lo vuelve a arrancar.
- **Consecuencias:** al cambiar el video o el orden de clips, repetir la medición en varios cuadros de cada clip (la nieve y el cielo cambian todo). No volver a una tarjeta translúcida sobre el fondo. Si el peso pesa en datos móviles, bajar primero el 720 (CRF 30 → 32) antes de quitar el video.

### ADR-043 — Cabecera de /destinos: escena animada de un excursionista, dibujada en código
- **Fecha:** 2026-10-23
- **Estado:** Vigente. Reemplaza el mapa de estados (`USStateTintMap`, ya borrado junto con `src/lib/us-state-paths.ts`).
- **Contexto:** Frank quería algo vivo en la cabecera de /destinos y preguntó por el video del cuestionario (ADR-042). Medido: sus videos son verticales y la cabecera es una franja ancha (~4:1 en computadora); en computadora solo cabía una quinta parte de la imagen (piedras, borroso en pantallas retina), arriba de la página bajaría 1.4–3.7 MB al abrir, y es el mismo video que acaba de ver en el home. Propuso entonces una animación de alguien caminando por una cordillera con siluetas de los parques, con la estética oscura y luminosa de una referencia de Mobbin (Public, «Agents»).
- **Decisión:**
  1. Escena nocturna en verdes de marca (`ParkTrailScene`): cielo `forest-dark` → verde claro en el horizonte, luna, estrellas, y cuatro capas que pasan a velocidades distintas (paralaje): cordilleras lejanas (Rainier, Tetons), íconos de parques (Half Dome, sequoias, Gran Cañón, Delicate Arch, Balanced Rock, Joshua trees, saguaros, hoodoos de Bryce, dunas de Death Valley, Old Faithful, un bisonte), pinos y la cresta. Un excursionista con mochila y bastón camina en su lugar sobre la cresta; la cresta avanza a la velocidad de su paso para que las botas no resbalen. Sin ámbar (solo del hero del home).
  2. Todo es SVG generado en código (`src/lib/park-scene-tiles.ts`), una tesela por capa como `data:` URI: ~22 KB, sin pedidos de red; el chunk de Destinos bajó de ~53 a ~34 kB al salir el mapa. Cada capa mide 2 teselas en celular (una tesela ya es más ancha que la pantalla) y 4 desde 640 px; cada vuelta la corre exactamente una tesela, así la unión no se ve. Animación solo con `transform` en CSS (`.trail-scene` en `src/index.css`), sin librerías (ADR-001).
  3. Se detiene fuera de pantalla (IntersectionObserver → `data-paused`) y queda quieta con «reducir movimiento». Decorativa (`aria-hidden`). Igual que ADR-042, no hay botón visible de pausa: riesgo aceptado frente a WCAG 2.2.2.
  4. Nada pasa detrás del título ni del subtítulo: las figuras más altas y las nubes paran ~8 px abajo del subtítulo y las estrellas de esas filas van en las orillas. `PageHeader` con `children` usa `pt-[100px] pb-32 sm:pt-32 sm:pb-40`: la cabecera mide 300 px en celular (antes ~272) y 384 desde 640 px.
  5. **Más íconos y más rápido** (Frank, misma tarde: «que pasen más monumentos», «que avance un poco más»). Se suman Yosemite Falls, The Watchman (Zion), la costa (sea stacks de Olympic, Arch Rock de Channel Islands, faro de Bass Harbor en Acadia), palmas y garza (Everglades), un alce (Rocky Mountain), un volcán con fumarola (Hawái) y Cliff Palace (Mesa Verde): 20 íconos en una tira de 5800 unidades. El paso del excursionista baja de 1 s a 0.8 s y los íconos van a ~0.4× de la cresta (antes 0.3×): un ícono nuevo entra cada ~6–8 s en celular.
  6. **Paleta según la hora local de quien visita** (`scenePhaseForHour`): amanecer 6–9 h, día 9–17 h, atardecer 17–20 h, noche 20–6 h. Ventanas fijas, no la hora real de salida del sol. Noche = los verdes de marca; día = cielo azul con nubes blancas y sol; amanecer y atardecer = horizonte durazno/rosa con sol bajo detrás de las cordilleras. Los cielos cálidos son de la escena, no tokens de marca: ningún color es fogata `#D97706` ni terracota `#C2562F` (lo revisa un test). El cielo queda oscuro detrás del navbar, título y subtítulo en todas; el de día, que es más claro, lleva un oscurecido radial detrás del texto (`scrim`). Las teselas se generan en el navegador solo para la paleta que toca (~35 KB). Para revisar una paleta sin esperar la hora: `/destinos?escena=amanecer|dia|atardecer|noche`.
  7. Contraste medido pixel a pixel, 9 momentos del loop × 360/390/768/1280/1920 px, por paleta: título ≥7.8 (día) / ≥11.0 (resto); subtítulo ≥5.3 (día) / ≥7.5 (resto). El navbar blanco sobre el cielo de día da ≥6.
  8. **Neblina entre capas y luz del faro**, tomadas de dos pruebas que Frank hizo con Grok y Gemini (video). La base de las cordilleras, los íconos y los pinos se funde en el color del horizonte, así las capas se separan como cerros con bruma; de noche, amanecer y atardecer el faro de Acadia echa dos haces tenues. Los videos de IA no sirven como archivo: 1280×720 (16:9 para una franja de ~4:1), ~2.5 MB, con pista de audio, sin capas para el paralaje, objetos que se duplican (Grok) y el último cuadro no cierra con el primero (SSIM 0.80, salto visible en cada vuelta). Gemini además escribió los códigos hex del prompt como texto en el video: a un modelo de video, los colores se le describen con palabras.
- **Consecuencias:** al mover una figura, cambiar alturas de capa o tocar una paleta, volver a medir que nada cruce el subtítulo y el contraste de esa paleta (el día es el caso justo). Si cambia el tamaño del excursionista o la duración de su paso, recalcular la duración de la cresta (velocidad = zancada / medio ciclo). En pantallas anchas se repite parte de la tira de íconos; si molesta, ensanchar la tesela en vez de agrandar la capa.

### ADR-044 — /destinos: el buscador va dentro de la cabecera
- **Fecha:** 2026-10-23
- **Estado:** Vigente.
- **Contexto:** con la escena de ADR-043 terminada, el siguiente paso con más valor era de venta, no de decoración: llevar a la persona a su parque más rápido. El buscador y «Filtros» vivían en una fila fija bajo la cabecera, con `text-sm` (iOS hace zoom al enfocar campos de menos de 16 px).
- **Decisión:**
  1. El campo de búsqueda (pill `cloud`, 48 px, `text-base`) y el botón «Filtros» (vidrio oscuro; solo ícono en celular) van en la cabecera, bajo el subtítulo, con `PageHeader` `actions`. La fila fija se queda con dificultad y filtros rápidos; la lista empieza a la misma altura que antes.
  2. Cuando el buscador sale de la vista, al inicio de la fila fija aparece un botón de búsqueda (con lo que se escribió, entre comillas) que regresa arriba y enfoca el campo.
  3. En celular, al enfocar el campo la página sube para dejarlo bajo el navbar: el teclado ya no tapa los primeros resultados.
  4. La fila fija se pega a 76 px (la altura real del navbar), no a 64 px: con `top-16` sus 12 px de arriba quedaban detrás del navbar.
  5. Contraste: «Filtros» ≥13.2 en las 4 paletas; título y subtítulo no bajan (día: ≥7.8 / ≥5.6).
- **Consecuencias:** la cabecera mide 368 px en celular y 456 desde 640 px (antes 300/384 más la fila del buscador de 64 px). Si se agrega otro control a la cabecera, cuidar que el oscurecido de la paleta de día lo siga cubriendo.

### ADR-045 — Hero del home: una foto arriba, el texto abajo sobre claro
- **Fecha:** 2026-10-23
- **Estado:** Reemplazada en celular y tablet por ADR-047 (foto a pantalla completa). Siguen vigentes el ritmo de las fotos (punto 1) y el navbar sólido desde `lg` (punto 3). Reemplazaba ADR-039 y las barras tipo historias del carrusel.
- **Contexto:** Frank, en su iPhone: «no me gusta como se ve eso que va cambiando de foto, siento que ya se ve muy encimado todo». Sobre la foto iban 6 barras, la etiqueta del lugar, un H1 de 3 líneas, el subtítulo, el botón, el enlace a preguntas y la línea de confianza; la foto cambiaba cada 5 s y, para que el texto se leyera, llevaba oscuro encima. Se le mostraron 3 maquetas (una foto fija con el mismo diseño; foto arriba y texto abajo; tarjeta de vidrio) y eligió la segunda.
- **Decisión:**
  1. Las 6 fotos de Frank siguen pasando (Frank: «quiero que se cambie»), pero en calma: fundido de 1.2 s cada 6 s, sin barras, sin Ken Burns y sin oscuro encima; la etiqueta del lugar cambia con la foto. Se detiene fuera de pantalla y con el cursor encima; con «reducir movimiento» se queda la primera. Botón de pausa solo para teclado (aparece al enfocarlo), como el video del cuestionario (ADR-042): mismo riesgo aceptado frente a WCAG 2.2.2. La primera (02, Joshua Tree) es la LCP; las otras 5 se montan cuando el navegador queda libre. Se va el evento `hero_photo_select` (no hay barras que tocar).
  2. Celular y tablet: la foto llena ~56 % de la pantalla detrás del navbar transparente (franja oscura arriba solo para el logo) y termina en la cresta de `hero-mask.svg`; debajo, sobre `cloud`, el H1 en `ink` con «nomás se encuentra.» en `green` (la fogata sobre claro da 2.96:1, no pasa ni texto grande), el subtítulo en `slate`, el botón fogata, el enlace a preguntas en `green` y la línea de confianza en `slate`.
  3. Desde `lg`: texto a la izquierda y la foto en un marco alto con esquinas de 32 px a la derecha. Las fotos son verticales (3:4), así que se ven casi completas (antes se recortaban a lo ancho). Como el texto va sobre claro, el navbar del home empieza sólido desde `lg` (`hasHeroForPath("/", { desktop: true })` es `false`); debajo de `lg` sigue transparente sobre la foto.
  4. Antes de la franja oscura de «La promesa» va el divisor `layered` en `cloud`.
  5. LCP: el preload de `index.html` sigue en la foto 02, con `imagesizes` igual a `HERO_SIZES` (`(min-width: 1024px) 44vw, 100vw`).
- **Consecuencias:** las fotos que pasan después de la portada salen de la Galería del panel (ADR-046); `HERO_PHOTOS` queda como portada y respaldo. Cambiar la portada = editar `HERO_PHOTOS[0]` y el preload (ADR-038 sigue para las carpetas). El texto ya no va sobre las fotos, así que no hay que volver a medir su contraste al cambiarlas; sí revisar que el logo blanco se lea sobre el cielo de cada una en celular. Pendiente de decisión de Frank: el botón fogata con texto blanco da 3.2:1 (pide 4.5:1 a ese tamaño).

### ADR-046 — El hero del home pasa las fotos activas de la Galería del panel
- **Fecha:** 2026-10-23
- **Estado:** Vigente, salvo el punto 5 (fotos completas sobre copia desenfocada), que reemplaza ADR-047. Completa ADR-045.
- **Contexto:** Frank quiere que el hero muestre «las que yo elijo desde la administración en galería» (`media_slider`, `/admin/galeria`): 11 imágenes activas, originales del iPhone de 0.2 a 3.4 MB.
- **Decisión:**
  1. El hero arranca con la foto local 02 (la LCP, con preload; abre igual de rápido) y luego pasa las imágenes activas de la Galería en el orden del panel; la portada no se repite. Si la Galería no tiene imágenes activas o la consulta falla, pasa el set local de `public/hero/v2/`.
  2. Las fotos de la Galería se piden achicadas por Supabase (`/storage/v1/render/image/…?width=640|1080|1440&quality=70`, el mismo `resizedImageUrl` del boletín): nunca el original.
  3. Solo baja la foto actual y la siguiente, y la segunda espera a saber la lista de la Galería.
  4. Nueva columna `media_slider.caption`: el lugar que Frank escribe en el panel («Lugar»); el hero lo muestra en la etiqueta. Sin lugar, la foto va sin etiqueta.
  5. **Las fotos nunca se recortan** (Frank, al verlas: «muchas de las fotos se cortan y pierden todo el sentido»). Cada foto se ve completa (`object-contain`) sobre una copia de sí misma desenfocada que llena el marco (misma descarga). En celular la foto completa queda arriba de la cresta; el marco mide `min(58svh, 133vw, 640px)` (casi 3:4, el formato del iPhone), así que las verticales casi no dejan bandas y las horizontales muestran bandas desenfocadas arriba y abajo.
- **Lección:** se aplicaron también `web_url` y `web_storage_path` para guardar copias ligeras hechas en el panel, porque se supuso que el plan gratis de Supabase no achicaba fotos. Los logs dicen otra cosa: `render/image` responde 200/304 en este proyecto. Antes de asumir un límite de plan, revisar los logs (`edge_logs`). Las dos columnas quedan vacías; borrarlas pide confirmación de Frank (el borrado se canceló sin ella).
- **Consecuencias:** cambiar fotos del hero ya no pide deploy: se activan, ordenan y nombran en el panel. Revisar en celular que el logo blanco se lea sobre el cielo de cada foto nueva.

### ADR-047 — Hero del home: la foto es la pantalla (estilo historia)
- **Fecha:** 2026-10-23
- **Estado:** Vigente, salvo el punto 2 (el oscuro liso detrás del texto), que reemplaza ADR-048. Reemplaza el diseño de celular de ADR-045 y el punto 5 de ADR-046.
- **Contexto:** con las fotos de la Galería, el marco de ADR-045 (foto arriba con cresta, texto abajo sobre claro) y las fotos completas sobre una copia desenfocada (ADR-046 punto 5) no convencieron a Frank: «no me gustó como se ve, tiene cero diseño». Sus fotos son verticales de iPhone (de 0.39 a 0.58 de ancho por alto), casi la forma de la pantalla del celular (0.46). Se le mostraron 3 maquetas y eligió la 1: la foto a pantalla completa, como una historia de Instagram, con el texto abajo.
- **Decisión:**
  1. Celular y tablet (menos de 1024 px): la sección mide `100svh` (mínimo 540 px) y la foto la llena (`object-cover`), detrás del navbar transparente. Arriba solo una sombra suave para el logo blanco (`forest-dark/55` a transparente en 144 px). El texto va abajo: etiqueta del lugar, H1 blanco con «nomás se encuentra.» en fogata, subtítulo `white/90`, botón fogata y línea de confianza `white/80`. El enlace a preguntas frecuentes se oculta debajo de 640 px (la sección de preguntas sigue más abajo).
  2. El oscuro detrás del texto (`.hero-scrim`) empieza 9 rem arriba del bloque de texto y lo sigue sin importar el alto de la pantalla: transparente → 0.5 → 0.86 donde empieza la etiqueta → 0.94 → `#14201A` sólido al final. Así la franja oscura de «La promesa» sigue sin línea, y el divisor `cloud` de `Index.tsx` queda solo desde `lg`.
  3. La fila de la etiqueta guarda su alto aunque una foto no tenga lugar, para que el texto no salte al cambiar de foto.
  4. Contraste medido pixel a pixel sin sombra de texto (bg/fg, percentil 2), a 375, 390, 430 y 768 px: sobre una foto blanca pura, H1 11.6, fogata 3.8 (pide 3, texto grande), subtítulo 10.8, confianza 10.4, etiqueta 8.2, preguntas 12.3; sobre las 6 fotos locales, todo igual o mejor. El oscuro basta para cualquier foto que Frank suba; no hay que volver a medir al cambiar fotos.
  5. Desde `lg`: texto a la izquierda sobre `cloud` (H1 `ink`, «nomás se encuentra.» en `green`, navbar sólido) y la foto en un marco 3:5 de `min(76vh, 700px)` de alto con esquinas de 32 px. Detrás, la foto siguiente inclinada −6° como una pila de fotos impresas (mismas URLs que el frente: no baja nada extra); se desplaza 7 % a la izquierda en `lg` y 12 % desde `xl` para no tocar el texto en 1024 px.
  6. `HERO_SIZES` y el `imagesizes` del preload pasan a `(min-width: 1024px) 420px, 100vw`.
- **Consecuencias:** las fotos se recortan un poco para llenar la pantalla. Las verticales de iPhone pierden un borde fino; las 3:4 locales pierden los lados en celular (por eso la portada local se eligió con el motivo al centro). Si una foto de Frank pierde lo importante, la salida es otra foto, no volver al desenfoque. `public/hero-mask.svg` ya no lo usa el hero (sigue en `_headers`); se puede borrar en un PR aparte.

### ADR-048 — La foto del hero termina en una cordillera (celular)
- **Fecha:** 2026-10-23
- **Estado:** Vigente, salvo el efecto de scroll del punto 3, que reemplaza ADR-049. Reemplaza el punto 2 de ADR-047.
- **Contexto:** al ver la foto a pantalla completa, Frank extrañó la cresta que separaba la foto del texto (ADR-045): «no quiero que se pierda esa división, me gusta mucho, o algo más montañoso o un efecto estaría genial». Un primer intento con cordilleras de `forest-dark` translúcido no se distinguía sobre las fotos.
- **Decisión:**
  1. Debajo de 1024 px la foto termina en tres capas planas, al estilo de la escena de `/destinos` (ADR-043): picos lejanos en verde pino (`#2F5E4A`, 0.86), una cordillera media más oscura (`#1E3D30`, 0.95) y lomas al frente en `forest-dark` con pinos, donde se para el texto. Siluetas en `src/lib/hero-ridges.ts` (1024 de ancho, 1 unidad = 1 px, recortadas desde el centro con `xMidYMax slice`, así los picos no se aplastan en ningún celular).
  2. Cada capa es un color plano recortado con su silueta como `mask` (arriba) y sólido abajo, y baja hasta el final detrás del texto: las capas se suman sin línea y terminan en `#14201A`, igual que «La promesa». Van ancladas al bloque de texto, así siguen al texto en cualquier alto de pantalla.
  3. Efectos, todos apagados con «reducir movimiento»: la cordillera lejana y la media suben al cargar (1.1 s); una neblina pasa despacio entre ellas (70 s por vuelta, en pausa fuera de pantalla); y donde el navegador tiene animaciones ligadas al scroll (`animation-timeline: scroll()`), la cordillera lejana baja más despacio que la página y la foto un poco más, como profundidad. Sin JavaScript para el scroll; donde no hay soporte, simplemente no se mueven.
  4. Contraste medido sin sombra de texto sobre una foto blanca pura: H1 16.8, fogata 5.3, subtítulo 13.8, confianza 11.1, etiqueta 12.5. Detrás del texto ya no se ve la foto.
- **Consecuencias:** en celular la foto se ve en la parte de arriba (unos 45 % de la pantalla en un iPhone 14; menos en un iPhone SE). Las cordilleras son decoración; cambiar su forma = editar `hero-ridges.ts` (las pruebas revisan que cada silueta quede dentro de su franja y que la lejana quede más alta que la media y esta que el frente). Escritorio sin cambios.

### ADR-049 — Hero en celular: la foto arriba del texto y profundidad al hacer scroll
- **Fecha:** 2026-10-23
- **Estado:** Vigente. Completa ADR-048.
- **Contexto:** en su iPhone, con fotos de la Galería, Frank veía casi solo cielo: la foto llenaba la pantalla detrás del texto, así que su centro quedaba tapado por las montañas y el texto. Pidió «sube más la foto» y un efecto de scroll como el de Save.design (en Mobbin: un paisaje que una ventana oscura va cubriendo al bajar).
- **Decisión:**
  1. Debajo de 1024 px la foto ocupa solo el espacio arriba del texto (`flex-1`), no la pantalla entera: su centro queda arriba de las montañas. La etiqueta del lugar pasa a la foto, debajo del logo, como la ubicación de una historia; se va la fila vacía que quedaba cuando una foto no tenía lugar.
  2. Cordilleras más bajas (136, 92 y 52 px en vez de 160, 104 y 60) para dejar más foto.
  3. Profundidad al hacer scroll, en JavaScript para que funcione en cualquier iPhone (la versión anterior con `animation-timeline` solo corría en iOS 26): la foto va al 40 % de la velocidad de la página y se acerca un poco (hasta 6 %), la cordillera lejana se queda atrás un 16 %, la media un 7 %, y las lomas con el texto van con la página. Resultado: la tierra sube sobre la foto, como la ventana de Save.design, y las cordilleras cercanas tapan a las lejanas. Un solo listener pasivo de scroll y una escritura de `transform` por capa por cuadro; deja de escribir cuando el hero sale de pantalla. Apagado con «reducir movimiento» y desde `lg`.
  4. Sin Framer Motion en el hero: cargarlo haría esperar al H1 (lección de PR #194).
- **Consecuencias:** el botón sigue en la primera pantalla (579 px de 667 en iPhone SE; 756 de 844 en iPhone 14). Ajustar el efecto = cambiar las tres velocidades en `parallaxLayers` de `HeroSection.tsx`. Escritorio sin cambios.

### ADR-050 — «La promesa» como bosque claro con profundidad al hacer scroll
- **Fecha:** 2026-10-23
- **Estado:** Vigente.
- **Contexto:** con el hero nuevo (ADR-047 a ADR-049), «La promesa» quedaba pegada a él: las dos oscuras, sin corte. Frank: «tenemos que diferenciar esta parte… otro efecto de scroll de árboles de siluetas o algo así, pero que se vea que es una sección aparte». Entre «La promesa» y las tarjetas de parques había además una franja clara rara (dos divisores encimados de cuando la sección siguiente era clara).
- **Decisión:**
  1. «La promesa» pasa a ser clara entre dos secciones oscuras: cielo de neblina (`#E9F0EB` → `#C3D8CB`), un sol pálido, tres hileras de pinos planos (lejana `#8DB09C`, media `#4F7F66`, suelo `forest-dark`) y dos pinos grandes en las esquinas. Cita en `ink` con «cómo llegar» en `green`, y una etiqueta «Nuestra promesa» en Oswald verde para que se lea como sección propia.
  2. Siluetas en `src/lib/forest-silhouettes.ts`: hileras de 1024 px que se repiten a lo ancho sin costura (las pruebas lo revisan) y un grupo de esquina que se refleja para el otro lado. Mismo truco que la cordillera: color plano + `mask` con la silueta arriba y sólido abajo.
  3. Efecto de scroll con el hook nuevo `useScrollDepth` (`src/hooks/use-scroll-depth.ts`), que ahora usa también el hero: el sol se mete detrás de los árboles, las hileras lejana y media se quedan atrás de la página, y los pinos de las esquinas empiezan un poco hacia adentro y se abren al avanzar, como al entrar a un claro. Neblina lenta entre hileras. Todo apagado con «reducir movimiento»; en celular y en computadora.
  4. Bordes: en celular entra la cresta oscura del hero (`SectionDivider layered #14201A`); desde `lg`, la cresta `cloud`. Al final no hay divisor: el suelo del bosque ya es `forest-dark`, igual que las tarjetas de parques. Se quitaron el divisor `simple #1C1917` y el `layered #FBFAF7` que hacían la franja clara.
- **Lección:** los troncos de los pinos a tamaño chico, con un fondo de otro color detrás, se leen como una línea punteada. El último piso de ramas va casi al ras del suelo (3 % de la altura).
- **Consecuencias:** cambiar el bosque = regenerar las siluetas (el generador en Python está en el PR #224) o mover las velocidades en `PromiseSection.tsx`.

### ADR-051 — Un carro recorre la ruta de parques del home
- **Fecha:** 2026-10-23
- **Estado:** Vigente. Completa ADR-040 y ADR-041.
- **Contexto:** Frank, sobre la ruta punteada de «¿A cuántas horas está tu próximo parque?»: «quiero que la línea del carro tenga también algún efecto padre cuando lo deslizas».
- **Decisión:**
  1. Un carro (insignia `cloud` con el ícono `Car` en `green`) va sobre la línea y deja detrás un trazo sólido; lo que falta sigue punteado.
  2. Celular: lo mueve el deslizamiento de las tarjetas. Llega a cada parada justo cuando su tarjeta queda en su lugar (snap), avanza en línea recta entre paradas, voltea al deslizar de regreso y se mece mientras se mueve. La parada donde está estacionado pone su píldora de horas en claro; la tarjeta de esa parada queda brillante y las otras bajan a 60 % de opacidad (y 97 % de tamaño, salvo con «reducir movimiento»). La píldora ya no lleva su propio carrito: ahora el carro es uno solo.
  3. Desde `lg`: lo mueve el scroll de la página, del origen a la última parada mientras la ruta pasa del 80 % al 35 % de la altura de la pantalla. Sin atenuar tarjetas.
  4. Hook `useRouteCar` (`src/hooks/use-route-car.ts`): las paradas son los elementos con `data-route-node` (los ocultos no cuentan), medidos de nuevo cuando cambia el tamaño; una escritura por cuadro; React solo se entera cuando cambia la parada. `carOnRoute` y `nearestStop` son puros y con pruebas.
- **Lección:** un contenedor con scroll de lado (`overflow-x: auto`) también recorta arriba y abajo. El carro y las píldoras sobresalen de la fila de 24 px y salían cortados en el iPhone de Frank («se ve cortado el carro»). El carrusel lleva 12 px de aire arriba (`pt-3`) que se recuperan con `-mt-3`, así el diseño no se mueve.
- **Consecuencias:** si se agrega una parada a la ruta, basta con marcar su punto con `data-route-node`. No cambia el orden de los parques ni las horas (ADR-040/041).

### ADR-052 — Paso por el cañón entre el seguro de viaje y las preguntas frecuentes
- **Fecha:** 2026-10-23
- **Estado:** Vigente.
- **Contexto:** Frank, sobre la cresta entre el bloque del seguro y «Preguntas frecuentes»: «¿puedes poner un efecto de scroll como un cañón, como adentro del Gran Cañón, como que vas pasando por un cañón?».
- **Decisión:**
  1. `CanyonPassage` reemplaza el divisor `layered #E8F1EA`, sin texto (`aria-hidden`). El cielo arranca en el `green-wash` del seguro, así que no hay corte arriba. Abajo termina en un borde ondulado color `cloud`, el fondo de las preguntas frecuentes.
  2. Un cañón visto desde adentro, en siluetas planas con los mismos verdes de la cordillera del hero y del bosque: borde lejano de mesetas `#B3CBBD`, dos *buttes* `#8DB09C`, paredes medias `#4F7F66`, paredes cercanas `#1E3D30` con pinos en sus escalones y un río color `mist`. La primera versión llevaba franjas de roca roja (estratos). Frank pidió «que respetara los colores que usamos, que se vea más silueta, como los pinos o como las montañas», así que se quitaron.
  3. Formas en `src/lib/canyon-silhouettes.ts`, solo con segmentos rectos, para que el lado derecho sea el izquierdo reflejado (`mirrorShape`). Cada forma es una `mask` estirada a su caja.
  4. **Inmersivo** (Frank: «que sienta que te estás metiendo al cañón»): la escena es un escenario de pantalla completa (`sticky`, `100svh`) dentro de una sección de `180svh` (`170vh` desde `lg`), así que se queda fija mientras la página baja casi una pantalla más. Las paredes cercanas suben todo el alto de la pantalla (estás entre ellas); el resto del cañón conserva sus proporciones abajo (máximo `165vw` de alto), para que nunca quede apretado. En ese tramo las paredes cercanas pasan junto a ti y salen por los lados, las medias se abren y crecen, y los *buttes*, el río y el borde lejano se acercan. Para que una pared salga de la pantalla tiene que moverse más de lo que crece (escala 2.1 → se mueve 150 % de su ancho).
  - Se probó una «entrada» al frente (dos acantilados `forest-dark` casi cerrados que se abrían): Frank, al verla, «no me gustó, se mira mal, muy chico el cañón». Tapaba el cañón con una pared oscura y dejaba solo una rendija; se quitó. Lección: lo inmersivo viene de que la escena llene la pantalla y se mueva contigo, no de esconderla.
  5. Con «reducir movimiento» no hay escenario fijo ni entrada: es una franja quieta de 400 px (460 en tablet, 520 desde `lg`).
  6. `useScrollDepth` ahora también da `height` (el alto de la sección), para medir el avance mientras el escenario está fijo.
- **Consecuencias:** cambiar el cañón es cambiar las formas o las velocidades en `CanyonPassage.tsx`.

## Lecciones técnicas (bugs no obvios)

> Entradas cortas. Una lección por viñeta. Sirven para que un agente no repita un
> error ya pagado.

- **Un regex de "ya tiene el pase" se tragaba las comparaciones:** `HAS_PASS`
  aceptaba "con el pase", así que "¿cómo se compara **con el pase** de $250?"
  (B07, examen 2026-10-05) se leía como pase ya comprado y `calculate_fees`
  nunca comparaba. Fix: "compar*" pide comparación, "sin pase" gana sobre
  `HAS_PASS`, y una comparación de pases tiene que llevar todas las visitas
  del viaje en una sola llamada (por parque, el veredicto sale al revés).
  Lección: los atajos por regex sobre la pregunta necesitan un test con la
  frase exacta del examen que los rompió.
- **Triggers `UPDATE OF col` ignoran cambios hechos por triggers `BEFORE`:**
  un trigger con lista de columnas solo dispara si la columna está en el `SET`
  del UPDATE. Si un `BEFORE` trigger cambia la columna (p. ej. sube
  `content_version`), el `AFTER UPDATE OF content_version` **no** dispara. Usar
  `AFTER UPDATE ... WHEN (OLD.col IS DISTINCT FROM NEW.col)`, que ve el NEW final.
  El test SQL de ADR-028 lo cubre.
- **RLS de `sentinel_leads`:** la tabla tenía solo `INSERT` para `anon` y faltaba
  política `SELECT` para admin, por lo que el contador del dashboard siempre
  mostraba 0. Fix: política `FOR SELECT TO authenticated USING has_role`. Lección:
  un contador en 0 en el admin suele ser un problema de RLS, no de query.
- **Contraste WCAG AA:** subir `--muted-foreground` de `45%` → `40%` lightness en
  `src/index.css` arregla *todos* los usos de `text-muted-foreground` de una sola
  vez sobre `#FAFAFA` (~4.1:1 → ~5.0:1). Lección: preferir el fix en la variable
  CSS antes que tocar componentes uno por uno.
- **Legacy `/sentinel` fallback:** el flujo legacy de checkout caía a `"#"`
  cuando faltaba su link de pago. Mantener un fallback explícito evitó CTAs
  muertos mientras esa ruta siguió activa.
- **`park_live_data.weather` es contrato de un solo productor:** la columna
  `weather` (jsonb) la escribe únicamente `sync-park-weather` con la forma
  `{synced_at, source: "weather.gov", periods: [...]}`, consumida tal cual por
  `ParkWeatherCard.tsx` vía `use-park-live-data.ts`. El campo `weatherInfo` de
  NPS `/parks` es un string editorial distinto (clima general del parque, no
  pronóstico por día) — ya se usa en `generate-park-content` como insumo para
  generar `destinations.weather_markdown`. Se evaluó y **descartó** escribir
  `weatherInfo` en `park_live_data.weather` desde `sync-park-live-data`: un
  sync `full` posterior a `sync-park-weather` sobreescribiría el forecast
  estructurado con un string suelto, `weather.periods` quedaría `undefined` y
  `ParkWeatherCard` dejaría de renderizar en silencio (retorna `null` sin
  `periods`). Lección: antes de añadir un segundo productor a una columna
  jsonb existente, verificar su consumidor — un nombre de columna genérico
  (`weather`) no garantiza que dos fuentes compartan forma.
- **Radix `Select.Item` nunca acepta `value=""`:** lo reserva internamente como
  sentinel de "sin selección", así que un `<SelectItem value="">` crashea en el
  primer render (`A <Select.Item /> must have a value prop that is not an empty
  string`) — no es un warning, tira la página entera. Causó el crash de
  `/admin/client-itineraries/new` (select de plantilla con un item "Empezar en
  blanco" en `value=""`). Fix correcto: para comportamiento de placeholder, usar
  `SelectValue placeholder="..."` con el `Select` en modo no controlado
  (`value={field.value || undefined}`, nunca `?? ""`) — sin selección, ningún
  item matchea y el placeholder se muestra solo. Para una opción legítima de
  "ninguno/opcional" (ej. "Sin parque"), usar un valor sentinel real (ej.
  `"none"`) y mapearlo a `null` al construir el payload de insert/update — nunca
  `""` como value de un `SelectItem`. El `value=""` SÍ es válido en el prop
  `value` del `Select` raíz (controla qué item aparece seleccionado, no
  requiere que exista); el bug es específico de `SelectItem`. Nota: un
  `Select` controlado con `value={field.value ?? ""}` (en vez de `|| undefined`)
  no crashea por sí solo si ninguno de sus `SelectItem` tiene `value=""` — pero
  queda como trampa latente para el próximo `SelectItem` que alguien agregue
  ahí; se alineó también el select "Modo" de `ItineraryBlockEditor.tsx` al
  patrón `|| undefined` sin que tuviera el bug activo, para cerrarla.
- **`.select()` con string armado en runtime pierde el tipo de fila:** supabase-js
  parsea el string del select *a nivel de tipos*. Si es `[...].join(", ")`,
  `"a" + "b"` o un template, el parser no puede y las filas salen como
  `GenericStringError[]` (tenga o no el cliente `<Database>`), así que un
  `as Row[]` falla. Fix: `.returns<Row[]>()` al final de la query, sin cast.
- **Nunca `ReturnType<typeof createClient>` como tipo de cliente:** `createClient`
  es genérico y `ReturnType` resuelve sus parámetros a `unknown`/`never`, así que
  ningún cliente real es asignable a ese tipo. Usar `SupabaseClient` (import
  `type`). Causó 5 de los 13 errores de ADR-027.
- **`interface` no es asignable a `Json`:** una `interface` no tiene index
  signature implícita, así que un array de ella no entra en una columna `Json`
  aunque sus campos sean serializables. Una `type` alias idéntica sí. Si un tipo
  se persiste en jsonb, declararlo con `type`.
- **Datos grandes como string literal en un módulo TS rompen el build:** la
  tabla ZIP (530 KB en una sola línea `export const X = "..."`) hizo que
  `vite build` pasara de ~15 s a más de 6 minutos a CPU completa, aun
  importándola con `import()` dinámico (con un stub diminuto: 14 s). Datos que no
  son código van en `public/` y se piden con `fetch` (ADR-031): no pasan por el
  bundler ni cuestan un parse de JS en el navegador.
- **`knowledge_chunks.metadata` no trae `slug`:** `ingest-knowledge` guarda
  `{park_code, title, section, content_version}` (0 de 1,768 chunks con `slug`),
  aunque seccion-9 documentaba lo contrario. `concierge-agent` descartaba todo
  chunk sin slug al armar `sources`, así que respondió siempre con `sources: []`
  sin que nada fallara. Fix: resolver el slug desde `destinations` por
  `park_code` (ADR-029). Lección: un campo vacío que "nunca falla" puede ser un
  bug silencioso — contrastar el contrato documentado contra la DB real.
- **tailwind-merge borra colores junto a utilidades propias `text-*`:** `cn()`
  pasa todo por tailwind-merge, que lee cualquier `text-<algo>` desconocido como
  color de texto. `cn("text-white/90 text-shadow-hero")` devolvía solo
  `text-shadow-hero`, y los links del navbar quedaban oscuros sobre el hero
  sin que nada fallara. Fix: registrar la utilidad como grupo propio con
  `extendTailwindMerge` en `src/lib/utils.ts` (test en `utils.test.ts`).
  Lección: toda clase propia con prefijo de Tailwind (`text-`, `bg-`, `shadow-`)
  que pase por `cn()` necesita su grupo en esa config.
- **RLS: un `UPDATE` desde PostgREST también pasa por las policies de `SELECT`:**
  PostgREST arma `UPDATE … RETURNING`, y con `RETURNING` Postgres exige que la
  fila **nueva** pase una policy de lectura. En `media_slider` la única lectura
  era `is_active = true`, así que poner `is_active = false` fallaba con «new row
  violates row-level security policy» (el patrón "soft delete" de siempre).
  Fix: policy de lectura para admins (`has_role`). Lección: si una columna
  esconde filas en la policy pública, quien edita esa columna necesita su
  propia policy de lectura. Y en un `catch`, un error de Supabase no es
  `instanceof Error`: usar `errorMessage()` de `src/lib/error-message.ts`.
- **La lista de rutas "con hero" del navbar se desfasa del layout:**
  `/destinos/:slug` seguía marcada como ruta con foto detrás del navbar después
  de que su carrusel bajó a `pt-20`, y el logo blanco desapareció sobre el fondo
  claro. Nada fallaba en build ni en tests. Fix: la lista vive en
  `src/lib/hero-routes.ts` con test y un comentario de por qué cada ruta está o
  no está. Lección: si una página cambia lo que hay arriba (foto, banda oscura,
  `pt-*`), revisar `hero-routes.ts` en el mismo PR.
- **Scroll snap: un área de snap más ancha que la pantalla deja frenar en cualquier lado:**
  en el carrusel de parques, `snap-start` en el contenedor de toda la pista
  (1228 px en un celular de 390) hacía que Chrome se detuviera a 14 px de la
  tarjeta (scroll 348 en vez de 362). Además, la tarjeta final con `snap-start`
  quedaba fuera del rango de scroll y nunca se veía entera. Fix: el primer
  punto de snap es el nodo «San Diego» (chico) y la tarjeta final usa
  `snap-end` con `scroll-px-5`. Lección: probar el snap con `scrollTo` y leer
  `scrollLeft`; a ojo parece bien.
