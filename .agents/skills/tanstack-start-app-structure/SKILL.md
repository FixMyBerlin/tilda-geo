---
name: tanstack-start-app-structure
description: >-
  Portable TanStack Start app folder layout: thin routes, components-only JSX,
  Layout/Page naming, server domain folders, nuqs adapter placement, and test
  layout. Use when scaffolding or refactoring app/src structure in a TanStack
  Start project. For project-specific paths, use the repo's local docs/ file.
disable-model-invocation: true
---

# TanStack Start app structure

Portable layout conventions for `app/src` (or equivalent) in TanStack Start projects. For stack rules (`.server.ts`, loaders, SSR), use `tanstack-start-conventions`. For auth gates, use `tanstack-start-auth`.

## Top-level `src` folders

Keep a small set of top-level folders:

| Folder        | Purpose                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| `components/` | All React/JSX — route files never define components                      |
| `routes/`     | Route definitions only (thin: `Route` config + single component import)  |
| `shared/`     | Isomorphic modules — Zod schemas, URL search, pure utils (no DB/secrets) |
| `server/`     | Server-only `*.server.ts`, `*.functions.ts`, `*QueryOptions.ts`          |
| `data/`       | Optional static assets (GeoJSON, JSON, etc.)                             |

Plus root files such as `router.tsx`. Prefer `shared/` for isomorphic code, `server/` for RPC/DB, or `components/shared/` for cross-cutting React UI — not a vague top-level `lib/`.

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

- **Layouts:** `Layout*.tsx` in **`components/layouts/`** — route shell, providers (e.g. `NuqsAdapter`), outlet for child page. `LayoutRoot` is the document shell (`html`/`body`, app header/footer). Devtools: [devtools.md](../tanstack-start-conventions/references/devtools.md).
- **Pages:** `Page*.tsx` — actual screen content, colocated with the feature domain (`components/pages/`, `components/regionen/`, …).
- **Deliberate asymmetry:** Route segments may use `_segment` for grouping while `components/` uses a readable folder name (e.g. route `_pages` → `components/pages/` for pages, `components/layouts/LayoutPages.tsx` for the layout).

## Server folder per domain

Under `server/<domain>/`:

- `queries/*.server.ts` — read paths
- `mutations/*.server.ts` — writes
- `*.inputSchemas.ts` — server-only validation extensions (may import from `shared/<domain>/schemas`)
- `<domain>.functions.ts` — `createServerFn` exports consumed by routes/components

Domain Zod and URL search schemas live in `shared/<domain>/` (or `shared/<topic>/` for cross-cutting helpers). See `tanstack-start-conventions` → client-server-boundaries.

## URL state (search params)

- **Default:** route `validateSearch` (Zod) + `Route.useSearch()` — see `tanstack-start-conventions` (`params-search-ui-vs-api.md`).
- **Router `router.tsx`:** required pretty-JSON `parseSearch` / `stringifySearch` + `trailingSlash: 'never'` — `tanstack-start-conventions` → `router-search-serialization.md`.
- **nuqs only** for shared/third-party components that already use `useQueryState`; then `NuqsAdapter` from `nuqs/adapters/tanstack-router` on the smallest layout in `components/layouts/` that needs it (experimental; prefer router search for app-owned state).
- **Search schema placement** (keep `routes/` for route files only — no `-` prefixed colocated helpers):
  - **Route-only:** inline `const …SearchSchema = z.object({ … })` in the route file.
  - **Shared** (route + `navigate({ search })`, components, or multiple routes): `shared/<domain>/searchSchemas.ts`, or `shared/routing/` for cross-cutting params (e.g. back links). Not `*.server.ts` — routes and components import from `shared/`.
- Colocate nuqs parsers/hooks only where nuqs is required (under `components/`).

Skill `nuqs` covers Next.js and nuqs interop; do not reach for nuqs on greenfield TanStack routes.

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

## Related skills

| Topic                                    | Skill                        |
| ---------------------------------------- | ---------------------------- |
| Boundaries, loaders, SSR, API validation | `tanstack-start-conventions` |
| Auth / session                           | `tanstack-start-auth`        |
| Zustand                                  | `zustand-state-management`   |
| Next.js migration                        | `tanstack-start-migration`   |
