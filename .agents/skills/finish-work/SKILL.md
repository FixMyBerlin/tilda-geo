---
name: finish-work
description: >-
  FMC finish-work workflow: run bun run check, fix failures, commit with a
  user-facing English message by default, and only show a draft when the user
  clearly did not want a commit. Use for finish work, run checks, wrap up, land
  changes, or create commits.
---

# Finish work

Run in the project root, or in each changed monorepo package (`app/`, `processing/`, etc.).

## Workflow

1. Verify: read `scripts.check` in `package.json`, run `bun run check`, fix the root cause, and rerun until green. `lint`/`format` may rewrite files.
2. Keep fixes together: stage lint/format changes with the functional changes; never make a separate "lint" or "format" commit.
3. Write the commit message using the format below.
4. **Default: commit.** Run the commit path below unless the user clearly did not want a commit.
5. **Draft only when no-commit intent is clear.** Show the message and stop; do not run `git commit`.

No-commit intent includes: explicit deferral ("don't commit", "draft only", "message only", "what would the commit be"), check/fix-only asks ("run check", "fix lint", "fix CI" with no wrap-up), review or question-only turns, or the user saying they will commit themselves.

When intent is ambiguous, prefer committing — especially after implementing changes or when the user invoked finish-work to wrap up.

Commit path: `git status`, `git diff`, and `git log -5` in parallel; stage relevant files only; `git commit` via HEREDOC; `git status` to verify.

Safety: no push unless asked. No `--no-verify`. No amend of pushed commits. Do not stage secrets or unrelated dirty files.

Already committed and verify only fixed lint/format: `git commit --amend --no-edit` when HEAD has not been pushed; otherwise stage and ask before amending.

E2E is not in `check`. For UI/routes/auth changes, also run `bun run e2e` (or `check-full` when defined). See [playwright-skill](../playwright-skill/SKILL.md).

Script names: [package-json-scripts.md](../tech-stack/references/package-json-scripts.md).

## Commit message

```
<Topic>: <Desc>

- <user-facing outcome bullet>
Ping https://github.com/org/repo/pull/123
```

- **Topic:** scope (`Map`, `Auth`, `Processing`, `Dev`, etc.). FMC internal-only changes (deps, CI, tooling) use **`Dev`**.
- **Desc:** imperative outcome, not filenames.
- **Body:** bullets of what users/operators see, do, or get after this lands. Include why when the conversation established it. Stay at outcome level; do not list files, symbols, refactors, or diff steps. Bodies feed [user-changelog](../user-changelog/SKILL.md), so they must be readable without the patch.
- **Ping:** if user cited a PR/issue, add one `Ping <full-url>` line per item.

Example:

```
Region map: clamp initial viewport to bounds

- Users: map fits selected region on load instead of generic Germany view (confusing deep links)
- Preserve explicit zoom in URL so shared links do not jump
Ping https://github.com/FixMyBerlin/tilda-geo/issues/5678
```

Internal-only (no user-visible change): maintainer bullets ok; omit user bullets when none apply.

## Related

[playwright-skill](../playwright-skill/SKILL.md) | [tech-stack](../tech-stack/SKILL.md) | [review-dependabot](../review-dependabot/SKILL.md) / babysit | [user-changelog](../user-changelog/SKILL.md)
