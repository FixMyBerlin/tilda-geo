# Environment variables and secrets

## Deployment model

- Canonical deploy definitions: [`env/deploy.manifest.json`](./env/deploy.manifest.json).
- [`workflows/setup-env.yml`](./workflows/setup-env.yml) runs [`scripts/verify-env-manifest.ts`](./scripts/verify-env-manifest.ts) and [`scripts/generate-deploy-env.ts`](./scripts/generate-deploy-env.ts), producing `.env.deploy.generated` for upload.
- On the host, that file becomes `/srv/.env` with group **`docker`** and mode **`640`** (`chgrp docker`, `chmod 640`) so members of `docker` can run `docker compose` (Compose reads `.env` for interpolation). The deploy SSH user must be in the **`docker`** group so `chgrp` succeeds without `sudo` (non-interactive SSH cannot prompt for a password).
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
- `/srv/.env`: group-readable for `docker`, not world-readable; see deployment step above.
- Prefer runtime env over Docker build args for secrets.
- Prefer AWS OIDC over long-lived access keys where applicable.

## Operations (SSH)

- `cd /srv && docker compose logs app -f` — needs readable `/srv/.env` (above permissions).
- `docker logs -f app` — container logs only; does not read `/srv/.env`.

## Source mapping (generated)

<!-- GENERATED_ENV_TABLE_START -->
<!-- This block is GENERATED. Edit .github/env/deploy.manifest.json and run `bun .github/scripts/generate-github-readme.ts`. -->

| Name                                   | Source                                         | Required | Description                                                     |
| -------------------------------------- | ---------------------------------------------- | -------- | --------------------------------------------------------------- |
| `ENVIRONMENT`                          | `inputs.ENVIRONMENT`                           | yes      | Deployment target environment (staging\|production).            |
| `DATABASE_HOST`                        | `vars.DATABASE_HOST`                           | yes      | Database host used by app/processing and PG client variables.   |
| `DATABASE_USER`                        | `secrets.DATABASE_USER`                        | yes      | Database username. Sensitive.                                   |
| `DATABASE_PASSWORD`                    | `secrets.DATABASE_PASSWORD`                    | yes      | Database password. Sensitive.                                   |
| `DATABASE_NAME`                        | `secrets.DATABASE_NAME`                        | yes      | Database name.                                                  |
| `PROCESS_GEOFABRIK_DOWNLOAD_URL`       | `vars.PROCESS_GEOFABRIK_DOWNLOAD_URL`          | yes      | PBF download URL (internal/public Geofabrik extract).           |
| `PROCESS_GEOFABRIK_OAUTH_OSM_USERNAME` | `secrets.PROCESS_GEOFABRIK_OAUTH_OSM_USERNAME` | no       | Optional Geofabrik OAuth username. Sensitive.                   |
| `PROCESS_GEOFABRIK_OAUTH_OSM_PASSWORD` | `secrets.PROCESS_GEOFABRIK_OAUTH_OSM_PASSWORD` | no       | Optional Geofabrik OAuth password. Sensitive.                   |
| `TILES_URL`                            | `vars.TILES_URL`                               | yes      | Public tile endpoint hostname.                                  |
| `CACHELESS_URL`                        | `vars.CACHELESS_URL`                           | yes      | Cacheless tile endpoint hostname.                               |
| `VITE_APP_ORIGIN`                      | `vars.VITE_APP_ORIGIN`                         | yes      | Public app origin.                                              |
| `VITE_APP_ENV`                         | `vars.VITE_APP_ENV`                            | yes      | App environment for client/server behavior.                     |
| `APP_URL`                              | `vars.APP_URL`                                 | yes      | Main app hostname used by Traefik labels.                       |
| `SESSION_SECRET_KEY`                   | `secrets.SESSION_SECRET_KEY`                   | yes      | Session signing secret. Sensitive.                              |
| `OSM_CLIENT_ID`                        | `secrets.OSM_CLIENT_ID`                        | yes      | OSM OAuth client ID. Sensitive.                                 |
| `OSM_CLIENT_SECRET`                    | `secrets.OSM_CLIENT_SECRET`                    | yes      | OSM OAuth client secret. Sensitive.                             |
| `S3_KEY`                               | `secrets.S3_KEY`                               | yes      | S3 access key. Sensitive.                                       |
| `S3_SECRET`                            | `secrets.S3_SECRET`                            | yes      | S3 secret key. Sensitive.                                       |
| `S3_REGION`                            | `secrets.S3_REGION`                            | yes      | S3 region.                                                      |
| `S3_BUCKET`                            | `secrets.S3_BUCKET`                            | yes      | S3 bucket used by app/scripts.                                  |
| `ATLAS_API_KEY`                        | `secrets.ATLAS_API_KEY`                        | yes      | Internal atlas API key. Sensitive.                              |
| `MAPROULETTE_API_KEY`                  | `secrets.MAPROULETTE_API_KEY`                  | yes      | MapRoulette API key. Sensitive.                                 |
| `MAILJET_APIKEY_PUBLIC`                | `secrets.MAILJET_APIKEY_PUBLIC`                | no       | Optional Mailjet public key. Sensitive.                         |
| `MAILJET_APIKEY_PRIVATE`               | `secrets.MAILJET_APIKEY_PRIVATE`               | no       | Optional Mailjet private key. Sensitive.                        |
| `SKIP_DOWNLOAD`                        | `vars.SKIP_DOWNLOAD`                           | no       | Processing flag (default 1). Default: `1`.                      |
| `SKIP_UNCHANGED`                       | `vars.SKIP_UNCHANGED`                          | no       | Processing flag (default 0). Default: `0`.                      |
| `PROCESSING_DIFFING_MODE`              | `vars.PROCESSING_DIFFING_MODE`                 | yes      | Diffing mode for processing.                                    |
| `PROCESSING_DIFFING_BBOX`              | `vars.PROCESSING_DIFFING_BBOX`                 | yes      | Diffing bbox for processing.                                    |
| `ECR_REGISTRY`                         | `vars.ECR_REGISTRY`                            | yes      | Private ECR registry URL used by docker-compose to pull images. |

<!-- GENERATED_ENV_TABLE_END -->
