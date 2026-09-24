# Nomaderia Adventures

> Guías en español para **adultos hispanos en Southern California (25–45)**, first-time hikers — sin morir en el intento.

Nomaderia Adventures es una web app (React + TypeScript) con un producto de pago: **Itinerario Completo Nomaderia — $49 USD** (cierre hoy por WhatsApp). También ayuda a viajeros a:

- Descubrir parques y destinos con guías detalladas en español
- Calcular presupuestos de viaje personalizados
- Encontrar equipo con reseñas y links de afiliados (Amazon Associates)
- Leer el blog de consejos de preparación física y viaje
- Recibir recomendaciones personalizadas a través de un quiz interactivo

---

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend Framework | React 18 + TypeScript 5 |
| Build Tool | Vite 5 (SWC) |
| Estilos | Tailwind CSS 3 |
| Componentes UI | shadcn/ui + Radix UI |
| Animaciones | Framer Motion 12 |
| Routing | React Router DOM 6 |
| Backend / DB | Supabase (PostgreSQL + Auth) |
| Data Fetching | TanStack React Query 5 |
| Formularios | React Hook Form + Zod |
| Testing | Vitest + Testing Library |
| Carruseles | Embla Carousel |
| Charts | Recharts |
| Markdown | React Markdown |

---

## Estructura del Proyecto

```
nomaderia-adventures/
├── src/
│   ├── pages/
│   │   ├── Index.tsx                   # Homepage
│   │   ├── DestinationDetail.tsx       # Página de destino individual
│   │   ├── GearListing.tsx             # Catálogo de equipo
│   │   ├── GearArticleDetail.tsx       # Artículo de equipo individual
│   │   ├── BlogListing.tsx             # Listado del blog
│   │   ├── BlogPostDetail.tsx          # Post individual del blog
│   │   ├── BudgetCalculator.tsx        # Calculadora de presupuesto
│   │   ├── NotFound.tsx
│   │   └── admin/                      # Panel de administración (protegido)
│   │       ├── AdminLogin.tsx
│   │       ├── AdminLayout.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminDestinations.tsx
│   │       ├── AdminDestinationForm.tsx
│   │       ├── AdminGearArticles.tsx
│   │       ├── AdminGearArticleForm.tsx
│   │       ├── AdminBlogPosts.tsx
│   │       ├── AdminBlogPostForm.tsx
│   │       ├── AdminQuizResponses.tsx
│   │       └── AdminSubscribers.tsx
│   ├── components/
│   │   ├── landing/                    # Secciones de la homepage
│   │   │   ├── Navbar.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── DidYouKnowSection.tsx
│   │   │   ├── QuizSection.tsx
│   │   │   ├── DestinationsCatalog.tsx
│   │   │   ├── GearPreview.tsx
│   │   │   ├── SocialProof.tsx
│   │   │   ├── NewsletterSignup.tsx
│   │   │   └── Footer.tsx
│   │   ├── ui/                         # shadcn/ui components
│   │   └── LoadingSkeletons.tsx
│   ├── hooks/
│   │   ├── use-seo.ts                  # Canonical links + JSON-LD
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts               # Cliente Supabase
│   │       └── types.ts                # Tipos auto-generados
│   ├── lib/
│   │   └── utils.ts                    # cn() helper (clsx + tailwind-merge)
│   ├── App.tsx                         # Router principal
│   └── main.tsx                        # Entry point
├── public/
├── supabase/
├── index.html
├── tailwind.config.ts
├── vite.config.ts
└── vitest.config.ts
```

---

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
VITE_SUPABASE_URL=tu_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=tu_supabase_anon_key
```

Obtén estos valores desde tu [dashboard de Supabase](https://supabase.com/dashboard).

---

## Instalación y Desarrollo Local

Requisitos previos: Node.js 18+ o Bun.

```sh
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/nomaderia-adventures.git
cd nomaderia-adventures

# 2. Instalar dependencias
npm install
# o con bun:
bun install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# 4. Iniciar servidor de desarrollo (puerto 8080)
npm run dev
```

Abre `http://localhost:8080` en tu navegador.

---

## Scripts Disponibles

```sh
npm run dev          # Servidor de desarrollo con HMR
npm run build        # Build de producción
npm run build:dev    # Build en modo development
npm run preview      # Preview del build de producción
npm run lint         # Linter ESLint
npm run test         # Tests (Vitest, una sola ejecución)
npm run test:watch   # Tests en modo watch
```

---

## Rutas de la Aplicación

| Ruta | Descripción |
|------|-------------|
| `/` | Homepage con hero, quiz, destinos y gear |
| `/destinos/:slug` | Detalle de destino con itinerario y gear list |
| `/gear` | Catálogo de equipo por categorías |
| `/gear/:slug` | Artículo de equipo con recomendaciones |
| `/blog` | Listado de artículos del blog |
| `/blog/:slug` | Post individual del blog |
| `/calculadora` | Calculadora de presupuesto interactiva |
| `/admin/login` | Login del panel de administración |
| `/admin` | Dashboard de administración (protegido) |

---

## Base de Datos (Supabase)

El proyecto usa las siguientes tablas en Supabase:

| Tabla | Descripción |
|-------|-------------|
| `destinations` | Guías de destinos de aventura |
| `gear_articles` | Artículos y reseñas de equipo |
| `blog_posts` | Artículos del blog |
| `quiz_responses` | Respuestas del quiz interactivo |
| `newsletter_subscribers` | Suscriptores del newsletter |

Todas las tablas tienen campo `is_published` para controlar qué contenido es visible en el sitio público.

---

## Paleta de Colores (tema claro editorial)

Fuente de verdad: `docs/design-system.md`. Resumen:

| Token | Color | Hex | Uso |
|-------|-------|-----|-----|
| `green` | Trail Green | `#1F6F43` | **Primario** — botones, nav activo, marca |
| `green-dark` | Pine | `#16512F` | Hover de botones verdes |
| `cloud` | Cloud | `#FBFAF7` | Fondo de página |
| `ink` | Ink | `#13211A` | Títulos |
| `forest-dark` | Forest Charcoal | `#14201A` | Secciones oscuras / footer (no es “dark mode” del sitio) |

Tema **light** (sin toggle público). Tipografías: **Playfair Display** (headings) · **Inter** (body) · **Oswald** (eyebrows).

---

## Despliegue

Producción hoy: **Cloudflare Pages** (`https://nomaderia.com`). Compatible con cualquier host estático.

```sh
npm run build
# Output en dist/
```

---

## Contribuir

1. Crea una rama desde `main`: `git checkout -b feature/mi-feature`
2. Haz tus cambios y escribe tests si aplica
3. Abre un Pull Request hacia `main`

---

## Licencia

Privado — Todos los derechos reservados © Nomaderia Adventures.
