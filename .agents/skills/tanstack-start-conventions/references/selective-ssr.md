# TanStack Start — Selective SSR

How to use TanStack Start selective SSR and how it differs from `@tanstack/react-router-ssr-query`.

Applies to FMC TanStack Start apps (e.g. **TILDA**, **Trassenscout**): same route `ssr` rules under each app’s `src/routes/` tree.

Official docs:

- TanStack Start Selective SSR: <https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr>
- TanStack Router Query integration: <https://tanstack.com/router/latest/docs/integrations/query>

---

## What controls what

Two features are related, but they solve different problems:

- **Route `ssr` option (`true` / `'data-only'` / `false`):** controls route execution and rendering behavior on the initial server request.
- **`@tanstack/react-router-ssr-query`:** controls React Query dehydration, streaming, and hydration between server and client.

In short:

- `ssr` decides if a route component is rendered on the server and whether `beforeLoad` / `loader` run on the server.
- `@tanstack/react-router-ssr-query` decides how QueryClient state moves from server to client.

They are complementary and used together.

## Route defaults and rule of thumb

Keep the app default as full SSR and set selective SSR per route where needed.

- **Convention:** always set `ssr` explicitly in route definitions (do not rely on implicit defaults).
- **Default:** full SSR (`ssr: true` behavior).
- **Use `ssr: 'data-only'`:** when a route is mainly browser-only UI (map/canvas-heavy), but you still want server `beforeLoad` / `loader` for redirects/auth/data.
- **Use `ssr: false`:** when both route rendering and route data loading should be client-only on first load; also for **handler-only API routes** (see below).

## API routes (`server.handlers`)

Handler-only route files have no React `component` — only `server.handlers` (REST, webhooks, Better Auth, uploads, exports). In FMC apps these usually live under **`src/routes/api/**`** (flat or nested files; TILDA may use `api/\*.ts` at the routes root with the same pattern).

Set **`ssr: false`** explicitly on every handler-only route:

- Documents that the route is not part of the React SSR pipeline.
- Avoids accidental server `beforeLoad` / `loader` if someone adds them later.
- `server.handlers` still run on the server; `ssr` does **not** disable handlers.

Do not use `ssr: true` on API-only routes — it suggests React SSR is intended. Legacy `ssr: true` on API files should be migrated to `ssr: false` when touched.

## Example: map-heavy route with `data-only`

Typical pattern for a client-heavy page that still needs server auth and cache priming:

- Route: e.g. `/regionen/$regionSlug` (TILDA) or `/items/$itemId/map`
- Setting: `ssr: 'data-only'`

Why:

- Main UI is MapLibre/canvas-based and client-heavy.
- You still need server `beforeLoad` and `loader` for redirect normalization, auth context, and initial data work.
- Loader preloads React Query cache (`ensureQueryData(...)`); `@tanstack/react-router-ssr-query` dehydrates/hydrates that cache for the client.

## Operational notes

- Keep `setupRouterSsrQueryIntegration(...)` in `router.tsx`.
- Prefer configuring selective SSR at leaf routes instead of broad parent routes unless all children should inherit that restriction.
- SSR inheritance is one-way to stricter modes only (`true` -> `'data-only'` -> `false`), so setting `ssr: true` at higher levels is safe because child routes can still become more restrictive later, but a child route cannot become less restrictive than its parent. See TanStack docs: <https://tanstack.com/start/latest/docs/framework/react/guide/selective-ssr#inheritance>.
- Ensure data-only routes have a useful route `pendingComponent`, because fallback UI is what is rendered server-side for the first matching non-SSR route.

## Server Components + selective SSR

When using experimental RSC, pair route `ssr` with how the RSC is fetched and rendered:

- **`ssr: 'data-only'`** — loader fetches RSC on the server; route component renders on the client (browser APIs, map shells). Typical FMC map-heavy pattern.
- **`ssr: false`** — loader itself needs browser APIs (e.g. `localStorage`) before creating the RSC.

RSC FMC conventions and official doc links: [server-components.md](server-components.md). Setup, helpers, slots, caching: [TanStack Start Server Components](https://tanstack.com/start/latest/docs/framework/react/guide/server-components).
