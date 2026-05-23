# CLAUDE CONTEXT — Full Architecture Audit (Read-only)

## Baseline validation run (pre-edit)
- `npm run lint` → **fails** (pre-existing):
  - `src/components/ui/command.tsx` (`@typescript-eslint/no-empty-object-type`)
  - `src/components/ui/textarea.tsx` (`@typescript-eslint/no-empty-object-type`)
- `npm run build` → **passes**
- `npm run test -- --run` → **fails** (pre-existing):
  - `src/lib/lazy-with-retry.test.ts` cannot redefine `window.location.reload`
- `node node_modules/typescript/bin/tsc --noEmit` → **passes**

---

## SECTION 1 — SUPABASE SCHEMA

### 1.1 Supabase client setup
- Client file: `src/integrations/supabase/client.ts`
- Initialization:
  - `createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { storage: localStorage, persistSession: true, autoRefreshToken: true } })`
  - Env vars used: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Generated types file: `src/integrations/supabase/types.ts`

### 1.2 Tables from migrations (authoritative DDL)

#### `public.user_roles`
- Defined in: `supabase/migrations/20260218064349_5a5a5e12-1c26-4604-8566-374c76f480b9.sql`
- Columns:
  - `id uuid not null default gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete cascade`
  - `role app_role not null`
  - `created_at timestamptz not null default now()`
- PK: `id`
- FKs:
  - `user_id -> auth.users(id) ON DELETE CASCADE`
- Indexes/constraints:
  - PK index on `id`
  - unique constraint `(user_id, role)`
- RLS: **enabled**
- Policies:
  - `Admins can manage roles` (`FOR ALL TO authenticated`) using/check `public.has_role(auth.uid(), 'admin')`

#### `public.destinations`
- Defined in: same initial migration
- Columns:
  - `id uuid not null default gen_random_uuid()`
  - `title text not null`
  - `country text not null`
  - `region text null`
  - `slug text not null unique`
  - `short_description text null`
  - `difficulty_level text not null default 'easy'`
  - `difficulty_description text null`
  - `days_needed text null`
  - `best_season text null`
  - `estimated_budget_usd integer null`
  - `hero_image_url text null`
  - `gallery_images text[] null`
  - `full_guide_markdown text null`
  - `preparation_plan text null`
  - `gear_list_markdown text null`
  - `common_fears jsonb null default '[]'::jsonb`
  - `itinerary_markdown text null`
  - `has_premium_itinerary boolean null default false`
  - `premium_itinerary_price decimal null`
  - `affiliate_links jsonb null default '{}'::jsonb`
  - `experience_type text null`
  - `tags text[] null`
  - `is_published boolean null default false`
  - `featured boolean null default false`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- PK: `id`
- FKs: none
- Indexes/constraints:
  - PK index on `id`
  - unique constraint/index on `slug`
  - trigger: `update_destinations_updated_at` using `public.update_updated_at_column()`
- RLS: **enabled**
- Policies:
  - `Anyone can read published destinations` (`FOR SELECT`) using `is_published = true`
  - `Admins can manage destinations` (`FOR ALL TO authenticated`) using/check `public.has_role(auth.uid(), 'admin')`

#### `public.gear_articles`
- Defined in: same initial migration
- Columns:
  - `id uuid not null default gen_random_uuid()`
  - `title text not null`
  - `slug text not null unique`
  - `category text not null`
  - `short_description text null`
  - `hero_image_url text null`
  - `content_markdown text null`
  - `products jsonb null default '[]'::jsonb`
  - `is_published boolean null default false`
  - `featured boolean null default false`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- PK: `id`
- FKs: none
- Indexes/constraints:
  - PK index on `id`
  - unique constraint/index on `slug`
  - trigger: `update_gear_articles_updated_at` using `public.update_updated_at_column()`
- RLS: **enabled**
- Policies:
  - `Anyone can read published gear articles` (`FOR SELECT`) using `is_published = true`
  - `Admins can manage gear articles` (`FOR ALL TO authenticated`) using/check `public.has_role(auth.uid(), 'admin')`

#### `public.quiz_responses`
- Defined in: same initial migration
- Migration columns:
  - `id uuid not null default gen_random_uuid()`
  - `email text null`
  - `fitness_level text null`
  - `interest text null`
  - `trip_duration text null`
  - `travel_style text null`
  - `budget_range text null`
  - `recommended_destinations text[] null`
  - `created_at timestamptz not null default now()`
- Generated type (`src/integrations/supabase/types.ts`) also includes `main_barrier text | null` (schema drift not present in migrations)
- PK: `id`
- FKs: none
- Indexes/constraints: PK index on `id`
- RLS: **enabled**
- Policies:
  - `Anyone can submit quiz` (`FOR INSERT`) with check `true`
  - `Admins can read quiz responses` (`FOR SELECT TO authenticated`) using `public.has_role(auth.uid(), 'admin')`

