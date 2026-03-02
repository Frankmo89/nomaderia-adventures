# Tareas Pendientes y Changelog — Nomaderia Adventures

> **Para agentes AI:** Si el usuario pide algo que depende de una tarea pendiente aquí, recuérdale que primero debe completarla.

---

## ⚠️ Tareas Pendientes (requieren acción humana)

### 🔴 Prioridad Alta

#### 📊 Analítica
- [ ] **Configurar** `VITE_GA_MEASUREMENT_ID="G-CK9STWJDFM"` en el archivo `.env` local
- [ ] **Ejecutar** el componente de Google Analytics (`gtag.js`) una vez configurado el `.env` — verificar que el ID real aparece en Network tab del navegador
- [ ] **Reemplazar IDs placeholder** en `index.html`: `XXXXXXXXXXXXXXXXX` → tu Meta Pixel ID real, `G-XXXXXXXXXX` → `G-CK9STWJDFM`
- [ ] Crear cuenta en Facebook Business Manager para obtener el Pixel ID y reemplazar el placeholder en `index.html`
- [ ] Verificar sitio en Google Search Console (requiere dominio)
- [ ] Enviar sitemap.xml (pendiente de implementar)

#### 💼 Negocio / Comercial
- [ ] **Deshabilitar el Sign-up público** en Supabase Dashboard → Authentication → Settings → desactivar "Enable email signups"
- [ ] Comprar dominio (decisión: nomaderia.com vs nomaderia.mx — inclinación hacia .com por alcance)
- [ ] Configurar DNS y hosting de producción
- [ ] Re-aplicar a programas Travelpayouts rechazados cuando tráfico > 1,000/mes:
  - GetYourGuide, Booking, Expedia, Trip.com, DiscoverCars

#### 📝 Contenido
- [ ] **Subir imagen de certificación TAP** → `public/diploma.jpg`
- [ ] Descargar WhatsApp Business y configurar el número de Nomaderia
- [ ] Reemplazar `VITE_WHATSAPP_NUMBER` en el archivo `.env` con el número real
- [ ] Subir la foto/video estrella a la carpeta `/public` y actualizar el `src` en `HeroSection.tsx`
- [ ] Entrar al panel de admin y subir imágenes de portada (hero images) a los destinos que falten
- [ ] Guardar las 4 Respuestas Rápidas en la configuración de WhatsApp Business
- [ ] Agregar hero images a destinos sin imagen
- [ ] Completar affiliate links reales en destinos desde `/admin`

#### 🔑 Supabase Secrets
- [ ] Configurar `RESEND_API_KEY` en Supabase Dashboard > Edge Functions > Secrets
  - Obtener en https://resend.com/api-keys
  - Comando: `supabase secrets set RESEND_API_KEY=re_xxxxx`
- [ ] Configurar `SITE_URL` en los mismos secrets
  - Comando: `supabase secrets set SITE_URL=https://nomaderia.com`
- [ ] Habilitar extensión `pg_cron` en Supabase Dashboard > Database > Extensions
  - Alternativa sin pg_cron: usar cron-job.org (gratis) con POST diario a la Edge Function

### 🟡 Backlog — Código

- [ ] Eliminar `supabase as any` en:
  - `src/pages/admin/AdminItineraryRequests.tsx:56`
  - `src/pages/admin/AdminDashboard.tsx:50`
  - Fix: regenerar tipos con CLI de Supabase
- [ ] Integrar compartir en redes sociales (botones share)
- [ ] Resolver issues de contraste texto para WCAG AA compliance

### 🟢 Preview actual
https://id-preview--119157cf-892e-40be-9417-1be6150581ad.lovable.app/

---

## Changelog (completados)

