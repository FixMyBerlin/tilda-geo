# Next.js → TanStack Start Concept Mapping

## Data & Rendering

| Next.js | TanStack Start | Notes |
|---------|----------------|--------|
| `getServerSideProps` | Route `loader` | Async; receives `params`, `search` (if validateSearch), `context`. Return serializable object. |
| `getStaticProps` | Route `loader` | For SSG, run at build time via Vinxi/static export, or use loader + cache. |
| `getStaticPaths` | Route tree + loader | Dynamic paths from file routes (`$param`). 404 in loader for invalid id. |
| App Router `async` page + fetch | `loader` + `useLoaderData()` | Move all page-level fetch into loader; component stays sync, reads from hook. |
| `generateMetadata` | Document/head in root or route | Use framework head API or custom document. |
| RSC Server Component | N/A | No RSC boundary. Use loader for server data; components are client. |

## Mutations & Server Logic

| Next.js | TanStack Start |
|---------|----------------|
| Server Action (`'use server'`) | `createServerFn({ method: 'POST' })` + handler |
| `formAction={action}` | Call server function in `onSubmit`; manage pending/error in state |
| `useFormStatus` | Local `useState` for pending or `useTransition` |

## API & Server

| Next.js | TanStack Start |
|---------|----------------|
| `pages/api/*` | Server function (preferred) or Vinxi server route / `createAPIFile` |
| `route.ts` (App Router) | Vinxi server handler or server function |

## Config & Env

| Next.js | TanStack Start |
|---------|----------------|
| `next.config.js` | `vinxi.config.ts` / `app.config.ts` |
| `process.env.*` | `import.meta.env.*`; client: `VITE_*` |
| `public/` | `public/` (Vite) |
| Rewrites / redirects | Vinxi server or router `beforeLoad` redirect |

## File Layout (Typical)

```
Next.js (App Router)          TanStack Start
app/                          app/
  layout.tsx                     routes/__root.tsx  (root layout)
  page.tsx                       routes/index.tsx   (index)
  [slug]/page.tsx               routes/$slug.tsx
  api/...                       (server functions or server/)
components/                    components/
```

Route params: Next.js `[id]` → Start `$id` in path; access via `params.id` in loader/component.
