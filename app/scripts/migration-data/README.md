# Runbook: regions + region contracts DB migration

One-time cutover into PostgreSQL. Order: schema (truncates uploads) → **data import** → **StaticDatasets** → **masks** → smoke. When all envs are done, run [`POST_MIGRATION_CLEANUP_PROMPT.md`](./POST_MIGRATION_CLEANUP_PROMPT.md).

Do not serve the new app until StaticDatasets (+ masks) finish — the map has no static datasets in between.

---

## 1. Schema migrations

Applies region/contract tables and **`TRUNCATE MapDatasetUpload`** (`20260606000000_map_datasets`). Uploads are empty until step 3.

### DEV

```bash
cd app
bun run migrate
bun run prisma generate
```

### STG / PRD

Deploy the app image — container start runs `bunx prisma migrate deploy`. Optional check:

```bash
cd /srv
docker compose run --rm --no-deps --entrypoint bunx app prisma migrate status
```

Never use `bun run migrate` (`prisma migrate dev`) against staging/prod.

---

## 2. Data import (regions, templates, contracts, verify)

Runs steps 01–04 in order: regions (+ logos) → config templates → contracts → verify. Regions must exist before StaticDatasets.

Individual `migration-data:0N-*` scripts remain for re-runs; prefer the parent for cutover.

### DEV

```bash
cd app
bun --env-file=../.env --env-file=../.env.local run migration-data
```

### STG / PRD

SSH host, then from `/srv` (Compose injects env from `/srv/.env` — no `--env-file`):

```bash
cd /srv
docker compose run --rm --no-deps --entrypoint bun app run migration-data
```

---

## 3. StaticDatasets (recreate uploads)

Required after the truncate. Full run only (no `--folder-filter`). Needs local `tilda-static-data` + tippecanoe + Atlas API key for the target env. App API must be up.

Always run from your **laptop** `app/` — not inside the staging/prod container.

### DEV

```bash
cd app
bun run static-datasets-update -- --env=dev
```

### STG / PRD

Still from your laptop, targeting the deployed API:

```bash
cd app
bun run static-datasets-update -- --env=staging
# or
bun run static-datasets-update -- --env=production
```

Uses `ATLAS_API_KEY_STAGING` / `ATLAS_API_KEY_PRODUCTION` from root `.env`. See [`../StaticDatasets/README.md`](../StaticDatasets/README.md).

---

## 4. Region masks

Creates mask `MapDatasetUpload` + S3 GeoJSON from region mask config. Run **after** StaticDatasets. Needs geo DB `boundaries` + S3.

### DEV

```bash
cd app
bun --env-file=../.env --env-file=../.env.local run migration-data-masks
```

### STG / PRD

```bash
cd /srv
docker compose run --rm --no-deps --entrypoint bun app run migration-data-masks
```

---

## 5. Smoke check

Confirm counts and UI. Expect Brandenburg regions `bb-beteiligung`, `bb-kampagne`, `bb-pg`, `bb-sg`. After step 3, `MapDatasetUpload` count ≫ 0.

### DEV

```bash
cd app
bun --env-file=../.env prisma db execute --stdin <<< 'SELECT COUNT(*) FROM prisma."Region";'
bun --env-file=../.env prisma db execute --stdin <<< 'SELECT COUNT(*) FROM prisma."RegionContract";'
bun --env-file=../.env prisma db execute --stdin <<< 'SELECT count(*) FROM prisma."MapDatasetUpload";'
bun --env-file=../.env --env-file=../.env.local run migration-data:04-verify-contracts
```

### STG / PRD

```bash
cd /srv
docker compose run --rm --no-deps --entrypoint bun app run migration-data:04-verify-contracts
echo 'SELECT COUNT(*) FROM prisma."Region";' | docker compose run --rm --no-deps --entrypoint bunx app prisma db execute --stdin
echo 'SELECT count(*) FROM prisma."MapDatasetUpload";' | docker compose run --rm --no-deps --entrypoint bunx app prisma db execute --stdin
```

Also open `/admin/regions`, `/admin/region-contracts`, `/admin/map-dataset-uploads`, `/regionen`.

---

## 6. Campaign stats backfill (`todos_lines_campaign_stats`)

`/api/campaigns` used to count TODOs live (68 queries on `public.todos_lines` per request); on 2026-07-30 that collided with osm2pgsql rebuilding the table and blocked processing for ~34 minutes. Counts are now precomputed each run into `public.todos_lines_campaign_stats` by the `campaign_counts` afterthought — run this once per environment right after that release so radinfra.de does not show zeros until the next nightly run (later runs overwrite the row; re-running is safe). Counts every key in `todos_lines.tags` (not filtered to known campaign ids); extras are ignored by `/api/campaigns`.

SQL lives in:

- [`06-backfill-campaign-stats.sql`](./06-backfill-campaign-stats.sql) — create table if needed + upsert
- [`06-backfill-campaign-stats.verify.sql`](./06-backfill-campaign-stats.verify.sql) — latest row + `todo_count`

Needs `public.meta`, `public.todos_lines`, and `public.boundaries`. Without todo/boundary data the insert still succeeds with `{}` or totals with empty `byState` (no `admin_level=4` boundaries in a tiny local bbox).

### DEV

From **repo root** (not `app/`). Local Compose DB is `postgres` / `postgres` — do **not** `source .env` (values can break the shell) and do **not** use production credentials (`devteam` / `maindb`).

```bash
cd /path/to/tilda-geo   # repo root
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < app/scripts/migration-data/06-backfill-campaign-stats.sql
docker compose exec -T db psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
  < app/scripts/migration-data/06-backfill-campaign-stats.verify.sql
```

Expect `INSERT 0 1` and a verify row with `todo_count` ≥ 0. With local processing data, `todo_count` is often a handful of keys; `byState` may be `[]` if no Land boundaries are loaded.

With the app running: `http://localhost:4000/api/campaigns` should show non-zero `count.total` for campaigns that match those keys.

### STG / PRD

Run **on the remote host** after SSH (`tilda-staging` / `tilda-production`) — not against your laptop Compose `db`. Confirm user/db in `/srv/.env` (production: `devteam` / `maindb`). Copy the SQL up or paste from the repo; takes ~10s on full Germany.

```bash
ssh tilda-production
# from a checkout on the host, or paste the file contents:
docker exec -i db psql -U devteam -d maindb -v ON_ERROR_STOP=1 \
  < /path/to/tilda-geo/app/scripts/migration-data/06-backfill-campaign-stats.sql
docker exec -i db psql -U devteam -d maindb -v ON_ERROR_STOP=1 \
  < /path/to/tilda-geo/app/scripts/migration-data/06-backfill-campaign-stats.verify.sql
```

Without a checkout on the host, `cat` / paste the SQL into `docker exec -i db psql -U devteam -d maindb -v ON_ERROR_STOP=1`.

Check `https://tilda-geo.de/api/campaigns` (or staging) returns non-zero counts.

---

## 7. After all environments

Run [`POST_MIGRATION_CLEANUP_PROMPT.md`](./POST_MIGRATION_CLEANUP_PROMPT.md) and remove this folder.
