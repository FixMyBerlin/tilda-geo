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

Workers pin Composer models globally, but the orchestrator still needs `@orchestrator-worker` per repo:

```bash
bash .agents/skills/agent-orchestration/scripts/init-cursor.sh
```

Or paste the delegation block from [cursor-ide.md](cursor-ide.md) each task.

Do **not** put orchestration in global Cursor User Rules (`alwaysApply`).
