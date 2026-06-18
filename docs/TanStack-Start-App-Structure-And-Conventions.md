# App structure and conventions

Short reference for how we organize the TILDA Geo codebase. For coding style (TypeScript, comments), see [AGENTS.md](../AGENTS.md).

Portable summary (shared across FMC TanStack Start projects): install agent skill **`tanstack-start-app-structure`** from [fixmyskills](https://github.com/FixMyBerlin/fixmyskills) (`npx skills add FixMyBerlin/fixmyskills -s tanstack-start-app-structure -a cursor -y`). Installed copy: [`.agents/skills/tanstack-start-app-structure/SKILL.md`](../.agents/skills/tanstack-start-app-structure/SKILL.md).

## 1. Monorepo

- **app** (TanStack Start frontend + API) and **processing** (SQL, Lua, pipelines) live at repo root.
- No monorepo tooling (no Nx, Turborepo, or workspace packages). Each area has its own `package.json` and tooling.

## 2. Top-level `app/src` folders

We keep only a few top-level folders under `app/src`:

- **components** — all React/JSX; route files never define components, only import from `@/components/...` (see §3–5).
- **routes** — route definitions only (thin, no components).
- **server** — server-only code, server functions, query options, helpers.
- **data** — static datasets, GeoJSON, and similar assets (e.g. `radinfra-de/`).

Plus root files such as `router.tsx` and `meta.const.ts`. There is no top-level `lib`; auth and shared utilities live under `server/` or `components/shared/`.

## 3. Components folder — all JSX here

All React/JSX lives under **`components/`**. Route files do not define components or component functions; they only import and render components from `@/components/...`.

**`components/layouts/`** — all `Layout*.tsx` route shells plus shared document chrome (Header, Footer, `global.css`). See [layouts/README.md](../app/src/components/layouts/README.md).

## 4. Routes folder — thin, no components

Route files define the `Route` (config, `beforeLoad`, `loader`, `head`, `component`). The **component** is always a single import from `components/` (e.g. `LayoutRegionSlug`, `PageIndex`, `LayoutPages`). No inline components or heavy UI logic in route files.

## 5. Routes ↔ components naming and symmetry

- **Layout vs page**: The route’s `component` is often a **layout** (e.g. `LayoutRegionSlug`, `LayoutPages`) that then renders the actual **page** component (e.g. `PageRegionSlug`). Layouts can wrap with NuqsAdapter or other providers.
- **Naming conventions** (aligned with `Page*.tsx`):
  - **Layouts**: File and export use the **`Layout*.tsx`** pattern in **`components/layouts/`** (e.g. [LayoutRoot.tsx](../app/src/components/layouts/LayoutRoot.tsx), [LayoutPages.tsx](../app/src/components/layouts/LayoutPages.tsx), [LayoutRegionSlug.tsx](../app/src/components/layouts/LayoutRegionSlug.tsx)). Shared chrome (Header, Footer, `global.css`) lives in the same folder.
  - **Pages**: File and export use the **`Page*.tsx`** pattern (e.g. `PageRegionSlug`, `PageIndex`, `PageDatenschutz`). We use this consistently for route-level page components.
- **Deliberate asymmetry**: Route segment `_pages` maps to **components/pages/** for page components and **components/layouts/LayoutPages.tsx** for the layout. We use `pages` in components for readability; the route uses `_pages` for layout grouping. The homepage is a single route at **`routes/index.tsx`** → **components/home/PageIndex.tsx** (no pathless layout group).

## 6. Server folder — conventions and .server

**Single source of truth:** skill **`tanstack-start-conventions`** → [references/client-server-boundaries.md](../.agents/skills/tanstack-start-conventions/references/client-server-boundaries.md). It defines:

- **`.server.ts`** — server-only modules; never imported by routes or components. Use `createServerOnlyFn` for callables.
- **`.functions.ts`** — files that export `createServerFn`, importable by routes/components.
- **API routes** under `routes/api/` — no server-only marker in the route file; handlers run on the server only.

**Per-domain layout** (e.g. [app/src/server/notes/](../app/src/server/notes/)): we use **queries/** and **mutations/** subfolders with `.server.ts` files, plus optional `schemas.ts` and `<domain>.functions.ts` that re-export or compose server functions. Example: `notes` has [queries/getNotesAndCommentsForRegion.server.ts](../app/src/server/notes/queries/getNotesAndCommentsForRegion.server.ts), [mutations/createNote.server.ts](../app/src/server/notes/mutations/createNote.server.ts), and [notes.functions.ts](../app/src/server/notes/notes.functions.ts).

For server/client boundaries and loaders, see **`tanstack-start-conventions`**. For React Query + loaders, see the same skill → [router-and-query.md](../.agents/skills/tanstack-start-conventions/references/router-and-query.md).

## 7. SSR and client boundaries (TanStack Start)

- **SSR**: We use TanStack Start’s default SSR. Router and React Query SSR integration are set up in [app/src/router.tsx](../app/src/router.tsx) (`setupRouterSsrQueryIntegration`). Loader data is SSR’d; React Query cache can be preloaded in loaders and dehydrated to the client.
- **nuqs and SSR**: We use **NuqsAdapter** from `nuqs/adapters/tanstack-router`. It is placed only where URL search state is needed — e.g. [LayoutRegionSlug.tsx](../app/src/components/regionen/LayoutRegionSlug.tsx) wraps `PageRegionSlug` with `<NuqsAdapter>`. Everything **below** the adapter is effectively a client boundary for nuqs (no SSR of nuqs state there). We may add a dedicated SSR/boundaries doc later; for now this section states the pattern.

## 8. State — Zustand and nuqs

- **Zustand**: Stores live in dedicated files (e.g. under **components/…/hooks/mapState/**). We export **custom hooks only**, not the raw store. TypeScript store uses `create<StoreType>()(...)`. Best practices: [zustand-state-management](https://github.com/FixMyBerlin/fixmyskills/blob/main/skills/zustand-state-management/SKILL.md). Example: [useMapState.ts](../app/src/components/regionen/pageRegionSlug/hooks/mapState/useMapState.ts).
- **nuqs**: URL state lives in **hooks** (e.g. **components/regionen/pageRegionSlug/hooks/useQueryState/**). Parsers and registry are colocated. Search params must be registered in [searchParamsRegistry.ts](../app/src/components/regionen/pageRegionSlug/hooks/useQueryState/searchParamsRegistry.ts) so [getRegionRedirectUrl.ts](../app/src/server/regions/getRegionRedirectUrl.ts) (URL normalization) doesn’t strip them; see the [useQueryState README](../app/src/components/regionen/pageRegionSlug/hooks/useQueryState/README.md). Best practices: [nuqs](https://github.com/FixMyBerlin/fixmyskills/blob/main/skills/nuqs/SKILL.md). Example: [useMapParam.ts](../app/src/components/regionen/pageRegionSlug/hooks/useQueryState/useMapParam.ts).

## 9. Route file naming — folders vs dot-notation

- **Folders** for important route groups: **regionen/**, **admin/**, **api/**.
- **Dot-notation** for flatter, easy-to-list routes under a segment: e.g. `api/export.$regionSlug.$tableName.ts`, `_pages/datenschutz.tsx`, `admin/regions.$regionSlug.edit.tsx`. Keeps route count per folder manageable and avoids deep nesting.

## 10. Tests — current layout

- **Unit/integration (Vitest)** — `bun run test` / `bun run test-run`: Colocated **`*.test.ts`** (and `*.test.tsx`) next to source; Vitest runs from app root with `dir: './'`, so tests can live anywhere. Global setup: [app/test/setup.ts](../app/test/setup.ts). Config: [app/vitest.config.ts](../app/vitest.config.ts) — `include: ['**/*.test.ts']` (excludes `.spec.ts`). Examples: [getRegionRedirectUrl.test.ts](../app/src/server/regions/getRegionRedirectUrl.test.ts), various under `components/…`.
- **E2E (Playwright)**: **app/tests/** — `*.spec.ts`. See [app/tests/README.md](../app/tests/README.md) for setup, auth, and smoke tests.
- **Processing**: Lua tests in **`__tests__`** with `*.test.lua` (see [processing/README.md](../processing/README.md)).
- **Emails**: [app/src/emails/newUserRegistrationMailer.test.ts](../app/src/emails/newUserRegistrationMailer.test.ts).

## 11. Emails (React Email)

**app/src/emails/** holds React Email templates, shared layout components, and send helpers. It lives under **app/src** like other app code; **`bun run mailpreview`** runs `email dev --dir src/emails` from `app/`. Shared pieces live in **`_templates/`** and **`_utils/`** (leading underscore so the React Email preview server skips them). See [app/src/emails/README.md](../app/src/emails/README.md).

## Related docs

| Topic                                              | Where                                                                                                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Router loaders + React Query                       | `tanstack-start-conventions` → [router-and-query.md](../.agents/skills/tanstack-start-conventions/references/router-and-query.md)                 |
| Server/client boundaries, .server, loaders, errors | `tanstack-start-conventions` → [client-server-boundaries.md](../.agents/skills/tanstack-start-conventions/references/client-server-boundaries.md) |
| Selective SSR                                      | `tanstack-start-conventions` → [selective-ssr.md](../.agents/skills/tanstack-start-conventions/references/selective-ssr.md)                       |
| UI vs API params/search                            | `tanstack-start-conventions` → [params-search-ui-vs-api.md](../.agents/skills/tanstack-start-conventions/references/params-search-ui-vs-api.md)   |
| Auth and route protection                          | `tanstack-start-auth` → [auth.md](../.agents/skills/tanstack-start-auth/references/auth.md)                                                       |
| Portable app folder layout                         | `tanstack-start-app-structure` → [SKILL.md](../.agents/skills/tanstack-start-app-structure/SKILL.md)                                              |
| Zustand patterns                                   | [zustand-state-management](https://github.com/FixMyBerlin/fixmyskills/blob/main/skills/zustand-state-management/SKILL.md)                         |
| nuqs (URL state)                                   | [nuqs](https://github.com/FixMyBerlin/fixmyskills/blob/main/skills/nuqs/SKILL.md)                                                                 |
