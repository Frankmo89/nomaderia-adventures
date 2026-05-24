# Nomaderia Adventures — Contexto para Agentes AI

> Léelo completo antes de hacer cualquier cambio. Para detalles específicos, consulta los archivos en `docs/`.

## Qué es

Plataforma web en español para hispanos residentes en EE. UU. (25-45 años), principiantes en aventura outdoor, mercado principal: SoCal/San Diego. Combina guías de destinos, blog, quiz interactivo, calculadora de presupuesto e itinerarios premium de pago.

**Monetización:** Travelpayouts (vuelos/hoteles/seguros), Amazon Associates (tag: `nomaderia-20`), alertas de permisos en parques nacionales (Stripe), itinerarios premium ($29 USD, agente TAP certificado).

**Funnel principal:** SEO → Landing → Quiz → Destino → Affiliate links / Itinerario premium.

## Stack (NO proponer cambios de stack)

```
Frontend:    React 18.3 + TypeScript 5.8
Build:       Vite 5.4 (plugin-react-swc)
Estilos:     Tailwind CSS 3.4 + shadcn/ui + Radix UI
Animaciones: Framer Motion 12
Routing:     React Router DOM 6
Backend:     Supabase (PostgreSQL + Auth + Storage)
Data:        TanStack React Query 5
Formularios: React Hook Form + Zod
Testing:     Vitest + Testing Library
```

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
│   ├── SentinelLanding.tsx   # /sentinel (alerta permisos Yosemite, dark variant)
│   ├── Servicios.tsx         # /servicios (productos y precios)
│   ├── SobreNosotros.tsx     # /sobre-nosotros (about + credencial TAP)
│   ├── PrivacyPolicy.tsx     # /privacidad
│   ├── TermsAndConditions.tsx # /terminos
│   ├── Gracias.tsx           # /gracias (post-pago Stripe redirect)
│   └── admin/                # Panel protegido (Supabase Auth + rol admin)
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
│   └── whatsapp.ts           # buildWhatsAppUrl() — URL centralizada de WhatsApp
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
/sentinel            → SentinelLanding.tsx (alerta permisos Yosemite)
/admin/*             → AdminLayout (protegido)
```

## Patrones Obligatorios

**Fetch de datos (público):** Siempre via custom hooks en `src/hooks/` con TanStack Query. NO usar `useEffect + fetch` en componentes públicos.

**Fetch de datos (admin):** `useEffect + useState` directo con Supabase client. Válido porque no necesita caching.

**Imports:** Siempre usar alias `@/` → `import { Button } from "@/components/ui/button"`

**Animaciones:** Framer Motion con patrón `initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}`

**Formularios:** React Hook Form + Zod siempre.

**Clases condicionales:** `cn()` de `@/lib/utils` siempre.

**SEO:** Todas las páginas públicas deben llamar `usePageMeta()` de `@/hooks/use-seo`.

## Design System

| Token | Hex | Tailwind |
|-------|-----|----------|
| Primary (Sunset Amber) | #D97706 | `bg-primary`, `text-primary` |
| Secondary (Forest Green) | #166534 | `bg-secondary`, `text-secondary` |
| Accent (Light Warm Gray) | #E5E7EB | `bg-accent`, `text-accent` |
| Background (Off-White) | #FAFAFA | `bg-background` |
| Foreground (Charcoal) | #1C1917 | `text-foreground` |

Tipografías: `font-serif` → Playfair Display (headings, oscuro sobre fondo claro) · `font-sans` → Inter (body/UI)

Light theme editorial (sin toggle). Mobile-first. Diseño luminoso, limpio y enfocado en fotografía.

> **Excepción:** `SentinelLanding` usa dark variant (`bg-[#1C1917]`) por ser página de conversión. El resto del sitio usa light theme editorial (`bg-background #FAFAFA`).

## Reglas Críticas (NO violar)

- NO editar `src/components/ui/` — generados por shadcn/ui
- NO editar `src/integrations/supabase/types.ts` — regenerar: `npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts`
- NO instalar librerías UI/animación adicionales (shadcn + Framer Motion cubren todo)
- NO usar `any` en código nuevo
- NO crear componentes en `src/pages/` — solo páginas ahí
- NO hacer fetch directo en componentes públicos — usar hooks de `src/hooks/`

## Comandos

```sh
npm run dev           # Dev server → http://localhost:8080
npm run build         # Build producción → dist/
npm run lint          # ESLint
npm run test          # Vitest
node node_modules/typescript/bin/tsc --noEmit  # Type check (0 errores esperados)
```

## Variables de Entorno

```env
VITE_SUPABASE_URL=               # https://vrixiuvnhvqafmxlcyex.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=   # Publishable key (sb_publishable_*)
VITE_SUPABASE_PROJECT_ID=        # vrixiuvnhvqafmxlcyex
VITE_SITE_URL=                   # https://nomaderia.com
VITE_WHATSAPP_NUMBER=            # 18588996802 (hardcoded fallback en whatsapp.ts)
VITE_GA_MEASUREMENT_ID=          # Google Analytics 4 ID
VITE_SENTRY_DSN=                 # Sentry error tracking (opcional)
VITE_STRIPE_SENTINEL_URL=        # https://buy.stripe.com/... (Stripe Payment Link)
```

## Contacto y Redes

Email: nomaderia.travel@gmail.com · Instagram/TikTok: @nomaderia.mx · Facebook: Nomaderia

## Documentación Extendida

| Archivo | Contenido |
|---------|-----------|
| `docs/supabase-schema.md` | Tablas, columnas, tipos, RLS, auth |
| `docs/content-strategy.md` | Monetización, affiliate, SEO, blog, quiz |
| `docs/admin-patterns.md` | Patrones del panel admin, CRUD, convenciones |
| `docs/pending-tasks.md` | Tareas del dueño, changelog, próximos pasos |
