# Nomaderia Adventures — Contexto para Agentes AI

> Este documento es el contexto canónico del proyecto. Léelo completo antes de hacer cualquier cambio al código.

---

## 1. ¿Qué es este proyecto?

**Nomaderia Adventures** es una plataforma web para viajeros activos hispanohablantes que quieren hacer trekking y aventura en el extranjero pero no saben por dónde empezar. El sitio combina:

- Guías de destinos de aventura con preparación física y gear recomendado
- Un blog de consejos de viaje y preparación
- Una calculadora de presupuesto interactiva
- Un quiz que recomienda destinos según perfil del viajero
- **Itinerarios personalizados de pago** — el usuario solicita un itinerario a medida vía formulario (`itinerary_requests`)
- Panel de administración para gestionar todo el contenido

**Audiencia objetivo:** Adultos hispanohablantes de 25-45 años con nivel físico entre principiante y moderado que quieren hacer aventura sin ser expertos.

**Modelo de monetización:** Links de afiliados (vuelos, hoteles, tours, entradas, renta de autos, transfers, seguros, equipo outdoor). Programas activos: Klook, Tiqets, Localrent, Welcome Pickups (todos vía Travelpayouts) y Amazon Associates (`tag: nomaderia-20`).

---

## 2. Stack Tecnológico (DEBES respetar este stack al proponer cambios)

```
Frontend:    React 18.3 + TypeScript 5.8
Build:       Vite 5.4 (plugin-react-swc)
Estilos:     Tailwind CSS 3.4 + shadcn/ui + Radix UI
Animaciones: Framer Motion 12
Routing:     React Router DOM 6
SEO:         react-helmet-async (HelmetProvider en App.tsx)
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
├── App.tsx                          → Router central + HelmetProvider — rutas públicas eager, admin + calculadora lazy
├── main.tsx                         → Entry point, providers globales
├── index.css                        → Variables CSS de tema, Tailwind base
├── pages/
│   ├── Index.tsx                    → Homepage (orquesta secciones landing)
│   ├── DestinationDetail.tsx        → /destinos/:slug — SEOHead, hero carrusel Embla, tabs con markdown, galería + lightbox, ShareButtons
│   ├── GearListing.tsx              → /gear
│   ├── GearArticleDetail.tsx        → /gear/:slug — SEOHead, ShareButtons
│   ├── BlogListing.tsx              → /blog — tabs por categoría (9), FeaturedBlogPost hero, reading time badges
│   ├── BlogPostDetail.tsx           → /blog/:slug — SEOHead, hero con reading time, ShareButtons
│   ├── BudgetCalculator.tsx         → /calculadora  ← lazy loaded
│   ├── PrivacyPolicy.tsx            → /privacidad (Política de Privacidad LFPDPPP)
│   ├── SobreNosotros.tsx            → /sobre-nosotros (página Sobre Nosotros + credencial agente de viajes)
│   ├── NotFound.tsx                 → 404
│   └── admin/                       ← lazy loaded (React.lazy + Suspense)
│       ├── AdminLayout.tsx          → Layout con sidebar + guard de auth
│       ├── AdminLogin.tsx           → /admin/login
│       ├── AdminDashboard.tsx       → /admin (índice)
│       ├── AdminDestinations.tsx    → CRUD lista destinos
│       ├── AdminDestinationForm.tsx → Crear/editar destino (GeneralFields con ImageUpload hero + gallery_images, FaqFields, MarkdownFields, AffiliateFields)
│       ├── AdminGearArticles.tsx    → CRUD lista gear
│       ├── AdminGearArticleForm.tsx → Crear/editar gear
│       ├── AdminBlogPosts.tsx       → CRUD lista posts
│       ├── AdminBlogPostForm.tsx    → Crear/editar post (ImageUpload hero, Select categoría, tags, reading_time_min, meta_description)
│       ├── AdminQuizResponses.tsx   → Ver respuestas quiz
│       ├── AdminSubscribers.tsx    → Ver suscriptores
│       └── AdminItineraryRequests.tsx → Ver solicitudes de itinerario personalizado
├── components/
│   ├── landing/
│   │   ├── Navbar.tsx               → Navegación principal (sticky, con scroll effect)
│   │   ├── HeroSection.tsx          → Hero con parallax (DOM directo via ref, sin re-renders)
│   │   ├── DidYouKnowSection.tsx    → Carrusel horizontal "¿Sabías que...?"
│   │   ├── QuizSection.tsx          → Quiz de 6 pasos con resultados-primero (MatchRing SVG, QuizLoading, EmailCapture post-resultados, CelebrationParticles)
│   │   ├── DestinationsCatalog.tsx  → Grid de destinos (usa useDestinations hook)
│   │   ├── GearPreview.tsx          → Preview de gear destacado (usa useFeaturedGearArticles hook)
│   │   ├── SocialProof.tsx          → Testimonios
│   │   ├── PremiumItinerarySection.tsx → Sección de itinerarios personalizados de pago (Dialog con form → itinerary_requests)
│   │   ├── NewsletterSignup.tsx     → Formulario de email
│   │   └── Footer.tsx               → Links de navegación + redes sociales (Instagram, Facebook, TikTok) + contacto
│   ├── dashboard/
│   │   └── ImageUpload.tsx          → Componente reutilizable de subida de imágenes a Supabase Storage (validación tipo/tamaño, preview, remove)
│   ├── ui/                          → shadcn/ui — solo los componentes en uso (36 archivos, 12 no usados eliminados)
│   ├── blog/
│   │   ├── FeaturedBlogPost.tsx     → Hero card full-bleed para post destacado (Framer Motion, hover scale)
│   │   └── ShareButtons.tsx         → [LEGACY, sin importar] Botones compartir originales del blog (reemplazado por src/components/ShareButtons.tsx)
│   ├── SEOHead.tsx                  → Meta tags dinámicos OG + Twitter Card via react-helmet-async (Helmet)
│   ├── ShareButtons.tsx             → Botones compartir: Facebook, X, WhatsApp, Telegram, copiar enlace (popup + toast)
│   ├── ErrorBoundary.tsx            → Error boundary genérico para wrappear rutas
│   ├── LoadingSkeletons.tsx         → Skeleton loaders: DestinationDetailSkeleton, GearArticleDetailSkeleton, CardGridSkeleton
│   └── NavLink.tsx                  → Link con estado activo
├── hooks/
│   ├── use-destinations.ts          → useDestinations(), useDestinationBySlug(), useRelatedDestinations()
│   ├── use-gear-articles.ts         → useGearArticles(), useFeaturedGearArticles()
│   ├── use-blog-posts.ts            → useBlogPosts()
│   ├── use-quiz.ts                  → useQuiz() — scoring por reglas (SCORING_RULES), matchPercent/matchReasons, flujo resultados-primero, email post-resultados
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
id                    uuid PK
title                 text NOT NULL
slug                  text UNIQUE NOT NULL  → usado en URL /destinos/:slug
country               text NOT NULL
region                text
short_description     text
difficulty_level      text DEFAULT 'easy'  → "easy" | "moderate" | "challenging"
difficulty_description text
days_needed           text
best_season           text
estimated_budget_usd  integer              → número entero en USD
hero_image_url        text                 → imagen principal (campo visible en AdminDestinationForm)
gallery_images        text[]               → URLs para hero carrusel y sección galería (primera imagen = principal del carrusel)
full_guide_markdown   text
preparation_plan      text                 → markdown (tab "Preparación Física")
gear_list_markdown    text                 → markdown (tab "Qué Llevar")
common_fears          jsonb DEFAULT '[]'   → [{question, answer}]
itinerary_markdown    text                 → markdown (tab "Itinerario")
has_premium_itinerary boolean DEFAULT false
premium_itinerary_price decimal
affiliate_links       jsonb DEFAULT '{}'   → {flights_url, hotels_url, tours_url, tickets_url, car_rental_url, transfer_url, insurance_url}
experience_type       text
tags                  text[]
is_published          boolean DEFAULT false
featured              boolean DEFAULT false
created_at            timestamptz
updated_at            timestamptz
```

