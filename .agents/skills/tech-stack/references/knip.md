# Knip (explicit deps)

Load for knip config, `knip` / `knip-warn` scripts, or husky pre-push scaffold.

**Templates:** [knip.config](../examples/knip.config.mjs.template) · [husky pre-push](../examples/husky/pre-push.template) · [ensure-bun.sh](../examples/husky/ensure-bun.sh.template)

**Verify orchestrators** (`check`, `check-pre-push`): [package-json-scripts.md](package-json-scripts.md).

## Decisions (not in templates)

- Advisory **`knip-warn`** (`|| true`) runs inside mutating **`check`**; strict **`knip`** runs in **`check-pre-push`** — not in read-only **`check-ci`**
- [Phantom deps](bun-install.md) are bugs inside third-party `node_modules`; Knip catches **your** unlisted imports

## Customize the template

Copy [knip.config.mjs.template](../examples/knip.config.mjs.template) → project-root `knip.config.mjs`. Tune before first green run — defaults target TanStack Start `app/` layout.

| Key                  | What it does                                                                                 | How to tune                                                                                                                                                                       |
| -------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`entry`**          | Roots Knip traces from — importers of deps/exports. Missing entry → false “unused file/dep”. | Keep app entrypoints: router, route files, tests, `scripts/`, seeds. Add config files Knip plugins miss (`vite.config.ts`, `playwright.config.ts`). Drop globs that do not exist. |
| **`paths`**          | Import alias → filesystem mapping for **unlisted** resolution.                               | Knip already reads `tsconfig` `compilerOptions.paths`. **Omit `paths`** when aliases live only in tsconfig. Add entries only for Vite/webpack aliases **not** in tsconfig.        |
| **`ignoreBinaries`** | CLI names used in scripts but not npm deps — suppresses false “unlisted binary”.             | Keep dev tools you shell out to (`gh`, `rg`, `code`). Add project CLIs; remove names you never invoke.                                                                            |
| **`ignore`**         | Skip analysis for matched paths entirely.                                                    | `.agents/**` for agent scratch. Add generated output dirs if needed — prefer `ignoreFiles` for “unused file” only.                                                                |

[Knip config reference](https://knip.dev/reference/configuration).
