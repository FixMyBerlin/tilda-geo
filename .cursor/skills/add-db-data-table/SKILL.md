---
name: add-db-data-table
description: Add or update a Postgres data.* table via data-schema (spec, verify, load, publish). Import on each environment is data-schema/README.md. Use when processing SQL needs data inside Postgres; not for map tiles/GeoJSON StaticDatasets.
---

# Add DB data table (`data.*`)

## When to use

- **Use** for datasets that `processing/` SQL reads from Postgres `data.*`.
- **Do not use** for map tiles / GeoJSON served to the map — use [add-static-dataset](../add-static-dataset/SKILL.md) instead.

Specs live at repo-root `data-schema/<table>/` (gitignored). The recipe is **`spec.yaml`**; source data is `.geojson` / `.gpkg` / `.sql` next to it. Use `.sql` when the table’s exact DDL must be preserved (e.g. a text primary key that ogr2ogr would replace with `ogc_fid`) — typical for production-generated baselines such as the QA voronoi tables. `--file` only if the source stays elsewhere (Downloads, a large file). Commands run from `app/`. Updating an existing table: `bun run data-schema-pull -- --table <table>` first so the local spec matches S3. Pull/publish compare spec **content**; the CLI asks when local and S3 specs differ.

## Steps

### 1. Write `data-schema/<table>/spec.yaml`

Match [`app/src/server/dataSchema/dataSchemaSpec.schema.ts`](../../../app/src/server/dataSchema/dataSchemaSpec.schema.ts) (`DataSchemaSpec` / `parseDataSchemaSpec`). YAML load/write is [`dataSchemaSpec.yaml.ts`](../../../app/src/server/dataSchema/dataSchemaSpec.yaml.ts) (`Bun.YAML` + that Zod parse). Folder name, `spec.table`, and CLI `--table` must be the same snake_case identifier.

**Ask the user** how they obtain or generate the source file (Drive folder, export from a GIS, API, …). Put that in `source.documentation` as Markdown; it is shown on `/admin/data-schema`. Do not put secrets in it.

```yaml
specVersion: 1
table: euvm_cutouts_point
source:
  file: euvm_cutouts_point.geojson
  provider: eUVM Berlin
  documentation: "Google Drive: https://drive.google.com/drive/folders/1wEKkUayaySZ6AhsdrkTGbbeVAx1YJARs\n\nDownload the point GeoJSON delivery and load it with data-schema-load."
import:
  srid: 4326
  geometryName: geom
  fidColumn: id
  selectColumns:
    - type
  expectedGeometryType: MultiPoint
  layer: null
indexes:
  - name: euvm_cutouts_point_geom_idx
    using: gist
    columns:
      - geom
consumedBy: processing/topics/parking/cutouts/2_external_cutouts_euvm.sql
```

- `source.file`: basename of the usual local geojson/gpkg/sql. Load prefers this file when it exists in the table folder; otherwise it picks the only `.geojson`/`.gpkg`/`.sql` there. Not stored on S3.
- `source.provider`: optional short label in admin.
- `source.documentation`: optional Markdown — how to get or generate that file next time.
- `import`: required for `.geojson`/`.gpkg` (ogr2ogr options). **Omit for `.sql` dumps** — the dump carries its own DDL; ogr2ogr is not used.
- `consumedBy`: optional path of processing SQL that reads this table. Shown in admin; nothing validates it against the SQL.
- Geometry names are WKB-style (`MultiPolygon`, `LineString`). `data-schema-load` treats ogrinfo’s spaced forms (`Multi Polygon`) as the same.

### Convert `spec.json` → `spec.yaml`

S3 and the local folder only use `spec.yaml`. If a table still has `spec.json`:

1. Write `data-schema/<table>/spec.yaml` with the same fields as the JSON (example above). Delete `spec.json`.
2. Verify (step 2).
3. Publish **`--spec-only`** (step 4). Do not load and do not Import — the dump is unchanged; only the recipe file on S3 changes.
4. Delete leftover S3 `data-schema/<table>/spec.json` if that key still exists (publish does not remove it).

### 2. Verify

```bash
bun run data-schema-verify -- --table <table>
```

Verify parses the spec with the same Zod schema load/publish use. Fix errors before load. Specs are gitignored YAML; oxfmt does not format them. Pull/publish write YAML via `Bun.YAML.stringify`.

### 3. Source file + load

Load needs a `.geojson`, `.gpkg`, or `.sql`. Resolve the path in this order:

1. `--file` when the source is not in the table folder.
2. `data-schema/<table>/<spec.source.file>` if that file exists.
3. The only `.geojson`, `.gpkg`, or `.sql` in `data-schema/<table>/`.
4. Otherwise **ask the user** to put the file next to the spec (or pass `--file` for Downloads / a large file they do not want to copy).

```bash
bun run data-schema-load
bun run data-schema-load -- --table <table>
bun run data-schema-load -- --table <table> --file /abs/path
```

Omitting `--table` on a TTY lists local `data-schema/*/spec.yaml` and asks which table. Non-interactive runs need `--table`.

`--file` is only for a source outside the table folder. For `.geojson`/`.gpkg`, columns, SRID, geometry type, and indexes come from the spec and load runs host `ogr2ogr` (GDAL 3.8+, `brew install gdal`). For `.sql`, load runs the dump via `psql` (Docker Postgres CLI) and then applies any indexes declared in the spec; the `import` block must be omitted.

### 4. Publish

Required for staging/production (skip only if the user asked for a local load only).

```bash
bun run data-schema-publish [-- --table <table>] [--mode override|snapshot]
```

Same `--table` prompt as load. S3 files and `--mode override|snapshot`: [`data-schema/README.md` What is on S3](../../../data-schema/README.md#what-is-on-s3). When `--mode` is omitted and the current dump is at least 1 day old, the CLI asks.

`--spec-only` uploads the spec without a dump (new recipe before load, or metadata edits: `provider`, `documentation`, `consumedBy`). Column/geometry changes need load + a full publish.

### 5. Import (follow-up)

Publish only puts the dump on S3. Each environment still needs **Import** so Postgres `data.<table>` updates. Admin UI, MCP, and processing afterwards: [`data-schema/README.md`](../../../data-schema/README.md). Hand over the table name. Skip Import only if the user asked for a local load only (no publish).
