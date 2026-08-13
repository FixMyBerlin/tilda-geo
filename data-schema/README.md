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
# Pull specs from S3 (all tables, or one)
bun run data-schema sync
bun run data-schema sync -- --table euvm_cutouts_point
bun run data-schema sync -- --with-raw   # also download source files when present on S3

# Validate local spec and overwrite S3 sources/spec.json
bun run data-schema publish-spec -- --table euvm_cutouts_point
bun run data-schema publish-spec -- --table euvm_cutouts_point --with-raw

# Stage 1: ogr2ogr into local data.<table> (ENVIRONMENT=development)
# Creates schema `data` if missing. Specs use WKB geometry names (MultiPolygon);
# ogrinfo spaced names (Multi Polygon) are accepted.
bun run data-schema import-raw -- --table euvm_cutouts_point
bun run data-schema import-raw -- --table census_population_points --file /path/to/file.gpkg

# Stage 2: pg_dump custom format → S3 latest/ (optional --snapshot)
# Inherits `large` from the previous latest/manifest when the local spec omits it.
bun run data-schema publish -- --table euvm_cutouts_point
bun run data-schema publish -- --table euvm_cutouts_point --snapshot
```

After publish: Import on staging/production at `/admin/data-schema`. `publish` overwrites `latest/` by default; `--snapshot` keeps an immutable copy under `snapshots/{UTC}/`.

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

1. `sync` (or draft a local `spec.json` + `publish-spec`)
2. Place the source file beside the spec (or pass `--file`)
3. `import-raw` → verify counts on local DB
4. `publish` → Import on `/admin/data-schema` (staging, then production)

Raw multi-GB files are never pulled by default; use `--file` or `--with-raw` deliberately. Map layers fed by processing update only after a processing rebuild.
