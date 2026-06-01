# Nomaderia Adventures — Contexto para Agentes AI

> **Entrypoint del proyecto.** Léelo completo antes de tocar nada. Para detalle
> profundo, consulta `docs/`. Este archivo es la fuente de verdad del *estado
> actual*; el histórico vive en `docs/pending-tasks.md` y las decisiones duras en
> `docs/decisions.md`.

---

## ⛔ PROTOCOLO DE AGENTE (REGLAS INQUEBRANTABLES)

Estas reglas existen para evitar el **AI Drift**: que un agente reescriba
arquitectura ya decidida, duplique archivos o rompa convenciones. No son
opcionales.

1. **LECTURA OBLIGATORIA.** Antes de proponer soluciones o escribir código, lee
   en silencio: `CLAUDE.md` → `docs/claude-context.md` → `docs/decisions.md` →
   `docs/pending-tasks.md`. Si una propuesta contradice una decisión en
   `decisions.md`, **detente y avísalo** en vez de implementarla.
2. **EJECUCIÓN ATÓMICA.** Un cambio lógico = un commit. No mezcles tareas
   distintas en el mismo commit ni en el mismo PR.
3. **ACTUALIZACIÓN DE MEMORIA.** Al terminar una tarea, actualiza
   `docs/pending-tasks.md`. Si la arquitectura cambió, actualiza también
   `CLAUDE.md` o `docs/claude-context.md`.
4. **MEMORIA TÉCNICA.** Si resolviste un bug no obvio, cambiaste una convención
   o tomaste una decisión de arquitectura/negocio, **documenta la lección en
   `docs/decisions.md`** de forma concisa (una entrada ADR por decisión).
5. **SEGURIDAD.** Nunca toques `.env`. Nunca pongas credenciales de Supabase,
   Resend ni Stripe en el código. Secretos solo vía Supabase Dashboard / CLI.
6. **VERIFICACIÓN ANTES DE PR.** `node node_modules/typescript/bin/tsc --noEmit`
   **y** `npm run build` deben pasar. Reporta hallazgos de lint/test
   preexistentes sin "arreglarlos" de paso.
7. **NO DUPLICAR DOCS.** La memoria ya está estructurada (`CLAUDE.md` raíz +
   `docs/`). No crees `clauderules.md`, `pending_tasks.md` en raíz, ni variantes.
   Edita los archivos existentes.

---

## 📍 Estado Actual (Mayo 2026)

- **Sitio en producción:** https://nomaderia.com — Hosting: **Cloudflare Pages**.
- **Stripe live activo:** Payment Link para "Alerta de Permisos" funcionando.
- **Primer lead real capturado** vía `/sentinel` (SentinelLanding). El funnel de
  conversión ya produjo señal real → priorizar lo que reduce fricción a la venta.
- **Modelo de negocio congelado** en 2 productos + 1 bundle, **USD únicamente**
  (ver `docs/decisions.md` ADR-003). El sistema viejo
  Escapada/Aventura/Expedición y todos los precios MXN están **ELIMINADOS**.

---

## Qué es

Plataforma web en español para **hispanos residentes en EE. UU.** (25-45 años),
principiantes en aventura outdoor. Mercado primario: **SoCal / San Diego**.
Combina guías de destinos, blog, quiz interactivo, calculadora de presupuesto y
servicios de pago. Compite contra AllTrails/Chimani en un solo eje:
**idioma + audiencia + honestidad con principiantes**.

**Funnel principal:** SEO / Ads → Landing → Quiz (captura email) → Destino →
Affiliate links / Servicio de pago. Canal de cierre: **WhatsApp**, no el sitio.

## Productos y Precios (USD únicamente)

| Producto | Precio | Canal de cobro |
|----------|--------|----------------|
| Alerta de Permisos | $29 USD | Stripe Payment Link |
| Itinerario Personalizado | $29 USD | WhatsApp |
| Solución Completa (bundle: alerta + itinerario) | $49 USD | WhatsApp |

Fuente de verdad en código: `src/config/pricing.ts`.

## Monetización (4 vías)

1. **Stripe directo** — $29 / $49 USD.
2. **Viator 8%** — habilitado por certificación TAP (The Travel Institute).
3. **Amazon Associates** — tag `nomaderia-20` (en product cards de gear).
4. **Travelpayouts** — Klook, Tiqets, Localrent, Welcome Pickups.

## Stack (NO proponer cambios de stack — ver ADR-001)

