# Benchmark documentation — settlement-area classification

A record of the one-off performance exploration that shaped this code, so we **don't have to
re-run it**. The benchmark scripts themselves were removed after we drew these conclusions.

## What we benchmarked

On full Germany (`germany-latest.osm.pbf`), with `public._settlement_areas` already built:

1. **Dissolve** (`dissolve.sql`) — how long does building the settlement areas take, and does
   it survive Germany (a naive whole-country union runs out of memory)?
2. **Per-way classification** — for the `_in_settlement_area` pseudo-tag, how do we decide if a
   way is inside a settlement area, and how expensive is it? We compared two methods against the
   sidepath-aligned way set (≈15.9M road + path ways, extracted as linestrings):
   - **A. `ST_Intersects`** — does the way touch any settlement area at all? (boolean)
   - **B. % length coverage** — is ≥ threshold of the way's length inside? (`ST_Intersection`)

## Results

| Thing                                      | Result                                                      |
| ------------------------------------------ | ----------------------------------------------------------- |
| osm2pgsql extract (`landcover.lua`, 5243)  | ~4m15s → 891k source polygons                               |
| Dissolve (`dissolve.sql`)                  | ~7m24s → 158k polygons, ~45,600 km², all valid. **No OOM.** |
| Method A — `ST_Intersects` over 15.9M ways | **~170 s**, robust                                          |
| Method B — % coverage over 15.9M ways      | **Exhausted memory / aborted** — far too expensive          |
| Inside vs outside split (Method A)         | **70.3 % inside / 29.7 % outside**                          |
| CRS: 5243 native vs 3857 + cos(lat)        | 5243 was ~2 min faster (no per-row reprojection)            |

## Takeaways (what we actually do)

- **Dissolve:** grid-partitioned parallel `ST_Union` + GEOS-robust valid-only output fixed the
  original OOM/crash. ~12 min total on Germany — fine for a `weekend` (≈ weekly) topic.
- **Per-way method:** use **`ST_Intersects`**. The %-coverage variant is not worth its cost
  (and risks OOM); a way touching a settlement area at all is a good enough innerorts signal.
- **Export the minority class:** outside (≈30%) is smaller than inside (≈70%), so the CSV holds
  only the outside ways (`assumed_no`) and the Lua infers inside (`assumed_yes`) as the default —
  see `roads_bikelanes/pseudo_tags_settlement_area/`.
- **CRS:** do metric work natively in EPSG:5243; don't reproject per row.

## Re-running (only if the inputs change materially)

The benchmark needed a highway-linestring extract (the sidepath-aligned set) joined against
`public._settlement_areas` with `ST_Intersects`, timed with `\timing`, plus the same with
`SUM(ST_Length(ST_Intersection(...)))/ST_Length(way)` for Method B. Re-create from this
description rather than keeping the throwaway scripts around.
