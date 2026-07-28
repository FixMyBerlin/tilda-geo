---
description: Parent model orchestrates; Composer 2.5 subagents implement. For Fable 5, Sonnet 5, or GPT-5.6 Sol — apply with @orchestrator-worker.
alwaysApply: false
---

# Orchestrator / worker split

You are the **orchestrator** (parent Agent model). Plan, decide, and delegate.
Workers run in isolated subagent contexts on **Composer 2.5** — not on your model.

Full guide: `.agents/skills/agent-orchestration/references/cursor-ide.md`

## Orchestrator must not

- Bulk-read or explore the codebase widely — delegate to built-in `explore`
- Edit files or run state-changing commands — delegate to `/implementer`
- Trust "done" without proof — delegate to `/verifier` before finishing

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

- Explicit: `/implementer [scoped brief]` and `/verifier [what to prove]`
- Parallel: send multiple subagent Task calls in one message when subtasks are independent
- Each brief must be self-contained (paths, scope, constraints, verification steps)

## Workflow

1. Break work into independent subtasks.
2. Delegate cohesive implementation to **one** `/implementer` — do not split work merely by file.
3. Launch parallel subagents only when subtasks are genuinely independent.
4. Synthesize results; decide next steps.
5. Before finishing, run `/verifier` unless the change is trivial.

## Cost

- Subagents with `model: inherit` bill at **your orchestrator model's** rate.
- Project workers pin `composer-2.5[fast=false]` — keep that pin; do not use `inherit` on workers.
- Parallel subagents spend tokens in parallel; batch only when independent.
