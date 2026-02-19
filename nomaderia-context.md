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
│   ├── PrivacyPolicy.tsx            → /privacidad (Política de Privacidad LFPDPPP)
│   ├── SobreNosotros.tsx            → /sobre-nosotros (página Sobre Nosotros + credencial agente de viajes)
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
│       ├── AdminSubscribers.tsx    → Ver suscriptores
│       └── AdminItineraryRequests.tsx → Ver solicitudes de itinerario personalizado
├── components/
│   ├── landing/
│   │   ├── Navbar.tsx               → Navegación principal (sticky, con scroll effect)
│   │   ├── HeroSection.tsx          → Hero con parallax (DOM directo via ref, sin re-renders)
│   │   ├── DidYouKnowSection.tsx    → Carrusel horizontal "¿Sabías que...?"
│   │   ├── QuizSection.tsx          → Quiz de 4 pasos (lógica en useQuiz, JSX en ResultCard + QuizResults)
│   │   ├── DestinationsCatalog.tsx  → Grid de destinos (usa useDestinations hook)
│   │   ├── GearPreview.tsx          → Preview de gear destacado (usa useFeaturedGearArticles hook)
│   │   ├── SocialProof.tsx          → Testimonios
│   │   ├── PremiumItinerarySection.tsx → Sección de itinerarios personalizados de pago (Dialog con form → itinerary_requests)
│   │   ├── NewsletterSignup.tsx     → Formulario de email
│   │   └── Footer.tsx               → Links de navegación + redes sociales (Instagram, Facebook, TikTok) + contacto
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
hero_image_url        text
gallery_images        text[]
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
category          text DEFAULT 'general'  → "prep"|"mistakes"|"inspiration"|"tips"
short_description text
content_markdown  text                    → markdown
hero_image_url    text
author            text DEFAULT 'Nomaderia'
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
VITE_SUPABASE_URL=               # URL del proyecto Supabase  (ej: https://vrixiuvnhvqafmxlcyex.supabase.co)
VITE_SUPABASE_PUBLISHABLE_KEY=   # Publishable key de Supabase (formato: sb_publishable_*)
VITE_SUPABASE_PROJECT_ID=        # Project ID (ej: vrixiuvnhvqafmxlcyex) — usado para regenerar tipos
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
*Versión: 1.5*

---

## 17. Tareas Pendientes del Dueño del Proyecto

> Esta sección lista cosas que **solo tú puedes hacer** — decisiones de negocio, cuentas externas, o configuración fuera del código. Márcalas con ✅ cuando estén listas, o documenta el estado actual con 🔄.
>
> **Instrucción para agentes AI:** Si el usuario te pide hacer algo que depende de una tarea pendiente aquí, recuérdale que primero debe completarla.

---

### 🌐 Dominio y Hosting

- [ ] **Comprar y configurar dominio** — El sitio aún no tiene URL de producción.
  - Opciones sugeridas: Namecheap, Google Domains, GoDaddy
  - Una vez comprado, actualizar `SITE_URL` en `src/hooks/use-seo.ts` (o mejor, moverlo a variable de entorno `VITE_SITE_URL`)

- [ ] **Configurar hosting** — Dónde se va a desplegar el sitio.
  - Recomendado: Vercel o Netlify (soportan Vite + SPA routing con `_redirects`)
  - Al configurar, agregar las variables de entorno: `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`

- [ ] **Configurar `VITE_SITE_URL`** en el panel del proveedor de hosting una vez que tengas dominio.

---

### 🗄️ Supabase

- [x] **Aplicar migraciones** — Las 4 migraciones están aplicadas en el proyecto `vrixiuvnhvqafmxlcyex` vía SQL Editor:
  - `20260218064349_...sql` — schema base: user_roles, has_role, destinations, gear_articles, quiz_responses, newsletter_subscribers, RLS, triggers
  - `20260218162416_...sql` — tabla blog_posts + RLS + trigger
  - `20260218200000_fix_blog_posts_rls_policy.sql` — fix RLS blog_posts (agrega `TO authenticated`)
  - `20260218210000_add_itinerary_requests.sql` — tabla itinerary_requests + RLS

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
- [ ] **Enviar sitemap** — No hay sitemap.xml generado aún. Pendiente de implementar o usar plugin.
- [ ] **Configurar Open Graph image** específica para cada destino (actualmente usa la hero_image_url pero falta hero image en muchos)

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
- [ ] **Agregar hero images** a todos los destinos (URLs de Unsplash o imágenes propias en Supabase Storage)

---

### 🛠️ Código — Próximas Mejoras

- [x] **Sistema de affiliate links expandido** — Se amplió el sidebar de "Reserva Tu Viaje" en `DestinationDetail.tsx` de 3 a 7 botones condicionales (Vuelos, Hoteles, Tours/Klook, Entradas/Tiqets, Renta Auto/Localrent, Transfer/Welcome Pickups, Seguro). Botones solo renderizados si la URL está presente. `AdminDestinationForm.tsx` actualizado con los 4 campos nuevos (`tours_url`, `tickets_url`, `car_rental_url`, `transfer_url`) + layout grid para los 7 inputs. `BudgetCalculator.tsx` — botón "Ver Hospedaje" reemplazado por "Ver Tours y Actividades" apuntando a `selectedDest?.affiliate_links?.tours_url || "https://www.klook.com/"`. `GearArticleDetail.tsx` — botón Amazon actualizado a `rel="noopener noreferrer sponsored"`. Disclosure de afiliados añadido en `DestinationDetail.tsx` (debajo del sidebar) y `GearArticleDetail.tsx` (antes de "Productos Recomendados"). `PrivacyPolicy.tsx` ya tenía la sección 4 de afiliados, no requirió cambios.

- [x] **`PrivacyPolicy.tsx` creada** — Página `/privacidad` con política de privacidad completa en español (LFPDPPP). Cubre: recopilación de datos, links de afiliados, servicios de terceros, derechos ARCO, contacto.

- [x] **`SobreNosotros.tsx` creada** — Página `/sobre-nosotros` con: badge de credencial "Agente de Viajes Certificada" (ícono `BadgeCheck`), sección de diploma (imagen dinámica desde `public/diploma.jpg`), sección de misión con valores, y CTA de contacto. Links en Navbar y Footer actualizados de `#about` → `/sobre-nosotros`.

- [x] **Footer actualizado** — Redes sociales reales (Instagram, Facebook, TikTok), link `mailto:` para Contacto, link interno `/privacidad` para Política de Privacidad. Se eliminó YouTube y se agregó Facebook + TikTok (SVG inline).

- [x] **`PremiumItinerarySection.tsx` creado** — Sección de itinerarios personalizados con Dialog + formulario (React Hook Form + Zod) → tabla `itinerary_requests`. Aparece en homepage (`Index.tsx`) y en cada destino (`DestinationDetail.tsx`, pre-rellena el campo destino).

- [x] **`AdminItineraryRequests.tsx` creado** — `/admin/itinerary-requests` con tabla, count, CSV export, skeleton, empty state. Link en sidebar de `AdminLayout.tsx`, stat card en `AdminDashboard.tsx`.

- [x] **Schema DB actualizado en contexto** — Los nombres reales de columnas en `destinations`, `gear_articles`, `blog_posts` y `quiz_responses` están corregidos en Sección 4 (diferían del schema real en las migraciones).

- [ ] **Eliminar `supabase as any`** — Dos archivos usan cast temporal hasta que se regeneren los tipos:
  - `src/pages/admin/AdminItineraryRequests.tsx:56`
  - `src/pages/admin/AdminDashboard.tsx:50`
  - Fix: regenerar tipos con `npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts`
