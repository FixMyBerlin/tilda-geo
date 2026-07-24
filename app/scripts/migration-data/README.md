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

## 6. After all environments

Run [`POST_MIGRATION_CLEANUP_PROMPT.md`](./POST_MIGRATION_CLEANUP_PROMPT.md) and remove this folder.
