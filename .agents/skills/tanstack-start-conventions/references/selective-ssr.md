# TanStack Start — Selective SSR

How to use TanStack Start selective SSR and how it differs from `@tanstack/react-router-ssr-query`.

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
- **Use `ssr: false`:** only when both route rendering and route data loading should be client-only on first load.

## Example: map-heavy route with `data-only`

Typical pattern for a client-heavy page that still needs server auth and cache priming:

- Route: e.g. `/items/$itemId/map`
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
