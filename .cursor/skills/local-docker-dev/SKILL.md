---
name: local-docker-dev
description: Local Docker, git worktrees, predev, .env.local, DEV_STACK_ID, isolated stacks, docker compose -p, port conflicts, branch switch on develop/main. Use when setting up a worktree, changing predev, or running multiple local checkouts.
---

# Local Docker development

Read [docs/docker-local-development.md](../../docs/docker-local-development.md) before worktrees, predev, `.env.local`, or isolated Docker changes.

Default: `bun run setup-worktree -- <branch>` then `bun run dev` in the new folder. Trust predev for env and Docker.
