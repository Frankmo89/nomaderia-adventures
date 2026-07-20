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
- **Estado:** Vigente
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
