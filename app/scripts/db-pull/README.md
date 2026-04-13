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
- `pg_dump`/`psql` are run via Dockerized Postgres CLI (`postgres:17-alpine`) to avoid host client version mismatches.

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
