---
name: tanstack-router-conventions
description: >-
  TanStack Router conventions for FixMyBerlin/FMC (SPA or Start): validateSearch
  with Zod, parseSearch/stringifySearch for clean share URLs, map=zoom/lat/lng
  search param, loader + React Query patterns, typed Link/params, and TanStack
  devtools. Use when scaffolding a Vite + TanStack Router SPA, wiring router.tsx
  search serialization, route search params (including map viewport URLs),
  loaders, or Query integration — without TanStack Start server/SSR topics.
disable-model-invocation: true
---

# TanStack Router conventions

Stack conventions for **TanStack Router** apps (Vite SPA or the router layer of TanStack Start). Pair with `tanstack-start-conventions` only when the app uses Start (SSR, server functions, API routes).

## When to apply

- Scaffolding a TanStack Router SPA (`@tanstack/react-router` + Vite)
- Adding or changing UI routes, loaders, or `validateSearch`
- Configuring `router.tsx` (`parseSearch`, `stringifySearch`, trailing slash)
- Viewport URL param `?map=zoom/lat/lng` (parse/serialize, validateSearch)
- Loader + React Query integration (client-side)
- Typed `Link`, `useParams` / `useSearch`, `getRouteApi`
- Installing the TanStack devtools debug panel

**Not in this skill:** `createServerFn`, `.server.ts` / `.functions.ts`, selective SSR, RSC, API `server.handlers` — those are `tanstack-start-conventions`.

## Reference reading order

1. [router-search-serialization.md](references/router-search-serialization.md) — **required** `parseSearch` / `stringifySearch`, pretty JSON URLs, per-param encodings, optional jsurl
2. [map-search-param.md](references/map-search-param.md) — `?map=zoom/lat/lng` (tilda-geo format, rounding, validateSearch)
3. [params-search-ui-routes.md](references/params-search-ui-routes.md) — Zod `validateSearch` on UI routes
4. [router-and-query.md](references/router-and-query.md) — Query options, loaders, router defaults
5. [router-typescript.md](references/router-typescript.md) — typed hooks, `from`, `Link` params, `Register`
6. [devtools.md](references/devtools.md) — unified TanStack debug panel

## Non-negotiable rules

| Topic              | Rule                                                                                                                                                                                                                                                                                    |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Validation         | Zod 4 for path params and UI search; export search schema when reused outside the route; `Route.useSearch()` for types — no manual casts                                                                                                                                                |
| Router search URLs | **`parseSearch` + `stringifySearch`** in `router.tsx` (pretty JSON baseline); `trailingSlash: 'never'` + root trailing-slash redirect; per-param compact/JSON encodings; jsurl **only** for large objects — [router-search-serialization.md](references/router-search-serialization.md) |
| Map viewport URL   | `?map=zoom/lat/lng` via shared `parseMapParam` / `serializeMapParam`; round on serialize; never `encodeURIComponent` the value; keep `map` out of `loaderDeps` — [map-search-param.md](references/map-search-param.md)                                                                  |
| jsurl (optional)   | Large nested route params only → key in `jsurlSearchKeys` + search registry; reuse `jsurlParse` / `jurlStringify`                                                                                                                                                                       |
| Query-backed UI    | Loader primes cache; component uses `useQuery` / `useSuspenseQuery` — not `useLoaderData` alone                                                                                                                                                                                         |
| Devtools panel     | `TanStackAppDevtools` in `components/shared/devtools/` — inline panels; prod strip via `@tanstack/devtools-vite` (see [devtools.md](references/devtools.md))                                                                                                                            |

## Quick decisions

**Loader vs Query:** Shared, invalidatable, multi-route data → `*QueryOptions` + `ensureQueryData` in loader + `useSuspenseQuery` in UI. One-off page data → loader return value + `useLoaderData`.

**Search writes:** Prefer `replace: true` for filters/toggles; set keys to `undefined` to clear; use a route-local `updateSearch` wrapper — [router-search-serialization.md](references/router-search-serialization.md).

## Related skills

| Topic                        | Skill                        |
| ---------------------------- | ---------------------------- |
| TanStack Start (SSR, server) | `tanstack-start-conventions` |
| Auth / session (Start)       | `tanstack-start-auth`        |
| Zustand                      | `zustand-state-management`   |
| nuqs (Next.js / legacy only) | `nuqs`                       |
| React TS / Compiler          | `react-dev`                  |
| Map component + URL sync     | `react-map-gl`               |
