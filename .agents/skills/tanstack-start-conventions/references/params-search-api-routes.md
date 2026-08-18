# TanStack Start: path params & search — API (server) routes

Validation uses **Zod 4** everywhere in FMC TanStack Start apps. Pin `zod@4.4.3`.

**UI routes** (`validateSearch`, typed `Route.useSearch()`): skill `tanstack-router-conventions` → [params-search-ui-routes.md](../../tanstack-router-conventions/references/params-search-ui-routes.md).

TanStack Router follows **two execution paths**: UI routes run matching, `validateSearch`, loaders, and components; **server route handlers** are plain `Request` handlers. Handlers receive **`request`**, **`params`**, and **`context`** only — there is **no** validated `search` object on `GET`.

**When to use which:** App-internal reads/writes → **`createServerFn`** (see [server-functions.md](server-functions.md)). API routes → public REST, webhooks, third-party callbacks, or Better Auth handlers under `routes/api/`.

---

## Comparison (path vs search on API routes)

| Topic                        | API routes (`server.handlers`)                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Path params (`$segment`)** | Same Zod `params.parse` as UI routes. Read: `GET: ({ params })` — [TanStack Start — Handler context](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes#handler-context), [Dynamic path params](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes#dynamic-path-params). API routes do not have custom error components, so when route-level param parsing fails you do not control what users/callers see. |
| **Search (`?`)**             | You can use route-level `validateSearch`, but for API routes it usually reduces control: thrown errors become framework responses (not your custom JSON), and validated search still does not flow into `GET`. **Recommendation:** do not use `validateSearch` for API search params; validate only in `GET` with Zod + explicit manual 4xx JSON handling. [Server route search params (discussion)](https://www.answeroverflow.com/m/1422316941334282351). |

---

## API routes (`server.handlers`)

**TanStack Start:** [Server routes](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes) · [Handler context](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes#handler-context) · [Dynamic path params](https://tanstack.com/start/latest/docs/framework/react/guide/server-routes#dynamic-path-params)

**Router (Zod) for the same file:** [RouteOptions — `params.parse`](https://tanstack.com/router/latest/docs/framework/react/api/router/RouteOptionsType#paramsparse-method) · [Validate search (Zod)](https://tanstack.com/router/latest/docs/how-to/validate-search-params#quick-start)

```ts
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

// Same Zod rule as UI routes: path params.
const exportParamsSchema = z.object({
  itemId: z.coerce.number().int().positive(),
})

// Same Zod rule as UI routes: query string. Export when the route and `GET` both validate search.
export const exportSearchSchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
})

export const Route = createFileRoute('/api/items/$itemId/export')({
  ssr: false,
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

**POST (webhooks, uploads):** same `ssr: false` handler-only pattern — parse body in the handler with Zod; no `validateSearch`.

```ts
export const Route = createFileRoute('/api/upload/image')({
  ssr: false,
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json()
        // validate with Zod, then process
        return Response.json({ ok: true })
      },
    },
  },
})
```
