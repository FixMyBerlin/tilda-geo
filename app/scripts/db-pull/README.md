# Remote DB pull/restore

- Pull the prisma schema dump from remote sources (`production`, `staging`).
- Restore that dump into the local development database only.

`data.*` is not this workflow. Fill those tables with Admin UI or MCP Import, or author locally with `bun run data-schema-load`. See [data-schema README](../../../data-schema/README.md).

Pull command:

- `bun scripts/db-pull/pull.ts --source production|staging [--schema prisma]`
- `bun run db-pull -- [--source production|staging] [--schema prisma]` (pull + restore flow)

`--schema` is optional while `ALLOWED_SCHEMAS` has a single entry (`prisma`); the CLI prompts for schema only when more than one is allowed.

## Safety rules

- Allowed schemas: `prisma` (`ALLOWED_SCHEMAS` in `db-helpers.ts`). Other `--schema` values are rejected.
- Restore runtime must be local: `ENVIRONMENT` must be `development` or restore aborts.
- Pull is read-only (`pg_dump` only).
- `pg_dump`/`psql` are run via Dockerized Postgres CLI (`POSTGRES_CLI_IMAGE`) to avoid host client version mismatches. Same major as Postgres: [data-schema README](../../../data-schema/README.md#postgres-major-versions).

## Prisma restore cleanup

After a successful restore (dump files under `data/` stay raw/sensitive):

- Run `prisma migrate deploy` so the local schema matches the app (production dumps may lag behind develop).
- Pseudonymize non-`@fixmycity.de` user names/emails (`id` / `osmId` kept; OSM placeholder emails kept).
- Delete restored tokens, sessions, verifications, and audit logs; clear Account OAuth secrets.
- Run `seedLocalAccess()` (same as `bun run seed`): ensure FMC admins + local MCP token `tildageode_admin_local_dev_mcp_only` (matches committed `.cursor/mcp.json` `tilda-geo-admin--DEV`).

## Dump files

Generated dumps are written to `app/scripts/db-pull/data`:

- `production.prisma.sql`
- `staging.prisma.sql`

## Required local env vars

- `DATABASE_URL_PRODUCTION` (pull source)
- `DATABASE_URL_STAGING` (pull source)
- `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME` (restore target)
- Optional `DEV_PORT_SLOT` in `.env.local` (same as predev): restore uses the derived `DATABASE_PORT`, not a hard-coded 5432

## Remote access order (staging/production pull)

1. Terminal 1: start the SSH tunnel.
   - Production: `ssh tilda-production-postgres-tunnel` (localhost:5434 -> remote:5432)
   - Staging: `ssh tilda-staging-postgres-tunnel` (localhost:5433 -> remote:5432)
2. Terminal 2: verify matching `DATABASE_URL_<SOURCE>` points to that localhost tunnel endpoint.
3. Terminal 2: run `bun run db-pull:pull -- --source <production|staging>`.
4. Terminal 2: run `bun run db-pull:restore -- --source <production|staging>`.
5. If your SSH tunnel aliases are not set up yet, follow:
   - https://github.com/FixMyBerlin/dev-documentation/blob/main/server-management/ionos-tilda.md#use-the-ssh-tunnel

These source URLs are local tooling variables and are intentionally not part of deploy env generation in `.github`.
