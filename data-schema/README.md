# Reference data in Postgres

Processing SQL sometimes needs datasets that are not OpenStreetMap — a city’s extra geometries, an official layer, a one-off extract. Those tables live in Postgres as `data.<table>` on each environment (local, staging, production).

This is **not** how layers get onto the map. Map GeoJSON and tiles are static datasets. Use this when `processing/` should read from Postgres.

Commands below run from `app/` (`bun run data-schema` lists them; each script has `--help`). How to write the spec is in the [`add-db-data-table` skill](../.cursor/skills/add-db-data-table/SKILL.md) — this page is the overview.

## New table

On your local machine:

1. Write `data-schema/<table>/spec.json` (see the skill).
2. `bun run data-schema-load` reads the spec and source GeoJSON/GPKG into local `data.<table>`.
3. `bun run data-schema-publish` uploads the spec and a `pg_dump` of that table to S3.
4. Open `/admin/data-schema` and **Import** to drop `data.<table>` if it exists and restore the dump (that is also how you test the round-trip locally).

## Existing table

- **Staging / production:** On `/admin/data-schema`, click **Import** to replace the live table with the dump from S3 (no backup). If processing SQL reads this table for map layers, run processing afterwards.
- **Local machine:** `bun run data-schema-pull` for specs from S3; **Import** for dumps. `bun run seed` pulls specs (and ignores missing S3) but does not restore dumps.

To change the data: pull the spec, load the new source file, publish, then Import on each environment:

- [local](http://127.0.0.1:5173/admin/data-schema)
- [staging](https://staging.tilda-geo.de/admin/data-schema)
- [production](https://tilda-geo.de/admin/data-schema)

## This folder

Gitignored local mirror of specs, plus the source GeoJSON/GPKG used by load. Dumps never live here — they are only on S3. Do not commit table folders.

```
data-schema/<table>/spec.json             # pulled from S3
data-schema/<table>/<table>.geojson|.gpkg # local load input (not on S3)
```

Everything except this README and `.gitignore` is gitignored.

## What is on S3

Publish overwrites three current files per table. The dump is a `pg_dump` custom archive with zstd (`pg_restore` reads it; not a `.sql` file). Import downloads `data.dump` and checks it against the manifest `sha256`. `--mode snapshot` copies the current dump and manifest into `snapshots/<UTC>/` first, then overwrites the current files.

```
data-schema/<table>/spec.json
data-schema/<table>/data.dump
data-schema/<table>/data.manifest.json
data-schema/<table>/snapshots/<UTC>/data.dump
data-schema/<table>/snapshots/<UTC>/data.manifest.json
```

The same prefix is used in every environment.
