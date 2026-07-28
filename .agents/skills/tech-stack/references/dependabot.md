# Dependabot defaults

Template: [examples/dependabot.yml.template](../examples/dependabot.yml.template).

Derived from [tilda-geo](https://github.com/FixMyBerlin/tilda-geo/blob/develop/.github/dependabot.yml). Copy to `.github/dependabot.yml` on scaffold; tune groups and directories for your repo.

## Policy

| Setting                    | Value                              | Why                                                                       |
| -------------------------- | ---------------------------------- | ------------------------------------------------------------------------- |
| Schedule                   | Weekly, Monday 07:00 Europe/Berlin | Predictable review window; avoids daily noise                             |
| `open-pull-requests-limit` | `1` per ecosystem                  | One active Dependabot PR at a time — merge or close before the next opens |
| `cooldown.default-days`    | `5`                                | Version updates wait before a PR opens; security updates are not delayed  |
| Bun groups                 | dev / framework / misc patch       | Bundles related bumps; security updates still get their own group         |

Major version bumps are not grouped — they surface as individual PRs when no other PR is open. With weekly schedule + cooldown, a new release may not get a PR until the next run after the cooldown period.

## Scaffold setup

```bash
mkdir -p .github
cp path/to/dependabot.yml.template .github/dependabot.yml
```

Knip / husky / verify scripts: [package-json-scripts.md](package-json-scripts.md) · [knip.md](knip.md).

## Commonly tuned per project

- **`browserslist` stack** — keep `browserslist`, `browserslist-to-esbuild`, and `eslint-plugin-compat` as direct `devDependencies` so weekly Bun PRs refresh `caniuse-lite`; Dependabot does not edit query strings — [browser-target.md](browser-target.md).
- **`directories`** — single-package apps use `/`. Monorepos list each Bun workspace root (tilda-geo: `/app`, `/processing`).
- **`groups`** — add patterns for project-specific packages; split or merge groups if PRs become too large or too fragmented.
- **`ignore`** — tilda-geo pins `nitro` (TanStack Start stack); drop or adjust if your deploy target changes.
- **`exclude-paths`** — extend for generated or vendored trees (`.cursor/**` is excluded by default).
- **Docker** — remove the `docker` ecosystem block if the repo has no `Dockerfile`; keep monthly schedule when present.

## Monorepo processing package

When a repo has a separate Bun package for geo/scripts work (tilda-geo `processing/`), add a group scoped to shared processing deps:

```yaml
processing-deps:
  applies-to: version-updates
  patterns:
    - '@date-fns/*'
    - '@turf/*'
    - 'date-fns'
    - 'geojson'
    - 'zod'
  update-types:
    - minor
    - patch
```

List `/processing` under `directories` alongside `/app`.
