# Auditoría de Contenido Público — Nomaderia Adventures

**Fecha:** 30 de marzo de 2026

---

## Resumen de Issues

| Severidad | Cantidad |
|-----------|----------|
| 🔴 Crítico | 2 |
| 🟡 Medio | 9 |
| 🟢 Menor | 5 |
| **Total** | **16** |

---

## 1. DESTINOS (tabla: destinations)

> ⚠️ Los datos de destinos están en Supabase y no pueden auditarse directamente desde el código. Se requiere revisión manual desde el panel de admin (`/admin`).

| # | Severidad | Descripción | Acción |
|---|-----------|-------------|--------|
| 1 | 🟡 Medio | No se puede verificar que el markdown de destinos esté 100% en español desde el código. Requiere revisión manual en `/admin/destinations`. | Revisar cada destino en el admin y verificar que no haya texto en inglés |
| 2 | 🟡 Medio | No se puede verificar el estado de affiliate links (Amazon tag `nomaderia-20`, Klook/Tiqets IDs de Travelpayouts) desde el código. | Revisar cada destino en el admin y validar affiliate links |
| 3 | 🟡 Medio | No se puede verificar que todos los destinos tengan hero_image_url, difficulty_level, estimated_budget, duration y country completos. | Usar la herramienta "Verificador de Imágenes" en `/admin` (SystemAudit.tsx) y revisar campos vacíos |

---

## 2. GEAR ARTICLES (tabla: gear_articles)

> ⚠️ Los datos de gear articles están en Supabase y no pueden auditarse directamente desde el código.

| # | Severidad | Descripción | Acción |
|---|-----------|-------------|--------|
| 4 | 🟡 Medio | No se puede verificar que los productos JSON tengan nombre, precio, affiliate_url e imagen válidos desde el código. | Revisar cada artículo en `/admin/gear-articles` |
| 5 | 🟡 Medio | No se puede verificar que todos los affiliate_url de Amazon usen `tag=nomaderia-20` desde el código. | Revisar manualmente en el admin |

---

## 3. BLOG POSTS (tabla: blog_posts)

> ⚠️ Los datos de blog posts están en Supabase y no pueden auditarse directamente desde el código.

| # | Severidad | Descripción | Acción |
|---|-----------|-------------|--------|
| 6 | 🟡 Medio | No se puede verificar que title, excerpt y content estén en español, ni que cada post tenga category, reading_time y tags completos. | Revisar cada post en `/admin/blog-posts` |

---

## 4. COMPONENTES UI

### Texto en inglés encontrado y corregido ✅

| # | Severidad | Archivo | Descripción | Estado |
|---|-----------|---------|-------------|--------|
| 7 | 🟡 Medio | `src/components/landing/Navbar.tsx:11` | "Gear Guide" → Traducido a "Guía de Equipo" | ✅ Corregido |
| 8 | 🟡 Medio | `src/components/landing/Footer.tsx:32` | "Gear Guide" → Traducido a "Guía de Equipo" | ✅ Corregido |
| 9 | 🟡 Medio | `src/pages/GearListing.tsx:23,30,50` | "Gear Guide" en título, SEO meta y heading → Traducido a "Guía de Equipo" | ✅ Corregido |
| 10 | 🟡 Medio | `src/pages/GearArticleDetail.tsx:95,103,106,118,130,148` | "Gear Guide" en breadcrumbs, SEO meta y navegación → Traducido a "Guía de Equipo" | ✅ Corregido |
| 11 | 🟢 Menor | `src/pages/admin/AdminEmailLogs.tsx:20` | "Gear Guide" en label de tipo de email → Traducido a "Guía de Equipo" | ✅ Corregido |
| 12 | 🟢 Menor | `src/components/dashboard/ImageUpload.tsx:95` | alt="Preview" → Traducido a "Vista previa" | ✅ Corregido |

### Imports sin usar encontrados y corregidos ✅

| # | Severidad | Archivo | Descripción | Estado |
|---|-----------|---------|-------------|--------|
| 13 | 🟢 Menor | `src/components/dashboard/ImageUpload.tsx:2` | Import `Upload` de lucide-react no utilizado → Eliminado | ✅ Corregido |

### console.log() en producción

| # | Severidad | Archivo | Descripción | Estado |
|---|-----------|---------|-------------|--------|
| — | — | — | No se encontraron `console.log()` sueltos | ✅ Limpio |

> **Nota:** Se encontraron `console.error()` y `console.warn()` en: `src/main.tsx:34` (error fatal de bootstrap), `src/hooks/use-quiz.ts:351,373` (warnings/errors de envío de email), `src/pages/NotFound.tsx:8` (log de 404). Estos son logs legítimos de error/warning, no logs de depuración sueltos.

### TODO/FIXME/HACK comments

