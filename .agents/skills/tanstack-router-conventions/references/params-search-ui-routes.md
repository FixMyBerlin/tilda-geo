# TanStack Router: path params & search — UI routes

Validation uses **Zod 4** everywhere in FMC TanStack Router apps (no optional “pick a validator” — treat Zod as the rule). Pin `zod@4.4.3`.

UI routes run matching, `validateSearch`, loaders, and components. Typed `search` is available in `loaderDeps`, `beforeLoad`, `loader`, and `Route.useSearch()`.

---

## Zod 4 + `validateSearch`: one schema per route

**Rule:** Define each route’s search schema **once**. Never duplicate search shapes as hand-written `type` aliases or `as { … }` casts.

**Placement:** Inline `const` in the route file when only that route uses the schema. When the schema is imported elsewhere (route `validateSearch` plus `navigate({ search })`, components, or shared helpers), export it from `shared/<domain>/searchSchemas.ts` (or `shared/routing/` for cross-route helpers). Do **not** colocate non-route files under `routes/` (no `-` prefixed helpers).

| Piece                | Pattern                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Schema               | Inline `const itemSearchSchema = z.object({ … })` in the route file, or `export const …` from `shared/<domain>/searchSchemas.ts` when reused                 |
| Route                | `validateSearch: itemSearchSchema` — Zod 4 implements Standard Schema; **no** `@tanstack/zod-adapter` / `zodValidator()`                                     |
| Type                 | `type ItemSearch = z.infer<typeof itemSearchSchema>` — export only when imported elsewhere                                                                   |
| Components           | `Route.useSearch()` or `useSearch({ from: Route.id })` — no manual casts                                                                                     |
| Revalidate elsewhere | **Same schema object** (must be exported or imported from a shared module): `itemSearchSchema.safeParse(raw)`; use `z.flattenError()` for user-facing errors |

**URL defaults:** Query strings are always strings at the wire. Use `.default()` so `<Link search={…}>` does not require every key, and `.catch(fallback)` so invalid values recover gracefully (replaces Zod 3 adapter `fallback()`):

```ts
const itemSearchSchema = z.object({
  tab: z.enum(['overview', 'notes']).default('overview').catch('overview'),
  page: z.coerce.number().int().positive().default(1).catch(1),
})
```

**Anti-patterns:**

```ts
// ❌ Duplicate type next to schema
type AuthSearch = { callbackURL?: string }
const LoginSearchSchema = z.object({ callbackURL: z.string().optional() })

// ❌ Untyped search in child components
const search = useSearch({ strict: false }) as { from?: string }

// ❌ Inline parse wrapper when schema can be passed directly (Zod 4)
validateSearch: (search) => itemSearchSchema.parse(search)
```

---

## Path params vs search (UI)

| Topic                        | Pages / components                                                                                                                                                                                                                                                               |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Path params (`$segment`)** | `params: { parse: (raw) => schema.parse(raw) }` with Zod. Read: `beforeLoad`, `loader`, `Route.useParams()`, `getRouteApi(…).useParams()`.                                                                                                                                       |
| **Search (`?`)**             | `validateSearch` with Zod; typed `search` in `loaderDeps`, `beforeLoad`, `loader`, `Route.useSearch()`. Zod throws → route error — [RouteOptions — `validateSearch`](https://tanstack.com/router/latest/docs/framework/react/api/router/RouteOptionsType#validatesearch-method). |

---

## Pages / components (UI route)

**TanStack Router (Zod):** [Validate search — Quick start](https://tanstack.com/router/latest/docs/how-to/validate-search-params#quick-start) · [Zod (recommended)](https://tanstack.com/router/latest/docs/how-to/validate-search-params#zod-recommended) · [Search params — validating & typing](https://tanstack.com/router/latest/docs/framework/react/guide/search-params#validating-and-typing-search-params) · [Search params in components](https://tanstack.com/router/latest/docs/framework/react/guide/search-params#search-params-in-components) · [Using search params in loaders](https://tanstack.com/router/latest/docs/framework/react/guide/search-params#using-search-params-in-loaders) · [RouteOptions — `params.parse`](https://tanstack.com/router/latest/docs/framework/react/api/router/RouteOptionsType#paramsparse-method) · [RouteOptions — `validateSearch`](https://tanstack.com/router/latest/docs/framework/react/api/router/RouteOptionsType#validatesearch-method) · [Data loading — route loaders](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#route-loaders) · [`loaderDeps` + search](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#using-loaderdeps-to-access-search-params)

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

// Always use Zod for dynamic path segments (project rule).
const itemParamsSchema = z.object({
  itemId: z.coerce.number().int().positive(),
})

// Always use Zod 4 for query state (project rule). Inline const is fine when only this route uses it.
const itemSearchSchema = z.object({
  tab: z.enum(['overview', 'notes']).default('overview').catch('overview'),
})

export const Route = createFileRoute('/items/$itemId')({
  // `params.parse`: runs when the route matches; Zod `.parse` throws → route error / `errorComponent`.
  params: {
    parse: (raw) => itemParamsSchema.parse(raw),
  },

  // Use `validateSearch` when this route owns `?…` query state (filters, tabs, pagination, etc.).
  // Zod 4: pass schema directly (Standard Schema). Invalid input → route error / `errorComponent`.
  validateSearch: itemSearchSchema,

  // Declare loader dependencies on search so loaders re-run when validated search changes.
  loaderDeps: ({ search: s }) => ({ tab: s.tab }),

  beforeLoad: ({ params, search }) => {
    // `params` / `search` here are the successful Zod outputs from the steps above → typed.
    return { traceId: `${params.itemId}-${search.tab}` }
  },

  loader: async ({ params, search }) => {
    // Same typed `params` + `search` for data fetching.
    return { label: `Item ${params.itemId} (${search.tab})` }
  },

  component: ItemPage,
})

function ItemPage() {
  // After validation, `Route.useParams()` / `Route.useSearch()` infer the Zod output types.
  // In child files, same types via `getRouteApi('/items/$itemId').useParams()` / `.useSearch()`.
  const { itemId } = Route.useParams()
  const { tab } = Route.useSearch()
  const data = Route.useLoaderData()

  return (
    <div>
      {data.label} — {itemId} / {tab}
    </div>
  )
}
```

**Pretty share URLs:** wire `parseSearch` / `stringifySearch` in `router.tsx` — [router-search-serialization.md](router-search-serialization.md).

---

## Out of scope (TanStack Start)

API `server.handlers` search validation, SSR, and server functions → skill `tanstack-start-conventions` (do not use route-level `validateSearch` on API routes).
