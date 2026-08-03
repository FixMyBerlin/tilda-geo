# TanStack Router + Query

How we combine route loaders with React Query. Setup lives in `router.tsx` (`queryClient` in router context and **required** pretty-JSON `parseSearch` / `stringifySearch` — see [router-search-serialization.md](router-search-serialization.md)).

**Further reading:** [TkDodo — TanStack Router and Query](https://tkdodo.eu/blog/tan-stack-router-and-query), [Router Query integration](https://tanstack.com/router/latest/docs/integrations/query).

---

## When to use what

| Need                                                                     | Pattern                                                                                   |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Shared or refetchable data (invalidation, window focus, multiple routes) | `*QueryOptions` once, loader primes cache, component uses `useQuery` / `useSuspenseQuery` |
| Data only for one route, no Query invalidation (most admin CRUD)         | Loader returns serializable data → `routeApi.useLoaderData()`                             |
| Redirects, auth, light context                                           | `beforeLoad`                                                                              |

Do **not** read Query-backed data only via `useLoaderData`. Query needs an observer (`useQuery` / `useSuspenseQuery`) for refetch, invalidation, and cache retention.

## Loader contract

Loaders receive `{ params, search?, context, deps? }` — typed from the route path and `validateSearch`. Return a **JSON-serializable** object (no functions, class instances). Non-Query data is read via `Route.useLoaderData()`.

On a **Vite SPA**, loaders run on the client.

## Loader + component

1. Define **`fooQueryOptions(...)`** once (shared `queryKey` + `queryFn`).
2. **Loader:** start the fetch early — `context.queryClient.ensureQueryData(...)` or `prefetchQuery(...)` (await only if the route `head()` or first paint needs resolved data). Treat the loader as cache priming, not the component’s data API.
3. **Component:** same options — **`useSuspenseQuery`** for blocking UI (works with route `pendingComponent` / `errorComponent`), **`useQuery`** for optional or inline loading.

Pattern: route loader calls `ensureQueryData` with shared options; page or hooks use `useQuery` / `useSuspenseQuery` with the same options.

## Not found, pending, prefetch

- **Not found:** `throw notFound()` in the loader when a resource does not exist — route `notFoundComponent` or root default handles the response.
- **Pending UI:** `pendingComponent` on the route (skeleton while loader is in flight).
- **Prefetch:** `<Link preload="intent" to="..." />` or `router.preloadRoute()` — pair with router `defaultPreload: 'intent'` (below).

## Router defaults

- Same `queryClient` in router `context` and `QueryClientProvider` (root layout).
- **`parseSearch` / `stringifySearch`** — pretty-JSON wrapper for readable share URLs ([router-search-serialization.md](router-search-serialization.md)).
- **`trailingSlash: 'never'`** — pair with root `beforeLoad` trailing-slash redirect.
- Set **`defaultPreloadStaleTime: 0`** on the router when using Query so only one cache layer controls staleness ([TkDodo](https://tkdodo.eu/blog/tan-stack-router-and-query)).
- **`defaultPreload: 'intent'`** — loaders (and prefetches) can run before navigation.

---

## Out of scope (TanStack Start)

SSR dehydration (`setupRouterSsrQueryIntegration`, route `ssr`), isomorphic loaders, and `createServerFn` for server I/O → skill `tanstack-start-conventions`. On Start, prefer `useSuspenseQuery` or `await ensureQueryData` in the loader when markup must be in the initial HTML.
