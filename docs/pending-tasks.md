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

### 🔧 Código Pendiente
- [ ] Eliminar `supabase as any` en:
  - `src/pages/admin/AdminItineraryRequests.tsx:56`
  - `src/pages/admin/AdminDashboard.tsx:50`
  - Fix: regenerar tipos con CLI de Supabase
- [ ] Integrar compartir en redes sociales (botones share)
- [ ] Resolver issues de contraste texto para WCAG AA compliance

## Changelog (completados)

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

### 📧 Emails Futuros (pendientes)
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