### ✅ Media Slider Dinámico — Gestor Multimedia para Landing Page (Marzo 2026)
- [x] Creado hook `src/hooks/use-media.ts` con `useMediaSlider()` (TanStack Query, filtra `is_active: true`, ordena por `display_order`) y helpers `uploadMediaItem()`, `toggleMediaActive()`, `deleteMediaItem()`
- [x] Creada página admin `src/pages/admin/AdminGallery.tsx` — subida de archivos (imagen/video), grid con preview, toggle activo/inactivo, eliminar con confirmación (tabla + storage)
- [x] Creado componente `src/components/landing/MediaSlider.tsx` — carrusel con Framer Motion `AnimatePresence` crossfade cada 6 segundos, renderiza `<video>` o `<img>` según `media_type`, overlay oscuro `bg-black/30`
- [x] `HeroSection.tsx` — Reemplazado fondo estático `bg-neutral-800` + overlay por `<MediaSlider />` dinámico (fallback al fondo original si no hay media)
- [x] `AdminLayout.tsx` — Enlace "Galería" con ícono `ImageIcon` agregado al sidebar
- [x] `App.tsx` — Ruta `/admin/gallery` registrada con lazy loading
- [x] Bucket `media_gallery` (público) en Supabase Storage y tabla `media_slider` creados por el dueño
- **Pendiente del dueño:** Regenerar tipos con `npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts` para eliminar cast de tipo en `use-media.ts`
- `src/hooks/use-media.ts` — Hook público + helpers admin
- `src/pages/admin/AdminGallery.tsx` — Panel admin de galería
- `src/components/landing/MediaSlider.tsx` — Carrusel público
- `src/components/landing/HeroSection.tsx` — Integración MediaSlider
- `src/pages/admin/AdminLayout.tsx` — Enlace Galería en sidebar
- `src/App.tsx` — Ruta /admin/gallery

### ✅ Tarea 1.3 — Página /servicios rediseñada con nuevos precios y estructura (Marzo 2026)
- [x] Hero actualizado: headline "Tu aventura, armada paso a paso" con subtítulo motivador para principiantes
- [x] 3 tarjetas de precios con shadcn/ui Card: Weekend $19/$299 (1-3 días), Aventura $35/$549 (4-7 días, badge "Más popular"), Expedición $59/$899 (8+ días, highlight "Soporte por WhatsApp durante el viaje")
- [x] CTAs con ícono WhatsApp (MessageCircle de lucide-react) y mensajes prellenados dinámicos por paquete
- [x] Sección "Cómo Funciona" con 3 pasos: Cuéntanos tu plan, Diseñamos tu ruta, Viaja sin estrés — íconos Lucide (ClipboardList, Route, Palmtree)
- [x] FAQ con Accordion de shadcn/ui — 4 preguntas frecuentes sobre qué incluye un itinerario
- [x] Animaciones Framer Motion con `staggerChildren` para entrada suave de tarjetas de precios
- [x] Dark mode compatible: usa variables CSS (bg-background, text-foreground, bg-card, border-border) en vez de colores hardcodeados
- [x] Ruta `/servicios` ya registrada en `App.tsx` y enlace en Navbar
- `src/pages/Servicios.tsx` — Página rediseñada completa
- `docs/pending-tasks.md` — Changelog actualizado

### ✅ Quiz Refactor: Mercado principal, Lucide icons, y pregunta de barreras (Marzo 2026)
- [x] **docs/supabase-schema.md** — Columna `main_barrier text` (nullable) documentada en `quiz_responses`
- [x] **src/integrations/supabase/types.ts** — `main_barrier` agregado a Row/Insert/Update de `quiz_responses`
- [x] **src/hooks/use-quiz.ts** — `proximityMap` actualizado con nuevas llaves de mercado principal: `tijuana_baja`, `sandiego_socal`, `cdmx`, `resto_mx`, `resto_usa`, `otro`
- [x] **src/hooks/use-quiz.ts** — `main_barrier` insertado en `quiz_responses` desde `handleEmailSubmit`
- [x] **src/hooks/use-quiz.ts** — Propiedad `emoji` eliminada de la interfaz `QuizOption`
- [x] **src/components/landing/QuizSection.tsx** — Emojis reemplazados por íconos de Lucide React (`opt.icon`) en todas las opciones
- [x] **src/components/landing/QuizSection.tsx** — Nueva pregunta `main_barrier` ("¿Qué es lo que más te frena para salir a explorar?") con 4 opciones: `lack_info`, `fitness_doubt`, `no_gear`, `comfort` usando iconos Map, HeartPulse, Backpack, Tent
- [x] **src/components/landing/QuizSection.tsx** — `originOptions` actualizado: Tijuana/Baja, San Diego/SoCal, CDMX, Resto MX, Resto USA, Otro
- [x] **src/pages/admin/AdminQuizResponses.tsx** — `barrierLabels` agregado, `originLabels` actualizado, columna "Barrera" en CSV y tabla visual
- [x] **src/hooks/use-quiz.test.ts** — Tests de origin actualizados con nuevas llaves de mercado
- **Pendiente del dueño:** Ejecutar migración SQL para agregar `main_barrier text` a `quiz_responses` en Supabase Dashboard
- `src/hooks/use-quiz.ts` — Scoring + insert actualizados
- `src/components/landing/QuizSection.tsx` — UI refactorizada
- `src/pages/admin/AdminQuizResponses.tsx` — Dashboard actualizado
- `src/hooks/use-quiz.test.ts` — Tests actualizados
- `docs/supabase-schema.md` — Schema documentado
- `src/integrations/supabase/types.ts` — Tipos TypeScript actualizados

