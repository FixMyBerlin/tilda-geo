# Settlement-area pseudo tags (`_in_settlement_area`)

> [!CAUTION]
> **Not run in processing.** Lua attach and settlement CSV export are off due to national throughput
> regression (#3423). Code below is retained for re-enable.

Attaches an internal `_in_settlement_area` estimation to roads + bikelanes, indicating whether
a way is **innerorts** (inside a settlement area) or **außerorts**. Same round-trip pattern as
`is_sidepath` (see `../pseudo_tags_sidepath/`).

> [!IMPORTANT]
> **Produced but not yet consumed.** The value is stored as an internal `_`-prefixed tag and is
> not used downstream yet. It is a heuristic (see the generator's README), hence the value is
> `assumed_yes` / `assumed_no`.

## Round-trip

1. **Export (afterthoughts, this run)** — [exportSettlementAreaData.ts](exportSettlementAreaData.ts)
   runs [sql/run_settlement_area_estimation.sql](sql/run_settlement_area_estimation.sql): classify
   roads + bikelanes by `ST_Intersects` against `public._settlement_areas` (chosen over %-coverage —
   see [BENCHMARK_DOCUMENTATION.md](../../landcover/settlement_areas/BENCHMARK_DOCUMENTATION.md)), and write
   `settlement_area_estimation.csv` for the **next** run. Only
   the **minority class** (außerorts / outside, ~32% by way count on Germany) is exported; inside is
   the inferred default. See
   [CLASSIFICATION_STATS.md](../../landcover/settlement_areas/CLASSIFICATION_STATS.md) for production
   splits (count vs length, per-Bundesland). If `public._settlement_areas` doesn't exist yet, the
   export skips gracefully.
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
