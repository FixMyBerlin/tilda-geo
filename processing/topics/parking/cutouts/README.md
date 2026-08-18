# Cutouts

## External cutouts

Processing can punch parking with extra geometries that are not OSM. Those tables live in Postgres as `data.*` and are loaded with the [data-schema](../../../../data-schema/README.md) pipeline ([add-db-data-table skill](../../../../.cursor/skills/add-db-data-table/SKILL.md)).

### eUVM Berlin

[`2_external_cutouts_euvm.sql`](2_external_cutouts_euvm.sql) reads `data.euvm_cutouts_point` and `data.euvm_cutouts_polygon`. Specs are gitignored at `data-schema/<table>/spec.json` (from S3 via `data-schema-pull`).

#### Prepare the source files

Download the latest point and polygon GeoJSON from [this Google Drive folder](https://drive.google.com/drive/folders/1wEKkUayaySZ6AhsdrkTGbbeVAx1YJARs). Keep the `type` property.

Point types that get a buffer: `bollard`, `street_lamp`, `tree`, `street_cabinet`, `traffic_sign`, `water_well` (radii in the SQL, aligned with OSM obstacle categories). Other point types are skipped and logged. Polygons get a 0.6 m buffer.

CRS should be WGS84 (EPSG:4326). If load rejects the polygon geometry type, set `expectedGeometryType` in the polygon spec to match the file (`Polygon` vs `MultiPolygon`).

Then load, publish, and Import those two tables as in the data-schema docs. After Import on staging/production, run parking processing so `parkings_cutouts` updates.
