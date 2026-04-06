# Environment variables and secrets

## Deployment model

- Deploy env values are defined once in [`env/deploy.manifest.json`](./env/deploy.manifest.json).
- [`workflows/setup-env.yml`](./workflows/setup-env.yml) validates the manifest and generates `.env.deploy.generated` with [`scripts/generate-deploy-env.ts`](./scripts/generate-deploy-env.ts).
- The generated file is copied to the server and renamed to `/srv/.env` (`chmod 600`).
- We do not use `sed` replacement for `.env` generation anymore.
- [`scripts/verify-env-manifest.ts`](./scripts/verify-env-manifest.ts) checks that deploy keys are present where needed and that stale unmanaged keys are not left behind.
- [`scripts/generate-github-readme.ts`](./scripts/generate-github-readme.ts) regenerates the table below from the manifest.

## When checks run

- **Local dev trigger:** `app` `predev` runs `bun run env-check` before starting the app.
- **Local manual commands:** `bun run env-check:verify-manifest`, `bun run env-check:docs:1sync`, `bun run env-check`.
- **CI trigger:** `.github/workflows/ci.yml` validates manifest consistency and generated docs on every PR.
- **Deploy trigger:** `.github/workflows/setup-env.yml` validates and generates the deploy `.env` for the selected environment.

## Consistency guarantees

- **Single source of truth:** The manifest defines each deploy variable (`name`, source, required/default, description).
- **Drift checks in CI:** `Check PR` fails if manifest keys are missing from `.env.example` or from `docker-compose.yml`.
- **No stale leftovers:** checks also fail when unmanaged env keys are found in `docker-compose.yml` or setup workflow mappings.
- **Generated docs:** the variable table in this README is generated from manifest data; if stale, CI fails.
- **Runtime required checks:** deploy generation fails fast when required GitHub vars/secrets are missing in the selected environment.

## Security properties

- Secrets stay in GitHub Secrets and are never committed to the repository.
- Generated deploy env file is temporary and copied to server as `/srv/.env` with restrictive file mode.
- No shell replacement logic (`sed`) means no silent partial substitution.
- `.env.example` only contains placeholders for sensitive values.

## Failure examples and reporting

- **If a required variable is removed from `.env.example`:** `verify-env-manifest.ts` fails in CI with a clear “Missing in .env.example” list.
- **If a manifest variable is removed from `docker-compose.yml` references:** `verify-env-manifest.ts` fails in CI with “Missing in docker-compose.yml” list.
- **If a stale variable remains in `docker-compose.yml` or workflow source mappings:** `verify-env-manifest.ts` fails with “Unmanaged vars/mappings” output.
- **If a required GitHub environment variable/secret is absent:** `generate-deploy-env.ts` fails the deployment workflow with the missing source name.

## Source mapping (generated)

<!-- GENERATED_ENV_TABLE_START -->
<!-- This block is GENERATED. Edit .github/env/deploy.manifest.json and run `bun .github/scripts/generate-github-readme.ts`. -->

