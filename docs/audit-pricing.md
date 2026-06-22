# Pricing & Product Audit — Nomaderia Adventures

> **Scope:** All occurrences of dead $29 products, MXN pricing, Stripe references,
> $49 / current product, and pricing UI components across the entire repo.
> Generated: 2026-06-22. Audit only — no code was modified.
>
> **Business context:** Model is now ONE product only — "Itinerario Completo
> Nomaderia", $49 USD, closed via WhatsApp (wa.me/18588996802). Dead SKUs:
> "Alerta de Permisos" ($29 Stripe), "Itinerario Personalizado" ($29 WhatsApp),
> "Solución Completa" bundle, all MXN pricing, Escapada/Aventura/Expedición tiers.
> Source of truth for current product: `src/config/pricing.ts`.
> Authority: ADR-012 in `docs/decisions.md`.

---

## GROUP 1 — Dead $29 products, dead product names, MXN (to remove)

### 1.1 Edge Function: `supabase/functions/send-drip-emails/index.ts`

This is the highest-priority cleanup. The drip email template still presents a two-product pricing section matching the ADR-003 (replaced) model.

| Line | Exact text | Note |
|------|-----------|------|
| 168 | `Elige cómo quieres empezar:` | Section header framing two products — dead framing |
| 170 | `<!-- Itinerario Personalizado -->` | HTML comment — dead product block start |
| 174 | `🗺️ Itinerario Personalizado` | Display copy — dead product name |
| 175 | `Plan día a día · presupuesto detallado · checklist de equipo · tips de seguridad` | Feature copy under dead product |
| 179 | `$29 USD` | **Dead price** — displayed as the price for "Itinerario Personalizado" |
| 184 | `<!-- Solución Completa -->` | HTML comment — dead bundle block start |
| 189 | `✨ Solución Completa` | Display copy — dead bundle product name |
| 192 | `Itinerario personalizado + Alerta de permisos Yosemite` | Dead bundle description (references two dead SKUs) |
| 193 | `Ahorra $9 vs comprar por separado` | Dead savings copy (based on $29+$29=$58 minus $49=$9; math dies with the two-SKU model) |

**The $49 price on line 196 is numerically correct but is rendered under the dead "Solución Completa" framing.**

Hardcoded WhatsApp CTA on line 203:
```
https://wa.me/18588996802?text=Hola%20Nomaderia%20...%20Itinerario%20Personalizado.
```
The number `18588996802` is correct and matches `src/lib/whatsapp.ts`. The message text references "Itinerario Personalizado" (dead product name) — needs updating to current product.

---

### 1.2 Edge Function: `supabase/functions/send-quiz-results/index.ts`

| Line | Exact text | Note |
|------|-----------|------|
| 149 | `<!-- CTA: Itinerario Personalizado -->` | HTML comment — dead product name |
| 151–153 | `¿Quieres que planifiquemos todo por ti?` heading | Section framing the dead CTA |
| 156 | `Desde $29 USD.` | **Dead price** — displayed as the starting price for itineraries |

The CTA button on line 158–161 links to `/calculadora`, not to WhatsApp or Stripe — that part is not product-specific and survives the cleanup.

---

### 1.3 `/sentinel` page: `src/pages/SentinelLanding.tsx`

The entire `/sentinel` route is the landing page for "Alerta de Permisos" — the first product to be retired. The page is still live and indexed.

| Line | Exact text | Note |
|------|-----------|------|
| 33–34 | `import.meta.env.VITE_STRIPE_SENTINEL_URL \|\| "https://buy.stripe.com/00w9AT9bA2fR8I4bayaAw00"` | **Stripe Payment Link for dead $29 "Alerta de Permisos" product** (see Group 2 for full Stripe analysis) |
| 37 | `title: "Sentinel — Alertas de Yosemite en WhatsApp"` | Page meta title — dead product |
| 39 | `description: "Monitoreamos 24/7 los cupos que se liberan en Yosemite..."` | Page meta description — dead product |
| 87–90 | JSON-LD `name: "Sentinel — Alertas de Yosemite en WhatsApp"` | Structured data for dead product |
| 135 | `por WhatsApp en segundos. Para Half Dome (que es lotería, no` | Body copy for dead product |
| 235 | `${PRICING.solucionCompleta} USD` | Pricing card shows **$49** (current price, but page is for dead product — misleading) |

The `/gracias` redirect after payment also belongs to this flow (see 1.4).

---

### 1.4 `/gracias` page: `src/pages/Gracias.tsx`

This page is the post-Stripe-payment confirmation page for "Alerta de Permisos". It also includes a secondary form to activate the permit alert.