### `gear_articles`
```
id                uuid PK
title             text NOT NULL
slug              text UNIQUE NOT NULL
category          text NOT NULL  → "boots"|"poles"|"backpacks"|"photography"|"clothing"|"accessories"
short_description text
hero_image_url    text
content_markdown  text           → markdown
products          jsonb DEFAULT '[]'  → [{name, price, pros[], cons[], affiliate_url, rating}]
is_published      boolean DEFAULT false
featured          boolean DEFAULT false
created_at        timestamptz
updated_at        timestamptz
```

### `blog_posts`
```
id                uuid PK
title             text NOT NULL
slug              text UNIQUE NOT NULL
category          text DEFAULT 'Preparación'  → "Noticias"|"Trending Hikes"|"Historias"|"Preparación"|"Errores"|"Inspiración"|"Consejos"|"Listas"
short_description text
content_markdown  text                    → markdown
hero_image_url    text
author            text DEFAULT 'Nomaderia'
tags              text[] DEFAULT '{}'     → array de tags para filtrado (GIN index)
reading_time_min  integer DEFAULT 5       → tiempo estimado de lectura en minutos
meta_description  text                    → SEO meta description (máx 160 chars recomendados)
is_published      boolean DEFAULT false
featured          boolean DEFAULT false
created_at        timestamptz
updated_at        timestamptz
```

### `quiz_responses`
```
id                      uuid PK
email                   text (nullable)
fitness_level           text
interest                text
trip_duration           text
travel_style            text
budget_range            text
recommended_destinations text[]
created_at              timestamptz
```

### `newsletter_subscribers`
```
id         uuid PK
email      text UNIQUE
source     text        → "newsletter" | "quiz" | etc.
created_at timestamptz
```

### `itinerary_requests`
```
id                uuid PK
name              text NOT NULL
email             text NOT NULL
destination       text NOT NULL    → destino de interés (texto libre)
estimated_budget  text             → rango USD: "menos-de-500" | "500-1000" | "1000-2500" | "2500-5000" | "mas-de-5000"
message           text             → requerimientos especiales (opcional)
created_at        timestamptz
```
RLS: INSERT público (anon + authenticated) · SELECT solo admin (`has_role`)

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
useBlogPosts()                  // lista completa de posts publicados (ordered: featured desc, created_at desc)
// exports BlogPost type with: id, title, slug, category, short_description, hero_image_url, author, created_at, featured, reading_time_min, tags

