# planning-worker

Python-Worker des **Planungsmoduls** (Flächenfinder). Läuft als eigener Container
parallel zu `processing/`. Konsumiert `prisma."PlanningJob"`-Zeilen, berechnet das
Flächenfinder-MCE-Scoring und schreibt die Ergebnisse nach PostGIS `planning.*`.

## Architektur

- **Inputs aus tildas `public`-Schema** statt OSM-PBF: Radwege aus `public.bikelanes`
  (siehe `flaechenfinder/postgis_loader.py`). Weitere Layer (ÖPNV/POI) sind
  der Erweiterungspunkt und liefern im MVP leere Mengen (der Scorer ist robust dagegen).
- **Outputs nach `planning.scenario_hexagons`**, getaggt mit
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

Default: `dem_source: "mapterhorn"` – lädt WebP-Kacheln (Terrarium-Encoding) von
`tiles.mapterhorn.com` (Zoom 13, ~6m/Pixel; gleiche Quelle wie das Höhenprofil im
Frontend, siehe `app/.../terrainProfile/sampling/`) und berechnet die Neigung je
Hexagon-Zentrum per Gradient (`flaechenfinder/dem.py:_slopes_from_mapterhorn`).
Weltweit verfügbar, kein Datendownload nötig – der Worker braucht Internetzugriff
(analog zu den CIR-WMS-Aufrufen für Vegetation).

Höhere Genauigkeit für einzelne Regionen: echte DGM1-GeoTIFFs über das
`planning_dem`-Volume (`/dem`) mounten und via `dem_source: "dgm1"` aktivieren.
`dem_source: "srtm"` bleibt als Fallback mit konstanter Neigung (2°) erhalten, falls
weder Mapterhorn noch DGM1 verfügbar sind.

## Weitere Doku

- [`SCORING.md`](SCORING.md) – MCE-Scoring je Hexagon, harte Ausschlüsse und
  Zoom-Aggregation.
- [`VEGETATION.md`](VEGETATION.md) – NDVI-Vegetationserkennung und deren
  Einbindung ins Scoring.
