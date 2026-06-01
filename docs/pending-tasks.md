# Pendientes y Changelog — Nomaderia Adventures

> **Para agentes AI:** Si el usuario pide algo que depende de una tarea pendiente
> aquí, recuérdale que primero debe completarla. Al terminar cualquier trabajo,
> actualiza este archivo (mueve la tarea de "Pendiente" a "Changelog").
>
> Sitio en producción: **https://nomaderia.com** · Hosting: Cloudflare Pages ·
> Stripe live activo · Primer lead real capturado vía `/sentinel`.

---

## 🙋 Pendientes Humanos (solo Frank puede hacerlos)

Un agente **no** puede completar estos; al sugerir trabajo que dependa de ellos,
referenciar esta lista primero.

- [ ] **Subir `public/diploma.jpg`** — foto del certificado TAP (credencial en
      `SobreNosotros.tsx`).
- [ ] **Configurar WhatsApp Business** en el número `18588996802` y guardar las 4
      respuestas rápidas.
- [ ] **Facebook Pixel:** crear cuenta en Business Manager, obtener el Pixel ID y
      reemplazar `TU_PIXEL_ID_AQUI` en `index.html`.
- [ ] **Iconos PWA:** subir `192x192` y `512x512` a `/public` (hoy el manifest usa
      fallback con `favicon.ico` + `placeholder.svg`).
- [ ] **Desactivar signup público** en Supabase → Authentication → Settings →
      desactivar "Enable email signups".
- [ ] **Regenerar tipos de Supabase** (requiere `SUPABASE_ACCESS_TOKEN`):
      `npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts`
      → elimina los casts `as unknown as SupabaseClient` (ver ADR-009).
- [ ] **Aplicar nueva migración `destination_ai_meta` y regenerar tipos**:
  aplicar migration en Supabase y después correr
  `npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts`.
- [ ] **Frank: aplicar migración `add_destinations_access_fields` y regenerar tipos**:
  correr `supabase db push` para subir columnas nuevas de `public.destinations`
  (`base_city`, `access_type`, `cell_signal_status`) y después regenerar tipos con
  `npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts`.
- [ ] **Secrets de Edge Functions** en Supabase Dashboard → Edge Functions →
      Secrets:
      - `supabase secrets set RESEND_API_KEY=re_xxxxx`
      - `supabase secrets set SITE_URL=https://nomaderia.com`
- [ ] **Habilitar `pg_cron`** (Database → Extensions) para el drip diario, o usar
      cron-job.org con POST diario a la Edge Function.
- [ ] **Verificar sitio en Google Search Console.**
- [ ] **Re-aplicar a Travelpayouts** rechazados cuando el tráfico supere
      ~1,000/mes: GetYourGuide, Booking, Expedia, Trip.com, DiscoverCars.

---

## 🛠️ Pendientes de Código (un agente puede ejecutarlos)

### Prioridad alta
- [ ] **Limpiar precios MXN / legacy en Edge Functions** —
      `supabase/functions/send-drip-emails/index.ts` y
      `send-quiz-results/index.ts` aún contienen precios MXN y/o nombres del
      sistema viejo. Alinear al modelo $29 / $49 USD (ADR-003).
- [ ] **Logo final** — subir a Supabase y actualizar `src/config/assets.ts`
      (resolver el `TODO` de la línea 7).

### Calidad / mantenimiento (tareas separadas)
- [ ] **Lint preexistente:** errores en `src/components/ui/command.tsx`,
      `src/components/ui/textarea.tsx` y `SentinelLanding.tsx`. *No tocar
      `components/ui` salvo decisión explícita.*
- [ ] **Test preexistente:** falla en `src/lib/lazy-with-retry.test.ts`.
- [ ] **Imágenes responsive:** convertir heros de detalle (blog/gear) a
      `srcset`/WebP.

### Contenido en Supabase (requiere revisión manual en `/admin`)
- [ ] Auditar cada **destino**: markdown en español, affiliate links funcionales,
      campos completos (`hero_image_url`, `difficulty_level`, `estimated_budget`,
      `duration`, `country`), `permit_alert_url` donde aplique.
