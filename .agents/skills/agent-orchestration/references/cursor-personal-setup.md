# Personal setup (`~/.cursor/agents/`)

Cursor IDE only. For Claude Code, use project `.claude/skills/` or `~/.claude/skills/`.

Use personal subagents when you want the same **implementer** and **verifier** workers across all projects without copying into each repo.

## Copy workers only

```bash
mkdir -p ~/.cursor/agents
cp .agents/skills/agent-orchestration/assets/cursor/implementer.md ~/.cursor/agents/
cp .agents/skills/agent-orchestration/assets/cursor/verifier.md ~/.cursor/agents/
```

From fixmyskills dev checkout:

```bash
cp skills/agent-orchestration/assets/cursor/implementer.md ~/.cursor/agents/
cp skills/agent-orchestration/assets/cursor/verifier.md ~/.cursor/agents/
```

## Precedence

| Path                                    | Scope                |
| --------------------------------------- | -------------------- |
| `.cursor/agents/implementer.md` in repo | Wins over user-level |
| `~/.cursor/agents/implementer.md`       | All projects         |

Prefer **project-local** agents for team repos.

## What personal workers do not replace

Workers pin Composer models globally, but orchestration behavior still comes from the project rule — run init once per repo:

```bash
bash .agents/skills/agent-orchestration/scripts/init-cursor.sh
```

Then attach **`@orchestrator-worker`** plus your task. No delegation boilerplate to paste.

Do **not** put orchestration in global Cursor User Rules (`alwaysApply`).