| Line | Exact text | Note |
|------|-----------|------|
| 36 | `title: "¡Gracias por tu compra!"` | Page meta title — tied to dead Stripe product |
| 37 | `description: "Confirmación de compra de la alerta de permisos de Nomaderia."` | Page meta description — dead product |
| 110–116 | `href="https://nomaderia.com/sentinel"` | Button linking back to dead product page |
| 120 | `Activa tu Alerta de Permisos` | **Section heading** — dead product name as visible H2 |

The permit-alert form (lines 122–166) is functional business logic tied to the `permit_alerts` table. Whether this form is retained, repurposed, or removed depends on whether permit alerts remain as a service.

---

### 1.5 `src/pages/DestinationDetail.tsx`

| Line | Exact text | Note |
|------|-----------|------|
| 894 | `Alerta de permisos — ${PRICING.solucionCompleta} USD` | **Mislabeled button**: label says dead product name "Alerta de permisos", but price resolves to $49 (current). Button links to `permitAlertUrl` (a per-destination Stripe link from the DB). |

This button renders only when `permitAlertUrl` is truthy (per-destination Stripe link configured in admin). Currently the label is incorrect for the single-product model.

---

### 1.6 `src/components/StickyMobileCTA.tsx`

| Line | Exact text | Note |
|------|-----------|------|
| 54 | `Alerta de permisos` | Sticky mobile button label — dead product name. Renders conditionally when `permitAlertUrl` is set. |

---

### 1.7 Admin — `src/pages/admin/AdminSubscribers.tsx`

| Line | Exact text | Note |
|------|-----------|------|
| 26 | `sentinel: "Alerta de Permisos"` | Admin UI display label for subscriber source `sentinel` — dead product name shown in the subscribers table source chip |

This is admin-only UI; no customer impact, but creates confusion for the admin user.

---

### 1.8 Admin — `src/pages/admin/AdminDestinationForm.tsx`

| Line | Exact text | Note |
|------|-----------|------|
| 225 | `"URL Alerta de Permisos (Stripe)"` | Admin form field label — dead product name. The field itself (`permit_alert_url`) stores a per-destination Stripe link. |
| 226 | `Solo para parques con permisos difíciles (Yosemite, Grand Canyon)` | Helper text under dead product field |

The `permit_alert_url` DB column and field are the mechanism through which per-destination Stripe links are configured. The field name in the DB (`permit_alert_url`) may stay if the concept of per-park Stripe links is retained; only the admin label needs updating.

---

### 1.9 MXN pricing

**No MXN price strings found in any `.ts` or `.tsx` file.** The cleanup documented in `docs/pending-tasks.md` changelog (line 583) and referenced in `docs/claude-context.md` (lines 626–630) was already applied to the Edge Functions. MXN strings appear only in documentation files as historical references.

---

### 1.10 Escapada / Aventura / Expedición tier names

**No occurrences of the legacy tier names as product identifiers in `.ts`/`.tsx` files.** The word "Aventura" appears generically in quiz copy (`src/hooks/use-quiz.ts:74,142`), page titles (`src/pages/BudgetCalculator.tsx:71`, `src/pages/Index.tsx:28`), and email taglines — all as the Spanish word for "adventure", not as a product tier. No action needed on these.

The test fixture in `src/hooks/use-quiz.test.ts:269` uses `"Escapada de fin de semana perfecta"` as a short description string, not a product name. No action needed.

---

## GROUP 2 — Stripe references

### 2.1 Live Stripe Payment Link (dead product)

| File | Line | Exact text | Maps to |
|------|------|-----------|---------|
| `src/pages/SentinelLanding.tsx` | 33–34 | `"https://buy.stripe.com/00w9AT9bA2fR8I4bayaAw00"` | **"Alerta de Permisos" — $29 USD (dead product).** This is the only live, hardcoded Stripe checkout URL in the codebase. It is the fallback when `VITE_STRIPE_SENTINEL_URL` is not set. |
| `CLAUDE.md` | 227 | `VITE_STRIPE_SENTINEL_URL= # https://buy.stripe.com/00w9AT9bA2fR8I4bayaAw00` | Env var pointing to same dead $29 product link — stale doc |

### 2.2 Placeholder for new $49 Stripe link (unfilled TODO)

| File | Line | Exact text | Note |
|------|------|-----------|------|
| `src/config/pricing.ts` | 19 | `export const STRIPE_LINK_ITINERARIO_49 = "REEMPLAZAR_CON_LINK_DE_49_USD"` | **TODO placeholder** — constant exported but not yet wired to any UI. A real $49 Payment Link needs to be created in Stripe Dashboard and pasted here. See `docs/pending-tasks.md:17`. |

### 2.3 Per-destination Stripe link infrastructure (in DB + admin)

This is a separate mechanism from the sentinel link: each destination can have its own `permit_alert_url` stored in the DB.

