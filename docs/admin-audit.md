# Admin Panel Audit — Nomaderia Adventures
> **Date:** 2026-06-03 · **Scope:** Analysis only — no code changes · **Theme constraint:** Dark theme must be preserved throughout

---

## 1. Current State — Inventory

| Page | Route | What it does | Tables read | Tables written | Pain points |
|------|-------|-------------|-------------|----------------|-------------|
| **AdminDashboard** | `/admin` | 8 stat cards, "Atención hoy" 48h panel (sentinel + quiz), 4 MiniBar analytics charts, recent activity list, 3 quick-action buttons | `destinations`, `gear_articles`, `blog_posts`, `quiz_responses`, `sentinel_leads`, `newsletter_subscribers`, `itinerary_requests`, `email_drip_log`, `destination_ai_meta`, `ai_content_meta` | none | Header has hardcoded light bg (#FAFAFA) that breaks the dark theme; "Actualizado hace 2 min" is static/fake; sidebar lead badge hardcoded to "1"; `xl:grid-cols-6` with 8 cards causes overflow; greeting is always "Buenos días" regardless of time; no date-range filter on analytics; "Sin contactar" badge has no way to dismiss/update |
| **AdminLayout** | `/admin/*` | Dark sidebar nav (13 links), mobile top bar, auth guard (`has_role` RPC), logout | none | none | 13 flat links with no grouping; mobile nav overflows and is nearly unusable; sidebar lead badge hardcoded; two different sections share the "Bell" icon creating visual confusion; hardcoded user name/email ("Frank", "frank@nomaderia.travel"); no grouped nav sections |
| **AdminDestinations** | `/admin/destinations` | CRUD table (title, country, difficulty, publish toggle, edit, delete) + AI discovery panel | `destinations` | `destinations`, `destination_ai_meta` | No search or filter; no date column; difficulty shows raw DB enum ("easy"/"moderate"/"challenging" not localized); no hero image thumbnail; no pagination; no bulk publish/unpublish |
| **AdminGearArticles** | `/admin/gear-articles` | CRUD table (title, category, publish toggle) + AI discovery | `gear_articles` | `gear_articles`, `ai_content_meta` | Same issues as destinations; category shows raw value; no date |
| **AdminBlogPosts** | `/admin/blog-posts` | CRUD table (title, category, publish toggle) + AI discovery | `blog_posts` | `blog_posts`, `ai_content_meta` | Same; no reading_time_min or tags shown; no date |
| **AdminQuizResponses** | `/admin/quiz-responses` | Read-only table (all quiz fields) + CSV export | `quiz_responses` | none | No search/filter by date or dimension; `recommended_destinations` column not shown (most actionable field); no WhatsApp follow-up button; legacy origin keys visible in UI; loads all rows with no pagination; no summary mini-charts |
| **AdminSubscribers** | `/admin/subscribers` | Read-only table (email, source, date) + CSV | `newsletter_subscribers` | none | Very sparse — only 3 columns; no search; `source` is raw string; no drip email status or link to quiz data; no breakdown by source |
| **AdminSentinelLeads** | `/admin/sentinel-leads` | Read-only table (email, source, date, WhatsApp button) + CSV | `sentinel_leads` (via `as unknown as SupabaseClient` cast) | none | No search/filter; "contacted" state not persisted anywhere — WhatsApp opens but action is not recorded; duplicates the 48h panel already in dashboard |
| **AdminItineraryRequests** | `/admin/itinerary-requests` | Read-only table (name, email, destination, budget, message, date) + CSV | `itinerary_requests` (via implicit `as any`) | none | No WhatsApp follow-up button (inconsistency with sentinel page); message field line-clamped with no expand; no status tracking (new/contacted/converted); `supabase as any` cast pending type regeneration |
| **AdminPermitAlerts** | `/admin/permit-alerts` | Status management per alert (active/notified/expired), filter by status, refresh button | `permit_alerts` | `permit_alerts` (status update) | No search by email or park; no WhatsApp follow-up; Stripe-validation note buried in card; status dropdown on every row is verbose; no bulk status change |
| **AdminPermitWindows** | `/admin/permit-windows` | Full CRUD for permit windows + AI discovery (`discover-permit-windows`) | `permit_windows` | `permit_windows`, `ai_content_meta` | Inline form is very long — must scroll past it to reach the table; `how_to_apply_url` and `source_url` not shown in table; `window_type` enum not localized in table; no countdown to next opening |
| **AdminEmailLogs** | `/admin/email-logs` | Read-only table (email, type, status, date) + CSV | `email_drip_log` | none | No search by email; no filter by type or status; `error_message` field exists but not shown; no failure rate summary; no pagination |
| **AdminGallery** | `/admin/gallery` | Media slider CRUD: upload images/video, toggle active, delete | `media_slider` (via `as unknown as SupabaseClient` cast) | `media_slider`, Supabase Storage `media_gallery` bucket | No drag-to-reorder for `display_order`; no visual grid/list toggle; no thumbnail preview sizes |
| **SystemAudit** | `/admin/audit` | Dev diagnostic: env vars, Supabase connection, GA4, test email, image URL checker | `destinations`, `gear_articles`, `blog_posts` (image checks) | none | "Actualizado hace 2 min" is static; developer tool not business operations — low priority for visual investment |

---

## 2. Mobbin Patterns Worth Adopting

### 2a. Stats Overview Cards
**Apps:** Lovable (dark), Posh (dark), Vapi (dark), Stripe, Whop

- **Trend delta indicators** ("+12% vs last month" with green/red arrow): Lovable and Stripe show `+X.X%` deltas next to the main number. Currently none of our cards show this — adding delta vs 7 days ago for quiz completions, sentinel leads, and subscribers would give Frank instant trend awareness.
- **Embedded sparklines**: Vapi and Stripe embed a tiny line chart inside the stat card itself (not as a separate section below). Cleaner than our current 2×2 MiniBar grid.
- **Time range selector on overview**: Posh shows Day/Week/Month/YTD/All Time toggle at the top of the overview. Our quiz analytics section has no date filter at all.
- **Customizable widget grid**: Stripe allows add/remove/reorder of cards. Overkill for now, but the idea of letting Frank hide cards he doesn't care about (e.g., AI hours-saved) is valid.

### 2b. CRM / Lead Management
**Apps:** HubSpot, Pipedrive, QuickBooks, Intercom, HoneyBook

- **Top summary widgets above table** (QuickBooks Leads): 3 mini-panels — Lead Status donut, Lead Conversion funnel, Sources breakdown — sit above the list table. Equivalent for Nomaderia: quiz→email conversion rate, leads by source (quiz vs sentinel vs itinerary), contact status distribution.
- **Per-row "Next activity" warning column** (Pipedrive): shows "No activity" with a warning icon when a lead hasn't been followed up. We have no equivalent — our "Sin contactar" badge is always shown, always red, always meaningless. Pipedrive's model shows it only when attention is needed, with a real follow-up timestamp.
- **Source origin as a badge column** (Pipedrive, Intercom): each row shows where the lead came from (Web Forms, Chatbot, etc.). We can show "quiz" / "sentinel" / "itinerary" as a colored badge per row in a unified leads view.
- **Sticky bulk action bar on selection** (Hotjar, Zendesk, Pipedrive): when you check rows, a bar appears at the bottom or top ("3 selected → Change status / Export / Delete"). We have zero bulk actions anywhere.
- **Right-side detail drawer** (HubSpot): clicking a row slides open a panel with full contact details + activity timeline. Our only equivalent is navigating to a full edit page, which loses table context.
- **Column visibility picker** (Intercom, Mixpanel): "Show and hide columns" popover. Useful for quiz responses where we have 8 columns including some rarely needed ones.

### 2c. CMS Content Management
**Apps:** Zendesk, Webflow, Intercom

- **Left sidebar with status counts** (Zendesk): the sidebar itself shows "Published: 12 · Drafts: 1 · Archived: 0". We only show these counts in the dashboard stat cards, not in the content list pages themselves.
- **Checkbox + bottom bulk action bar** (Zendesk): select multiple articles → "Publication" dropdown (Publish/Unpublish/Archive) + "Article settings" dropdown. Our content lists have no bulk actions — you must toggle each Switch individually.
- **Row context menu** (Webflow): ••• on each row exposes Publish/Save as draft/Archive/Delete without navigating away. Currently we have icon buttons but no archive/draft-from-list flow.
- **Inline search above table** (Zendesk): simple search input in the table header, not a global search. Our content list pages have no search at all.

### 2d. Data Tables
**Apps:** Mixpanel, Hotjar, Deel, Typeform, Clay

- **"Showing X of Y results" row count** (Mixpanel): always shows how many rows are displayed vs total matches. We show a count in the page header but not inside the table itself.
- **Sortable column headers** (Mixpanel, Typeform, Clay): click column header to sort asc/desc. None of our tables have sortable columns.
- **Filter chips above table** (Hotjar, Deel): segmented pill filters like "All sessions | Direct traffic | Error occurred | Mobile users". Good model for filtering quiz responses by fitness level, budget, or interest — without needing a full filter panel.
- **Tab bar for views** (Typeform): "Smart Insights | Insights | Summary | Responses [5]" — lets the page serve multiple audiences (Frank wants both the raw list and the analytics summary). We split these across Dashboard and AdminQuizResponses today.

### 2e. Empty States
**Apps:** Typeform, Amplitude, Steep, Hootsuite

- **Illustrated empty states with a personality** (Typeform: "Come on in, jane" + a dog illustration; Amplitude: clean illustration + "Get started by adding a chart"). Currently our empty states are just a single `<TableCell>` line of muted text. For Nomaderia's brand, a warm phrase + icon/illustration + primary CTA button would match the editorial tone.
- **Onboarding checklist in empty state** (Hootsuite: "4/6 Explored" progress bar with task cards). When the admin is brand new (zero destinations, zero blog posts), a setup checklist would guide Frank through initial content setup.

---

## 3. Visual Optimizations

Priority scale: **P0** = breaks UX or brand · **P1** = high value, relatively low effort · **P2** = quality of life  
Effort scale: **S** = < 2h · **M** = 2–6h · **L** = 6–12h

### P0 — Fix Before Anything Else

| # | Issue | Where | Fix | Effort |
|---|-------|--------|-----|--------|
| P0-1 | Dashboard header `bg-[#FAFAFA]` is a **light island inside the dark admin** | `AdminDashboard.tsx:224` | Remove the forced light background; use `bg-background` (sidebar dark token) or remove the header bar entirely and let the existing page padding handle the title area | S |
| P0-2 | Sidebar lead badge **hardcoded to "1"** — misleads Frank | `AdminLayout.tsx:96` | Either remove the hardcoded badge entirely (replace with a live count from `sentinel_leads` on layout mount) or remove it until a real-time subscription is implemented | S |
| P0-3 | Mobile sidebar: **13 links in a horizontal scroll** is nearly unusable on phone | `AdminLayout.tsx:128–140` | Replace with a hamburger menu drawer on mobile (Radix Sheet) — same dark theme, links grouped | M |

### P1 — High Value

| # | Issue | Where | Fix | Effort |
|---|-------|--------|-----|--------|
| P1-1 | No sidebar nav **grouping** — 13 flat links with no hierarchy | `AdminLayout.tsx links[]` | Group into 4 sections: **Contenido** (Destinos, Gear, Blog), **Leads** (Sentinel, Quiz, Itinerarios, Alertas, Ventanas), **Datos** (Suscriptores, Emails, Galería), **Sistema** (Auditoría) | S |
| P1-2 | No **inline search** on any list page | All CRUD list pages | Add a controlled `<Input>` above each table that filters `items` client-side by title/email; no backend changes needed | S each |
| P1-3 | **Difficulty and category** labels show raw DB enum strings | `AdminDestinations`, `AdminGearArticles` | Add label maps (already exist in public pages) and use them in the Badge | S |
| P1-4 | `recommended_destinations` not shown in **Quiz Responses** table — the single most actionable field | `AdminQuizResponses.tsx` | Add a column showing `recommended_destinations[0]` (or a +N badge if multiple); make it sortable | S |
| P1-5 | No **WhatsApp follow-up** button in AdminItineraryRequests | `AdminItineraryRequests.tsx` | Add a WhatsApp button per row (same pattern as AdminSentinelLeads) using `buildWhatsAppLink()` with prefilled itinerary message | S |
| P1-6 | **"Sin contactar" badge** always shown for every lead — creates alarm fatigue | `AdminDashboard.tsx:291,345` | Add a localStorage-based "mark as seen" per email, or simply remove the pulsing badge | S |
| P1-7 | `error_message` field exists in `email_drip_log` but **not shown** in table | `AdminEmailLogs.tsx` | Add an Error column shown only when `status !== "sent"`; include failure rate summary ("X of Y failed") in the page header | S |
| P1-8 | `window_type` enum not localized in **Permit Windows** table | `AdminPermitWindows.tsx:572` | Add a label map: `lottery → Lotería`, `reservation_release → Liberación`, `first_come → Por llegada` | S |
| P1-9 | **Empty state** for all list pages is a single grey sentence | All list pages | Replace with icon + warm heading + primary CTA link (e.g. "Crea tu primer destino →") matching dark card style | S each |
| P1-10 | **"Actualizado hace 2 min"** in Atención hoy panel is hardcoded/static | `AdminDashboard.tsx:257` | Either wire to the actual fetch timestamp or remove the label | S |

### P2 — Quality of Life

| # | Issue | Where | Fix | Effort |
|---|-------|--------|-----|--------|
| P2-1 | No **pagination** on any table — slow with 100+ rows | All list pages | Add simple prev/next pagination with a fixed page size (25 rows); change `.select("*")` to add `.range(offset, offset+24)` | M each |
| P2-2 | No **date column** on content list pages | Destinations, Gear, Blog | Add `created_at` formatted column (e.g. "12 Jun") as the last column | S |
| P2-3 | No **sortable column headers** on any table | All list pages | Add sort state (`sortKey`, `sortDir`) and sort the `items` array client-side on column header click | M |
| P2-4 | No **trend delta** on dashboard stat cards | `AdminDashboard.tsx` | Add a `quizThisWeek` vs `quizLastWeek` query and show "+N vs últimos 7d" below the count | M |
| P2-5 | No **drag-to-reorder** in Gallery for display_order | `AdminGallery.tsx` | Use `@dnd-kit/sortable` (already a potential dep) or HTML5 draggable + reorder + batch update | L |
| P2-6 | **Permit Alerts** status select on every row is verbose | `AdminPermitAlerts.tsx` | Replace per-row Select with 3 compact icon buttons (✓ Notificada / ✗ Expirada / ← Reset) | S |
| P2-7 | Permit Windows: **inline create form above the table** forces scrolling | `AdminPermitWindows.tsx` | Move to a slide-over Sheet (Radix) that opens when "Nueva ventana" is clicked; same form, no layout disruption | M |
| P2-8 | **"Buenos días" greeting** regardless of time of day | `AdminDashboard.tsx:227` | Replace with time-aware greeting: buenos días (6–12), buenas tardes (12–19), buenas noches (19–6) | S |

---

## 4. Missing Features Worth Building

### 4a. Unified Leads / Contactos View — Priority: HIGH

**What it shows:** A single `/admin/leads` page that merges all lead sources into one ranked list:
- `sentinel_leads` (paid product interest)
- `quiz_responses` where `email IS NOT NULL` (quiz-captured emails)
- `itinerary_requests` (direct service intent)

Each row: avatar initial, email, source badge ("Alerta" amber / "Quiz" charcoal / "Itinerario" green), date, recommended destination (from quiz) or requested destination (from itinerary), WhatsApp button.

**Where data lives:** All three tables already exist. No new columns needed.

**Why this matters:** Frank currently has to visit 3 separate pages to see who contacted him. The dashboard "Atención hoy" panel only shows 48h. This would be the single "inbox" for all inbound demand signals.

**Rough effort:** M (1 new page, 3 parallel queries, no schema changes)

---

### 4b. Contact Status Tracking — Priority: HIGH

**What it shows:** A simple `contacted_at` timestamp or `status` enum ("nuevo" / "contactado" / "convertido") that Frank can update per lead. Currently the "Sin contactar" badge is always shown — clicking WhatsApp opens a chat but records nothing.

**Where data lives:** `sentinel_leads` and `quiz_responses` have no status field. `itinerary_requests` has no status field. `permit_alerts` already has a `status` enum — that model should be replicated.

**What's needed:** A migration adding `status` + `contacted_at` to `sentinel_leads` and `quiz_responses` (and optionally `itinerary_requests`). Then surface a "Mark as contacted" button that sets the status.

**Why this matters:** The business model is WhatsApp-first conversion. If Frank has no way to track who he's spoken to, the leads list grows stale and meaningless.

**Rough effort:** M (migration + Frank runs `supabase db push` + type regen + 1–2 UI changes)

---

### 4c. Quiz Analytics Tab — Priority: MEDIUM

**What it shows:** Dedicated analytics view within `/admin/quiz-responses`, as a tab alongside the raw table. Charts:
- Quiz completions by week (bar chart)
- Top recommended destinations (ranked list with counts)
- Funnel: completions → email captured (% conversion)
- Barrier distribution (what stops people)
- Budget distribution
- Origin distribution

**Where data lives:** All in `quiz_responses`. The 4 MiniBar charts in the Dashboard already pull this data — the tab would reuse the same query structure with a date-range filter.

**Why this matters:** These are high-value business insights for content and product decisions. Currently buried in the dashboard without date context.

**Rough effort:** M (new tab component, reuse `MiniBar`, add date range filter query)

---

### 4d. Email Funnel View — Priority: MEDIUM

**What it shows:** Enhances `/admin/subscribers` with:
- Count breakdown by source (quiz / sentinel / itinerary)
- Per-subscriber drip status: which emails have been sent, last email date
- "Email not yet sent" indicator (subscriber captured but drip sequence hasn't fired)

**Where data lives:** `newsletter_subscribers` + `email_drip_log` — joinable by `email`. No schema changes needed.

**Why this matters:** Frank can't currently tell whether a subscriber has received the drip sequence. A stuck email pipeline would be invisible.

**Rough effort:** S–M (JOIN query + an extra column or sub-row in the subscribers table)

---

### 4e. WhatsApp Click Tracking — Priority: MEDIUM (future)

**What it shows:** A counter of outbound WhatsApp link clicks from the admin (not user-facing). Track when Frank clicks "WhatsApp" on a lead row, store a `whatsapp_click` event in Supabase, show "Last contact attempt: hace 3d" next to the lead.

**Where data lives:** No table yet. Would need a new `admin_events` table or an additional column on the lead tables.

**Why this matters:** Right now the admin has zero visibility into its own outreach. Did Frank follow up on last week's quiz completions? No way to know.

**Rough effort:** S (add click handler that inserts a row before opening the WA link) + migration

---

### 4f. Permit Alert Workflow Improvements — Priority: LOW

**What it shows:** On `/admin/permit-alerts`:
- "Notificar por email" button that invokes the `check-permit-alerts` Edge Function manually (or at least shows when the cron last ran)
- `notified_at` timestamp column (currently not surfaced — likely exists on the row after update)
- Link from an alert to its matching permit window (park + year match)

**Where data lives:** `permit_alerts`, `permit_windows` — already linked by park + year conceptually, no FK yet.

**Rough effort:** M

---

## 5. Data & Metrics Worth Surfacing That Aren't Shown Today

| Metric | Why it matters | Where the data is |
|--------|---------------|-------------------|
| **Quiz → email conversion rate** | Core funnel metric: what % of quiz completions result in an email capture | `quiz_responses`: total rows vs rows where `email IS NOT NULL` |
| **New leads this week** (delta) | Frank needs a quick pulse on momentum, not just an all-time count | `sentinel_leads` + `quiz_responses`: `COUNT WHERE created_at > now() - 7d` |
| **Top recommended destination this month** | Which destination the algorithm is sending the most quiz takers to — signals content investment priority | `quiz_responses.recommended_destinations[0]`, grouped and counted |
| **Email drip failure rate** | Is the Resend integration healthy? | `email_drip_log`: `COUNT WHERE status = 'error'` / total |
| **Permit alerts by park** | Which park has the most subscribers waiting — helps Frank prioritize permit window research | `permit_alerts`, grouped by `park` |
| **Itinerary requests by destination** | Which destinations are generating paid intent | `itinerary_requests.destination`, grouped and counted |
| **Content coverage gaps** | Destinations with no hero image, no permit_alert_url, or low word count | `destinations` columns: `hero_image_url IS NULL`, `permit_alert_url IS NULL` |
| **Drip sequence step distribution** | Which drip emails are being sent most (quiz_results / gear_guide / itinerary_cta) — reveals where the funnel cuts off | `email_drip_log.email_type`, grouped |

---

## 6. DO NOT TOUCH — Implementation Guardrails

The following must remain completely unchanged during any admin implementation work:

- **Auth logic:** `supabase.auth.getSession()`, `supabase.rpc("has_role", ...)`, `onAuthStateChange` in `AdminLayout.tsx`. Touch nothing.
- **Public webapp:** Any component not under `src/pages/admin/` or a shared admin component. The landing, quiz, destinations, blog — all off limits.
- **Routing:** `/admin/*` routes in `App.tsx`. Do not add, remove, or rename routes without updating `AdminLayout.tsx` links array simultaneously.
- **`src/components/ui/`:** shadcn/ui generated files. Do not edit.
- **`src/integrations/supabase/types.ts`:** Auto-generated. Do not edit manually — regenerate via CLI.
- **Pricing and products:** `src/config/pricing.ts`, `Servicios.tsx`, `PremiumItinerarySection.tsx`. Model is frozen.
- **Supabase queries on public pages:** `use-destinations.ts`, `use-blog-posts.ts`, `use-gear-articles.ts`, `use-quiz.ts`. Admin patterns use direct Supabase calls; hooks are for public pages only (ADR-007).
- **MXN prices and legacy product names:** Do not reintroduce the retired duration-tier naming or any MXN amounts.
- **`supabase.auth.*` and `has_role` RPC:** No changes to the admin auth flow under any circumstance.
- **Dark theme:** Admin stays dark. Do not propose or introduce a light-mode toggle, light variant, or `bg-white` backgrounds inside admin pages beyond what already exists in the white card sub-surfaces inside the dashboard.
- **Edge Functions:** `send-quiz-email`, `send-drip-emails`, `send-quiz-results`, `check-permit-alerts` — do not modify these unless explicitly tasked. They handle real user email delivery.
- **`.env` and secrets:** Never touch, never log, never hardcode.
