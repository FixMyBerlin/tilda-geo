# data-schema/

Stage-1 inputs for Postgres `data.*` tables: a gitignored local mirror of S3 specs (and optional raw source files). Published dumps live only on S3 under the same `data-schema/` prefix — this folder never holds dumps.

Agent procedure: [`.cursor/skills/add-db-data-table/SKILL.md`](../.cursor/skills/add-db-data-table/SKILL.md). Every environment imports dumps via [`/admin/data-schema`](../app/src/routes/admin/data-schema.tsx).

## Per-table layout

```
data-schema/<table>/
  spec.json                 # synced from S3 sources/spec.json
  <table>.geojson|.gpkg     # exactly one source file (basename from spec.source.file)
```

Contents except this README and `.gitignore` are gitignored and synced from S3. Do not commit table folders.

## CLI (from `app/`)

```bash
# Pull specs from S3 (spec mirror on this machine)
bun run data-schema-sync
bun run data-schema-sync -- --table euvm_cutouts_point
bun run data-schema-sync -- --with-raw   # also download source files when present on S3

# Laptop only: load source file → local data.<table> (ENVIRONMENT=development)
# Creates schema `data` if missing. Specs use WKB geometry names (MultiPolygon);
# ogrinfo spaced names (Multi Polygon) are accepted.
bun run data-schema-load -- --table euvm_cutouts_point
bun run data-schema-load -- --table census_population_points --file /path/to/file.gpkg

# Laptop only: upload spec.json + pg_dump → S3 latest/
# --spec-only skips the dump (recipe-only). --with-source-file uploads the geojson/gpkg (opt-in; can be large).
# Inherits `large` from the previous latest/manifest when the local spec omits it.
# Always replaces latest/. Snapshot = extra copy of *this* dump under snapshots/<UTC>/.
# When latest/ is ≥1 day old and --mode is omitted, the CLI asks (override vs snapshot).
bun run data-schema-publish -- --table euvm_cutouts_point
bun run data-schema-publish -- --table euvm_cutouts_point --spec-only
bun run data-schema-publish -- --table euvm_cutouts_point --mode snapshot
```

After publish: Import on staging/production at `/admin/data-schema`. `data-schema-publish` overwrites `latest/` by default; `--mode snapshot` keeps an immutable copy of this dump under `snapshots/{UTC}/`.

## S3 layout (env-agnostic)

| Path                                        | Role                                 |
| ------------------------------------------- | ------------------------------------ |
| `data-schema/<table>/sources/spec.json`     | Stage-1 recipe                       |
| `data-schema/<table>/sources/<file>`        | Optional small raw delivery          |
| `data-schema/<table>/objects/<sha256>.dump` | Immutable dump (written first)       |
| `data-schema/<table>/latest/manifest.json`  | Pointer for latest (written second)  |
| `data-schema/<table>/latest/table.dump`     | Convenience copy of current dump     |
| `data-schema/<table>/snapshots/<UTC>/`      | Opt-in immutable copies              |

## Workflow

1. `data-schema-sync` (or draft a local `spec.json` and `data-schema-publish --spec-only`)
2. Place the source file beside the spec (or pass `--file`)
3. `data-schema-load` → verify counts on local DB
4. `data-schema-publish` → Import on `/admin/data-schema` (staging, then production)

Raw multi-GB files are never pulled by default; use `--file` or `--with-raw` deliberately. Map layers fed by processing update only after a processing rebuild.
