# Docker local development

Agent workflow source of truth: [TILDA Geo agent workflow](../.cursor/skills/tilda-geo-agent-workflow/SKILL.md).

This page is a human landing page only. Keep operational rules for worktrees, predev, `.env.local`, ports, and Docker stack behavior in the agent workflow skill so agents do not have competing sources of truth.

## Human quickstart

Daily work on `develop` or `main`:

```bash
cd app
bun run dev
```

Work branch:

```bash
cd app
bun run setup-worktree -- my-branch
cd ../tilda-geo--my-branch/app
bun run dev
```

Use a short 1-3 word kebab-case branch name like `my-branch`. The setup script applies the folder naming convention, copies `.env`, and prepares hooks.

For agent guidance, static-data symlink rules, processing, seed data, browser debugging, and checks, read the agent workflow skill. Fresh setup: `bun run seed`, then `bun run dev`.

**Parallel worktrees:** when another checkout already uses ports 5432/3000/5173, add `DEV_PORT_SLOT=1` (through `5`) to `.env.local` in the second worktree. Each slot offsets db, tiles, and Vite by the same number; register the matching `http://127.0.0.1:517X` OAuth redirect URL. See the agent workflow skill for the port table.

## Docker disk cleanup

From `app/`:

```bash
bun run docker-cleanup
```

Interactive cleanup with safe options pre-selected (stopped containers, dangling images, unused build cache). Press Enter to accept defaults, or toggle additional options. Destructive options (unused volumes, full system prune) are marked with ⚠️/☢️ and require typing `DELETE`.

Running dev stacks (`db`/`tiles`, worktree `wt_*` pairs) are shown as protected — safe cleanup does not stop them.

Non-interactive:

```bash
bun run docker-cleanup -- --quick      # run pre-selected defaults
bun run docker-cleanup -- --dry-run    # show plan, no changes
```

Avoid volume prune unless you intend to delete Postgres/OSM data from old stacks.
