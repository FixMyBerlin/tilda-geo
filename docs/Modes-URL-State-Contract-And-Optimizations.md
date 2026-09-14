# Region modes: URL state

How region mode URL state is owned today. Product shape: [Modes-Concept-Summary.md](./Modes-Concept-Summary.md). Related: [Features-Parameter-Deeplinks.md](./Features-Parameter-Deeplinks.md) (`f`), [TanStack-Start-App-Structure-And-Conventions.md](./TanStack-Start-App-Structure-And-Conventions.md).

## Contract

All region search lives under `/regionen/$regionSlug[/<mode>]`. The layout route (`app/src/routes/regionen/$regionSlug/route.tsx`) is the single `validateSearch` owner: `regionSearchSchema` in `app/src/shared/regionen/regionSearchSchemas.ts`. Keys are listed once in `app/src/shared/regionen/searchParamsRegistry.ts`; `getRegionRedirectUrl` strips anything not in that registry.

Search uses the layout `validateSearch` (`regionSearchSchema`). `draw` still uses jsurl inside its own hook.

Mode filters sit on that shared layout search (not on child `validateSearch`) so switching modes keeps one URL. Each mode owns **one JSON object**:

| URL key  | Schema                    | Shape (compact: omit defaults)                                           |
| -------- | ------------------------- | ------------------------------------------------------------------------ |
| `qa`     | `zodQaParam`              | `{ key, status?, users?, search?, extent? }`                             |
| `notes`  | `zodNotesModeParam`       | `{ key?, search?, extent?, completed?, commented?, notReacted?, user? }` |
| `review` | `zodReviewListsModeParam` | `{ key?, search?, extent?, status?, source?, new?, move? }`              |

`optionalSearchJson` drops the whole object if the Zod object fails. Each field therefore uses `.catch` so a stale bookmark field (retired status, bad chip) does not wipe the rest. QA `key` stays strict — without it there is nothing to show.

QA `search` and `extent` live in that `qa` object, not in React `useState`. The QA route loader omits free-text `search` from `loaderDeps` so typing does not re-run the loader; the map/panel query still follows URL state.

Other encodings stay as they are: `map` (`zoom/lat/lng`), `config` (v2 compressed), `f` (pipe-delimited), `bg` / `data` / compose pins. Do not invent a seventh.

## `v`

`migrateUrl` writes `v` (today `3`) so the layout loader does not re-run category-config migrations on every client navigation. Old in-map QA query shapes are folded into `qa` on first load. Details: [`migrateUrl.ts`](../app/src/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/migrateUrl.ts).

## Child mode routes

`hinweise.tsx`, `qa.tsx`, and `prueflisten.tsx` read `availableModes` from the parent loader via `parentMatchPromise`. Availability is derived from region data (notes flags, QA config count, review lists / can-create), not a separate “enabled modes” flag.

- Hinweise and QA redirect to the region root when that mode is not available.
- `qa.tsx` also redirects to the first config when `qa.key` is absent (`replace: true`).
- Prüflisten does not hard-redirect on empty lists: members/admins need the page to create the first list. Guests are stopped by the parent loader.
