# Supabase Schema — Nomaderia Adventures

> Proyecto activo: `vrixiuvnhvqafmxlcyex`
> Regenerar tipos: `npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts`

## Tablas

### `destinations`
```
id                    uuid PK
title                 text NOT NULL
slug                  text UNIQUE NOT NULL       → /destinos/:slug
country               text NOT NULL
region                text
short_description     text
difficulty_level      text DEFAULT 'easy'        → "easy" | "moderate" | "challenging"
difficulty_description text
days_needed           text
best_season           text
estimated_budget_usd  integer                    → USD entero
hero_image_url        text
gallery_images        text[]
full_guide_markdown   text
preparation_plan      text                       → markdown (tab "Preparación Física")
gear_list_markdown    text                       → markdown (tab "Qué Llevar")
common_fears          jsonb DEFAULT '[]'         → [{question, answer}]
itinerary_markdown    text                       → markdown (tab "Itinerario")
has_premium_itinerary boolean DEFAULT false
premium_itinerary_price decimal
affiliate_links       jsonb DEFAULT '{}'         → {flights_url, hotels_url, insurance_url}
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
category          text NOT NULL                  → "boots"|"poles"|"backpacks"|"photography"|"clothing"|"accessories"
short_description text
hero_image_url    text
content_markdown  text                           → markdown
products          jsonb DEFAULT '[]'             → [{name, price, pros[], cons[], affiliate_url, rating}]
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
category          text DEFAULT 'general'         → "prep"|"mistakes"|"inspiration"|"tips"
short_description text
content_markdown  text                           → markdown
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
source     text                                  → "newsletter" | "quiz" | etc.
created_at timestamptz
```

### `itinerary_requests`
```
id                uuid PK
name              text NOT NULL
email             text NOT NULL
destination       text NOT NULL                  → texto libre
estimated_budget  text                           → "menos-de-500"|"500-1000"|"1000-2500"|"2500-5000"|"mas-de-5000"
message           text                           → requerimientos especiales (opcional)
created_at        timestamptz
```

## RLS (Row Level Security)

- **Tablas de contenido** (`destinations`, `gear_articles`, `blog_posts`): SELECT público con filtro `is_published = true`. INSERT/UPDATE/DELETE solo admin via `has_role()`.
- **`quiz_responses`**: INSERT público (anon + authenticated). SELECT solo admin.
- **`newsletter_subscribers`**: INSERT público. SELECT solo admin.
- **`itinerary_requests`**: INSERT público. SELECT solo admin.

## Autenticación

- Supabase Auth con localStorage (persistencia de sesión)
- `AdminLayout.tsx` verifica session activa + rol admin via RPC `has_role()`
- Si falla cualquiera → signOut + redirect a `/admin/login`
- NO hay auth para usuarios públicos

```typescript
// Guard en AdminLayout
const { data: { session } } = await supabase.auth.getSession();
if (!session) { navigate("/admin/login"); return; }
const { data: isAdmin } = await supabase.rpc("has_role", {
  _user_id: session.user.id,
  _role: "admin",
});
if (!isAdmin) { await supabase.auth.signOut(); navigate("/admin/login"); return; }
```

## TanStack Query Config

```typescript
// En App.tsx
staleTime: 1000 * 60 * 5   // cache 5 min
retry: 1                    // 1 reintento
refetchOnWindowFocus: false // sin refetch al cambiar tab
```
