---
name: nuqs
description: nuqs (type-safe URL query state) for Next.js and legacy/shared components. Prefer TanStack Router validateSearch on TanStack Start/Router apps. Use when writing nuqs hooks, parsers, NuqsAdapter setup, or Next.js URL state — not for greenfield TanStack route search params.
---

**LLM reference:** Fetch [llms.txt](https://nuqs.dev/llms.txt) for the documentation index and latest API. Full docs in one file: [llms-full.txt](https://nuqs.dev/llms-full.txt). Human-readable docs: [nuqs.dev/docs](https://nuqs.dev/docs).

Do **not** duplicate upstream API reference in this skill — use `llms.txt` / `llms-full.txt` for parsers, options, server cache, testing adapter, and troubleshooting.

---

## When NOT to use nuqs (read first)

**On TanStack Router or TanStack Start, prefer the router’s built-in search params** unless you have a concrete reason to add nuqs.

| Situation                                            | Use instead                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| App-owned filters, tabs, pagination, sort on a route | Route `validateSearch` (Zod) + `Route.useSearch()`, `loaderDeps`, typed `<Link search={…}>` |
| Loaders / `beforeLoad` need query state              | Same parsers in `validateSearch`; `search` is typed in loader args                          |
| FMC TanStack Start stack                             | Skill `tanstack-start-conventions` → `references/params-search-ui-vs-api.md`                |
| API routes under `routes/api/*`                      | Parse `request.url` in `GET` with Zod — **not** route `validateSearch`                      |

**Use nuqs on TanStack only when:**

- A dependency or shared package already exposes `useQueryState` / `useQueryStates` (integrate via `createStandardSchemaV1` — see [nuqs TanStack adapter](https://nuqs.dev/docs/adapters#tanstack-router)).
- You are maintaining Next.js code that already uses nuqs.

**Upstream caveat (2025):** TanStack Router adapter is **experimental** and **does not fully cover TanStack Start**. For new Start apps, default to `validateSearch`, not `NuqsAdapter`.

---

## When to use nuqs

- **Next.js** (App or Pages Router): primary fit — `NuqsAdapter` + client hooks + optional `nuqs/server` cache for RSC.
- **Shared libraries** consumed by Next.js apps that standardize on nuqs parsers/hooks.
- **Tests** of nuqs-powered components: `NuqsTestingAdapter` from `nuqs/adapters/testing` (see upstream [Testing](https://nuqs.dev/docs/testing.md)).

---

## FMC conventions

**TanStack Start** (preferred URL state):

- Colocate Zod search schemas with the route or feature; wire `validateSearch` on the owning route file.
- Wire **`parseSearch` / `stringifySearch`** in `router.tsx` (pretty JSON baseline; jsurl only for large objects) — `tanstack-start-conventions` → `router-search-serialization.md`.
- See `tanstack-start-app-structure` for folder layout; avoid `NuqsAdapter` unless a subtree truly needs nuqs hooks.

**Next.js + nuqs:**

- Colocate parsers and hooks under the feature (e.g. `components/.../hooks/useQueryState/`).
- Place **`NuqsAdapter`** only on `components/layouts/Layout*.tsx` shells that need URL search state — everything below is effectively a client boundary for nuqs.
- Register search params in a central registry if redirects/normalization must preserve them.

**State split:** URL-shareable state → router search or nuqs; ephemeral UI → Zustand (`zustand-state-management`).

---

## Next.js setup (summary)

Upstream detail: [Installation](https://nuqs.dev/docs/installation.md) · [Adapters](https://nuqs.dev/docs/adapters.md).

| Concern                      | Rule                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------- |
| Minimum Next.js (App Router) | **14.2.0+** (v2 dropped older 14.x shallow-routing hacks)                                          |
| Provider                     | `NuqsAdapter` from `nuqs/adapters/next/app` or `.../next/pages`                                    |
| Client hooks                 | `import { useQueryState, … } from 'nuqs'` in `'use client'` components                             |
| Server / RSC                 | `import { createSearchParamsCache, … } from 'nuqs/server'` — **never** `nuqs` in Server Components |
| Shared parsers               | Define once; import parsers from `nuqs/server` on server, `nuqs` on client                         |
| RSC refresh on URL change    | `shallow: false` (v2: `startTransition: true` does **not** imply `shallow: false`)                 |
| Next.js 15+ `searchParams`   | `searchParams` is a `Promise` — await before `createSearchParamsCache.parse()`                     |

**Adapters (v2+):** `next/app`, `next/pages`, `next` (unified), `react`, `remix`, `react-router/v6`, `react-router/v7`, `tanstack-router` (experimental), `testing`.

---

## TanStack Router + nuqs (interop only)

When you must run nuqs hooks alongside the router:

```tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { createStandardSchemaV1, parseAsIndex, parseAsString, useQueryStates } from 'nuqs'

const searchParams = {
  searchQuery: parseAsString.withDefault(''),
  pageIndex: parseAsIndex.withDefault(0),
}

export const Route = createFileRoute('/search')({
  validateSearch: createStandardSchemaV1(searchParams, { partialOutput: true }),
  component: RouteComponent,
})

function RouteComponent() {
  const [{ searchQuery, pageIndex }] = useQueryStates(searchParams)
  return <Link to="/search" search={{ searchQuery: 'foo' }} />
}
```

**Limits:** Only trivial parser types for type-safe `<Link search>`; `urlKeys` not supported with TanStack integration. Prefer native `validateSearch` for app code.

Root layout (only if needed): `NuqsAdapter` from `nuqs/adapters/tanstack-router` wrapping `<Outlet />` in `__root.tsx`.

---

## High-impact gotchas (not in every tutorial)

These are easy to miss; full behavior is in upstream docs.

1. **Typed parsers** — URL values are strings; use `parseAsInteger`, `parseAsBoolean`, etc., or you get string math and hydration issues.
2. **`withDefault`** — Prefer over nullable state when a param should always have a value in UI.
3. **`useQueryStates`** — Batch related params (filters, lat/lng/zoom) to avoid multiple history entries.
4. **`null` setter** — Removes param from URL; pair with `value={q ?? ''}` for controlled inputs.
5. **`clearOnDefault`** — Default `true` keeps URLs short; set `false` only if the param must stay visible at default.
6. **`createSearchParamsCache`** — Call `parse(searchParams)` once at the page, then `get()` in child Server Components.
7. **`parseAsJson`** — Requires a runtime validator in v2+ (type inference).
8. **Debug** — `localStorage.debug = 'nuqs'` (v2 dropped `next-usequerystate` substring).
9. **Package** — ESM-only; import server utilities from `nuqs/server`, not `nuqs/parsers` (removed in v2).

---

## Related FMC skills

| Skill                          | Role                                                |
| ------------------------------ | --------------------------------------------------- |
| `tanstack-start-conventions`   | `validateSearch`, loaders, API vs UI search         |
| `tanstack-start-app-structure` | Where URL state and adapters live                   |
| `tanstack-start-migration`     | Next → Start; search params mental model            |
| `react-dev`                    | TanStack Router patterns including `validateSearch` |
