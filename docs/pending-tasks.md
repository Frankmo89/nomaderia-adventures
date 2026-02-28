# Tareas Pendientes y Changelog — Nomaderia Adventures

> **Para agentes AI:** Si el usuario pide algo que depende de una tarea pendiente aquí, recuérdale que primero debe completarla.

## Tareas del Dueño (requieren acción humana)

### 🌐 Dominio y Hosting
- [ ] Comprar dominio (decisión: nomaderia.com vs nomaderia.mx — inclinación hacia .com por alcance)
- [ ] Configurar DNS y hosting de producción
- [ ] Preview actual: https://id-preview--119157cf-892e-40be-9417-1be6150581ad.lovable.app/

### 📊 Analytics y Monetización
- [ ] Configurar Google Analytics o Plausible (no hay tracking instalado)
- [ ] Verificar sitio en Google Search Console (requiere dominio)
- [ ] Enviar sitemap.xml (pendiente de implementar)
- [ ] Re-aplicar a programas Travelpayouts rechazados cuando tráfico > 1,000/mes:
  - GetYourGuide, Booking, Expedia, Trip.com, DiscoverCars

### 📝 Contenido
- [ ] Subir imagen del diploma de agente de viajes → `public/diploma.jpg`
- [ ] Agregar hero images a destinos sin imagen
- [ ] Completar affiliate links reales en destinos desde `/admin`

### 🔑 Secrets de Supabase (requieren acción)
- [ ] Configurar `RESEND_API_KEY` en Supabase Dashboard > Edge Functions > Secrets
  - Obtener en https://resend.com/api-keys
  - Comando: `supabase secrets set RESEND_API_KEY=re_xxxxx`
- [ ] Configurar `SITE_URL` en los mismos secrets
  - Comando: `supabase secrets set SITE_URL=https://nomaderia.com`
- [ ] Habilitar extensión `pg_cron` en Supabase Dashboard > Database > Extensions
  - Alternativa sin pg_cron: usar cron-job.org (gratis) con POST diario a la Edge Function

### 🔧 Código Pendiente
- [ ] Eliminar `supabase as any` en:
  - `src/pages/admin/AdminItineraryRequests.tsx:56`
  - `src/pages/admin/AdminDashboard.tsx:50`
  - Fix: regenerar tipos con CLI de Supabase
- [ ] Integrar compartir en redes sociales (botones share)
- [ ] Resolver issues de contraste texto para WCAG AA compliance

## Changelog (completados)

### ✅ Quiz: Combinada temporada + zona de origen (Febrero 2026)
- [x] **Quiz: Combinada temporada + zona de origen** — Preguntas 5 y 6 combinadas en una sola pantalla con Select dropdowns. Origen ahora usa zonas específicas (Frontera MX-USA, Centro MX, Sur MX, California/SW USA, etc.) para mejor granularidad en recomendaciones de presupuesto. Quiz reducido de 6 a 5 pasos.

### ✅ Resilient Lazy Loading (Febrero 2026)
- [x] **Resilient lazy loading** — `lazyWithRetry()` con retry automático + backoff exponencial + reload por deploy + ErrorBoundary con detección de chunk errors y UI de reconexión.
- `src/lib/lazy-with-retry.ts` — Wrapper de `React.lazy()` con retry automático (2 reintentos, backoff exponencial) + reload por deploy
- `src/App.tsx` — Migrados todos los `lazy()` a `lazyWithRetry()`
- `src/components/ErrorBoundary.tsx` — Detección de chunk load errors con UI específica ("Problema de conexión")
- `src/main.tsx` — Limpieza de `sessionStorage` key `chunk-reload` en boot exitoso

### ✅ Blog Preview en Homepage (Febrero 2026)
- Nuevo componente BlogPreview muestra 3 posts aleatorios/rotativos del blog
- Usa hook useBlogPosts() existente (TanStack Query)
- Cards con imagen, categoría badge, fecha, descripción truncada
- CTA "Ver todo el blog" al final
- Integrado en Index.tsx entre GearPreview y SocialProof
- Si no hay posts publicados, la sección no se renderiza

### ✅ SocialProof: Estadísticas Reales (Febrero 2026)
- Reemplazó testimonios falsos con 3 tarjetas de datos reales
- Contador de quiz_responses desde Supabase (crece automáticamente)
- Contador de destinos publicados desde Supabase
- Badge de certificación TAP Test
- CTA al quiz al final de la sección
- Mismo estilo visual del sitio (bg-muted, noise, Framer Motion)

### ✅ Sección "¿Sabías que puedes...?" Premium (Febrero 2026)
- Datos dinámicos desde Supabase (ya no hardcodeados)
- Imágenes reales de hero_image_url de cada destino
- Bento grid en desktop (card principal grande + 4 secundarias)
- Cards cinematográficas de 420px en mobile con snap scroll
- Badge de dificultad con color, meta info (país, días, presupuesto)
- Mapeo de textos emocionales por slug de destino
- CTA al quiz al final de la sección
- Subtítulo "Aventuras reales para principiantes"

