# Topic Structure Guide (Barrier Pattern)

This document defines the ideal processing topic structure.
Use [`barriers`](barriers/) as the reference implementation.

## Goal

Each topic should have a clear separation of concerns:

- root topic file = orchestration only
- geometry files = filtering + table definition + insertion
- helper files = shared per-topic logic:
  - result tag builders
  - exit guards
  - topic sanitizers

The code should be readable by file name alone.

## Canonical Layout

Example (`barriers`):

- [`barriers.lua`](barriers/barriers.lua)
- [`barrier_lines.lua`](barriers/barrier_lines.lua)
- [`barrier_areas.lua`](barriers/barrier_areas.lua)
- [`helper/result_tags_barriers.lua`](barriers/helper/result_tags_barriers.lua)
- [`helper/sanitize_barrier_tags.lua`](barriers/helper/sanitize_barrier_tags.lua) (only if topic-specific sanitizers are needed)
- [`barriers_errors.lua`](barriers/barriers_errors.lua)

## Root File Responsibility

The root file (`<topic>.lua`) should only define `osm2pgsql.process_*` callbacks and delegate:

- no `osm2pgsql.define_table(...)` here
- no tag-building logic here
- no sanitizer allowlists here

Example pattern:

- `process_way` routes to line/area handler based on geometry
- `process_relation` routes to relation/area handler
- if no point contract exists: no noop points module; use this exact root-level comment style:
  - `-- No process_node for <topic>: this topic has no point output contract, so no noop helper file is used.`

## Geometry Module Responsibility

Geometry modules (for example `*_lines.lua`, `*_areas.lua`, `*_nodes.lua`, `*_relations.lua`) own:

- table definitions they insert into
- geometry-specific filter rules
- a clear early-exit helper (`exit_processing_*`) for readability
- row construction + insert
- error logging calls

They should import helper functions instead of embedding shared logic.

## Helper Folder Responsibility

Topic-local shared logic goes into `helper/`.

Required naming rhythm:

- `exit_processing_*` helper placement rule:
  - if used in exactly one geometry file: keep it local in that file (for example `local function exit_processing_barrier_lines(object) ... end`)
  - if reused by multiple geometry files in the same topic: move it to `helper/exit_processing_<topic>.lua`

- `helper/result_tags_<topic>.lua`
  - exports `result_tags_<topic>(...)`
  - builds the topic result tag table and performs the explicit cleanup split:
    - `public_result_tags = extract_public_tags(result_tags)`
    - `cleaned_tags, replaced_tags = CLEANER.separate_tags(public_result_tags, source_tags, overrides)`
  - prefer direct return style for clarity:
    - `return CLEANER.separate_tags(public_result_tags, source_tags, overrides)`
    - avoid temporary locals unless needed for additional processing/debugging

- `helper/exit_processing_<topic>.lua` (only when reused across geometry modules)
  - exports `exit_processing_<topic>(object)`
  - centralizes early-exit filtering

- `helper/sanitize_<topic>_tags.lua` (only for topic-specific domain rules)
  - keep only truly topic-specific sanitizer allowlists here
  - keep generic sanitizers in shared `processing/topics/helper/sanitize_tags.lua`

## Naming Conventions

- files: snake_case
- functions: snake_case
- topic-specific shared helper names include topic suffix:
  - `result_tags_barriers`
  - `result_tags_bicycle_parking`

## Data Contract Rules

- preserve existing public table names and schema unless explicitly planned otherwise
- `osm_*` keys are only for raw-ish passthrough/source-style fields
- fields that are sanitized/normalized into semantic values should not use `osm_*` prefix and should be migrated to semantic/non-prefixed keys unless explicitly documented as an exception

## What To Avoid

- Hot-path categorize loops that wrap tags in metatable proxies (for example `decision_tags_view` with `__index` per read)
- Nested category checks via `category(tags)` when `__call` adds overhead — use `category:is_active(tags)` or `category.condition(tags)` on plain tables
- `*_tables.lua` indirection files for standard topics
  - table definition should live in the geometry module that owns inserts
  - parking remains the known exception where existing pattern may differ
- root files containing business logic
- noop `*_points.lua` modules

## Performance (categorization hot paths)

- Categorize loops should read plain tag tables only; call sanitizers explicitly in the few conditions that need sided keys
- Reference pattern: parking `category:is_active(object.tags)` in `categorize_*` helpers
- roads_bikelanes subcategories must call `parent:is_active(tags)`, never `parent(tags)`

## Edge Case: Bicycle Parking Point Writes

`bicycleParking` has a special write pattern: line/area processing also needs to write into the points table (centroid labels).

Use this pattern:

- point table is owned by a dedicated helper module in `helper/` (for example `helper/insert_bicycle_parking_point.lua`)
- that helper defines the point table and exports a single insert function (for example `insert_bicycle_parking_point(...)`)
- `bicycle_parking_nodes.lua` uses this helper for direct point writes
- `bicycle_parking_ways.lua` defines only area table(s), and calls the same point insert helper when writing centroid point rows

This keeps ownership clear without reintroducing a topic-level `*_tables.lua` file.
