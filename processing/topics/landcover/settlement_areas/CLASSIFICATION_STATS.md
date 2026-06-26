# Settlement-area classification stats (Germany)

Production validation of the `_in_settlement_area` split (`assumed_yes` / `assumed_no`) on **full
Germany**, run on staging against the live processing DB (2026-06-25).

Method: same `ST_Intersects` join as
[`run_settlement_area_estimation.sql`](../../roads_bikelanes/pseudo_tags_settlement_area/sql/run_settlement_area_estimation.sql)
— `roads` + `roadsPathClasses` + `bikelanes` vs `public._settlement_areas` (~12.5M distinct ways).
Stored tags from the nightly pipeline matched the recompute exactly.

## National split

| Metric        | assumed_yes (innerorts) | assumed_no (außerorts) |
| ------------- | ----------------------- | ---------------------- |
| **Way count** | **67.9 %** (8.51M)      | **32.1 %** (4.01M)     |
| **Length**    | **52.3 %** (~1.25M km)  | **47.7 %** (~1.14M km) |

Außerorts ways are a **minority by count** but nearly **half by length** — long rural/trunk
segments dominate the outside class. Count-based percentages are what the CSV export optimizes for
(minority class ≈ 4M rows vs 8.5M inferred defaults).

`public._settlement_areas` at time of run: **195k** polygons, **106 MB**.

## Per-Bundesland

Way-count split by Bundesland — city states skew high, rural Länder low:

| Bundesland             | pct assumed_yes | pct assumed_no |
| ---------------------- | --------------- | -------------- |
| Berlin                 | 94.0            | 6.0            |
| Bremen                 | 90.2            | 9.8            |
| Hamburg                | 89.5            | 10.5           |
| Nordrhein-Westfalen    | 77.5            | 22.5           |
| Schleswig-Holstein     | 76.4            | 23.6           |
| Mecklenburg-Vorpommern | 75.0            | 25.0           |
| Sachsen                | 72.5            | 27.5           |
| Niedersachsen          | 71.2            | 28.8           |
| Sachsen-Anhalt         | 69.9            | 30.1           |
| Thüringen              | 65.9            | 34.1           |
| Brandenburg            | 66.9            | 33.1           |
| Saarland               | 67.8            | 32.2           |
| Bayern                 | 62.0            | 38.0           |
| Baden-Württemberg      | 62.2            | 37.8           |
| Hessen                 | 60.5            | 39.5           |
| Rheinland-Pfalz        | 57.3            | 42.7           |

## Takeaways

- **Export the minority class** (`assumed_no`, ~32 % by count) remains the right CSV strategy.
- When interpreting innerorts/außerorts heuristics, prefer **length-weighted** expectations for
  network coverage; **count-weighted** for row/storage estimates.
- Re-run only if `landuse_sets.lua`, `dissolve.sql`, or the export way set changes materially.
