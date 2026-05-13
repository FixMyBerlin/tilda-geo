# TanStack Router: path params & search — UI routes vs API (server) routes

Validation uses **Zod everywhere** in this repo (no optional “pick a validator” — treat Zod as the rule).

TanStack Router follows **two execution paths**: UI routes run matching, `validateSearch`, loaders, and components; **server route handlers** are plain `Request` handlers. Handlers receive **`request`**, **`params`**, and **`context`** only — there is **no** validated `search` object on `GET`.

---

## Comparison (path vs search)

| Topic                        | Pages / components                                                                                                                                                                                                                                                               | API routes (`server.handlers`)                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Path params (`$segment`)** | `params: { parse: (raw) => schema.parse(raw) }` with Zod. Read: `beforeLoad`, `loader`, `Route.useParams()`, `getRouteApi(…).useParams()`.                                                                                                                                       | Same as Pages / components. Read: `GET: ({ params })` — [TanStack Start — Handler context](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes#handler-context), [Dynamic path params](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes#dynamic-path-params). API routes do not have custom error components, so when route-level param parsing fails you do not control what users/callers see.           |
| **Search (`?`)**             | `validateSearch` with Zod; typed `search` in `loaderDeps`, `beforeLoad`, `loader`, `Route.useSearch()`. Zod throws → route error — [RouteOptions — `validateSearch`](https://tanstack.com/router/latest/docs/framework/react/api/router/RouteOptionsType#validatesearch-method). | You can use route-level `validateSearch`, but for API routes it usually reduces control: thrown errors become framework responses (not your custom JSON), and validated search still does not flow into `GET`. **Recommendation:** do not use `validateSearch` for API search params; validate only in `GET` with Zod + explicit manual 4xx JSON handling. [Server route search params (discussion)](https://www.answeroverflow.com/m/1422316941334282351). |

**Repo references:** [`app/src/routes/regionen/$regionSlug.tsx`](../app/src/routes/regionen/$regionSlug.tsx) (loaders + search deps), [`app/src/components/regionen/PageRegionSlug.tsx`](../app/src/components/regionen/PageRegionSlug.tsx) (`getRouteApi` + `useLoaderData`), [`app/src/routes/api/admin.qa-configs.$id.export-csv.ts`](../app/src/routes/api/admin.qa-configs.$id.export-csv.ts) (path params + GET), [`app/src/routes/api/notes.$regionSlug.download.ts`](../app/src/routes/api/notes.$regionSlug.download.ts) (search + GET workaround).

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

// Always use Zod for query state (project rule).
const itemSearchSchema = z.object({
  tab: z.enum(['overview', 'notes']).default('overview'),
})

export const Route = createFileRoute('/items/$itemId')({
  // `params.parse`: runs when the route matches; Zod `.parse` throws → route error / `errorComponent`.
  params: {
    parse: (raw) => itemParamsSchema.parse(raw),
  },

  // Use `validateSearch` when this route owns `?…` query state (filters, tabs, pagination, etc.).
  // Zod `.parse` throws on invalid input → same route error behavior as bad path params.
  validateSearch: (search) => itemSearchSchema.parse(search),

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

---

## API routes (`server.handlers`)

**TanStack Start:** [Server routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes) · [Handler context](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes#handler-context) · [Dynamic path params](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes#dynamic-path-params)

**Router (Zod) for the same file:** [RouteOptions — `params.parse`](https://tanstack.com/router/latest/docs/framework/react/api/router/RouteOptionsType#paramsparse-method) · [RouteOptions — `validateSearch`](https://tanstack.com/router/latest/docs/framework/react/api/router/RouteOptionsType#validatesearch-method) · [Validate search (Zod)](https://tanstack.com/router/latest/docs/how-to/validate-search-params#quick-start)

```ts
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

// Same Zod rule as UI routes: path params.
const exportParamsSchema = z.object({
  itemId: z.coerce.number().int().positive(),
})

// Same Zod rule as UI routes: query string. Export one schema object — reuse everywhere.
const exportSearchSchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
})

export const Route = createFileRoute('/api/items/$itemId/export')({
  // Same validation mechanism as UI: `params.parse` runs when the route matches.
  // For API routes, if Zod `.parse` throws here, callers get a framework error response
  // (not your custom JSON contract). If you need custom JSON for bad params, validate inside `GET` too.
  params: {
    parse: (raw) => exportParamsSchema.parse(raw),
  },

  // API recommendation: do NOT use route-level `validateSearch` for query params.
  // It would validate, but failures become framework error responses (not your custom JSON contract),
  // and validated search still does not bubble down into `GET`.
  // validateSearch: (search) => exportSearchSchema.parse(search),

  server: {
    handlers: {
      GET: async ({ request, params }) => {
        // Path: `params` comes from the same route-level `params.parse` (Zod output).
        const { itemId } = params

        // Search: the ONLY supported pattern — same Zod schema, raw query from `Request`.
        // No `search` argument on the handler; TanStack Start does not wire `validateSearch` here.
        const rawSearch = Object.fromEntries(new URL(request.url).searchParams)
        const parsed = exportSearchSchema.safeParse(rawSearch)
        if (!parsed.success) {
          // `safeParse` avoids throw; return your own 4xx (Zod flatten for details).
          return Response.json({ error: z.flattenError(parsed.error) }, { status: 400 })
        }
        const { format } = parsed.data

        return Response.json({ itemId, format })
      },
    },
  },
})
```
