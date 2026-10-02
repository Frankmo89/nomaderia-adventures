# OG / share preview samples (ADR-032)

Captured **before** deploy with:

```sh
curl -sL -A 'facebookexternalhit/1.1' 'https://nomaderia.com/<path>' \
  | rg 'og:|twitter:|<title>|name="description"'
```

**After** values are what `functions/_middleware.ts` will inject from published
Supabase rows (verified against live DB 2026-10-02 PT). Re-run the same curl
after Pages deploy + env vars to confirm.

## Home `/` — unchanged (middleware does not rewrite)

| Tag | Before = After |
|-----|----------------|
| title | Nomaderia - Aventuras y Senderismo |
| og:title | Nomaderia - Aventuras y Senderismo |
| og:description | Descubre destinos de aventura, itinerarios personalizados y guías de senderismo para explorar Parques Nacionales. Planifica tu próxima aventura con Nomaderia. |
| og:image | https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/destinations/1772502898883-4w9ykr.jpeg |
| og:url | https://nomaderia.com |
| twitter:card | summary_large_image |

## Blog `/blog/10-cosas-nadie-te-dice-primer-hike`

| Tag | Before (all URLs identical) | After (expected) |
|-----|----------------------------|------------------|
| title / og:title | Nomaderia - Aventuras y Senderismo | 10 Cosas que Nadie Te Dice Antes de Tu Primer Hike (La #7 Me Hubiera Ahorrado una Vergüenza) — Nomaderia |
| og:description | (home generic) | Todos te dicen "lleva agua y bloqueador". Nadie te dice que vas a querer rendirte a los 20 minutos. Aquí van las verdades incómodas. |
| og:image | (home generic) | https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200 |
| og:url | https://nomaderia.com | https://nomaderia.com/blog/10-cosas-nadie-te-dice-primer-hike |
| twitter:card | summary_large_image | summary_large_image |

## Blog `/blog/cuanto-cuesta-iniciar-hobby-senderismo-eeuu`

| Tag | Before | After (expected) |
|-----|--------|------------------|
| title / og:title | Nomaderia - Aventuras y Senderismo | Cuánto Cuesta Iniciar un Hobby de Senderismo en EE. UU. — Nomaderia |
| og:description | (home generic) | Conoce los costos iniciales del senderismo en EE. UU., desde equipo básico hasta permisos necesarios. |
| og:image | (home generic) | https://vrixiuvnhvqafmxlcyex.supabase.co/storage/v1/object/public/blog-posts/1780882056536-1k8txc.jpeg |
| og:url | https://nomaderia.com | https://nomaderia.com/blog/cuanto-cuesta-iniciar-hobby-senderismo-eeuu |

## Blog `/blog/5-rutas-secretas-mexico-locales`

| Tag | Before | After (expected) |
|-----|--------|------------------|
| title / og:title | Nomaderia - Aventuras y Senderismo | 5 Rutas Secretas en México que Solo los Locales Conocen (y Cómo Llegar) — Nomaderia |
| og:description | (home generic) | Olvídate de las rutas saturadas de Instagram. Estos 5 senderos son las joyas escondidas que los senderistas mexicanos no quieren que conozcas. |
| og:image | (home generic) | https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200 |
| og:url | https://nomaderia.com | https://nomaderia.com/blog/5-rutas-secretas-mexico-locales |

## Routes handled

- `/blog/:slug` → `blog_posts` where `is_published = true`
- `/destinos/:slug` → `destinations` where `is_published = true`
- All other paths (including `/`) → pass-through, no rewrite
