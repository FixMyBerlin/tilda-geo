# space-finder-worker

Python worker of the **Flächenfinder** (code name `spaceFinder`). It computes one variant of a
Planungsgebiet on demand: it takes `prisma."SpaceFinderJob"` rows the app queues, scores the
area per H3 hexagon (MCE) and writes the results to the PostGIS schema `space_finder`.

## How it relates to `processing/`

Both run as their own container next to the app, but they do different jobs:

|        | `processing/`                                    | `space-finder-worker/`                                        |
| ------ | ------------------------------------------------ | ------------------------------------------------------------- |
| Runs   | nightly / weekly for all regions (cron, by hand) | per job, when someone clicks "Berechnen" in the Flächenfinder |
| Input  | OSM PBF                                          | the tables `processing/` wrote to `public` (+ elevation, CIR) |
| Output | `public.*` tables, tiles via Martin              | `space_finder.*` per run, tiles via the app (member-only)     |
| Tech   | osm2pgsql + Lua + SQL                            | Python (geopandas, shapely, h3)                               |

So the worker only reads what `processing/` produced; it never changes `public`. Which topics
it needs: [`SCORING.md`](SCORING.md) and [`ALKIS.md`](ALKIS.md) (data sources per factor).

## Folder layout

- `worker.py`: job loop. `LISTEN space_finder_jobs` + 15s poll fallback, claims jobs with
  `FOR UPDATE SKIP LOCKED`, lifecycle QUEUED → RUNNING → DONE/FAILED, writes progress.
- `merge_factor_config.py`: merges area + variant into the run snapshot (mirror of
  `app/src/server/spaceFinder/mergeFactorConfig.ts`).
- `db.py`, `results.py`: connections, `space_finder` schema setup, writing results per `run_id`.
- `scoring/`: the scoring itself (Python package). It started as the standalone
  "flaechenfinder" project; here it reads from PostGIS instead of an OSM PBF and returns
  GeoDataFrames instead of writing files. `scorer.py` is the MCE, `config.py` the factor
  config, the other modules load one kind of input each (`postgis_loader.py`, `tilda.py`,
  `dem.py`, `vegetation.py`, `carriageways.py`, `eigendaten.py`).
- `sql/`: idempotent DDL for the result tables and the MVT tile functions, applied on every
  worker start. The app creates the same functions on startup
  (`app/src/server/instrumentation/registerSpaceFinderFunctions.server.ts`); keep both in sync.
- `test_*.py`: unit tests (`unittest`), see below.

Results are tagged with `run_id` (= `SpaceFinderRun.id`). A finished run is immutable; a
recalculation creates a new run.

## Configuration

Env (like `processing`): `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`.

A run's `factorConfigSnapshot` JSON (see `scoring/config.py:use_case_from_dict`) contains
`weights`, hard thresholds, `targets`, `h3_resolution`, `dem_source` and `study_area`
(GeoJSON geometry, EPSG:4326).

## Local (Docker)

`bun run dev` starts only db and tiles; start the worker by hand (dev settings in
`docker-compose.override.yml`: source mounted, no rebuild needed for code changes):

```bash
docker compose build space-finder-worker
docker compose up space-finder-worker
```

Seeded Planungsgebiete are in `dev-flaechenfinder` (`app/prisma/seeds/spaceFinder.ts`);
"Berechnen" in the Flächenfinder queues a job.

## Tests

From this folder (Python 3.12–3.14; `psycopg-binary` has no wheels for newer versions):

```bash
uv run python -m unittest discover
```

Or in the container: `docker compose run --rm space-finder-worker python -m unittest discover`

## DEM / slope

Default: `dem_source: "mapterhorn"` – loads WebP tiles (Terrarium encoding) from
`tiles.mapterhorn.com` (zoom 13, ~6m/pixel; same source as the elevation profile in the
frontend, see `app/.../terrainProfile/sampling/`) and computes the slope per
hexagon center via gradient (`scoring/dem.py:_slopes_from_mapterhorn`).
Available worldwide, no data download needed – the worker needs internet access
(like the CIR WMS calls for vegetation).

Higher accuracy for individual regions: mount real DGM1 GeoTIFFs via the
`space_finder_dem` volume (`/dem`) and enable them with `dem_source: "dgm1"`.
`dem_source: "srtm"` remains as a fallback with constant slope (2°) in case
neither Mapterhorn nor DGM1 is available.

## Further docs

- [`SCORING.md`](SCORING.md) – MCE scoring per hexagon, hard exclusions and
  zoom aggregation.
- [`VEGETATION.md`](VEGETATION.md) – NDVI vegetation detection and how it
  feeds into scoring.
- [`ALKIS.md`](ALKIS.md) – which official data the scoring uses (and that ALKIS is not among it).
