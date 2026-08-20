# Reference data in Postgres

Processing SQL sometimes needs datasets that are not OpenStreetMap — a city’s extra geometries, an official layer, a one-off extract. Those tables live in Postgres as `data.<table>` on each environment (local, staging, production).

This is **not** how layers get onto the map. Map GeoJSON and tiles are static datasets. Use this when `processing/` should read from Postgres.

How to write the spec is in the [`add-db-data-table` skill](../.cursor/skills/add-db-data-table/SKILL.md). CLI commands run from `app/` (each has `--help`).

## Get data onto every environment

Each environment restores the same S3 `data.dump` into Postgres `data.<table>`. Two ways:

1. **Admin UI**: A user backend to list and import.
   - **Local**: [http://127.0.0.1:5173/admin/data-schema](http://127.0.0.1:5173/admin/data-schema) – Reminder: check [`app/README.md` Host binaries](../app/README.md#host-binaries-local-vs-server) about `pg_restore`.
   - **Staging**: [https://staging.tilda-geo.de/admin/data-schema](https://staging.tilda-geo.de/admin/data-schema)
   - **Production**: [https://tilda-geo.de/admin/data-schema](https://tilda-geo.de/admin/data-schema)
2. **MCP**: MCP calls to list and import. Call `env_info` first. Use `data_schema_list`, `data_schema_imports_list` and `data_schema_import`

If processing SQL reads this table for map layers, run processing afterwards to update the user facing data.

`bun run data-schema-pull` and `bun run seed` copy `spec.yaml` onto this machine. Postgres `data.*` is filled by Import (Admin UI or MCP) above.

## New or updated data

On your local machine:

1. Always `bun run data-schema-pull` so local `spec.yaml` matches S3.
2. Use skill [add-db-data-table](../.cursor/skills/add-db-data-table/SKILL.md) to write or update `data-schema/<table>/spec.yaml`.
3. Place the GeoJSON/GPKG next to `spec.yaml`.
4. Run `bun run data-schema-load` to import that source into local `data.<table>`.
5. Run `bun run data-schema-publish` to dump the local table and upload spec + dump to S3.
6. **Import** on each environment (Admin UI or MCP above) so that environment’s Postgres picks up the dump.

Specs and dumps are created on this machine. Staging and production Import the prepared data.

## This folder

Gitignored local mirror of specs, plus the source GeoJSON/GPKG used by load. Dumps never live here — they are only on S3. Do not commit table folders.

```
data-schema/<table>/spec.yaml              # pulled from S3
data-schema/<table>/*.geojson|.gpkg        # local load input (not on S3)
```

## What is on S3

Publish overwrites three current files per table. The dump is a `pg_dump` custom archive with gzip (`pg_restore` reads it; not a `.sql` file). Gzip, not zstd: Homebrew `libpq` cannot restore zstd — the flag is in [`pgDumpArchiveFlags.ts`](../app/src/server/dataSchema/pgDumpArchiveFlags.ts). Import downloads `data.dump` and checks it against the manifest `sha256`. `--mode snapshot` copies the current spec, dump, and manifest into `snapshots/<UTC>/` first, then overwrites the current files. Dump/restore majors: [Postgres major versions](#postgres-major-versions).

```
data-schema/<table>/spec.yaml
data-schema/<table>/data.dump
data-schema/<table>/data.manifest.json
data-schema/<table>/snapshots/<UTC>/spec.yaml
data-schema/<table>/snapshots/<UTC>/data.dump
data-schema/<table>/snapshots/<UTC>/data.manifest.json
```

The same prefix is used in every environment.

## Postgres major versions

Publish’s `pg_dump` and Import’s `pg_restore` must be the same major as the Postgres they talk to. `pg_dump` cannot dump a newer server than itself; `pg_restore` cannot read a dump newer than itself; a newer dump will not restore onto an older server. Nothing in CI checks this.

**Bump starts at the database image**, then the dump/restore clients. Local Postgres is [`docker-compose.yml`](../docker-compose.yml) (`ghcr.io/baosystems/postgis:17-3.5` today). Staging and production run their own Postgres (not this compose file) and must use the same major.

When that major changes:

1. Compose image — and the volume `db_postgres_17` (existing data does not open on a new major).
2. Staging and production Postgres.
3. `POSTGRES_CLI_IMAGE` in [`app/scripts/db-pull/db-helpers.ts`](../app/scripts/db-pull/db-helpers.ts) (`postgres:17-alpine`) — publish and db-pull `pg_dump`/`psql`.
4. Local Import: Homebrew `libpq` (`pg_restore` on PATH). See [`app/README.md` Host binaries](../app/README.md#host-binaries-local-vs-server).
5. Staging/production Import: [`app.Dockerfile`](../app.Dockerfile) `postgresql-client`. That is Debian’s default (17 on Trixie). A newer dump needs an explicit `postgresql-client-N` if the distro default is still behind.
6. Do not mix majors across environments. After `pg_dump` moves, republish; older dumps still restore on the new server if `pg_restore` is new enough.
