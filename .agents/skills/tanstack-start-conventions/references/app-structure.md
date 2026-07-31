# App structure (`src`)

Portable layout for `app/src` (or equivalent) in TanStack Start projects. For project-specific paths, use the repo's local `docs/` file. For stack rules (`.server.ts`, loaders, SSR), see [client-server-boundaries.md](client-server-boundaries.md).

## Top-level folders

| Folder        | Purpose                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| `components/` | All React/JSX — route files never define components                      |
| `routes/`     | Route definitions only (thin: `Route` config + single component import)  |
| `shared/`     | Isomorphic modules — Zod schemas, URL search, pure utils (no DB/secrets) |
| `server/`     | Server-only `*.server.ts`, `*.functions.ts`, `*QueryOptions.ts`          |
| `data/`       | Optional static assets (GeoJSON, JSON, etc.)                             |

Plus root files such as `router.tsx`. Prefer `shared/` for isomorphic code, `server/` for RPC/DB, or `components/shared/` for cross-cutting React UI — not a vague top-level `lib/`.

## Root route (`__root.tsx`) + `LayoutRoot`

FMC apps split the document shell across a **thin root route** and **`components/layouts/LayoutRoot.tsx`** (or `components/shared/layouts/` in Trassenscout). The route file owns router config; `LayoutRoot` owns `<html>` / `<body>` / providers / `<Outlet />`.