#### `public.newsletter_subscribers`
- Defined in: same initial migration
- Columns:
  - `id uuid not null default gen_random_uuid()`
  - `email text not null unique`
  - `source text null`
  - `created_at timestamptz not null default now()`
- PK: `id`
- FKs: none
- Indexes/constraints:
  - PK index on `id`
  - unique index/constraint on `email`
- RLS: **enabled**
- Policies:
  - `Anyone can subscribe` (`FOR INSERT`) with check `true`
  - `Admins can read subscribers` (`FOR SELECT TO authenticated`) using `public.has_role(auth.uid(), 'admin')`

#### `public.blog_posts`
- Created in: `20260218162416_fa25245e-d181-4911-8234-b2e6eeb99b1f.sql`
- Altered in: `20260218_blog_enhancements.sql`
- Admin policy adjusted in: `20260218200000_fix_blog_posts_rls_policy.sql`
- Final columns:
  - `id uuid not null default gen_random_uuid()`
  - `title text not null`
  - `slug text not null unique`
  - `category text not null default 'general'`
  - `short_description text null`
  - `content_markdown text null`
  - `hero_image_url text null`
  - `author text null default 'Nomaderia'`
  - `is_published boolean null default false`
  - `featured boolean null default false`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
  - `tags text[] null default '{}'`
  - `reading_time_min integer null default 5`
  - `meta_description text null`
- PK: `id`
- FKs: none
- Indexes/constraints:
  - PK index on `id`
  - unique index/constraint on `slug`
  - GIN index `idx_blog_posts_tags` on `tags`
  - trigger: `update_blog_posts_updated_at` using `public.update_updated_at_column()`
- RLS: **enabled**
- Policies:
  - `Anyone can read published blog posts` (`FOR SELECT`) using `is_published = true`
  - `Admins can manage blog posts` (`FOR ALL TO authenticated`) using/check `public.has_role(auth.uid(), 'admin')`

#### `public.itinerary_requests`
- Defined in: `20260218210000_add_itinerary_requests.sql`
- Columns:
  - `id uuid not null default gen_random_uuid()`
  - `name text not null`
  - `email text not null`
  - `destination text not null`
  - `estimated_budget text null`
  - `message text null`
  - `created_at timestamptz not null default now()`
- PK: `id`
- FKs: none
- Indexes/constraints: PK index on `id`
- RLS: **enabled**
- Policies:
  - `Anyone can submit itinerary request` (`FOR INSERT TO anon, authenticated`) with check `true`
  - `Admins can view itinerary requests` (`FOR SELECT TO authenticated`) using `public.has_role(auth.uid(), 'admin')`

#### `public.email_drip_log`
- Defined in: `20260228000000_create_email_drip_log.sql`
- Columns:
  - `id uuid not null default gen_random_uuid()`
  - `email text not null`
  - `email_type text not null`
  - `sent_at timestamptz not null default now()`
  - `status text null default 'sent'`
  - `error_message text null`
  - `metadata jsonb null default '{}'::jsonb`
- PK: `id`
- FKs: none
- Indexes/constraints:
  - PK index on `id`
  - btree index `idx_email_drip_log_email_type` on `(email, email_type)`
- RLS: **enabled**
- Policies:
  - `Admins can read email logs` (`FOR SELECT TO authenticated`) using `public.has_role(auth.uid(), 'admin')`

### 1.3 Database functions/triggers from migrations
- `public.has_role(_user_id uuid, _role app_role) -> boolean` (SQL, `SECURITY DEFINER`, `STABLE`)
- `public.update_updated_at_column() -> trigger` (PL/pgSQL)
- Triggers:
  - `update_destinations_updated_at`
  - `update_gear_articles_updated_at`
  - `update_blog_posts_updated_at`

### 1.4 pg_cron setup migration
- `supabase/migrations/20260228000001_setup_pg_cron_drip.sql`
- Schedules cron job `daily-drip-emails` at `0 16 * * *`
- Calls HTTP POST to `https://vrixiuvnhvqafmxlcyex.supabase.co/functions/v1/send-drip-emails`
- Uses `current_setting('supabase.service_role_key')` authorization header
- Guarded by extension checks (`pg_cron`, `pg_net`)

### 1.5 Edge Functions
- `supabase/functions/send-quiz-email/index.ts`
  - Trigger type: HTTP invoke (`supabase.functions.invoke("send-quiz-email")`)
  - Behavior: sends quiz-result email via Resend with top destination, related destinations, discount code, and WhatsApp CTA
- `supabase/functions/send-quiz-results/index.ts`
  - Trigger type: HTTP invoke (not referenced by frontend currently)
  - Behavior: sends a quiz result summary email template via Resend
- `supabase/functions/send-welcome-email/index.ts`
  - Trigger type: HTTP invoke (`supabase.functions.invoke("send-welcome-email")`)
  - Behavior: validates recent newsletter subscription in DB and sends welcome email via Resend
- `supabase/functions/send-drip-emails/index.ts`
  - Trigger type: HTTP invoke (manual/scheduled)
  - Behavior: sends delayed drip emails (`gear_guide`, `itinerary_cta`) and writes status logs in `email_drip_log`
  - Also designed to be triggered daily by pg_cron migration

