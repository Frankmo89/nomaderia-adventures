# Nomaderia Adventures — Contexto para Agentes AI

> Este documento es el contexto canónico del proyecto. Léelo completo antes de hacer cualquier cambio al código.

---

## 1. ¿Qué es este proyecto?

**Nomaderia Adventures** es una plataforma web para viajeros activos hispanohablantes que quieren hacer trekking y aventura en el extranjero pero no saben por dónde empezar. El sitio combina:

- Guías de destinos de aventura con preparación física y gear recomendado
- Un blog de consejos de viaje y preparación
- Una calculadora de presupuesto interactiva
- Un quiz que recomienda destinos según perfil del viajero
- Panel de administración para gestionar todo el contenido

**Audiencia objetivo:** Adultos hispanohablantes de 25-45 años con nivel físico entre principiante y moderado que quieren hacer aventura sin ser expertos.

**Modelo de monetización:** Links de afiliados (vuelos, hoteles, seguros, equipo outdoor).

---

## 2. Stack Tecnológico (DEBES respetar este stack al proponer cambios)

```
Frontend:    React 18.3 + TypeScript 5.8
Build:       Vite 5.4 (plugin-react-swc)
Estilos:     Tailwind CSS 3.4 + shadcn/ui + Radix UI
Animaciones: Framer Motion 12
Routing:     React Router DOM 6
Backend:     Supabase (PostgreSQL + Auth + Storage)
Data:        TanStack React Query 5 (configurado en App.tsx, usado en todos los componentes via custom hooks)
Formularios: React Hook Form + Zod
Testing:     Vitest + Testing Library
```

**NO proponer:** Next.js, Vue, GraphQL, Redux, MUI/Ant Design, ni cambios de stack.

---

## 3. Estructura de Archivos Clave

```
src/
├── App.tsx                          → Router central — rutas públicas eager, admin + calculadora lazy
├── main.tsx                         → Entry point, providers globales
├── index.css                        → Variables CSS de tema, Tailwind base
├── pages/
│   ├── Index.tsx                    → Homepage (orquesta secciones landing)
│   ├── DestinationDetail.tsx        → /destinos/:slug
│   ├── GearListing.tsx              → /gear
│   ├── GearArticleDetail.tsx        → /gear/:slug
│   ├── BlogListing.tsx              → /blog
│   ├── BlogPostDetail.tsx           → /blog/:slug
│   ├── BudgetCalculator.tsx         → /calculadora  ← lazy loaded
│   ├── NotFound.tsx                 → 404
│   └── admin/                       ← lazy loaded (React.lazy + Suspense)
│       ├── AdminLayout.tsx          → Layout con sidebar + guard de auth
│       ├── AdminLogin.tsx           → /admin/login
│       ├── AdminDashboard.tsx       → /admin (índice)
│       ├── AdminDestinations.tsx    → CRUD lista destinos
│       ├── AdminDestinationForm.tsx → Crear/editar destino (dividido en GeneralFields, FaqFields, MarkdownFields, AffiliateFields)
│       ├── AdminGearArticles.tsx    → CRUD lista gear
│       ├── AdminGearArticleForm.tsx → Crear/editar gear
│       ├── AdminBlogPosts.tsx       → CRUD lista posts
│       ├── AdminBlogPostForm.tsx    → Crear/editar post
│       ├── AdminQuizResponses.tsx   → Ver respuestas quiz
│       └── AdminSubscribers.tsx    → Ver suscriptores
├── components/
│   ├── landing/
│   │   ├── Navbar.tsx               → Navegación principal (sticky, con scroll effect)
│   │   ├── HeroSection.tsx          → Hero con parallax (DOM directo via ref, sin re-renders)
│   │   ├── DidYouKnowSection.tsx    → Carrusel horizontal "¿Sabías que...?"
│   │   ├── QuizSection.tsx          → Quiz de 4 pasos (lógica en useQuiz, JSX en ResultCard + QuizResults)
│   │   ├── DestinationsCatalog.tsx  → Grid de destinos (usa useDestinations hook)
│   │   ├── GearPreview.tsx          → Preview de gear destacado (usa useFeaturedGearArticles hook)
│   │   ├── SocialProof.tsx          → Testimonios
│   │   ├── NewsletterSignup.tsx     → Formulario de email
│   │   └── Footer.tsx
│   ├── ui/                          → shadcn/ui — solo los componentes en uso (36 archivos, 12 no usados eliminados)
│   ├── ErrorBoundary.tsx            → Error boundary genérico para wrappear rutas
│   ├── LoadingSkeletons.tsx         → Skeleton loaders: DestinationDetailSkeleton, GearArticleDetailSkeleton, CardGridSkeleton
│   └── NavLink.tsx                  → Link con estado activo
├── hooks/
│   ├── use-destinations.ts          → useDestinations(), useDestinationBySlug(), useRelatedDestinations()
│   ├── use-gear-articles.ts         → useGearArticles(), useFeaturedGearArticles()
│   ├── use-blog-posts.ts            → useBlogPosts()
│   ├── use-quiz.ts                  → useQuiz() — lógica de estado y submit del quiz
│   ├── use-seo.ts                   → useCanonical() + useJsonLd() para SEO
│   ├── use-mobile.tsx               → Hook responsive (< 768px = mobile)
│   └── use-toast.ts                 → Hook para toasts
├── integrations/supabase/
│   ├── client.ts                    → Instancia única del cliente Supabase
│   └── types.ts                     → Tipos generados por Supabase CLI (NO editar manualmente)
└── lib/
    └── utils.ts                     → cn() = clsx + tailwind-merge
```