- [ ] Auditar cada **gear article**: JSON de productos con nombre/precio/
      `affiliate_url`/imagen y tag `nomaderia-20` en links de Amazon.
- [ ] Auditar cada **blog post**: title/excerpt/content en español, category
      válida, `reading_time`, tags, links internos.
- [ ] Subir hero images a destinos que aún no tengan.

---

## 🔮 Backlog Futuro

- **Concierge IA (RAG):** diferido hasta primeros clientes (ADR-010). Dirección
  tentativa: agente único con tool-calling + `pgvector`; proveedor de embeddings
  por definir. **No** agregar dependencias todavía.
- **Emails:** Email 4 de re-engagement a 30 días; tracking de opens/clicks con
  webhooks de Resend → tabla `email_events`.
- **Dashboard avanzado:** desglose de conversiones por `source`, top destinos
  recomendados, conversión quiz→email, trends con Recharts.
- **PWA/offline:** service worker + cache de guías para trail sin señal.
- **Performance:** más skeleton loaders, optimización progresiva de imágenes.

---

## Instrucciones para Copilot Agent

Siempre que hagas cambios al código:
1. Lee `CLAUDE.md`, `docs/claude-context.md`, `docs/decisions.md` y este archivo.
2. Un cambio lógico = un commit. `tsc --noEmit` y `npm run build` deben pasar.
3. Actualiza este archivo (mueve la tarea a "Changelog reciente").
4. Si la arquitectura cambió, actualiza `CLAUDE.md`. Si fue una decisión dura,
   añade un ADR en `docs/decisions.md`.

## Completado

- [2026-06-01] ConciergeChat integrado en DestinationDetail — hook use-concierge.ts + componente ConciergeChat.tsx
- [2026-06-01] Creado `supabase/functions/_shared/nomaderia-soul.ts` como mirror runtime; `docs/NOMADERIA_SOUL.md` sigue siendo la fuente de verdad.
- [2026-06-01] Creada `supabase/functions/discover-trending-destinations/index.ts` con OpenAI Responses + web_search para candidatos trending.
- [2026-06-01] Creada `supabase/functions/generate-destination-draft/index.ts` (Step A research + Step B schema), con auth admin y voz compartida `NOMADERIA_SOUL`.
- [2026-06-01] Creados hooks tipados `useTrendingDestinations` y `useDestinationDraft` + tipos compartidos en `src/types/ai-destinations.ts` para invocar Edge Functions con React Query.
- [2026-06-01] Integrado panel AI de discovery en `AdminDestinations` con `useTrendingDestinations`, progreso por etapas cliente y cards reutilizables en `src/components/admin/TrendingDestinationCard.tsx`.
- [2026-06-01] Flujo admin AI completado end-to-end: discover → elegir candidato → auto-fill en `AdminDestinationForm` → confianza/fuentes privadas → guardar draft → `destination_ai_meta` privado tras crear destino nuevo.
- [2026-06-01] Añadida card "Generación con IA" en `AdminDashboard` con conteo admin-only de `destination_ai_meta` y horas ahorradas estimadas.
- [2026-06-01] Actualizado pipeline AI de drafts de destino (`generate-destination-draft` + `src/types/ai-destinations.ts`) para incluir `base_city`, `access_type` y `cell_signal_status` en prompt de investigación y schema estricto.
- [2026-06-01] `AdminDestinationForm` actualizado para integrar `base_city`, `access_type` y `cell_signal_status` en UI (con `VerifyFieldBadge`), auto-fill de IA y payload de guardado a `public.destinations`.

---

## 📜 Changelog reciente

> Histórico condensado por temas. El detalle commit-a-commit anterior a Mayo 2026
> vive en el historial de git. Entradas recientes primero.

### Mayo 2026

**Pricing y conversión**
- Reestructurado a 2 productos + bundle, USD only: Alerta de Permisos $29
  (Stripe), Itinerario Personalizado $29 (WhatsApp), Solución Completa $49
  (WhatsApp). Eliminados precios MXN y nombres legacy en `pricing.ts`,
  `Servicios.tsx`, `PremiumItinerarySection.tsx` y `send-quiz-email`.