| File | Line | Exact text | Note |
|------|------|-----------|------|
| `src/pages/admin/AdminDestinationForm.tsx` | 225 | `placeholder="https://buy.stripe.com/..."` | Admin field to set per-destination Stripe link |
| `src/pages/DestinationDetail.tsx` | 304 | `const permitAlertUrl = affiliateLinks.permit_alert_url \|\| null` | Reads per-destination Stripe URL from DB |
| `src/pages/DestinationDetail.tsx` | 891–896 | Renders button with `href={permitAlertUrl}` | Stripe checkout trigger in booking sidebar (button label is dead product name — see Group 1.5) |
| `src/components/StickyMobileCTA.tsx` | 42–56 | Renders "Alerta de permisos" button with `href={permitAlertUrl}` | Stripe checkout trigger in sticky mobile bar |

**Decision needed:** whether the per-destination Stripe link mechanism (`permit_alert_url`) is retained (as a future per-park purchase flow) or removed entirely. Currently, any park that has a `permit_alert_url` in the DB will show a button labeled "Alerta de permisos" linking to Stripe.

---

## GROUP 3 — Current $49 / "Itinerario Completo" product (correct, keep)

These are the live, current product references that should be preserved. Listed for completeness.

| File | Line | Exact text | Note |
|------|------|-----------|------|
| `src/config/pricing.ts` | 15 | `solucionCompleta: 49` | Price constant — **source of truth** |
| `src/config/pricing.ts` | 22–38 | `products` array — one entry: `"Itinerario Completo Nomaderia"`, `priceUSD: 49`, `ctaType: "whatsapp"` | Product catalog — correct, single product |
| `src/config/pricing.ts` | 37 | `` `Hola Nomaderia 👋 Quiero contratar el Itinerario Completo ($${PRICING.solucionCompleta} USD).` `` | WhatsApp pre-fill message — correct |
| `src/pages/Servicios.tsx` | 83 | `` `Servicios — Itinerario Completo $${PRICING.solucionCompleta} USD \| Nomaderia` `` | Page `<title>` — correct |
| `src/pages/Servicios.tsx` | 84 | `` `Itinerario completo personalizado a $${PRICING.solucionCompleta} USD...` `` | Meta description — correct |
| `src/pages/Servicios.tsx` | 98–108 | JSON-LD `OfferCatalog` → iterates `products` array | Structured data — correct (derives from pricing.ts) |
| `src/pages/Servicios.tsx` | 209–252 | Single pricing card iterating `products` | UI — correct, one card rendered |
| `src/components/landing/PremiumItinerarySection.tsx` | 173–220 | Pricing card on homepage, iterates `products` | Homepage pricing UI — correct |
| `src/components/landing/SocialProof.tsx` | 23 | `` value: `$${PRICING.solucionCompleta}` `` | Stat card "Precio único, todo incluido" — correct |
| `src/pages/Index.tsx` | 78 | `` priceRange: `$${PRICING.solucionCompleta} USD` `` | JSON-LD Organization `priceRange` — correct |

---

## GROUP 4 — Pricing / plan UI components

### 4.1 Current (single-product) — correct as-is

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| Pricing card on `/servicios` | `src/pages/Servicios.tsx` | 200–253 | ✅ Single product, $49, WhatsApp CTA |
| Pricing card on homepage | `src/components/landing/PremiumItinerarySection.tsx` | 173–220 | ✅ Single product, $49, WhatsApp CTA |

Both iterate `products` from `src/config/pricing.ts`, so they automatically reflect the current catalog.

### 4.2 Needs cleanup — two-product / dead-product UI

| Component | File | Lines | Problem |
|-----------|------|-------|---------|
| Drip email pricing section | `supabase/functions/send-drip-emails/index.ts` | 166–200 | Two product cards shown: "Itinerario Personalizado ($29)" and "Solución Completa ($49)". Both product names and the $29 price are dead. |
| `/sentinel` pricing card | `src/pages/SentinelLanding.tsx` | 222–277 | Single card "Acceso Anticipado" showing `$49`. Price is correct, but the surrounding page is for the dead "Alerta de Permisos" product. |
| Booking sidebar button | `src/pages/DestinationDetail.tsx` | 884–897 | Button reads "Alerta de permisos — $49 USD" — dead product name with current price. Confusing. |
| Sticky mobile bar | `src/components/StickyMobileCTA.tsx` | 42–56 | "Alerta de permisos" button — dead product name. |
| Admin destination form label | `src/pages/admin/AdminDestinationForm.tsx` | 225 | Field label reads "URL Alerta de Permisos (Stripe)" — dead product name. |

---

## WhatsApp number reference map

The canonical number is `18588996802` defined in `src/lib/whatsapp.ts:1`.

