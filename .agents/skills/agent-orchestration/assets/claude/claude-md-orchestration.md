# Agent orchestration (merge into CLAUDE.md)

Copy the sections below into project or global `CLAUDE.md`. Full guide: fixmyskills `agent-orchestration` → [claude-code.md](references/claude-code.md).

---

## General preferences

- If asked to do too much work at once, stop and state that clearly.
- For bulk implementation, review, or verification, **shell out to `cursor-agent`** (Grok 4.6 Low, standard / not Fast) instead of doing token-heavy work inline on Fable.
- Load skills `cursor-worker-implement` and `cursor-worker-review` when delegating.

## Picking models (workflows and subagents)

Defaults, not limits. Override when output quality is not enough — judge output, not price; escalating costs less than shipping mediocre work.

| model                               | cost (delegate ↑) | intelligence | taste |
| ----------------------------------- | ----------------- | ------------ | ----- |
| **cursor-grok-4.6-low[fast=false]** | 9                 | 7            | 7     |
| **opus-4.8**                        | 4                 | 7            | 8     |
| **fable-5**                         | 2                 | 9            | 9     |

- **Intelligence:** hardest problem the model can handle unsupervised.
- **Taste:** UI/UX, code quality, API design, copy.
- **Cost:** tiebreaker when axes conflict; for shipped work, intelligence > taste > cost.

### How to apply

- **Bulk / mechanical** (clear spec, migrations, data passes): `cursor-agent` + **cursor-grok-4.6-low[fast=false]** via `cursor-worker-implement`.
- **User-facing** (UI, copy, API shape): Fable or Opus; taste ≥ 7.
- **Reviews** of plans or implementations: Fable or Opus; optionally **cursor-grok-4.6-low[fast=false]** via `cursor-worker-review` for an independent pass.
- **Fable effort:** prefer Low–High; avoid X-High / Max / Ultra-style over-reasoning unless the user insists.

## cursor-agent mechanics (Grok 4.6 Low workers)

Claude Code subagent/workflow `model:` only accepts **Claude** models. To use **Grok 4.6 Low**, shell out to `cursor-agent` (Cursor subscription).

Prerequisite: `cursor-agent` on PATH.

```bash
WS="--workspace $(git rev-parse --show-toplevel) --model 'cursor-grok-4.6-low[fast=false]' --output-format json"
cursor-agent -p --mode ask $WS "Review prompt."   # review / Q&A (read-only)
cursor-agent -p --force    $WS "Implement prompt." # edits + shell
```

`--force` auto-approves tools (headless has no prompt); `--trust` alone only trusts the workspace. `--mode plan` for read-only investigation. Add `--worktree <slug>` for parallel isolated edits.

**Workflow wrappers:** a workflow stage must be a Claude model — use a thin **Sonnet (low effort)** agent that writes the `cursor-agent` prompt, runs it via Bash, returns structured output. Label stages `grok-low:task-name`.

**Timeouts:** long runs may exceed Bash limits — background + poll.

**Prompts:** self-contained (paths, scope, done criteria) — not Claude-style system messages.
