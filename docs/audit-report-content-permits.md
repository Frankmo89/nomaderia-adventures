## Status summary
`tsc --noEmit`: **EXIT:0**.

La superficie nueva (helpers compartidos, pipelines de gear/blog, permisos y dashboard extendido) está mayormente saludable: auth y refusal handling están centralizados en los helpers compartidos para los flujos AI auditados, los retornos de Edge Functions mantienen `corsHeaders`, los flujos de insert + `ai_content_meta` en gear/blog/permit windows son no bloqueantes y post-insert como se espera, y el cron de permisos respeta idempotencia por estado. El riesgo crítico real está en el matching exacto `park`/`permit_name` entre captura en `/gracias` y ventanas curadas en admin.

## Auto-fixes applied
- [src/hooks/use-permit-alert.ts](src/hooks/use-permit-alert.ts#L1): removido cast obsoleto `as unknown as SupabaseClient`; uso directo de `supabase` tipado.
- [src/pages/admin/AdminPermitAlerts.tsx](src/pages/admin/AdminPermitAlerts.tsx#L1): removido cast obsoleto `as unknown as SupabaseClient`; uso directo de `supabase` tipado.
- [src/pages/admin/AdminPermitWindows.tsx](src/pages/admin/AdminPermitWindows.tsx#L1): removido cast obsoleto `as unknown as SupabaseClient`; uso directo de `supabase` tipado para `permit_windows` y `ai_content_meta`.
- [src/pages/admin/AdminGearArticleForm.tsx](src/pages/admin/AdminGearArticleForm.tsx#L1): removido cast obsoleto para escritura de `ai_content_meta`.
- [src/pages/admin/AdminBlogPostForm.tsx](src/pages/admin/AdminBlogPostForm.tsx#L1): removido cast obsoleto para escritura de `ai_content_meta`.
- [src/pages/admin/AdminDashboard.tsx](src/pages/admin/AdminDashboard.tsx#L137): removidos casts obsoletos en queries de `sentinel_leads` (se mantiene cast global `db` por `destination_ai_meta` no tipada en generated types).
- [supabase/functions/discover-permit-windows/index.ts](supabase/functions/discover-permit-windows/index.ts#L1): eliminado código muerto duplicado (`hasRefusal`/`getOutputText` local) para evitar divergencia con `callResponses` compartido.

## Bugs found
- [HIGH] [supabase/functions/check-permit-alerts/index.ts](supabase/functions/check-permit-alerts/index.ts#L206): matching de alertas por igualdad exacta (`.eq("park", windowItem.park)` y `.eq("permit_name", windowItem.permit_name)`).
  - Riesgo real: un cliente puede guardar “Yosemite” desde [src/pages/Gracias.tsx](src/pages/Gracias.tsx#L78) y el admin tener “Yosemite National Park” en ventanas; no habrá match y no se enviará email.
  - Estado actual de normalización:
    - En `/gracias`: `park` puede venir de lista controlada o custom; custom sí se `trim`, lista no se normaliza adicionalmente; `permit_name` sí se `trim` ([src/pages/Gracias.tsx](src/pages/Gracias.tsx#L48), [src/pages/Gracias.tsx](src/pages/Gracias.tsx#L79)).
    - En admin permit windows: en guardado manual se usa `trim` para `park`/`permit_name` ([src/pages/admin/AdminPermitWindows.tsx](src/pages/admin/AdminPermitWindows.tsx#L218)); en guardado de draft también ([src/pages/admin/AdminPermitWindows.tsx](src/pages/admin/AdminPermitWindows.tsx#L308)).
    - En cron no hay `trim/lowercase/unaccent` ni mapping semántico.
- [MED] [src/pages/admin/AdminBlogPostForm.tsx](src/pages/admin/AdminBlogPostForm.tsx#L397): `meta_description` no tiene `maxLength` en UI ni validación al guardar; el schema AI sí limita a 160 en backend ([supabase/functions/generate-blog-draft/index.ts](supabase/functions/generate-blog-draft/index.ts#L130)), pero edición manual puede romper el límite SEO.

## Token efficiency findings
- `max_output_tokens` está configurado en todos los llamados Responses auditados:
  - Gear discover: [supabase/functions/discover-trending-gear/index.ts](supabase/functions/discover-trending-gear/index.ts#L141)
  - Gear Step A/B: [supabase/functions/generate-gear-draft/index.ts](supabase/functions/generate-gear-draft/index.ts#L271), [supabase/functions/generate-gear-draft/index.ts](supabase/functions/generate-gear-draft/index.ts#L287)
  - Blog discover: [supabase/functions/discover-trending-blog/index.ts](supabase/functions/discover-trending-blog/index.ts#L154)
  - Blog Step A/B: [supabase/functions/generate-blog-draft/index.ts](supabase/functions/generate-blog-draft/index.ts#L261), [supabase/functions/generate-blog-draft/index.ts](supabase/functions/generate-blog-draft/index.ts#L281)
  - Permit windows Step A/B: [supabase/functions/discover-permit-windows/index.ts](supabase/functions/discover-permit-windows/index.ts#L236), [supabase/functions/discover-permit-windows/index.ts](supabase/functions/discover-permit-windows/index.ts#L252)
- Step A -> Step B se pasa como JSON compacto (`JSON.stringify(stepA)`) en gear/blog/permit windows:
  - [supabase/functions/generate-gear-draft/index.ts](supabase/functions/generate-gear-draft/index.ts#L298)
  - [supabase/functions/generate-blog-draft/index.ts](supabase/functions/generate-blog-draft/index.ts#L292)
  - [supabase/functions/discover-permit-windows/index.ts](supabase/functions/discover-permit-windows/index.ts#L274)
- Few-shot bloqueado/capado (sin markdown completo):
  - Gear `slice(0, 1600)` en [supabase/functions/generate-gear-draft/index.ts](supabase/functions/generate-gear-draft/index.ts#L188)
  - Blog `slice(0, 2000)` en [supabase/functions/generate-blog-draft/index.ts](supabase/functions/generate-blog-draft/index.ts#L177)
- Catálogo capado en prompt para discover:
  - Gear `slice(0, 40)` en [supabase/functions/discover-trending-gear/index.ts](supabase/functions/discover-trending-gear/index.ts#L44)
  - Blog `slice(0, 40)` + query `limit(40)` en [supabase/functions/discover-trending-blog/index.ts](supabase/functions/discover-trending-blog/index.ts#L44), [supabase/functions/discover-trending-blog/index.ts](supabase/functions/discover-trending-blog/index.ts#L143)
- Hallazgo de eficiencia (bajo): discover gear no limita query SQL antes de construir prompt (trae todo `slug,title` y luego recorta en memoria); ver [supabase/functions/discover-trending-gear/index.ts](supabase/functions/discover-trending-gear/index.ts#L126). Impacto estimado: bajo a medio en proyectos con muchos artículos.

## Recommendations
- [IMPACT: high] [EFFORT: medium] Resolver mismatch de park/permit con normalización y/o identificador canónico compartido entre captura y ventanas (ej. `park_key`/`permit_key`), en vez de matching literal por texto. Puntos de referencia: [src/pages/Gracias.tsx](src/pages/Gracias.tsx#L78), [src/pages/admin/AdminPermitWindows.tsx](src/pages/admin/AdminPermitWindows.tsx#L218), [supabase/functions/check-permit-alerts/index.ts](supabase/functions/check-permit-alerts/index.ts#L206).
- [IMPACT: med] [EFFORT: low] Enforce de `meta_description <= 160` también en UI/payload de admin blog (no solo en schema AI). Punto: [src/pages/admin/AdminBlogPostForm.tsx](src/pages/admin/AdminBlogPostForm.tsx#L397).
- [IMPACT: med] [EFFORT: low] Agregar `.limit(40)` en discover gear para alinear con blog y reducir lectura innecesaria de DB. Punto: [supabase/functions/discover-trending-gear/index.ts](supabase/functions/discover-trending-gear/index.ts#L126).
- [IMPACT: low] [EFFORT: low] Revisar y retirar casts restantes fuera de este alcance cuando aplique regeneración completa de tipos (`destination_ai_meta` todavía no tipada). Referencia: [src/pages/admin/AdminDashboard.tsx](src/pages/admin/AdminDashboard.tsx#L73).

## Fixes applied — park matching
- Fuente canónica compartida creada en [src/lib/parks.ts](src/lib/parks.ts#L1) con `PARK_NAMES` y tipo `ParkName`.
- `/gracias` ahora usa select desde la lista canónica y opción `Otro`; cuando el usuario escribe parque custom se guarda explícitamente como `Otro: <texto>` para evitar ambigüedad, en [src/pages/Gracias.tsx](src/pages/Gracias.tsx#L41).
- Admin de ventanas de permiso (manual create/edit) ahora usa select canónico, en [src/pages/admin/AdminPermitWindows.tsx](src/pages/admin/AdminPermitWindows.tsx#L392).
- Editor de borrador de ventanas también usa select canónico (con fallback para valor IA no catalogado), en [src/components/admin/PermitWindowDraftEditor.tsx](src/components/admin/PermitWindowDraftEditor.tsx#L38).
- Cron `check-permit-alerts` dejó de matchear por `permit_name` estricto y ahora matchea por parque normalizado (`trim + lowercase`) + año, en [supabase/functions/check-permit-alerts/index.ts](supabase/functions/check-permit-alerts/index.ts#L247).
- El email de cron ahora incluye todas las ventanas activas del parque+año en próximos 7 días y destaca `Lo que pediste` si hay coincidencia de permiso, en [supabase/functions/check-permit-alerts/index.ts](supabase/functions/check-permit-alerts/index.ts#L99).
- Se mantiene idempotencia: solo alertas `active` y update a `notified` únicamente después de envío exitoso, en [supabase/functions/check-permit-alerts/index.ts](supabase/functions/check-permit-alerts/index.ts#L303).

