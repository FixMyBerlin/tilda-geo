# Environment variables and secrets

## Deployment model

- Canonical deploy definitions: [`env/deploy.manifest.json`](./env/deploy.manifest.json).
- [`workflows/setup-env.yml`](./workflows/setup-env.yml) runs [`scripts/verify-env-manifest.ts`](./scripts/verify-env-manifest.ts) and [`scripts/generate-deploy-env.ts`](./scripts/generate-deploy-env.ts), producing `.env.deploy.generated` for upload.
- On the host, that file becomes `/srv/.env` after rename. If SSH users in the `docker` group need `docker compose` (Compose reads `.env`), set permissions on the server (for example `chgrp docker` and `chmod 640`, or `chown root:docker` with `sudo`); see **Operations (SSH)**.
- [`scripts/generate-github-readme.ts`](./scripts/generate-github-readme.ts) refreshes the mapping table below from the manifest.

## When checks run

- **CI:** [`.github/workflows/ci.yml`](./workflows/ci.yml) — manifest verification and related checks on every PR.
- **Deploy:** [`setup-env.yml`](./workflows/setup-env.yml) — same verification plus generated `.env` for the target environment.
- **Local (`app/`):** `bun run env-check` after changing the manifest, `.env.example`, or compose / workflow env wiring ([`app/package.json`](../app/package.json) `env-check:*`).

## Consistency / drift

- Manifest defines deploy variables (`name`, source, required/default, description).
- CI fails if manifest keys are missing from `.env.example` or `docker-compose.yml`, or if unmanaged keys appear in compose or setup-env mappings.
- The generated table in this file must match the manifest (regenerate with `bun .github/scripts/generate-github-readme.ts` when needed).
- Deploy generation fails if a required GitHub var/secret is missing for the selected environment.
- Some `.env.example` entries are local-only (e.g. `DATABASE_URL_*` for `app/scripts/db-pull`); they stay out of the manifest and setup-env mappings.

## Security

- Generated deploy env is not committed; production values live in GitHub Environments / Secrets.
- `/srv/.env`: restrict on the host as needed (not world-readable); see deployment model and **Operations (SSH)**.
- Prefer runtime env over Docker build args for secrets.
- Prefer AWS OIDC over long-lived access keys where applicable.

## Operations (SSH)

- `cd /srv && docker compose logs app -f` — needs readable `/srv/.env` (above permissions).
- `docker logs -f app` — container logs only; does not read `/srv/.env`.

## Source mapping (generated)