### ✅ Contadores de SocialProof conectados a Supabase via hook dedicado (Marzo 2026)
- [x] Creado hook `src/hooks/use-stats.ts` con `useQuizCount()` y `useDestinationsCount()` — TanStack Query con `{ count: 'exact', head: true }` para conteo eficiente sin descargar data
- [x] `SocialProof.tsx` refactorizado para usar los hooks dedicados en lugar de queries inline (cumple patrón: fetch público siempre via custom hooks en `src/hooks/`)
- [x] Estado de carga usa `Skeleton` de shadcn/ui en lugar de texto plano "···"
- [x] Animación Framer Motion (`AnimatedCounter`) cuenta de 0 al valor real cuando el componente es visible
- [x] Verificado: no hay elementos de video en el componente
- `src/hooks/use-stats.ts` — Nuevo hook de conteos
- `src/components/landing/SocialProof.tsx` — Usa hooks dedicados + Skeleton loading

### ✅ Botones de Pricing en PremiumItinerarySection conectados a WhatsApp (Marzo 2026)
- [x] Botones "Pedir Escapada/Aventura/Nómada" en la sección de precios del homepage ahora abren WhatsApp en nueva pestaña
- [x] Número hardcodeado: `18588996802` (consistente con el resto del sitio)
- [x] Mensajes prellenados específicos por paquete con precio incluido
- [x] Tercer paquete renombrado de "Expedición $49" a "Nómada $75" según requerimiento
- `src/components/landing/PremiumItinerarySection.tsx` — Botones de pricing funcionales con WhatsApp

### ✅ Configuración Comercial — Link de pago oficial (Marzo 2026)
- [x] Creado link de pago oficial **paypal.me/Nomaderia** para recibir pagos de itinerarios personalizados
- [x] Link listo para compartir con clientes en WhatsApp y en la página `/servicios`

### ✅ Fase 4 — Página índice /destinos (Marzo 2026)
- [x] Creada nueva página `src/pages/Destinations.tsx` con Navbar, título "Todos Nuestros Destinos", catálogo completo y Footer
- [x] `DestinationsCatalog` refactorizado para aceptar prop opcional `limit?: number`
- [x] Si `limit` existe, se aplica `.slice(0, limit)` y se muestra botón "Ver todos los destinos →"
- [x] Si `limit` no existe, se muestran todos los destinos sin botón
- [x] `Index.tsx` ahora usa `<DestinationsCatalog limit={3} />`
- [x] Ruta `/destinos` registrada en `App.tsx` con lazy loading
- [x] `src/pages/Destinations.tsx` — Nueva página índice de destinos
- [x] `src/components/landing/DestinationsCatalog.tsx` — Prop `limit` opcional
- [x] `src/pages/Index.tsx` — Pasa `limit={3}` al catálogo
- [x] `src/App.tsx` — Ruta `/destinos`

### ✅ Fase 3 — Compactar catálogo de destinos en Homepage (Marzo 2026)
- [x] Se compactó el catálogo de destinos en el Home a 3 items con botón de Ver Todos
- [x] `.slice(0, 3)` aplicado después de `filterByDifficulty(level)` para limitar a 3 destinos por pestaña
- [x] Botón "Ver todos los destinos →" con `variant="outline"` y `size="lg"` debajo de las Tabs
- [x] Botón usa `<Link to="/destinos">` envuelto en `<Button asChild>`
- `src/components/landing/DestinationsCatalog.tsx` — Catálogo compactado + botón Ver Todos

### ✅ Fase 2 — Design System (modo oscuro) en TravelInsuranceSection (Marzo 2026)
- [x] Se aplicó el Design System (modo oscuro) a la sección de Seguros para mejorar el contraste
- [x] Contenedor `<section>` con fondo Charcoal `bg-[#1C1917]`
- [x] Textos principales (h2, span, p) en Light Sand `text-[#F5F0EB]` con opacidades `/70` para jerarquía
- [x] Tarjetas de beneficios con fondo translúcido `bg-white/5` y borde `border-white/10`
- [x] Íconos y acento "Aventura" en Sunset Orange `text-[#D97706]`, fondos `bg-[#D97706]/15`
- [x] Botón CTA con `bg-[#D97706] text-[#F5F0EB] hover:bg-[#D97706]/90`
- `src/components/landing/TravelInsuranceSection.tsx` — Inversión de colores completa

