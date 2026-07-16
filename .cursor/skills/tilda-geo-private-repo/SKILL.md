---
name: tilda-geo-private-repo
description: >-
  Two-remote workflow between public FixMyBerlin/tilda-geo (origin) and private
  FixMyBerlin/tilda-geo-private (private). Use when pushing experimental branches
  privately, syncing develop, or opening PRs back to the public repo.
---

# Private experimental repo (two remotes)

Use when work should stay off the public repo until ready for review, or when syncing `develop` between the two mirrors.

## When to use

- Start an experimental branch without publishing it on `origin`
- Keep a private mirror of `develop` up to date
- Bring finished work back to the public repo via PR on `develop`
- Test a public branch (e.g. Dependabot) in the private mirror first

## Remotes

| Remote    | URL                                                |
| --------- | -------------------------------------------------- |
| `origin`  | `git@github.com:FixMyBerlin/tilda-geo.git`         |
| `private` | `git@github.com:FixMyBerlin/tilda-geo-private.git` |

### One-time setup (main checkout)

```bash
git remote add private git@github.com:FixMyBerlin/tilda-geo-private.git
```

`git remote add private` in the **main checkout** is enough — all sibling worktrees share the same `.git` store.

Initial mirror (one-time, from any checkout with both remotes):

```bash
git push private --all
git push private --tags
```

**Branch policy:** `tilda-geo-private` keeps only `develop` plus branches you explicitly push (e.g. `experiment/*`). Do **not** run `git push private --all` — sync individual branches or `origin/develop:develop` instead.

## Agent rules

- **Never** copy deploy secrets (SSH, ECR, DB) into `tilda-geo-private`
- **Never** commit `.env`, credentials, or real secrets
- **PR target** is always `develop` on `origin` (`FixMyBerlin/tilda-geo`)
- **CI** runs in both repos; **deploy** runs only on `FixMyBerlin/tilda-geo` (see deploy guard below)
- **Branch naming** for private-only work: `experiment/` or `priv/` prefix

## Recipes

### A) Start an experimental branch privately

```bash
git fetch origin develop
git checkout -b experiment-xyz origin/develop
# ... work ...
git push -u private experiment-xyz
```

### B) Sync public `develop` into the private mirror

```bash
git fetch origin develop
git push private origin/develop:develop
```

Or merge into your experiment branch first:

```bash
git checkout experiment-xyz
git merge origin/develop   # resolve conflicts here
git push private experiment-xyz
```

### C) Bring finished work back to the public repo

```bash
git fetch private experiment-xyz
git push origin experiment-xyz

gh pr create --repo FixMyBerlin/tilda-geo \
  --base develop \
  --head experiment-xyz \
  --title "…" \
  --body "…"
```

After merge, optionally mirror `develop` back:

```bash
git fetch origin develop
git push private origin/develop:develop
```

### D) Mirror a public branch to private (e.g. Dependabot)

```bash
git fetch origin dependabot/…
git push private origin/dependabot/…:dependabot/…
```

## Limitations

- **No cross-repo PRs** — GitHub cannot open a PR on `origin` until the branch is pushed there
- **No auto-sync** — every branch sync is a deliberate `fetch` + `push` (or merge/rebase)
- **Branch visibility** — once pushed to `origin`, the branch name and commits are visible before merge
- **Issues, PRs, Dependabot, secrets** do not sync between repos

## Deploy guard

Deploy workflows are gated with `if: github.repository == 'FixMyBerlin/tilda-geo'` in:

- `.github/workflows/deploy.staging.yml`
- `.github/workflows/deploy.production.yml`
- `.github/workflows/deploy-force.yml`
- `.github/workflows/generate-tiles.production.yml`
- `.github/workflows/generate-tiles.staging.yml`
- `.github/workflows/generate-maproulette-tasks.production.yml`

CI (`.github/workflows/ci.yml`) runs in both repos. Do not add deploy secrets to the private repo.

## Worktrees

Sibling worktrees (`../tilda-geo--my-branch/`) share remotes with the main checkout. After one-time `git remote add private` in the main checkout, all worktrees can `git push private …`.

## Agent checklist

```
- [ ] Private experiment? -> load this skill; use `experiment/` or `priv/` branch prefix
- [ ] Remote missing? -> `git remote add private git@github.com:FixMyBerlin/tilda-geo-private.git` (main checkout once)
- [ ] Before starting work -> `git fetch origin develop`
- [ ] Before opening PR -> sync with `origin/develop`; push branch to `origin`; PR base = `develop`
- [ ] After merge -> optional `git push private origin/develop:develop`
- [ ] Never copy deploy secrets to `tilda-geo-private`
```
