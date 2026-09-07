# Region modes: URL state

How region mode URL state is owned today. Related: [Features-Parameter-Deeplinks.md](./Features-Parameter-Deeplinks.md) (`f`), [TanStack-Start-App-Structure-And-Conventions.md](./TanStack-Start-App-Structure-And-Conventions.md).

## Purpose

A maintainer should be able to answer: which query keys exist, who validates them, how each mode stores its filters, and why `v` is not dropped on client navigations.

## Contract

All region search lives under `/regionen/$regionSlug[/<mode>]`. The layout route (`app/src/routes/regionen/$regionSlug/route.tsx`) is the single `validateSearch` owner: `regionSearchSchema` in `app/src/shared/regionen/regionSearchSchemas.ts`. Keys are listed once in `app/src/shared/regionen/searchParamsRegistry.ts`; `getRegionRedirectUrl` strips anything not in that registry.

nuqs is gone. The only remaining mentions in `app/src` are comments that describe old parser defaults. The router uses shared `routerSearch` JSON parse/stringify (`app/src/router.tsx`); `draw` still uses jsurl inside its own hook.

Mode filters sit on that shared layout search (not on child `validateSearch`) so switching modes keeps one URL. Each mode owns **one JSON object**:

| URL key     | Schema                    | Shape (compact: omit defaults)                                           |
| ----------- | ------------------------- | ------------------------------------------------------------------------ |
| `qa`        | `zodQaParam`              | `{ key, status?, users?, search?, extent? }`                             |
| `notesMode` | `zodNotesModeParam`       | `{ key?, search?, extent?, completed?, commented?, notReacted?, user? }` |
| `rl`        | `zodReviewListsModeParam` | `{ key?, search?, extent?, status?, source?, new?, move? }`              |

`optionalSearchJson` drops the whole object if the Zod object fails. Each field therefore uses `.catch` so a stale bookmark field (retired status, bad chip) does not wipe the rest. QA `key` stays strict — without it there is nothing to show.

QA `search` and `extent` live in that `qa` object, not in React `useState`. The QA route loader omits free-text `search` from `loaderDeps` so typing does not re-run the loader; the map/panel query still follows URL state.

Other encodings stay as they are: `map` (`zoom/lat/lng`), `config` (v2 compressed), `f` (pipe-delimited), `bg` / `data` / compose pins. Do not invent a seventh.

## Version `v` and migrations

`migrateUrl` (`app/src/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/migrateUrl.ts`) writes `v` to the current migration number (today `3`). `v` is in the typed search so client navigations preserve it and the layout loader does not re-run migrations.

Migration 0003 keeps any JSON `qa` that already has a string `key` (unknown slugs included) and merges leftover `qaFilter.users`. Legacy `slug--style` values for known slugs become `{ key }` plus mapped `status`/`users`; an unknown slug or style drops `qa`.

## Child mode routes

`hinweise.tsx`, `qa.tsx`, and `prueflisten.tsx` read `availableModes` from the parent loader via `parentMatchPromise`. Availability is derived from region data (notes flags, QA config count, review lists / can-create), not a separate “enabled modes” flag.

- Hinweise and QA redirect to the region root when that mode is not available.
- `qa.tsx` also redirects to the first config when `qa.key` is absent (`replace: true`).
- Prüflisten does not hard-redirect on empty lists: members/admins need the page to create the first list. Guests are stopped by the parent loader.
