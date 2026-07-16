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
main_barrier            text (nullable)
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
status            lead_status NOT NULL DEFAULT 'nuevo'  → enum: "nuevo"|"contactado"|"convertido"
contacted_at      timestamptz                    → se llena al marcar "contactado"
created_at        timestamptz
```

### `itinerary_templates`
```
id              uuid PK
destination_id  uuid NOT NULL → references destinations(id)
title           text NOT NULL                    -- e.g. "Joshua Tree — 2 días esencial"
summary         text                             -- short admin-facing description
suggested_days  int NOT NULL DEFAULT 2
content         jsonb NOT NULL DEFAULT '{"version":1,"dias":[]}'
                -- See "content JSONB shape (v1)" section below
research_status text NOT NULL DEFAULT 'ai_draft' -- ai_draft | revisado | publicado
is_published    boolean NOT NULL DEFAULT false
created_at      timestamptz NOT NULL
updated_at      timestamptz NOT NULL             -- auto-updated via trigger
```
Index: `destination_id`

### `client_itineraries`
```
id              uuid PK
template_id     uuid → references itinerary_templates(id)  (nullable — cloned-from)
request_id      uuid → references itinerary_requests(id)   (nullable — links intake)
client_name     text NOT NULL
client_email    text
client_whatsapp text                             -- digits only, e.g. 16195551234
trip_start      date
trip_end        date
party           jsonb NOT NULL DEFAULT '{}'
                -- shape: {"adultos":2,"ninos":1,"nivel":"principiante",
                --         "miedos":["osos","perderse"],"presupuesto_usd":800,"notas":""}
content         jsonb NOT NULL DEFAULT '{"version":1,"dias":[]}'
                -- See "content JSONB shape (v1)" section below
share_token     text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(12),'hex')
status          text NOT NULL DEFAULT 'borrador'
                -- CHECK: borrador | entregado | viaje_activo | completado | archivado
