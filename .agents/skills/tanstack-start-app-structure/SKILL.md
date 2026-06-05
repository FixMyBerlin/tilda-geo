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

| Folder        | Purpose                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| `components/` | All React/JSX — route files never define components                     |
| `routes/`     | Route definitions only (thin: `Route` config + single component import) |
| `server/`     | Server-only modules, `*QueryOptions`, domain helpers                    |
| `data/`       | Optional static assets (GeoJSON, JSON, etc.)                            |

Plus root files such as `router.tsx`. Prefer `server/` or `components/shared/` over a vague top-level `lib/`.

## Routes: thin, no inline UI

- Route files export `createFileRoute` config: `beforeLoad`, `loader`, `head`, `component`.
- **`component`** is always one import from `@/components/...` — no inline components or heavy UI in route files.
- Route files call server logic only via server functions in `loader` / `beforeLoad` (not direct DB/`getRequestHeaders` except API handlers).

## Components: Layout vs Page

- **Layouts:** `Layout*.tsx` — route shell, providers (e.g. `NuqsAdapter`), outlet for child page.
- **Pages:** `Page*.tsx` — actual screen content.
- **Deliberate asymmetry:** Route segments may use `_segment` for grouping while `components/` uses a readable folder name (e.g. route `_pages` → `components/pages/`).

## Server folder per domain

Under `server/<domain>/`:

- `queries/*.server.ts` — read paths
- `mutations/*.server.ts` — writes
- `schemas.ts` — shared Zod/types (optional)
- `<domain>.functions.ts` — `createServerFn` exports consumed by routes/components

Details: `tanstack-start-conventions` → client-server-boundaries.

## URL state (search params)

- **Default:** route `validateSearch` (Zod) + `Route.useSearch()` — see `tanstack-start-conventions` (`params-search-ui-vs-api.md`).
- **nuqs only** for shared/third-party components that already use `useQueryState`; then `NuqsAdapter` from `nuqs/adapters/tanstack-router` on the smallest layout subtree that needs it (experimental; prefer router search for app-owned state).
- Colocate Zod search schemas with the route or feature; colocate nuqs parsers/hooks only where nuqs is required.

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
