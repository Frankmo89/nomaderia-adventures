# Auditoría — concierge pre-compra (oct 2026)

Hecho antes de este cambio, sobre `origin/main` (`5f1dd2e`). El código del concierge ya existía; no estaba cableado al sitio.

## Qué ya existía

- **Edge function** `supabase/functions/concierge-agent`: RAG con `text-embedding-3-small`, RPC `match_knowledge_chunks`, `min_similarity` **0.4**, `match_count` **6** (el default SQL también es 6). Bloque **DATOS EN VIVO** desde `park_live_data` (tarifas, alertas, campamentos, fecha de `synced_at`, alias kica→seki). Herramienta `recommend_parks` (ADR-029). Sin WhatsApp en la respuesta (ADR-030).
- **UI** `ConciergeLauncher` + `ConciergeChat` + `useConcierge`. El launcher **no estaba montado** en `App.tsx` (comentario de la era del launcher global; en el árbol de `main` no hay `<ConciergeLauncher />`). En destino solo queda un comentario. El CTA público de dudas seguía siendo **«¿Dudas? Escríbenos»** hacia WhatsApp (hero, servicios, quiz, sticky, artículos).
- **Prompts** en el system prompt de la función: español, no inventar, citar `[Fuente: título - sección]`. No obligaban la frase «Eso no lo tengo confirmado» ni un candado de cifras.
- **Tablas:** `knowledge_chunks` + `match_knowledge_chunks`; `park_live_data`; `events` (insert anónimo, select solo admin); `leads` (insert anónimo, el cliente pone el uuid).
- **Rate limit:** no había.
- **Lead del chat:** al escalar, el panel pedía correo **en el primer mensaje** que disparaba keywords (`precio`, `reserva`, …) y lo guardaba en `newsletter_subscribers`, no en `leads`.
- **Log:** `use-concierge` escribía `concierge_answer_check` (sin pregunta, respuesta ni ids de chunk).

## Qué faltaba frente al pedido

| Pedido | Antes |
|---|---|
| `match_count` 8 | 6 |
| Responder solo con chunks + datos en vivo; fuente y fecha al final | prompt, sin cierre forzado; sin chunk igual podía llamar al modelo |
| Sin chunk sobre 0.4 → «Eso no lo tengo confirmado» + correo | texto de quiz y correo inmediato |
| Cifra que no esté en el chunk → bloquear | solo el prompt |
| Calor / agua / fauna / clima / emergencia → NPS + 911 | no |
| Fuera de parques de EE.UU. → rechazo cortés | solo modo parque («me enfoco en este parque») |
| Correo solo después de 2–3 respuestas, guardado como lead | correo al primer escalate, newsletter |
| Log de pregunta, respuesta y chunk ids | no |
| Rate limit por visitante | no |
| Botón flotante en español que reemplace «¿Dudas? Escríbenos»; WhatsApp solo post-pago | launcher sin montar; dudas por WhatsApp |

## Qué no se tocó

Auth, routing, queries de Supabase que no son el camino del concierge, motor vendorizado (`_shared/engine`), Payment Link $49.
