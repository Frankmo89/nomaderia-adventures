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
- [ ] **Frank: aplicar migración `create_ai_content_meta` y regenerar tipos**:
  correr `supabase db push` para crear `public.ai_content_meta` y después regenerar tipos con
  `npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts`.
- [ ] **Frank: aplicar migración `create_permit_alerts_tables` y regenerar tipos**:
  correr `supabase db push` para crear `public.permit_windows` y `public.permit_alerts`, y después regenerar tipos con
  `npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts`.
- [ ] **Secrets de Edge Functions** en Supabase Dashboard → Edge Functions →
      Secrets:
      - `supabase secrets set RESEND_API_KEY=re_xxxxx`
      - `supabase secrets set SITE_URL=https://nomaderia.com`
- [ ] **Frank: configurar secret y cron para alertas de permisos (Paso 8)**:
  - `supabase secrets set CRON_SECRET=<valor_largo_y_unico>`
  - Programar ejecución diaria de `check-permit-alerts` con header `x-cron-secret: <CRON_SECRET>` (pg_cron o cron-job.org).
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
- **Performance:** branded skeleton loaders ✅ (I7), optimización progresiva de imágenes.

---

## Instrucciones para Copilot Agent

Siempre que hagas cambios al código:
1. Lee `CLAUDE.md`, `docs/claude-context.md`, `docs/decisions.md` y este archivo.
2. Un cambio lógico = un commit. `tsc --noEmit` y `npm run build` deben pasar.
3. Actualiza este archivo (mueve la tarea a "Changelog reciente").
4. Si la arquitectura cambió, actualiza `CLAUDE.md`. Si fue una decisión dura,
   añade un ADR en `docs/decisions.md`.

## Completado

