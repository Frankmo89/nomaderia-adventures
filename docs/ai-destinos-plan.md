# 🏔️ PLAN MAESTRO — "Destino Inteligente"

> ⛔ **RETIRADO (2026-07-19).** El flujo de descubrimiento/borrador IA de
> **destinos** descrito aquí se eliminó del código: el catálogo de 63 parques
> está completo y cerrado (ver ADR-017 en `docs/decisions.md`). NO
> re-implementar nada de este documento para destinos. Se conserva solo como
> referencia histórica de la arquitectura, que **sigue viva en Gear y Blog**
> (`discover-trending-gear/blog`, `generate-gear/blog-draft`, `ai_content_meta`).

### IA para descubrir y desarrollar destinos en Nomaderia, sin alucinaciones, con voz propia
**Versión final · Listo para ejecutar**

> **Para Frank.** Este es el documento único de la fase de **Destinos**. Ábrelo y ejecuta de arriba a abajo.
> Los prompts para **GitHub Copilot Agent** están en inglés, listos para copiar/pegar EN ORDEN.
> Gear, Blog y el Concierge reutilizan esta arquitectura (sección 12).
>
> **Guárdalo como** `docs/ai-destinos-plan.md`.

---

## 0. TL;DR — Qué vas a tener al terminar

Un panel en `/admin/destinations` que, con dos clics, **descubre hikes trending** para tu audiencia y
**desarrolla la ficha completa** —con la voz de Nomaderia, datos de fuentes oficiales verificables, e
índice de confianza— pre-llenando el formulario que ya tienes. Las fuentes se guardan en privado solo
para ti. Nada se publica sin tu revisión. Y tu dashboard te muestra cuántas horas llevas ahorradas.

---

## 1. El flujo completo

```
ADMIN · /admin/destinations
  │  [ ✦ Descubrir Trending ]  ← clic 1
  ▼
Edge Function: discover-trending-destinations   (1 llamada)
  · OpenAI Responses API + web_search
  · Lee tus slugs existentes → NO sugiere duplicados
  · Devuelve 6–8 candidatos: título, país, por qué trending, dificultad, fuentes
  ▼
Tarjetas de candidatos  →  [ Desarrollar este → ]  ← clic 2  →  /admin/destinations/new?candidate=...
  ▼
Edge Function: generate-destination-draft   (2 llamadas)
  · Importa NOMADERIA_SOUL (voz compartida) + tu mejor destino como ejemplo
  · LLAMADA 1 (research): web_search → datos reales + URLs
  · LLAMADA 2 (estructura): json_schema strict → mapea a tu tabla
  · Devuelve { draft, sources, verify_flags, model }
  │  (progreso por etapas: "Buscando fuentes… Redactando… Verificando…")
  ▼
AdminDestinationForm PRE-LLENADO
  · Índice de confianza:  "9 de 13 campos verificados con fuente"
  · Panel "Fuentes (privado)" · campos sensibles marcados ⚠ Verificar
  · hero_image / galería / afiliados → los pones TÚ
  ▼
Guardas → destino con is_published=false  +  fuentes en tabla privada destination_ai_meta
  ▼
Dashboard: "N destinos generados con IA · ~H horas ahorradas"
```

---

## 2. Decisiones de arquitectura (el porqué)

