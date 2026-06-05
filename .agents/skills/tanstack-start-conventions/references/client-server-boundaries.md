# TanStack Start — Client vs. Server Boundaries

This doc describes how we keep server-only and client-only code in the right bundles: file naming, import protection, and when to use loaders vs. server functions vs. React Query.

**Official docs:** [TanStack Start](https://tanstack.com/start/), [TanStack Router](https://tanstack.com/router/latest), [TanStack Query](https://tanstack.com/query/latest)

---

## Folder `/server`

`/server` holds all modules and helpers that are server-only or define RPC (server function) handlers.

## Filename conventions

### Server-only modules: `/server/*.server.ts`

We mark modules that only ever run on the server with the **`.server.ts`** suffix. See [Import Protection](https://tanstack.com/start/latest/docs/framework/react/guide/import-protection). We do _not_ use `import '@tanstack/react-start/server-only'`.

Characteristics of those files:

- use functions from `@tanstack/react-start/server` (e.g. `getRequestHeaders()`, `getRequest()`, `setCookie()`), the DB, or other server-only APIs
- are _never_ imported by route files or components (so they stay out of the client bundle)

In `.server.ts` files, **use `createServerOnlyFn`** for any exported callable (never `createServerFn`).

### API routes under `routes/api/` — do not use the server-only marker

We **do not** add `import '@tanstack/react-start/server-only'` to API route files. The TanStack Router file-based route tree (`routeTree.gen.ts`) imports every route file, including `routes/api/*`, so those modules are loaded in the client bundle. If they contain the server-only marker, import protection correctly denies them in the client and the **build fails**. The route’s `server.handlers` still run only on the server; only the route module is loaded on both sides. Keep API route files free of the marker, and avoid top-level imports that would pull `*.server.ts` or other server-only code into the client. Use static imports only for modules that are safe on both sides or that the bundler tree-shakes when the handler is replaced (e.g. many `@/server` utilities are only used inside the handler and may be dropped from the client bundle). If you need to call server-only logic from an API route, import it inside the handler or use a pattern that does not require the route file itself to be marked server-only.

We do **not** use a broad `importProtection.ignoreImporters` (e.g. `['**/routes/**', '**/server/**']`) in Vite config. The [TanStack Import Protection](https://tanstack.com/start/latest/docs/framework/react/guide/import-protection) plugin defers violation checks until after tree-shaking: imports that are only used in server handler code are pruned from the client bundle, so no violation is reported. So API routes and `*.functions.ts` files can statically import `*.server.ts` modules used only inside handlers without any config override.

### Client-callable server Fns: `/server/*.functions.ts`

Files that export `createServerFn` and are imported by route files or components use the **`.functions.ts`** suffix. They must not be `*.server.ts` (client could not import) or `*.client.ts` (they run in both environments). See [TanStack Start — Server Functions](https://tanstack.com/start/latest/docs/framework/react/guide/server-functions).

**Function names:** All `createServerFn` / `createServerOnlyFn` use the pattern **`functionNameFn`** (e.g. `getRegionPageLoaderFn`, `getUploadsForRegionUserFn`).

### Route folder: files that are not routes

The TanStack Router file-based plugin ignores files whose name starts with **`-`** (default `routeFileIgnorePrefix: '-'`), so they are not turned into routes. That allows colocating non-route modules (e.g. query options) next to the route that uses them.

We prefer **not** using that prefix: put shared query options and other non-route code in a dedicated folder (e.g. `src/server/<domain>/` for query options used by loaders and components) and import from there. Then nothing in `routes/` needs a leading dash, and it’s obvious what is a route vs a helper.

---

## Route files: no server-only code

Route files must always import and call server Fns in `loader`/`beforeLoad`; they cannot import `getRequestHeaders` or the DB directly (except API route files, where handler code runs on the server). They may call multiple server Fns, handle redirects, or `fetch` external APIs — see below.

## Routes: When to use `beforeLoad` vs `loader`

- **`beforeLoad`:** Redirects (URL normalization, auth redirect), auth/authorization, and returning context for the route (e.g. `isAuthorized`, `region`). No heavy data fetch.
- **`loader`:** Page data and cache priming. Can use `context` from `beforeLoad`. For React Query–backed data, see [router-and-query.md](router-and-query.md); otherwise return serializable data for `useLoaderData()` (e.g. admin pages).

We prefer `beforeLoad` over using a middleware for the use cases described above.

See also: [auth.md](../tanstack-start-auth/references/auth.md) in the `tanstack-start-auth` skill. API route handlers and server modules that need the current user must receive the request’s headers and pass them to session helpers.

## Selective SSR (`ssr` option)

There are two separate concepts:

- **Route `ssr`:** controls route-level server behavior on first request (rendering and `beforeLoad`/`loader` execution).
- **`@tanstack/react-router-ssr-query`:** controls React Query cache dehydration/hydration/streaming.

Our default is explicit `ssr: true` unless a route needs a more restrictive mode. For project conventions and current route decisions, see [selective-ssr.md](selective-ssr.md).

## Router + React Query

See **[router-and-query.md](router-and-query.md)** for loader vs `useLoaderData` vs `useQuery` / `useSuspenseQuery`, shared `*QueryOptions`, and SSR. This file covers server/client boundaries only.

## Error handling

Two layers:

- **Route-level (loader/beforeLoad):** Use TanStack Router’s `errorComponent` for errors thrown in `loader` or `beforeLoad`. Set a `defaultErrorComponent` on the router; override per route when you need domain-specific messaging.
- **Render errors:** Wrap the outlet in a React Error Boundary at root (and optionally on subtrees) for uncaught render errors.

**Server vs client logging:** Use `createIsomorphicFn()` with `.server()` and `.client()` branches so logs are prefixed distinctly (e.g. `[SERVER ERROR]` / `[CLIENT ERROR]`). Use in Error Boundary `componentDidCatch` and route error components.

See also: [TanStack Start — Error Boundaries](https://tanstack.com/start/latest/docs/framework/react/guide/error-boundaries).
