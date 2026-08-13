# data-schema/

Stage-1 inputs for Postgres `data.*` tables: a gitignored local mirror of S3 specs, plus the source geojson/gpkg used by load (local dev computer only). Published dumps live only on S3 under the same `data-schema/` prefix — this folder never holds dumps.

Agent procedure: [`.cursor/skills/add-db-data-table/SKILL.md`](../.cursor/skills/add-db-data-table/SKILL.md). Every environment imports dumps via [`/admin/data-schema`](../app/src/routes/admin/data-schema.tsx). How to obtain or generate a source file lives in `spec.source.documentation` (shown in admin).

## Per-table layout

```
data-schema/<table>/
  spec.json                 # synced from S3 sources/spec.json
  <table>.geojson|.gpkg     # local load input (basename from spec.source.file; not on S3)
```

Contents except this README and `.gitignore` are gitignored. Specs sync from S3; source files do not. Do not commit table folders.

## CLI (from `app/`)

```bash
# Validate local spec.json (no DB, no S3)
bun run data-schema-verify
bun run data-schema-verify -- --table euvm_cutouts_point

# Pull specs from S3 (spec mirror on this machine)
bun run data-schema-sync
bun run data-schema-sync -- --table euvm_cutouts_point

# Local dev computer only: load source file → local data.<table> (ENVIRONMENT=development)
# Host GDAL 3.8+ (`brew install gdal`). Creates schema `data` if missing.
# Specs use WKB geometry names (MultiPolygon); ogrinfo spaced names (Multi Polygon) are accepted.
bun run data-schema-load -- --table euvm_cutouts_point
bun run data-schema-load -- --table census_population_points --file /path/to/file.gpkg

# Local dev computer only: upload spec.json + pg_dump → S3 latest/
# --spec-only skips the dump (metadata/recipe only). Source geojson/gpkg is not uploaded.
# Always replaces latest/. --mode snapshot archives the current latest/ first, then writes the new dump.
# When latest/ is ≥1 day old and --mode is omitted, the CLI asks (archive previous vs override).
bun run data-schema-publish -- --table euvm_cutouts_point
bun run data-schema-publish -- --table euvm_cutouts_point --spec-only
bun run data-schema-publish -- --table euvm_cutouts_point --mode snapshot
```

After publish: Import on staging/production at `/admin/data-schema`. `data-schema-publish` overwrites `latest/` by default; `--mode snapshot` keeps the previous latest under `snapshots/{when it was published}/`.

## S3 layout (env-agnostic)

| Path                                        | Role                                |
| ------------------------------------------- | ----------------------------------- |
| `data-schema/<table>/sources/spec.json`     | Stage-1 recipe                      |
| `data-schema/<table>/objects/<sha256>.dump` | Immutable dump (written first)      |
| `data-schema/<table>/latest/manifest.json`  | Pointer for latest (written second) |
| `data-schema/<table>/latest/table.dump`     | Convenience copy of current dump    |
| `data-schema/<table>/snapshots/<UTC>/`      | Archived previous latest versions   |

Older `sources/<file>` objects may still exist from earlier uploads; they are unused.

## Workflow

1. Write `data-schema/<table>/spec.json` (or `data-schema-sync` for an existing table)
2. `data-schema-verify` + `bun run format:data-schema`
3. Place the source file beside the spec (or pass `--file`) and `data-schema-load`
4. `data-schema-publish` → Import on `/admin/data-schema` (local optional dump check, then staging, then production)

Map layers fed by processing update only after a processing rebuild.
