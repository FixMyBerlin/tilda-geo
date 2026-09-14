# Region modes

A region has a shared map and extra pages that reconfigure the UI around it. The default map stays `/regionen/<region>`. Hinweise, Qualitätssicherung, and Prüflisten are their own routes. They show up in the main navigation when the region has the matching data (notes flags, at least one QA config, review lists). Members can open Prüflisten before the first list exists so they can create one.

URL keys and filters: [Modes-URL-State-Contract-And-Optimizations.md](./Modes-URL-State-Contract-And-Optimizations.md). Selection `f`: [Features-Parameter-Deeplinks.md](./Features-Parameter-Deeplinks.md).

| Mode               | URL                              |
| ------------------ | -------------------------------- |
| Map (default)      | `/regionen/<region>`             |
| Hinweise           | `/regionen/<region>/hinweise`    |
| Qualitätssicherung | `/regionen/<region>/qa`          |
| Prüflisten         | `/regionen/<region>/prueflisten` |

Switching modes keeps map position and layer configuration. Each mode stores its filters in one JSON search object (`notes`, `qa`, `review`) and restores them when you come back.

## Shared panel

The right `ModePanel` has a heading, a collection selector (QA config or Prüfliste; read-only for Hinweise), a filter bar (search, chips or status, current map view vs all), and a list of compact previews. On desktop the panel sits on the map edge and is resizable.

The inspector still shows the selected feature. Hovering a list row draws a mode-accent ring on the map (clamped to the viewport when the geometry is off-screen). Clicking the map or a row writes `f`, scrolls the row into view, and opens details. Hover does not select.

| Feature                     | Default map                                                                            | Dedicated mode                              |
| --------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------- |
| Hinweise                    | Inspector "new note" tools navigate into the mode. No note markers on the default map. | Yes. One list for the region's notes kind.  |
| Qualitätssicherung          | No                                                                                     | Yes only                                    |
| Prüflisten                  | No                                                                                     | Yes only                                    |
| Calculator (parking totals) | Yes. Drawing and totals on the map. "Summieren: …" stays in the category UI.           | No. Not a region mode. No `/rechner` route. |

## Hinweise

Lists the region's notes. Today that is OSM **or** TILDA internal notes, not both. Search, extent, and chips live in `notes`. Pins render only in this mode. From the default-map inspector, "new note" still jumps here (`osmNote` / `internalNote` compose pins).

OSM notes are public. Internal notes are member-only. The Hinweise route is member-only when the region has only internal notes.

Folders are not in the product yet. When they are, OSM and internal notes may both be enabled on a region, but the list and map show one collection at a time: OSM **or** one internal folder.

## Qualitätssicherung

`/qa` is the only place QA layers and the area list exist. Pick a config, filter by status / users / search / extent, work the list. Details stay in the inspector.

Bookmarks that still carried the old in-map QA query params are steered here.

### Status

Each area has a **system** status from nightly comparison of reference vs current counts, and optionally a **user** status from a person.

System: `GOOD` (green), `NEEDS_REVIEW` (yellow), `PROBLEMATIC` (red). No evaluation paints gray.

User (overrides the system color when set):

- `OK_STRUCTURAL_CHANGE` — OK, construction or structural change
- `OK_REFERENCE_ERROR` — OK, wrong reference data
- `OK_QA_TOOLING_ERROR` — OK, QA geometry or definition error (teal in the UI)
- `NOT_OK_DATA_ERROR` — not OK, current data needs a fix
- `NOT_OK_PROCESSING_ERROR` — not OK, processing needs a fix

Absolute difference is checked before percent. If `|absoluteDifference|` is at most `QaConfig.absoluteDifferenceThreshold`, the effective system status is `GOOD` even when the percent looks worse.

### What nightly processing does

First run on an area always writes a system evaluation. After that it writes a new row only when the effective system status changed, or when a user decision must be cleared.

- Structural-change and reference-error OK stay forever.
- Tooling-error OK and both NOT_OK values stay until the effective system status becomes `GOOD`. Then the user fields are cleared (`userStatus`, `body`, `userId` null).
- Users never set system status. `NEEDS_REVIEW` is system-only.

The tables live in [`qaEvaluationRules.ts`](../app/src/server/qa-configs/evaluation/qaEvaluationRules.ts) (`getQaUpdateDecision`). Map coloring and cache: [QA-Map-Status-Payload.md](./QA-Map-Status-Payload.md). Parking freeze baseline: [Parking-Client-Freeze-QA.md](./Parking-Client-Freeze-QA.md).

New configs are created in admin. The source table needs a string `id`, comparison counts, and polygon geometry. Set `mapTable` to that table.

## Prüflisten

GeoJSON lists of candidates (points, lines, polygons, including Multi\*). Pick a list, set status, comment. Lists live in the database, can be assigned to several regions, and support upload/download. Members can draw new entries and edit geometry. Source is upload or manual.

UI names: **Prüfliste** / **Prüfeintrag**. Status and comments exist. A richer evaluation workflow is still placeholder-level. Admin: `/admin/review-lists`.
