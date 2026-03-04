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
4. Itinerario personalizado → pago via Stripe/PayPal/MercadoPago [pendiente]

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
