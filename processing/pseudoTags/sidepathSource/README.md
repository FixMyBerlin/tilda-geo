# Sidepath estimation (is_sidepath)

We estimate which path-class ways are sidepaths (running alongside a road) and expose that as a hidden tag `_is_sidepath=assumed_yes|assumed_no` on paths and bikelanes.

The estimation logic and SQL come from **[lu-fennell/OSM-Sidepath-Estimation](https://github.com/lu-fennell/OSM-Sidepath-Estimation)**. Many thanks to [@lu-fennell](https://github.com/lu-fennell) for the original implementation.

## Process

1. **Input**
   We use our own DB tables: path-class ways from `roadsPathClasses` (“paths”) and non-path roads from `roads` (“roads”). No external download.

2. **When it runs**
   At the **beginning** of each run, before `processTopics()` (and before osm2pgsql overwrites the DB), `exportSidepathData()` (see `processing/index.ts`) reads the **current** DB — i.e. the previous run’s `roads` and `roadsPathClasses`. It builds temp views, runs the vendored SQL script with `format=is_sidepath_csv`, and writes **`/data/pseudoTagsData/is_sidepath_estimation.csv`** (columns: `osm_id`, `is_sidepath_estimation`). This run’s Lua then uses that CSV. We do **not** rely on the CSV surviving between runs (e.g. after a new Docker release); we regenerate it from the DB each time.

3. **One-day-off**
   The CSV is always derived from the **previous** run’s geometry (because we export at the start, from the DB as it was before this run). So sidepath data is one processing cycle behind, and the pipeline works even when the CSV file is ephemeral (e.g. no persistent volume for `/data/pseudoTagsData`). On the very first run (empty DB), the export is skipped and Lua gets no sidepath data.

4. **Use in Lua**
   In `roads_bikelanes.lua`, we load the CSV (same pattern as mapillary: `load_csv_is_sidepath`, `is_sidepath`), look up by way id, and set `object_tags._is_sidepath`. We merge it into the tags for `roadsPathClasses` and `bikelanes` so the result has `tags._is_sidepath = 'assumed_yes' | 'assumed_no'`.

## Files

- **`sql/`** – Vendored from OSM-Sidepath-Estimation: `sidepath_lib.sql`, `generate_sidepath_estimation.script.sql`. `run_sidepath_estimation.sql` creates the views from our tables and runs the script.
- **`exportSidepathData.ts`** – Called at the start of the run (before `processTopics()`); runs the SQL and writes the CSV. If the tables don’t exist yet, it logs a warning and continues.
