# Docker local development

Single reference for local Postgres, tiles, worktrees, and predev. Humans and agents start here.

## Default steps

### Daily work on `develop` or `main` (main checkout)

```bash
cd app && bun run dev
```

No `.env.local`. Default ports `5432` / `3000`, containers `db` / `tiles`.

### Feature branch (use a worktree)

From `app/` in any checkout:

```bash
bun run setup-worktree -- feature/my-branch
cd ../tilda-geo-feature-my-branch/app   # path printed by script
bun run dev
```

`setup-worktree` creates `../tilda-geo-<name>`, copies `.env` (not `.env.local`), runs husky prepare. First `bun run dev` creates `.env.local` and starts an isolated Docker stack.

If you run `bun run dev` on a feature branch in the **main checkout**, predev warns you to use a worktree and continues with the default stack (no `.env.local`).

## Agent steps

1. Read this file.
2. `bun run setup-worktree -- <branch>` from `app/`.
3. `bun run dev` in the new worktree — trust predev for `.env`, `.env.local`, Docker, migrations.

Do not hand-craft `docker compose` for db/tiles. For processing, use `bun run processing` (see `test-processing-diff` skill).

## Rules

| Topic            | Rule                                                                                          |
| ---------------- | --------------------------------------------------------------------------------------------- |
| `.env`           | Required at repo root (copy from `.env.example`). Secrets and shared config.                  |
| `.env.local`     | Auto-generated on **non-`develop`/`main`** branches in a **linked worktree**. Gitignored.     |
| `DEV_STACK_ID`   | `wt_<folder_basename>` — compose project and container prefix (`wt_foo_db`).                  |
| Container prefix | Runtime-only (`COMPOSE_DEV_CONTAINER_PREFIX`); derived by predev, not stored in `.env.local`. |
| App server       | One `bun run dev` at a time (port **5173**, OSM OAuth). One Docker db+tiles stack at a time.  |
| Compose project  | Predev passes `docker compose -p <DEV_STACK_ID>`. Do not set `COMPOSE_PROJECT_NAME` in YAML.  |

Branch switches: `post-checkout` hook + predev remove stale `.env.local`. On `develop`/`main`, `.env.local` is deleted.

## Env files

Scripts under `app/` load: `bun --env-file=../.env --env-file=../.env.local` (see `app/package.json`).

Example `.env.local` (auto-generated):

```env
# DEV_STACK_BRANCH=feature/my-branch
DATABASE_PORT=5433
TILES_PORT=3001
DEV_STACK_ID=wt_tilda_geo_feature
```

## Implementation

| File                                      | Role                                            |
| ----------------------------------------- | ----------------------------------------------- |
| `app/scripts/setup-worktree.ts`           | Create worktree + copy `.env`                   |
| `app/scripts/predev/ensureDevStack.ts`    | `.env.local`, attach, worktree warning          |
| `app/scripts/predev/envLocalBranch.ts`    | Branch sync, linked-worktree detection          |
| `app/scripts/predev/devStackDiscovery.ts` | List running stacks from Docker                 |
| `app/scripts/predev/checkDocker.ts`       | Stop other stacks, `compose -p`, start db+tiles |
| `app/scripts/predev/syncEnvLocal.ts`      | post-checkout entry                             |
| `app/.husky/post-checkout`                | Sync `.env.local` on branch switch              |

Predev chain: `ensureEnv` → `ensureDevStack` → `checkDocker` → …

## Advanced

### Manual worktree

```bash
git worktree add ../tilda-geo-my-branch my-branch
# copy .env from another checkout
cd ../tilda-geo-my-branch/app && bun run dev
```

### Attach to another stack

Set in `.env.local`:

```env
DEV_ATTACH_STACK=wt_tilda_geo
```

Stack id = container prefix without `_db` (`default` for develop `db`/`tiles`). Target must be running. Running stacks: `docker ps` (postgis `*_db` + matching `*_tiles`).

### Manual compose / psql

```bash
set -a && source .env && [ -f .env.local ] && source .env.local && set +a
docker compose -p "$DEV_STACK_ID" up db tiles -d
```

[`psql_shell.sh`](../psql_shell.sh) resolves the db container from `DEV_ATTACH_STACK` or `DEV_STACK_ID`.

### Compose files

| File                          | Role               |
| ----------------------------- | ------------------ |
| `docker-compose.yml`          | Base services      |
| `docker-compose.override.yml` | Dev-only overrides |
