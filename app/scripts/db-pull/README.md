# Remote DB pull/restore

This directory contains schema-scoped scripts to:

- pull dumps from remote sources (`production`, `staging`),
- restore dumps into the local development database only.

Pull command:

- `bun scripts/db-pull/pull.ts --source production|staging [--schema prisma|data]`
- `bun run db-pull -- [--source production|staging] [--schema prisma|data]` (pull + restore flow)

## Safety rules

- Allowed schemas: `prisma`, `data`.
- Blocked schemas: `public`, `backup`.
- Restore runtime must be local: `ENVIRONMENT` must be `development` or restore aborts.
- Pull is read-only (`pg_dump` only).
- `pg_dump`/`psql` are run via Dockerized Postgres CLI (`POSTGRES_CLI_IMAGE`) to avoid host client version mismatches. Same major as Postgres: [data-schema README](../../../data-schema/README.md#postgres-major-versions).

## Prisma restore cleanup

After a successful `--schema prisma` restore (dump files under `data/` stay raw/sensitive):

- Run `prisma migrate deploy` so the local schema matches the app (production dumps may lag behind develop).
- Pseudonymize non-`@fixmycity.de` user names/emails (`id` / `osmId` kept; OSM placeholder emails kept).
- Delete restored tokens, sessions, verifications, and audit logs; clear Account OAuth secrets.
- Run `seedLocalAccess()` (same as `bun run seed`): ensure FMC admins + local MCP token `tildageode_admin_local_dev_mcp_only` (matches committed `.cursor/mcp.json` `tilda-geo-admin--DEV`).

## Dump files

Generated dumps are written to `app/scripts/db-pull/data`:

- `production.prisma.sql`
- `production.data.sql`
- `staging.prisma.sql`
- `staging.data.sql`

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
3. Terminal 2: run `bun run db-pull:pull -- --source <production|staging> [--schema prisma|data]`.
4. Terminal 2: run `bun run db-pull:restore -- --source <production|staging> [--schema prisma|data]`.
5. If your SSH tunnel aliases are not set up yet, follow:
   - https://github.com/FixMyBerlin/dev-documentation/blob/main/server-management/ionos-tilda.md#use-the-ssh-tunnel

These source URLs are local tooling variables and are intentionally not part of deploy env generation in `.github`.
