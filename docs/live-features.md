# Live features — nomaderia.com

Snapshot verified against **production** (https://nomaderia.com) and **`origin/main`** code on 2026-09-30 (PT). Status meanings: **live** = wired in the shipped UI and reachable; **partial** = UI/code present but a human gate or placeholder still blocks the full path; **not built** = no working product path yet.

| Feature | Status | Route / entry | Evidence |
|---------|--------|---------------|----------|
| Quiz | **live** | `/#quiz` (`Index` → `QuizSection`, `id="quiz"`) | Live App bundle includes quiz UI strings; nav links to `/#quiz`. Hook `use-quiz.ts` + ZIP origin (ADR-031). |
| Park ranking / top 3 | **live** | `/#quiz` (results) | Client ranks with `rankQuizDestinations(..., 3)` (`quiz-ranking.ts` + vendored engine). UI: hero #1 + “También te puede gustar” alternatives. Confirmed in live App JS. |
| Free AI preview | **partial** | `/#quiz` (after park select) | UI + `supabase.functions.invoke("quiz-preview")` live in App JS (“Generando preview…”). EF source in repo; gateway responds (auth required). Frank still has **T05** open: confirm `quiz-preview` deploy + apply `leads` migration. |
| Stripe checkout | **not built** | *(planned)* `/servicios` / post-quiz | `STRIPE_LINK_ITINERARIO_49 = "REEMPLAZAR_CON_LINK_DE_49_USD"` in `src/config/pricing.ts`. Product `ctaType: "whatsapp"`. Live CTAs: “Diseña mi aventura por WhatsApp” / quiz WhatsApp. *(Privacy copy mentions Stripe checkout; that path is not wired in `pricing.ts` CTAs.)* |
| Itinerary page | **live** | `/i/:token` (+ `/i/:token/print`) | `ClientItineraryView` + RPC `get_itinerary_by_token` (ADR-014). Route present in `App.tsx`; client chunk shipped on production. |

## Product context (frozen)

- **Product:** Itinerario Completo Nomaderia — **$49 USD**.
- **Close channel today:** WhatsApp (not Stripe).
- **Planned funnel:** quiz → ranking → free AI preview → Stripe $49 → draft → Frank approves → `/i/:token` (see `docs/ai-roadmap.md`, ADR-024). Do not invent features beyond the table above.
