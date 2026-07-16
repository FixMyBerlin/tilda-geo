# TanStack Start — Execution model

TanStack Start is **isomorphic by default**: route components and loaders can run on **both** the server and the client unless you isolate server-only logic in `createServerFn` (or `createServerOnlyFn` in `*.server.ts`).

**Official docs:** [Execution model](https://tanstack.com/start/latest/docs/framework/react/guide/execution-model)

**Related:** [client-server-boundaries.md](client-server-boundaries.md) (file suffixes) · [server-functions.md](server-functions.md) (RPC API) · [router-and-query.md](router-and-query.md) (loaders + Query)

---

## Loaders run on server and client

On **hard refresh / first visit**, the loader runs on the server (SSR). On **client-side navigation**, the **same loader runs in the browser**.

**Rule:** Anything that needs DB, filesystem, env secrets, or server-only APIs must be inside a `createServerFn` that the loader calls — not inline in the loader body.

```tsx
// WRONG — breaks on client nav
loader: async () => {
  const posts = await fs.readdir('content/posts')
  return { posts }
}

// CORRECT
loader: () => getAllPostsFn()
```

The same rule applies to **route components**: do not `await db` or read secrets in the component body. Fetch in the loader (via server fn) or in React Query backed by a server fn.

---

## Server functions bridge environments

`createServerFn` handlers run **directly on the server** when called from a server context. When called from the client (including a loader during soft nav), the call becomes a **typed RPC request**.

Route files and components import `*.functions.ts` exports — never `*.server.ts` directly. See [client-server-boundaries.md](client-server-boundaries.md).

---

## Common mistakes

1. **Direct DB/fs in loader or component** — works on SSR, breaks on client nav. Wrap I/O in `createServerFn`.
2. **`useLoaderData` for Query-backed data** — use `useSuspenseQuery` with the same `*QueryOptions`. See [router-and-query.md](router-and-query.md).
3. **Fat route files** — FMC: route exports config + one component import from `@/components/`.
4. **String-interpolated `<Link to>`** — use typed `params` prop. See `react-dev` → [tanstack-router.md](../../react-dev/references/tanstack-router.md).