- `Alerta de Permisos` ahora cae al Stripe Payment Link real como fallback (antes
  caía a `"#"`).
- Email drip `itinerary_cta` migrado al modelo de 2 productos; CTA principal a
  WhatsApp verde `#25D366`, secundario a `/servicios`.

**WhatsApp y CTAs**
- `src/lib/whatsapp.ts` expone helper único `buildWhatsAppLink(message)` con
  número `18588996802`. Migrados todos los CTAs a mensajes contextuales
  pre-llenados + `trackEvent("cta_itinerario_whatsapp_click", { source })`.
- `StickyMobileCTA` (mobile-first) en páginas de destino, con botón secundario de
  alerta de permisos cuando aplica.

**Admin (rediseño visual)**
- Dashboard: header fijo "Buenos días, Frank" + badge producción, panel "Atención
  hoy" (leads de `sentinel_leads` + `quiz_responses` de 48h con botón WhatsApp),
  stat card "Leads de Alerta", analytics del quiz, badges por tipo de contenido.
- Sidebar: paleta oscura vía variables `--sidebar-*`, logo Nomaderia, pill
  "Producción", sección de usuario.
- Fix `sentinel_leads`: nueva política RLS `SELECT` para admin (el contador
  mostraba 0) + query corregida a `count: exact, head: true` (ver lección en
  `decisions.md`).

**SEO / meta / accesibilidad**
- `usePageMeta()` completo en todas las páginas públicas; meta previews dinámicas
  (title/description/image desde Supabase) en `DestinationDetail` y
  `BlogPostDetail`.
- Contraste WCAG AA: `--muted-foreground` 45%→40% lightness; footnote de
  `PermitScarcity` a `text-xs`.
- `NotFound` branded (Navbar/Footer/`noindex`) + preconnect a Supabase en
  `index.html`.

**Features**
- `ExitIntentModal` (trigger único por sesión, desktop mouseleave / mobile 60%
  scroll) hacia Sentinel, con analytics.
- `PermitScarcity` con datos honestos NPS/Recreation.gov (`yosemite-valley`,
  `gran-canon`).
- PWA mínima instalable: `manifest.webmanifest` + meta tags de installability.
- Cache tuning de React Query: `staleTime` 30 min en contenido estático.

**Higiene**
- Eliminado archivo suelto en `components/ui/`; limpiados `console.*` sobrantes;
  `loading="lazy"` + `fetchPriority="high"` en heros; enlaces externos auditados
  (`rel="noopener noreferrer"`).

### Marzo 2026 (resumen)

- Fase "Armadura de Titanio": Sentry (`@sentry/react`) en `main.tsx` +
  `ErrorBoundary`; tarjetas de auditoría (prueba de venta + verificador de
  imágenes) en `SystemAudit.tsx`; logs estructurados en `send-quiz-email`.
- Media Slider dinámico: hook `use-media.ts`, admin `AdminGallery.tsx`,
  `MediaSlider.tsx` en hero, bucket `media_gallery` + tabla `media_slider`.
- Quiz de 6 preguntas con matching de destinos + analytics; columna
  `main_barrier`; `proximityMap` con llaves de mercado (`sandiego_socal`,
  `tijuana_baja`, `cdmx`, `resto_mx`, `resto_usa`, `otro`).
- Email marketing post-quiz vía Resend (`send-quiz-email`, `send-drip-emails`);
  tabla `email_drip_log` con RLS; panel `AdminEmailLogs.tsx`.
- Base de contenido: 8 destinos iniciales, `PrivacyPolicy` (LFPDPPP),
  `SobreNosotros` (badge TAP), `PremiumItinerarySection` →
  `itinerary_requests`, `AdminItineraryRequests`, hooks SEO
  (`useCanonical`/`useJsonLd`/`usePageMeta`), LoadingSkeletons, ErrorBoundary,
  auditoría Radix (12 paquetes no usados eliminados).
