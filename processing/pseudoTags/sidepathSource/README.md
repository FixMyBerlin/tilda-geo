# Sidepath estimation (is_sidepath)

We estimate which path-class ways are sidepaths (running alongside a road) and expose that as a hidden tag `_is_sidepath=assumed_yes|assumed_no` on paths and bikelanes.

The estimation logic and SQL come from **[lu-fennell/OSM-Sidepath-Estimation](https://github.com/lu-fennell/OSM-Sidepath-Estimation)**. Many thanks to [@lu-fennell](https://github.com/lu-fennell) for the original implementation.

## Process

1. **Input**
   We use our own DB tables: path-class ways from `roadsPathClasses` (“paths”) and non-path roads from `roads` (“roads”). No external download.

2. **When it runs**
   At the **beginning** of each run, before `processTopics()` (and before osm2pgsql overwrites the DB), `exportSidepathData()` (see `processing/index.ts`) reads the **current** DB — i.e. the previous run’s `roads` and `roadsPathClasses`. It runs the SQL (views over those tables, then CSV export) and writes **`/data/pseudoTagsData/is_sidepath_estimation.csv`** (columns: `osm_id`, `is_sidepath_estimation`). We only use CSV output; no format flag. This run’s Lua then uses that CSV. We do **not** rely on the CSV surviving between runs (e.g. after a new Docker release); we regenerate it from the DB each time.

3. **One-day-off**
   The CSV is always derived from the **previous** run’s geometry (because we export at the start, from the DB as it was before this run). So sidepath data is one processing cycle behind, and the pipeline works even when the CSV file is ephemeral (e.g. no persistent volume for `/data/pseudoTagsData`). On the very first run (empty DB), the export is skipped and Lua gets no sidepath data.

4. **Use in Lua**
   In `roads_bikelanes.lua`, we load the CSV (same pattern as mapillary: `load_csv_is_sidepath`, `is_sidepath`), look up by way id, and set `object_tags._is_sidepath`. We merge it into the tags for `roadsPathClasses` and `bikelanes` so the result has `tags._is_sidepath = 'assumed_yes' | 'assumed_no'`.

## Files

- **`sql/is_sidepath_estimation.sql`** – Estimation logic (adapted from OSM-Sidepath-Estimation). Default parameters `buffer_distance` and `buffer_size` are defined and documented at the top. Expects views `_sidepath_estimation_paths` and `_sidepath_estimation_roads` with (osm*id, geom, flat tags). Provides `tilda_sidepath_csv(buffer_distance, buffer_size)` only (all custom functions use the `tilda*` prefix).
- **`sql/run_is_sidepath_estimation.sql`** – Entry point (same pattern as e.g. `topics/parking/parking.sql`): creates those views from raw `roadsPathClasses` and `roads`, includes the lib via `\i`, then exports CSV. Invoke with `-v outfile=...`; optional `-v buffer_distance=...` and `-v buffer_size=...`.
- **`sql/debug_is_sidepath.sql`** – Optional debug script: creates three tables in `public` for inspecting probes and decisions. See **Debugging** below.
- **`exportSidepathData.ts`** – Called at the start of the run (before `processTopics()`); runs the SQL and writes the CSV. If the tables don’t exist yet, it logs a warning and continues.

## Debugging

To enable debug tables, uncomment the `\i` line for `debug_is_sidepath.sql` in `sql/run_is_sidepath_estimation.sql`. The script creates three tables in `public` (Martin-compatible: `geom` + `tags`), so they show in your viewer like other layers.

| Table                               | Contents                                                                                                                                                   |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **\_debug_is_sidepath_checkpoints** | Buffer circles used to probe for nearby roads (one polygon per checkpoint along each path). Tags: `path_osm_id`, `checkpoint_nr`, `layer`, `path_highway`. |
| **\_debug_is_sidepath_matches**     | Road segments that fell inside a checkpoint buffer. Tags: `path_osm_id`, `checkpoint_nr`, `road_osm_id`, `road_highway`, `road_name`, `road_layer`.        |
| **\_debug_is_sidepath_paths**       | Each path with its final decision. Tags: `osm_id`, `is_sidepath_estimation`, `checks`, `entry` (full histograms: id, highway, name).                       |

**Example: “This way is ‘yes’; how was that decided?”**

1. Find the path in **\_debug_is_sidepath_paths** by `tags->>'osm_id'` (or filter by the way id in your viewer). Check `is_sidepath_estimation` and `entry`: `checks` is the number of probe points; `entry` shows how many checkpoints saw each road id, highway type, and name (the decision is yes if ≥ 2/3 of checkpoints match on one of those).
2. Filter **\_debug_is_sidepath_checkpoints** by the same `path_osm_id` to see where the probes were (buffer circles along the path).
3. Filter **\_debug_is_sidepath_matches** by that `path_osm_id` to see which road segments were near each probe; that shows which road(s) drove the “yes”.