### 1.6 Storage buckets (observed from code usage)
- `destinations` (destination hero image uploads)
- `blog-posts` (blog hero image uploads)
- `destinations_media` (destination gallery images/videos)
- `media_gallery` (landing/media slider uploads)

### 1.7 Supabase client imports across project
- Imported as `import { supabase } from "@/integrations/supabase/client"`
- Used in:
  - Public pages/hooks: `src/hooks/*`, `src/pages/BudgetCalculator.tsx`, `src/pages/GearArticleDetail.tsx`, `src/pages/BlogPostDetail.tsx`, `src/pages/SentinelLanding.tsx`, `src/components/landing/NewsletterSignup.tsx`
  - Admin pages: `src/pages/admin/*`
  - Dashboard upload components: `src/components/dashboard/ImageUpload.tsx`, `src/components/dashboard/MultiMediaUpload.tsx`

---

## SECTION 2 — ROUTING & PAGES

Source: `src/App.tsx`

| Route | Component file | What it does | Supabase tables queried + method | usePageMeta | Main CTAs |
|---|---|---|---|---|---|
| `/` | `src/pages/Index.tsx` | Homepage with hero, quiz, destinations, gear/blog previews, newsletter funnel. | Via child components/hooks: `destinations` (React Query), `gear_articles` (React Query), `blog_posts` (React Query), `media_slider` (React Query), writes `newsletter_subscribers` + `quiz_responses` via quiz/newsletter flows and invokes `send-quiz-email`/`send-welcome-email`. | No | Sentinel link (`/sentinel`), WhatsApp CTA, quiz anchors (`#quiz`), links to `/destinos`, `/gear`, `/blog`, `/servicios`, `/calculadora` |
| `/destinos` | `src/pages/Destinations.tsx` | Destinations listing page. | `destinations` via `useDestinations()` (React Query custom hook). | No | Destination cards to `/destinos/:slug` |
| `/destinos/:slug` | `src/pages/DestinationDetail.tsx` | Destination detail with tabs, booking/affiliate sidebar, gallery, related content. | `destinations` via `useDestinationBySlug` + `useRelatedDestinations` (React Query custom hooks). | No | Booking buttons (flights/hotels/tours/tickets/car/transfer/insurance affiliate URLs), links to `/gear`, `/calculadora`, related destinations, WhatsApp CTA |
| `/gear` | `src/pages/GearListing.tsx` | Gear article listing with category tabs. | `gear_articles` via `useGearArticles()` (React Query custom hook). | Yes | Article cards to `/gear/:slug` |
| `/gear/:slug` | `src/pages/GearArticleDetail.tsx` | Full gear article page with markdown, product cards, related articles, share tools. | Direct Supabase calls (`useEffect`): `gear_articles` read by slug and related by category. | Yes | Product affiliate buttons (`affiliate_url`), quiz/calculator internal CTAs, related articles |
| `/calculadora` | `src/pages/BudgetCalculator.tsx` | Budget estimator by destination/days/comfort with affiliate booking shortcuts and newsletter capture. | `destinations` via `useDestinations()` (React Query custom hook), writes `newsletter_subscribers` directly (`insert`). | No | Calculate button, affiliate links (`flights_url`, `hotels_url`, `tours_url`, `insurance_url`), link to destination guide, newsletter subscribe |
| `/blog` | `src/pages/BlogListing.tsx` | Blog listing with featured post and category filtering. | `blog_posts` via `useBlogPosts()` (React Query custom hook). | Yes | Post cards to `/blog/:slug` |
| `/blog/:slug` | `src/pages/BlogPostDetail.tsx` | Blog post detail with markdown, related posts, sharing, and WhatsApp CTA. | Direct Supabase calls (`useEffect`): `blog_posts` read by slug + related by category. | Yes | Quiz/calculator internal CTAs, `ArticleWhatsAppCTA`, related post links |
| `/privacidad` | `src/pages/PrivacyPolicy.tsx` | Legal privacy policy page. | None | No | Contact mailto link |
| `/terminos` | `src/pages/TermsAndConditions.tsx` | Legal terms page. | None | No | Contact mailto link |
| `/sentinel` | `src/pages/SentinelLanding.tsx` | Landing page to capture Yosemite alert leads. | Writes `sentinel_leads` directly (`insert`). | Yes | Lead capture submit button (“Quiero mi cupo en Yosemite”), back-to-home brand link |
| `/servicios` | `src/pages/Servicios.tsx` | Sales page for premium itinerary packages and WhatsApp conversion. | `media_slider` via `useMediaSlider()` (React Query custom hook). | No | Hero WhatsApp CTA, package WhatsApp CTAs, FAQ context CTA |
| `/sobre-nosotros` | `src/pages/SobreNosotros.tsx` | About/credentials page with mission and contact. | None | No | Mailto CTA, link to `/calculadora` |
| `/admin/login` | `src/pages/admin/AdminLogin.tsx` | Admin authentication screen. | Supabase Auth `signInWithPassword`. | No | “Iniciar Sesión” submit |
| `/admin` (layout) | `src/pages/admin/AdminLayout.tsx` | Protected admin shell with sidebar nav and auth guard. | Auth session check + RPC `has_role`; sign-out. | No | Sidebar nav links to all admin modules, logout |
| `/admin` (index) | `src/pages/admin/AdminDashboard.tsx` | Admin metrics dashboard and quick actions. | Reads counts/lists from `destinations`, `gear_articles`, `blog_posts`, `quiz_responses`, `newsletter_subscribers`, `itinerary_requests`, `email_drip_log`; uses direct Supabase calls. | No | Quick action links to create destination/gear/blog |
| `/admin/destinations` | `src/pages/admin/AdminDestinations.tsx` | CRUD list for destinations. | Reads/updates/deletes `destinations` directly. | No | New destination, edit, publish toggle, delete |
| `/admin/destinations/new` | `src/pages/admin/AdminDestinationForm.tsx` | Create destination form. | Inserts `destinations` directly. | No | Save/Create, Cancel |
| `/admin/destinations/:id/edit` | `src/pages/admin/AdminDestinationForm.tsx` | Edit destination form. | Reads + updates `destinations` directly. | No | Update, Cancel |
| `/admin/gear-articles` | `src/pages/admin/AdminGearArticles.tsx` | CRUD list for gear posts. | Reads/updates/deletes `gear_articles` directly. | No | New article, edit, publish toggle, delete |
| `/admin/gear-articles/new` | `src/pages/admin/AdminGearArticleForm.tsx` | Create gear article and product affiliate entries. | Inserts `gear_articles` directly. | No | Create, Cancel |
| `/admin/gear-articles/:id/edit` | `src/pages/admin/AdminGearArticleForm.tsx` | Edit gear article. | Reads + updates `gear_articles` directly. | No | Save, Cancel |
| `/admin/quiz-responses` | `src/pages/admin/AdminQuizResponses.tsx` | Table view and CSV export for quiz answers. | Reads `quiz_responses` directly. | No | Export CSV |
| `/admin/subscribers` | `src/pages/admin/AdminSubscribers.tsx` | Newsletter subscriber list and export. | Reads `newsletter_subscribers` directly. | No | Export CSV |
| `/admin/itinerary-requests` | `src/pages/admin/AdminItineraryRequests.tsx` | Itinerary request inbox and export. | Reads `itinerary_requests` directly. | No | Export CSV |
| `/admin/blog-posts` | `src/pages/admin/AdminBlogPosts.tsx` | CRUD list for blog posts. | Reads/updates/deletes `blog_posts` directly. | No | New post, edit, publish toggle, delete |
| `/admin/blog-posts/new` | `src/pages/admin/AdminBlogPostForm.tsx` | Create blog post form. | Inserts `blog_posts` directly. | No | Create, Cancel |
| `/admin/blog-posts/:id/edit` | `src/pages/admin/AdminBlogPostForm.tsx` | Edit blog post form. | Reads + updates `blog_posts` directly. | No | Save, Cancel |
| `/admin/email-logs` | `src/pages/admin/AdminEmailLogs.tsx` | Email drip delivery logs and export. | Reads `email_drip_log` directly. | No | Export CSV |
| `/admin/gallery` | `src/pages/admin/AdminGallery.tsx` | Media slider gallery manager with upload/toggle/delete. | Reads/writes `media_slider` + bucket `media_gallery` directly. | No | Upload, active toggle, delete |
| `/admin/audit` | `src/pages/admin/SystemAudit.tsx` | Operational diagnostic page for env, Supabase, analytics, email test, image checks. | Reads `destinations`; invokes Edge Function `send-quiz-email`. | No | Send test email, verify images |
| `*` | `src/pages/NotFound.tsx` | 404 fallback page. | None | No | Return link to `/` |

