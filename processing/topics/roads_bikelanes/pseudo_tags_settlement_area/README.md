# Settlement-area pseudo tags (`_in_settlement_area`)

> [!CAUTION]
> **Not run in processing.** Lua attach and settlement CSV export are off due to national throughput
> regression (#3423). Code below is retained for re-enable.

Attaches an internal `_in_settlement_area` estimation to roads + bikelanes, indicating whether
a way is **innerorts** (inside a settlement area) or **außerorts**. Same round-trip pattern as
`is_sidepath` (see `../pseudo_tags_sidepath/`).

> [!IMPORTANT]
> **A heuristic**, hence the values `assumed_yes` / `assumed_no` (see the generator's README).
> The only consumer so far is the ERA check
> ([`../bikelanes/era_check/`](../bikelanes/era_check/README.md)): innerorts it assumes a
> one-way cycleway where OSM says nothing about the direction, außerorts a two-way one, and it
> marks that assumption in the data (`era_lage`) so the app can show it. Since the attach is off,
> that path is currently dead code.

## Round-trip

1. **Export (afterthoughts, this run)** — [exportSettlementAreaData.ts](exportSettlementAreaData.ts)
   runs [sql/run_settlement_area_estimation.sql](sql/run_settlement_area_estimation.sql): classify
   roads + bikelanes by whether they lie **mostly** (more than half their length) inside
   `public._settlement_areas`, and write `settlement_area_estimation.csv` for the **next** run. Only
   the **minority class** (außerorts / outside) is exported; inside is the inferred default. See
   [CLASSIFICATION_STATS.md](../../landcover/settlement_areas/CLASSIFICATION_STATS.md) for production
   splits (count vs length, per-Bundesland) — those numbers were measured with the earlier
   touches-at-all rule and shift towards außerorts under the majority rule. If
   `public._settlement_areas` doesn't exist yet, the export skips gracefully.

   The majority rule is staged so the expensive part stays small: the index-only tests
   ("touches any area?", "fully covered by one area?") decide almost every way, and
   `ST_Intersection` runs only for the ways that actually cross a settlement boundary. The
   %-coverage variant that the benchmark rejected measured _every_ way that way — see
   [BENCHMARK_DOCUMENTATION.md](../../landcover/settlement_areas/BENCHMARK_DOCUMENTATION.md).

2. **Attach (Lua, next run)** — [in_settlement_area.lua](in_settlement_area.lua) +
   [load_csv_in_settlement_area.lua](load_csv_in_settlement_area.lua), wired in
   `../pseudo_tags/prepare_pseudo_tags_roads_bikelanes.lua`, set
   `object_tags._in_settlement_area` = `assumed_yes` (in CSV ⇒ no / out of CSV ⇒ yes / out of scope ⇒ nil).

## Data source

`public._settlement_areas` is generated **separately and rarely** by the weekend `landcover` topic
(`processing/topics/landcover/`, runs ~weekly or on demand with `PROCESS_ONLY_TOPICS=landcover`). The
daily pipeline only reads it.

## Way set — broader than sidepath (FYI)

Settlement classifies **all** rows in `roads` (every road class, incl. service and motorway) plus
`roadsPathClasses` and `bikelanes`. The sidepath export uses a **narrower** road filter (primary and
below only) — see `../pseudo_tags_sidepath/sql/run_is_sidepath_estimation.sql`.

Cross-references for settlement Lua scope vs export: `in_settlement_area.lua` and
`sql/run_settlement_area_estimation.sql`.