```
Frontend:    React 18.3 + TypeScript 5.8
Build:       Vite 5.4 (plugin-react-swc)
Estilos:     Tailwind CSS 3.4 + shadcn/ui + Radix UI
Animaciones: Framer Motion 12
Routing:     React Router DOM 6
Backend:     Supabase (PostgreSQL + Auth + Storage)  · ID: vrixiuvnhvqafmxlcyex
Data:        TanStack React Query 5
Formularios: React Hook Form + Zod
Email:       Resend (Edge Functions)
Pagos:       Stripe Payment Links
Testing:     Vitest + Testing Library
Hosting:     Cloudflare Pages
```

> **Prohibido:** Next.js, Vue, Redux o cualquier cambio de framework/state mgmt.
> shadcn + Framer Motion + React Query cubren todo. (ADR-001)

## Estructura del Proyecto

```
src/
├── pages/                    # Una página por ruta
│   ├── Index.tsx             # Homepage (hero, quiz, destinos, gear, newsletter)
│   ├── DestinationDetail.tsx # /destinos/:slug (tabs: ¿Puedo?, Prep, Itinerario, Gear, Reserva)
│   ├── GearListing.tsx       # /gear (filtro por categoría)
│   ├── GearArticleDetail.tsx # /gear/:slug (markdown + product cards con affiliate)
│   ├── BlogListing.tsx       # /blog
│   ├── BlogPostDetail.tsx    # /blog/:slug
│   ├── BudgetCalculator.tsx  # /calculadora
│   ├── SentinelLanding.tsx   # /sentinel (alerta permisos Yosemite, DARK variant)
│   ├── Servicios.tsx         # /servicios (productos y precios)
│   ├── SobreNosotros.tsx     # /sobre-nosotros (about + credencial TAP)
│   ├── PrivacyPolicy.tsx     # /privacidad
│   ├── TermsAndConditions.tsx # /terminos
│   ├── Gracias.tsx           # /gracias (post-pago Stripe redirect)
│   └── admin/                # Panel protegido (Supabase Auth + rol admin, DARK)
├── components/
│   ├── landing/              # Secciones de homepage (Navbar, Hero, Quiz, Footer, etc.)
│   └── ui/                   # shadcn/ui — NO editar manualmente
├── config/
│   ├── pricing.ts            # Productos y precios (2 products + bundle, USD only)
│   └── assets.ts             # Brand assets URLs
├── hooks/                    # Custom hooks con TanStack Query
│   ├── use-destinations.ts   # useDestinations(), useDestinationBySlug(), useRelatedDestinations()
│   ├── use-gear-articles.ts  # useGearArticles(), useFeaturedGearArticles()
│   ├── use-blog-posts.ts     # useBlogPosts()
│   ├── use-quiz.ts           # useQuiz() — estado + submit del quiz
│   ├── use-seo.ts            # useCanonical() + useJsonLd() + usePageMeta()
│   ├── use-stats.ts          # useQuizCount(), useDestinationsCount() — conteos reales
│   └── use-media.ts          # useMediaSlider() + upload/toggle/delete helpers
├── integrations/supabase/
│   ├── client.ts             # Cliente Supabase (instancia única)
│   └── types.ts              # Tipos auto-generados (NO editar — regenerar con CLI)
├── lib/
│   ├── utils.ts              # cn() = clsx + tailwind-merge
│   ├── lazy-with-retry.ts    # lazyWithRetry() — React.lazy con retry + backoff
│   └── whatsapp.ts           # buildWhatsAppLink() — URL centralizada de WhatsApp
└── supabase/functions/       # Edge Functions
    ├── send-quiz-email/
    ├── send-welcome-email/
    ├── send-drip-emails/
    └── send-quiz-results/
```

## Rutas

```
/                    → Index.tsx           /destinos/:slug  → DestinationDetail.tsx
/gear                → GearListing.tsx     /gear/:slug      → GearArticleDetail.tsx
/blog                → BlogListing.tsx     /blog/:slug      → BlogPostDetail.tsx
/calculadora         → BudgetCalculator    /servicios       → Servicios.tsx
/sobre-nosotros      → SobreNosotros.tsx   /privacidad      → PrivacyPolicy.tsx
/terminos            → TermsAndConditions  /gracias         → Gracias.tsx
/sentinel            → SentinelLanding.tsx (alerta permisos Yosemite, dark)
/admin/*             → AdminLayout (protegido, dark)
```

## Patrones Obligatorios

- **Fetch público:** siempre vía custom hooks en `src/hooks/` con TanStack Query.
  NO `useEffect + fetch` en componentes públicos. (ADR-007)