---

## SECTION 3 — DATA FETCHING PATTERNS

### 3.1 Overall pattern
- **Mixed approach**:
  - Public content mostly uses **TanStack React Query + custom hooks** in `src/hooks/`
  - Several public detail pages still use **direct `useEffect + supabase`** (`GearArticleDetail`, `BlogPostDetail`)
  - Admin pages consistently use **direct Supabase calls in `useEffect/useState`**

### 3.2 Custom hooks inventory (`src/hooks/`)

| Hook | File | Purpose | Supabase table(s) | Returns |
|---|---|---|---|---|
| `useDestinations()` | `src/hooks/use-destinations.ts` | List published destination cards. | `destinations` | `UseQueryResult<DestinationCard[]>` |
| `useDestinationBySlug(slug)` | same | Get one published destination by slug. | `destinations` | `UseQueryResult<Tables<"destinations"> \| null>` |
| `useRelatedDestinations(difficulty, excludeId)` | same | Fetch related published destinations by difficulty. | `destinations` | `UseQueryResult<Tables<"destinations">[]>` |
| `useGearArticles()` | `src/hooks/use-gear-articles.ts` | List published gear articles. | `gear_articles` | `UseQueryResult<Tables<"gear_articles">[]>` |
| `useFeaturedGearArticles()` | same | Fetch up to 3 featured gear cards. | `gear_articles` | `UseQueryResult<GearArticleCard[]>` |
| `useBlogPosts()` | `src/hooks/use-blog-posts.ts` | List published blog posts ordered by featured/date. | `blog_posts` | `UseQueryResult<BlogPost[]>` |
| `useQuiz(totalSteps)` | `src/hooks/use-quiz.ts` | Quiz state machine, scoring, result retrieval, lead capture, email trigger. | reads `destinations`; writes `newsletter_subscribers`, `quiz_responses`; invokes `send-quiz-email` | step/actions/state object (`results`, `loading`, handlers, etc.) |
| `useQuizCount()` | `src/hooks/use-stats.ts` | Count quiz responses. | `quiz_responses` | `UseQueryResult<number>` |
| `useDestinationsCount()` | same | Count published destinations. | `destinations` | `UseQueryResult<number>` |
| `useMediaSlider()` | `src/hooks/use-media.ts` | Fetch active media slider entries. | `media_slider` | `UseQueryResult<MediaItem[]>` |
| `uploadMediaItem(file)` | same | Upload to storage + insert slider row. | bucket `media_gallery`, table `media_slider` | `Promise<MediaItem>` |
| `toggleMediaActive(id,current)` | same | Toggle `is_active`. | `media_slider` | `Promise<void>` |
| `deleteMediaItem(id,path)` | same | Delete row and storage file. | `media_slider`, bucket `media_gallery` | `Promise<void>` |
| `useCanonical`, `useJsonLd`, `usePageMeta` | `src/hooks/use-seo.ts` | SEO metadata/canonical/JSON-LD helpers. | none | void side-effect hooks |
| `useIsMobile()` | `src/hooks/use-mobile.tsx` | Mobile breakpoint detector. | none | `boolean` |
| `useToast()` / `toast()` | `src/hooks/use-toast.ts` | Global toast state/actions. | none | toast API/state |