// src/hooks/use-quiz.ts
useQuiz(totalSteps)             // scoring por SCORING_RULES (objeto de funciones), matchPercent (40-100%), matchReasons[], fetchResults() y handleEmailSubmit() separados
// exports: step, answers, email, setEmail, showResults, showEmailCapture, emailSubmitted, loading, results, direction, isQuizDone, handleSelect, handleBack, handleSwipe, fetchResults, handleEmailSubmit, handleShowEmailCapture
// exports types: QuizOption, QuizStep, QuizDestination (incluye matchPercent, matchReasons, experience_type, region, tags, best_season)
// SCORING_RULES tiene 6 reglas: fitness_level, interest, trip_duration, budget, season, origin
// MAX_SCORE = 17 (fitness:3 + interest:5 + trip_duration:2 + budget:2 + season:3 + origin:2)
// El quiz tiene pasos con keys: fitness_level, interest, trip_duration, budget, season, origin
// handleEmailSubmit guarda en newsletter_subscribers + quiz_responses (con email y todas las respuestas del quiz, p.ej. fitness_level, interest, trip_duration, budget, season, origin)
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
GET /privacidad               → PrivacyPolicy.tsx
GET /sobre-nosotros           → SobreNosotros.tsx
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
- `AdminLayout.tsx` verifica **dos condiciones** en onMount: session activa + rol `admin` via RPC. Si falla cualquiera → signOut + redirect a `/admin/login`
- `AdminLogin.tsx` usa `supabase.auth.signInWithPassword()`
- NO hay auth para usuarios públicos (solo admin interno)

```typescript
// Guard completo en AdminLayout (session + has_role)
const { data: { session } } = await supabase.auth.getSession();
if (!session) { navigate("/admin/login"); return; }
const { data: isAdmin } = await supabase.rpc("has_role", {
  _user_id: session.user.id,
  _role: "admin",
});
if (!isAdmin) { await supabase.auth.signOut(); navigate("/admin/login"); return; }
```

**IMPORTANTE:** Cualquier usuario autenticado en Supabase que NO tenga entrada en `public.user_roles` con `role='admin'` será deslogueado automáticamente del panel.

---

## 9. SEO

El proyecto usa **react-helmet-async** para meta tags dinámicos y hooks custom en `src/hooks/use-seo.ts`:

### SEOHead (componente declarativo — preferido)
```typescript
// Componente en src/components/SEOHead.tsx — usa Helmet de react-helmet-async
// HelmetProvider envuelve la app en App.tsx (provider más externo)
import SEOHead from "@/components/SEOHead";

<SEOHead
  title="Camino Inca"                    // → "Camino Inca | Nomaderia Adventures"
  description="Guía completa..."
  image="https://..."                    // default: Unsplash mountain OG image
  url="https://nomaderia.com/destinos/x" // default: window.location.href
  type="article"                         // default: "article"
/>
// Genera: title, meta description, og:title/description/image/url/type, twitter:card/title/description/image
```

Integrado en: `DestinationDetail.tsx`, `BlogPostDetail.tsx`, `GearArticleDetail.tsx`

### Hooks SEO (complementarios)
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

- El `index.html` tiene meta tags OG y Twitter Card base (fallback si Helmet no los sobreescribe)
- Cada página de destino/blog/gear usa `<SEOHead>` + `useJsonLd()` con datos específicos

---

## 10. Variables de Entorno

```env
VITE_SUPABASE_URL=               # URL del proyecto Supabase  (ej: https://vrixiuvnhvqafmxlcyex.supabase.co)
VITE_SUPABASE_PUBLISHABLE_KEY=   # Publishable key de Supabase (formato: sb_publishable_*)
VITE_SUPABASE_PROJECT_ID=        # Project ID (ej: vrixiuvnhvqafmxlcyex) — usado para regenerar tipos
VITE_SITE_URL=                   # URL de producción del sitio (ej: https://nomaderia.com) — usado para canonical URLs y SEO. Si está vacío, usa window.location.origin como fallback.
```

Acceso en código: `import.meta.env.VITE_SUPABASE_URL`

**Importante:** Todas las variables de entorno de Vite deben tener prefijo `VITE_` para ser accesibles en el cliente.

**Proyecto Supabase activo:** `vrixiuvnhvqafmxlcyex` — las 4 migraciones del schema están aplicadas en este proyecto.

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
- NO hacer fetch directo con `useEffect + useState` en componentes **públicos** — usar los custom hooks de `src/hooks/` o crear uno nuevo con TanStack Query. Los componentes admin sí usan `useEffect + useState` directo (patrón válido para UI autenticada que no necesita caching)

---

## 13. Cómo Agregar Nuevas Funcionalidades

### Nueva página pública
1. Crear `src/pages/NuevaPagina.tsx`
2. Agregar ruta en `src/App.tsx`
3. Agregar link en `src/components/landing/Navbar.tsx` y `Footer.tsx`

