# package.json script names

Template: [examples/package-json-scripts.md.template](../examples/package-json-scripts.md.template).

Copy to `.cursor/rules/package-json-scripts.md` on scaffold; tune per app layout.

## Policy

| Rule                   | Detail                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Standalone scripts** | kebab-case, no `:` — e.g. `type-check`, `lint-check`, `format-check`, `migrate-check`                                  |
| **Colon groups**       | `:` for Bun group steps — `bun run --parallel <group>:*` or `bun run --sequential <group>:*`                           |
| **Step naming**        | `<group>:<step>`; numeric prefix when order matters — `predev:2migration`                                              |
| **Orchestrators**      | `check`, `check-ci`, `check-pre-push` list leaf scripts in `--parallel`; do not nest `check-ci:*` or wrap `check && …` |
| **Lifecycle hooks**    | Avoid accidental `pre<script>` / `post<script>` names                                                                  |

Bun docs: [script filtering](https://bun.sh/docs/cli/run#filtering).

## Verify scripts (canonical)

Who runs what — agents and docs only reference these names:

| Script               | Who runs it                                           | Role                                                                                                  |
| -------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **`check`**          | [finish-work](../../finish-work/SKILL.md) skill       | **Mutating** — `--parallel type-check lint format test-run [knip-warn]`                               |
| **`check-ci`**       | CI (`bun run check-ci`)                               | **Read-only** — `--parallel type-check lint-check format-check test-run` (reuses leaf scripts)        |
| **`check-pre-push`** | husky [pre-push](../examples/husky/pre-push.template) | **Mutating** — parallel leaves; swap in repo-specific steps (e.g. `type-check-deploy`, strict `knip`) |
| **`check-full`**     | Optional (e.g. trassenscout)                          | `check-pre-push` then `e2e`                                                                           |

Without Knip: drop `knip-warn` from `check` and `knip` from `check-pre-push` (often identical to `check`).

**Monorepos / repo tails:** extend `check-pre-push` leaves in `package.json` (topic-docs regen, `processing/` check, `migrate-check-test`) — not in husky prose. Do not compose `check-pre-push` from `check && …`; list the leaves directly so substitutions stay explicit.

### Scaffold (with Knip)

Oxlint/oxfmt leaves: [oxc-config.md](oxc-config.md). Knip config: [knip.md](knip.md).

```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "lint": "oxlint --fix --fix-dangerously --deny-warnings -c oxlint.config.mjs .",
    "lint-check": "oxlint --deny-warnings -c oxlint.config.mjs .",
    "format": "oxfmt --write -c oxfmt.config.mjs .",
    "format-check": "oxfmt --check -c oxfmt.config.mjs .",
    "test-run": "vitest run --passWithNoTests",

    "check": "bun run --parallel type-check lint format test-run knip-warn",
    "check-ci": "bun run --parallel type-check lint-check format-check test-run",

    "knip": "KNIP_STRICT=1 knip --config knip.config.mjs",
    "knip-warn": "knip --config knip.config.mjs || true",
    "check-pre-push": "bun run --parallel type-check lint format test-run knip"
  }
}
```

Multi-path lint/format (tilda-geo style): write-mode uses `lint: "bun run --parallel lint:*"` and `format: "bun run --parallel format:*"`. CI read-only reuses flat `lint-check` / `format-check` leaves, or `lint-check: "bun run --parallel lint-check:*"` when CI must verify every path — not a `check-ci:*` namespace.

## Scaffold setup

```bash
mkdir -p .cursor/rules
cp path/to/package-json-scripts.md.template .cursor/rules/package-json-scripts.md
```
