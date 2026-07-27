# Content Strategy — Nomaderia Adventures

## Modelo de Monetización

### Canales de Ingreso
1. **Travelpayouts** — Vuelos, hoteles, seguros, tours. Status: aprobado en red general; rechazado en GetYourGuide, Booking, Expedia, Trip.com, DiscoverCars por tráfico insuficiente. Re-aplicar cuando el sitio supere ~1,000 visitas/mes.
2. **Amazon Associates** — Equipo outdoor (botas, bastones, mochilas, cámaras). Tag: `nomaderia-20`. Status: activo.
3. **Itinerarios Premium** — Servicio personalizado como agente de viajes certificada (TAP Test, The Travel Institute). Formulario en `itinerary_requests` → contacto directo. Rango: $250-$2,000 USD.
4. **Newsletter** → Futuro: email marketing con ofertas de afiliado segmentadas por quiz responses.
5. **Seguros de Viaje** — Sección "Protege Tu Aventura" en homepage. Comisiones vía Travelpayouts (red de seguros, ya aprobada). Componente: `TravelInsuranceSection.tsx`. Relevancia alta para principiantes que no consideran seguro para aventuras outdoor. Comisión típica: 15-30% por póliza.

### Funnel de Conversión
```
Google (SEO) → Blog / Destino → Quiz → Email capture → Recomendación destino
                    ↓                                        ↓
              Gear article → Amazon affiliate          Affiliate links (vuelos/hoteles)
                    ↓                                        ↓
              Premium itinerary request              Travelpayouts comisión
                                                             ↓
                                                   Seguro de viaje → Travelpayouts comisión
```

## SEO

### Hooks disponibles (`src/hooks/use-seo.ts`)
- `useCanonical()` — Auto-detecta URL actual
- `useJsonLd(data)` — Inyecta structured data (Article, BlogPosting, etc.)

### Checklist por página
- Cada destino/gear/blog debe llamar a `useJsonLd()` con datos específicos
- `index.html` tiene meta tags OG y Twitter Card base
- Pendiente: sitemap.xml, Google Search Console (requiere dominio)

### Estrategia de Contenido SEO
- **Destinos:** Apuntar a long-tail en español: "cómo prepararse para el Camino Inca", "trekking para principiantes Patagonia"
- **Gear:** High-volume keywords: "mejores botas de trekking", "bastones de senderismo recomendados"
- **Blog:** Mix de evergreen (prep física, errores comunes) + trending (temporada, noticias outdoor)

## Destinos Existentes (8)

| Destino | Dificultad | Presupuesto | País |
|---------|-----------|-------------|------|
| Nevado de Toluca | Fácil | ~$200 | México |
| Gran Cañón | Fácil | ~$800 | USA |
| Camino de Santiago | Moderado | ~$1,500 | España |
| Camino Inca | Moderado | ~$1,200 | Perú |
| Torres del Paine | Desafiante | ~$2,000 | Chile |
| Yosemite | Fácil | ~$600 | USA |
| Ushuaia | Moderado | ~$1,800 | Argentina |
| Everest Base Camp | Desafiante | ~$3,000 | Nepal |

**Principio:** Cada nivel de dificultad tiene opciones regionales (México/US accesibles en fin de semana) e internacionales.

## Quiz Interactivo

### Embudo Post-Quiz
1. Quiz → resultados en pantalla + email inmediato con destino recomendado
2. Email educativo (3 días) — valor + mención gear [pendiente]
3. Email de conversión (7 días) — oferta itinerario personalizado [pendiente]
4. Itinerario Completo Nomaderia ($49 USD) → cierre y cobro manual por WhatsApp; Stripe Payment Link como canal alterno [link pendiente de crear] (USD únicamente, ver ADR-012)

6 preguntas que capturan:
1. Nivel de fitness
2. Tipo de interés (montaña, selva, desierto, costa)
3. Duración preferida
4. Estilo de viaje (solo, pareja, grupo)
5. Rango de presupuesto
6. Origen geográfico (valioso para analytics y segmentación)

Los datos se guardan en `quiz_responses` y alimentan el dashboard de analytics en `/admin`.

## Blog — 9 Categorías Planificadas

| Categoría | Propósito | Ejemplo |
|-----------|-----------|---------|
| Prep física | Evergreen SEO | "Plan de 12 semanas para tu primer trekking" |
| Errores comunes | SEO + engagement | "7 errores que arruinan tu primer viaje de aventura" |
| Inspiración | Social sharing | "De oficinista a cumbre: mi primer volcán" |
| Tips prácticos | SEO long-tail | "Cómo empacar para 5 días de trekking" |
| Trending | Social traffic | "Los destinos de aventura trending 2026" |
| Noticias | Timely relevance | "Nuevo sendero abierto en Patagonia" |
| Listicles | SEO traffic | "10 rutas de trekking que puedes hacer sin experiencia" |
| Personal stories | Emotional connection | Relatos de lectores / community |
| Gear comparativas | Amazon affiliate | "Salomon vs Merrell: ¿cuál bota te conviene?" |

### Generación de Blog y Gear con IA — RAG Grounding

Desde 2026-07, `generate-blog-draft` y (desde 2026-07-26) `generate-gear-draft`
combinan tres fuentes, en este orden de prioridad para cualquier afirmación
factual:

