# Loader & Data Patterns (TanStack Start)

## Loader Contract

- **Runs:** On server when route is loaded (SSR) or on client in SPA mode. Re-runs when dependencies change if using `loaderDeps`.
- **Arguments:** `{ params, search?, context, deps? }` — typed from route `path` and `validateSearch`.
- **Return:** Serializable object (no functions, no Symbols). Passed to component via `Route.useLoaderData()` or `useLoaderData({ from: routeId })`.

## loaderDeps — When to Re-run

Loader runs on route load. To re-run when search params or something external change, use `loaderDeps`:

```tsx
export const Route = createFileRoute('/products')({
  validateSearch: z.object({ q: z.string().optional(), page: z.number().default(1) }),
  loaderDeps: ({ search }) => ({ q: search.q, page: search.page }),
  loader: async ({ deps }) => {
    const list = await fetchProducts({ q: deps.q, page: deps.page });
    return { list };
  },
  component: ProductsPage,
});
```

When `search.q` or `search.page` changes, loader runs again. Don’t put side effects that must run only once in the loader; use `beforeLoad` or app-level init for that.

## beforeLoad — Auth & Redirects

Runs before loader. Use for redirects and injecting shared context (e.g. user):

```tsx
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ location }) => {
    const user = await getSession();
    if (!user) throw redirect({ to: '/login', search: { redirect: location.href } });
    return { user };
  },
  loader: async ({ context }) => {
    // context.user from beforeLoad
    return { projects: await getProjects(context.user.id) };
  },
  component: Dashboard,
});
```

Return value from `beforeLoad` is merged into route context for that route and children.

## Errors

- **Throw in loader:** Caught by route’s `errorComponent` if defined, or bubble to root error boundary.
- **Not found:** `throw notFound()` (TanStack Router) or return 404 in loader and render a not-found UI.

## Pending & Streaming

- **pendingComponent:** Shown while loader is in flight (e.g. skeleton).
- **Streaming:** Loader runs on server; result streamed when ready. No extra config for basic streaming.

## Prefetching

Use router’s `preloadRoute` or `Link` with prefetch to run loader before navigation:

```tsx
<Link to="/users/$userId" params={{ userId }} preload="intent" />
```

## React Query Integration

Prefill query client in loader so component can use `useQuery` with same key:

```tsx
const userOptions = (id: string) => queryOptions({ queryKey: ['user', id], queryFn: () => fetchUser(id) });

export const Route = createFileRoute('/users/$userId')({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(userOptions(params.userId)),
  component: UserPage,
});

function UserPage() {
  const { userId } = Route.useParams();
  const { data: user } = useQuery(userOptions(userId));
  return <div>{user?.name}</div>;
}
```

## Gotchas

1. **Loader runs per route activation** — not once per app. Use `loaderDeps` for reactive refetch.
2. **Serialization** — returned value must be JSON-serializable (no functions, class instances, undefined in arrays).
3. **Context** — Type router context generically so `context` in loader/`beforeLoad` is typed (e.g. `createRootRoute<{ user: User | null }>()`).
