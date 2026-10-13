# Region modes: URL state

How region mode URL state is owned today. Product shape: [Modes-Concept-Summary.md](./Modes-Concept-Summary.md). Related: [Features-Parameter-Deeplinks.md](./Features-Parameter-Deeplinks.md) (`f`), [TanStack-Start-App-Structure-And-Conventions.md](./TanStack-Start-App-Structure-And-Conventions.md).

## Contract

All region search lives under `/regionen/$regionSlug[/<mode>]`. The layout route (`app/src/routes/regionen/$regionSlug/route.tsx`) is the single `validateSearch` owner: `regionSearchSchema` in `app/src/shared/regionen/regionSearchSchemas.ts`. Keys are listed once in `app/src/shared/regionen/searchParamsRegistry.ts`; `getRegionRedirectUrl` strips anything not in that registry.

Search uses the layout `validateSearch` (`regionSearchSchema`).

Mode filters sit on that shared layout search (not on child `validateSearch`) so switching modes keeps one URL. Each mode owns **one JSON object**:

| URL key   | Schema                    | Shape (compact: omit defaults)                                                                                           |
| --------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `qa`      | `zodQaParam`              | `{ key, status?, users?, search?, extent? }`                                                                             |
| `notes`   | `zodNotesModeParam`       | `{ key?, search?, extent?, completed?, commented?, notReacted?, user?, new? }` (`new` is a map-param string compose pin) |
| `review`  | `zodReviewListsModeParam` | `{ key?, search?, extent?, status?, source?, new?, move? }`                                                              |
| `sum`     | `zodCalculatorModeParam`  | `{ key?, filter?, style?, areas? }` (`key`: dataset; `filter`: tag values; `style`: tag to color by; `areas`: GeoJSON)   |
| `measure` | `zodMeasureModeParam`     | `{ lines?, areas?, bg? }` (`lines`, `areas`: GeoJSON; `bg`: background picked while measuring)                           |

`optionalSearchJson` drops the whole object if the Zod object fails. Each field therefore uses `.catch` so a stale bookmark field (retired status, bad chip) does not wipe the rest. QA `key` stays strict — without it there is nothing to show.

QA `search` and `extent` live in that `qa` object, not in React `useState`. The QA route loader omits free-text `search` from `loaderDeps` so typing does not re-run the loader; the map/panel query still follows URL state.

Other encodings stay as they are: `map` (`zoom/lat/lng`), `config` (v2 compressed), `f` (pipe-delimited), `bg` / `data`. Do not invent a seventh.

## `v`

`new` (and `move`) are sessions and are dropped outside their mode. `sum.areas` and the shapes of `measure` are not sessions: they stay in the URL in every mode. The mode switcher copies areas between `sum` and `measure` when the opened mode has none ([`modeSwitcherSearch.ts`](../app/src/components/regionen/pageRegionSlug/modes/modeSwitcherSearch.ts)).

`bg` is the background everywhere but in the Messen mode, which shows `measure.bg` or an aerial image it picks by itself ([`useBackgroundParam.ts`](../app/src/components/regionen/pageRegionSlug/hooks/useQueryState/useBackgroundParam.ts)).

Geometry in the URL: a point is a `zoom/lat/lng` string (`map`, `notes.new`), a selected feature is the pipe-delimited `f`. Shapes are GeoJSON geometry, as in the database (`ReviewEntry.geometry`): `sum.areas`, `measure.lines`, `measure.areas`.

`migrateUrl` writes `v` (today `4`) so the layout loader does not re-run category-config migrations on every client navigation. Old in-map QA query shapes are folded into `qa` on first load. Details: [`migrateUrl.ts`](../app/src/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/migrateUrl.ts).

## Child mode routes

`hinweise.tsx`, `qa.tsx`, `prueflisten.tsx`, and `summieren.tsx` read `availableModes` from the parent loader via `parentMatchPromise`. Availability is derived from region data (notes flags, QA config count, review lists / can-create, categories with a dataset to sum), not a separate “enabled modes” flag.

- Hinweise, QA, and Summieren redirect to the region root when that mode is not available.
- `qa.tsx` also redirects to the first config when `qa.key` is absent (`replace: true`).
- Prüflisten does not hard-redirect on empty lists: members/admins need the page to create the first list. Guests are stopped by the parent loader.
