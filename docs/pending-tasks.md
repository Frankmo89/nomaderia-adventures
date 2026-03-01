# Tareas Pendientes y Changelog — Nomaderia Adventures

> **Para agentes AI:** Si el usuario pide algo que depende de una tarea pendiente aquí, recuérdale que primero debe completarla.

### 📝 TAREAS MANUALES PARA FRANK (Dueño)

- [ ] Descargar WhatsApp Business y configurar el número de Nomaderia.
- [ ] Reemplazar VITE_WHATSAPP_NUMBER en el archivo .env con el número real.
- [ ] Subir la foto/video estrella a la carpeta `/public` y actualizar el src en `HeroSection.tsx`.
- [ ] Entrar al panel de admin de Nomaderia y subir imágenes de portada (hero images) a los destinos que falten.
- [ ] Crear cuenta en Facebook Business Manager para obtener el Pixel ID y reemplazar el placeholder en index.html.
- [ ] Crear cuenta en Google Analytics para obtener el Measurement ID y reemplazar el placeholder en index.html.
- [ ] Guardar las 4 Respuestas Rápidas en la configuración de WhatsApp Business.

## Tareas del Dueño (requieren acción humana)

### 🌐 Dominio y Hosting
- [ ] Comprar dominio (decisión: nomaderia.com vs nomaderia.mx — inclinación hacia .com por alcance)
- [ ] Configurar DNS y hosting de producción
- [ ] Preview actual: https://id-preview--119157cf-892e-40be-9417-1be6150581ad.lovable.app/

### 📊 Analytics y Monetización
- [x] Scripts de Meta Pixel y Google Analytics (GA4) agregados en `index.html` con IDs placeholder
- [ ] **Reemplazar IDs placeholder** en `index.html`: `XXXXXXXXXXXXXXXXX` → tu Meta Pixel ID real, `G-XXXXXXXXXX` → tu GA4 Measurement ID real
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

### ✅ Botones de Pricing conectados a WhatsApp (Marzo 2026)
- [x] Botones "Pedir mi Escapada/Aventura/Expedición" en `/servicios` ahora abren WhatsApp en nueva pestaña
- [x] Número final hardcodeado: `18588996802` (ya no depende de `VITE_WHATSAPP_NUMBER`)
- [x] Mensajes prellenados específicos por paquete con precio incluido
- [x] `Servicios.tsx` sigue usando `buildWhatsAppUrl()`, ahora con número hardcodeado y override por paquete (no se construye la URL inline con `encodeURIComponent`)
- `src/pages/Servicios.tsx` — Botones de pricing funcionales con WhatsApp

### ✅ Hero de PremiumItinerarySection optimizado (Marzo 2026)
- [x] Badge cambiado de "✦ Exclusivo · Solo 5 cupos al mes" a "✦ Diseño 100% Personalizado"
- [x] Badge con fondo transparente (bg-transparent), borde secondary sólido y texto secondary
- [x] Subtítulo oscurecido de text-muted-foreground a text-foreground/70 para mejor contraste
- [x] Añadido mb-16 al subtítulo (antes mb-12) para breathing room antes de las tarjetas
- `src/components/landing/PremiumItinerarySection.tsx` — Hero refinado

### ✅ Meta Pixel y Google Analytics (GA4) (Marzo 2026)
- [x] Script estándar de Meta Pixel con `fbq('track', 'PageView')` y `<noscript>` fallback
- [x] Script estándar de Google Analytics (GA4) con `gtag.js`
- [x] IDs placeholder (`XXXXXXXXXXXXXXXXX` y `G-XXXXXXXXXX`) listos para reemplazo
- [x] Comentarios HTML en español antes de cada bloque de script
- [x] Scripts directos en `index.html`, sin dependencias npm adicionales
- `index.html` — Scripts de tracking en `<head>`

### ✅ Banners de conversión WhatsApp en Blog y Destinos (Marzo 2026)
- [x] Card CTA WhatsApp en `DestinationDetail.tsx` antes de `PremiumItinerarySection`
  - Título dinámico: "¿Quieres que te arme este viaje a [dest.title]?"
  - Subtítulo: "Te preparo un itinerario personalizado con todo lo que necesitas."
  - Botón: "Plática Conmigo por WhatsApp →" con mensaje prellenado
- [x] Card CTA WhatsApp en `BlogPostDetail.tsx` después del contenido del post
  - Título: "¿Necesitas ayuda para planear esto?"
  - Subtítulo: "Yo te armo el viaje completo — desde $9 USD."
  - Botón: "Escríbeme por WhatsApp →" con mensaje prellenado incluyendo título del artículo
- [x] Ambas Cards usan `buildWhatsAppUrl()` de `src/lib/whatsapp.ts`
- [x] Cards se ocultan completamente cuando `VITE_WHATSAPP_NUMBER` no está configurado
- [x] Diseño: `bg-primary/5`, `border-primary/20`, textos oscuros de alto contraste
- `src/pages/DestinationDetail.tsx` — Nueva Card CTA WhatsApp
- `src/pages/BlogPostDetail.tsx` — Nueva Card CTA WhatsApp

