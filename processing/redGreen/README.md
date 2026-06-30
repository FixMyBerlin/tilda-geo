# Red/Green Pipeline Scripts

This folder contains the staging-build and primary-promotion workflow for 3-hour updates.

## Entry point

From `processing/`:

```sh
bun run red-green
```

## Required environment variables

- `PROCESSING_STAGING_DATABASE_URL`: secondary DB used to build data.
- `PROMOTION_PRIMARY_DATABASE_URL`: fixed primary DB receiving promoted geo data.
- `RED_GREEN_VERIFY_ENDPOINTS`: comma-separated URLs checked before and after promotion.

## Optional environment variables

- `PROMOTION_TABLES_ALLOWLIST`: comma-separated table list to promote.
- `PROMOTION_ROW_COUNT_TOLERANCE`: max relative row-count delta vs primary before promotion (default `0.15`).
- `WORKING_PBF_PATH`: Geofabrik baseline file for nightly reseed + pyosmium catch-up.
- `RECUT_POLYGON_PATH` or `RECUT_BBOX`: Germany re-cut selector (prefer polygon).
- `RECUT_POLYGON_DOWNLOAD_URL`: URL to bootstrap `RECUT_POLYGON_PATH` from when missing (e.g. `https://download.geofabrik.de/europe/germany.poly`).
- `RECUT_PBF_PATH`: output path for the recut extract.
- `REPLICATION_SERVER_URL`: e.g. `https://planet.osm.org/replication/hour/` for intra-day catch-up. When set, pyosmium runs with `--ignore-osmosis-headers`.
- `RED_GREEN_RESEED_UTC_HOUR`: UTC hour for nightly Geofabrik reseed (default `0`).
- `RED_GREEN_FORCE_RESEED`: set to `1` to force a Geofabrik download + polygon refresh on the next run.
- `WARM_CACHE_MODE`: `full` (default) or `delta`.
- `RED_GREEN_DELTA_WARM_ENDPOINT`: private endpoint used when `WARM_CACHE_MODE=delta`.
- `RED_GREEN_VERIFY_INTERVAL_MS`: verifier polling interval (default `5000`).
- `RED_GREEN_MAX_FAILURE_STREAK`: max tolerated failed probes in sequence (default `3`).
- `RED_GREEN_LOCK_TTL_SECONDS`: a lock older than this is treated as stale and broken (default `14400` = 4h).

## Notes

- Verification is mandatory. The run fails if `RED_GREEN_VERIFY_ENDPOINTS` is missing.
- Staging build applies `dbEnv(staging)` to `process.env` for the build only (`withProcessEnv`), then dynamically imports processing steps so `params` and `sql`/`psql` target the staging DB. It does not run `index.ts` finishing steps (hooks, tile restart, cache).
- Post-promotion side effects (tile restart, hooks, cache clear/warm) are triggered explicitly by `orchestrate.ts` against primary. They retry transient failures and warn (do not roll back) on persistent ones — only the verifier failure-streak budget rolls back a promotion.
- Promotion swaps geo tables in primary while preserving previous tables in `geo_prev` for rollback.

See [`docs/osm-red-green-pipeline.md`](../../docs/osm-red-green-pipeline.md) for the full architecture, operations and debugging guide.
