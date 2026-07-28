---
description: package.json scripts naming — colons only for parallel/sequential groups
globs: **/package.json
alwaysApply: false
---

<!-- Copy to .cursor/rules/package-json-scripts.md on scaffold — @see references/package-json-scripts.md -->

# package.json script names

Use `:` only for **step scripts** that belong to a group run via `bun run --parallel` or `bun run --sequential` with a glob (`<group>:*`).

## Colon groups (`<group>:<step>`)

- Parent script orchestrates: `bun run --parallel dev:*`, `bun run --sequential predev:*`, `bun run --sequential migrate-create:*`
- Step names use the group prefix: `dev:vite`, `predev:3docker`, `migrate-create:1write`
- Order steps with numeric prefixes when sequence matters: `predev:2dev-port`, `migrate-create:2format`

## Standalone scripts (no `:`)

One-off commands run directly — use kebab-case, no colon:

- `type-check`, `lint-check`, `format-check`, `migrate-check`, `setup-worktree`, `check-pre-push`

## Verify scripts

| Script | Role |
| --- | --- |
| `check` | finish-work — `--parallel type-check lint format test-run [knip-warn]` |
| `check-ci` | Read-only CI — `--parallel type-check lint-check format-check test-run` |
| `check-pre-push` | husky — parallel leaves (e.g. `type-check-deploy`, strict `knip`) |

Full scaffold: tech-stack skill → `references/package-json-scripts.md`.

## Prefer parallel groups over `&&`

Do **not** chain verify scripts with `&&` (e.g. `check && knip`). List leaf scripts in one `--parallel` orchestrator, or use `<group>:*` when a step has multiple paths.

Use `&&` only inside a single step when the shell must run multiple commands as one atomic action (rare — e.g. `type-check-deploy`).

## Examples

```json
// ✅ Group + steps
"dev": "bun run --parallel dev:*",
"dev:vite": "vite dev",

"seed": "bun run --sequential seed:*",
"seed:1ensure-env": "bun scripts/predev/ensureEnv.ts",
"seed:4migrate-reset": "bun --env-file=../.env --env-file=../.env.local prisma migrate reset --force",

// ✅ Verify — reuse leaf scripts, no check-ci:* namespace
"lint-check": "oxlint --deny-warnings -c oxlint.config.mjs .",
"check-ci": "bun run --parallel type-check lint-check format-check test-run",

// ✅ Standalone
"migrate-check": "prisma migrate status",

// ❌ && chain across verify scripts
"check-pre-push": "bun run check && bun run knip",

// ❌ Colon step without a parallel/sequential parent
"db:reset": "prisma migrate reset --force"
```

Prefer `db-reset` unless `db` is a real orchestrator that runs `db:*` in parallel or sequence.

## npm/bun lifecycle hooks

Scripts named `pre<script>` or `post<script>` run automatically before/after `<script>`. Avoid accidental hook names (e.g. `preseed` runs before `seed`). Use `seed-prepare` only if a separate entry point is truly needed.
