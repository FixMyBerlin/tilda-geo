# data-schema/

Gitignored local mirror of S3 specs, plus the source geojson/gpkg used by load (local dev computer only). Published dumps live only on S3 under the same `data-schema/` prefix — this folder never holds dumps. Do not commit table folders.

## Docs

- **Procedure** (new table, existing table, spec fields, Import): skill [`/add-db-data-table`](../.cursor/skills/add-db-data-table/SKILL.md)
- **CLI** (from `app/`): `bun run data-schema` for the overview, then `--help` on each script (`data-schema-verify`, `data-schema-pull`, `data-schema-load`, `data-schema-publish`)

## This folder

```
data-schema/
  <table>/
    spec.json              # pulled from S3 sources/spec.json (updatedAt stamped on publish)
    <table>.geojson|.gpkg  # local load input (basename from spec.source.file; not on S3)
```

Everything except this README and `.gitignore` is gitignored. Specs are pulled from S3; source files are not.

## S3 layout (env-agnostic)

| Path                                        | Role                                |
| ------------------------------------------- | ----------------------------------- |
| `data-schema/<table>/sources/spec.json`     | Stage-1 recipe                      |
| `data-schema/<table>/objects/<sha256>.dump` | Immutable dump (written first)      |
| `data-schema/<table>/latest/manifest.json`  | Pointer for latest (written second) |
| `data-schema/<table>/latest/table.dump`     | Convenience copy of current dump    |
| `data-schema/<table>/snapshots/<UTC>/`      | Archived previous latest versions   |

Older `sources/<file>` objects may still exist from earlier uploads; they are unused.
