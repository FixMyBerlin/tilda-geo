# planning-worker

Python worker of the **planning module** (Flächenfinder). Runs as its own container
alongside `processing/`. Consumes `prisma."PlanningJob"` rows, computes the
Flächenfinder MCE scoring and writes the results to PostGIS `planning.*`.

## Architecture

- **Inputs from TILDA's `public` schema** instead of OSM PBF: cycleways from `public.bikelanes`
  (see `flaechenfinder/postgis_loader.py`). Further layers (ÖPNV/POI) are the
  extension point and return empty sets in the MVP (the scorer treats empty inputs as 0).
- **Outputs to `planning.scenario_hexagons`**, tagged with
  `run_id` (= `PlanningRun.id`). A finished run is immutable.
- **Job loop** (`worker.py`): `LISTEN planning_jobs` + 15s poll fallback, claiming via
  `FOR UPDATE SKIP LOCKED`. Lifecycle QUEUED → RUNNING → DONE/FAILED.

## Configuration

Env (like `processing`): `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`.

A scenario's `factorConfig` JSON (see `flaechenfinder/config.py:use_case_from_dict`)
contains `weights`, hard thresholds, `targets`, `h3_resolution`, `dem_source` and
`study_area` (GeoJSON geometry, EPSG:4326).

## Local (Docker)

```bash
docker compose build planning-worker
docker compose up planning-worker
```

## End-to-end test (phase 1)

```sql
-- Create a scenario (study_area = small bbox), then enqueue a job:
INSERT INTO prisma."PlanningJob" ("scenarioId", status, "createdAt", "updatedAt")
VALUES (<scenarioId>, 'QUEUED', now(), now());
SELECT pg_notify('planning_jobs', '');
-- Then:
SELECT count(*) FROM planning.scenario_hexagons WHERE run_id = <runId>;
```

## DEM / slope

Default: `dem_source: "mapterhorn"` – loads WebP tiles (Terrarium encoding) from
`tiles.mapterhorn.com` (zoom 13, ~6m/pixel; same source as the elevation profile in the
frontend, see `app/.../terrainProfile/sampling/`) and computes the slope per
hexagon center via gradient (`flaechenfinder/dem.py:_slopes_from_mapterhorn`).
Available worldwide, no data download needed – the worker needs internet access
(like the CIR WMS calls for vegetation).

Higher accuracy for individual regions: mount real DGM1 GeoTIFFs via the
`planning_dem` volume (`/dem`) and enable them with `dem_source: "dgm1"`.
`dem_source: "srtm"` remains as a fallback with constant slope (2°) in case
neither Mapterhorn nor DGM1 is available.

## Further docs

- [`SCORING.md`](SCORING.md) – MCE scoring per hexagon, hard exclusions and
  zoom aggregation.
- [`VEGETATION.md`](VEGETATION.md) – NDVI vegetation detection and how it
  feeds into scoring.
