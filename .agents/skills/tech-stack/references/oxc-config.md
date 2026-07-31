# Oxlint / oxfmt defaults

Templates: [examples/oxfmt.config.mjs](../examples/oxfmt.config.mjs), [examples/oxlint.config.mjs](../examples/oxlint.config.mjs).

Derived from [tilda-geo](https://github.com/FixMyBerlin/tilda-geo) and [trassenscout](https://github.com/FixMyBerlin/trassenscout). Copy on scaffold; tune `ignorePatterns`, `sortTailwindcss.stylesheet`, and overrides for your layout.

## Commonly tuned per project

Most FMC apps share the same core (plugins, type-aware lint, switch exhaustiveness, React Compiler + hooks on `**/*.tsx`, Prettier-style options). These are the usual intentional divergences:

- **`singleQuote`** — template defaults to `true`; flip to match an existing codebase.
- **`ignorePatterns`** — keep oxlint and oxfmt in sync; add generated paths or tool folders for your repo layout.
- **`sortTailwindcss.stylesheet`** — point at your global CSS entry.
- **Custom oxlint `jsPlugins`** — e.g. TanStack Start auth-boundary rules; see skill `tanstack-start-auth` → [endpoint-auth-lint.md](../../tanstack-start-auth/references/endpoint-auth-lint.md).
- **`eslint-plugin-compat`** — `compat/compat` on client-shipped paths; scoped override in [browser-target.md](browser-target.md). JS-plugin load issues under Bun `globalStore`: [bun-install.md](bun-install.md).

## React Compiler

Use oxlint's native **`react/react-compiler`** on `**/*.tsx` — not `eslint-plugin-react-compiler`. Hooks via `eslint-plugin-react-hooks` jsPlugin; see [examples/oxlint.config.mjs](../examples/oxlint.config.mjs). Component conventions: skill `react-dev`.

## Type-aware linting

- Root config: `options: { typeAware: true }` (FMC template default — no `--type-aware` CLI flag in scripts).
- Add **`oxlint-tsgolint@7`**; pin with `oxlint`. Version tracks TypeScript (e.g. `7.0.2001`).
- Keep **`tsc --noEmit`** separate — do not set `options.typeCheck` or use `oxlint --type-check`.
- Noisy type-aware rules: commented in [examples/oxlint.config.mjs](../examples/oxlint.config.mjs); [tilda-geo](https://github.com/FixMyBerlin/tilda-geo/blob/develop/app/oxlint.config.mjs) for production overrides.

## Scaffold packages

Pin together across apps:

```json
{
  "devDependencies": {
    "eslint-plugin-react-hooks": "^7.1.1",
    "oxfmt": "0.56.0",
    "oxlint": "1.70.0",
    "oxlint-config-react-hooks-js": "^1.1.3",
    "oxlint-tsgolint": "7.0.2001"
  }
}
```

Lint/format **scripts** and `check` orchestrators: [package-json-scripts.md](package-json-scripts.md).

## Editor (VS Code / Cursor)

Extension `oxc.oxc-vscode`. Merge with [examples/vscode.settings.typescript.json.template](../examples/vscode.settings.typescript.json.template). Monorepos: config paths and binaries under the app package — [tilda-geo `.vscode/settings.json`](https://github.com/FixMyBerlin/tilda-geo/blob/develop/.vscode/settings.json).

```json
{
  "oxc.fixKind": "dangerous_fix_or_suggestion",
  "oxc.typeAware": true,
  "oxc.path.tsgolint": "./app/node_modules/.bin/tsgolint",
  "editor.codeActionsOnSave": {
    "source.format.oxc": "always",
    "source.fixAll.oxc": "always",
    "source.fixAllDangerous.oxc": "always"
  }
}
```