- [2026-06-03] Admin: WhatsApp + expandable message in itinerary requests, calmed "Sin contactar" badge — (1) AdminItineraryRequests: added `MessageCircle` + `buildWhatsAppLink` import; WhatsApp "WA" button per row using `buildWhatsAppLink()` with prefilled `"Hola {nombre}, recibí tu solicitud para {destino}. ¿Platicamos?"` message; `expandedIds: Set<string>` state + `toggleExpanded` helper; Mensaje cell now shows full text when expanded, `line-clamp-2` when not; "Ver más"/"Ver menos" toggle button appears when message > 80 chars; `cn()` used for conditional clamp class; column count bumped to 7 (`COL_COUNT = 7`); colSpan + skeleton updated accordingly; `cn` + `buildWhatsAppLink` imports added. (2) AdminDashboard: both "Sin contactar" badge instances (`animate-pulse bg-[#FEF3E2] text-[#B45309]`) replaced with calm neutral style (`bg-[#F0EBE0] text-[#6B6660] border-[#E2D9C5]`, no animation, `font-medium` instead of `font-semibold`); `// NOTE` comment added before each pointing to upcoming contact-status persistence. TypeScript clean, build passes.
- [2026-06-03] Admin Quiz Responses: recommended destination column, fitness/budget filter chips, WhatsApp follow-up — (1) Added `recommended_destinations` column (sortable via `QuizSortKey`): displays `fmtSlug(dests[0])` + amber `+N` badge when multiple; sorts by first slug; included in CSV export. (2) Filter chips row above table: Fitness (Todos / Sedentario / Activo casual / Regular / Muy activo) and Presupuesto (Todos / Mochilero / Balanceado / Cómodo / Sin límite); dark pills `bg-stone-800 border-stone-700`, active pill `bg-primary text-primary-foreground`; each chip click toggles filter and resets page; pipeline: email search → fitness → budget → sort → paginate. (3) WhatsApp follow-up button per row when email present: reuses `buildWhatsAppLink()`, message prefills `"Hola, vi que te recomendamos {destino}. ¿Te ayudo a planear tu viaje?"` (generic fallback when no destination). (4) Legacy origin keys (`mx_border`, `mx_center`, etc.) stripped of "(Legacy)" suffix in display labels — all known keys already mapped; unknown `travel_style` values still fall back to raw string (monitor for new values if quiz origin options expand). No query changes, no writes. TypeScript clean, build passes.
- [2026-06-03] Admin: branded AdminEmptyState component + applied to all list pages, distinct no-data vs no-results states — Created `src/components/admin/EmptyState.tsx` (`AdminEmptyState`: Lucide icon in `bg-stone-800/70` soft circle, `font-serif` title, `text-stone-400` description, optional amber `Button` CTA that renders as `<Link>` when `href` is given). Applied to 8 pages with per-page domain icons and copy: AdminDestinations (MapPin, "Aún no hay destinos" + create CTA), AdminGearArticles (Package, "Aún no hay artículos de equipo" + create CTA), AdminBlogPosts (FileText, "Aún no hay posts" + create CTA), AdminQuizResponses (ClipboardList, "Todavía nadie ha completado el quiz"), AdminSubscribers (Users, "Aún no hay suscriptores"), AdminSentinelLeads (Target, "Aún no hay leads de Sentinel"), AdminItineraryRequests (Map, "Aún no hay solicitudes de itinerario"), AdminEmailLogs (Mail, "Aún no se han enviado correos"). No-data uses domain icon + branded copy; no-results uses Search icon + `"Sin resultados para "${search}""` with no CTA. TypeScript clean, build passes.
- [2026-06-03] Admin: client-side pagination (25/page) on all list tables — Created `src/components/admin/Pagination.tsx` (`AdminPagination` component: "Anterior"/"Siguiente" buttons dark-themed, disabled at bounds, "Página X de Y · N resultados" label, returns null when ≤1 page). Applied to 8 pages: AdminDestinations, AdminGearArticles, AdminBlogPosts, AdminQuizResponses, AdminSubscribers, AdminSentinelLeads, AdminItineraryRequests, AdminEmailLogs. Pipeline per page: raw items → search filter (`filtered`) → sort (`sorted`) → paginate (`paged`) → render. Page resets to 1 synchronously on each search input change. No `.select()` queries changed. TypeScript clean, build passes.
- [2026-06-03] Admin: reusable sortable column headers across all list tables — Created `src/hooks/use-sortable.ts` (`useSortable<K>` hook tracks sortKey/sortDir with asc→desc→none toggle; `applySortable<I,K>` pure function sorts a copy, strings via localeCompare, ISO dates/numbers by raw comparison). Created `src/components/admin/SortableHeader.tsx` (wraps `<TableHead>`, shows ChevronUp/Down/ChevronsUpDown indicator, active column highlighted in `text-primary`). Applied to 8 pages: AdminDestinations (title, country, difficulty_level, created_at), AdminGearArticles (title, category, created_at), AdminBlogPosts (title, category, created_at), AdminQuizResponses (fitness_level, budget_range, created_at), AdminSubscribers (email, source, created_at), AdminSentinelLeads (email, source, created_at), AdminItineraryRequests (name, destination, created_at), AdminEmailLogs (email, email_type, status, sent_at). Sort composes with search filter — `sorted = applySortable(filtered, ...)`. No queries changed. TypeScript clean, build passes.
- [2026-06-03] Admin: localized difficulty/category/window_type labels + created_at columns on content tables — (1) AdminDestinations: `difficultyLabel` map (easy→Fácil, moderate→Moderada, challenging→Difícil) applied to Badge; "Creado" column added (es-MX short date). (2) AdminGearArticles: `gearCategoryLabel` map mirrors GearPreview.tsx (boots→Botas, poles→Bastones, cameras→Fotografía, backpacks→Mochilas, clothing→Ropa, accessories→Accesorios) applied to Badge; "Creado" column. (3) AdminBlogPosts: `titleCase()` helper renders first-char-uppercase fallback on category Badge (no public map exists); "Creado" column. (4) AdminPermitWindows line 572: `windowTypeLabel` map (lottery→Lotería, reservation_release→Liberación, first_come→Por llegada) applied to existing Badge. No DB queries changed. TypeScript clean, build passes.
- [2026-06-03] Admin: inline client-side search + result count on all 8 list pages — Added `Search` icon + `Input` above each table (dark-themed, `bg-card border-border`, placeholder in Spanish), `const [search, setSearch] = useState("")`, derived `filtered` array with case-insensitive trim filter, "Mostrando X de Y" muted count beside input, three-way table body (empty-DB / no-search-results / filtered rows). Pages: AdminDestinations (title+country), AdminGearArticles (title+category), AdminBlogPosts (title+category), AdminQuizResponses (email), AdminSubscribers (email), AdminSentinelLeads (email), AdminItineraryRequests (name+email+destination), AdminEmailLogs (email). No Supabase queries changed. TypeScript clean, build passes.
- [2026-06-03] Admin nav: grouped sidebar sections, mobile Sheet drawer, distinct icons — (1) 13 flat sidebar links reorganized into 4 labeled groups: Contenido (Destinos, Gear, Blog), Leads (Leads de Alerta, Quiz, Itinerarios, Alertas de Permiso, Ventanas de Permiso), Datos (Subscribers, Email Logs, Galería), Sistema (Auditoría); Dashboard remains standalone above groups; section labels use `text-xs tracking-wide uppercase text-stone-500`. (2) Two Bell-icon collisions resolved: "Alertas de Permiso" → `BellPlus`, "Leads de Alerta" → `Target` (BellRing kept for Ventanas). (3) Mobile horizontal scroll replaced with hamburger (`Menu` icon) + Radix Sheet sliding from left, dark `bg-sidebar` theme, same grouped nav, closes on link tap. (4) Hardcoded "Frank"/"frank@nomaderia.travel" replaced with session `user.email` (read from existing `getSession()` call in auth guard — no new auth calls). TypeScript clean, build passes.
- [2026-06-03] Admin P0: dark header, live lead badge, real timestamp, time-aware greeting, stat grid fix — (1) AdminDashboard header `bg-[#FAFAFA]` → `bg-background`, border → `border-border`, text → `text-foreground`/`text-muted-foreground`; (2) AdminLayout sidebar lead badge wired to live `sentinel_leads` 48h count query (shows only when count > 0, hides on error); (3) "Actualizado hace 2 min" replaced with real `fetchedAt` timestamp rendered as `HH:MM` via `toLocaleTimeString('es-MX')`; (4) Greeting is now time-aware: 6–11 "Buenos días", 12–18 "Buenas tardes", 19–5 "Buenas noches"; (5) Stats grid changed from `xl:grid-cols-6` (8-card overflow) to `grid-cols-2 md:grid-cols-4`. TypeScript clean, build passes.
- [2026-06-03] Removed discount references from UI — EmailCapture subtext changed to "Recibe tus resultados por correo y te ayudo a planificar tu próxima aventura."; success message neutralized ("empieza a planificar tu aventura"); `ITINERARY_DISCOUNT` constant removed. TypeScript clean, build passes.
- [2026-06-03] Quiz: EmailCapture redesign — clean card, stacked input/button — container `rounded-2xl border border-stone/20 bg-sand/40 p-6 md:p-8`; Mail icon `text-secondary strokeWidth=1.5` left of heading "Guarda tu aventura" (`font-serif text-xl font-semibold`); subtext `text-sm text-stone-500 mt-1`; stacked form (Input `mt-4` + Button `w-full rounded-full bg-primary py-3 mt-3` "Guardar mis resultados →"); success state `text-secondary font-medium`, no emoji. `Send` icon import removed. TypeScript clean, build passes.
- [2026-06-03] Quiz results: editorial reveal, warm compatibility pill with count-up, #1 hero + alternatives grid — `MatchRing` SVG replaced by `CompatibilityPill` (RAF count-up 0→n cubic easeOut 1s; if `percent < 75` shows "Muy buena opción para ti"; `useReducedMotion` guard shows final value instantly); `ResultCard` split into `HeroResultCard` (eyebrow "Tu Destino Ideal" text-secondary, Playfair `text-4xl md:text-5xl`, `h-64 md:h-80` full-width photo with `.img-warm` + bottom scrim, pill + `line-clamp-2` description + "Ver Guía Completa" CTA) and `AlternativeCard` (h-40 photo, `card-depth`, name `text-lg`, `size="sm"` pill, clamped description, "Ver Guía" link); `QuizResults` layout redesigned to single-column `max-w-2xl` with hero reveal first then `grid-cols-1 sm:grid-cols-2` alternatives grid; reveal animation `opacity 0→1, y 20→0` expo-out, alternatives stagger 120ms; `useReducedMotion` guards all outer reveals and count-up; all data/scoring/WhatsApp/email logic untouched. TypeScript clean, build passes.
- [2026-06-03] Quiz: full-card amber tint select state, removed radio circles — option cards redesigned: unselected `bg-white border-stone/20 rounded-2xl px-4 py-5`; selected `bg-primary/8 border-primary/50` (whole card warms); icon circle `bg-primary/15` on select; description `text-sm text-stone-500`; right-side radio/checkmark div removed entirely; hover gated by `canHover` (matchMedia pointer:fine) → `hover:border-stone/40`; `whileTap={{ opacity: 0.9 }}` only; `transition-colors duration-200`; `Check` import removed. TypeScript clean, build passes.
- [2026-06-03] Quiz: linear progress bar + fade/shift question transitions — numbered circle stepper removed; replaced with `h-[3px] bg-stone/20` track + `bg-primary` animated fill (`width: (step+1)/total * 100%`, 400ms expo-out); compact `X / Y` fraction top-right; question `AnimatePresence mode="wait"` transitions switched from x-slide to `opacity 0→1, y: 20→0` enter / `y: 0→-20` exit (300ms expo-out); `useReducedMotion()` guard disables all motion. `direction` removed from JSX. TypeScript clean, build passes.
- [2026-06-03] Hero: bottom-left layout, dual CTA WhatsApp + destinos, photo-agnostic bottom scrim — content container moved to `absolute bottom-0 left-0 max-w-2xl p-8 md:p-14 lg:p-20`; overlay updated to `from-[#1C1917]/85 via-[#1C1917]/40 to-transparent`; headline Playfair Display `text-4xl→text-7xl` responsive, tight leading, left-aligned; subtitle Inter text-lg/xl left-aligned max-w-xl; primary CTA pill (WhatsApp, existing logic untouched); secondary ghost pill (`border-white/40 bg-white/10 backdrop-blur-sm`) links to existing `/destinos` route via `<Link>`; trust badge below CTAs. TypeScript clean, build passes.
- [2026-06-03] Navbar: warm frosted glass scroll behavior — `useLocation` added to detect homepage; `isHomepageRef` (useRef, updated every render) keeps the `useMotionValueEvent` closure always current. Scroll threshold: homepage `window.innerHeight * 0.9` (just past the hero fold), all other routes `40px`. Initial `scrolled` state: `!isHomepage` so inner pages (/gear, /blog, etc.) start with the background immediately visible. `useEffect` on `pathname` re-evaluates on SPA navigation. Background overlay class: `bg-sand/85 backdrop-blur-md border-b border-stone/30` (was `bg-sand/95 backdrop-blur-xl shadow-editorial border-stone/70`); fade transition: `duration: 0.35` (was 0.28). Mountain icon: white on hero, primary on scroll (was always primary). Nav link text: `text-white/90 hover:text-white text-shadow-hero` on hero, `text-foreground/80 hover:text-primary` on scroll. Mobile menu, scroll-to-top, active link detection, routing: untouched. TypeScript clean, build passes.
- [2026-06-03] Higiene: tokens, shadows, zoom, particles — (1) Footer.tsx: all hardcoded hex replaced with tokens: `bg-walnut`, `text-sand`, `text-stone/80`, `text-stone/75`, `text-clay`; borders → `border-stone/20`. (2) `.text-shadow-hero` (0 4px 30px) and `.text-shadow-card` (0 2px 14px) utilities added to `@layer utilities` in index.css; all three inline `style={{ textShadow }}` props removed from HeroSection (h1+p), DidYouKnowSection (CardContent), DestinationDetail (hero title). (3) `shadow-editorial` / `shadow-editorial-hover` moved from `@layer utilities` to `tailwind.config.ts` `theme.extend.boxShadow` — IDE autocomplete + variant prefixes now work natively; CSS utility blocks removed. (4) BlogPreview + GearPreview image zoom transitions unified to `duration: 0.7, ease: "easeOut"` matching DestinationsCatalog. (5) QuizSection CelebrationParticles: `bg-orange-500` → `bg-primary`, `bg-emerald-600` → `bg-secondary`. TypeScript clean, build passes.
- [2026-06-03] I7: shimmer skeletons + scroll progress bar — (1) `@keyframes shimmer` + `.skeleton-shimmer` utility added to `index.css`: warm sand→stone→sand sweep (90deg linear gradient, 200% background-size, 1.8s ease-in-out infinite); `prefers-reduced-motion` guard disables animation and falls back to flat sand. (2) All `<Skeleton>` components in `LoadingSkeletons.tsx` replaced with plain `<div className="skeleton-shimmer ...">` to avoid `animate-pulse` animation conflict — shapes/sizes preserved exactly. `Skeleton` shadcn import removed (untouched file). (3) New `src/components/ScrollProgressBar.tsx`: fixed top-0 `h-[3px]` bar using Framer Motion `useScroll` + `useSpring` (stiffness 200, damping 30), `bg-primary` (amber), `z-[100]`, `origin-left` scaleX; hidden when `prefers-reduced-motion: reduce` is active. (4) `ScrollProgressBar` mounted in `App.tsx` inside `BrowserRouter` alongside other global overlays. TypeScript clean, build passes.
- [2026-06-03] I6: unified image treatment — (1) `.img-warm` CSS utility (`filter: sepia(0.12) saturate(1.1) brightness(0.97)`) added to `index.css`, applied to all <img>/<video> in DestinationsCatalog, BlogPreview, GearPreview, DidYouKnowSection, DestinationDetail hero carousel, BlogPostDetail hero, BackgroundSlideshow. (2) Card gradients standardized to `from-black/65 via-black/25 to-transparent` in DestinationsCatalog, BlogPreview, GearPreview, DidYouKnowSection; full-screen hero overlays upgraded to `from-black/85 via-black/35 to-transparent` in DestinationDetail and BlogPostDetail. (3) `object-top` on destination images (peaks at top); `object-center` explicit on blog/gear; BlogPostDetail keeps `objectPosition: center 30%` via inline style. (4) BackgroundSlideshow default overlay changed from flat `bg-black/60` to `bg-gradient-to-t from-[#1C1917]/70 via-[#1C1917]/30 to-transparent`; MediaSlider updated from `bg-black/30` to same gradient — lets hero photography breathe at the top. Build passes.
- [2026-06-03] I5: organic mountain dividers — new `SectionDivider.tsx` component with two variants: `ridge` (single asymmetric bezier stroke, walnut 9% opacity) and `topo` (3 parallel contour strokes at 11/7/4% opacity). A `dark` boolean prop switches stroke to stone-on-walnut coloring for the Newsletter→Footer transition. `hidden sm:block` keeps mobile clean. Zero layout impact: `h-0` container + absolutely-centered SVG straddling the seam. Placed at 4 positions in `Index.tsx`: sentinel strip→SocialProof, DestinationsCatalog→GearPreview, BlogPreview→Newsletter, Newsletter→Footer (topo dark). `aria-hidden`, `pointer-events-none`, `z-10`. Build passes.
- [2026-06-03] I4: typography refinement — `text-wrap: balance` on h1/h2/h3 (CSS base layer); `.text-eyebrow` utility standardized to `text-xs tracking-[0.2em] uppercase font-medium text-secondary`; all landing section eyebrows (SocialProof, BlogPreview, DidYouKnow, PremiumItinerary, SobreNosotros) converted to secondary green and identical sizing; eyebrow added to GearPreview; `.section-editorial` (py-24 md:py-32 lg:py-40) applied to all major homepage sections (DestinationsCatalog, GearPreview, BlogPreview, DidYouKnow, SocialProof, PremiumItinerary) including skeleton states; lead paragraph `text-lg leading-relaxed` confirmed in PremiumItinerary and SobreNosotros; body columns constrained to `max-w-[42rem]` in SobreNosotros (was max-w-3xl). Build passes.
- [2026-06-03] I3: microinteractions — Card image hover reveal (overlay + "Explorar →" label, scale 1.04, expo-out) on destination/blog/gear cards, desktop-only gated by hoverEnabled; whileTap scale:0.97 on hero CTAs and SocialProof CTA; WhatsApp FAB moved to bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:bottom-5 + whileTap; tab content in DestinationDetail wraps each TabsContent in AnimatePresence+motion.div (opacity/y fade, 250ms, reduced-motion gated); scroll-to-top whileHover:scale-1.1/whileTap:scale-0.92; on-brand focus-visible rings via CSS element selector for all non-shadcn interactive elements. Build passes.
- [2026-06-03] I2: depth and texture — SVG fractal grain (baseFrequency 0.85, 3.5% opacity) baked into all `.bg-wash-*` utilities; `.noise-bg` utility defined; 3-layer `.card-depth` system (`--shadow-card/hover/active`, warm walnut-toned, 500ms ease-out, translateY(-3px) hover, scale(0.988) active) applied to destination/blog/gear/pricing/stats cards; `.section-recessed::before` inset top-shadow applied to all 6 homepage sections. Contrast verified (charcoal on sand ~12.5:1, well above WCAG AA). Build passes clean.
- [2026-06-03] I1: unified motion language — expo-out easing `[0.22, 1, 0.36, 1]` applied to all homepage entrance animations; `RevealGroup` stagger primitive added to `Reveal.tsx`; staggered reveals applied to gear cards (RevealGroup) and SocialProof stats (RevealGroup); hero parallax added to MediaSlider.tsx (desktop only, `prefers-reduced-motion` gated); navbar desktop links animate in on first paint with cascade delay. SocialProof CTA hex tokens also fixed. Build passes.
- [2026-06-03] Hotfix B: hero heights raised — `BlogPostDetail.tsx` hero `h-[35vh]` → `h-[55vh] md:h-[65vh]` with `objectPosition: center 30%`; `DestinationDetail.tsx` carousel `h-[50vh] md:h-[60vh]` → `h-[80vh] md:h-[90vh]`. Build passes.
- [2026-06-03] Hotfix A: hero CTA token color corrected — `HeroSection.tsx` primary button migrated from hardcoded hex values (`#C96B05`, `#B95F05`, `#A95504`) to design tokens (`bg-primary`, `hover:bg-primary/90`, `active:bg-primary/80`). Build passes.

