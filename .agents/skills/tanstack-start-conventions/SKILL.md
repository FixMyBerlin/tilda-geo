---
name: tanstack-start-conventions
description: >-
  TanStack Start and Router conventions for FixMyBerlin/FMC: app folder layout,
  thin routes, client/server file suffixes, loaders vs React Query, selective SSR,
  experimental server components (RSC), router search serialization (clean share
  URLs), and UI vs API route param/search validation. Use when scaffolding or
  refactoring app/src structure, working on TanStack Start routes, server
  functions, loaders, router.tsx parseSearch/stringifySearch, renderServerComponent,
  createCompositeComponent, validateSearch, or API routes under routes/api/.
disable-model-invocation: true
---

# TanStack Start conventions

Stack conventions for TanStack Start apps in this org. Pair with `tanstack-start-auth` for auth and session layout.

## When to apply

- Scaffolding or refactoring `app/src` folder layout
- Adding or changing routes, loaders, `beforeLoad`, or API handlers
- Splitting code between `.server.ts` and `.functions.ts`
- Choosing loader vs React Query vs `useLoaderData`
- Setting route `ssr` or debugging SSR / hydration
- Installing or changing the TanStack devtools debug panel (Query, Router, Form)
- Using server components (`renderServerComponent`, `createCompositeComponent`)
- Validating path params or search (UI vs API)
- Configuring `router.tsx` (`parseSearch`, `stringifySearch`, trailing slashes, search param encoding)

## App structure (`src`)

Portable layout for `app/src` (or equivalent). For project-specific paths, use the repo's local `docs/` file.

### Top-level folders

| Folder        | Purpose                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| `components/` | All React/JSX — route files never define components                      |
| `routes/`     | Route definitions only (thin: `Route` config + single component import)  |
| `shared/`     | Isomorphic modules — Zod schemas, URL search, pure utils (no DB/secrets) |
| `server/`     | Server-only `*.server.ts`, `*.functions.ts`, `*QueryOptions.ts`          |
| `data/`       | Optional static assets (GeoJSON, JSON, etc.)                             |

Plus root files such as `router.tsx`. Prefer `shared/` for isomorphic code, `server/` for RPC/DB, or `components/shared/` for cross-cutting React UI — not a vague top-level `lib/`.

### `components/` folder standards

| Subfolder   | Purpose                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------- |
| `layouts/`  | All `Layout*.tsx` route shells **and** shared chrome (Header, Footer, `global.css`, assets) |
| `pages/`    | `Page*.tsx` for the `_pages` route group (legal, docs, settings, …)                         |
| `<domain>/` | Feature pages (`regionen/`, `admin/`, …) — `Page*.tsx` only; layouts stay in `layouts/`     |
| `shared/`   | Reusable UI, providers, hooks — not route layouts or document chrome                        |

Route files import layouts from `@/components/layouts/...` only. See `components/layouts/README.md` in apps that ship it for the layout tree.

### Routes: thin, no inline UI

- Route files export `createFileRoute` config: `beforeLoad`, `loader`, `head`, `component`.
- **`component`** is always one import from `@/components/...` — no inline components or heavy UI in route files.
- Route files call server logic only via server functions in `loader` / `beforeLoad` (not direct DB/`getRequestHeaders` except API handlers).

### Components: Layout vs Page

- **Layouts:** `Layout*.tsx` in **`components/layouts/`** — route shell, providers (e.g. `NuqsAdapter`), outlet for child page. `LayoutRoot` is the document shell (`html`/`body`, app header/footer). Devtools: [devtools.md](references/devtools.md).
- **Pages:** `Page*.tsx` — actual screen content, colocated with the feature domain (`components/pages/`, `components/regionen/`, …).
- **Deliberate asymmetry:** Route segments may use `_segment` for grouping while `components/` uses a readable folder name (e.g. route `_pages` → `components/pages/` for pages, `components/layouts/LayoutPages.tsx` for the layout).

### Server folder per domain

Under `server/<domain>/`:

- `queries/*.server.ts` — read paths
- `mutations/*.server.ts` — writes
- `*.inputSchemas.ts` — server-only validation extensions (may import from `shared/<domain>/schemas`)
- `<domain>.functions.ts` — `createServerFn` exports consumed by routes/components

Domain Zod and URL search schemas live in `shared/<domain>/` (or `shared/<topic>/` for cross-cutting helpers). See [client-server-boundaries.md](references/client-server-boundaries.md).

### URL state (search params)

- **Default:** route `validateSearch` (Zod) + `Route.useSearch()` — [params-search-ui-vs-api.md](references/params-search-ui-vs-api.md).
- **Router `router.tsx`:** required pretty-JSON `parseSearch` / `stringifySearch` + `trailingSlash: 'never'` — [router-search-serialization.md](references/router-search-serialization.md).
- **nuqs only** for shared/third-party components that already use `useQueryState`; then `NuqsAdapter` from `nuqs/adapters/tanstack-router` on the smallest layout in `components/layouts/` that needs it (experimental; prefer router search for app-owned state).
- **Search schema placement** (keep `routes/` for route files only — no `-` prefixed colocated helpers):
  - **Route-only:** inline `const …SearchSchema = z.object({ … })` in the route file.
  - **Shared** (route + `navigate({ search })`, components, or multiple routes): `shared/<domain>/searchSchemas.ts`, or `shared/routing/` for cross-cutting params (e.g. back links). Not `*.server.ts` — routes and components import from `shared/`.