### 3.3 Shared data-access utilities/services
- `src/integrations/supabase/client.ts` (single Supabase client)
- `src/integrations/supabase/types.ts` (generated typed schema)
- `src/lib/budget-calc.ts` (local computation, no fetch)
- `src/lib/whatsapp.ts` (WhatsApp URL builder, no fetch)

---

## SECTION 4 — COMPONENT ARCHITECTURE

### 4.1 `src/components/landing/` files
- `Navbar.tsx` — top navigation (desktop/mobile), links + “Descubre Tu Aventura” CTA
- `HeroSection.tsx` — homepage hero with media slider + WhatsApp/quiz CTAs
- `QuizSection.tsx` — interactive quiz UI, result cards, WhatsApp conversion, email capture
- `DestinationsCatalog.tsx` — destination card grid with difficulty tabs
- `GearPreview.tsx` — featured gear cards for homepage
- `BlogPreview.tsx` — randomized blog cards + link to full blog
- `DidYouKnowSection.tsx` — carousel-style destination storytelling cards
- `SocialProof.tsx` — trust metrics + quiz CTA
- `TravelInsuranceSection.tsx` — travel insurance affiliate promotion
- `PremiumItinerarySection.tsx` — package cards + WhatsApp/package CTAs
- `NewsletterSignup.tsx` — newsletter opt-in form + welcome-email trigger
- `Footer.tsx` — footer nav, social links, legal links, affiliate disclosure
- `MediaSlider.tsx` — wrapper that feeds media items into shared background slideshow

### 4.2 `src/components/shared/` files
- `BackgroundSlideshow.tsx` — reusable image/video background rotator with overlay

### 4.3 `src/components/ui/` files
- `accordion.tsx` — Radix accordion wrapper
- `alert-dialog.tsx` — modal confirmation dialog
- `alert.tsx` — inline alert box
- `badge.tsx` — badge/pill component
- `breadcrumb.tsx` — breadcrumb primitives
- `button.tsx` — button variants
- `calendar.tsx` — calendar/date picker primitive
- `card.tsx` — card container/header/content/footer
- `carousel.tsx` — embla carousel wrapper
- `chart.tsx` — chart container/config helpers
- `checkbox.tsx` — checkbox primitive
- `command.tsx` — command menu/palette UI
- `dialog.tsx` — dialog modal primitive
- `drawer.tsx` — drawer/sheet style panel
- `dropdown-menu.tsx` — dropdown menu primitives
- `form.tsx` — React Hook Form wrappers
- `input-otp.tsx` — OTP input primitive
- `input.tsx` — text input
- `label.tsx` — form label
- `pagination.tsx` — pagination controls
- `popover.tsx` — popover primitive
- `resizable.tsx` — resizable panel group
- `select.tsx` — select/dropdown primitive
- `separator.tsx` — visual separator
- `sheet.tsx` — side sheet/modal panel
- `sidebar.tsx` — sidebar context/layout primitives
- `skeleton.tsx` — loading skeleton
- `sonner.tsx` — sonner toaster wrapper
- `switch.tsx` — on/off switch
- `table.tsx` — semantic table wrappers
- `tabs.tsx` — tab primitives
- `textarea.tsx` — textarea input
- `toast.tsx` — toast primitives
- `toaster.tsx` — mounted toast viewport/provider
- `toggle.tsx` — toggle button primitive
- `tooltip.tsx` — tooltip primitives/provider
- `use-toast.ts` — toast hook wiring for ui toast primitives
- `tmpclaude-b035-cwd` — plain text artifact file containing a local path string (not a UI component)

