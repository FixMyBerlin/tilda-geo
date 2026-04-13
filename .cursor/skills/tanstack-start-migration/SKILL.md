---
name: tanstack-start-migration
description: Migrate Next.js apps to TanStack Start. Covers setup (Vinxi/Vite), data handling with route loaders, converting Server Actions to Server Functions, API routes, and optional Server Component patterns. Use when migrating from Next.js to TanStack Start, setting up TanStack Start, or refactoring server actions, getServerSideProps, getStaticProps, or API routes.
---

# Next.js → TanStack Start Migration

Focus: **data handling**, server-side behavior, and routing. TanStack Start = TanStack Router + Vinxi (Vite-based server). No App Router RSC model; data flows via **route loaders** and **server functions**.

## When to Apply

- Migrating a Next.js (Pages or App Router) app to TanStack Start
- Setting up a new TanStack Start project with SSR/data
- Converting Server Actions → Server Functions
- Replacing `getServerSideProps` / `getStaticProps` / `getStaticPaths` with loaders
- Replacing API routes with server functions or Vinxi server handlers

## Quick Mapping (Next.js → TanStack Start)

| Next.js | TanStack Start |
|---------|----------------|
| `getServerSideProps` | Route `loader` (runs on server per request) |
| `getStaticProps` | Route `loader` + build-time SSG or `loaderDeps` caching |
| `getStaticPaths` | Route tree + optional `loader` that returns 404 |
| Server Actions | **Server Functions** (`createServerFn`) |
| `pages/api/*` | Server functions or Vinxi `createAPIFile`/server handlers |
| App Router RSC + `fetch` | Loader fetches; component uses `useLoaderData()` |
| `next/config` rewrites/headers | Vinxi/server config |

See [references/nextjs-to-start-mapping.md](references/nextjs-to-start-mapping.md) for edge cases and file layout.

---

## 1. Project Setup

**Scaffold:**

```bash
npm create vinxi@latest my-app
# Choose: TanStack Start (React)
```

**Key structure:**

- `app/` — app entry, routes, components
- `app/routes/` — file-based or manual route tree
- `app/entry-client.tsx` — client hydrate
- `app/entry-server.tsx` — server render
- `vinxi.config.ts` or `app.config.ts` — Vinxi config (entry points, SSR on/off)

**SSR:** Enabled by default in Start. For SPA-only, configure Vinxi server plugin accordingly.

**Env:** Use `import.meta.env` (Vite). Replace `process.env` with `import.meta.env` (e.g. `import.meta.env.VITE_API_URL`).

---

## 2. Data Handling: Loaders (Replace getServerSideProps / RSC data)

Route-level async **loaders** run on the server (or client in SPA mode). Component reads data with `useLoaderData()`.

**Define loader on route:**

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params }) => {
    const user = await fetchUser(params.userId);
    return { user };
  },
  component: UserPage,
});

function UserPage() {
  const { user } = Route.useLoaderData();
  return <h1>{user.name}</h1>;
}
```

**Loader params:** `params`, `search` (from `validateSearch`), `context`, `deps` (see loaderDeps). Return value is serialized to client.

**Critical:** Loaders run when the route is loaded. For refetch on search/param change, use `loaderDeps` so the loader re-runs when deps change. Avoid side effects that must run only once in a different lifecycle.

**Validation:** Use `validateSearch` (e.g. Zod) for search params; use `beforeLoad` for auth/redirects. See [references/loader-data-patterns.md](references/loader-data-patterns.md).

---

## 3. Server Actions → Server Functions

Next.js Server Actions become **Server Functions**: RPC-style functions that run on the server and are callable from the client.

**Define server function:**

```tsx
import { createServerFn } from '@tanstack/start';

export const updateProfile = createServerFn({ method: 'POST' })
  .validator((data: { name: string }) => data)
  .handler(async ({ data }) => {
    await db.user.update({ where: { id: session.userId }, data: { name: data.name } });
    return { ok: true };
  });
```

**Call from client:**

```tsx
'use client';
import { updateProfile } from './profile.server';

function Form() {
  const [pending, setPending] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    await updateProfile({ data: { name: formData.name } });
    setPending(false);
  };
  return <form onSubmit={handleSubmit}>...</form>;
}
```

**Rules:**

- Server function code runs only on server. Put in a `.server.ts` or `server/` file so client bundle doesn’t pull server-only code.
- Use `method: 'POST'` for mutations; GET for idempotent reads (if needed).
- Validator: validate input (e.g. Zod) before handler runs.
- For form actions, call server function in `onSubmit` and handle loading/error state (no `formAction` prop like Next.js).

See [references/server-functions.md](references/server-functions.md) for validation, errors, and invalidation.

---

## 4. API Routes → Server Functions or Vinxi Handlers

- **RPC-style (recommended):** Expose logic as server functions; no separate REST endpoints.
- **REST/third-party webhooks:** Use Vinxi server API (e.g. `createAPIFile` or server route in `app/server/`) that returns Response. Map `pages/api/foo` to one such handler.

Do not recreate every API route as a REST endpoint; prefer server functions for app-to-server calls.

---

## 5. Server Components (Next.js RSC)

TanStack Start does not have the same RSC boundary model. Equivalent pattern:

- **Data:** Fetch in route **loader** (server); component is client and uses `useLoaderData()`.
- **Server-only rendering:** Components that only run on server are not a first-class boundary; use loaders for server data and keep components client-safe. For “server-only” code, run it inside loaders or server functions.

When migrating RSC pages: move `async` page component’s data fetching into the route’s `loader`; replace `await fetch()` in component with `useLoaderData()`.

---

## 6. Routing

- **File-based:** `app/routes/` with `createFileRoute('/path/$param')`; route tree generated.
- **Code-based:** Define route tree manually with `createRoute` / `createRootRoute` and pass to router.

Params: `path: '/users/$userId'` → `params.userId`. Search: `validateSearch` on route. Use `Link`, `useNavigate`, `useParams`, `useSearch` from `@tanstack/react-router`. See project’s [react-dev/references/tanstack-router.md](../../react-dev/references/tanstack-router.md) for types and patterns.

---

## 7. Migration Checklist

- [ ] Create Vinxi/TanStack Start app; move UI into `app/`.
- [ ] Replace `getServerSideProps`/RSC fetch with route **loaders**; use `useLoaderData()` in components.
- [ ] Replace **Server Actions** with **createServerFn**; call from client in event handlers.
- [ ] Replace `pages/api/*` with server functions or Vinxi API handlers.
- [ ] `process.env` → `import.meta.env`; expose client vars with `VITE_` prefix.
- [ ] Next.js `next/head` / metadata → use Start/Vinxi document/head APIs if needed.
- [ ] Images: use Vite asset handling or a small image component; no `next/image` (optional third-party or custom).
- [ ] Middleware: use route `beforeLoad` for auth/redirects; no Next.js middleware.

---

## References

| Topic | File |
|-------|------|
| Next.js ↔ Start concept mapping, file layout | [nextjs-to-start-mapping.md](references/nextjs-to-start-mapping.md) |
| Loaders, loaderDeps, errors, prefetch | [loader-data-patterns.md](references/loader-data-patterns.md) |
| createServerFn, validation, errors, invalidation | [server-functions.md](references/server-functions.md) |

**External:** [TanStack Start docs](https://tanstack.com/start/latest) — Migrate from Next.js, Server Functions, Getting Started. Community cookbooks (e.g. TanStack-Start-React-Cookbook, skills.sh TanStack Start skills) align with the above; use official docs as source of truth for API.