| # | Severidad | Archivo | Descripción | Estado |
|---|-----------|---------|-------------|--------|
| 14 | 🟢 Menor | `src/config/assets.ts:7` | `// TODO: Pegar aquí la URL del logo final una vez subido a Supabase.` — Pendiente de acción del dueño | Reportado |

### Texto en nombres de plataformas (no requiere traducción)

Los siguientes textos en inglés son **nombres propios de plataformas** que no se traducen:
- `WhatsApp`, `Facebook`, `X` — En botones de compartir (`ShareButtons.tsx`, `blog/ShareButtons.tsx`)
- `Blog` — Término universal usado en español
- `Instagram`, `TikTok` — Nombres de redes sociales en Footer

---

## 5. SEO Y META

### Configuración general ✅
- `index.html`: `<html lang="es">` ✅
- Título por defecto: "Nomadería - Aventuras y Senderismo" ✅ (español)
- Meta description por defecto: en español ✅
- og:image configurado con imagen de Supabase ✅

### Pages con SEO completo ✅
- `DestinationDetail.tsx` — Usa componente `SEO` con título, descripción e imagen dinámicos ✅
- `GearArticleDetail.tsx` — Usa `usePageMeta()` + `SEOHead` con título, descripción e imagen ✅
- `BlogPostDetail.tsx` — Usa `usePageMeta()` con fallbacks en español ✅
- `GearListing.tsx` — Usa `usePageMeta()` con título y descripción en español ✅
- `BlogListing.tsx` — Usa `usePageMeta()` con título y descripción en español ✅

### Pages con SEO incompleto

| # | Severidad | Archivo | Problema | Fix sugerido |
|---|-----------|---------|----------|--------------|
| 15 | 🔴 Crítico | `src/pages/Index.tsx` | Homepage no tiene `usePageMeta()` — depende solo del `<title>` por defecto de index.html. No establece description ni og:image dinámicamente. | Agregar `usePageMeta()` con título y descripción en español |
| 16 | 🔴 Crítico | `src/pages/Destinations.tsx` | Solo usa `useCanonical()`. No tiene título, descripción ni og:image. | Agregar `usePageMeta()` |

### Pages con SEO parcial (solo document.title)

Los siguientes pages usan `document.title` directamente pero no establecen meta description ni og:image:
- `src/pages/BudgetCalculator.tsx` — title: "Calculadora de Presupuesto | Nomaderia"
- `src/pages/Servicios.tsx` — title: "Servicios — Nomaderia"
- `src/pages/SobreNosotros.tsx` — title: "Sobre Nosotros — Nomaderia"
- `src/pages/PrivacyPolicy.tsx` — title: "Política de Privacidad — Nomaderia"
- `src/pages/TermsAndConditions.tsx` — title: "Términos y Condiciones — Nomaderia"

> **Recomendación:** Migrar estos a `usePageMeta()` para establecer title, description y og:image consistentemente.

### Meta Pixel placeholder

- `index.html:38` — Meta Pixel ID aún es placeholder: `'TU_PIXEL_ID_AQUI'`. Requiere Pixel ID real de Facebook Business Manager.

---

## Fixes Aplicados

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `src/components/landing/Navbar.tsx` | "Gear Guide" → "Guía de Equipo" |
| 2 | `src/components/landing/Footer.tsx` | "Gear Guide" → "Guía de Equipo" |
| 3 | `src/pages/GearListing.tsx` | "Gear Guide" → "Guía de Equipo" (título, SEO meta, JSON-LD, heading) |
| 4 | `src/pages/GearArticleDetail.tsx` | "Gear Guide" → "Guía de Equipo" (breadcrumbs, SEO meta, navegación, fallbacks) |
| 5 | `src/pages/admin/AdminEmailLogs.tsx` | "Gear Guide" → "Guía de Equipo" (label de tipo de email) |
| 6 | `src/components/dashboard/ImageUpload.tsx` | Eliminado import `Upload` sin usar de lucide-react |
| 7 | `src/components/dashboard/ImageUpload.tsx` | alt="Preview" → alt="Vista previa" |

---

## Issues que Requieren Acción Manual

1. **Auditar contenido de Supabase** — Revisar destinos, gear articles y blog posts desde el panel admin para verificar idioma, affiliate links, campos completos y slugs URL-friendly
2. **Agregar `usePageMeta()` a páginas con SEO incompleto** — Index.tsx, Destinations.tsx, BudgetCalculator.tsx, Servicios.tsx, SobreNosotros.tsx, PrivacyPolicy.tsx, TermsAndConditions.tsx
3. **Subir logo a Supabase** — Resolver el TODO en `src/config/assets.ts`
4. **Configurar Meta Pixel ID** — Reemplazar `TU_PIXEL_ID_AQUI` en index.html
5. **Verificar affiliate links** — Revisar que todos los links de Amazon usen `tag=nomaderia-20` y apunten a amazon.com.mx
