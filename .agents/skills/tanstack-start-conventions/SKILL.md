---
name: tanstack-start-conventions
description: >-
  TanStack Start and Router conventions for FixMyBerlin/FMC: client/server file
  suffixes, loaders vs React Query, selective SSR, experimental server components
  (RSC), router search serialization (clean share URLs), and UI vs API route
  param/search validation. Use when working on TanStack Start routes, server
  functions, loaders, router.tsx parseSearch/stringifySearch, renderServerComponent,
  createCompositeComponent, validateSearch, or API routes under routes/api/.
disable-model-invocation: true
---

# TanStack Start conventions

Stack conventions for TanStack Start apps in this org. Pair with `tanstack-start-auth` and `tanstack-start-app-structure` for auth and folder layout.

## When to apply

- Adding or changing routes, loaders, `beforeLoad`, or API handlers
- Splitting code between `.server.ts` and `.functions.ts`
- Choosing loader vs React Query vs `useLoaderData`
- Setting route `ssr` or debugging SSR / hydration
- Installing or changing the TanStack devtools debug panel (Query, Router, Form)
- Using server components (`renderServerComponent`, `createCompositeComponent`)
- Validating path params or search (UI vs API)
- Configuring `router.tsx` (`parseSearch`, `stringifySearch`, trailing slashes, search param encoding)

## Reference reading order

1. [client-server-boundaries.md](references/client-server-boundaries.md) — file suffixes, import protection, `beforeLoad` vs `loader`
2. [router-and-query.md](references/router-and-query.md) — Query options, loaders, SSR dehydration
3. [router-search-serialization.md](references/router-search-serialization.md) — **required** `parseSearch` / `stringifySearch`, pretty JSON URLs, per-param encodings, optional jsurl
4. [params-search-ui-vs-api.md](references/params-search-ui-vs-api.md) — Zod on UI routes vs API `GET`
5. [selective-ssr.md](references/selective-ssr.md) — `ssr: true` / `'data-only'` / `false` (handler-only API routes: `false`)
6. [server-components.md](references/server-components.md) — experimental RSC: FMC conventions, official doc map, selective SSR pairing
7. [devtools.md](references/devtools.md) — unified TanStack debug panel (`@tanstack/devtools-vite`, `ClientOnly`, inline panels)

Auth-specific flows: skill `tanstack-start-auth`.

## Non-negotiable rules

| Topic                | Rule                                                                                                                                                                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server-only modules  | `*.server.ts` — never imported by routes/components; use `createServerOnlyFn` inside                                                                                                                                                                                                    |
| Callable from client | `*.functions.ts` with `createServerFn`; name exports `*Fn`                                                                                                                                                                                                                              |
| Public server fns    | `public*.functions.ts` — no global auth middleware; rate-limit/token checks in `.server.ts` (see `tanstack-start-auth`)                                                                                                                                                                 |
| API route files      | No `server-only` import marker on the route file; server-only logic inside handlers or tree-shaken imports                                                                                                                                                                              |
| Query-backed UI data | Loader primes cache; component uses `useQuery` / `useSuspenseQuery` — not `useLoaderData` alone                                                                                                                                                                                         |
| API search params    | Do **not** use `validateSearch` on API routes; `safeParse` in `GET` from `request.url` with explicit 4xx JSON                                                                                                                                                                           |
| Validation           | Zod 4 for path params and UI search; export search schema when reused outside the route; `Route.useSearch()` for types — no manual casts                                                                                                                                                |
| SSR                  | Set `ssr` explicitly on every route; UI default full SSR (`true`); handler-only API routes: `false`; map-heavy UI: `data-only`                                                                                                                                                          |
| Devtools panel       | `TanStackAppDevtools` in `components/shared/devtools/` — `ClientOnly` + inline panels; prod strip via `@tanstack/devtools-vite` (see [devtools.md](references/devtools.md))                                                                                                             |
| Router search URLs   | **`parseSearch` + `stringifySearch`** in `router.tsx` (pretty JSON baseline); `trailingSlash: 'never'` + root trailing-slash redirect; per-param compact/JSON encodings; jsurl **only** for large objects — [router-search-serialization.md](references/router-search-serialization.md) |
| jsurl (optional)     | Large nested route params only → key in `jsurlSearchKeys` + search registry; reuse `jsurlParse` / `jurlStringify`                                                                                                                                                                       |

## Quick decisions

**`beforeLoad` vs `loader`:** Redirects, auth, light context → `beforeLoad` (not middleware). Data fetch / Query priming → `loader`.

**Loader vs Query:** Shared, invalidatable, multi-route data → `*QueryOptions` + `ensureQueryData` in loader + `useSuspenseQuery` in UI. One-off admin page data → loader return value + `useLoaderData`.

**`ssr`:** Map/canvas-heavy UI but need server auth/data → `'data-only'`. Handler-only API (`server.handlers`) → `false`. Fully client-first UI route → `false` (rare).

**Server components (experimental):** Opt-in RSC layer — not the default FMC data path. See [server-components.md](references/server-components.md).