### 4.4 Main layout/nav definition
- Main nav component: `src/components/landing/Navbar.tsx`
- Nav items defined in local `navLinks` array:
  - `#destinos`, `/gear`, `/blog`, `/servicios`, `/calculadora`, `/sobre-nosotros`
- Admin nav defined separately in `src/pages/admin/AdminLayout.tsx` (`links` array)

### 4.5 WhatsAppButton
- File: `src/components/WhatsAppButton.tsx`
- Phone config:
  - Uses `WHATSAPP_NUMBER` from `src/lib/whatsapp.ts`
  - `WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "18588996802"`
- Render location:
  - Mounted globally in `src/App.tsx` below `<AnalyticsRouteTracker />`
  - Hidden on `/admin` and `/admin/*`

### 4.6 React context providers
- App-level wrappers in `src/App.tsx`:
  - `HelmetProvider` — manages document head/meta context
  - `QueryClientProvider` — React Query cache/query client
  - `TooltipProvider` — Radix tooltip timing/context
- Additional internal providers used by UI primitives (not app root wrappers): `ToastProvider`, `SidebarProvider`, `FormProvider`, `ChartContext.Provider`, `CarouselContext.Provider`

---

## SECTION 5 — MONETIZATION TOUCHPOINTS

### 5.1 Amazon Associates links
- Dynamic Amazon links via gear product data (`affiliate_url` field):
  - `src/pages/GearArticleDetail.tsx` (`<a href={p.affiliate_url} ... rel="... sponsored">`)
  - Admin entry point for these links: `src/pages/admin/AdminGearArticleForm.tsx` (`URL Afiliado` input)
- Hardcoded Amazon links with `?tag=nomaderia-20` in drip email template:
  - `supabase/functions/send-drip-emails/index.ts` (5 product URLs)

### 5.2 Travelpayouts / Viator / other affiliate surfaces
- Direct Travelpayouts link:
  - `src/components/landing/TravelInsuranceSection.tsx`
  - URL: `https://www.travelpayouts.com/click?shmarker=nomaderia&prg=safety&sys=ins`
- Destination-level affiliate link fields rendered in UI:
  - `flights_url`, `hotels_url`, `insurance_url`, `tours_url`, `tickets_url`, `car_rental_url`, `transfer_url`
  - Rendered in `src/pages/DestinationDetail.tsx` and `src/pages/BudgetCalculator.tsx`
- Admin destination form exposes provider-specific placeholders:
  - Klook, Tiqets, Localrent, Welcome Pickups fields in `src/pages/admin/AdminDestinationForm.tsx`
- No explicit `viator` usage found in current source

### 5.3 Quiz implementation and data flow
- UI implementation: `src/components/landing/QuizSection.tsx`
- Core logic/state: `src/hooks/use-quiz.ts`
- Captures:
  - `fitness_level`, `interest`, `trip_duration`, `main_barrier`, `budget_range`, `season`, `origin`
  - email (for result delivery/newsletter)
- Data writes:
  - `newsletter_subscribers` (`source: "quiz"`)
  - `quiz_responses` (includes `recommended_destinations` array)
- Edge function call:
  - invokes `send-quiz-email` with destination payload

### 5.4 Itinerary request collection
- Table exists: `itinerary_requests`
- Admin read UI exists: `src/pages/admin/AdminItineraryRequests.tsx`
- **No active public frontend form writing to `itinerary_requests` found in `src/`**
- Current conversion flow for itineraries is primarily WhatsApp CTAs (`HeroSection`, `PremiumItinerarySection`, `Servicios`, quiz results)

### 5.5 `sentinel_leads` writes
- Written from: `src/pages/SentinelLanding.tsx`
- Insert location: `supabase.from("sentinel_leads").insert({ email })`

---

## SECTION 6 — EMAIL & EDGE FUNCTIONS

### 6.1 Edge functions and email purpose
- `send-quiz-email` (`supabase/functions/send-quiz-email/index.ts`)
  - Sends personalized destination recommendation email from quiz
- `send-quiz-results` (`supabase/functions/send-quiz-results/index.ts`)
  - Sends alternate quiz results email template
- `send-welcome-email` (`supabase/functions/send-welcome-email/index.ts`)
  - Sends welcome email to recent newsletter subscriber