| Name                                   | Source                                         | Required | Description                                                   |
| -------------------------------------- | ---------------------------------------------- | -------- | ------------------------------------------------------------- |
| `ENVIRONMENT`                          | `inputs.ENVIRONMENT`                           | yes      | Deployment target environment (staging\|production).          |
| `DATABASE_HOST`                        | `vars.DATABASE_HOST`                           | yes      | Database host used by app/processing and PG client variables. |
| `DATABASE_USER`                        | `secrets.DATABASE_USER`                        | yes      | Database username. Sensitive.                                 |
| `DATABASE_PASSWORD`                    | `secrets.DATABASE_PASSWORD`                    | yes      | Database password. Sensitive.                                 |
| `DATABASE_NAME`                        | `secrets.DATABASE_NAME`                        | yes      | Database name.                                                |
| `PROCESS_GEOFABRIK_DOWNLOAD_URL`       | `vars.PROCESS_GEOFABRIK_DOWNLOAD_URL`          | yes      | PBF download URL (internal/public Geofabrik extract).         |
| `PROCESS_GEOFABRIK_OAUTH_OSM_USERNAME` | `secrets.PROCESS_GEOFABRIK_OAUTH_OSM_USERNAME` | no       | Optional Geofabrik OAuth username. Sensitive.                 |
| `PROCESS_GEOFABRIK_OAUTH_OSM_PASSWORD` | `secrets.PROCESS_GEOFABRIK_OAUTH_OSM_PASSWORD` | no       | Optional Geofabrik OAuth password. Sensitive.                 |
| `TILES_URL`                            | `vars.TILES_URL`                               | yes      | Public tile endpoint hostname.                                |
| `CACHELESS_URL`                        | `vars.CACHELESS_URL`                           | yes      | Cacheless tile endpoint hostname.                             |
| `VITE_APP_ORIGIN`                      | `vars.VITE_APP_ORIGIN`                         | yes      | Public app origin.                                            |
| `VITE_APP_ENV`                         | `vars.VITE_APP_ENV`                            | yes      | App environment for client/server behavior.                   |
| `APP_URL`                              | `vars.APP_URL`                                 | yes      | Main app hostname used by Traefik labels.                     |
| `SESSION_SECRET_KEY`                   | `secrets.SESSION_SECRET_KEY`                   | yes      | Session signing secret. Sensitive.                            |
| `OSM_CLIENT_ID`                        | `secrets.OSM_CLIENT_ID`                        | yes      | OSM OAuth client ID. Sensitive.                               |
| `OSM_CLIENT_SECRET`                    | `secrets.OSM_CLIENT_SECRET`                    | yes      | OSM OAuth client secret. Sensitive.                           |
| `S3_KEY`                               | `secrets.S3_KEY`                               | yes      | S3 access key. Sensitive.                                     |
| `S3_SECRET`                            | `secrets.S3_SECRET`                            | yes      | S3 secret key. Sensitive.                                     |
| `S3_REGION`                            | `secrets.S3_REGION`                            | yes      | S3 region.                                                    |
| `S3_BUCKET`                            | `secrets.S3_BUCKET`                            | yes      | S3 bucket used by app/scripts.                                |
| `ATLAS_API_KEY`                        | `secrets.ATLAS_API_KEY`                        | yes      | Internal atlas API key. Sensitive.                            |
| `MAPROULETTE_API_KEY`                  | `secrets.MAPROULETTE_API_KEY`                  | yes      | MapRoulette API key. Sensitive.                               |
| `MAILJET_APIKEY_PUBLIC`                | `secrets.MAILJET_APIKEY_PUBLIC`                | no       | Optional Mailjet public key. Sensitive.                       |
| `MAILJET_APIKEY_PRIVATE`               | `secrets.MAILJET_APIKEY_PRIVATE`               | no       | Optional Mailjet private key. Sensitive.                      |
| `SKIP_DOWNLOAD`                        | `vars.SKIP_DOWNLOAD`                           | no       | Processing flag (default 1). Default: `1`.                    |
| `SKIP_UNCHANGED`                       | `vars.SKIP_UNCHANGED`                          | no       | Processing flag (default 0). Default: `0`.                    |
| `PROCESSING_DIFFING_MODE`              | `vars.PROCESSING_DIFFING_MODE`                 | yes      | Diffing mode for processing.                                  |
| `PROCESSING_DIFFING_BBOX`              | `vars.PROCESSING_DIFFING_BBOX`                 | yes      | Diffing bbox for processing.                                  |

<!-- GENERATED_ENV_TABLE_END -->

## Security notes

- Keep secrets in GitHub Environments (`staging`, `production`) or repository secrets where needed.
- Keep `.env.example` safe: placeholders only, no real secret values.
- Do not pass secrets as Docker build args. Use runtime env only.
- Prefer AWS OIDC role assumption over long-lived `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.
