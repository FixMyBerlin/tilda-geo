---
name: tanstack-start-conventions
description: >-
  TanStack Start conventions for FixMyBerlin/FMC: app folder layout, thin routes,
  client/server file suffixes, createServerFn, selective SSR, experimental RSC,
  and API route param/search validation. Requires tanstack-router-conventions for
  validateSearch, search serialization, and loader + Query patterns. Use when
  scaffolding or refactoring Start apps, server functions, SSR, renderServerComponent,
  or API routes under routes/api/.
disable-model-invocation: true
---

# TanStack Start conventions

Stack conventions for **TanStack Start** apps in this org. **Requires** skill `tanstack-router-conventions` (search params, pretty URLs, loaders + Query, typed Router TS, devtools). Pair with `tanstack-start-auth` for auth and session layout.

## When to apply

- Scaffolding or refactoring `app/src` folder layout (see [app-structure.md](references/app-structure.md))
- Splitting code between `.server.ts` and `.functions.ts`
- `createServerFn`, server mutations, form submit / invalidation
- Setting route `ssr` or debugging SSR / hydration
- Using server components (`renderServerComponent`, `createCompositeComponent`)
- API routes under `routes/api/` (handler-only; search validation in `GET`)

**Router / SPA topics** (`validateSearch`, `parseSearch` / `stringifySearch`, loader + Query defaults) → install and follow `tanstack-router-conventions` — do not duplicate them here.

## App structure (`src`)

Folder layout, thin routes, Layout/Page naming, and test layout: [app-structure.md](references/app-structure.md). For project-specific paths, use the repo's local `docs/` file.

## Reference reading order

0. **Prerequisite:** skill `tanstack-router-conventions` (search serialization, UI `validateSearch`, `?map=`, router + Query, TypeScript, devtools)
1. [app-structure.md](references/app-structure.md) — `src` folders, thin routes, Layout/Page naming, tests
2. [execution-model.md](references/execution-model.md) — isomorphic execution, loaders on soft nav, server fn boundary
3. [client-server-boundaries.md](references/client-server-boundaries.md) — file suffixes, import protection, `beforeLoad` vs `loader`
4. [server-functions.md](references/server-functions.md) — `createServerFn` API, validation, form submit, invalidation
5. [params-search-api-routes.md](references/params-search-api-routes.md) — Zod in API `GET` (no route-level `validateSearch`)
6. [selective-ssr.md](references/selective-ssr.md) — `ssr: true` / `'data-only'` / `false` (handler-only API routes: `false`)
7. [server-components.md](references/server-components.md) — experimental RSC: FMC conventions, official doc map, selective SSR pairing

Auth-specific flows: skill `tanstack-start-auth`.

## Non-negotiable rules

| Topic                 | Rule                                                                                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server-only modules   | `*.server.ts` — never imported by routes/components; use `createServerOnlyFn` inside                                                                                                  |
| Callable from client  | `*.functions.ts` with `createServerFn`; name exports `*Fn`                                                                                                                            |
| Public server fns     | `public*.functions.ts` — no global auth middleware; rate-limit/token checks in `.server.ts` (see `tanstack-start-auth`)                                                               |
| API route files       | No `server-only` import marker on the route file; server-only logic inside handlers or tree-shaken imports                                                                            |
| API search params     | Do **not** use `validateSearch` on API routes; `safeParse` in `GET` from `request.url` with explicit 4xx JSON — [params-search-api-routes.md](references/params-search-api-routes.md) |
| SSR                   | Set `ssr` explicitly on every route; UI default full SSR (`true`); handler-only API routes: `false`; map-heavy UI: `data-only`                                                        |
| Router search / Query | Owned by `tanstack-router-conventions` — Start apps still **must** follow that skill’s `parseSearch` / `stringifySearch` and loader + Query rules                                     |

## Quick decisions

**`beforeLoad` vs `loader`:** Redirects, auth, light context → `beforeLoad` (not middleware). Data fetch / Query priming → `loader`. **Caveat:** `beforeLoad` is not gated by `loaderDeps` — it re-runs on **every** navigation, search-param changes included. On hot routes with client-only search params (map viewport, layer toggles), move the redirect/auth/region round-trip into the `loader` and keep those params out of `loaderDeps` so they stay client-only (no round-trip, no pending). See [client-server-boundaries.md](references/client-server-boundaries.md).

**Loader vs Query:** Follow `tanstack-router-conventions` → `router-and-query.md`. On Start, route server I/O through `createServerFn` ([execution-model.md](references/execution-model.md)).

**`ssr`:** Map/canvas-heavy UI but need server auth/data → `'data-only'`. Handler-only API (`server.handlers`) → `false`. Fully client-first UI route → `false` (rare).

**Server components (experimental):** Opt-in RSC layer — not the default FMC data path. See [server-components.md](references/server-components.md).

## Related skills

| Topic             | Skill                         |
| ----------------- | ----------------------------- |
| Router (required) | `tanstack-router-conventions` |
| Auth / session    | `tanstack-start-auth`         |
| Zustand           | `zustand-state-management`    |
| nuqs (Next.js)    | `nuqs`                        |
