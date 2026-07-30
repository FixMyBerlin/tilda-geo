# `audit-public-schema` — clean stale objects from the geo/tile `public` schema

Interactive CLI to find and drop orphan tables/functions in the geo/tile database's **`public`**
schema. Run **at most once a year**, or after a refactor that renamed/removed processing topics or
tile tables.

```bash
cd app
bun run audit-public-schema
```

## Why this exists

The geo/tile database lives in the `public` schema, and Martin auto-publishes **everything** in it:

```yaml
# configs/martin.yaml
postgres:
  auto_publish:
    from_schemas:
      - public
```

Our processing pipeline and the app only ever **add or replace** objects in `public` — nothing ever
**drops** what is no longer produced. So when a topic or tile table is renamed/removed in code, the
old object stays in the DB, stays exposed by Martin, is never refreshed again (silently stale), and
is flagged nowhere. This CLI finds and removes them.

## The idea: your local dev DB is the source of truth

`public` holds **far more** than the client-facing tile tables — internal/intermediate tables
(`_parking_*`, `*_diff`, `*_errors`, …), helper functions (`tilda_*`, `atlas_*`, `jsonb_diff`),
metadata (`meta`, `aggregated_lengths`), and so on. You **cannot** decide "stale vs. current" from
the client `TableId` list alone.

Instead, a **freshly built local dev database** contains _exactly_ what current code creates — every
internal object included, and nothing else. So the rule is simple:

> **Anything in staging/production `public` that your local dev build does not contain is a cleanup
> candidate.**

Removing one is just a `DROP`. There's no quarantine/soak dance: the pipeline rebuilds its tables
every run (osm2pgsql) and the app re-registers its functions (`CREATE OR REPLACE`), so if you ever
drop something that _is_ still current, it simply reappears on the next processing run. The real
safeguard is the explicit multi-select of exactly which objects to drop.

## What the CLI does

1. **Checks your local dev DB is a valid reference** and reports each as a green ✓:
   - local DB reachable,
   - `public` has tables,
   - `public` has functions (and specifically `atlas_generalized_*` tile functions — these are
     registered by the **app**, so if they're missing you likely haven't booted the app locally and
     every remote tile function would be a false positive; it warns and asks before continuing),
   - when processing last ran locally (reads the `public.meta` table; warns if stale or missing).
2. **Asks** whether to audit **staging** or **production** (do staging first).
3. **Connects** to that environment. If the SSH tunnel is down it prints the same setup guidance as
   db-pull and then **waits**, re-checking every 5 seconds (Ctrl-C to abort) — start the tunnel in
   another terminal and it continues automatically. Auth/permission errors fail fast instead of
   looping.
4. **Diffs** the remote `public` schema against your local reference and shows the candidates (with
   sizes/row counts), plus a heads-up that incomplete local processing can cause false positives.
5. Lets you **multi-select** exactly which objects to drop.
6. **Drops** them (schema-qualified, `IF EXISTS`, no `CASCADE` — a dependency error is reported
   per-object rather than silently cascading), then prints a per-object ✓ / ✗ summary.

Then re-run it for **production** once staging looks healthy.

### Required env

Provided automatically by the `bun run audit-public-schema` script (`--env-file=../.env
--env-file=../.env.local`):

- `DATABASE_HOST` / `DATABASE_PORT` / `DATABASE_USER` / `DATABASE_PASSWORD` / `DATABASE_NAME` — the
  local dev DB (the reference).
- `DATABASE_URL_STAGING` / `DATABASE_URL_PRODUCTION` — the tunnel endpoints (same vars db-pull uses;
  see [.env.example](../../../.env.example) and [scripts/db-pull/README.md](../db-pull/README.md)).

### Tunnel setup

- Staging: `ssh tilda-staging-postgres-tunnel` → `localhost:5433`
- Production: `ssh tilda-production-postgres-tunnel` → `localhost:5434`
- Details: <https://github.com/FixMyBerlin/dev-documentation/blob/main/server-management/ionos-tilda.md#use-the-ssh-tunnel>