### Nueva tabla en Supabase
1. Crear la tabla en el dashboard de Supabase o agregar un archivo en `supabase/migrations/`
2. Regenerar tipos: `npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts`
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
node node_modules/typescript/bin/tsc --noEmit  # Verificar tipos sin compilar (0 errores esperados)
```

---

## 15. Patrones del Panel Admin

Los archivos admin en `src/pages/admin/` **no** usan TanStack Query — usan `useEffect + useState` directo con `supabase` client. Es válido porque el admin es UI autenticada sin necesidad de caching.

### Patrón estándar de cada lista admin (Destinations, GearArticles, BlogPosts)

```typescript
// 1. Estado inicial
const [items, setItems] = useState<T[]>([]);
const [loading, setLoading] = useState(true);

// 2. Skeleton mientras carga
{loading ? <SkeletonRows /> : ...}

// 3. Empty state si no hay datos
{items.length === 0 ? <EmptyState /> : ...}

// 4. Switch inline para publicar/despublicar (sin abrir el editor)
<Switch
  checked={item.is_published ?? false}
  onCheckedChange={() => handleTogglePublish(item.id, item.is_published ?? false)}
/>

// 5. AlertDialog de shadcn/ui para confirmar eliminación (NO browser confirm())
<AlertDialog>
  <AlertDialogTrigger asChild><Button>...</Button></AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Eliminar X?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer. Se eliminará permanentemente <strong>{item.title}</strong>.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleDelete(item.id)}>
        Eliminar
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### AdminDashboard

- 5 stat cards: Destinos, Gear, Blog Posts, Itinerarios (solicitudes), Suscriptores
- Cada card content muestra publicados en grande + borradores en pequeño (solo si > 0)
- Sección "Actividad Reciente": últimos 6 items entre los 3 content types, ordenados por fecha
- 3 botones de acción rápida: Nuevo Destino, Nuevo Artículo, Nuevo Post

### AdminQuizResponses / AdminSubscribers / AdminItineraryRequests

- Total count bajo el título
- Botón "Exportar CSV" que descarga archivo nombrado `{tipo}-{fecha-ISO}.csv`
- Skeleton de carga + empty state
- `AdminItineraryRequests` usa `supabase as any` por tabla fuera del tipo generado

---

## 16. Contexto de Negocio para Decisiones de Diseño

- El usuario llega principalmente por SEO (Google) buscando guías de trekking en español
- El funnel es: Landing → Quiz → Destino → Links de afiliados
- El contenido principal son los markdown fields de cada destino (itinerario, prep física, gear)
- Los admins son el equipo de Nomaderia (no hay usuarios públicos registrados)
- Mobile es prioritario — la mayoría del tráfico es móvil
- El sitio es dark mode nativo (no hay toggle light/dark implementado)
- Correo de contacto: **nomaderia.travel@gmail.com**
- Redes sociales: Instagram (@nomaderia.mx), Facebook, TikTok (@nomaderia.mx)

---

*Última actualización: Febrero 2026*
*Versión: 2.1*

---

## 17. Cambios Recientes — use-quiz.ts (v2.1)

### Cambios aplicados

1. **SCORING_RULES refactorizado**: de array de objetos a `Record<string, (answer, dest) => { points, reason }>` con 6 reglas:
   - `fitness_level` — mapea nivel físico a dificultad del destino (0–3 pts)
   - `interest` — verifica `tags[]`, `experience_type`, `short_description` y geo-hints (0–5 pts)
   - `trip_duration` — compara duración preferida con `days_needed` (0–2 pts)
   - `budget` — compara rango de presupuesto con `estimated_budget_usd` (0–2 pts)
   - `season` — compara mes objetivo con `best_season` del destino (-1–3 pts)
   - `origin` — da puntos de proximidad según país de origen del viajero (0–2 pts)

2. **MAX_SCORE = 17** — puntuación máxima teórica usada para calcular `matchPercent`

3. **`QuizDestination` y `DestinationFields`** — ahora incluyen los campos `tags: string[] | null` y `best_season: string | null`, así como `id`, `title`, `country`, `region`

4. **Select de Supabase** — actualizado para incluir `tags` y `best_season`

5. **`handleEmailSubmit`** — ahora guarda en dos tablas:
   - `newsletter_subscribers` (email + source: "quiz")
   - `quiz_responses` (email + respuestas + destinos recomendados; `travel_style` ← `answers.origin`, `budget_range` ← `answers.budget`)

6. **`fetchResults`** — eliminado el insert anónimo a `quiz_responses` (movido a `handleEmailSubmit` con email)

### Próximas mejoras recomendadas

- **Agregar los pasos `season` y `origin` al quiz en `QuizSection.tsx`**: actualmente el hook soporta estas reglas pero el componente quiz puede que no tenga esos pasos configurados aún
- **Actualizar `AdminQuizResponses.tsx`** para mostrar la nueva columna `travel_style` como "Origen" en el panel de administración
- **Migración de DB**: verificar que la columna `email` en `quiz_responses` esté creada (puede requerir `ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS email text`)
- **Considerar índices GIN en `destinations.tags`** para búsquedas eficientes si el catálogo crece
- **Tests unitarios para `scoreDestination`**: crear tests para las 6 reglas de scoring usando Vitest

---

## 17. Tareas Pendientes del Dueño del Proyecto

> Esta sección lista cosas que **solo tú puedes hacer** — decisiones de negocio, cuentas externas, o configuración fuera del código. Márcalas con ✅ cuando estén listas, o documenta el estado actual con 🔄.
>
> **Instrucción para agentes AI:** Si el usuario te pide hacer algo que depende de una tarea pendiente aquí, recuérdale que primero debe completarla.