delivered_at    timestamptz
created_at      timestamptz NOT NULL
updated_at      timestamptz NOT NULL             -- auto-updated via trigger
```
Indexes: `share_token`, `status`

### content JSONB shape (v1) — shared by `itinerary_templates` and `client_itineraries`

```json
{
  "version": 1,
  "parque": "Yosemite National Park",
  "hero_image_url": "https://...",
  "dias": [
    {
      "dia": 1,
      "titulo": "Llegada y primer sendero",
      "bloques": [
        {
          "id": "<uuid>",
          "tipo": "ruta",
          "titulo": "Hidden Valley Trail",
          "contenido_md": "Sendero circular de 1.6 km...",
          "horario": "8:00–9:30",
          "precio_usd": null,
          "precio_nota": null,
          "fuente_url": "https://www.nps.gov/jotr/...",
          "afiliado_url": null,
          "verify_flag": null
        }
      ]
    }
  ]
}
```

**`tipo` values:** `ruta` | `comida` | `alojamiento` | `traslado` | `tip_seguridad` | `permiso` | `costo` | `nota`

**Root-level optional fields (only meaningful in `client_itineraries`):**
- `parque`: human-readable park name shown in the client title (e.g. `"Yosemite National Park"`). When absent, `ClientItineraryView` falls back to `"Tu itinerario — N días, firstName"` — never a brand name.
- `hero_image_url`: URL of the hero image shown at the top of `/i/:token`. When absent, a dark-green gradient is shown.

**Field conventions:**
- `precio_usd`: number or null — never a string range
- `precio_nota`: human-readable note on price volatility (always string if price present)
- `fuente_url`: official source required (nps.gov, recreation.gov, etc.)
- `verify_flag`: null for stable data; `"⚠️ VERIFICAR (IA) [YYYY-MM-DD]"` for volatile AI-generated data
- All content in Spanish

### `park_live_data`

Datos live de APIs oficiales, sincronizados por `sync-park-live-data`. Nunca editados manualmente; se sobrescriben en cada sync run.

> ⚠️ **La tabla NO tiene columna `id`** — la PK es `park_code`. Seleccionar
> `id` devuelve 400 (bug real en producción hasta 2026-07-16, ver changelog
> de pending-tasks).

```
park_code        text PK                        → FK lógica a destinations.park_code
destination_id   uuid NULL → destinations(id) FK
-- NPS /parks (full mode)
entrance_fees    jsonb                          → [{cost, description, title}]
entrance_fee_usd numeric                        → fee de entrada normalizado (USD)
operating_hours  jsonb                          → [{name, description, standardHours, exceptions}]
images           jsonb                          → [{url, altText, title, caption, credit}]
nps_images       jsonb                          → imágenes crudas del API NPS
coordinates      jsonb                          → coordenadas normalizadas
lat_long         text                           → "lat:X, long:Y" (raw NPS string)
permits          jsonb                          → datos de permisos (ingest-park-permits)
-- NPS /alerts (ambos modos)
alerts           jsonb                          → [{id, title, description, category, url, lastIndexedDate}]
-- NWS forecast (sync-park-weather)
weather          jsonb                          → {synced_at, source, periods: [{name, is_daytime, temp_f, short, detailed, precip_pct, wind}]}
-- RIDB campgrounds (full mode)
campgrounds      jsonb                          → [{facilityId, nombre, reservation_url}]
-- Sync metadata
sync_errors      jsonb DEFAULT '[]'             → [{step, error}] del último sync run
synced_at        timestamptz
created_at       timestamptz
updated_at       timestamptz
```

*(Sección verificada contra `information_schema` de la DB viva el 2026-07-16 —
todas las columnas salvo `park_code` son nullables.)*

**Modos de sync (`sync-park-live-data`):**
- `mode: "full"` (default): refresca todos los campos. Usar al ingestar por primera vez o semanalmente.
- `mode: "alerts"`: solo actualiza `alerts` + `sync_errors` + `synced_at`. Los demás campos no se tocan. Pensado para cron diario ligero.

**Migration:** `20260611000000_create_park_live_data.sql`

---

## SOUL / Live Data Boundary (REGLA CRÍTICA)

> Esta regla existe para que ningún agente sobrescriba contenido editorial con datos de APIs.

| Tabla | Quién escribe | Contenido | Puede sobrescribirse |
|-------|--------------|-----------|----------------------|
| `destinations` | Humanos + Edge Functions editoriales (`generate-park-content`, `ingest-park-permits`, `ingest-national-parks`) | Texto curado en español, slugs, is_published, campos de negocio | **NUNCA** por sync jobs |
| `park_live_data` | `sync-park-live-data` únicamente | Datos volátiles de NPS + RIDB (fees, hours, alerts, campgrounds) | Sí — overwrite en cada sync run |

**Regla para Edge Functions:**
- Si un dato viene de NPS o RIDB y cambia regularmente (alertas, horarios, tarifas) → **`park_live_data`**.
- Si es contenido editorial en español o dato de negocio (slug, título, is_published, affiliate_links) → **`destinations`**.
- Una Edge Function que escriba a `destinations` debe documentar explícitamente qué campos propios escribe y nunca tocar campos editoriales.

---

## RLS (Row Level Security)

- **Tablas de contenido** (`destinations`, `gear_articles`, `blog_posts`): SELECT público con filtro `is_published = true`. INSERT/UPDATE/DELETE solo admin via `has_role()`.
- **`quiz_responses`**: INSERT público (anon + authenticated). SELECT solo admin.
- **`newsletter_subscribers`**: INSERT público. SELECT solo admin.
- **`itinerary_requests`**: SELECT solo admin. INSERT solo admin (migración `20260609000000` eliminó el INSERT público). UPDATE solo admin (política explícita añadida para cubrir writes de `status`/`contacted_at`).
- **`itinerary_templates`**: ALL (SELECT/INSERT/UPDATE/DELETE) solo admin via `has_role()`. Sin acceso público.
- **`client_itineraries`**: ALL solo admin via `has_role()`. Sin acceso público directo. El acceso de clientes se hace exclusivamente vía RPC `get_itinerary_by_token()`.
- **`park_live_data`**: SELECT público (sin filtro — todos los parques con datos live son públicos). ALL solo admin via `has_role()`.

## RPCs (Remote Procedure Calls)

### `get_itinerary_by_token(p_token text)`

```sql
RETURNS TABLE (client_name text, trip_start date, trip_end date,
               content jsonb, status text, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
```

- **Purpose:** Public entry point for the client-facing itinerary page (`/i/:token` or similar).
- **Visibility filter:** Only returns rows where `status IN ('entregado','viaje_activo','completado')`.
- **Excluded fields:** `client_email`, `client_whatsapp`, `party`, `template_id`, `request_id`, `share_token`, `delivered_at` — none are returned.
- **Grants:** EXECUTE to `anon` and `authenticated`.
- **Migration:** `20260609100000_create_itinerary_builder_tables.sql`

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