- **OpenAI Responses API:** única que combina `web_search` (tool) con structured outputs (`text.format` + `json_schema`).
- **Anti-alucinación = 2 llamadas en la generación:** research con web → estructura sin web (strict). Sin fuente, el campo va vacío y entra a `verify_flags`. La generación nunca rellena huecos inventando.
- **Discovery = 1 llamada:** lista corta de candidatos; no necesita doble paso.
- **Voz propia (SOUL):** la identidad/voz de Nomaderia vive en `supabase/functions/_shared/nomaderia-soul.ts` y la importan TODAS las funciones de IA. Una sola voz, muchas tareas.
- **Few-shot dinámico:** la generación lee tu mejor destino publicado y lo usa como ejemplo de estilo, junto al SOUL.
- **Fuentes privadas:** en tabla aparte `destination_ai_meta` con RLS solo-admin (el RLS filtra filas, no columnas → en `destinations` el público las vería).
- **La IA NO toca** imágenes ni afiliados (tu Regla de Oro #7). **Nunca auto-publica** (`is_published=false`).

---

## 3. Las 6 reglas anti-alucinación (van en los system prompts)

1. Toda afirmación factual sale de `web_search`. Sin fuente → no se afirma.
2. Datos sensibles siempre en `verify_flags`: `estimated_budget_usd`, `best_season`, permisos/cuotas, fechas.
3. Las fuentes se devuelven, se guardan (privadas) y se muestran clicables.
4. Prohibido inventar precios, permisos o fechas. Vacío es mejor que falso.
5. Hecho ≠ redacción: los datos vienen de la web; el tono viene del SOUL + tu destino de ejemplo.
6. Nada se publica solo. Borrador siempre.

---

## 4. Seguridad y costo

- `OPENAI_API_KEY` y `OPENAI_MODEL` en Supabase Secrets. Nunca en el bundle ni en git.
- Ambas Edge Functions validan **admin** (`has_role` con el JWT del caller) **antes** de llamar a OpenAI.
- Costo: descubrir ≈ 1 llamada; desarrollar ≈ 2 llamadas. Centavos por destino.

---

## 5. ✅ Checklist de TUS tareas (humanas — Copilot no puede hacerlas)

- [ ] **(Paso 0)** Setear secrets: `OPENAI_API_KEY`, `OPENAI_MODEL`.
- [ ] **(Antes del Paso 2)** Subir `docs/NOMADERIA_SOUL.md` al repo (el archivo que ya tienes).
- [ ] **(Tras el Paso 1)** Aplicar la migración y regenerar tipos de Supabase (`SUPABASE_ACCESS_TOKEN`).
- [ ] **(Paso 9)** Deploy de las 2 Edge Functions + prueba de humo.

> Orden recomendado para no frustrarte: Paso 0 → pídele a Copilot los Pasos 1–5 (backend + tipos, no ves nada aún) → aplica migración + regenera tipos → Pasos 6–8 (la UI, donde ya ves la magia) → Paso 9 (deploy y prueba).

---

# PASOS DE EJECUCIÓN

> Regla de oro: no avances al siguiente paso hasta que el anterior pase `tsc --noEmit` + `npm run build`.

---

## PASO 0 — (HUMANO) Secrets de OpenAI

```bash
supabase secrets set OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
supabase secrets set OPENAI_MODEL=gpt-5.2
```
> Verifica crédito en platform.openai.com. Si OpenAI saca un modelo mejor, solo cambias el secret.

---

## PASO 1 — Migración: tabla privada `destination_ai_meta`

```
Read CLAUDE.md and use @workspace.

TASK: Create a new Supabase migration under supabase/migrations/ (follow the timestamp naming of existing
migration files) that creates a private, admin-only provenance table.

TABLE public.destination_ai_meta:
  id UUID PK DEFAULT gen_random_uuid()
  destination_id UUID REFERENCES public.destinations(id) ON DELETE CASCADE NOT NULL
  sources JSONB NOT NULL DEFAULT '[]'::jsonb        -- [{title,url,used_for}]
  verify_flags JSONB NOT NULL DEFAULT '[]'::jsonb   -- ["estimated_budget_usd", ...]
  model TEXT
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  UNIQUE (destination_id)

ENABLE RLS. Add ONE policy mirroring the existing destinations admin policy style exactly
(see the blog_posts RLS migration and other "Admins can manage" policies):
  CREATE POLICY "Admins manage destination_ai_meta" ON public.destination_ai_meta
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
NO public/anon SELECT policy — admin-only on purpose.

DO NOT: modify the destinations table or any other table; change has_role or any auth function; edit
src/integrations/supabase/types.ts (CLI-regenerated — human task).

WHEN DONE: add a note in docs/pending-tasks.md under "Pendientes Humanos" reminding Frank to (a) apply the
migration and (b) regenerate types:
  npx supabase gen types typescript --project-id vrixiuvnhvqafmxlcyex > src/integrations/supabase/types.ts
Output only the migration SQL. Confirm valid Postgres.
```

> **(HUMANO)** Aplica la migración y regenera los tipos. Hasta entonces, el código que escriba a esta tabla
> usará el patrón de cast documentado del repo (ADR-009, `as unknown as`) — nunca `any`.

---

## PASO 2 — Voz compartida: `_shared/nomaderia-soul.ts`

> **Requisito:** el archivo `docs/NOMADERIA_SOUL.md` ya debe estar en el repo.

```
Read CLAUDE.md and use @workspace.

TASK: Create supabase/functions/_shared/nomaderia-soul.ts — the single shared brand voice/identity used by
all Nomaderia AI Edge Functions.

CONTENT: Transcribe the FULL content of docs/NOMADERIA_SOUL.md verbatim into an exported TypeScript template
string constant named NOMADERIA_SOUL (keep the Spanish text exactly as written, including section headers).
Example shape:
  export const NOMADERIA_SOUL = `...full markdown content here...`;

Add a short top comment (in Spanish) explaining: this is the runtime mirror of docs/NOMADERIA_SOUL.md; when
the voice changes, edit the .md and re-sync this file. Keep it pure data — no logic, no imports.

DO NOT: add npm deps; edit any other file; change auth or any function logic.

WHEN DONE: append a changelog entry to docs/pending-tasks.md noting the shared SOUL file was created and
that docs/NOMADERIA_SOUL.md is its source of truth. Confirm valid Deno/TypeScript.
```

---

## PASO 3 — Edge Function: `discover-trending-destinations` (1 llamada + dedup)

```
Read CLAUDE.md and use @workspace.

TASK: Create supabase/functions/discover-trending-destinations/index.ts

PURPOSE: Use the OpenAI Responses API with web_search to find 6-8 currently trending hikes/outdoor
destinations for Nomaderia's audience (Spanish-speaking US-resident beginners; bias toward US National
Parks and accessible trails; world-famous bucket-list hikes allowed). Exclude destinations Nomaderia
already has.

MIRROR the existing pattern in supabase/functions/send-quiz-email/index.ts:
- serve from "https://deno.land/std@0.168.0/http/server.ts"
- Deno.env.get OPENAI_API_KEY (required), OPENAI_MODEL (default "gpt-5.2")
- same corsHeaders + OPTIONS preflight, same try/catch + status codes, logging prefix "[discover-trending-destinations]"
- throw a clear error if OPENAI_API_KEY missing

AUTH (reuse, do NOT change auth logic):
- Read "Authorization" header. createClient (esm.sh/@supabase/supabase-js@2.48.0) with SUPABASE_URL +
  SUPABASE_ANON_KEY and global.headers.Authorization = incoming header.
- getUser(); 401 if none. rpc("has_role",{_user_id:user.id,_role:"admin"}); 403 if not admin (before any OpenAI call).

DEDUP:
- With a SERVICE-ROLE client (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY), select `slug, title` from
  destinations. Pass that list into the prompt; instruct the model to EXCLUDE anything matching an existing slug/title.

OPENAI (single call):
- POST https://api.openai.com/v1/responses, model OPENAI_MODEL, tools:[{ "type":"web_search" }]
- text.format = strict json_schema "trending_candidates": object { candidates: array of
  { title:string, country:string, suggested_slug:string (kebab-case), reason_trending:string,
    difficulty_level:string enum ["easy","moderate","challenging"], sources: array of {title:string, url:string} } }
  Strict: every property in "required", additionalProperties:false.

REFUSAL: if OpenAI returns a refusal, return 422 with a Spanish message; never JSON.parse a refusal.

RESPONSE: { candidates:[...] }, status 200, corsHeaders, Content-Type application/json.

DO NOT: change auth; modify other functions; add npm deps; output user-facing English (client errors in Spanish).

WHEN DONE: append a changelog entry to docs/pending-tasks.md. Confirm valid Deno/TypeScript.
```

---

## PASO 4 — Edge Function: `generate-destination-draft` (2 llamadas + SOUL + few-shot)

```
Read CLAUDE.md and use @workspace.

TASK: Create supabase/functions/generate-destination-draft/index.ts

PURPOSE: Given { title, country, suggested_slug? }, produce a COMPLETE draft mapping 1:1 to
public.destinations columns, in Nomaderia's voice, grounded only in real web sources. Does NOT write to DB.

BODY: { title:string, country:string, suggested_slug?:string }. 400 (Spanish) if title or country missing.

MIRROR send-quiz-email pattern (serve, corsHeaders, OPTIONS, Deno.env.get OPENAI_API_KEY + OPENAI_MODEL
default "gpt-5.2", try/catch, status codes, logging prefix "[generate-destination-draft]").

VOICE: import { NOMADERIA_SOUL } from "../_shared/nomaderia-soul.ts" and place it at the TOP of the Step B
system prompt as the brand voice/identity. This replaces any ad-hoc voice description.

AUTH: identical admin check as PASO 3 (reuse has_role with caller JWT; 401/403). Do NOT change auth.

FEW-SHOT (before the OpenAI calls): with a SERVICE-ROLE client, fetch ONE example destination — prefer
is_published=true AND featured=true, else most recent is_published=true. Select short_description,
full_guide_markdown, common_fears. If found, include it in the Step B system prompt as
"EXAMPLE OF NOMADERIA'S VOICE — match this tone and structure, write fresh original content." If none, proceed without it.

OPENAI (two-step):
Step A (research) — POST /v1/responses, model OPENAI_MODEL, tools:[{ "type":"web_search" }]:
  Research THIS destination for a Spanish-speaking BEGINNER hiker from the US. Gather WITH SOURCE URLS:
  best season, days needed, permit/reservation rules + fees (prefer recreation.gov, nps.gov, official park
  sites), rough USD budget, physical prep, gear to bring, a simple itinerary, common beginner fears with
  honest answers. Rule: "If a fact (price, permit, season dates, budget) is not confirmed by a source, do
  NOT invent it — mark it unknown."

Step B (structure) — POST /v1/responses, NO tools, text.format = strict json_schema "destination_draft".
  Object (all properties required, additionalProperties:false; nullable -> ["string","null"]/["integer","null"]):
    title:string, slug:string(kebab-case), country:string, region:["string","null"],
    short_description:string, difficulty_level:enum["easy","moderate","challenging"],
    difficulty_description:["string","null"], days_needed:["string","null"], best_season:["string","null"],
    estimated_budget_usd:["integer","null"], preparation_plan:string(markdown), gear_list_markdown:string(markdown),
    itinerary_markdown:string(markdown), full_guide_markdown:string(markdown),
    common_fears: array of { question:string, answer:string },
    experience_type:["string","null"], tags: array of string,
    verify_flags: array of string, sources: array of { title:string, url:string, used_for:string }
  System prompt = NOMADERIA_SOUL + (few-shot example if available) + the structuring instruction. Forbid
  fabricating facts; if unsourced, leave field null and add its name to verify_flags. ALL human-readable
  content in Spanish. Pass Step A output as the material to structure.

FIELDS THE AI MUST NOT GENERATE (not in schema): hero_image_url, gallery_images, affiliate_links,
has_premium_itinerary, premium_itinerary_price, is_published, featured.

REFUSAL: check before parsing; 422 + Spanish message on refusal.

RESPONSE: { draft, sources, verify_flags, model } (model = the model name used, for storage in destination_ai_meta).
Status 200, corsHeaders.

DO NOT: change auth; modify other functions; add npm deps; write the DB; output user-facing English.

WHEN DONE: append a changelog entry to docs/pending-tasks.md. Confirm valid Deno/TypeScript.
```

---

## PASO 5 — Hooks de cliente + tipos

```
Read CLAUDE.md and use @workspace.

TASK: Create typed React hooks wrapping the two Edge Functions, following src/hooks/use-quiz.ts (which uses
supabase.functions.invoke). Use TanStack React Query useMutation. NO direct fetch in components.

FILE 1: src/hooks/use-trending-destinations.ts
  useTrendingDestinations → mutation calling invoke("discover-trending-destinations"); returns typed
  candidates + isPending + error.

FILE 2: src/hooks/use-destination-draft.ts
  useDestinationDraft → mutation calling invoke("generate-destination-draft", { body:{ title, country, suggested_slug }});
  returns typed { draft, sources, verify_flags, model } + isPending + error.

TYPES: src/types/ai-destinations.ts (create src/types/ if needed): TrendingCandidate, DraftSource,
DestinationDraft, GenerateDraftResponse, DiscoverResponse. Field names must match the Edge Function
responses exactly. NO `any` anywhere.

DO NOT: edit src/integrations/supabase/types.ts (CLI-regenerated — human); add npm deps; place files in src/pages/.

WHEN DONE: tsc --noEmit (0 errors) + npm run build. Append a changelog entry to docs/pending-tasks.md.
```

---

## PASO 6 — UI de descubrimiento en `AdminDestinations`

```
Read CLAUDE.md and use @workspace.

TASK: Add an AI discovery panel to src/pages/admin/AdminDestinations.tsx WITHOUT breaking the existing
list/CRUD. Match admin styling (dark sidebar variant, shadcn Button, primary #D97706, Playfair titles,
Inter body, lucide-react icons already available e.g. Sparkles).

REQUIREMENTS:
- Button "✦ Descubrir Trending" near the existing "+ Nuevo Destino".
- On click, call useTrendingDestinations (PASO 5).
- STAGED PROGRESS (client-side, NOT real streaming — note this in code comments): while pending, rotate
  Spanish status messages every few seconds: "Buscando hikes en tendencia…", "Filtrando para principiantes…",
  "Reuniendo fuentes…".
- Render candidates as a mobile-first responsive grid of cards: title, country, reason_trending, difficulty
  badge (reuse list badge style), small clickable source links (target="_blank" rel="noopener noreferrer").
- Each card: primary button "Desarrollar este →" → navigate to /admin/destinations/new?candidate=<encoded>
  with title, country, suggested_slug via encodeURIComponent (minimal payload).
- Error state: Spanish message + retry. All visible text in Spanish.

DO NOT: change the existing destinations query/table logic; direct fetch (use the hook); edit
src/components/ui/; create components in src/pages/ (reusable card → src/components/admin/, create folder if needed). No npm deps.

WHEN DONE: tsc --noEmit + npm run build. Append a changelog entry to docs/pending-tasks.md.
```

---

## PASO 7 — Pre-llenado + confianza + fuentes + slug guard + guardado privado en `AdminDestinationForm`

```
Read CLAUDE.md and use @workspace.

TASK: Make src/pages/admin/AdminDestinationForm.tsx auto-fill from an AI draft when opened with ?candidate=...
(from PASO 6), WITHOUT breaking the existing create/edit flow.

A) AUTO-FILL: On mount, if URL has candidate params (title, country, suggested_slug) AND no :id (new mode),
   call useDestinationDraft (PASO 5). STAGED PROGRESS overlay (client-side, not real streaming): rotate
   Spanish messages — "Buscando fuentes oficiales…", "Redactando con la voz de Nomaderia…", "Verificando datos…".
   Allow cancel. On result, populate ONLY: title, slug, country, region, short_description, difficulty_level,
   difficulty_description, days_needed, best_season, estimated_budget_usd, preparation_plan, gear_list_markdown,
   itinerary_markdown, full_guide_markdown, common_fears (map to existing {question,answer} shape),
   experience_type, tags. Leave hero_image_url, gallery_images, affiliate links, is_published, featured UNTOUCHED.

B) CONFIDENCE INDEX: compute client-side (tracked fields filled AND not in verify_flags / total tracked).
   Badge near the form title in Spanish: "Confianza: 9 de 13 campos verificados con fuente". Green (#166534)
   when high, amber/primary when flags remain.

C) SOURCES PANEL (private): collapsible admin card "Fuentes (privado)" listing draft.sources as clickable
   links (target="_blank" rel="noopener noreferrer") with used_for labels; note in Spanish they are saved
   privately for the admin only.

D) VERIFY BADGES: for each name in draft.verify_flags, show an inline "⚠ Verificar con la fuente" badge next to that field.

E) SLUG UNIQUENESS GUARD (before insert): after submit, check destinations for the same slug; if taken,
   append "-2","-3"… until unique and reflect it in the slug field. Use the existing supabase client; don't
   change unrelated query logic.

F) SAVE AI META (private): existing submit logic stays the same and still inserts with is_published=false.
   AFTER a successful insert of a NEW destination, take the returned id and upsert into destination_ai_meta:
   { destination_id, sources: draft.sources, verify_flags: draft.verify_flags, model: response.model }.
   Until types are regenerated, use the repo's documented cast pattern (ADR-009, `as unknown as`) — NOT `any`.
   If the ai_meta write fails, do NOT block saving the destination; log via existing pattern + non-blocking
   Spanish warning. In edit mode (:id present), skip AI and skip ai_meta writes.

DO NOT: change handleSubmit's destinations payload shape; change edit-mode behavior; direct fetch (use the
hook); edit src/components/ui/; use `any`. Reusable pieces → src/components/admin/. All visible text in Spanish.

WHEN DONE: tsc --noEmit + npm run build. Append a changelog entry to docs/pending-tasks.md confirming the
end-to-end flow: discover → pick → auto-fill → confidence/sources → save draft → ai_meta stored privately.
```

---

## PASO 8 — Tarjeta de métricas en el Dashboard (tu historia de LinkedIn)

```
Read CLAUDE.md and use @workspace.

TASK: Add a metrics card to src/pages/admin/AdminDashboard.tsx surfacing AI generation impact. Match existing
dashboard card styling; mobile-first.

REQUIREMENTS:
- Query count of rows in destination_ai_meta (admin-only; RLS already restricts it). Use the repo's documented
  cast pattern (ADR-009) until types are regenerated — NOT `any`.
- Card "Generación con IA": number of AI-generated destinations + estimated time saved = count * 2.5 hours,
  labeled clearly as an estimate in Spanish (e.g. "≈ 47 h ahorradas (estimado)").
- All visible text in Spanish.

DO NOT: change other dashboard queries; edit src/components/ui/; use `any`; create components in src/pages/.

WHEN DONE: tsc --noEmit + npm run build. Append a changelog entry to docs/pending-tasks.md.
```

---

## PASO 9 — (HUMANO + agente) Deploy y verificación

1. **Deploy** (tú, CLI):
   ```bash
   supabase functions deploy discover-trending-destinations
   supabase functions deploy generate-destination-draft
   ```
2. **Prueba de humo:**
   - `/admin/destinations` → "Descubrir Trending" → candidatos con fuentes, sin duplicar lo que ya tienes.
   - "Desarrollar este" → progreso por etapas → form lleno en ~30s, sonando a Nomaderia.
   - Revisa el índice de confianza; abre 1-2 fuentes para confirmar datos reales.
   - Verifica los campos ⚠ (presupuesto, temporada, permisos). Agrega imagen hero + afiliados.
   - Guarda como borrador → confirma que NO sale en el sitio público hasta publicar.
   - Confirma que las fuentes quedaron en `destination_ai_meta` y que el Dashboard cuenta +1.
3. **Si falla:** logs de la Edge Function en Supabase (prefijo `[generate-destination-draft]`).

---

## 🔵 PASO 10 (OPCIONAL · Fase 2) — Editor de voz desde el admin

> **No es necesario para arrancar.** Hazlo solo cuando la voz base ya esté validada y quieras afinarla SIN
> tocar código ni redeployar. Bonus: es un "editor de personalidad de IA" en tu panel — muy vendible en LinkedIn.
> Costo: otra tabla + regenerar tipos + las funciones leen el SOUL desde la DB (con `_shared/nomaderia-soul.ts`
> como fallback). Mantiene una sola fuente de verdad editable.

```
Read CLAUDE.md and use @workspace.

TASK (Phase 2, optional): Make the Nomaderia AI voice (SOUL) editable from the admin without redeploying.

1) MIGRATION: create public.ai_config (id UUID PK, key TEXT UNIQUE NOT NULL, content TEXT NOT NULL,
   updated_at TIMESTAMPTZ DEFAULT now()). ENABLE RLS with the same admin-only policy style as
   destination_ai_meta. Seed one row: key='nomaderia_soul', content = the current NOMADERIA_SOUL text.
   Remind Frank (docs/pending-tasks.md) to apply + regenerate types.

2) EDGE FUNCTIONS: in generate-destination-draft (and any future AI function), fetch ai_config where
   key='nomaderia_soul' via service-role client and use its content as the SOUL. If the query fails or is
   empty, fall back to the imported NOMADERIA_SOUL constant from "../_shared/nomaderia-soul.ts". Keep the
   constant as the safety net.

3) ADMIN UI: add a simple page at src/pages/admin/AdminVoice.tsx (route /admin/voice, add to AdminLayout
   links with a fitting lucide icon) with a textarea to view/edit the 'nomaderia_soul' content and a Save
   button (update ai_config). All visible text in Spanish. Use the documented cast pattern (ADR-009) until
   types are regenerated — NOT `any`.

DO NOT: change auth/has_role; edit src/components/ui/; add npm deps; break existing routes.

WHEN DONE: tsc --noEmit + npm run build. Append a changelog entry to docs/pending-tasks.md.
```

---

## 6. Cómo sabrás que está "inteligente y sin alucinaciones"

- ✅ Cada dato factual tiene fuente clicable (guardada privada).
- ✅ Lo no confirmado queda vacío y marcado, no inventado.
- ✅ Suena a Nomaderia (SOUL + tu mejor destino), no a robot.
- ✅ Índice de confianza visible por destino.
- ✅ Nada se publica sin tu clic. Tú curas; la IA carga el 80% pesado.

---

## 7. Riesgos y mitigación

| Riesgo | Mitigación |
|--------|------------|
| Dato factual inventado | 2 llamadas + `verify_flags` + fuentes visibles + tú verificas |
| Tokens de OpenAI quemados | Auth admin (`has_role`) antes de llamar a OpenAI |
| JSON no calza con la tabla | `json_schema` strict (decodificación restringida) |
| Romper el CRUD | Prompts prohíben tocar auth/queries/payload de submit |
| Voz genérica / AI slop | SOUL compartido + few-shot de tu mejor destino |
| Drift entre `.md` y `.ts` | Editas el `.md`, Copilot regenera el `.ts` (o Fase 2: DB editable) |
| Costo descontrolado | 1 + 2 llamadas por destino; gated por admin |

---

## 8. El ángulo LinkedIn (cómo lo cuentas, sin inflarlo)

No digas "metí un agente". Sé preciso —y eso es parte del flex:

> *"Construí un **pipeline de IA** con tool use (web_search), structured outputs estrictos, una capa de voz
> propia (SOUL), guardrails anti-alucinación con fuentes verificables, índice de confianza y human-in-the-loop
> — sobre Supabase Edge Functions con RLS para trazabilidad privada."*

Qué mostrar: el flujo de **2 clics**, el **progreso por etapas**, el **índice de confianza**, el **panel de
fuentes**, y la **métrica** del dashboard ("de ~3 h a ~5 min por ficha"). Eso hace que un reclutador o cliente
se detenga: demuestra criterio, no solo que llamaste a una API.

---

## 9. Diferencia honesta: esto es un *workflow*, no un *agente*

Para tu claridad (y por si te preguntan): lo de Destinos es un **workflow** —tú defines el camino
(research → estructura). Eso es lo correcto aquí: para anti-alucinación quieres control, no autonomía.
Un **agente** de verdad (decide sus pasos, hace loop) encaja mejor en el futuro **Concierge** conversacional
o en un **monitor de permisos** que alimente captación o seguimiento alrededor del servicio principal. El SOUL aplica a todos por igual.

---

## 10. Lo que sigue (después de validar Destinos)

- **Gear:** `discover-trending-gear` + `generate-gear-draft` → `gear_articles` (`content_markdown`, `products` jsonb). Los links de Amazon (`nomaderia-20`) los pones tú. Importa el mismo SOUL.
- **Blog:** `generate-blog-draft` → `blog_posts`. Ideal para guías SEO y series como "Operación Cañón". Mismo SOUL.
- **Concierge (agente real):** RAG conversacional sobre tu contenido. Aquí el SOUL brilla más (Boundaries + Memory). Para después de tus primeros clientes.

---

### Resumen de ejecución (orden para Copilot)
0. HUMANO — secrets `OPENAI_API_KEY`, `OPENAI_MODEL` · subir `docs/NOMADERIA_SOUL.md`
1. Migración `destination_ai_meta` (+ humano: aplicar + regenerar tipos)
2. `_shared/nomaderia-soul.ts` (voz compartida)
3. Edge Function `discover-trending-destinations` (1 llamada + dedup)
4. Edge Function `generate-destination-draft` (2 llamadas + SOUL + few-shot)
5. Hooks + tipos (`src/hooks/`, `src/types/`)
6. UI descubrimiento (`AdminDestinations.tsx`)
7. Pre-llenado + confianza + fuentes + slug guard + ai_meta (`AdminDestinationForm.tsx`)
8. Tarjeta de métricas (`AdminDashboard.tsx`)
9. HUMANO + agente — deploy + prueba de humo
10. OPCIONAL (Fase 2) — Editor de voz desde el admin

> Cada paso: empieza con "Read CLAUDE.md and use @workspace.", no toca auth/queries/routing existentes,
> termina actualizando `docs/pending-tasks.md`, y debe pasar `tsc --noEmit` + `npm run build`.