---

### 🌐 Dominio y Hosting

- [ ] **Comprar y configurar dominio** — El sitio aún no tiene URL de producción.
  - Opciones sugeridas: Namecheap, Google Domains, GoDaddy
  - ✅ `SITE_URL` ya se movió a variable de entorno `VITE_SITE_URL` en `src/hooks/use-seo.ts` (con fallback a `window.location.origin`)
  - Una vez comprado, actualizar `VITE_SITE_URL` en el hosting y reemplazar `https://nomaderia.com` en `public/sitemap.xml` y `public/robots.txt`

- [ ] **Configurar hosting** — Dónde se va a desplegar el sitio.
  - Recomendado: Vercel o Netlify (soportan Vite + SPA routing con `_redirects`)
  - Al configurar, agregar las variables de entorno: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` y `VITE_SITE_URL`

- [ ] **Configurar `VITE_SITE_URL`** en el panel del proveedor de hosting una vez que tengas dominio.

---

### 🗄️ Supabase

- [x] **Aplicar migraciones** — Las 5 migraciones están aplicadas en el proyecto `vrixiuvnhvqafmxlcyex` vía SQL Editor:
  - `20260218064349_...sql` — schema base: user_roles, has_role, destinations, gear_articles, quiz_responses, newsletter_subscribers, RLS, triggers
  - `20260218162416_...sql` — tabla blog_posts + RLS + trigger
  - `20260218200000_fix_blog_posts_rls_policy.sql` — fix RLS blog_posts (agrega `TO authenticated`)
  - `20260218210000_add_itinerary_requests.sql` — tabla itinerary_requests + RLS
  - `20260218_blog_enhancements.sql` — agrega `tags TEXT[]`, `reading_time_min INTEGER`, `meta_description TEXT` + GIN index en tags

- [ ] **Regenerar tipos Supabase** — Después de aplicar las migraciones, regenerar `types.ts` para eliminar los `supabase as any` en el código:
  ```sh
  npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts
  ```
  Esto elimina los `as any` en `AdminItineraryRequests.tsx` y `AdminDashboard.tsx`.

- [ ] **Crear el usuario admin** — El usuario que va a usar el admin panel necesita:
  1. Tener una cuenta en Supabase Auth (Dashboard → Authentication → Users → Add user)
  2. Tener su UUID insertado en la tabla `user_roles`:
  ```sql
  INSERT INTO public.user_roles (user_id, role)
  VALUES ('<UUID_DEL_ADMIN>', 'admin');
  ```

- [ ] **Deshabilitar el signup público** en Supabase Dashboard:
  - Authentication → Settings → desactivar "Enable email signup"
  - Esto evita que usuarios externos se registren

- [ ] **Configurar SMTP propio (opcional)** para emails transaccionales de Supabase (confirmaciones, reset de password). Por defecto usa el servidor de Supabase con límites bajos.

---

### 📊 Analytics y Monetización

- [ ] **Configurar Google Analytics / Plausible** — No hay tracking instalado actualmente. Pendiente de decidir herramienta.

- [x] **Registrar cuentas de afiliados** — Cuentas activas:
  - **Amazon Associates** — `tag: nomaderia-20` — gear outdoor (3-4% comisión)
  - **Klook** (vía Travelpayouts) — tours y actividades (2-5%)
  - **Tiqets** (vía Travelpayouts) — entradas a atracciones (3.5-8%)
  - **Localrent** (vía Travelpayouts) — renta de autos (7.5-12%)
  - **Welcome Pickups** (vía Travelpayouts) — transfers aeropuerto (8-9%)
  - ⚠️ Sin programa de vuelos ni hoteles todavía — dejar `flights_url` y `hotels_url` vacíos por ahora

- [ ] **Agregar los affiliate links reales** a los destinos desde el panel admin (`/admin/destinations`)

---

### 🔍 SEO Pre-lanzamiento

- [ ] **Verificar el sitio en Google Search Console** una vez que tengas dominio
- [x] **Sitemap generado** — `public/sitemap.xml` incluye todas las rutas públicas estáticas (`/`, `/gear`, `/blog`, `/calculadora`, `/sobre-nosotros`, `/privacidad`). Las URLs dinámicas de `/destinos/:slug`, `/gear/:slug` y `/blog/:slug` se deben agregar manualmente o con un generador cuando se publique contenido. **Pendiente:** reemplazar `https://nomaderia.com` por el dominio real.
- [ ] **Enviar sitemap a Google Search Console** una vez verificado el sitio
- [x] **Configurar Open Graph image** — `SEOHead.tsx` usa `hero_image_url` dinámicamente en cada página de destino/blog/gear. Fallback a imagen OG genérica de Unsplash si no hay hero. Meta tags OG y Twitter Card se generan via react-helmet-async.

---

### 📝 Contenido

- [ ] **Subir imagen del diploma** — La página `/sobre-nosotros` está lista para mostrar tu diploma de Agente de Viajes. Solo necesitas:
  1. Tomar una foto o escanear tu diploma
  2. Guardar el archivo como `diploma.jpg` (también acepta `.png`, pero si cambias la extensión actualiza la ruta en `src/pages/SobreNosotros.tsx` línea 50: `src="/diploma.jpg"`)
  3. Colocar el archivo en la carpeta `public/` del proyecto:
     ```
     nomaderia-adventures/
       public/
         diploma.jpg   ← aquí
     ```
  4. Listo — la imagen aparece automáticamente en la página.

