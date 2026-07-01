---
name: finish-work
description: >-
  Run FMC pre-commit verification (bun run check), fix failures, and draft
  English commit messages with user-focused body bullets and conversation
  context. Use when finishing a task, wrapping up changes, preparing to commit,
  running checks/tests/lint/typecheck/e2e, or when the user asks to "finish work",
  "run checks", or "create a commit message".
---

# Finish work

Standard FMC workflow before committing. Run commands in the **project root** (or the package that owns the changed code in a monorepo).

## Checklist

```
- [ ] bun run check
- [ ] Fix any failures; re-run until green
- [ ] Stage lint/format fixes with the functional changes (one commit)
- [ ] Draft commit message (see below)
- [ ] Commit only when the user explicitly asks
```

**Lint/format fixes:** `check` may rewrite files via `lint` / `format`. Always stage those together with the functional work — not a separate “lint” or “format” commit.

If the change is **already committed** and a later `check` only produced lint/format fixes, fold them into that commit (`git commit --amend --no-edit`) when the user wants to commit/amend and HEAD is still local (not pushed). Otherwise stage and let the user decide.

## `bun run check`

Runs the aggregate `check` script from `package.json` (usually `bun run --parallel …`). Read `scripts.check` in the target package.

Commonly includes `type-check`, `lint`, `format`, `test` / `test-run` — `lint` and `format` apply fixes in write mode where wired (`--fix`, `--write`).

**E2E:** `e2e` is not part of `check` in these repos. If the change touches UI, routes, or auth, also run `bun run e2e` (or `bun run check-full` on trassenscout). See [playwright-skill](../playwright-skill/SKILL.md).

On failure: fix the root cause, then re-run `bun run check`. Do not skip failing steps.

## Commit message

Draft when checks pass. **Do not commit** unless the user explicitly requests it.

### Subject

```
<Topic>: <Desc>
```

- **Topic** — area or scope (`Map`, `Auth`, `Processing`, `Dev`, …). Match repo conventions when obvious from the diff. FMC apps (e.g. tilda-geo): use **`Dev`** for internal-only work (deps, CI, tooling).
- **Desc** — imperative, concise summary of the outcome (not a list of files).

### Body

Bullet list of **meaningful, user-facing changes** — what is different for people using the product after this commit. Not a recap of the diff.

**Write bullets that:**

- Describe **behavior users see, do, or get** (UI, map, export, login, copy, performance they notice) — or, for internal-only work, what operators/admins experience differently.
- State **why** when the conversation established it (bug report, design decision, constraint, follow-up to an issue) — the story behind the change, not invented detail.
- Stay at outcome level: prefer “map zooms to the region bounds when switching regions” over “call fitBounds in RegionLoader”.

**Do not:**

- List files, symbols, refactors, or line-level edits visible in `git diff`.
- Repeat the subject as a longer sentence.
- Dump implementation steps unless they are the only user-visible effect.

Well-written English bodies are the main input for skill `user-changelog` (weekly German release notes) — subject + body should be enough without reading the patch.

```
- Users: map zooms to the region bounds when switching regions (reported confusing default view)
- Skip clamp when URL already has explicit zoom so shared links stay stable
- Fix: session data still shown after logout until refresh
```

Purely internal changes (deps, CI, types-only): bullets can describe maintainer impact briefly; omit user bullets when nothing user-visible changed.

### PR / issue ping

If the user mentioned a GitHub PR or issue in the conversation, add a **Ping** line in the body with the full URL:

```
Ping https://github.com/FixMyBerlin/tilda-geo/pull/1234
```

Use the exact URL from context (PR or issue). One Ping line per referenced item.

### Example

```
Region map: clamp initial viewport to bounds

- Users: map fits the selected region on load instead of a generic Germany view (confusing on deep links)
- Preserve explicit zoom in URL so shared map links do not jump
- Fix: logout left stale region list until hard refresh
Ping https://github.com/FixMyBerlin/tilda-geo/issues/5678
```

Internal-only example (no user-visible change):

```
Dev: bump oxlint for compat plugin

- CI: compat lint rules for optional chaining targets
```

## Monorepos

Run `check` in each package you changed (`app/`, `processing/`, etc.) when scripts live per package.

## Related

- [tech-stack](../tech-stack/SKILL.md) — TypeScript 7 RC + editor alignment
- [tech-stack](../tech-stack/SKILL.md) — Oxlint/oxfmt setup → [oxc-config.md](../tech-stack/references/oxc-config.md)
- [playwright-skill](../playwright-skill/SKILL.md) — E2E
- Dependabot merge follow-up: skill `babysit` · [review-dependabot](../review-dependabot/SKILL.md)
- [user-changelog](../user-changelog/SKILL.md) — Weekly end-user changelog (reads commit bodies)