- Colocate nuqs parsers/hooks only where nuqs is required (under `components/`).

Skill `nuqs` covers Next.js and nuqs interop; do not reach for nuqs on greenfield TanStack routes.

### Client state (Zustand)

- One concern per `{domain}-store.ts` next to the feature; export **custom hooks only**, not the raw `use*Store` from `create`.
- Patterns: skill `zustand-state-management`.

### Route file naming

- **Folders** for major groups (`admin/`, `api/`, feature areas).
- **Dot notation** for flat lists: `api/export.$id.ts`, `admin/items.$id.edit.tsx`.

### Tests

- **Unit/integration:** colocated `*.test.ts` / `*.test.tsx` next to source; Vitest from app root.
- **E2E:** `tests/*.spec.ts` (Playwright) at app level.
- Keep processing/backend tests in their own package if monorepo.

### Emails (optional)

If using React Email: `src/emails/` with templates; shared pieces in `_templates/` / `_utils/` (underscore prefix so preview tools skip them).

## Reference reading order

1. [client-server-boundaries.md](references/client-server-boundaries.md) — file suffixes, import protection, `beforeLoad` vs `loader`
2. [router-and-query.md](references/router-and-query.md) — Query options, loaders, SSR dehydration
3. [router-search-serialization.md](references/router-search-serialization.md) — **required** `parseSearch` / `stringifySearch`, pretty JSON URLs, per-param encodings, optional jsurl
4. [params-search-ui-vs-api.md](references/params-search-ui-vs-api.md) — Zod on UI routes vs API `GET`
5. [selective-ssr.md](references/selective-ssr.md) — `ssr: true` / `'data-only'` / `false` (handler-only API routes: `false`)
6. [server-components.md](references/server-components.md) — experimental RSC: FMC conventions, official doc map, selective SSR pairing
7. [devtools.md](references/devtools.md) — unified TanStack debug panel (`@tanstack/devtools-vite`, `ClientOnly`, inline panels)

Auth-specific flows: skill `tanstack-start-auth`.

## Non-negotiable rules

| Topic                | Rule                                                                                                                                                                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server-only modules  | `*.server.ts` — never imported by routes/components; use `createServerOnlyFn` inside                                                                                                                                                                                                    |
| Callable from client | `*.functions.ts` with `createServerFn`; name exports `*Fn`                                                                                                                                                                                                                              |
| Public server fns    | `public*.functions.ts` — no global auth middleware; rate-limit/token checks in `.server.ts` (see `tanstack-start-auth`)                                                                                                                                                                 |
| API route files      | No `server-only` import marker on the route file; server-only logic inside handlers or tree-shaken imports                                                                                                                                                                              |
| Query-backed UI data | Loader primes cache; component uses `useQuery` / `useSuspenseQuery` — not `useLoaderData` alone                                                                                                                                                                                         |
| API search params    | Do **not** use `validateSearch` on API routes; `safeParse` in `GET` from `request.url` with explicit 4xx JSON                                                                                                                                                                           |
| Validation           | Zod 4 for path params and UI search; export search schema when reused outside the route; `Route.useSearch()` for types — no manual casts                                                                                                                                                |
| SSR                  | Set `ssr` explicitly on every route; UI default full SSR (`true`); handler-only API routes: `false`; map-heavy UI: `data-only`                                                                                                                                                          |
| Devtools panel       | `TanStackAppDevtools` in `components/shared/devtools/` — `ClientOnly` + inline panels; prod strip via `@tanstack/devtools-vite` (see [devtools.md](references/devtools.md))                                                                                                             |
| Router search URLs   | **`parseSearch` + `stringifySearch`** in `router.tsx` (pretty JSON baseline); `trailingSlash: 'never'` + root trailing-slash redirect; per-param compact/JSON encodings; jsurl **only** for large objects — [router-search-serialization.md](references/router-search-serialization.md) |
| jsurl (optional)     | Large nested route params only → key in `jsurlSearchKeys` + search registry; reuse `jsurlParse` / `jurlStringify`                                                                                                                                                                       |

## Quick decisions

**`beforeLoad` vs `loader`:** Redirects, auth, light context → `beforeLoad` (not middleware). Data fetch / Query priming → `loader`. **Caveat:** `beforeLoad` is not gated by `loaderDeps` — it re-runs on **every** navigation, search-param changes included. On hot routes with client-only search params (map viewport, layer toggles), move the redirect/auth/region round-trip into the `loader` and keep those params out of `loaderDeps` so they stay client-only (no round-trip, no pending). See [client-server-boundaries.md](references/client-server-boundaries.md).

**Loader vs Query:** Shared, invalidatable, multi-route data → `*QueryOptions` + `ensureQueryData` in loader + `useSuspenseQuery` in UI. One-off admin page data → loader return value + `useLoaderData`.

**`ssr`:** Map/canvas-heavy UI but need server auth/data → `'data-only'`. Handler-only API (`server.handlers`) → `false`. Fully client-first UI route → `false` (rare).

**Server components (experimental):** Opt-in RSC layer — not the default FMC data path. See [server-components.md](references/server-components.md).

## Related skills

| Topic             | Skill                      |
| ----------------- | -------------------------- |
| Auth / session    | `tanstack-start-auth`      |
| Zustand           | `zustand-state-management` |
| Next.js migration | `tanstack-start-migration` |
| nuqs interop      | `nuqs`                     |