---

## 4. Base de Datos (Tablas Supabase)

### `destinations`
```
id              uuid PK
title           text
slug            text UNIQUE          → usado en URL /destinos/:slug
country         text
region          text
difficulty      text                 → "easy" | "moderate" | "challenging"
budget          text                 → rango USD string
season          text
hero_image_url  text
description     text                 → markdown
physical_prep   text                 → markdown
itinerary       text                 → markdown
gear_list       text                 → markdown
common_fears    jsonb                → [{question, answer}]
affiliate_links jsonb                → [{type, url, label}]
is_published    boolean              → false = borrador, true = visible en sitio
created_at      timestamptz
updated_at      timestamptz
```

### `gear_articles`
```
id                    uuid PK
title                 text
slug                  text UNIQUE
category              text            → "boots"|"poles"|"backpacks"|"photography"|"clothing"|"accessories"
hero_image_url        text
intro                 text            → markdown
recommended_products  jsonb           → [{name, price, pros[], cons[], affiliate_url, rating}]
is_published          boolean
created_at            timestamptz
updated_at            timestamptz
```

### `blog_posts`
```
id           uuid PK
title        text
slug         text UNIQUE
category     text           → "prep"|"mistakes"|"inspiration"|"tips"
hero_image_url text
excerpt      text
content      text           → markdown
author       text
is_published boolean
created_at   timestamptz
updated_at   timestamptz
```

### `quiz_responses`
```
id           uuid PK
fitness_level text
interest      text
trip_duration text
travel_style  text
email         text (nullable)
created_at    timestamptz
```

### `newsletter_subscribers`
```
id         uuid PK
email      text UNIQUE
source     text        → "newsletter" | "quiz" | etc.
created_at timestamptz
```

---

## 5. Patrones de Código que Debes Seguir

### Fetch de datos — PATRÓN ESTÁNDAR (TanStack Query via custom hooks)
```typescript
// TODOS los componentes usan custom hooks respaldados por TanStack Query
// Los hooks están en src/hooks/ — úsalos en lugar de hacer fetch directo

import { useDestinations } from "@/hooks/use-destinations";
import { useGearArticles } from "@/hooks/use-gear-articles";
import { useBlogPosts } from "@/hooks/use-blog-posts";

const { data: destinations = [], isLoading, error } = useDestinations();
```

El `QueryClient` en `App.tsx` está configurado con:
- `staleTime: 1000 * 60 * 5` — cache de 5 minutos
- `retry: 1` — 1 reintento en error
- `refetchOnWindowFocus: false` — no refetch al cambiar de pestaña

### Fetch de datos — si necesitas una query nueva sin hook existente
```typescript
// Crear un hook custom en src/hooks/ siguiendo el mismo patrón
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const { data, isLoading, error } = useQuery({
  queryKey: ["mi_tabla"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("mi_tabla")
      .select("*")
      .eq("is_published", true);
    if (error) throw error;
    return data;
  },
});
```