**References:** [tilda-geo `__root.tsx`](https://github.com/FixMyBerlin/tilda-geo/blob/main/app/src/routes/__root.tsx) · [Trassenscout `__root.tsx`](https://github.com/FixMyBerlin/trassenscout/blob/main/src/routes/__root.tsx)

### Route file (`routes/__root.tsx`)

Typical FMC root route:

- **`createRootRouteWithContext<{ queryClient: QueryClient }>()`** — typed router context (Query + SSR integration in `router.tsx`).
- **`ssr: true`** on the root route.
- **`beforeLoad`** — trailing-slash redirect when `trailingSlash: 'never'` is set on the router (strip `/path/` → `/path`, preserve search + hash). Trassenscout also calls `endpointAuth.public(...)` here for the auth lint boundary.
- **`head()`** — default document meta/links. Inline `APP_META` (tilda-geo) or `resolveRootHead(matches)` helper (Trassenscout — switches to 404 metadata when a match is `notFound`). Child routes override title/description via their own `head()`.
- **`notFoundComponent`** — optional at root (Trassenscout); otherwise rely on router default.
- **`component: LayoutRoot`** — single import from `@/components/layouts/LayoutRoot` (or app-equivalent path). **No inline `<html>` in the route file.**

```tsx
import type { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, redirect } from '@tanstack/react-router'
import { LayoutRoot } from '@/components/layouts/LayoutRoot'
import { APP_META } from '@/meta.const'
import appCss from '@/components/layouts/global.css?url'

type RouterContext = { queryClient: QueryClient }

export const Route = createRootRouteWithContext<RouterContext>()({
  ssr: true,
  beforeLoad: ({ location }) => {
    const { pathname, searchStr, hash } = location
    if (pathname.length <= 1 || !pathname.endsWith('/')) return
    const stripped = pathname.replace(/\/+$/, '') || '/'
    throw redirect({ href: `${stripped}${searchStr}${hash ? `#${hash}` : ''}`, replace: true })
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: APP_META.themeColor },
      { title: APP_META.title },
      { name: 'description', content: APP_META.description },
      { property: 'og:locale', content: 'de_DE' },
      ...(import.meta.env.VITE_APP_ENV !== 'production'
        ? [{ name: 'robots', content: 'noindex' }]
        : []),
    ],
    links: [{ rel: 'stylesheet', href: appCss }, ...APP_META.faviconLinks],
  }),
  component: LayoutRoot,
})
```

Map-heavy apps (tilda-geo): add `viewport-fit=cover` to viewport meta for `env(safe-area-inset-*)`. SEO/social tags, Matomo, per-route `head()` helpers — add when the app needs them; see repo `meta.const` / `routeHead.ts`.

### Document shell (`LayoutRoot.tsx`)

Wrapper only — app chrome (header, footer, map full-bleed rules, devtools) lives here or in child layouts, not in `__root.tsx`.

```tsx
import { HeadContent, Outlet, Scripts, useRouteContext } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { Provider as TanStackQueryProvider } from '@/components/shared/providers/tanstack-query/root-provider'

export function LayoutRoot() {
  const { queryClient } = useRouteContext({ from: '__root__' })

  return (
    <html lang="de" className="h-full">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-dvh w-full flex-col bg-white text-gray-800 antialiased">
        <StrictMode>
          <TanStackQueryProvider queryClient={queryClient}>
            <Outlet />
          </TanStackQueryProvider>
        </StrictMode>
        <Scripts />
      </body>
    </html>
  )
}
```

**FMC defaults:**

| Piece                      | Convention                                                                                      |
| -------------------------- | ----------------------------------------------------------------------------------------------- |
| `lang`                     | **`de`** for FixMyBerlin public apps                                                            |
| CSS                        | Import global stylesheet in route `head()` via `?url` (path under `components/layouts/`)        |
| Query                      | `useRouteContext({ from: '__root__' })` → same `queryClient` as router context                  |
| `<Scripts />`              | End of `<body>` — required for hydration                                                        |
| `suppressHydrationWarning` | On `<body>` when needed (tilda-geo map routes)                                                  |
| Portal root                | Trassenscout: `<div id="headlessui-portal-root" />` before `<Scripts />` when using Headless UI |

**Index and param routes:** `/` → `routes/index.tsx`; dynamic segments use `$param` (e.g. `posts.$slug.tsx`). Read params with `Route.useParams()`.

## `components/` folder standards

| Subfolder   | Purpose                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------- |
| `layouts/`  | All `Layout*.tsx` route shells **and** shared chrome (Header, Footer, `global.css`, assets) |
| `pages/`    | `Page*.tsx` for the `_pages` route group (legal, docs, settings, …)                         |
| `home/`     | `Page*.tsx` for the `_home` route group                                                     |
| `<domain>/` | Feature pages (`regionen/`, `admin/`, …) — `Page*.tsx` only; layouts stay in `layouts/`     |
| `shared/`   | Reusable UI, providers, hooks — not route layouts or document chrome                        |

Route files import layouts from `@/components/layouts/...` only. See `components/layouts/README.md` in apps that ship it for the layout tree.

## Routes: thin, no inline UI

- Route files export `createFileRoute` config: `beforeLoad`, `loader`, `head`, `component`.
- **`component`** is always one import from `@/components/...` — no inline components or heavy UI in route files.
- Route files call server logic only via server functions in `loader` / `beforeLoad` (not direct DB/`getRequestHeaders` except API handlers).

## Components: Layout vs Page

- **Layouts:** `Layout*.tsx` in **`components/layouts/`** — route shell, providers, outlet for child page. `LayoutRoot` is the document shell (`html`/`body`, app header/footer). Devtools: `tanstack-router-conventions` → [devtools.md](../../tanstack-router-conventions/references/devtools.md).
- **Pages:** `Page*.tsx` — actual screen content, colocated with the feature domain (`components/pages/`, `components/regionen/`, …).
- **Deliberate asymmetry:** Route segments may use `_segment` for grouping while `components/` uses a readable folder name (e.g. route `_pages` → `components/pages/` for pages, `components/layouts/LayoutPages.tsx` for the layout).

## Server folder per domain

Under `server/<domain>/`:

- `queries/*.server.ts` — read paths
- `mutations/*.server.ts` — writes
- `*.inputSchemas.ts` — server-only validation extensions (may import from `shared/<domain>/schemas`)
- `<domain>.functions.ts` — `createServerFn` exports consumed by routes/components

Domain Zod and URL search schemas live in `shared/<domain>/` (or `shared/<topic>/` for cross-cutting helpers). See [client-server-boundaries.md](client-server-boundaries.md).

## URL state (search params)

Owned by skill **`tanstack-router-conventions`** (install alongside this skill):

- **Default:** route `validateSearch` (Zod) + `Route.useSearch()` — [params-search-ui-routes.md](../../tanstack-router-conventions/references/params-search-ui-routes.md).
- **Router `router.tsx`:** required pretty-JSON `parseSearch` / `stringifySearch` + `trailingSlash: 'never'` — [router-search-serialization.md](../../tanstack-router-conventions/references/router-search-serialization.md).
- **Map viewport:** `?map=zoom/lat/lng` — [map-search-param.md](../../tanstack-router-conventions/references/map-search-param.md).
- **API routes:** no route-level `validateSearch` — [params-search-api-routes.md](params-search-api-routes.md).
- **Search schema placement** (keep `routes/` for route files only — no `-` prefixed colocated helpers):
  - **Route-only:** inline `const …SearchSchema = z.object({ … })` in the route file.
  - **Shared** (route + `navigate({ search })`, components, or multiple routes): `shared/<domain>/searchSchemas.ts`, or `shared/routing/` for cross-cutting params (e.g. back links). Not `*.server.ts` — routes and components import from `shared/`.
- Colocate search hooks under `components/` when they wrap `Route.useSearch()` + `navigate({ search })`.

Do not add nuqs on greenfield TanStack routes. Skill `nuqs` covers Next.js and legacy interop only.

## Client state (Zustand)

- One concern per `{domain}-store.ts` next to the feature; export **custom hooks only**, not the raw `use*Store` from `create`.
- Patterns: skill `zustand-state-management`.

## Route file naming

- **Folders** for major groups (`admin/`, `api/`, feature areas).
- **Dot notation** for flat lists: `api/export.$id.ts`, `admin/items.$id.edit.tsx`.

## Tests

- **Unit/integration:** colocated `*.test.ts` / `*.test.tsx` next to source; Vitest from app root.
- **E2E:** `tests/*.spec.ts` (Playwright) at app level.
- Keep processing/backend tests in their own package if monorepo.

## Emails (optional)

If using React Email: `src/emails/` with templates; shared pieces in `_templates/` / `_utils/` (underscore prefix so preview tools skip them).