- [ ] **Agregar destinos reales** desde el panel admin — actualmente el sitio está vacío sin datos en la DB
- [ ] **Agregar artículos de gear** con productos reales y links de afiliado
- [ ] **Escribir posts del blog** para SEO inicial
- [ ] **Agregar hero images y galerías** a todos los destinos (URLs de Unsplash con `?w=1200&q=80` o imágenes propias en Supabase Storage). El campo `gallery_images` ya está activo — la primera URL es el principal del carrusel, el resto forma la sección galería (mínimo 2 imágenes para que aparezca).

---

### 🛠️ Código — Próximas Mejoras

- [x] **Sistema de affiliate links expandido** — Se amplió el sidebar de "Reserva Tu Viaje" en `DestinationDetail.tsx` de 3 a 7 botones condicionales (Vuelos, Hoteles, Tours/Klook, Entradas/Tiqets, Renta Auto/Localrent, Transfer/Welcome Pickups, Seguro). Botones solo renderizados si la URL está presente. `AdminDestinationForm.tsx` actualizado con los 4 campos nuevos (`tours_url`, `tickets_url`, `car_rental_url`, `transfer_url`) + layout grid para los 7 inputs. `BudgetCalculator.tsx` — botón "Ver Hospedaje" reemplazado por "Ver Tours y Actividades" apuntando a `selectedDest?.affiliate_links?.tours_url || "https://www.klook.com/"`. `GearArticleDetail.tsx` — botón Amazon actualizado a `rel="noopener noreferrer sponsored"`. Disclosure de afiliados añadido en `DestinationDetail.tsx` (debajo del sidebar) y `GearArticleDetail.tsx` (antes de "Productos Recomendados"). `PrivacyPolicy.tsx` ya tenía la sección 4 de afiliados, no requirió cambios.

- [x] **`PrivacyPolicy.tsx` creada** — Página `/privacidad` con política de privacidad completa en español (LFPDPPP). Cubre: recopilación de datos, links de afiliados, servicios de terceros, derechos ARCO, contacto.

- [x] **`SobreNosotros.tsx` creada** — Página `/sobre-nosotros` con: badge de credencial "Agente de Viajes Certificada" (ícono `BadgeCheck`), sección de diploma (imagen dinámica desde `public/diploma.jpg`), sección de misión con valores, y CTA de contacto. Links en Navbar y Footer actualizados de `#about` → `/sobre-nosotros`.

- [x] **Footer actualizado** — Redes sociales reales (Instagram, Facebook, TikTok), link `mailto:` para Contacto, link interno `/privacidad` para Política de Privacidad. Se eliminó YouTube y se agregó Facebook + TikTok (SVG inline).

- [x] **`PremiumItinerarySection.tsx` creado** — Sección de itinerarios personalizados con Dialog + formulario (React Hook Form + Zod) → tabla `itinerary_requests`. Aparece en homepage (`Index.tsx`) y en cada destino (`DestinationDetail.tsx`, pre-rellena el campo destino).

- [x] **`AdminItineraryRequests.tsx` creado** — `/admin/itinerary-requests` con tabla, count, CSV export, skeleton, empty state. Link en sidebar de `AdminLayout.tsx`, stat card en `AdminDashboard.tsx`.

- [x] **Schema DB actualizado en contexto** — Los nombres reales de columnas en `destinations`, `gear_articles`, `blog_posts` y `quiz_responses` están corregidos en Sección 4 (diferían del schema real en las migraciones).

- [x] **gallery_images activado en DestinationDetail + AdminDestinationForm** — Campo `text[]` de la tabla `destinations` ahora completamente integrado:
  - **Hero carrusel** (`DestinationDetail.tsx`): reemplaza la imagen estática. Usa `useEmblaCarousel({ loop: true })` directamente (sin el wrapper shadcn), autoplay vía `setInterval` cada 5s, dots blancos semi-transparentes en la parte inferior que permiten navegar al hacer clic. Altura `h-[50vh] md:h-[60vh]`. Gradient, texto y badges encima con `z-10`. Fallback a `hero_image_url` si `gallery_images` está vacío.
  - **Markdown images** (`DestinationDetail.tsx`): objeto `markdownComponents` con renderer `img` → `<figure>` + `<img className="w-full h-64 md:h-80 object-cover rounded-xl" loading="lazy">` + `<figcaption italic>`. Aplicado a los 3 tabs de ReactMarkdown (prep, itinerary, gear).
  - **Sección Galería** (`DestinationDetail.tsx`): se muestra solo si `gallery_images.length > 1`, entre los tabs y "Destinos Similares". Grid `grid-cols-2 md:grid-cols-3`, primera imagen ocupa `col-span-2 row-span-2` en desktop. Hover zoom `scale-110 duration-700`. Framer Motion fade+slide con delay escalonado por imagen. Al clicar abre Lightbox (`Dialog` shadcn/ui) con imagen centrada, botón X, flechas prev/next, contador, y soporte de teclado (←/→/Escape).
  - **AdminDestinationForm.tsx**: `galleryImages: string[]` como estado separado (igual que `fears`). `GeneralFields` recibe `galleryImages` + `onGalleryChange`. Textarea con `join("\n")` / `split("\n").filter(trim)`, placeholder con URLs de Unsplash y nota "Usa ?w=1200&q=80". Campo `hero_image_url` ahora también visible en el form (antes existía en `emptyForm` pero no se renderizaba). `gallery_images` incluido en la carga y en el payload del submit.

