# Prisma client generate (placeholder database URL)

[`prisma.config.ts`](../../prisma.config.ts) loads [`getPrismaCliDatabaseUrl()`](../../src/server/database-url.server.ts) when the config module is evaluated. `prisma generate` does not connect to Postgres, but that URL still must be constructible, so `DATABASE_*` (or equivalent) has to be set.

This script runs `prisma generate` with fixed placeholder credentials so installs and image builds succeed without a real database or app `.env`.

## Where it runs

| Context    | How                                                                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local / CI | [`package.json` → `postinstall`](../../package.json) after `bun install` (full repo, including `prisma/schema.prisma`).                                                 |
| Docker     | [`app.Dockerfile`](../../../app.Dockerfile): deps layer uses `bun install --ignore-scripts` (no schema yet), then `COPY app`, then `bun run postinstall` — same script. |

Runtime and migrations still use real `DATABASE_*` from the environment (e.g. compose, hosting).