| File | Line | How referenced | Correct? |
|------|------|---------------|---------|
| `src/lib/whatsapp.ts` | 1 | `WHATSAPP_NUMBER = "18588996802"` — source of truth | ✅ |
| `src/config/pricing.ts` | 36–38 | `buildWhatsAppLink(...)` via import | ✅ |
| `src/components/ArticleWhatsAppCTA.tsx` | 14 | `buildWhatsAppLink(message)` | ✅ |
| `src/components/landing/HeroSection.tsx` | 8 | `buildWhatsAppLink(...)` | ✅ |
| `src/components/landing/QuizSection.tsx` | 358 | `buildWhatsAppLink(...)` | ✅ |
| `src/components/StickyMobileCTA.tsx` | 14 | `buildWhatsAppLink(whatsappMessage)` | ✅ |
| `src/pages/DestinationDetail.tsx` | 887 | `buildWhatsAppLink(whatsappMessage)` | ✅ |
| `src/pages/Servicios.tsx` | 154 | `buildWhatsAppLink(...)` | ✅ |
| `src/pages/Index.tsx` | 40 | `buildWhatsAppLink(CTA_WHATSAPP_MESSAGE)` | ✅ |
| `src/pages/ClientItineraryView.tsx` | 162, 619 | `WHATSAPP_NUMBER` imported from `@/lib/whatsapp` | ✅ |
| `src/pages/Servicios.test.ts` | 15, 23 | Tests asserting `https://wa.me/18588996802?text=` | ✅ |
| `supabase/functions/send-drip-emails/index.ts` | 203 | `https://wa.me/18588996802?text=...` **hardcoded** in HTML email | ⚠️ Number is correct but message references dead product "Itinerario Personalizado" |
| `src/components/blog/ShareButtons.tsx` | 42 | `https://wa.me/?text=...` — no number, share link only | ✅ (not a business CTA) |

---

## Stale documentation (not code, no functional impact)

These files contain dead product references in narrative/doc context only. No customer faces them. Listed for completeness.

| File | Lines | Content | Action needed |
|------|-------|---------|--------------|
| `CLAUDE.md` | 42, 62–67, 74 | "Stripe live activo: Payment Link para 'Alerta de Permisos'"; product table still lists 3 products including $29; "$29 / $49 USD" in monetización | Update when cleaning code |
| `docs/claude-context.md` | 533–538 | Section 7.2 already flagged ⚠️ DESACTUALIZADO; still lists all 3 products at $29/$29/$49 | Update when cleaning code |
| `docs/decisions.md` | 59–60 | ADR-003 (status: "Reemplazada → ADR-012") lists $29 products | Historical ADR — do NOT delete; status is correctly marked Reemplazada |
| `docs/pending-tasks.md` | 17, 121–124 | Known tasks: create $49 Stripe link; clean Edge Functions | Active tasks — leave as-is |

---

## Summary table — dead strings in live code (the actual cleanup list)

| # | File | Line(s) | Dead content | Priority |
|---|------|---------|-------------|---------|
| 1 | `supabase/functions/send-drip-emails/index.ts` | 168–200 | Entire two-product pricing block: "Itinerario Personalizado", `$29 USD`, "Solución Completa", bundle copy | **HIGH** — sent to real users |
| 2 | `supabase/functions/send-quiz-results/index.ts` | 149, 156 | `<!-- CTA: Itinerario Personalizado -->`, `Desde $29 USD.` | **HIGH** — sent to real users |
| 3 | `src/pages/SentinelLanding.tsx` | 33–34, 37–39, 87–90, 235 | Stripe $29 link; page title/description; JSON-LD for dead product; $49 price under dead product | **HIGH** — live public page, live Stripe link |
| 4 | `src/pages/Gracias.tsx` | 36–37, 110, 120 | Post-Stripe-payment page for dead product; "Alerta de Permisos" heading | **HIGH** — live public page |
| 5 | `src/pages/DestinationDetail.tsx` | 894 | `Alerta de permisos — $49 USD` button label | Medium — confusing label but price is correct |
| 6 | `src/components/StickyMobileCTA.tsx` | 54 | `Alerta de permisos` button label | Medium — conditional, shown only when `permitAlertUrl` set |
| 7 | `src/pages/admin/AdminDestinationForm.tsx` | 225–226 | `"URL Alerta de Permisos (Stripe)"` field label | Low — admin only |
| 8 | `src/pages/admin/AdminSubscribers.tsx` | 26 | `sentinel: "Alerta de Permisos"` source label | Low — admin only |
| 9 | `src/config/pricing.ts` | 19 | `STRIPE_LINK_ITINERARIO_49 = "REEMPLAZAR_CON_LINK_DE_49_USD"` | Blocking — unfilled TODO for new Stripe link |
