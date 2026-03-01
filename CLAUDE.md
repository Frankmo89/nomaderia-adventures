# Nomaderia Adventures — Contexto para Agentes AI

> Léelo completo antes de hacer cualquier cambio. Para detalles específicos, consulta los archivos en `docs/`.

## Qué es

Plataforma web en español para hispanohablantes principiantes en aventura outdoor (25-45 años). Combina guías de destinos, blog, quiz interactivo, calculadora de presupuesto e itinerarios premium de pago.

**Monetización:** Travelpayouts (vuelos/hoteles/seguros), Amazon Associates (tag: `nomaderia-20`), itinerarios personalizados (agente de viajes certificada TAP).

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
│   └── admin/                # Panel protegido (Supabase Auth + rol admin)
├── components/
│   ├── landing/              # Secciones de homepage (Navbar, Hero, Quiz, Footer, etc.)
│   └── ui/                   # shadcn/ui — NO editar manualmente
├── hooks/                    # Custom hooks con TanStack Query
│   ├── use-destinations.ts   # useDestinations(), useDestinationBySlug(), useRelatedDestinations()
│   ├── use-gear-articles.ts  # useGearArticles(), useFeaturedGearArticles()
│   ├── use-blog-posts.ts     # useBlogPosts()
│   ├── use-quiz.ts           # useQuiz() — estado + submit del quiz
│   └── use-seo.ts            # useCanonical() + useJsonLd()
├── integrations/supabase/
│   ├── client.ts             # Cliente Supabase (instancia única)
│   └── types.ts              # Tipos auto-generados (NO editar — regenerar con CLI)
└── lib/
    ├── utils.ts              # cn() = clsx + tailwind-merge
    └── lazy-with-retry.ts    # lazyWithRetry() — React.lazy con retry + backoff
```

## Rutas

```
/                    → Index.tsx          /destinos/:slug  → DestinationDetail.tsx
/gear                → GearListing.tsx    /gear/:slug      → GearArticleDetail.tsx
/blog                → BlogListing.tsx    /blog/:slug      → BlogPostDetail.tsx
/calculadora         → BudgetCalculator   /servicios       → Servicios.tsx
/sobre-nosotros      → SobreNosotros.tsx  /privacidad      → PrivacyPolicy.tsx
/admin/*             → AdminLayout (protegido)
```

## Patrones Obligatorios

**Fetch de datos (público):** Siempre via custom hooks en `src/hooks/` con TanStack Query. NO usar `useEffect + fetch` en componentes públicos.

**Fetch de datos (admin):** `useEffect + useState` directo con Supabase client. Válido porque no necesita caching.

**Imports:** Siempre usar alias `@/` → `import { Button } from "@/components/ui/button"`

**Animaciones:** Framer Motion con patrón `initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}`

**Formularios:** React Hook Form + Zod siempre.

**Clases condicionales:** `cn()` de `@/lib/utils` siempre.

## Design System

| Token | Hex | Tailwind |
|-------|-----|----------|
| Primary (Sunset Orange) | #E86C3A | `bg-primary`, `text-primary` |
| Secondary (Trail Green) | #4A7C59 | `bg-secondary`, `text-secondary` |
| Accent (Sky Blue) | #6BA3BE | `bg-accent`, `text-accent` |
| Background (Charcoal) | #1C1917 | `bg-background` |
| Foreground (Light Sand) | #F5F0EB | `text-foreground` |

Tipografías: `font-serif` → Playfair Display (headings) · `font-sans` → Inter (body/UI)

Dark mode nativo (sin toggle). Mobile-first.

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
