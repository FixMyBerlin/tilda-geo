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

We prefer **not** using that prefix: put shared query options and other non-route code in a dedicated folder (e.g. `src/server/regionen/` for region-related query options used by loaders and components) and import from there. Then nothing in `routes/` needs a leading dash, and it’s obvious what is a route vs a helper.

---

## Route files: no server-only code

Route files must always import and call server Fns in `loader`/`beforeLoad`; they cannot import `getRequestHeaders` or the DB directly (except API route files, where handler code runs on the server). They may call multiple server Fns, handle redirects, or `fetch` external APIs — see below.

## Routes: When to use `beforeLoad` vs `loader`

- **`beforeLoad`:** Redirects (URL normalization, auth redirect), auth/authorization, and returning context for the route (e.g. `isAuthorized`, `region`). No heavy data fetch.
- **`loader`:** Main page data. Can use `context` from `beforeLoad`. Return a serializable object for `routeApi.useLoaderData()` or use `context.queryClient.ensureQueryData(queryOptions())` when the same data should live in React Query for refetch/cache (see `@tanstack/react-router-ssr-query`).

We prefer `beforeLoad` over using a middleware for the use cases described above.

See also: [TanStack-Start-Auth.md](TanStack-Start-Auth.md). API route handlers and server modules that need the current user must receive the request’s headers and pass them to session helpers.

## Selective SSR (`ssr` option)

There are two separate concepts:

- **Route `ssr`:** controls route-level server behavior on first request (rendering and `beforeLoad`/`loader` execution).
- **`@tanstack/react-router-ssr-query`:** controls React Query cache dehydration/hydration/streaming.

Our default is explicit `ssr: true` unless a route needs a more restrictive mode. For project conventions and current route decisions, see [TanStack-Start-Selective-SSR.md](TanStack-Start-Selective-SSR.md).

## When to use `useLoaderData` vs `useQuery(serverFn)`

- **`routeApi.useLoaderData()`:** Data from the route’s loader. One-shot per navigation, SSR’d, no built-in refetch. Use for the main page payload (e.g. [PageRegionSlug.tsx](../app/src/components/regionen/PageRegionSlug.tsx)).
- **`useQuery(fooFn())`:** Client-driven refetch, or data that is not the main page payload (e.g. uploads list, QA configs). Example: [useRegionDataQueries.ts](../app/src/components/regionen/pageRegionSlug/hooks/useRegionDataQueries.ts).

**Loading, error, and defaults:**

- **`useLoaderData`:** Loading is handled at the **route** level (`pendingComponent`); errors at the route’s `errorComponent`. The hook returns the loader value only; there is no `isPending`/`isError`. No built-in placeholder or default.
- **`useQuery`:** Exposes `isPending`, `isError`, `error`, `data`; the component can show per-query loading/error UI and use `placeholderData` / `initialData`.

**Preload `useQuery` with SSR:**

When you need SSR and React Query cache/refetch for route data: use `ensureQueryData(queryOptions())` in the loader and `useQuery(same queryOptions())` in the component; the SSR Query integration ([router.tsx](../app/src/router.tsx)) handles dehydration, hydration, and streaming.

**Example:** [regionen/index.tsx](../app/src/routes/regionen/index.tsx) (loader) and [PageIndex.tsx](../app/src/components/regionen/PageIndex.tsx) (component) both use [regionenIndexQueryOptions](../app/src/server/regionen/regionenIndexQueryOptions.ts). The region page [regionen/$regionSlug.tsx](../app/src/routes/regionen/$regionSlug.tsx) preloads internal notes (when the region has atlas notes and the user is authorized), QA configs, and QA map data when the `qa` URL param is set; components use [internalNotesQueryOptions](../app/src/server/regionen/regionQueryOptions.ts), [regionQaConfigsQueryOptions](../app/src/server/regionen/regionQueryOptions.ts), and [qaDataForMapQueryOptions](../app/src/server/regionen/regionQueryOptions.ts) via `useQuery`.

## Error handling

Two layers:

- **Route-level (loader/beforeLoad):** We use TanStack Router’s `errorComponent` for errors thrown in `loader` or `beforeLoad`. The router sets [defaultErrorComponent](../app/src/router.tsx) to [DefaultError](../app/src/components/shared/error/DefaultError.tsx); the only per-route override is [regionen/$regionSlug](../app/src/routes/regionen/$regionSlug.tsx), which uses [RegionError](../app/src/components/regionen/pageRegionSlug/RegionError.tsx) for region-specific messaging and links.
- **Render errors:** A React Error Boundary at root catches uncaught errors during render. [ErrorBoundary](../app/src/components/shared/error/ErrorBoundary.tsx) wraps the outlet in [\_\_root.tsx](../app/src/routes/__root.tsx) with [RootErrorFallback](../app/src/components/shared/error/ErrorBoundary.tsx) as fallback. The same `ErrorBoundary` can wrap any subtree for nested, segment-specific fallbacks.

**Server vs client logging:** [logError](../app/src/components/shared/error/logError.ts) uses `createIsomorphicFn()` with `.server()` and `.client()` so logs are prefixed with `[SERVER ERROR]` or `[CLIENT ERROR]`. Used in the Error Boundary’s `componentDidCatch`, and in [DefaultError](../app/src/components/shared/error/DefaultError.tsx) and [RegionError](../app/src/components/regionen/pageRegionSlug/RegionError.tsx).

See also: [TanStack Start — Error Boundaries](https://tanstack.com/start/latest/docs/framework/react/guide/error-boundaries).
