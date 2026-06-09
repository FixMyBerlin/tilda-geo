# planning-worker

Python-Worker des **Planungsmoduls** (Flächenfinder). Läuft als eigener Container
parallel zu `processing/`. Konsumiert `prisma."PlanningJob"`-Zeilen, berechnet das
Flächenfinder-MCE-Scoring und schreibt die Ergebnisse nach PostGIS `planning.*`.

## Architektur

- **Inputs aus tildas `public`-Schema** statt OSM-PBF: Radwege aus `public.bikelanes`
  (siehe `flaechenfinder/postgis_loader.py`). Weitere Layer (ÖPNV/POI/Untergrund) sind
  der Erweiterungspunkt und liefern im MVP leere Mengen (der Scorer ist robust dagegen).
- **Outputs nach `planning.scenario_hexagons` / `planning.scenario_areas`**, getaggt mit
  `run_id` (= `PlanningRun.id`). Ein abgeschlossener Lauf ist unveränderlich.
- **Job-Loop** (`worker.py`): `LISTEN planning_jobs` + 15s-Poll-Fallback, Claiming via
  `FOR UPDATE SKIP LOCKED`. Lifecycle QUEUED → RUNNING → DONE/FAILED.

## Konfiguration

Env (wie `processing`): `PGHOST`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`.

Das `factorConfig`-JSON eines Szenarios (siehe `flaechenfinder/config.py:use_case_from_dict`)
enthält `weights`, harte Schwellen, `targets`, `h3_resolution`, `dem_source` und
`study_area` (GeoJSON-Geometrie, EPSG:4326).

## Lokal (Docker)

```bash
docker compose build planning-worker
docker compose up planning-worker
```

## End-to-End-Test (Phase 1)

```sql
-- Szenario anlegen (study_area = kleine BBox), dann Job enqueuen:
INSERT INTO prisma."PlanningJob" ("scenarioId", status, "createdAt", "updatedAt")
VALUES (<scenarioId>, 'QUEUED', now(), now());
SELECT pg_notify('planning_jobs', '');
-- Danach:
SELECT count(*) FROM planning.scenario_hexagons WHERE run_id = <runId>;
```

## DEM / Hangneigung

MVP nutzt den SRTM-Fallback (konstante Neigung). Echte DGM1-GeoTIFFs werden über das
`planning_dem`-Volume (`/dem`) gemountet und via `dem_source: "dgm1"` aktiviert.
