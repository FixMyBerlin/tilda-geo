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
