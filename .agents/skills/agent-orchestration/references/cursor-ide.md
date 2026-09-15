# Agent orchestration — Cursor IDE

**Grok 4.6 High** standard / not Fast (default orchestrator) plans in Cursor Agent chat. **`cursor-grok-4.6-low[fast=false]`** workers run as subagents with explicit `model:` pins in `.cursor/agents/`. Other orchestrators (Fable 5, Sonnet 5, GPT-5.6 Sol) work the same way. Both Grok variants stay on **standard speed** — Fast is the Grok 4.6 default on Pro+ and must be turned off.

---

## What goes where

| Piece                 | Location                                       | How it gets there                                                      |
| --------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| Procedure + templates | fixmyskills `agent-orchestration`              | Skills CLI → `.agents/skills/`                                         |
| Worker model pins     | `.cursor/agents/implementer.md`, `verifier.md` | `init-cursor.sh`                                                       |
| Orchestrator behavior | `.cursor/rules/orchestrator-worker.md`         | `init-cursor.sh`                                                       |
| Parent model          | Cursor Agent model picker                      | You pick an orchestrator each session                                  |
| Personal workers      | `~/.cursor/agents/`                            | Manual copy — see [cursor-personal-setup.md](cursor-personal-setup.md) |

```mermaid
flowchart LR
  Orch["Orchestrator\nGrok 4.6 High[fast=false]"]
  Rule["@orchestrator-worker"]
  Workers[".cursor/agents\ncursor-grok-4.6-low[fast=false]"]
  Orch --> Rule --> Workers
```

Skills CLI does **not** install `.cursor/agents/` — run `init-cursor.sh` after `bunx skills add`.

---

## Bootstrap (one-time per repo)

```bash
bunx skills add FixMyBerlin/fixmyskills --skill agent-orchestration -a cursor -y
bash .agents/skills/agent-orchestration/scripts/init-cursor.sh
git add .cursor/agents .cursor/rules skills-lock.json
git commit -m "Add Cursor agent orchestration setup"
```

`TARGET_REPO=/path` overrides destination.

Reset templates: re-run `init-cursor.sh` (overwrites).

---

## Picking an orchestrator

| Model                | Good for                                                                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Grok 4.6 High** ⭐ | **Default.** Smart work: long-running, multi-step orchestration. Frontier intelligence in the Fable/Opus class. Cursor Models pool. Use **standard speed** (`cursor-grok-4.6-high[fast=false]`), not Fast. |
| **Fable 5**          | Complex, long-running, multi-step agentic work; third-party pool                                                                                                                                           |
| **Sonnet 5**         | Everyday coding with strong multi-step reasoning and reliable tool use                                                                                                                                     |
| **GPT-5.6 Sol**      | Long-running agent work; can over-delegate on mid-sized tasks — keep one `/implementer` per cohesive task                                                                                                  |

Workers stay on **`cursor-grok-4.6-low[fast=false]`** regardless of orchestrator choice. Low effort at standard speed is Composer-priced grunt work with stronger results than Composer 2.5.

---

## Daily usage

1. Pick **Grok 4.6 High** as orchestrator, **standard / not Fast** (or Fable 5 / Sonnet 5 / GPT-5.6 Sol).
2. Attach **`@orchestrator-worker`** and state your task — nothing else required:

```
@orchestrator-worker
Fix the parking map zoom bug.
```

The rule is the complete orchestration instruction. Do **not** paste delegation boilerplate ("orchestrate only", "omit Task model", etc.) — those live in `.cursor/rules/orchestrator-worker.md`.

Workers use **`cursor-grok-4.6-low[fast=false]`** automatically via `.cursor/agents/` frontmatter.

**Skip** `@orchestrator-worker` for trivial one-file edits — subagent startup costs more than inline work.

---

## Delegation

| Task                                       | Delegate to                    |
| ------------------------------------------ | ------------------------------ |
| Codebase search                            | Built-in `explore`             |
| Edits, tests, installs, state-changing git | `/implementer`                 |
| Read-only diagnostics (logs, status)       | Built-in `bash`                |
| Post-change validation                     | `/verifier` (readonly)         |
| Browser / UI                               | `browser` or agent-browser MCP |

Invocation: `/implementer [scoped brief]`, `/verifier [what to prove]`. For parallel work, send multiple subagent Task calls in one message.

Orchestrator may inline only trivial fixes (~10 lines) or when user says "no subagents".

---

## Worker model pins

`.cursor/agents/` frontmatter: `model: cursor-grok-4.6-low[fast=false]`. Verifier adds `readonly: true`. **Avoid** `inherit` on workers — bills at your orchestrator's High rate. **Avoid Fast** — Grok 4.6 Fast is the Pro+ default.

### Task tool vs frontmatter

Passing any inline `model` on `/implementer` or `/verifier` **overrides** the frontmatter pin. Task's allowed list includes Fast and High slugs — an inline override can silently enable Fast or upgrade cost.

**Fix:** when spawning custom workers, use `subagent_type: implementer` or `verifier` and **omit `model` entirely**. The frontmatter pin then applies `cursor-grok-4.6-low[fast=false]`.

| Spawn style                                  | `model` on Task call | Result                               |
| -------------------------------------------- | -------------------- | ------------------------------------ |
| `/implementer`, no inline model              | omitted              | `cursor-grok-4.6-low[fast=false]` ✅ |
| Task + `model: inherit`                      | set                  | orchestrator High rate ❌            |
| Task + `model: cursor-grok-4.6-low` (no pin) | set                  | may default to Fast ❌               |
| Task + `model: composer-2.5-fast`            | set                  | Composer fast ❌                     |
| `generalPurpose` + inline model              | set                  | bypasses worker pin ❌               |

Built-in `explore` is for search only and does **not** read `.cursor/agents/` frontmatter — it uses Cursor's own default. Still **omit** Task inline `model` for explore. For `/implementer` and `/verifier`, omit `model` so the frontmatter pin `cursor-grok-4.6-low[fast=false]` applies.

Parallel subagents = parallel token spend. Cursor may fall back from a pinned worker model when blocked by admin, unavailable Max Mode, or plan limits.

---

## Customize & verify

- Edit copied files in the target repo (`verifier.md` check commands, rule delegation for MCP, etc.). Do **not** put orchestration in global Cursor User Rules — attach `@orchestrator-worker` per task (rule only; no boilerplate in the prompt).
- Optional one-liner in `AGENTS.md`: point at `.cursor/rules/orchestrator-worker.md` (`@orchestrator-worker`) — not this long guide.
- Verify: `@orchestrator-worker` in rule picker; attaching it alone switches parent to orchestrate-only; `/implementer` and `/verifier` show `cursor-grok-4.6-low[fast=false]` in frontmatter; parent is Grok 4.6 High **not Fast**; parent spawns workers **without** Task inline `model`.

---

## References

- [Cursor Subagents](https://cursor.com/docs/subagents)
- [Grok 4.6](https://cursor.com/docs/models/grok-4-6)
- [Claude Fable 5](https://cursor.com/docs/models/claude-fable-5)
- [Claude Sonnet 5](https://cursor.com/docs/models/claude-sonnet-5)
- [GPT-5.6 Sol](https://cursor.com/docs/models/gpt-5-6-sol)
- Prototype: tilda-geo commit `9572b85`
