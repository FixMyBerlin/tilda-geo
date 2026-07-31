# TanStack Router — TypeScript only

**Routing behavior** (loaders, React Query, `validateSearch`, pretty search URLs) → this skill.  
**Start-only** (SSR, server functions, API routes) → skill `tanstack-start-conventions` (install separately).

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
  const data = Route.useLoaderData() // prefer Query patterns per router-and-query.md
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

- UI routes: Zod `validateSearch` on the route — [params-search-ui-routes.md](params-search-ui-routes.md)
- **Router `router.tsx`:** required `parseSearch` / `stringifySearch` (pretty JSON + per-param encodings) — [router-search-serialization.md](router-search-serialization.md)

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

- Loader vs `useLoaderData` vs `useSuspenseQuery` → [router-and-query.md](router-and-query.md)
- `createServerFn` / `*.functions.ts` → `tanstack-start-conventions`
- Selective `ssr` → `tanstack-start-conventions`
- Auth `beforeLoad` → `tanstack-start-auth`