- `send-drip-emails` (`supabase/functions/send-drip-emails/index.ts`)
  - Sends follow-up drip sequence emails (`gear_guide`, `itinerary_cta`) and logs status

### 6.2 Resend configuration and event triggers
- Resend API endpoint used: `https://api.resend.com/emails`
- API key secret: `RESEND_API_KEY`
- From addresses used:
  - `Nomaderia <hola@nomaderia.com>` (`send-quiz-email`, `send-welcome-email`)
  - `Nomaderia Adventures <hola@nomaderia.com>` (`send-quiz-results`, `send-drip-emails`)
- Trigger events:
  - Quiz email: `useQuiz.handleEmailSubmit()` in `src/hooks/use-quiz.ts`
  - Welcome email: `NewsletterSignup` in `src/components/landing/NewsletterSignup.tsx`
  - Drip emails: cron schedule (`20260228000001_setup_pg_cron_drip.sql`) or manual function invoke
  - Quiz-results function exists but no current frontend invocation detected

### 6.3 `import.meta.env.VITE_*` names across project
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SENTRY_DSN`
- `VITE_GA_MEASUREMENT_ID`
- `VITE_WHATSAPP_NUMBER`
- `VITE_SITE_URL`

### 6.4 `Deno.env.get()` secret names in Edge Functions
- `RESEND_API_KEY`
- `VITE_SITE_URL`
- `SITE_URL`
- `WHATSAPP_PHONE`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## SECTION 7 — SERVICIOS PAGE (read completely)

Source: `src/pages/Servicios.tsx`

### 7.1 Current structure/content
1. **Hero section** (background slideshow from `media_slider`):
   - Badge text: `Agente de Viajes Certificado TAP`
   - Heading: `Tu aventura, armada paso a paso`
   - Body: beginner-focused itinerary positioning
   - Primary CTA button: `Escríbenos por WhatsApp`
2. **Cómo Funciona** (3-step blocks):
   - `1. Cuéntanos tu plan`
   - `2. Diseñamos tu ruta`
   - `3. Viaja sin estrés`
3. **Paquetes** (cards from shared config `packages`)
4. **Preguntas Frecuentes** (accordion with 4 FAQs)
5. Standard `Navbar` + `Footer`

### 7.2 Products and prices shown
Driven from `src/config/pricing.ts` and rendered in this page:
- `Weekend` — `$19 USD` / `$299 MXN` — `1-3 días`
- `Aventura` — `$35 USD` / `$549 MXN` — `4-7 días` (popular)
- `Expedición` — `$59 USD` / `$899 MXN` — `8+ días` (highlight: WhatsApp support)

### 7.3 CTAs and destinations
- Hero CTA → WhatsApp URL built with `buildWhatsAppUrl(..., WHATSAPP_NUMBER)`
- Each package card CTA (`pkg.cta`) → package-specific WhatsApp prefilled message
- Footer/nav links inherited from shared components

### 7.4 Supabase data fetch
- Fetches from `media_slider` via `useMediaSlider()` (React Query custom hook)
- No direct form submission to Supabase tables on this page

---

## SECTION 8 — DESTINATION DETAIL PAGE (read completely)

Source: `src/pages/DestinationDetail.tsx`

### 8.1 Tab structure and sections
- Tabs (`TabsList`):
  1. `¿Puedo Hacerlo?` (`can-i`)
     - Difficulty description
     - FAQ accordion from `common_fears`
  2. `Preparación Física` (`prep`)
     - Markdown from `preparation_plan` (fallback `Contenido próximamente.`)
  3. `Itinerario` (`itinerary`)
     - Markdown from `itinerary_markdown` (fallback `Contenido próximamente.`)
  4. `Qué Llevar` (`gear`)
     - Markdown from `gear_list_markdown` (fallback `Contenido próximamente.`)

Additional sections:
- Hero image carousel (`hero_image_url` + `gallery_images`)
- Sidebar booking card
- Gallery section + lightbox (`gallery_images`)
- Share section (`ShareButtons`)
- Related destinations grid
- `ArticleWhatsAppCTA`
- `PremiumItinerarySection`

### 8.2 Supabase fields read from `destinations`
Via `useDestinationBySlug()` and `useRelatedDestinations()`:
- Core: `id`, `title`, `slug`, `country`, `region`
- Content: `short_description`, `difficulty_level`, `difficulty_description`, `days_needed`, `best_season`, `estimated_budget_usd`, `preparation_plan`, `itinerary_markdown`, `gear_list_markdown`, `full_guide_markdown`
- Media: `hero_image_url`, `gallery_images`
- Commercial: `affiliate_links`
- Structured/aux: `common_fears`, `experience_type`, `is_published`
- Related query selects subset fields for cards

### 8.3 “Reserva Tu Viaje” section
- Location: sidebar card (`CardTitle: "Reserva Tu Viaje"`)
- Renders conditional booking buttons if URLs exist in `affiliate_links`:
  - `flights_url`, `hotels_url`, `tours_url`, `tickets_url`, `car_rental_url`, `transfer_url`, `insurance_url`
- If none exist: shows `Enlaces de reserva próximamente.`
- Also includes internal links to `/gear` and `/calculadora`

### 8.4 CTA / affiliate sections present
- Affiliate booking buttons (external)
- Internal cross-sell links (gear/budget)
- Related destinations links
- Global article WhatsApp CTA
- Premium itinerary promotional section

---

## SECTION 9 — KNOWN ISSUES

### 9.1 Broken image references / missing assets
- `src/pages/SobreNosotros.tsx` uses `src="/diploma.jpg"`
  - `public/` currently does **not** contain `diploma.jpg` (only `CNAME`, `_redirects`, `favicon.ico`, `placeholder.svg`, `robots.txt`, `sitemap.xml`)
  - Page has fallback placeholder block, so visual fallback exists but asset is missing
- `src/config/assets.ts` has `BRAND_ASSETS.logo = ""` (logo not configured; components fall back to icon/text)

### 9.2 Production placeholders / TODOs (requested search terms)
- Meta Pixel placeholder still live in `index.html`:
  - `fbq('init', 'TU_PIXEL_ID_AQUI')`
  - `<img ... tr?id=TU_PIXEL_ID_AQUI ...>`
- `TODO` in production source:
  - `src/config/assets.ts:7` — `TODO` to set final logo URL
- “próximamente” strings in runtime UI:
  - `src/pages/DestinationDetail.tsx` tab markdown fallbacks: `Contenido próximamente.`
  - `src/pages/DestinationDetail.tsx` booking fallback: `Enlaces de reserva próximamente.`

### 9.3 Hardcoded prices/currencies found
- `src/config/pricing.ts`:
  - `$299 MXN`, `$549 MXN`, `$899 MXN`
- `supabase/functions/send-drip-emails/index.ts`:
  - `$299 MXN`, `$549 MXN`, `$899 MXN` in HTML template
- `supabase/functions/send-quiz-results/index.ts`:
  - `Desde $299 MXN / $19 USD`

### 9.4 `console.error` and related runtime error logs
- `src/main.tsx` — fatal bootstrap error log
- `src/hooks/use-quiz.ts` — email send error log
- `src/pages/NotFound.tsx` — logs every 404 path via `console.error`

### 9.5 Schema drift risks observed
- `quiz_responses.main_barrier` exists in generated TS types and is written from `useQuiz`, but not present in tracked migration DDL
- `email_drip_log` exists in migrations and admin pages, but is missing from generated `src/integrations/supabase/types.ts`
- `media_slider` and `sentinel_leads` are used in code but absent from tracked migrations/types in this repo

---

## SECTION 10 — DESIGN SYSTEM

### 10.1 Exact Tailwind + token values
Sources: `tailwind.config.ts`, `src/index.css`

- Dark mode config: `darkMode: ["class"]`
- Fonts:
  - `font-serif`: `"Playfair Display", serif`
  - `font-sans`: `"Inter", sans-serif`
- Core brand HSL tokens (`:root`):
  - `--background: 0 0% 98%` (≈ `#FAFAFA`)
  - `--foreground: 20 13% 10%` (≈ `#1C1917`)
  - `--primary: 32 95% 44%` (≈ `#D97706`)
  - `--secondary: 143 64% 24%` (≈ `#166534`)
  - `--accent: 30 10% 94%` (light warm gray)
