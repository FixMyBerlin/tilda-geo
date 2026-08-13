---
name: add-db-data-table
description: Add or update a Postgres data.* table via data-schema (spec, data-schema-load, data-schema-publish dump, admin Import). Use when processing SQL needs data inside Postgres; not for map tiles/GeoJSON StaticDatasets.
---

# Add DB data table (`data.*`)

## When to use

- **Use** for datasets that `processing/` SQL reads from Postgres `data.*`.
- **Do not use** for map tiles / GeoJSON served to the map — use [add-static-dataset](../add-static-dataset/SKILL.md) instead.

## Boundary

1. **Laptop (stage 1):** raw file → local `data.<table>` via `data-schema-load`.
2. **Publish (stage 2):** `data-schema-publish` (`pg_dump -Fc` → S3 `data-schema/<table>/latest/`).
3. Staging / production / fresh dev **only** import the published dump via `/admin/data-schema`. `data-schema-sync` only mirrors specs (and optionally source files), including on servers — it does not load `data.*`.

`data.*` reaches map layers only after processing rebuilds `public.*`.

## Layout

Repo-root `data-schema/<table>/`: `spec.json` + exactly one source file named after the table (both gitignored). Specs on S3: `data-schema/<table>/sources/spec.json`.

## Spec example

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

Polygon variant: same shape with `table` / `source.file` / index name `euvm_cutouts_polygon*`, `expectedGeometryType: "MultiPolygon"` (or `Polygon`). Specs use WKB-style names (`MultiPolygon`, `LineString`); `data-schema-load` normalises ogrinfo’s spaced forms (`Multi Polygon`, `3D Point`, …) before comparing. Seed specs with `data-schema-publish --spec-only` (they are gitignored).

## Commands (from `app/`)

```bash
bun run data-schema-sync
bun run data-schema-publish -- --table <table> --spec-only
bun run data-schema-load -- --table <table> [--file /abs/path]
bun run data-schema-publish -- --table <table> [--mode override|snapshot]
```

Then **Import** on `/admin/data-schema` (staging, then production).

`data-schema-publish` overwrites `latest/` by default; `--mode snapshot` is the opt-in immutable copy of this publish (no version folder per upload). When `latest/` is at least 1 day old and `--mode` is omitted, the laptop CLI asks override vs snapshot.

## Verify

- `bun run type-check-deploy`
- Confirm the SQL path in `spec.consumedBy` still references `data.<table>`

## Operational notes

- **Fresh databases:** Both `data-schema-load` (stage 1) and admin Import call `CREATE SCHEMA IF NOT EXISTS data` before writing tables. Published dumps from `pg_dump --table=data.*` do not include `CREATE SCHEMA`, so a machine that has never run `processing/` can still bootstrap `data.*` from S3 alone (or from `data-schema-load` after Prisma migrations only).
- **`large` on republish:** CLI `data-schema-publish` and server republish inherit `large` from the existing `latest/manifest.json` when the local spec omits it (or there is no local spec). Default `false` only when there is no previous manifest — so a multi-GB opt-in table is not silently cleared.
- **Publish order:** dump goes to `objects/<sha256>.dump` first, then `latest/manifest.json` (the pointer), then a convenience copy at `latest/table.dump`. Import prefers the object dump so a failed pointer update cannot pair a new dump with an old sha256.
- **Process death mid-import:** a container restart during restore can leave `data.<table>_…__old` and a history row stuck in `RUNNING`. The next Import detects an existing aside and refuses to proceed until it is restored or dropped manually.
- **Concurrent Import:** an advisory lock per table returns a clear “Import läuft bereits” error instead of racing.
- **Rename vs readers:** `renameTableAside` sets `lock_timeout=5s` so an `ACCESS EXCLUSIVE` rename fails fast if nightly processing (or another reader) holds the table — safe failure, retry after processing finishes.
- **Large tables:** data-schema DB work uses a client without the geo `statement_timeout=60s`, so `COUNT(*)` on multi-million-row tables is not cancelled mid-import.
