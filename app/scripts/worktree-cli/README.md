# worktree-cli

CLI to create a Git worktree one level up, copy env files, configure an isolated dev stack, and open the new folder in Cursor and GitHub.

**Run from `app/`:** `bun scripts/worktree-cli/cli.ts`

## What it does

1. Creates `../tilda-geo-<postfix>` with the chosen branch
2. Copies `.env` and `.env.*` from the source worktree (**not** `.env.local`)
3. Prompts: **new isolated Docker stack** (default) or **attach to an existing stack**
4. Writes gitignored `.env.local` with auto-assigned `DATABASE_PORT`, `TILES_PORT`, and `COMPOSE_DEV_CONTAINER_PREFIX`
5. Optionally opens Cursor and GitHub Desktop

## Dev workflow

| Concern        | Behavior                                                                       |
| -------------- | ------------------------------------------------------------------------------ |
| Secrets        | Copied `.env` from parent checkout                                             |
| Docker ports   | Auto in `.env.local` (per worktree)                                            |
| App server     | **One** `bun run dev` at a time on port **5173** (OSM auth)                    |
| Missing `.env` | First `bun run dev` can copy from `../tilda-geo/.env` (see `ensureEnv` predev) |

Each worktree can have its **own Postgres** (isolated stack). Only the Vite dev server is single-instance.

## Manual worktree

```bash
git worktree add ../tilda-geo-develop develop
cd ../tilda-geo-develop/app && bun run dev
```

`predev` will bootstrap `.env` (from `../tilda-geo/.env` if missing) and create `.env.local`.

## Attach to another stack

Set `DEV_ATTACH_STACK=<stack-id>` in `.env.local`, or pick **Attach** in this CLI. Stack ids are listed in `~/.cache/tilda-geo/dev-stacks.json` after the first `bun run dev` in each checkout.

## List / remove worktrees

```bash
git worktree list
git worktree remove ../tilda-geo-develop
```
