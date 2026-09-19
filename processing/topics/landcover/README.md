# `landcover` topic

A **weekend** topic (`schedule: 'weekend'` in `constants/topics.const.ts`) for heavy,
rarely-changing landcover data. It runs on the Saturday nightly run (≈ once a week, Berlin
time) instead of every night, and can also be run on demand:

```sh
# inside the processing container (osm2pgsql/psql + PG* env available)
PROCESS_ONLY_TOPICS=landcover bun run /processing/index.ts
```

The extra runtime is fine on a weekend; the daily pipeline only _reads_ the output. On non-weekend
runs the skip is logged so it stays visible.

### Manual run on the server

SSH to the host, then run **landcover** and **roads_bikelanes** back-to-back. Settlement-area pseudo
tags (`_in_settlement_area` on roads/bikelanes) are derived from `public._settlement_areas`, which
landcover produces; the follow-up `roads_bikelanes` run re-exports and re-attaches those tags.

Reuses the existing OSM extract (`SKIP_DOWNLOAD=1`), skips Martin warm-cache, forces a full topic
run (`SKIP_UNCHANGED=0`), and turns diffing off — same knobs as a focused production refresh.

```sh
cd /srv && \
PROCESS_ONLY_TOPICS=landcover \
SKIP_DOWNLOAD=1 \
SKIP_WARM_CACHE=1 \
SKIP_UNCHANGED=0 \
PROCESSING_DIFFING_MODE=off \
docker compose up -d processing && docker logs -f processing && \
PROCESS_ONLY_TOPICS=roads_bikelanes \
SKIP_DOWNLOAD=1 \
SKIP_WARM_CACHE=1 \
SKIP_UNCHANGED=0 \
PROCESSING_DIFFING_MODE=off \
docker compose up -d processing && docker logs -f processing
```

Each leg starts detached and follows logs until the container exits; `docker logs -f` unblocks the
`&&` chain so the next leg starts only after the previous run finished.

## Datasets

`landcover.lua` is one osm2pgsql entrypoint that delegates to per-dataset area handlers (plus one
node handler for `_building_entrances`); each dataset lives in its own folder (handler + helpers +
SQL + docs):

| table                      | folder                                   | notes                                                                        |
| -------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| `landuse`                  | [`landuse/`](landuse/)                   | land use display table                                                       |
| `_settlement_areas`        | [`settlement_areas/`](settlement_areas/) | innerorts/außerorts heuristic — details in its README                        |
| `_settlement_source_areas` | [`settlement_areas/`](settlement_areas/) | dissolve source (geometry-only)                                              |
| `_buildings`               | [`buildings/`](buildings/)               | building geometries ≥ 100 m² (geometry-only)                                 |
| `_buildings_train_station` | [`buildings/`](buildings/)               | `building=train_station` geometries, no size filter (geometry-only)          |
| `_building_entrances`      | [`buildings/`](buildings/)               | `entrance=*` nodes (point + `entrance` value); the topic's only point output |

The `_` prefix marks a table **internal/debug**: still exposed to Martin for inspection, but not a
curated display layer (no `atlas_*` function). `_settlement_areas` carries the standard shape
(id/tags/meta/geom/minzoom) so it previews cleanly; the other `_` tables are geometry-only.
`landuse` is the only curated display table.

> [!NOTE]
> Everything in this weekend topic refreshes ~weekly, not nightly — including the `landuse`
> display table.
