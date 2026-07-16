---
name: cursor-worker-implement
description: >-
  Runs bounded implementation via cursor-agent CLI with Composer 2.5. Use when
  Fable has a clear plan and bulk edits, migrations, or multi-file work should
  not run on Fable tokens. Requires cursor-agent on PATH and Cursor subscription.
user-invocable: true
disable-model-invocation: true
---

# Cursor worker — implement

Parent (Fable) orchestrates; **Composer** executes via `cursor-agent`. Do not prompt `cursor-agent` like Claude — use a **self-contained** brief (paths, scope, constraints, verification).

## Prerequisite

```bash
which cursor-agent   # must exist; uses Cursor subscription auth
```

## Workflow

1. Confirm scope with the user if ambiguous.
2. Write a self-contained prompt (repo root, files, acceptance criteria).
3. Run from repo root:

```bash
REPO="$(git rev-parse --show-toplevel)"
cursor-agent -p --force --output-format json \
  --workspace "$REPO" \
  --model composer-2.5 \
  "YOUR_SELF_CONTAINED_PROMPT"
```

4. Parse JSON stdout; summarize files changed, commands run, blockers.
5. If the parent needs proof, load `cursor-worker-review` or run project checks.

`--force` auto-approves edits/shell (headless has no prompt to answer); `--trust` alone only trusts the workspace. Add `--worktree <slug>` for parallel edits that must not collide. Default model `composer-2.5` (not `-fast` unless asked).

## Timeouts

Long runs may exceed the parent shell timeout. For multi-hour work: run in background, log to a file, poll for completion.

## When parent should use this

- Clear-spec implementation, refactors, migrations, repetitive edits
- Parent should **not** bulk-edit when this skill is available
