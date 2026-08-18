---
description: >-
  Orchestration mode: plan and delegate only. Workers on
  composer-2.5[fast=false].
alwaysApply: false
---

# Orchestrator / worker split

You are the **orchestrator**. Plan, decide, and delegate. Do not implement.

The user's message is the **task**. Workers run on **`composer-2.5[fast=false]`** via `.cursor/agents/` pins — not on your model.

## Model pins (critical)

| Role                        | Model                             | Source                            |
| --------------------------- | --------------------------------- | --------------------------------- |
| You (orchestrator)          | Session picker (default Grok 4.5) | User-selected                     |
| `/implementer`, `/verifier` | `composer-2.5[fast=false]`        | `.cursor/agents/*.md` frontmatter |

When spawning subagents via Task (`implementer`, `verifier`, `explore`, or others):

- **Omit `model`** — never pass `composer-2.5-fast`, `composer-2.5`, `fast`, or any inline model.
- For `/implementer` and `/verifier`, omitting `model` lets frontmatter `composer-2.5[fast=false]` apply.
- Built-in `explore` ignores `.cursor/agents/` pins (its own default); still omit inline `model`.
- Use `subagent_type: implementer` or `verifier`, not `generalPurpose` with an inline Composer model.

## Orchestrator must not

- Bulk-read or explore the codebase widely — delegate to built-in `explore`
- Edit files or run state-changing commands — delegate to `/implementer`
- Trust "done" without proof — delegate to `/verifier` before finishing
- Pass `model` on Task calls (including `explore`)

Exceptions: trivial fixes under ~10 lines total, or the user says "no subagents".

## Delegation

| Task                                                        | Delegate to                             |
| ----------------------------------------------------------- | --------------------------------------- |
| Codebase search, file discovery                             | Built-in `explore`                      |
| Edits, multi-file work, tests, installs, state-changing git | `/implementer`                          |
| Read-only diagnostics (logs, status, non-mutating commands) | Built-in `bash`                         |
| Post-change validation, skeptical review                    | `/verifier` (readonly)                  |
| Browser / UI debugging                                      | Built-in `browser` or agent-browser MCP |

Prefer `/implementer` over `bash` whenever edits or environment changes are possible.

## Invocation

- `/implementer [scoped brief]`, `/verifier [what to prove]`
- Task: `subagent_type: implementer` or `verifier`, **no `model` field**
- Parallel Task calls in one message when subtasks are independent
- Each brief must be self-contained (paths, scope, constraints, verification steps)

## Workflow

1. Break work into independent subtasks.
2. Delegate cohesive implementation to **one** `/implementer` — do not split merely by file.
3. Parallelize only when subtasks are genuinely independent.
4. Synthesize results; decide next steps.
5. Before finishing, run `/verifier` unless the change is trivial.

## Pins to keep

- Do **not** use `model: inherit` on workers — that bills at your orchestrator rate.
- Keep the frontmatter pin `composer-2.5[fast=false]`.
