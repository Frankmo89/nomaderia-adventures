# Auditoría — Sección Admin "Solicitudes de Itinerario"

> **Fecha:** 2026-06-09 · **Alcance:** solo lectura, sin cambios de código.

---

## 1. Componente y ruta

| Ítem | Valor |
|------|-------|
| Ruta principal | `/admin/itinerary-requests` |
| Componente | `src/pages/admin/AdminItineraryRequests.tsx` |
| Registro en router | `App.tsx` línea 107 — `<Route path="itinerary-requests" element={<AdminItineraryRequests />} />` (lazy via `lazyWithRetry`) |
| También aparece en | `/admin/leads` → `src/pages/admin/AdminLeads.tsx` (bandeja unificada Sentinel + Quiz + Itinerario) |
| Protección de ruta | `AdminLayout.tsx` — verifica sesión activa + RPC `has_role(..., 'admin')` antes de renderizar cualquier sub-ruta |

La página renderiza la tabla con columnas: Nombre, Email, Destino, Presupuesto, Mensaje, Estado, Acción (WA), Fecha — exactamente lo descrito en el ticket.

---

## 2. Tabla(s) de Supabase y columnas

### `public.itinerary_requests` (tabla principal)

**Migración original:** `supabase/migrations/20260218210000_add_itinerary_requests.sql`

| Columna | Tipo | Restricción | Notas |
|---------|------|-------------|-------|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `name` | `text` | NOT NULL | Nombre del solicitante |
| `email` | `text` | NOT NULL | |
| `destination` | `text` | NOT NULL | Texto libre |
| `estimated_budget` | `text` | nullable | Slugs: `menos-de-500`, `500-1000`, `1000-2500`, `2500-5000`, `mas-de-5000` |
| `message` | `text` | nullable | Comentarios adicionales del usuario |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | |

**Migración posterior:** `supabase/migrations/20260604061822_add_lead_status_tracking.sql`

| Columna añadida | Tipo | Restricción | Notas |
|-----------------|------|-------------|-------|
| `status` | `lead_status` (enum) | NOT NULL, DEFAULT `'nuevo'` | Valores: `nuevo`, `contactado`, `convertido` |
| `contacted_at` | `timestamptz` | nullable | Se llena automáticamente al marcar como "contactado" |

Los tipos generados en `src/integrations/supabase/types.ts` (líneas 272–304) reflejan correctamente todas las columnas incluyendo `status` y `contacted_at`.

### Tabla secundaria consultada por el componente

`admin_events` — consultada en un segundo `useEffect` para mostrar "Último contacto: hace Nd" por email. El componente filtra `event_type = "whatsapp_click"` y construye un mapa `email → latest created_at`.

---

## 3. Inserciones públicas — ¿hay algún formulario activo?

**Resultado: NO hay ningún formulario público que escriba a `itinerary_requests` en la versión actual del código.**

Búsqueda exhaustiva de `.insert(` en `src/`:

| Archivo | Tabla destino |
|---------|---------------|
| `src/lib/admin-tracking.ts` | `admin_events` |
| `src/hooks/use-permit-alert.ts` | `permit_alerts` |
| `src/pages/SentinelLanding.tsx` | `sentinel_leads` |
| `src/hooks/use-media.ts` | `media_slider` |
| `src/hooks/use-quiz.ts` | `newsletter_subscribers`, `quiz_responses` |
| `src/pages/BudgetCalculator.tsx` | `newsletter_subscribers` |
| `src/components/landing/NewsletterSignup.tsx` | `newsletter_subscribers` |
| `src/pages/admin/AdminGearArticleForm.tsx` | `gear_articles` |
| `src/pages/admin/AdminDestinationForm.tsx` | `destinations` |
| `src/pages/admin/AdminPermitWindows.tsx` | `permit_windows` |
| `src/pages/admin/AdminBlogPostForm.tsx` | `blog_posts` |

`itinerary_requests` no aparece en ninguna. La búsqueda también cubrió `supabase/functions/` — sin resultados.

**Contexto histórico:** `PremiumItinerarySection.tsx` tenía originalmente un Dialog con formulario React Hook Form que escribía a `itinerary_requests` (confirmado en `nomaderia-context.OLD.md` y en el changelog de `pending-tasks.md` entrada de Marzo 2026). Ese formulario fue eliminado; el componente hoy solo contiene CTAs de WhatsApp sin lógica de inserción.