### ✅ PremiumItinerarySection: Tarjetas de precio en lugar de formulario (Marzo 2026)
- [x] Eliminado formulario modal (Dialog, Form, inputs, Zod schema, Supabase insert)
- [x] Reemplazado con 3 tarjetas compactas de precio: Escapada $9, Aventura $25, Expedición $49
- [x] Cada tarjeta con 3 viñetas principales y botón WhatsApp con mensaje prellenado
- [x] Aventura destacada con `border-primary` y badge "Más Popular"
- [x] Enlace "Ver todos los detalles →" a `/servicios` debajo de las tarjetas
- [x] Mantenidos título "Tu Aventura, Tu Medida", badge "Exclusivo" y animaciones Framer Motion
- [x] Colores adaptados al tema claro (textos oscuros)
- [x] Eliminada prop `destinationName` (ya no necesaria sin formulario)
- [x] Refactorizado `buildWhatsAppUrl` a helper centralizado `src/lib/whatsapp.ts`
- [x] Actualizados WhatsAppButton, HeroSection, PremiumItinerarySection, Servicios para usar helper compartido
- `src/lib/whatsapp.ts` — Helper centralizado para URLs de WhatsApp
- `src/components/landing/PremiumItinerarySection.tsx` — Refactorizado completo
- `src/components/WhatsAppButton.tsx` — Usa helper centralizado
- `src/components/landing/HeroSection.tsx` — Usa helper centralizado
- `src/pages/Servicios.tsx` — Usa helper centralizado
- `src/pages/DestinationDetail.tsx` — Removida prop `destinationName`

### ✅ Pivot visual a Light Theme (Marzo 2026)
- [x] **Pivot visual a Light Theme completado** — Migración de dark mode nativo a diseño luminoso, limpio y editorial enfocado en fotografía (estilo MBA). Fondo #FAFAFA, texto #1C1917, acento primario #D97706, acento secundario #166534. Gradientes de imagen actualizados de `from-background` a `from-black` para mantener legibilidad. Hero sections de detalle con texto blanco sobre overlay oscuro. Navbar con texto blanco en modo transparente (sobre hero) y texto oscuro al hacer scroll. `prose-invert` eliminado. `.dark` class removida. CLAUDE.md actualizado con nuevo Design System.
- [x] **Fix darkMode config** — Restaurado `darkMode: ["class"]` en `tailwind.config.ts` para evitar que el OS del usuario active dark mode via media query en componentes de shadcn/ui.
- [x] **Hero Inmersivo** — Nuevo HeroSection con headline "Tu Concierge de Aventuras en Español", CTA primario WhatsApp ("Plática Conmigo"), CTA secundario al quiz, badge de confianza TAP, fondo temporal `bg-neutral-800` listo para video/foto real.
- [x] **Fix botón secundario Hero** — Corregido botón outline que se renderizaba como bloque blanco sólido. Forzadas clases `bg-transparent border border-white text-white hover:bg-white/10` para que sea ghost real sobre fondo oscuro.
- [x] **Página de Servicios editorial** — Página `/servicios` con diseño luminoso: hero minimalista con badge TAP en secondary (#166534), sección "Cómo Funciona" con 3 pasos, tarjetas de precio (Escapada $9 / Aventura $25 / Expedición $49) con bg-white shadow-lg, Aventura destacada con border-primary y badge "Más Popular", FAQ con Accordion, links WhatsApp prellenados.

### ✅ Tarea 1.2 — Botón flotante WhatsApp con mensaje contextual (Marzo 2026)
- [x] **Botón flotante WhatsApp** — Componente `WhatsAppButton.tsx` con icono SVG inline, color verde WhatsApp (#25D366), posición fixed inferior derecha (z-50), animación de entrada con Framer Motion (scale desde 0, delay 1s), tooltip "Plática conmigo" en desktop, oculto en rutas /admin/*. Renderizado en App.tsx fuera de `<Routes>`.
- [x] **Número hardcodeado** — `18588996802` (ya no depende de `VITE_WHATSAPP_NUMBER`)
- [x] **Mensaje contextual** — `getPageLabel()` detecta la ruta actual y genera: "¡Hola! Estoy viendo [página] y me gustaría más información." Cubre: `/`, `/calculadora`, `/blog`, `/gear`, `/servicios`, `/sobre-nosotros`, `/privacidad`, `/destinos/:slug`, `/blog/:slug`, `/gear/:slug`
- `src/components/WhatsAppButton.tsx` — Componente del botón flotante (Tarea 1.2 completada)
- `src/App.tsx` — Import y render de WhatsAppButton fuera de Routes

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

### 💰 ~~Página de Pricing: Itinerarios Personalizados~~ ✅ (completado)
- [x] Página `/servicios` con 3 paquetes Travel Concierge (Escapada, Aventura, Expedición)
- [x] Hero section con badge TAP + título + subtítulo
- [x] Sección "Cómo Funciona" con 3 pasos (MessageCircle, Map, Smile)
- [x] 3 tarjetas de precio con Card de shadcn/ui, Framer Motion stagger
- [x] Botones WhatsApp directos por paquete con mensaje prellenado
- [x] FAQ con Accordion de shadcn/ui (5 preguntas)
- [x] Ruta eager load en App.tsx
- [x] Link "Servicios" en Navbar entre "Blog" y "Calculadora"

### 🚀 Mejoras Técnicas (backlog)
- Performance: lazy loading imágenes, hero images WebP/srcset, más skeleton loaders
- Dashboard avanzado: top destinos recomendados, conversión quiz→email, trends con Recharts
- PWA/offline: service worker, manifest.json, cache de guías para trail sin señal
- Chatbot WhatsApp: integración con WhatsApp Business API para paquete Expedición
