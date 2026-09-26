# Vendored ranking engine — DO NOT EDIT BY HAND

Everything in this folder (except this README) is written by
`scripts/sync-engine.ts` from
[Frankmo89/us-parks-recommender](https://github.com/Frankmo89/us-parks-recommender)
at the commit pinned in `engine.lock.json`.

| File | Upstream source | Notes |
|---|---|---|
| `engine.ts` | `ts/src/engine.ts` | Byte-for-byte copy (sha256 in the lock). Pure functions, no imports. |
| `engine-data.generated.ts` | `web/engine_data.json` | Catalog + weights + vocab + IDF, wrapped as a typed `.ts` const so Vite and Deno import it the same way. |
| `engine.lock.json` | — | Pin (`upstream_commit`), `engine_version`, `content_hash`, sha256 per file. |
| `../../../../src/lib/engine/__fixtures__/engine_fixtures.json` | `data/engine_fixtures.json` | Python-pinned parity fixtures; consumed only by Vitest, never deployed. |

## Consumers

- Deno (Edge Functions): `import { recommend } from "../_shared/engine/engine.ts"`.
- Vite (frontend + Vitest): `import { recommend } from "@engine/engine"` (alias → this folder).

The quiz→profile adapter lives in `src/lib/quiz-ranking.ts`; the contract is
`docs/engine-contract.md` upstream.

## Updating

```sh
npm run check:engine-upstream                 # is upstream main ahead of the pin? (exit 2 = yes)
npm run sync:engine -- --to <full-commit-sha> # move the pin, rewrite files + lock
npm test                                      # parity fixtures + SUPPORTED_ENGINE_VERSION guard
npm run verify:engine                         # CI: re-fetch at the pin, fail on drift
```

If `engine_version` changed, read upstream `CHANGELOG.md` + `docs/engine-contract.md`,
re-check the adapter, then bump `SUPPORTED_ENGINE_VERSION` in
`src/lib/quiz-ranking.ts` in the same PR. The Vitest guard fails until you do.