- [x] **`hero_image_url` ahora visible en AdminDestinationForm** — El campo existía en `emptyForm` y se salvaba al submit, pero no tenía input UI. Ahora aparece en `GeneralFields` justo antes del textarea de galería.

- [x] **Blog enhancements — categorías, featured post, share, reading time** — Mejoras completas al sistema de blog:
  - **Migración SQL** (`supabase/migrations/20260218_blog_enhancements.sql`): agrega `tags TEXT[] DEFAULT '{}'`, `reading_time_min INTEGER DEFAULT 5`, `meta_description TEXT`, GIN index en tags.
  - **Categorías expandidas** de 4 a 8: Noticias, Trending Hikes, Historias, Preparación, Errores, Inspiración, Consejos, Listas. Tabs en `BlogListing.tsx` ahora horizontally scrollable (`overflow-x-auto scrollbar-hide`).
  - **`FeaturedBlogPost.tsx`** (`src/components/blog/`): hero card full-bleed (`h-[50vh] min-h-[400px]`) con imagen, gradient overlay, badge categoría, reading time, autor, flecha CTA. Framer Motion fade-in, hover scale-105. Se muestra en `BlogListing` si `posts[0].featured`.
  - **`ShareButtons.tsx`** (`src/components/blog/`): WhatsApp, X (Twitter), Facebook + copiar link. Hover colores por plataforma. `navigator.clipboard.writeText` con toast. Integrado en `BlogPostDetail.tsx` después del contenido markdown con `border-t` separator.
  - **Reading time badges**: `BlogPostDetail.tsx` hero muestra `{reading_time_min} min de lectura` con ícono Clock. `BlogListing.tsx` cards muestran `{reading_time_min} min` con Clock.
  - **`AdminBlogPostForm.tsx`**: categoría ahora usa `Select` (shadcn) en vez de Input libre. Campos nuevos: `reading_time_min` (number), `meta_description` (textarea SEO), `tags` (textarea, uno por línea). Tags como `string[]` separado del form state. Payload explícito sin `as any`.
  - **`use-blog-posts.ts`**: interface actualizada con `featured`, `reading_time_min`, `tags`. Query ordena por `featured desc, created_at desc`. Exporta `BlogPost` type.
  - **`types.ts`**: `blog_posts` Row/Insert/Update actualizado con los 3 campos nuevos.