1. **RAG (`knowledge_chunks`, prioridad máxima)** — resuelve el parque de dos
   formas, **la explícita tiene prioridad total sobre la heurística**:
   - **Explícita (determinista):** el admin de blog/gear (`AdminBlogPosts.tsx`
     y `AdminGearArticles.tsx` — card "Desarrollar mi propio tema" y el
     selector de parque en cada sugerencia IA, componente compartido
     `ParkSelect`) puede enviar `destination_id` en el request. Cuando viene,
     la función lo resuelve contra `destinations` (mismo query que ya hacía
     para la heurística, sin segunda consulta) y usa ese resultado directo —
     la heurística de texto NO corre en absoluto. El selector solo lista
     destinos con `park_code` no nulo, así que una selección explícita
     siempre alimenta un `filter_park_code` real.
   - **Heurística (fallback, sin cambios):** si no se envía `destination_id`,
     se sigue resolviendo por coincidencia de texto contra `destinations.title`
     (normalizado sin acentos) — el comportamiento original, para descubrimiento
     libre o posts generales sin selector usado.
   - En ambos casos, una vez resuelto el destino, se llama
     `match_knowledge_chunks` con `filter_park_code`, `match_count=8`,
     `min_similarity=0.4` (misma convención que `concierge-agent`, ADR-015/016 —
     no subir el umbral, llamada RPC sin cambios). Los chunks se inyectan en el
     prompt de Step B como un bloque etiquetado `DATOS VERIFICADOS DE NOMADERIA
     (RAG)`, separado del bloque de voz SOUL y del bloque de resultados de
     `web_search`.
2. **`web_search` (Step A)** — solo para información genuinamente actual o
   trending que el RAG no cubra (noticias, tendencias, cambios recientes).
3. **Ninguna fuente** — el dato se marca inline en `content_markdown` como
   `⚠️ VERIFICAR (IA): <qué falta>` (misma convención que `generate-park-content`)
   y también se agrega a `verify_flags`.

Si no se resuelve ningún parque para el tema (ni por `destination_id` ni por
heurística — post general, ej. "cómo empacar para 5 días de trekking"), el
paso RAG se omite por completo — no se fuerza.

Provenance de auditoría: la respuesta de la función incluye `rag_meta: { used,
chunk_count, park_code, destination_id }`, que `AdminBlogPostForm.tsx` /
`AdminGearArticleForm.tsx` guardan en `ai_content_meta.rag_meta` (columna
añadida en la migración `20260726000000_add_rag_meta_to_ai_content_meta.sql`)
junto a `sources` y `verify_flags`.

**Descubrimiento dirigido (`discover-trending-blog` / `discover-trending-gear`):**
ambas aceptan un `focus` opcional en el body (input "Enfoque (opcional)" junto
al botón de descubrimiento respectivo). Cuando viene, se antepone un bloque al
prompt pidiendo que los candidatos orbiten ese enfoque sin degenerar en un solo
tema genérico repetido. Vacío = comportamiento idéntico al anterior.

**Títulos alternativos (`title_options`):** además de `title`, los schemas de
`blog_draft` y `gear_draft` exigen `title_options` — exactamente 3 títulos
alternativos, ángulo de curiosidad/SEO, voz SOUL en segunda persona directa
apelando a una duda/miedo concreto de principiante. `AdminBlogPostForm.tsx` /
`AdminGearArticleForm.tsx` los muestran como chips tocables bajo el campo
Título; tocar uno reemplaza el valor del título. Campo aditivo — no se persiste
en `blog_posts`/`gear_articles` (solo el título elegido se guarda).

**Diferencia gear vs. blog:** `generate-gear-draft` sigue exigiendo `category`
(no es opcional como en blog), así que el card "Desarrollar mi propio tema" de
gear (`GearDirectTopicCard.tsx`) pide categoría además de tema. El RAG no cubre
precios ni reseñas de producto — esos siempre vienen de `web_search` y quedan
sujetos a `verify_flags` igual que antes.

**Alcance:** el patrón RAG grounding + `destination_id` + descubrimiento
dirigido + `title_options` ahora cubre ambos tipos de contenido editorial —
`generate-blog-draft`/`discover-trending-blog` y `generate-gear-draft`/
`discover-trending-gear`.

## Gear Articles — Pipeline de 12

Prioridad por volumen de búsqueda:
1. Botas de trekking (highest volume)
2. Bastones de senderismo
3. Mochilas de trekking
4. Ropa térmica / capas
5. Sacos de dormir
6. Tiendas de campaña
7. Cámaras para outdoor
8. GPS / navegación
9. Filtros de agua
10. Protección solar
11. Kit de primeros auxilios
12. Accesorios camping

Cada artículo incluye: content_markdown + products JSONB con `{name, price, pros[], cons[], affiliate_url, rating}`.

## Audiencia — Datos Clave

- **Región primaria:** Frontera Tijuana-San Diego + México + USA hispano
- **Rango de presupuesto:** $250-$2,000 USD
- **Nivel:** Principiante a intermedio
- **Motivación:** "Quiero hacerlo pero no sé por dónde empezar"
- **El dato de origen geográfico del quiz** es clave para priorizar contenido regional vs internacional
