# Settlement areas (`public._settlement_areas`)

Generalized **settlement areas** ("Siedlungsgebiete") from human-associated land use, used to
estimate whether a way is **innerorts** or **außerorts** (the `_in_settlement_area` pseudo-tag in
`roads_bikelanes/pseudo_tags_settlement_area/`).

`settlement_source.lua` extracts the source polygons into `_settlement_source_areas`; `dissolve.sql`
turns them into `public._settlement_areas`.

> [!IMPORTANT]
> **This is a heuristic, not a legal boundary.** It is derived from landuse/leisure/amenity
> polygons — a proxy for innerorts/außerorts. It is **not** the legal "geschlossene Ortschaft"
> (Ortstafel, traffic signs 310/311), which we do not use. That is why the downstream pseudo-tag
> value is `assumed_yes` / `assumed_no`.

## Input definition

Based on Alex/SupaplexOSM's "Siedlungsgebiet" set (source: <https://overpass-turbo.eu/s/2q48>),
extended with a few civic/rural landuse values. The list lives in
[helper/landuse_sets.lua](helper/landuse_sets.lua):

- `landuse` ∈ residential, commercial, industrial, retail, education, religious, garages, brownfield, construction, civic, civic_admin, farmyard
- `leisure` ∈ park, garden, dog_park, sports_centre, stadium
- `amenity` ∈ school, kindergarten, college, university, hospital, clinic, prison

## Method

`dissolve.sql` outer-buffers (+100 m) → dissolves → inner-buffers (−75 m) → cleans → simplifies.
The asymmetric buffer (outer > inner) pulls edge roads into the area and closes road-width gaps.
The dissolve is grid-partitioned with the parallel-safe `ST_Union` aggregate (so we never union the
whole country at once, which exhausts memory), and the output is GEOS-robust (valid-only) and
`ST_Subdivide`d for fast spatial joins. Tune via the commented constants in `dissolve.sql`.

## CRS — EPSG:5243

All metric work is in **EPSG:5243** (ETRS89/LCC Germany, meters — the same metric CRS the `parking`
topic uses). osm2pgsql stores `_settlement_source_areas` in 5243 directly (via `projection = 5243`),
so buffers are true ground meters with no in-SQL reprojection. `_settlement_areas` is stored in 5243;
the per-way join transforms ways into 5243 temp tables.

## Table shape

`_settlement_areas` uses the **standard topic-table shape** — `id` (`settlement-area/<n>`), `tags`
(`{ area }`, m²), `meta` (`{}`), `geom` (5243), `minzoom` (size-based: 6 / 8 / 10 / 12) — so it
previews cleanly in Martin. Indexes: `GIST(minzoom, geom)` + unique `id`, plus a plain `GIST(geom)`
for the per-way join. The per-settlement `area`/`minzoom` are computed on the whole polygon and
carried through `ST_Subdivide`, so all fragments of one settlement share them. The `_` prefix keeps
it internal/debug (its only real consumer is the per-way `ST_Intersects` join), not a display layer.

## Performance

Measured on Germany: osm2pgsql ~4m15s + dissolve ~7m24s ≈ **12 min** (fine for weekly). The per-way
classification uses `ST_Intersects`. See [BENCHMARK_DOCUMENTATION.md](BENCHMARK_DOCUMENTATION.md) for
the full benchmark and why we chose `ST_Intersects` over %-coverage.