### Hooks de datos disponibles
```typescript
// src/hooks/use-destinations.ts
useDestinations()               // lista completa de destinos publicados
useDestinationBySlug(slug)      // un destino por slug
useRelatedDestinations(diff, id) // destinos relacionados por dificultad

// src/hooks/use-gear-articles.ts
useGearArticles()               // lista completa de gear publicado
useFeaturedGearArticles()       // solo los 3 featured (para homepage)

// src/hooks/use-blog-posts.ts
useBlogPosts()                  // lista completa de posts publicados

// src/hooks/use-quiz.ts
useQuiz(totalSteps)             // toda la lógica de estado del quiz
```

### Formularios
```typescript
// React Hook Form + Zod (patrón estándar del proyecto)
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

const form = useForm<FormData>({ resolver: zodResolver(schema) });
```

### Imports de alias
```typescript
// SIEMPRE usar @/ para imports internos
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
```

### Animaciones (Framer Motion)
```typescript
// Patrón estándar para entrance animations en secciones
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.6 }}
>
```

### Estilos
```typescript
// cn() para clases condicionales
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  condition && "conditional-class",
  variant === "primary" && "primary-classes"
)} />
```

---

## 6. Design System — Tokens de Colores

```css
/* Variables CSS definidas en src/index.css */
--primary:          17 75% 56%   /* Sunset Orange #E86C3A */
--secondary:        145 25% 39%  /* Trail Green #4A7C59 */
--accent:           205 32% 57%  /* Sky Blue #6BA3BE */
--background:       20 14% 10%   /* Charcoal #1C1917 */
--foreground:       35 32% 94%   /* Light Sand #F5F0EB */
```

Clases Tailwind personalizadas disponibles:
- `bg-primary`, `text-primary`, `border-primary`
- `bg-secondary`, `text-secondary`, `border-secondary`
- `bg-accent`, `text-accent`
- `bg-background`, `text-foreground`
- También: `bg-sand`, `bg-forest`, `bg-sunset`, `bg-trail`, `bg-sky`, `bg-charcoal`

Tipografías:
- `font-serif` → Playfair Display (headings, títulos)
- `font-sans` → Inter (body, UI)

---

## 7. Rutas y Navegación

```
GET /                         → Index.tsx (homepage)
GET /destinos/:slug           → DestinationDetail.tsx
GET /gear                     → GearListing.tsx
GET /gear/:slug               → GearArticleDetail.tsx
GET /blog                     → BlogListing.tsx
GET /blog/:slug               → BlogPostDetail.tsx
GET /calculadora              → BudgetCalculator.tsx
GET /admin/login              → AdminLogin.tsx (pública)
GET /admin/*                  → AdminLayout.tsx (protegida con Supabase Auth)
GET /*                        → NotFound.tsx
```

**Navegación programática:**
```typescript
import { useNavigate } from "react-router-dom";
const navigate = useNavigate();
navigate("/destinos/camino-inca");

// Links declarativos
import { Link } from "react-router-dom";
<Link to="/destinos/camino-inca">Ver destino</Link>
```

---

## 8. Autenticación (Admin)

- Supabase Auth con localStorage (persistencia de sesión activada)
- `AdminLayout.tsx` verifica la sesión en onMount y redirige a `/admin/login` si no hay usuario
- `AdminLogin.tsx` usa `supabase.auth.signInWithPassword()`
- NO hay auth para usuarios públicos (solo admin interno)

```typescript
// Verificar sesión en AdminLayout
const { data: { session } } = await supabase.auth.getSession();
if (!session) navigate("/admin/login");
```

---

## 9. SEO

El proyecto usa hooks custom en `src/hooks/use-seo.ts`:

```typescript
// Canonical URL
useCanonical(); // Auto-detecta la URL actual

// JSON-LD Structured Data
useJsonLd({
  "@context": "https://schema.org",
  "@type": "Article",
  "name": "título",
  "description": "descripción"
});
```

- El `index.html` tiene meta tags OG y Twitter Card base
- Cada página de destino/blog/gear debe llamar a `useJsonLd()` con datos específicos

---

## 10. Variables de Entorno

```env
VITE_SUPABASE_URL=           # URL del proyecto Supabase
VITE_SUPABASE_PUBLISHABLE_KEY=  # Anon key de Supabase (pública, prefijo VITE_)
```

Acceso en código: `import.meta.env.VITE_SUPABASE_URL`

