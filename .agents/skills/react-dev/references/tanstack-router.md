# TanStack Router — TypeScript only

**Canonical copy:** skill `tanstack-router-conventions` → [router-typescript.md](../../tanstack-router-conventions/references/router-typescript.md).

**Routing behavior** (loaders, React Query, `validateSearch`, pretty search URLs) → `tanstack-router-conventions`.  
**Start-only** (SSR, server functions, API routes) → `tanstack-start-conventions`.

Docs: [TanStack Router](https://tanstack.com/router/latest/docs/framework/react/overview) · [llms.txt](https://tanstack.com/llms.txt)

## Typed hooks with `createFileRoute`

Inside a route’s component, use the route’s static API for inference:

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/users/$userId')({
  component: UserPage,
  validateSearch: userSearchSchema,
  loader: async ({ params }) => {
    /* ... */
  },
})

function UserPage() {
  const { userId } = Route.useParams()
  const search = Route.useSearch()
  const data = Route.useLoaderData() // prefer Query patterns per tanstack-router-conventions
}
```

## `from` for cross-route typing

When using shared hooks outside the route file:

```typescript
import { useParams, useSearch } from '@tanstack/react-router'
import { Route as userRoute } from '@/routes/users/$userId'

const { userId } = useParams({ from: userRoute.id })
const { tab } = useSearch({ from: userRoute.id })
```

## Typed `Link` params

Never string-interpolate path segments into `to` — you lose type checking and break param encoding.

```tsx
// ❌ Wrong
<Link to={`/posts/${post.slug}`}>View</Link>

// ✅ Correct
<Link to="/posts/$slug" params={{ slug: post.slug }}>
  View
</Link>
```

Catch-all splat routes (`routes/posts/$.tsx`) expose the remainder via `Route.useParams()` → `_splat`.

## Search params

- UI routes: Zod `validateSearch` — `tanstack-router-conventions` → `params-search-ui-routes.md`
- **Router `router.tsx`:** required `parseSearch` / `stringifySearch` — `tanstack-router-conventions` → `router-search-serialization.md`

## Router type registration

Register the router for global link/search inference (app `router.tsx`):

```typescript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

## Do not duplicate here

- Loader vs `useLoaderData` vs `useSuspenseQuery` → `tanstack-router-conventions`
- `createServerFn` / `*.functions.ts` / selective `ssr` → `tanstack-start-conventions`
- Auth `beforeLoad` → `tanstack-start-auth`
