---
name: tilda-geo-agent-workflow
description: >-
  Guides isolated feature / local-stack setup in tilda-geo: sibling worktrees,
  predev Docker, seed, processing, static-data symlinks, agent-browser map debug.
  Use when creating a feature worktree, needing an isolated Docker stack, running
  processing/seed, touching static datasets, or debugging maps. Do not use for
  ordinary edits on develop/main or when already on an existing branch — stay in
  the current checkout.
---

# TILDA Geo agent workflow

Local isolation / stack playbook for **tilda-geo**. Not the everyday coding entrypoint.

## Default: stay where you are

Work in the **current checkout**. Do not run `setup-worktree` unless the user asks for a new branch/worktree/isolated stack (or already said “new feature branch / worktree”). A one-line suggestion that large work would fit a worktree is OK; creating one is not.

Everyday conventions live in [AGENTS.md](../../../AGENTS.md).

### When to use

- User asks for a **new branch / worktree / isolated stack**
- Dedicated feature that should not dirty the main `develop` checkout
- Task needs **processing**, **fresh seed DB**, **parallel Docker**, or **static-data worktrees**
- Map/UI debugging with `bun run dev` + agent-browser ([section 4](#4-agent-browser-and-map-state) — no worktree ceremony unless isolation is also needed)
- Implementer hits Docker / processing / static-data setup questions

### When not to use

- Q&A, exploration, small edits on `develop` / `main`
- Continuing work already on a branch or in a worktree
- One-file or few-file fixes where the current checkout is enough
- Docs, copy, config tweaks that don’t need a private DB stack

## Quick orientation

Jump to the section that matches the task:

- New branch or checkout setup: [Git worktrees](#1-git-worktrees)
- Docker, ports, `.env.local`, or `bun run dev`: [Docker and predev](#2-docker-and-predev-envlocal)
- Processing, seed data, or static dataset commands: [Processing and local data](#3-processing-and-local-data)
- Browser or map debugging: [agent-browser and map state](#4-agent-browser-and-map-state)
- Static dataset files or symlinks: [`tilda-static-data` symlink](#5-tilda-static-data-symlink)
- Private experimental repo / two remotes: [tilda-geo-private-repo](../tilda-geo-private-repo/SKILL.md)
- Env, MCP tools, checks, or command locations: [What else agents need](#6-what-else-agents-need)

**Repo layout:** `app/` (TanStack Start frontend + API), `processing/` (osm2pgsql pipeline + tiles). Most agent commands run from **`app/`**. Root **`.env`** holds secrets; **`app/` scripts load `../.env` and `../.env.local`**.

---

## 1. Git worktrees

When isolating feature work, use a **sibling checkout** next to the main repo. Do not do that feature work in the main checkout.

```
../
|-- tilda-geo/                    # main checkout: develop or main
|-- tilda-geo--my-branch/         # worktree for branch my-branch
|-- tilda-geo--other-branch/      # another worktree
`-- tilda-static-data/            # separate repo (see static-data section)
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

Two remotes (`origin` = public, `private` = experimental mirror) are org-wide shared via the main checkout's `.git` store. See [tilda-geo-private-repo](../tilda-geo-private-repo/SKILL.md) for sync and PR recipes.

### Rules

- **`develop` / `main`** -> main checkout, no `.env.local`, default Docker stack (`db` / `tiles`, ports 5432 / 3000).
- **Work branches** -> linked worktree; predev auto-creates `.env.local` with `DEV_STACK_ID`.
- Running `bun run dev` on a work branch in the **main checkout** only warns. Stop and use a worktree.

---

## 2. Docker and predev (`.env.local`)

Run `bun run dev` and let **predev** manage env files, ports, Docker, and migrations. Do not hand-craft `docker compose` for db/tiles.

`bun run dev` runs `predev` before Vite:

1. **`ensureEnv`** - root `.env` must exist (from `.env.example`).
2. **`ensureDevStack`** - on feature worktrees, writes `.env.local` if missing.
3. **`checkDocker`** - stops other stacks (default mode), starts this worktree's db+tiles via `docker compose -p <DEV_STACK_ID>`.
4. Migrations, topic-docs, etc.

Example auto-generated `.env.local`:

```env
DEV_STACK_ID=wt_tilda_geo_my_branch
```

Optional parallel port slot (second worktree while another uses default ports):

```env
DEV_STACK_ID=wt_tilda_geo_my_branch
DEV_PORT_SLOT=1
```

| Variable           | Role                                                                       |
| ------------------ | -------------------------------------------------------------------------- |
| `DEV_STACK_ID`     | Compose project name; containers like `wt_foo_db`; separate DB volume      |
| `DEV_ATTACH_STACK` | Optional: attach to another running stack instead of starting new db+tiles |
| `DEV_PORT_SLOT`    | Optional `1`–`5`: offset host ports for parallel worktrees (see below)     |

**Default ports:** db **5432**, tiles **3000**, Vite **5173**. Predev stops other stacks before starting yours — one active default stack at a time.

**Port slots** (`DEV_PORT_SLOT=1`…`5` in `.env.local`; absent or `0` = default):

| Slot | db   | tiles | Vite | App origin              |
| ---- | ---- | ----- | ---- | ----------------------- |
| 1    | 5433 | 3001  | 5174 | `http://127.0.0.1:5174` |
| 2    | 5434 | 3002  | 5175 | `http://127.0.0.1:5175` |
| 3    | 5435 | 3003  | 5176 | `http://127.0.0.1:5176` |
| 4    | 5436 | 3004  | 5177 | `http://127.0.0.1:5177` |
| 5    | 5437 | 3005  | 5178 | `http://127.0.0.1:5178` |

Slot mode does **not** stop other stacks. Predev derives `DATABASE_PORT`, `TILES_PORT`, `VITE_TILES_PORT`, `VITE_APP_ORIGIN`, and Vite/HMR port from `DEV_PORT_SLOT` at runtime — do not hand-edit those keys in `.env.local`. Hand-edited port keys are stripped on predev with a warning pointing to `DEV_PORT_SLOT`.

`listRunningDevStacks` (used by default-mode stop-others) only lists stacks on the default ports (5432/3000). Offset-slot stacks are left alone. `DEV_ATTACH_STACK` resolves any running stack by id, including slot-mode ports. Prisma CLI (`migrate`, `seed`, `studio`) applies `DEV_PORT_SLOT` via `prisma.config.ts` the same way Vite does.

Do **not** copy `.env.local` between worktrees — each worktree needs its own `DEV_STACK_ID`. Reusing a stack id while another checkout already runs that compose project on different ports will fail predev with a collision error.

**OSM OAuth:** each slot's `VITE_APP_ORIGIN` must be registered as an OAuth redirect URL (user maintains up to five extra origins).

`post-checkout` hook + predev remove stale `.env.local` when switching to `develop`/`main`.

**Limits:** default mode — one `bun run dev` at a time on port **5173**. With port slots, up to five parallel Vite instances on offset ports (each needs a registered OAuth origin). Default mode: one db+tiles stack on 5432/3000; slot mode stacks run in parallel on offset ports.

If editing predev/Docker code, keep these invariants:

- Predev passes `docker compose -p <DEV_STACK_ID>`; do not set `COMPOSE_PROJECT_NAME` in compose YAML.
- `COMPOSE_DEV_CONTAINER_PREFIX` is runtime-only and derived by predev, not stored in `.env.local`.
- `DEV_ATTACH_STACK` can attach to another stack, but the target db+tiles stack must already be running.
- `DEV_PORT_SLOT` is the single source of truth for offset ports; legacy `DATABASE_PORT` / `TILES_PORT` lines in `.env.local` are stripped.
- Relevant files: `app/scripts/setup-worktree.ts`, `app/scripts/predev/ensureDevStack.ts`, `app/scripts/predev/devPortSlot.ts`, `app/scripts/predev/envLocalBranch.ts`, `app/scripts/predev/devStackDiscovery.ts`, `app/scripts/predev/checkDocker.ts`, `app/scripts/predev/syncEnvLocal.ts`, `app/.husky/post-checkout`.

---

## 3. Processing and local data

### OSM processing (`bun run processing`)

From **`app/`**. `bun run processing` generates a **single shell line** that cds to repo root and runs `docker compose` with env overrides. Use that printed line; do not invent compose commands.

```bash
bun run processing -- --help   # full contract
```

**Agents (no TTY):** pass the complete non-interactive flag set (bbox/preset, `--diff-mode`, topics, skip flags, `--foreground`/`--detach`/`--dry-run`). For exact flags and diff validation, load [test-processing-diff](../test-processing-diff/SKILL.md).

**Worktree stacks:** the printed command uses this worktree's `DEV_STACK_ID` and default ports 5432/3000, or offset ports when `DEV_PORT_SLOT` is set (the printed line includes `DATABASE_PORT` / `TILES_PORT`). Prefer the line from `bun run processing` over manual env.

**Reference -> fixed diff workflow:** run `reference` on baseline commit, then `fixed` on your branch; inspect `public.*_diff` tables. Full steps in [test-processing-diff](../test-processing-diff/SKILL.md).

**Lua unit tests** (from `processing/`): `bun run test`.

### App DB setup (agents)

```bash
bun run seed   # fresh local DB (~30s); also installs local MCP Bearer `tildageode_admin_local_dev_mcp_only`
bun run dev
```

Do **not** use `db-pull`. It pulls staging/production snapshots and is for humans only (prisma restores scrub PII/credentials and re-run the same local-access seed — see `app/scripts/db-pull/README.md`).

If you run `dev` without seeding first, predev warns — warn-only, does not block.

### Static datasets

Most agent tasks do **not** need `app/scripts/StaticDatasets/geojson` at all. If static datasets are unrelated, leave the symlink absent or untouched and do not run static-dataset update commands.

If a task needs to read existing static datasets or run the upload pipeline without data changes, use the regular sibling repo symlink:

```bash
# from app/: creates symlink to ../../../../tilda-static-data/geojson
bun run static-datasets-link
```

Update local dev uploads only when the task explicitly needs it:

```bash
bun run static-datasets-update -- --folder-filter=<dataset-folder> --env=dev
```

If a task needs to edit static dataset files, create a `tilda-static-data` worktree and relink `geojson` to that worktree instead. See the static-data symlink section below.

`setup-worktree` copies root `.env`, so static-dataset update keys should already be available in normal agent worktrees. If `static-datasets-update` fails with auth or upload errors, verify `ATLAS_API_KEY` (dev) and S3 credentials in root `.env`. More details: [app/scripts/StaticDatasets/README.md](../../../app/scripts/StaticDatasets/README.md).

---

## 4. agent-browser and map state

**Prerequisite:** `bun run dev` running at **http://127.0.0.1:5173** (use `127.0.0.1`, not `localhost`).

Use **agent-browser MCP** (`agent_browser_open` -> `agent_browser_snapshot` -> click/fill -> `agent_browser_console` / screenshots). Setup: [agent-browser-mcp.md](../../../.agents/skills/tech-stack/references/agent-browser-mcp.md).

**Playwright** (`bun run e2e`) is for committed regression tests, not interactive agent debugging.

### `window.__mainMap`

In dev and Playwright mode, `onLoad` exposes the MapLibre instance as `window.__mainMap` so agents and tests can inspect runtime map state via `agent_browser_eval` or Playwright `page.evaluate`.

Wiring: skill `react-map-gl` → [map-debug-exposure.md](../../../.agents/skills/react-map-gl/references/map-debug-exposure.md). In `RegionMap.tsx`, `handleLoad` calls `exposeMainMapForDebugging(event.target)` — inside Map handlers, **`event.target` is the MapLibre map**; use it directly, not `useMap()` / `getMap()`.

```js
window.__mainMap?.getZoom()
window.__mainMap?.getStyle().layers.map((layer) => layer.id)
window.__mainMap?.queryRenderedFeatures({ layers: ['some-layer'] })
```

`window.__mainMap` is set during map load in dev, or when `VITE_PLAYWRIGHT_ENABLED=true` / `window.__PLAYWRIGHT_ENABLED === 'true'`. The `mapLoaded` event remains Playwright-gated. If `__mainMap` is unavailable, prefer:

- Annotated screenshots for visual checks
- `agent_browser_react_tree` around map components (`MapInterface`, `SourcesLayersAtlasGeo`)
- Playwright helpers: `window.__mapLoaded`, `mapLoaded` event (when `VITE_PLAYWRIGHT_ENABLED=true`)

After load, elsewhere in React: `<Map id="mainMap">` → `useMap()` → `mainMap` (`MapRef`; `mainMap.getMap()` for maplibregl APIs outside event handlers). E2E helpers: skill `playwright-skill`.

---

## 5. `tilda-static-data` symlink

`app/scripts/StaticDatasets/geojson` -> `../../../../tilda-static-data/geojson`.

Decision order for agents:

1. **No static data needed:** do not create or change the symlink.
2. **Read/use existing static data only:** use the regular symlink to `../tilda-static-data/geojson`.
3. **Edit static data:** create a matching `tilda-static-data` worktree and point the symlink there.

**Do not edit symlinked GeoJSON from a tilda-geo worktree when the symlink points at regular `tilda-static-data`.** That would change the shared sibling checkout. Commits for data files belong in **`tilda-static-data`**, not tilda-geo.

### When the task needs static data changes

1. **Create a `tilda-static-data` worktree too** (sibling to tilda-geo):

   ```bash
   cd ../tilda-static-data
   git worktree add ../tilda-static-data--my-branch my-branch
   ```

2. Point the matching **tilda-geo** worktree at that static-data worktree:

   ```bash
   cd ../tilda-geo--my-branch/app
   rm -f scripts/StaticDatasets/geojson
   ln -s ../../../../tilda-static-data--my-branch/geojson scripts/StaticDatasets/geojson
   ```

3. Edit files under `../tilda-static-data--my-branch/geojson/`.
4. Run `bun run static-datasets-update` from the matching **tilda-geo** worktree only if the task needs local upload data.

### When the task does **not** need static data

- **Do not touch `geojson/`**. Most app/processing work does not need the symlink.
- Optional: `bun run static-datasets-unlink` in `app/` to drop the symlink (restore with `static-datasets-link`). `type-check-deploy` unlinks temporarily during CI-like typecheck.

For adding datasets, follow skill `add-static-dataset`, but perform file edits in **`tilda-static-data`**, not through the symlink from a throwaway path.

---

## 6. What else agents need

### Environment

`setup-worktree` copies root `.env`, and `bun run dev` / predev validates the required local setup. Do not proactively audit env or auth values; only inspect `.env` if a command fails with a concrete env/auth error.

### MCP tools (user-level, not in repo)

| MCP                         | Use for                                              |
| --------------------------- | ---------------------------------------------------- |
| `user-postgres-tilda-dev`   | SQL against local dummy db or processing diff tables |
| `user-tilda-geo-admin--DEV` | Admin-only API tasks                                 |
| `user-agent-browser`        | Interactive UI/map debugging                         |

### Finishing work

Load [finish-work](../../../.claude/skills/finish-work/SKILL.md) when wrapping up. It covers `bun run check` (includes advisory knip), lint/format staging, and commit messages. **Default: commit** with a user-facing message; draft only when the user clearly did not want a commit ("don't commit", "draft only", review-only turns, etc.).

### Large multi-step tasks (orchestration)

For multi-file features or parallel work, pick a premium orchestrator (Fable 5, Sonnet 5, or GPT-5.6 Sol) with **`@orchestrator-worker`** and Composer subagents (`/implementer`, `/verifier`). See [cursor-ide.md](../../../.agents/skills/agent-orchestration/references/cursor-ide.md). Skip for trivial one-file edits.

### Command locations (common mistakes)

| Run from      | Examples                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `app/`        | `dev`, `processing`, `seed`, `static-datasets-update`, `check`, `check-ci`, `setup-worktree` |
| `processing/` | `bun run test` (Lua)                                                                         |
| Repo root     | Only when executing the **printed** processing compose line                                  |

### Do not

- Hand-craft `docker compose` for db/tiles/processing (use predev / `bun run processing`).
- Run `db-pull` (human workflow; pulls real staging/prod data).
- Commit `.env.local`.
- Edit `geojson/` through a tilda-geo worktree symlink for real dataset changes.
- Run two `bun run dev` instances on the default port (OSM auth conflict). Use `DEV_PORT_SLOT` for parallel worktrees.

---

## Isolation checklist (only when this skill applies)

```
- [ ] Already on develop/main or an existing branch? -> skip worktree setup; stay put
- [ ] User asked for a new work branch? -> from app/, `bun run setup-worktree -- my-branch`, then `bun run dev` in the new worktree
- [ ] Local app/db needed? -> trust predev from `bun run dev`; do not hand-craft Docker or re-audit env
- [ ] Fresh local db? -> `bun run seed`, then `bun run dev` (not db-pull)
- [ ] Processing change? -> load [test-processing-diff](../test-processing-diff/SKILL.md)
- [ ] Static dataset change? -> worktree `tilda-static-data`, relink `geojson`, then load [add-static-dataset](../add-static-dataset/SKILL.md)
- [ ] Map/UI bug? -> use agent-browser MCP; inspect `window.__mainMap` when available
- [ ] Large multi-step task? -> premium orchestrator + `@orchestrator-worker` (see [cursor-ide](../../../.agents/skills/agent-orchestration/references/cursor-ide.md))
- [ ] Private experiment? -> load [tilda-geo-private-repo](../tilda-geo-private-repo/SKILL.md)
- [ ] Done? -> load [finish-work](../../../.claude/skills/finish-work/SKILL.md)
```