**Implicación:** La política RLS de INSERT (`FOR INSERT TO anon, authenticated WITH CHECK (true)`) sigue activa en la base de datos aunque ningún frontend la use actualmente. El endpoint público está abierto.

---

## 4. RLS, triggers y Edge Functions

### Políticas RLS (fuente: `20260218210000_add_itinerary_requests.sql`)

| Nombre | Operación | Roles | Condición |
|--------|-----------|-------|-----------|
| `"Anyone can submit itinerary request"` | INSERT | `anon`, `authenticated` | `WITH CHECK (true)` |
| `"Admins can view itinerary requests"` | SELECT | `authenticated` | `USING (public.has_role(auth.uid(), 'admin'))` |

No existe política de UPDATE ni DELETE para ningún rol público. La actualización de `status`/`contacted_at` desde el admin funciona porque el cliente usa la sesión autenticada de admin y `has_role` devuelve true — pero no hay política `FOR UPDATE` explícita. Esto es un posible gap: si RLS fuerza `UPDATE` a pasar por una policy, el update silenciará errores a menos que `has_role` cubra implícitamente UPDATE (que no lo cubre según las migraciones auditadas).

**No hay triggers** definidos sobre `itinerary_requests` en ninguna migración.

**No hay Edge Functions** que referencien `itinerary_requests` en `supabase/functions/`.

### Columnas añadidas sin nueva política

La migración `20260604061822_add_lead_status_tracking.sql` añadió `status` y `contacted_at` pero **no añadió políticas de UPDATE**. Los writes de status desde `AdminItineraryRequests.tsx` y `AdminLeads.tsx` usarán la sesión del admin autenticado — verificar que `has_role` cubra UPDATE en prod o que Supabase no lo bloquee.

---

## 5. Referencias en el resto del proyecto

| Archivo | Tipo de acceso | Qué hace |
|---------|----------------|----------|
| `src/pages/admin/AdminDashboard.tsx` (líneas 156, 242, 243) | SELECT count | Stat card "Itinerarios" en el dashboard + delta 7d/14d |
| `src/pages/admin/AdminLeads.tsx` (líneas 48, 105) | SELECT (id, name, email, destination, created_at, status, contacted_at) | Bandeja unificada `/admin/leads` |
| `src/components/admin/LeadStatusBadge.tsx` (línea 16) | — | `LeadTable` type union incluye `"itinerary_requests"` para los UPDATEs de status |
| `src/pages/admin/AdminItineraryRequests.tsx` (líneas 110, 162, 306) | SELECT + UPDATE | Pantalla principal de la sección |
| `docs/supabase-schema.md` | Documentación | Registra la tabla pero le faltan las columnas `status` y `contacted_at` (desfase de docs) |
| `docs/claude-context.md` (Section 1.2, 5.4) | Documentación | Documenta la tabla y confirma que no hay form público activo |
| `docs/content-strategy.md` | Referencia | Menciona el formulario como canal de servicio (dato histórico) |

---

## 6. Hallazgos y observaciones

1. **Sin forma pública activa.** La tabla existe, la RLS de INSERT está abierta, pero ningún componente público actualmente inserta en ella. Los leads de itinerario deben llegar por WhatsApp; la tabla podría recibir inserciones solo desde un formulario futuro.

2. **Gap de política UPDATE.** Las migraciones no definen `FOR UPDATE` explícitamente en `itinerary_requests`. Los writes de status/contacted_at desde el admin dependen de que el rol autenticado con `has_role` pueda escribir — esto debería verificarse contra el behavior real de Supabase (si no hay policy de UPDATE, Supabase bloquea por defecto con RLS habilitado).

3. **Desfase en `supabase-schema.md`.** Las columnas `status` (enum `lead_status`) y `contacted_at` (timestamptz) añadidas en junio 2026 no están documentadas en `docs/supabase-schema.md`.

4. **Tipos generados sí están al día.** `src/integrations/supabase/types.ts` incluye correctamente `status` y `contacted_at` en `itinerary_requests.Row/Insert/Update`.

5. **INSERT policy abierta sin uso.** Si se decide no recibir más solicitudes por este canal, conviene revocar o restringir la política de INSERT — aunque hacerlo sería un cambio de migración (fuera del alcance de esta auditoría).
