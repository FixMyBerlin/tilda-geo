# Parking cutouts import

Load external parking-cutout GeoJSON into `data.*` tables (e.g. `data.euvm_cutouts_point`, `data.euvm_cutouts_polygon`), verify row counts, and export a production SQL file (`TRUNCATE` + `INSERT`s) under `data/` (gitignored).

**Requires:** `ogr2ogr`, `ogrinfo`, Docker, `ENVIRONMENT=development`, DB env vars from repo `.env`.

With `--file` and `--table` in a TTY, the CLI prompts to replace when the table already exists (`--replace` / `-y` skip the prompt). In non-interactive mode, pass `--replace` or `--create` explicitly.

## eUVM point layer

```bash
cd app
bun --env-file=../.env ./scripts/parking-cutouts-import/index.ts \
  --file ~/Downloads/drive-download-20260602T083803Z-3-001/euvm_cutouts_point.geojson \
  --table euvm_cutouts_point \
  --replace
```

## eUVM polygon layer

```bash
cd app
bun --env-file=../.env ./scripts/parking-cutouts-import/index.ts \
  --file ~/Downloads/drive-download-20260602T083803Z-3-001/euvm_cutouts_polygon.geojson \
  --table euvm_cutouts_polygon \
  --replace
```

SQL output: `app/scripts/parking-cutouts-import/data/<table>.sql` (psql-only meta-commands from `pg_dump` 17 are stripped for DBeaver and similar clients).
