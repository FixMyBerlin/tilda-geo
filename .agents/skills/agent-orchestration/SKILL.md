---
name: agent-orchestration
description: >-
  Premium orchestrator (Fable 5, Sonnet 5, or GPT-5.6 Sol) with Composer 2.5
  workers. Two separate setups: Cursor IDE (subagents in .cursor/agents) or Claude
  Code (cursor-agent CLI + .claude/skills). Use when configuring orchestration;
  pick the guide for your host.
user-invocable: true
disable-model-invocation: true
---

# Agent orchestration

**Goal:** A premium orchestrator plans; **Composer 2.5** executes bulk work cheaper.

Install once, then run **only** the init for your host from `.agents/skills/agent-orchestration/`:

```bash
bunx skills add FixMyBerlin/fixmyskills --skill agent-orchestration -a cursor -y
```

| Host            | Mechanism                                          | Files                                                  | Bootstrap        | Guide                                       |
| --------------- | -------------------------------------------------- | ------------------------------------------------------ | ---------------- | ------------------------------------------- |
| **Cursor IDE**  | subagents (`model:` pins) + `@orchestrator-worker` | `.cursor/agents/`, `.cursor/rules/`                    | `init-cursor.sh` | [cursor-ide.md](references/cursor-ide.md)   |
| **Claude Code** | `cursor-agent` CLI (`cursor-agent` on PATH)        | `.claude/skills/cursor-worker-*` + `CLAUDE.md` snippet | `init-claude.sh` | [claude-code.md](references/claude-code.md) |

Do not mix both inits unless you use both tools on the same repo. Cursor personal workers: [cursor-personal-setup.md](references/cursor-personal-setup.md).