- [2026-06-02] Pro path — P8: gradient washes aplicado en homepage: se armonizaron transiciones de secciones con fondos cálidos del palette tokenizado (`sand`, `clay`, `forest`) usando clases utilitarias (`bg-wash-*`) para evitar saltos bruscos y mantener contraste AA en textos.
- [2026-06-02] Pro path — P7: carousels + footer aplicado: `DestinationsCatalog` y `BlogPreview` migrados a carrusel horizontal mobile-first con `snap-x snap-mandatory`, momentum nativo iOS e indicador sutil de puntos; `Footer` actualizado a variante dark con `rounded-t-[2.5rem]`, base walnut y texto sand, manteniendo links/rutas intactos.
- [2026-06-02] Pro path — P5: trust reframe + counters aplicado en `SocialProof`: `quizResponses` se muestra solo con umbral real `>= 50`; contadores migrados a `useMotionValue + animate` con `whileInView` una sola vez y respeto de `prefers-reduced-motion`.
- [2026-06-02] Pro path — P4: reveals/navbar/hover aplicados con framer-motion en homepage, navbar con `useScroll` y hover sutil desktop-only respetando `prefers-reduced-motion`.
- [2026-06-01] Pro path — P3: hero/buttons/cards/bugfix polish aplicado en hero, CTAs, tarjetas y card meta row del destino para legibilidad, profundidad y no-overlap.
- [2026-06-01] Pro path — P2: editorial primitives añadidos en `src/components/editorial/` (`Section`, `Eyebrow`, `FullBleedImage`, `Reveal`) con motion respetando `prefers-reduced-motion` y overlay opcional.
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
Audit completa — ver docs/audit-report.md para bugs, token findings y recomendaciones.
- [2026-06-01] Aplicados fixes del audit en Edge Functions (`discover-trending-destinations` y `generate-destination-draft`): hardening de refusal detection, caps `max_output_tokens`, compresión Step A→Step B, cap de catálogo (40 slugs), reducción del few-shot y eliminación de código muerto.
Fix aplicado: fuentes de Step A capeadas a 8 antes de pasar a Step B.
- [2026-06-01] Añadidos helpers compartidos para Edge Functions en `supabase/functions/_shared/admin-auth.ts` y `supabase/functions/_shared/openai.ts`; las funciones de destinos pueden migrarse opcionalmente a estos módulos después.
- [2026-06-01] Creada `supabase/functions/discover-trending-gear/index.ts` usando helpers compartidos (`requireAdmin`, `callResponses`) para discovery de temas de gear trending con dedup contra `gear_articles`.
- [2026-06-01] Creada `supabase/functions/discover-trending-blog/index.ts` usando helpers compartidos (`requireAdmin`, `callResponses`) con enfoque SEO-intent en español, dedup contra `blog_posts` (cap 40), `web_search` y schema estricto `blog_candidates`.
- [2026-06-01] Creada `supabase/functions/generate-blog-draft/index.ts` en flujo de 2 pasos (research + structure) con `requireAdmin`, `callResponses` y `NOMADERIA_SOUL`; incluye few-shot desde `blog_posts` publicado (prioriza featured), reglas anti-alucinación estrictas, schema `blog_draft` y respuesta `{ draft, sources, verify_flags, model }`.
- [2026-06-01] Añadidos `src/types/ai-blog.ts`, `src/hooks/use-trending-blog.ts` y `src/hooks/use-blog-draft.ts` alineados con Edge Functions de blog (`discover-trending-blog` y `generate-blog-draft`) sin `any` y con nombres de campos exactos.
- [2026-06-01] Integrado panel IA de discovery en `AdminBlogPosts` con botón "✦ Descubrir Temas SEO", progreso por etapas en español y cards en `src/components/admin/TrendingBlogCard.tsx` mostrando `search_intent`, fuentes y CTA "Desarrollar este →" hacia `/admin/blog-posts/new?candidate=`.
- [2026-06-01] Flujo blog AI end-to-end integrado en `AdminBlogPostForm`: autofill por `?candidate=` en modo nuevo, overlay por etapas, badge de confianza, panel privado de fuentes, badges `⚠ Verificar`, cálculo cliente de `reading_time_min`, guard de slug único y upsert no bloqueante a `ai_content_meta` tras insert.
- [2026-06-01] Extendida card "Generación con IA" en `AdminDashboard` para sumar `destination_ai_meta` + `ai_content_meta` (gear/blog), mostrando breakdown en español (Destinos/Gear/Blog), total combinado y horas ahorradas estimadas con fallback seguro si `ai_content_meta` falla o viene vacío.
- [2026-06-01] Creada `supabase/functions/discover-permit-windows/index.ts` con patrón research→structure, `requireAdmin`, `callResponses`, enrichment opcional RIDB y esquema estricto `permit_windows_draft`; devuelve borrador de calendario oficial sin escribir en DB.
- [2026-06-01] Añadidos `src/types/ai-permits.ts` y `src/hooks/use-permit-windows-draft.ts` para invocar `discover-permit-windows` con React Query, sin `any` y sin tocar tipos generados.
- [2026-06-01] Creada página `src/pages/admin/AdminPermitWindows.tsx` con tabla CRUD de `permit_windows`, toggle `is_active`, búsqueda IA "✦ Buscar fechas oficiales" (hook `usePermitWindowsDraft`), revisión editable de ventanas con panel `Fuentes (privado)` + badges `⚠ Verificar`, guardado manual no auto-activo y upsert no bloqueante a `ai_content_meta`; ruta registrada en `App.tsx` (`/admin/permit-windows`) y link agregado al sidebar en `AdminLayout`.
- [2026-06-01] Añadido formulario "Activa tu Alerta de Permisos" en `/gracias` (prefill `?email=`, validación de email, selección de parque, permiso y año objetivo) con inserción a `permit_alerts` vía hook `src/hooks/use-permit-alert.ts`, estado de éxito en español y aviso honesto de no garantía de permiso.
- [2026-06-01] Creada página admin `src/pages/admin/AdminPermitAlerts.tsx` con listado de `permit_alerts` (email, parque, permiso, año objetivo, estado, fecha) ordenado por `created_at` descendente, filtro por estado (`active`/`notified`/`expired`), cambio manual de estado por fila, nota operativa para validar email contra Stripe y layout mobile-first; ruta registrada en `App.tsx` (`/admin/permit-alerts`) y link agregado en `AdminLayout`.
- [2026-06-01] Creada `supabase/functions/check-permit-alerts/index.ts` para ejecución por cron con auth por header `x-cron-secret` + `CRON_SECRET`, lectura service-role de ventanas activas (`now` a `+7 días`), envío de correos en español vía Resend para `permit_alerts` activas coincidentes y actualización idempotente de estado a `notified`; respuesta `{ checked, notified }` y logs con prefijo `[check-permit-alerts]`.
- [2026-06-01] Fix crítico de matching en producto de alertas de permisos: lista canónica compartida de parques en `src/lib/parks.ts`, selects unificados en `/gracias` + admin (`AdminPermitWindows` y `PermitWindowDraftEditor`) y `check-permit-alerts` actualizado para match por parque normalizado (`trim+lowercase`) + año, con email consolidado de todas las ventanas activas del parque/año y destaque de "Lo que pediste".
- [2026-06-01] Follow-up de audit aplicado: `AdminBlogPostForm` ahora limita `meta_description` a 160 caracteres con contador visible y bloqueo de guardado si excede, y `discover-trending-gear` ahora limita lectura de `gear_articles` con `.limit(40)` a nivel DB.
- Audit 2 completa — ver docs/audit-report-content-permits.md (gear, blog, permisos).
- [2026-06-01] Creada `supabase/functions/generate-gear-draft/index.ts` (research → structure) con helpers compartidos, `NOMADERIA_SOUL`, schema estricto de `gear_draft` y reglas editoriales de verificación para `price`/`rating`.
- [2026-06-01] Añadidos `src/types/ai-gear.ts`, `src/hooks/use-trending-gear.ts` y `src/hooks/use-gear-draft.ts` (React Query + `supabase.functions.invoke`) alineados con respuestas de Edge Functions de gear.
- [2026-06-01] Integrado panel AI de discovery en `AdminGearArticles` con botón "✦ Descubrir Gear Trending", progreso por etapas en español y cards responsivas en `src/components/admin/TrendingGearCard.tsx` enlazando al form con `?candidate=`.
- [2026-06-01] Flujo gear AI end-to-end integrado en `AdminGearArticleForm`: autofill por `?candidate=` en modo nuevo, overlay de progreso, badge de confianza, panel privado de fuentes, verificación visible (`⚠ Verificar`), guard de slug único y upsert no bloqueante a `ai_content_meta` tras insert.

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
