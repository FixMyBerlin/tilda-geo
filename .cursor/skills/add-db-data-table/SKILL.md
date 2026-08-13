---
name: add-db-data-table
description: Add or update a Postgres data.* table via data-schema (spec, verify, load, publish dump, admin Import). Use when processing SQL needs data inside Postgres; not for map tiles/GeoJSON StaticDatasets.
---

# Add DB data table (`data.*`)

## When to use

- **Use** for datasets that `processing/` SQL reads from Postgres `data.*`.
- **Do not use** for map tiles / GeoJSON served to the map — use [add-static-dataset](../add-static-dataset/SKILL.md) instead.

Specs and source files live at repo-root `data-schema/<table>/` (gitignored). Commands run from `app/`. Updating an existing table: `bun run data-schema-sync -- --table <table>` first so the local spec matches S3.

## Steps

### 1. Write `data-schema/<table>/spec.json`

Match [`app/src/server/dataSchema/dataSchemaSpec.schema.ts`](../../../app/src/server/dataSchema/dataSchemaSpec.schema.ts) (`DataSchemaSpec` / `parseDataSchemaSpec`). Folder name, `spec.table`, and CLI `--table` must be the same snake_case identifier.

```json
{
  "specVersion": 1,
  "table": "euvm_cutouts_point",
  "source": {
    "file": "euvm_cutouts_point.geojson",
    "provider": "eUVM Berlin",
    "note": "Google Drive delivery"
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
  "consumedBy": "processing/topics/parking/cutouts/2_external_cutouts_euvm.sql",
  "large": false
}
```

- `consumedBy`: optional note of which processing SQL reads this table. Nothing validates it against the SQL.
- `large` (default `false`): ask the user if this dump is multi-GB. If yes, set `true` so “Alle importieren” skips it unless they tick large tables. If unclear, leave `false`.
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

`--file` only overrides the path. Columns, SRID, geometry type, and indexes still come from the spec. Load runs host `ogr2ogr` (GDAL 3.8+, `brew install gdal`) into local `data.<table>` and checks feature count vs Postgres — that is the local source check. There is no separate local dump-restore CLI.

### 4. Publish

Required for staging/production (skip only if the user asked for a local load only).

```bash
bun run data-schema-publish -- --table <table> [--mode override|snapshot]
```

Uploads spec + `pg_dump` of the local table to S3 `latest/`. Default `--mode override` replaces latest (v1 → v1.1 → v1.2). `--mode snapshot` archives the **current** latest under `snapshots/<when it was published>/`, then writes the new dump — use that when keeping a previous latest (e.g. v1.2) before a major bump. When latest is at least 1 day old and `--mode` is omitted, the CLI asks.

`--spec-only` uploads the spec without a dump (new recipe before load, or spec-only edits).

### 5. Import via admin UI — give the user the URLs

Do **not** POST `/api/admin/data-schema/import` yourself. That route requires an admin session cookie; the agent usually has none.

There is no per-table deeplink. Hand over the page and the table name. Optional local Import after publish is the dump-roundtrip check (same UI as staging/prod):

- Local: http://127.0.0.1:5173/admin/data-schema
- Staging: https://staging.tilda-geo.de/admin/data-schema
- Production: https://tilda-geo.de/admin/data-schema

Import updates `data.*` only. If `consumedBy` processing SQL exists, the map’s `public.*` tables need a processing run after Import.
