---
name: tilda-geo-agent-workflow
description: >-
  Development setup and workflow for tilda-geo: sibling worktrees, predev Docker
  stacks, `.env.local`, ports, reusing the develop db (`DEV_ATTACH_STACK`), seed,
  static-data symlink, closing a worktree. Use when creating a feature worktree,
  needing an isolated Docker stack, reusing another checkout's db, resetting the
  local db, or when predev, Docker or ports fail. Do not use for ordinary edits
  on develop/main or when already on an existing branch — stay in the current
  checkout.
---

# TILDA Geo agent workflow

Local setup and worktree playbook for **tilda-geo**. Not the everyday coding entrypoint.

## Default: stay where you are

Work in the **current checkout**. Do not run `setup-worktree` unless the user asks for a new branch/worktree/isolated stack (or already said “new feature branch / worktree”). A one-line suggestion that large work would fit a worktree is OK; creating one is not.

Everyday conventions live in [AGENTS.md](../../../AGENTS.md).

### When to use

- User asks for a **new branch / worktree / isolated stack**
- User asks to **reuse the develop db**, **attach to develop**, or test on the **default local Postgres** without a private stack
- Dedicated feature that should not dirty the main `develop` checkout
- Task needs a **fresh seed DB**, **parallel Docker**, or **static-data worktrees**
- Work hits Docker / predev / port setup questions

### When not to use

- Q&A, exploration, small edits on `develop` / `main`
- Continuing work already on a branch or in a worktree
- One-file or few-file fixes where the current checkout is enough
- Docs, copy, config tweaks that don’t need a private DB stack

## Quick orientation

Jump to the section that matches the task:

- New branch or checkout setup: [Git worktrees](#1-git-worktrees)
- Docker, ports, `.env.local`, develop db reuse, or `bun run dev`: [Docker and predev](#2-docker-and-predev-envlocal)
- Seed, processing, or static data: [Local data](#3-local-data)
- Open the running app: [See the running app](#4-see-the-running-app)
- Finishing and closing work, MCP tools, command locations: [Wrapping up and reference](#5-wrapping-up-and-reference)
- Private experimental repo / two remotes: [tilda-geo-private-repo](../tilda-geo-private-repo/SKILL.md)

**Repo layout:** `app/` (TanStack Start frontend + API), `processing/` (osm2pgsql pipeline + tiles). Most agent commands run from **`app/`**. Root **`.env`** holds secrets; **`app/` scripts load `../.env` and `../.env.local`**.

---

## 1. Git worktrees

When isolating feature work, use a **sibling checkout** next to the main repo. Do not do that feature work in the main checkout.

```
../
|-- tilda-geo/                    # main checkout: develop or main
|-- tilda-geo--my-branch/         # worktree for branch my-branch
|-- tilda-geo--other-branch/      # another worktree
`-- tilda-static-data/            # separate repo (see static data below)
```

### Default setup

Use a short 1-3 word kebab-case branch name that describes the work. The branch name and worktree postfix should match, so `my-branch` creates `../tilda-geo--my-branch`.

From `app/` in any checkout:

```bash
bun run setup-worktree -- my-branch
cd ../tilda-geo--my-branch/app   # path printed by script
bun run dev
```

`setup-worktree` creates `../tilda-geo--<postfix>`, copies root `.env` (not `.env.local`), runs husky prepare.

Use the script for normal agent work. It keeps folder names, env copying, and hooks consistent.

Use `--dir` only when the worktree postfix must differ from the branch:

```bash
bun run setup-worktree -- my-branch --dir my-worktree
# -> ../tilda-geo--my-worktree
```

FYI: manual `git worktree add` also works, but agents should prefer `bun run setup-worktree` unless the user explicitly asks for manual setup.

Two remotes (`origin` = public, `private` = experimental mirror) are org-wide shared via the main checkout's `.git` store. See [tilda-geo-private-repo](../tilda-geo-private-repo/SKILL.md) for the private remote and private PRs.

Stack / `.env.local` rules: [section 2](#2-docker-and-predev-envlocal). `setup-worktree` needs the branch free in this checkout (`git checkout develop` first if the feature branch is already here).

---

## 2. Docker and predev (`.env.local`)

Run `bun run dev` from `app/` and let **predev** manage env, ports, Docker, and migrations. Do not hand-craft `docker compose` for db/tiles.

Predev: `ensureEnv` (root `.env`) → `ensureDevStack` (worktree `.env.local` if missing) → `checkDocker` (stop other default-port stacks, start db+tiles or verify attach) → migrations / topic-docs.

`setup-worktree` copies root `.env`, and predev validates the required local setup. Do not proactively audit env or auth values; only inspect `.env` if a command fails with a concrete env/auth error.

### Which db stack?

| Where           | Branch             | `.env.local`                                  | Stack                                                                |
| --------------- | ------------------ | --------------------------------------------- | -------------------------------------------------------------------- |
| Main checkout   | `develop` / `main` | None (removed if present)                     | Default: `db` / `tiles` on **5432** / **3000**                       |
| Main checkout   | feature branch     | None (removed every predev)                   | **Same default stack** — `bun run dev` is enough; worktree warn only |
| Linked worktree | feature branch     | Required; auto-written on first `bun run dev` | Isolated `DEV_STACK_ID` **or** attach (below)                        |

Default stack id in attach/discovery is `default`. Compose project is the checkout folder (e.g. `tilda-geo`). Empty db: `bun run seed` then `bun run dev`.

**Worktree attaching to develop** — target db+tiles must already be running. Worktree root `.env.local`:

```env
DEV_STACK_ID=wt_tilda_geo_my_branch
DEV_ATTACH_STACK=default
```

Add `DEV_PORT_SLOT=1` (or another slot) if Vite **5173** is already taken, e.g. by the dev server of develop. With `DEV_ATTACH_STACK=default` the slot only moves Vite (5174, …); db and tiles stay on **5432** / **3000**. Do not copy `.env.local` between worktrees.

**Develop data in a worktree = attach.** This is the way to get the develop db into a worktree, also when predev reports "Pending database migrations" there (its own stack is empty): switch `.env.local` to the attach lines above and rerun `bun run dev`.

| Variable           | Role                                                                                                                                                                |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DEV_STACK_ID`     | This worktree's compose project; containers like `wt_foo_db`; own DB volume unless attaching                                                                        |
| `DEV_ATTACH_STACK` | Worktrees only. Reuse a **running** stack; `default` = main checkout `db`/`tiles`. Processing/seed join that stack's compose project (`-p tilda-geo` for `default`) |
| `DEV_PORT_SLOT`    | Optional `1`–`5`. Runtime source of truth for offset ports — do not put `DATABASE_PORT` / `TILES_PORT` in `.env.local` (stripped)                                   |

**Ports:** default db **5432**, tiles **3000**, Vite **5173** (one Vite on 5173). Slot mode does **not** stop other stacks.

| Slot | db   | tiles | Vite | App origin              |
| ---- | ---- | ----- | ---- | ----------------------- |
| 1    | 5433 | 3001  | 5174 | `http://127.0.0.1:5174` |
| 2    | 5434 | 3002  | 5175 | `http://127.0.0.1:5175` |
| 3    | 5435 | 3003  | 5176 | `http://127.0.0.1:5176` |
| 4    | 5436 | 3004  | 5177 | `http://127.0.0.1:5177` |
| 5    | 5437 | 3005  | 5178 | `http://127.0.0.1:5178` |

Predev derives `DATABASE_PORT`, `TILES_PORT`, `VITE_TILES_PORT`, `VITE_APP_ORIGIN`, Vite/HMR from the slot. Prisma CLI uses the same mapping. `listRunningDevStacks` (stop-others) only sees default ports; attach resolves any running stack id including slots. Each slot origin needs an OSM OAuth redirect URL (`<origin>/api/auth/callback/osm`).

Editing predev: `docker compose -p <DEV_STACK_ID>` (never `COMPOSE_PROJECT_NAME` in YAML); `COMPOSE_DEV_CONTAINER_PREFIX` is runtime-only. Files: `app/scripts/setup-worktree.ts`, `app/scripts/predev/{ensureDevStack,devPortSlot,envLocalBranch,devStackDiscovery,checkDocker,syncEnvLocal,writeLaunchJson}.ts`, `app/.husky/post-checkout`.

---

## 3. Local data

### App DB

```bash
bun run seed   # fresh local DB (~30s); pulls data-schema specs
bun run dev
```

Do **not** use `db-pull`. It pulls staging/production snapshots and is for humans only (prisma restores scrub PII/credentials and re-run the same local-access seed — see `app/scripts/db-pull/README.md`).

If processing needs `data.*` after seed: Import on http://127.0.0.1:5173/admin/data-schema (do not POST the import API).

If you run `dev` without seeding first, predev warns — warn-only, does not block.

### OSM processing

From **`app/`**. `bun run processing` generates a **single shell line** that cds to repo root and runs `docker compose` with env overrides. Use that printed line; do not invent compose commands. It already carries this worktree's `DEV_STACK_ID` and, with `DEV_PORT_SLOT`, the offset ports.

Flags and the reference → fixed diff workflow: [test-processing-diff](../test-processing-diff/SKILL.md). Lua unit tests: `bun run test` from `processing/`.

### Static data

`app/scripts/StaticDatasets/geojson` is a symlink to `../../../../tilda-static-data/geojson`, a separate repo.

1. **No static data needed (most tasks):** do not create or change the symlink, do not run static-dataset commands.
2. **Read or upload existing data:** `bun run static-datasets-link` from `app/`, and `bun run static-datasets-update -- --folder-filter=<dataset-folder> --env=dev` only when the task needs it.
3. **Edit data files:** create a matching `tilda-static-data` worktree and point the symlink there, see step 0 of [add-static-dataset](../add-static-dataset/SKILL.md). Commits for data files belong in **`tilda-static-data`**. Never edit through a symlink that points at the regular sibling checkout.

Auth or upload errors: check `ATLAS_API_KEY` (dev) and the S3 credentials in root `.env`, see [app/scripts/StaticDatasets/README.md](../../../app/scripts/StaticDatasets/README.md). `type-check-deploy` unlinks the symlink temporarily during CI-like typecheck.

---

## 4. See the running app

Use the **built-in browser** of Claude Code (preview pane). Predev writes the git-ignored `app/.claude/launch.json` with this checkout's Vite port; it starts Vite only, so `bun run dev` has to have run once for Docker and migrations.

- Use `http://127.0.0.1:<port>`, not `localhost`: OSM OAuth only accepts the registered `127.0.0.1` origins.
- A hidden pane runs the page as a background tab, so the map stays blank and never fires `load`. Front the tab, reload, hover the map.
- `/admin` needs OSM OAuth, which the pane cannot complete. Create a stubbed session with `createStubbedAdminSession` from `app/tests/fixtures/auth.ts`, then set its cookies in the pane.
- Runtime map state is on `window.__mainMap` in dev, see skill `react-map-gl`.

**Playwright** (`bun run e2e`) is for committed regression tests, not interactive debugging: skill `playwright-skill`.

---

## 5. Wrapping up and reference

### Finishing work

Load skill `finish-work` when wrapping up, and skill `close-worktree` when a worktree is done (it lands the branch and removes the worktree and its Docker stack).

### MCP tools (user-level, not in repo)

| MCP                        | Use for                                              |
| -------------------------- | ---------------------------------------------------- |
| `tilda-geo-postgres--DEV`  | SQL against local dummy db or processing diff tables |
| `tilda-geo-admin--DEV`     | Admin tasks against the local app                    |
| `tilda-geo-postgres--STG`  | SQL against staging                                  |
| `tilda-geo-admin--STG/PRD` | Admin tasks on staging / production                  |

The DEV servers follow the default ports, so they do not reach a worktree's own stack on a slot port.

### Command locations (common mistakes)

| Run from      | Examples                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `app/`        | `dev`, `processing`, `seed`, `static-datasets-update`, `check`, `check-ci`, `setup-worktree` |
| `processing/` | `bun run test` (Lua)                                                                         |
| Repo root     | Only when executing the **printed** processing compose line                                  |

### Do not

- Hand-craft `docker compose` for db/tiles/processing (use predev / `bun run processing`).
- Run `db-pull` (human workflow; pulls real staging/prod data).
- Commit `.env.local` or create one on the **main checkout** (see [section 2](#which-db-stack)).
- Edit `geojson/` through a tilda-geo worktree symlink for real dataset changes.
- Run two `bun run dev` instances on Vite **5173** (OSM auth). Use `DEV_PORT_SLOT` for a second instance.

---

## Isolation checklist (only when this skill applies)

```
- [ ] Already on develop/main or an existing branch? -> skip worktree setup; stay put
- [ ] User asked for a new work branch? -> from app/, `bun run setup-worktree -- my-branch`, then `bun run dev` in the new worktree
- [ ] Which db? -> [section 2](#which-db-stack); do not invent `.env.local` on the main checkout
- [ ] Local app/db needed? -> trust predev from `bun run dev`; do not hand-craft Docker or re-audit env
- [ ] Fresh local db? -> `bun run seed`, then `bun run dev` (not db-pull)
- [ ] Static data edits? -> worktree `tilda-static-data`, relink `geojson`, see [section 3](#static-data)
- [ ] Private experiment? -> load [tilda-geo-private-repo](../tilda-geo-private-repo/SKILL.md)
- [ ] Done? -> skill `finish-work`, then skill `close-worktree` in a worktree
```