<!-- GENERATED_ENV_TABLE_START -->
<!-- This block is GENERATED. Edit .github/env/deploy.manifest.json and run `bun .github/scripts/generate-github-readme.ts`. -->
| Name | Source | Required | Description |
| --- | --- | --- | --- |
| `ENVIRONMENT` | `inputs.ENVIRONMENT` | yes | Deployment target environment (staging\|production). |
| `DATABASE_HOST` | `vars.DATABASE_HOST` | yes | Database host used by app/processing and PG client variables. |
| `DATABASE_USER` | `secrets.DATABASE_USER` | yes | Database username. Sensitive. |
| `DATABASE_PASSWORD` | `secrets.DATABASE_PASSWORD` | yes | Database password. Sensitive. |
| `DATABASE_NAME` | `secrets.DATABASE_NAME` | yes | Database name. |
| `PROCESS_GEOFABRIK_DOWNLOAD_URL` | `vars.PROCESS_GEOFABRIK_DOWNLOAD_URL` | yes | PBF download URL (internal/public Geofabrik extract). |
| `PROCESS_GEOFABRIK_OAUTH_OSM_USERNAME` | `secrets.PROCESS_GEOFABRIK_OAUTH_OSM_USERNAME` | no | Optional Geofabrik OAuth username. Sensitive. |
| `PROCESS_GEOFABRIK_OAUTH_OSM_PASSWORD` | `secrets.PROCESS_GEOFABRIK_OAUTH_OSM_PASSWORD` | no | Optional Geofabrik OAuth password. Sensitive. |
| `TILES_URL` | `vars.TILES_URL` | yes | Public tile endpoint hostname. |
| `CACHELESS_URL` | `vars.CACHELESS_URL` | yes | Cacheless tile endpoint hostname. |
| `VITE_APP_ORIGIN` | `vars.VITE_APP_ORIGIN` | yes | Public app origin. |
| `VITE_APP_ENV` | `vars.VITE_APP_ENV` | yes | App environment for client/server behavior. |
| `APP_URL` | `vars.APP_URL` | yes | Main app hostname used by Traefik labels. |
| `SESSION_SECRET_KEY` | `secrets.SESSION_SECRET_KEY` | yes | Session signing secret. Sensitive. |
| `OSM_CLIENT_ID` | `secrets.OSM_CLIENT_ID` | yes | OSM OAuth client ID. Sensitive. |
| `OSM_CLIENT_SECRET` | `secrets.OSM_CLIENT_SECRET` | yes | OSM OAuth client secret. Sensitive. |
| `S3_KEY` | `secrets.S3_KEY` | yes | S3 access key. Sensitive. |
| `S3_SECRET` | `secrets.S3_SECRET` | yes | S3 secret key. Sensitive. |
| `S3_REGION` | `secrets.S3_REGION` | yes | S3 region. |
| `S3_BUCKET` | `secrets.S3_BUCKET` | yes | S3 bucket used by app/scripts. |
| `ATLAS_API_KEY` | `secrets.ATLAS_API_KEY` | yes | Internal atlas API key. Sensitive. |
| `MAPROULETTE_API_KEY` | `secrets.MAPROULETTE_API_KEY` | yes | MapRoulette API key. Sensitive. |
| `BREVO_API_KEY` | `secrets.BREVO_API_KEY` | yes | Brevo API key for transactional email delivery. Sensitive. |
| `SKIP_DOWNLOAD` | `vars.SKIP_DOWNLOAD` | no | Processing flag (default 1). Default: `1`. |
| `SKIP_UNCHANGED` | `vars.SKIP_UNCHANGED` | no | Processing flag (default 0). Default: `0`. |
| `PROCESSING_DIFFING_MODE` | `vars.PROCESSING_DIFFING_MODE` | yes | Diffing mode for processing. |
| `PROCESSING_DIFFING_BBOX` | `vars.PROCESSING_DIFFING_BBOX` | yes | Diffing bbox for processing. |
| `ECR_REGISTRY` | `vars.ECR_REGISTRY` | yes | Private ECR registry URL used by docker-compose to pull images. |
| `PROCESSING_STAGING_DATABASE_URL` | `secrets.PROCESSING_STAGING_DATABASE_URL` | no | Red/green: writable secondary DB the staging build targets. Sensitive. |
| `PROMOTION_PRIMARY_DATABASE_URL` | `secrets.PROMOTION_PRIMARY_DATABASE_URL` | no | Red/green: fixed primary DB that receives promoted geo tables via FDW. Sensitive. |
| `PROMOTION_TABLES_ALLOWLIST` | `vars.PROMOTION_TABLES_ALLOWLIST` | no | Red/green: optional comma-separated promote allowlist (empty = auto-discover public tables). |
| `PROMOTION_ROW_COUNT_TOLERANCE` | `vars.PROMOTION_ROW_COUNT_TOLERANCE` | no | Red/green: max relative row-count delta vs primary before promotion (0.15 = 15%). Default: `0.15`. |
| `WORKING_PBF_PATH` | `vars.WORKING_PBF_PATH` | no | Red/green: Geofabrik baseline PBF reseeded nightly and caught up intra-day. |
| `RECUT_PBF_PATH` | `vars.RECUT_PBF_PATH` | no | Red/green: output path for the Germany recut extract. |
| `RECUT_POLYGON_PATH` | `vars.RECUT_POLYGON_PATH` | no | Red/green: clip polygon for osmium extract (preferred over RECUT_BBOX in production). |
| `RECUT_POLYGON_DOWNLOAD_URL` | `vars.RECUT_POLYGON_DOWNLOAD_URL` | no | Red/green: URL to bootstrap RECUT_POLYGON_PATH from when missing (e.g. germany.poly). |
| `RECUT_BBOX` | `vars.RECUT_BBOX` | no | Red/green: bbox recut fallback when RECUT_POLYGON_PATH is unset (dev/smoke). |
| `REPLICATION_SERVER_URL` | `vars.REPLICATION_SERVER_URL` | no | Red/green: intra-day replication feed (planet hourly or OSM-fr Germany). |
| `REPLICATION_LOOP_SLEEP_SECONDS` | `vars.REPLICATION_LOOP_SLEEP_SECONDS` | no | Red/green: sleep between pyosmium catch-up retries. Default: `60`. |
| `RED_GREEN_VERIFY_ENDPOINTS` | `vars.RED_GREEN_VERIFY_ENDPOINTS` | no | Red/green: comma-separated health URLs probed before/after promotion (mandatory at runtime). |
| `RED_GREEN_VERIFY_INTERVAL_MS` | `vars.RED_GREEN_VERIFY_INTERVAL_MS` | no | Red/green: verifier polling interval. Default: `5000`. |
| `RED_GREEN_MAX_FAILURE_STREAK` | `vars.RED_GREEN_MAX_FAILURE_STREAK` | no | Red/green: max tolerated consecutive failed probes before the run fails. Default: `3`. |
| `RED_GREEN_RESEED_UTC_HOUR` | `vars.RED_GREEN_RESEED_UTC_HOUR` | no | Red/green: UTC hour for the nightly Geofabrik reseed. Default: `0`. |
| `RED_GREEN_FORCE_RESEED` | `vars.RED_GREEN_FORCE_RESEED` | no | Red/green: set to 1 to force a Geofabrik reseed on the next run. |
| `RED_GREEN_LOCK_TTL_SECONDS` | `vars.RED_GREEN_LOCK_TTL_SECONDS` | no | Red/green: a lock older than this is treated as stale and broken (crash recovery). Default: `14400`. |
| `RED_GREEN_DELTA_WARM_ENDPOINT` | `vars.RED_GREEN_DELTA_WARM_ENDPOINT` | no | Red/green: private endpoint for delta warm-cache when WARM_CACHE_MODE=delta. |
| `WARM_CACHE_MODE` | `vars.WARM_CACHE_MODE` | no | Red/green: 'full' (default) or 'delta' warm-cache after promotion. Default: `full`. |
<!-- GENERATED_ENV_TABLE_END -->


