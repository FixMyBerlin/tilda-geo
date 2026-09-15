---
name: tilda-geo-private-repo
description: >-
  Two remotes for the same TILDA code: public FixMyBerlin/tilda-geo (origin) and
  private FixMyBerlin/tilda-geo-private (private). Use when pushing the current
  local branch to the private repo and opening a PR there.
---

# Private experimental repo (two remotes)

TILDA exists as two GitHub repos with the same code. `origin` is public
(`FixMyBerlin/tilda-geo`). `private` is the experimental copy
(`FixMyBerlin/tilda-geo-private`).

Use this skill when the **current local branch** should get a PR on the private
repo. Do not create a new branch for that — the branch already exists. Prefer an
`experiment/` or `priv/` prefix on new private-only work; do not rename an
existing branch unless asked.

This skill’s PR target is **always** `FixMyBerlin/tilda-geo-private`. Do not
`git push origin` and do not open a PR on `FixMyBerlin/tilda-geo` unless the
user explicitly asks to publish.

## Remotes

| Remote    | URL                                                |
| --------- | -------------------------------------------------- |
| `origin`  | `git@github.com:FixMyBerlin/tilda-geo.git`         |
| `private` | `git@github.com:FixMyBerlin/tilda-geo-private.git` |

One-time, in the **main checkout** (sibling worktrees share the same `.git` store):

```bash
git remote add private git@github.com:FixMyBerlin/tilda-geo-private.git
```

`tilda-geo-private` keeps `develop` plus branches you explicitly push. Do **not**
run `git push private --all`.

## Private PR

Push the current branch to `private` and open the PR there. That is enough; the
branch does not need to exist on `origin`.

```bash
git push -u private HEAD

gh pr create --repo FixMyBerlin/tilda-geo-private \
  --base develop \
  --head "$(git branch --show-current)" \
  --draft \
  --title "…" \
  --body "…"
```

Drop `--draft` only if the user asked for a ready-for-review PR on the private
repo.

## Optional: publish the same branch on public TILDA

Only when the user asks to publish, open a public PR, or merge into TILDA.
GitHub cannot open a PR from `tilda-geo-private` into `tilda-geo`, so the branch
must exist on `origin` first.

```bash
git push -u origin HEAD

gh pr create --repo FixMyBerlin/tilda-geo \
  --base develop \
  --head "$(git branch --show-current)" \
  --title "…" \
  --body "…"
```

Pushing to `origin` makes the branch name and commits public before merge.

## Optional: refresh private `develop`

If the private PR’s base is stale:

```bash
git fetch origin develop
git push private origin/develop:develop
```

## Safety

- Never copy deploy secrets (SSH, ECR, DB) into `tilda-geo-private`
- Never commit `.env`, credentials, or real secrets
- CI runs in both repos; deploy runs only on `FixMyBerlin/tilda-geo`

## Agent checklist

```
- [ ] Remote missing? -> `git remote add private git@github.com:FixMyBerlin/tilda-geo-private.git` (main checkout once)
- [ ] `git push -u private HEAD`
- [ ] `gh pr create --repo FixMyBerlin/tilda-geo-private --base develop`
- [ ] Do not push `origin` unless the user asked to publish
```