### ✅ Fase 1 — Embudo de ventas en Index.tsx (Marzo 2026)
- [x] El layout de Index.tsx ha sido reordenado para optimizar el embudo de ventas
- [x] Nuevo orden: Navbar → Hero → SocialProof → PremiumItinerarySection → TravelInsuranceSection → CTA Inline → Quiz → DidYouKnow → Destinos → Gear → Blog → Newsletter → Footer
- [x] Nuevo bloque CTA inline con fondo `bg-secondary/20`, heading "¿Listo para tu primera gran aventura?" y botón WhatsApp "Diseña tu viaje a medida"
- `src/pages/Index.tsx` — Reordenado y CTA inline añadido

### ✅ Tarea 1.4 — Componente ArticleWhatsAppCTA reutilizable (Marzo 2026)
- [x] Nuevo componente `src/components/ArticleWhatsAppCTA.tsx` con diseño editorial limpio
  - Fondo sutil Light Sand (`#F5F0EB`), bordes finos, animación Framer Motion
  - Copy motivador: "¿Listo para vivir esta aventura? Deja de planear y empieza a empacar."
  - Botón CTA: "Diseña mi viaje a medida" con ícono MessageCircle
  - Prop `title` para mensaje contextual: "¡Hola! Acabo de leer sobre [title] y me gustaría que me ayudes a armar mi viaje."
  - Usa `buildWhatsAppUrl()` con número hardcodeado `18588996802`
- [x] Insertado al final del contenido principal en `DestinationDetail.tsx` (antes de PremiumItinerarySection)
- [x] Insertado al final del contenido principal en `BlogPostDetail.tsx` (antes de artículos relacionados)
- [x] Reemplaza las Cards CTA inline anteriores en ambas páginas por el componente reutilizable
- `src/components/ArticleWhatsAppCTA.tsx` — Nuevo componente
- `src/pages/DestinationDetail.tsx` — Usa ArticleWhatsAppCTA
- `src/pages/BlogPostDetail.tsx` — Usa ArticleWhatsAppCTA

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

### ✅ Banners de conversión WhatsApp en Blog y Destinos (Marzo 2026) — *Reemplazado por Tarea 1.4*
- [x] CTA WhatsApp inline original (ya eliminado) — sustituido por componente reutilizable `ArticleWhatsAppCTA.tsx`

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

### ✅ SocialProof: Alto Impacto Visual con Contadores Animados (Marzo 2026)
- [x] Sección de Prueba Social ahora es dinámica con datos reales de Supabase y contadores animados
- [x] `AnimatedCounter` interno usa `useMotionValue`, `useTransform`, `useSpring` y `useInView` de Framer Motion para contar de 0 al valor real cuando la sección es visible
- [x] Fondo Charcoal (`bg-[#1C1917]`) como bloque de interrupción visual en el scroll
- [x] Tarjetas oscuras con borde naranja sutil: `bg-white/5 border border-[#D97706]/20`
- [x] Texto principal en Light Sand: `text-[#F5F0EB]`
- [x] Hover interactivo: `whileHover={{ y: -10, borderColor: "#D97706" }}`
- [x] Tarjeta TAP sin número animado, con ícono ShieldCheck pulsante en naranja
- [x] CTA y badge en Sunset Orange (`#D97706`)
- `src/components/landing/SocialProof.tsx` — Rediseño completo con contadores animados

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

---

## 🔮 Pendientes Futuros (backlog)

### 📧 Emails Futuros
- Email 4 — Re-engagement a los 30 días para usuarios que no han vuelto al sitio
- Tracking de opens/clicks con Resend webhooks → tabla `email_events`
- Email 2 (3 días post-quiz): "5 cosas que desearía saber antes de mi primera aventura" — contenido educativo + gear
- Email 3 (7 días post-quiz): Oferta directa itinerario personalizado con precios
- Requiere: tabla email_queue + Supabase scheduled function o pg_cron

### 🚀 Mejoras Técnicas
- Performance: lazy loading imágenes, hero images WebP/srcset, más skeleton loaders
- Dashboard avanzado: top destinos recomendados, conversión quiz→email, trends con Recharts
- PWA/offline: service worker, manifest.json, cache de guías para trail sin señal
- Chatbot WhatsApp: integración con WhatsApp Business API para paquete Expedición
