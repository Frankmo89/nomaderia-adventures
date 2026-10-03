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

### ADR-032 — Phase 1: cobro en sitio vía Stripe Payment Link (WhatsApp = dudas / post-pago)
- **Fecha:** 2026-10
- **Estado:** Vigente (acota ADR-005 / ADR-030 para el path de compra público)
- **Contexto:** El Payment Link $49 ya existía en producción; el sitio seguía cerrando por WhatsApp y `STRIPE_LINK_ITINERARIO_49` era placeholder. Hacía falta vender sin backend nuevo.
- **Decisión:** Todo CTA de **compra** abre el Payment Link live con label `Comprar mi itinerario – $49`. Si el visitante terminó el quiz (lead en `localStorage`), se añaden `client_reference_id` y `prefilled_email`. WhatsApp en superficies públicas es **solo** «¿Dudas? Escríbenos». Tras pagar, `/gracias` (noindex) + Success URL en Dashboard. Sin webhook/`orders` en este paso (resto de T06).
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

### ADR-033 — Logo: El Pin
- **Fecha:** 2026-10-03
- **Estado:** Vigente
- **Decisión:** El pin se lee como "te llevamos a un lugar", funciona a tamaño favicon y conserva nomaderIA con `IA` en fogata. Slogan: "Aquí nadie se pierde… nomás se encuentra." Archivos en `public/` y `docs/brand.md`.


## Lecciones técnicas (bugs no obvios)

> Entradas cortas. Una lección por viñeta. Sirven para que un agente no repita un
> error ya pagado.

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