- [x] **Sistema de SEO dinámico + compartir en redes sociales** — react-helmet-async + componentes SEOHead y ShareButtons:
  - **react-helmet-async** instalado. `<HelmetProvider>` envuelve la app en `App.tsx` (provider más externo, antes de QueryClientProvider).
  - **`SEOHead.tsx`** (`src/components/`): componente declarativo que usa `<Helmet>` para generar meta tags dinámicos. Props: `title` (se concatena `| Nomaderia Adventures`), `description`, `image` (default: Unsplash mountain), `url` (default: `window.location.href`), `type` (default: `"article"`). Genera: `<title>`, `<meta name="description">`, `og:title/description/image/url/type`, `twitter:card/title/description/image`.
  - **`ShareButtons.tsx`** (`src/components/`): botones para Facebook, X (Twitter), WhatsApp, Telegram + copiar enlace. Props: `url`, `title`, `description?`, `className?`. Usa `window.open()` popup (600x400) para share, `navigator.clipboard.writeText` + toast para copiar. Hover colores por plataforma (#1877F2 Facebook, foreground X, #25D366 WhatsApp, #0088cc Telegram). Íconos: SVG inline para Facebook/X, lucide `MessageCircle`/`Send`/`Share2`/`Check`.
  - **Integración en 3 páginas**: `DestinationDetail.tsx`, `BlogPostDetail.tsx`, `GearArticleDetail.tsx` — cada una usa `<SEOHead>` con datos dinámicos y `<ShareButtons>` al final del contenido principal (con `border-t` separator). Se eliminó la manipulación manual de `document.title` y `querySelector` para meta tags (Helmet lo maneja declarativamente).
  - **`src/components/blog/ShareButtons.tsx`** ya no se importa en ningún archivo (reemplazado por `src/components/ShareButtons.tsx` que añade Telegram y usa popup pattern).

- [x] **Eliminar `supabase as any`** — La tabla `itinerary_requests` fue añadida a `src/integrations/supabase/types.ts` con sus tipos Row/Insert/Update. Los casts `supabase as any` y los comentarios `eslint-disable` fueron eliminados de `AdminItineraryRequests.tsx` y `AdminDashboard.tsx`. — Componente reutilizable de subida de imágenes a Supabase Storage (`src/components/dashboard/ImageUpload.tsx`):
  - **Props**: `bucket` (string), `currentUrl?` (string), `onUploadComplete` (callback con URL pública).
  - **Funcionalidad**: acepta WebP/JPG/PNG (máx 2MB), genera nombres únicos con timestamp, sube a Supabase Storage, muestra preview con botón remove, spinner durante upload, validación de tipo y tamaño, toasts de éxito/error.
  - **Integrado en `AdminDestinationForm.tsx`**: `bucket="destinations"`, reemplaza input de texto para `hero_image_url`.
  - **Integrado en `AdminBlogPostForm.tsx`**: `bucket="blog-posts"`, reemplaza input de texto para `hero_image_url`.
  - **Buckets de Supabase Storage requeridos**: `destinations`, `blog-posts` (ambos deben existir con acceso público para lectura).
  - `src/pages/admin/AdminItineraryRequests.tsx:56`
  - `src/pages/admin/AdminDashboard.tsx:50`
  - Fix: regenerar tipos con `npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts`

- [x] **`VITE_SITE_URL` como variable de entorno** — `src/hooks/use-seo.ts` ya no tiene URL hardcodeada. Usa `import.meta.env.VITE_SITE_URL` con fallback a `window.location.origin`. Variable añadida a `.env` (vacía por defecto). El dueño debe configurar `VITE_SITE_URL` en el hosting cuando tenga dominio.

- [x] **Sitemap y robots.txt actualizados** — `public/sitemap.xml` ahora incluye todas las rutas públicas estáticas (`/`, `/gear`, `/blog`, `/calculadora`, `/sobre-nosotros`, `/privacidad`). Se eliminaron los slugs de destino hardcodeados (contenido dinámico). `public/robots.txt` actualizado. Ambos usan `https://nomaderia.com` como placeholder — reemplazar con el dominio real.

- [x] **Quiz optimizado — scoring inteligente y flujo resultados-primero** — Reescritura completa de `use-quiz.ts` y `QuizSection.tsx`:
  - **Scoring por reglas (SCORING_RULES)**: lee `experience_type`, `difficulty_level`, `short_description`, `estimated_budget_usd` de cada destino. Elimina slugs hardcodeados (`camino-de-santiago`, `gran-canon`).
  - **Nueva pregunta de presupuesto**: reemplaza "¿Con quién irías?" (que no afectaba scoring) con 4 opciones de budget (Económico <$500, Moderado $500-$1500, Premium $1500-$3000, Sin límite).
  - **matchPercent (40-100%) y matchReasons[]** por destino: porcentaje calculado como proporción del score máximo posible. Razones visibles en badges en cada resultado.
  - **Flujo resultados-primero**: `fetchResults()` se ejecuta al terminar las 4 preguntas (sin pedir email). `handleEmailSubmit()` es separado, post-resultados. Mejor conversión al mostrar valor antes de capturar email.
  - **Nuevos componentes**: `MatchRing` (anillo SVG animado con %), `QuizLoading` (spinner + dots animados), `CelebrationParticles` (partículas de colores), `EmailCapture` (formulario post-resultados).
  - **Botón "Anterior"** visible desde pregunta 2. Subtitles y descriptions en cada opción de cada pregunta.
  - **Select de Supabase** ahora incluye `experience_type` y `region`.
  - **Preguntas**: actividad física, paisaje, duración, presupuesto. Cada una con subtitle descriptivo y descriptions por opción.

---

## 18. Changelog — AdminQuizResponses Actualizado (Febrero 2026)

### AdminQuizResponses — Tabla completa
- 7 columnas: Email, Fitness, Paisaje, Duración, Presupuesto, Origen, Fecha
- Label maps con emojis para valores legibles (no muestra "sedentary" sino "🚶 Sedentario")
- CSV export actualizado con los mismos 7 campos y labels
- travel_style ahora muestra el origen/país del usuario
- budget_range se muestra correctamente (antes no aparecía en la tabla)

### Recomendaciones Futuras
- Agregar analytics visuales al AdminDashboard con barras de distribución del quiz
- Card de "Destinos Más Recomendados" cruzando recommended_destinations con destinations
- Filtro de rango de fechas para comparar periodos
- Tasa de conversión quiz→email

---

## 18. Changelog — Quiz Analytics Dashboard (Febrero 2026)

### AdminDashboard — Sección Analytics del Quiz
- 4 cards con barras horizontales: Paisaje Favorito, Origen de Audiencia, Presupuesto, Nivel Físico
- Componente `MiniBar` para visualización de distribución de datos con porcentajes
- Fetch de últimas 200 quiz responses para calcular analytics
- Labels con emojis para todos los valores del quiz
- Solo se muestra si hay quiz responses (stats.quiz > 0)

### AdminQuizResponses — Tabla actualizada
- 7 columnas: Email, Fitness, Paisaje, Duración, Presupuesto, Origen, Fecha
- Labels legibles con emojis en tabla y CSV export
- budget_range ahora se guarda correctamente (no en travel_style)
- travel_style ahora guarda el origen/país del usuario

### Recomendaciones Futuras
- Card de "Destinos Más Recomendados" cruzando recommended_destinations con tabla destinations
- Filtro de rango de fechas en analytics para comparar periodos
- Tasa de conversión quiz→email (completan quiz vs dejan email)
- Analytics de temporada (campo season) cuando haya suficiente data
- Gráficas de tendencia con Recharts para ver cambios en audiencia over time
- Considerar agregar analytics de clics en affiliate links por destino
