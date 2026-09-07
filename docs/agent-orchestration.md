# Agent orchestration (Fable + Composer workers)

**Goal:** Use **Fable 5 High** to plan and decide; **Composer 2.5** subagents do exploration, edits, and verification. Keeps orchestration reasoning separate from token-heavy execution.

> **Temporary:** This setup lives in the `modes-claude-01` worktree for feature work. It will move to the main repo with the agent-orchestration docs PR.

## When to use

- Multi-file features, refactors, investigations
- Tasks where you want parallel workers

**Skip for** trivial one-file edits — subagent startup costs more than doing it inline.

## Setup (3 steps)

1. Pick **Fable 5 High** in the Agent model picker.
2. Ensure these exist (committed in this worktree):
   - [`.cursor/agents/`](../.cursor/agents/) — `implementer`, `verifier`
   - [`.cursor/rules/orchestrator-worker.mdc`](../.cursor/rules/orchestrator-worker.mdc)
3. Start large tasks with **`@orchestrator-worker`** in the prompt.

## Daily usage

```
@orchestrator-worker

Implement [feature]. You orchestrate only:
- explore for discovery
- /implementer for edits and tests
- /verifier before declaring done
Do not edit files yourself.
```

## Cost traps

- `model: inherit` on subagents = same price as Fable — workers here pin `composer-2.5[fast=false]`.
- Parallel subagents = parallel token spend — parallelize only independent work.

## References

- [Cursor Subagents](https://cursor.com/docs/subagents)
- [Claude Fable 5](https://cursor.com/docs/models/claude-fable-5)
- fixmyskills `agent-orchestration` skill (generic procedure; not installed here yet)

## Optional overrides

- Personal subagents: `~/.cursor/agents/` (all projects)
- Project subagents override by name: `.cursor/agents/` in repo
- Do **not** put orchestration rules in global User Rules — use `@orchestrator-worker` per task
