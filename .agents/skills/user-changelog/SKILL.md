---
name: user-changelog
description: >-
  Weekly end-user release notes from Git commits — German prose in
  docs/user-changelog.md, not a technical changelog. Reads commit subjects
  and bodies; diffs only when needed. SHA boundaries in section headings avoid
  duplicate work. Use for user changelog, weekly user summary, end-user
  release notes, or Nutzer-Zusammenfassung.
disable-model-invocation: true
---

# User changelog (end-user release notes)

Weekly workflow: summarize changes since the last run as plain German bullet points — **only** what end users can see, do, or notice. Not a technical changelog.

If there are **pending changes** when done (e.g. `docs/user-changelog.md`), use [finish-work](../finish-work/SKILL.md) to run `bun run check` and draft the English commit message before committing.

## File

[`docs/user-changelog.md`](references/user-changelog.md) in the project (structure reference; adjust path per project once).

Each run prepends a new section at the **top**. SHA boundaries live in the heading — no separate state file.

## Checklist

```
- [ ] Step 1: Resolve last SHA boundary
- [ ] Step 2: Build commit list (from → to)
- [ ] Step 3: Triage commits from subject/body (diff only if needed)
- [ ] Step 4: Write user-facing bullets in German
- [ ] Step 5: Prepend new section to docs/user-changelog.md
- [ ] Step 6: Commit/push only when the user explicitly asks
```

## Step 1: Last SHA boundary

Read [`docs/user-changelog.md`](references/user-changelog.md) (project path). The top heading is fixed — parsing is straightforward; no script required.

```markdown
## Zusammenfassung von `abc1234` bis `def5678` (2025-06-30)
```

- **Start this run:** `def5678` (`bis` from the latest section)
- **End:** `HEAD` — omit in `git log` (`<FROM>..`); use `git rev-parse --short HEAD` for the new heading’s `bis` SHA

To resolve `FROM` before `git log` (optional — same result as reading the file):

```bash
FROM=$(grep -m1 '^## Zusammenfassung von' docs/user-changelog.md 2>/dev/null \
  | sed -E 's/.*bis `([^`]+)`.*/\1/')
# FROM empty → first run (ask user for a start SHA/tag/range)
```

**First run** (`FROM` empty — file missing, empty, or no heading): ask the user — e.g. since tag `v1.2.0`, last 2 weeks, or an explicit SHA. Do not guess.

## Step 2: Commit list

`FROM..` with no right side means through `HEAD` (same as `FROM..HEAD`).

Use **`--reverse`** (oldest first): work landed in that order, follow-up commits for the same feature usually come later, and merging several commits into one bullet is easier when reading forward in time. Write bullets in the same order.

```bash
git log "${FROM}".. --no-merges --reverse \
  --format='%h%n%s%n%b%n---'
```

Skip merge commits. Usually **omit** Dependabot, CI-only, format, and lint commits unless the message clearly describes user-visible impact.

## Step 3: Relevance — title first, diff rarely

Per commit:

1. **Read subject + body** — usually enough; translate to German in Step 4. Open the diff only when the message is unclear.
2. **Include** when end users can **see, do, or understand** something differently (UI, maps, export, login, noticeable performance, new capability, visible bugfix).
3. **Omit:** refactors, tests, types, deps, internal APIs, migrations with no visible effect, developer-only docs.
4. **Diff only** when the commit message is unclear or contradictory — then `git show <sha> --stat` or targeted UI paths, not the full patch.

Merge multiple commits into **one** bullet when they describe the same visible change.

## Step 4: Wording (German, end-user)

Write bullets in **German**:

- Active voice, short, no jargon (no “refactor”, “loader”, “PR”, package names).
- **Area prefix** when it helps scanning — e.g. **Karte:**, **Export:**, **Anmeldung:**. In a **monorepo**, one shared `docs/user-changelog.md`; use the prefix for the package or surface (e.g. **Processing:** for `processing/`, **Karte:** for the app map UI).
- Fixes: describe the user-visible problem, not the broken code.
- No issue/PR numbers, author names, or SHAs inside bullets.

Good and bad examples: [examples.md](references/examples.md).

## Step 5: New section

**Prepend** to `docs/user-changelog.md` (newest period first). Use this **German** template:

```markdown
## Zusammenfassung von `def5678` bis `f0a1b2c` (2025-07-07)

- **Karte:** Beim Zoomen bleibt die gewählte Region sichtbar.
- **Export:** GeoJSON-Download enthält wieder alle Eigenschaften.
- Behoben: Nach dem Abmelden wurde die Karte nicht aktualisiert.
```

- Date = run date (not per-commit dates).
- Short SHAs in backticks in the heading.
- Blank line after the heading, then bullets.

## Step 6: Commit

Only when the user explicitly asks to commit — follow [finish-work](../finish-work/SKILL.md) for `bun run check` and the commit message:

```bash
git add docs/user-changelog.md
git commit -m "$(cat <<'EOF'
Docs: Update changelog notes

Summary def5678..f0a1b2c
EOF
)"
```

Changelog file content stays **German**; the commit subject/body for this doc update stays **English**.

## Notes

- **No duplicates:** do not repeat topics already covered in earlier sections, even if new commits touch the same files.
- **Empty week:** still add a section with: `Keine nutzerrelevanten Änderungen in diesem Zeitraum.` — update boundaries so the next run starts correctly.
- **Monorepos:** one changelog file for the repo — include all packages in `git log`. Disambiguate with area prefixes (**Processing:**, **Karte:**, …), not separate files per package.
- **Archive:** if the file grows too long, move older sections to `docs/archive/user-changelog-YYYY.md` — the top section and its `bis` SHA remain the anchor for the next run.

## Related

- [finish-work](../finish-work/SKILL.md) — check + commit when landing the changelog
- [review-dependabot](../review-dependabot/SKILL.md) — do not list Dependabot commits as user changes