- Other custom tokens:
  - `--sand`, `--forest`, `--sunset`, `--trail`, `--sky`, `--charcoal`

### 10.2 Installed shadcn/ui components (folder inventory)
- `accordion`, `alert`, `alert-dialog`, `badge`, `breadcrumb`, `button`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `command`, `dialog`, `drawer`, `dropdown-menu`, `form`, `input`, `input-otp`, `label`, `pagination`, `popover`, `resizable`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toast`, `toaster`, `toggle`, `tooltip`, plus `use-toast` helper

### 10.3 Dark mode implementation
- Tailwind is configured for class-based dark mode, but runtime theme is effectively light editorial (no app-level toggle implemented)

### 10.4 Custom CSS/global styles
- Main global stylesheet: `src/index.css`
  - Tailwind base/components/utilities
  - CSS variables for tokens
  - global body/headings font families
  - smooth scroll and scrollbar-hide utility
- No additional global CSS files detected beyond `src/index.css`

---

## Additional notes for external architect
- High-impact files for funnel/monetization logic:
  - `src/components/landing/QuizSection.tsx`
  - `src/hooks/use-quiz.ts`
  - `src/components/landing/PremiumItinerarySection.tsx`
  - `src/pages/Servicios.tsx`
  - `src/pages/DestinationDetail.tsx`
- High-impact infra files:
  - `supabase/migrations/*.sql`
  - `supabase/functions/*/index.ts`
  - `src/integrations/supabase/client.ts`
  - `src/integrations/supabase/types.ts`
