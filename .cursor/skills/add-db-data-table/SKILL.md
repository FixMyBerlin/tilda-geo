---
name: add-db-data-table
description: Add or update a Postgres data.* table via data-schema (spec, verify, load, publish dump, `/admin/data-schema` Import). Use when processing SQL needs data inside Postgres; not for map tiles/GeoJSON StaticDatasets.
---

# Add DB data table (`data.*`)

## When to use

- **Use** for datasets that `processing/` SQL reads from Postgres `data.*`.
- **Do not use** for map tiles / GeoJSON served to the map — use [add-static-dataset](../add-static-dataset/SKILL.md) instead.

Specs live at repo-root `data-schema/<table>/` (gitignored). Source geojson/gpkg stays on the local dev computer (next to the spec or via `--file`). Commands run from `app/`. Updating an existing table: `bun run data-schema-pull -- --table <table>` first so the local spec matches S3. Pull/publish compare spec **content**; the CLI asks when local and S3 specs differ.

## Steps

### 1. Write `data-schema/<table>/spec.json`

Match [`app/src/server/dataSchema/dataSchemaSpec.schema.ts`](../../../app/src/server/dataSchema/dataSchemaSpec.schema.ts) (`DataSchemaSpec` / `parseDataSchemaSpec`). Folder name, `spec.table`, and CLI `--table` must be the same snake_case identifier.

**Ask the user** how they obtain or generate the source file (Drive folder, export from a GIS, API, …). Put that in `source.documentation` as Markdown — it is shown on `/admin/data-schema` under “Quelle aktualisieren”. Do not put secrets in it.

```json
{
  "specVersion": 1,
  "table": "euvm_cutouts_point",
  "source": {
    "file": "euvm_cutouts_point.geojson",
    "provider": "eUVM Berlin",
    "documentation": "Google Drive: https://drive.google.com/drive/folders/1wEKkUayaySZ6AhsdrkTGbbeVAx1YJARs\n\nDownload the point GeoJSON delivery and load it with data-schema-load."
  },
  "import": {
    "srid": 4326,
    "geometryName": "geom",
    "fidColumn": "id",
    "selectColumns": ["type"],
    "expectedGeometryType": "Point",
    "layer": null
  },
  "indexes": [{ "name": "euvm_cutouts_point_geom_idx", "using": "gist", "columns": ["geom"] }],
  "consumedBy": "processing/topics/parking/cutouts/2_external_cutouts_euvm.sql"
}
```

- `source.file`: basename of the local geojson/gpkg used by load (not stored on S3).
- `source.provider`: optional short label in admin.
- `source.documentation`: optional Markdown — how to get or generate that file next time.
- `consumedBy`: optional path of processing SQL that reads this table. Shown in admin; nothing validates it against the SQL.
- Geometry names are WKB-style (`MultiPolygon`, `LineString`). `data-schema-load` treats ogrinfo’s spaced forms (`Multi Polygon`) as the same.

### 2. Verify + format

```bash
bun run data-schema-verify -- --table <table>
bun run format:data-schema
```

Verify parses the spec with the same Zod schema load/publish use. Fix errors before load. Specs are gitignored, so `format:data-schema` (not `format:main`) is what formats them.

### 3. Source file + load

Load needs the geojson/gpkg. Resolve the path in this order:

1. Absolute path already in the user prompt.
2. Existing file at `data-schema/<table>/<spec.source.file>`.
3. Otherwise **ask the user** for the path (Downloads, a large file they do not want next to the spec).

```bash
bun run data-schema-load -- --table <table>
bun run data-schema-load -- --table <table> --file /abs/path
```

`--file` only overrides the path. Columns, SRID, geometry type, and indexes still come from the spec. Load runs host `ogr2ogr` (GDAL 3.8+, `brew install gdal`) into local `data.<table>` and checks feature count vs Postgres — that is the local source check. Dump restore is Import on `/admin/data-schema`.

### 4. Publish

Required for staging/production (skip only if the user asked for a local load only).

```bash
bun run data-schema-publish -- --table <table> [--mode override|snapshot]
```

Uploads spec + `pg_dump` of the local table to S3. Default `--mode override` overwrites `spec.json`, `data.dump`, and `data.manifest.json`. `--mode snapshot` copies the current dump+manifest to `snapshots/<when it was published>/` first — use that when keeping a previous version (e.g. v1.2) before a major bump. When the current dump is at least 1 day old and `--mode` is omitted, the CLI asks.

`--spec-only` uploads the spec without a dump (new recipe before load, or metadata edits: `provider`, `documentation`, `consumedBy`). Column/geometry changes need load + a full publish.

### 5. Import dumps (admin UI)

Dump restore is only `/admin/data-schema` **Import** (local, staging, production). Do **not** POST `/api/admin/data-schema/import` from an agent.

`bun run seed` always runs `data-schema-pull` (fail-soft if S3 is missing). It does not restore dumps.

- Local: http://127.0.0.1:5173/admin/data-schema
- Staging: https://staging.tilda-geo.de/admin/data-schema
- Production: https://tilda-geo.de/admin/data-schema

There is no per-table deeplink. Hand over the page and the table name; they click **Import** on that row.

Import updates `data.*` only. If `consumedBy` processing SQL exists, the map’s `public.*` tables need a processing run after Import. Source documentation is on that page under “Quelle aktualisieren”.
