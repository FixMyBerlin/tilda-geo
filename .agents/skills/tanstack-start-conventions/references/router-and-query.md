# TanStack Router + Query

How we combine route loaders with React Query. Setup lives in `router.tsx` (`queryClient` in router context, `setupRouterSsrQueryIntegration`, and **required** pretty-JSON `parseSearch` / `stringifySearch` — see [router-search-serialization.md](router-search-serialization.md)).

**Further reading:** [TkDodo — TanStack Router and Query](https://tkdodo.eu/blog/tan-stack-router-and-query), [Router Query integration](https://tanstack.com/router/latest/docs/integrations/query), [Start SSR boundaries](client-server-boundaries.md) (server/client, `ssr` vs dehydration).

---

## When to use what

| Need                                                                     | Pattern                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Shared or refetchable data (invalidation, window focus, multiple routes) | `*QueryOptions` in `src/server/…`, loader primes cache, component uses `useQuery` / `useSuspenseQuery`                                                                                                                                                                         |
| Data only for one route, no Query invalidation (most admin CRUD)         | Loader returns serializable data → `routeApi.useLoaderData()`                                                                                                                                                                                                                  |
| Redirects, auth, light context                                           | `beforeLoad` only — see [client-server-boundaries.md](client-server-boundaries.md)                                                                                                                                                                                             |
| Experimental RSC cached in Query                                         | Same `*QueryOptions` + `ensureQueryData` pattern; add **`structuralSharing: false`** — [official RSC Caching](https://tanstack.com/start/latest/docs/framework/react/guide/server-components#tanstack-query) · [server-components.md](server-components.md#caching-with-query) |

Do **not** read Query-backed data only via `useLoaderData`. Query needs an observer (`useQuery` / `useSuspenseQuery`) for refetch, invalidation, and cache retention.

## Loader + component

1. Define **`fooQueryOptions(...)`** once (shared `queryKey` + `queryFn`, often wrapping a server Fn).
2. **Loader:** start the fetch early — `context.queryClient.ensureQueryData(...)` or `prefetchQuery(...)` (await only if SSR or `head()` needs resolved data). Treat the loader as cache priming, not the component’s data API.
3. **Component:** same options — **`useSuspenseQuery`** for blocking UI (works with route `pendingComponent` / `errorComponent`), **`useQuery`** for optional or inline loading.

Pattern: route loader calls `ensureQueryData` with shared options; page or hooks use `useQuery` / `useSuspenseQuery` with the same options.

## Router defaults

- Same `queryClient` in router `context` and `QueryClientProvider` (root layout).
- **`parseSearch` / `stringifySearch`** — pretty-JSON wrapper for readable share URLs ([router-search-serialization.md](router-search-serialization.md)).
- **`trailingSlash: 'never'`** — pair with root `beforeLoad` trailing-slash redirect.
- Set **`defaultPreloadStaleTime: 0`** on the router when using Query so only one cache layer controls staleness ([TkDodo](https://tkdodo.eu/blog/tan-stack-router-and-query)).
- **`defaultPreload: 'intent'`** — loaders (and prefetches) can run before navigation.

## SSR

Route `ssr` (see [selective-ssr.md](selective-ssr.md)) controls server render/loaders; `@tanstack/react-router-ssr-query` dehydrates the Query cache. For first paint with Query data, prefer `useSuspenseQuery` or `await ensureQueryData` in the loader when the markup must be in the initial HTML.