### ✅ Gear SEO Estructural (Febrero 2026)
- GearArticleDetail: usePageMeta, JSON-LD Article mejorado con articleSection + inLanguage, BreadcrumbList, breadcrumbs visuales con aria-current, fecha de publicación, CTA interno (quiz + calculadora)
- GearListing: usePageMeta, JSON-LD CollectionPage, fecha en cada card
- Patrón ahora consistente en blog, destinos y gear

### ✅ Email Drip Sequence Completo (Febrero 2026)
- Tabla `email_drip_log` con RLS e índice para deduplicación
- Edge Function `send-quiz-email` — Email 1 inmediato al completar quiz (ya existente, integrada)
- Edge Function `send-drip-emails` — Emails 2 (gear guide, 3 días) y 3 (itinerary CTA, 7 días)
- `use-quiz.ts` — Bug fix: eliminado código `emailError` fuera de scope + `failed_email_events` inexistente
- `AdminEmailLogs.tsx` — Panel admin con tabla de logs, badges por tipo/estado, exportar CSV
- `AdminDashboard.tsx` — Nueva stat card "Emails Enviados" con conteo desde `email_drip_log`
- `AdminLayout.tsx` + `App.tsx` — Ruta `/admin/email-logs` con ícono 📧 en sidebar
- Migración pg_cron: cron job diario 16:00 UTC (10:00 AM CT) para `send-drip-emails`
- **Pendiente del dueño:** Configurar `RESEND_API_KEY` en Supabase secrets
- **Pendiente del dueño:** Habilitar pg_cron en Dashboard > Database > Extensions

### ✅ Email Marketing Post-Quiz (Febrero 2026)
- Supabase Edge Function `send-quiz-email` envía email personalizado via Resend API
- Se llama desde `use-quiz.ts` después de guardar respuesta del quiz
- Email dark theme con destino #1 + imagen + alternativas + CTA itinerario
- El email no bloquea la UI — si falla, usuario ve resultados igual
- From: hola@nomaderia.com (dominio verificado en Resend)
- Secrets: RESEND_API_KEY + SITE_URL configurados en Supabase Edge Functions

- ✅ **Quiz de 6 preguntas** con matching de destinos + analytics en admin
- ✅ **8 destinos** insertados (Yosemite a Torres del Paine)
- ✅ **PrivacyPolicy.tsx** — `/privacidad` con LFPDPPP completa
- ✅ **SobreNosotros.tsx** — `/sobre-nosotros` con badge de credencial TAP
- ✅ **Footer actualizado** — Instagram, Facebook, TikTok reales + mailto
- ✅ **PremiumItinerarySection** — Dialog + form → `itinerary_requests`
- ✅ **AdminItineraryRequests** — Tabla + CSV export + stat card en dashboard
- ✅ **SEO hooks** — `useCanonical()` + `useJsonLd()` en todas las páginas de detalle
- ✅ **Auditoría Radix** — 12 paquetes no usados eliminados
- ✅ **LoadingSkeletons** — Skeleton loaders para destination, gear, card grid
- ✅ **ErrorBoundary** — Wrapper genérico para rutas

## Instrucciones para Copilot Agent

Siempre que hagas cambios al código:
1. Actualiza este archivo con lo que se completó
2. Agrega recomendaciones de próximos pasos si aplica
3. Si creas archivos nuevos, actualiza la estructura en `CLAUDE.md` si es necesario

## Pendientes Futuros

### 📧 Emails Futuros
- Email 4 — Re-engagement a los 30 días para usuarios que no han vuelto al sitio
- Tracking de opens/clicks con Resend webhooks → tabla `email_events`

### 📧 Emails Futuros (pendientes — archivo histórico)
- Email 2 (3 días post-quiz): "5 cosas que desearía saber antes de mi primera aventura" — contenido educativo + gear
- Email 3 (7 días post-quiz): Oferta directa itinerario personalizado con precios
- Requiere: tabla email_queue + Supabase scheduled function o pg_cron

### 💰 Página de Pricing: Itinerarios Personalizados (pendiente)
- Weekend (1-3 días): $299 MXN / $19 USD
- Aventura (4-7 días): $549 MXN / $35 USD
- Expedición (8+ días): $899 MXN / $59 USD — incluye soporte WhatsApp
- Incluye: itinerario día a día, presupuesto, checklist gear, tips seguridad
- Integración: Stripe + PayPal + MercadoPago

### 🚀 Mejoras Técnicas (backlog)
- Performance: lazy loading imágenes, hero images WebP/srcset, más skeleton loaders
- Dashboard avanzado: top destinos recomendados, conversión quiz→email, trends con Recharts
- PWA/offline: service worker, manifest.json, cache de guías para trail sin señal
- Chatbot WhatsApp: integración con WhatsApp Business API para paquete Expedición