**Importante:** Todas las variables de entorno de Vite deben tener prefijo `VITE_` para ser accesibles en el cliente.

---

## 11. Convenciones de Código

### Nombrado
- Componentes React: `PascalCase` (ej: `DestinationCard.tsx`)
- Hooks custom: `camelCase` con prefijo `use-` en nombre de archivo, `use` en función (ej: `use-seo.ts`, `useSeo()`)
- Funciones helper: `camelCase`
- Constantes: `SCREAMING_SNAKE_CASE` solo para valores verdaderamente constantes
- Archivos de página: `PascalCase.tsx`
- Archivos de componente: `PascalCase.tsx`

### TypeScript
- El proyecto tiene `strictNullChecks: true` y `noImplicitAny: false` en `tsconfig.app.json`
- Para código nuevo, añadir tipos explícitos aunque no sea estrictamente requerido
- Los tipos de Supabase están en `src/integrations/supabase/types.ts` (no editar)

### Componentes
- Functional components con arrow functions o function declarations (ambos están en el codebase)
- Props con interfaces inline para componentes pequeños, interfaces nombradas para reutilizables
- `React.FC<Props>` está en desuso en React 18, preferir tipo explícito del retorno o no tipificar

---

## 12. Cosas que NO Debes Hacer

- NO editar archivos en `src/components/ui/` — son generados por shadcn/ui CLI. Si necesitas eliminar uno, primero verifica que no tenga imports en el codebase
- NO reinstalar paquetes Radix UI que ya fueron eliminados — se auditaron y se quitaron 12 sin usar: `react-aspect-ratio`, `react-avatar`, `react-collapsible`, `react-context-menu`, `react-hover-card`, `react-menubar`, `react-navigation-menu`, `react-progress`, `react-radio-group`, `react-scroll-area`, `react-slider`, `react-toggle-group`
- NO editar `src/integrations/supabase/types.ts` manualmente — regenerar con Supabase CLI
- NO crear archivos `.env` con secrets en el repo
- NO romper el patrón de rutas existente en `App.tsx` sin actualizar todos los links
- NO usar `any` en código nuevo
- NO crear componentes en `src/pages/` — solo páginas van ahí, componentes van en `src/components/`
- NO instalar librerías de animación adicionales — Framer Motion ya cubre todo
- NO instalar librerías UI adicionales — shadcn/ui + Radix ya cubre todo
- NO hacer fetch directo con `useEffect + useState` — usar los custom hooks de `src/hooks/` o crear uno nuevo con TanStack Query

---

## 13. Cómo Agregar Nuevas Funcionalidades

### Nueva página pública
1. Crear `src/pages/NuevaPagina.tsx`
2. Agregar ruta en `src/App.tsx`
3. Agregar link en `src/components/landing/Navbar.tsx` y `Footer.tsx`

### Nueva tabla en Supabase
1. Crear la tabla en el dashboard de Supabase
2. Regenerar tipos: `npx supabase gen types typescript --project-id TU_ID > src/integrations/supabase/types.ts`
3. Usar el cliente en componentes via `supabase.from("nueva_tabla")`

### Nueva sección en homepage
1. Crear componente en `src/components/landing/NuevaSeccion.tsx`
2. Importar e insertar en `src/pages/Index.tsx` en la posición deseada

### Nuevo artículo de gear / destino / blog
- Hacerlo desde el panel admin en `/admin`

---

## 14. Comandos Útiles de Desarrollo

```sh
npm run dev           # Dev server en http://localhost:8080
npm run build         # Build de producción (output: dist/)
npm run lint          # Verificar errores ESLint
npm run test          # Tests Vitest (una vez)
npm run test:watch    # Tests Vitest (watch mode)
```

---

## 15. Contexto de Negocio para Decisiones de Diseño

- El usuario llega principalmente por SEO (Google) buscando guías de trekking en español
- El funnel es: Landing → Quiz → Destino → Links de afiliados
- El contenido principal son los markdown fields de cada destino (itinerario, prep física, gear)
- Los admins son el equipo de Nomaderia (no hay usuarios públicos registrados)
- Mobile es prioritario — la mayoría del tráfico es móvil
- El sitio es dark mode nativo (no hay toggle light/dark implementado)

---

*Última actualización: Febrero 2026*
*Versión: 1.0*
