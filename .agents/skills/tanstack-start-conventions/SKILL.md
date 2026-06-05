---
name: tanstack-start-conventions
description: >-
  TanStack Start and Router conventions for FixMyBerlin/FMC: client/server file
  suffixes, loaders vs React Query, selective SSR, and UI vs API route param/search
  validation. Use when working on TanStack Start routes, server functions, loaders,
  validateSearch, or API routes under routes/api/.
disable-model-invocation: true
---

# TanStack Start conventions

Stack conventions for TanStack Start apps in this org. Pair with `tanstack-start-auth` and `tanstack-start-app-structure` for auth and folder layout.

## When to apply

- Adding or changing routes, loaders, `beforeLoad`, or API handlers
- Splitting code between `.server.ts` and `.functions.ts`
- Choosing loader vs React Query vs `useLoaderData`
- Setting route `ssr` or debugging SSR / hydration
- Validating path params or search (UI vs API)

## Reference reading order

1. [client-server-boundaries.md](references/client-server-boundaries.md) — file suffixes, import protection, `beforeLoad` vs `loader`
2. [router-and-query.md](references/router-and-query.md) — Query options, loaders, SSR dehydration
3. [params-search-ui-vs-api.md](references/params-search-ui-vs-api.md) — Zod on UI routes vs API `GET`
4. [selective-ssr.md](references/selective-ssr.md) — `ssr: true` / `'data-only'` / `false`

Auth-specific flows: skill `tanstack-start-auth`.

## Non-negotiable rules

| Topic                | Rule                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| Server-only modules  | `*.server.ts` — never imported by routes/components; use `createServerOnlyFn` inside                          |
| Callable from client | `*.functions.ts` with `createServerFn`; name exports `*Fn`                                                    |
| API route files      | No `server-only` import marker on the route file; server-only logic inside handlers or tree-shaken imports    |
| Query-backed UI data | Loader primes cache; component uses `useQuery` / `useSuspenseQuery` — not `useLoaderData` alone               |
| API search params    | Do **not** use `validateSearch` on API routes; `safeParse` in `GET` from `request.url` with explicit 4xx JSON |
| Validation           | Zod for path params and UI search everywhere                                                                  |
| SSR                  | Set `ssr` explicitly on every route; default full SSR unless a leaf needs `data-only` or `false`              |

## Quick decisions

**`beforeLoad` vs `loader`:** Redirects, auth, light context → `beforeLoad`. Data fetch / Query priming → `loader`.

**Loader vs Query:** Shared, invalidatable, multi-route data → `*QueryOptions` + `ensureQueryData` in loader + `useSuspenseQuery` in UI. One-off admin page data → loader return value + `useLoaderData`.

**`ssr`:** Map/canvas-heavy UI but need server auth/data → `'data-only'`. Fully client-first route → `false` (rare).
