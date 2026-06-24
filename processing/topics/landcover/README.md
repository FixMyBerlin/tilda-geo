# `landcover` topic

A **weekend** topic (`schedule: 'weekend'` in `constants/topics.const.ts`) for heavy,
rarely-changing landcover data. It runs on the Saturday/Sunday nightly runs (≈ once a week, Berlin
time) instead of every night, and can also be run on demand:

```sh
# inside the processing container (osm2pgsql/psql + PG* env available)
PROCESS_ONLY_TOPICS=landcover bun run /processing/index.ts
```

The extra runtime is fine on a weekend; the daily pipeline only _reads_ the output. On non-weekend
runs the skip is logged so it stays visible.

## Datasets

`landcover.lua` is one osm2pgsql entrypoint that delegates to per-dataset area handlers; each
dataset lives in its own folder (handler + helpers + SQL + docs):

| table                      | folder                                   | notes                                                 |
| -------------------------- | ---------------------------------------- | ----------------------------------------------------- |
| `landuse`                  | [`landuse/`](landuse/)                   | land use display table                                |
| `_settlement_areas`        | [`settlement_areas/`](settlement_areas/) | innerorts/außerorts heuristic — details in its README |
| `_settlement_source_areas` | [`settlement_areas/`](settlement_areas/) | dissolve source (geometry-only)                       |
| `_buildings`               | [`buildings/`](buildings/)               | building geometries ≥ 100 m² (geometry-only)          |

The `_` prefix marks a table **internal/debug**: still exposed to Martin for inspection, but not a
curated display layer (no `atlas_*` function). `_settlement_areas` carries the standard shape
(id/tags/meta/geom/minzoom) so it previews cleanly; the other `_` tables are geometry-only.
`landuse` is the only curated display table.

> [!NOTE]
> Everything in this weekend topic refreshes ~weekly, not nightly — including the `landuse`
> display table.