- **Fetch admin:** `useEffect + useState` directo con el cliente Supabase. Válido
  porque no necesita caching. (ADR-007)
- **Imports:** alias `@/` siempre → `import { Button } from "@/components/ui/button"`.
- **Animaciones:** Framer Motion con
  `initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}`.
- **Formularios:** React Hook Form + Zod siempre.
- **Clases condicionales:** `cn()` de `@/lib/utils` siempre.
- **WhatsApp:** todo enlace pasa por `buildWhatsAppLink(message)` de
  `@/lib/whatsapp` (número `18588996802` hardcodeado como fallback).
- **SEO:** toda página pública llama `usePageMeta()` de `@/hooks/use-seo`.

## Design System

Tema **CLARO** editorial (sin toggle). Mobile-first. Luminoso, limpio, enfocado
en fotografía.

| Token | Hex | Tailwind |
|-------|-----|----------|
| Primary (Sunset Amber) | #D97706 | `bg-primary`, `text-primary` |
| Secondary (Forest Green) | #166534 | `bg-secondary`, `text-secondary` |
| Accent (Light Warm Gray) | #E5E7EB | `bg-accent`, `text-accent` |
| Background (Off-White) | #FAFAFA | `bg-background` |
| Foreground (Charcoal) | #1C1917 | `text-foreground` |

Tipografías: `font-serif` → **Playfair Display** (headings) · `font-sans` →
**Inter** (body/UI).

> **Excepciones dark:** `SentinelLanding` (`/sentinel`) y el **admin sidebar**
> usan variante oscura (`#1C1917`) por ser superficies de conversión / panel
> interno. Todo lo demás es light theme. (ADR-006)

## Reglas Críticas (NO violar)

- NO editar `src/components/ui/` — generados por shadcn/ui.
- NO editar `src/integrations/supabase/types.ts` a mano — regenerar:
  `npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts`
- NO instalar librerías UI/animación adicionales.
- NO usar `any` en código nuevo.
- NO crear componentes en `src/pages/` — solo páginas ahí.
- NO hacer fetch directo en componentes públicos — usar hooks de `src/hooks/`.
- NO cambiar lógica de auth (`supabase.auth.*`, RPC `has_role`) ni queries de
  Supabase sin instrucción explícita.
- NO reintroducir precios MXN ni el sistema Escapada/Aventura/Expedición. (ADR-003)

## Comandos

```sh
npm run dev           # Dev server → http://localhost:8080
npm run build         # Build producción → dist/   (debe pasar antes de PR)
npm run lint          # ESLint
npm run test          # Vitest
node node_modules/typescript/bin/tsc --noEmit  # Type check — debe pasar antes de PR
```

## Variables de Entorno

```env
VITE_SUPABASE_URL=               # https://vrixiuvnhvqafmxlcyex.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=   # Publishable key (sb_publishable_*)
VITE_SUPABASE_PROJECT_ID=        # vrixiuvnhvqafmxlcyex
VITE_SITE_URL=                   # https://nomaderia.com
VITE_WHATSAPP_NUMBER=            # 18588996802 (fallback hardcodeado en whatsapp.ts)
VITE_GA_MEASUREMENT_ID=          # GA4 — G-CK9STWJDFM
VITE_SENTRY_DSN=                 # Sentry error tracking (opcional)
VITE_STRIPE_SENTINEL_URL=        # https://buy.stripe.com/00w9AT9bA2fR8I4bayaAw00
```

## Contacto y Redes

Email: nomaderia.travel@gmail.com · Instagram/TikTok: @nomaderia.mx ·
Facebook: Nomaderia · WhatsApp: 18588996802

## Documentación Extendida

| Archivo | Contenido |
|---------|-----------|
| `docs/claude-context.md` | Auditoría completa de arquitectura (10 secciones, snapshot) |
| `docs/decisions.md` | **Registro de decisiones y lecciones de IA (ADRs)** |
| `docs/seccion-9-concierge-ia.md` | **Concierge IA con RAG — PARQUEADO** (leer antes de tocar IA/embeddings) |
| `docs/pending-tasks.md` | Pendientes (humanos + código) y changelog |
| `docs/supabase-schema.md` | Tablas, columnas, tipos, RLS, auth |
| `docs/content-strategy.md` | Monetización, affiliate, SEO, blog, quiz |
| `docs/admin-patterns.md` | Patrones del panel admin, CRUD, convenciones |
