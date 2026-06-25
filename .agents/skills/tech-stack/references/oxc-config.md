# Oxlint / oxfmt defaults

Templates: [examples/oxfmt.config.mjs](../examples/oxfmt.config.mjs), [examples/oxlint.config.mjs](../examples/oxlint.config.mjs).

Derived from [tilda-geo](https://github.com/FixMyBerlin/tilda-geo) and [trassenscout](https://github.com/FixMyBerlin/trassenscout). Copy on scaffold; tune `ignorePatterns`, `sortTailwindcss.stylesheet`, and overrides for your layout.

## Commonly tuned per project

Most FMC apps share the same core (plugins, type-aware lint, switch exhaustiveness, React Compiler + hooks on `**/*.tsx`, Prettier-style options). These are the usual intentional divergences:

- **`singleQuote`** — template defaults to `true`; flip to match an existing codebase.
- **`ignorePatterns`** — keep oxlint and oxfmt in sync; add generated paths or tool folders for your repo layout.
- **`sortTailwindcss.stylesheet`** — point at your global CSS entry.
- **Custom oxlint `jsPlugins`** — e.g. TanStack Start auth-boundary rules; see skill `tanstack-start-auth` → [endpoint-auth-lint.md](../../tanstack-start-auth/references/endpoint-auth-lint.md).
- **`eslint-plugin-compat`** — `compat/compat` on client-shipped paths; scoped override in [browser-target.md](browser-target.md).

## React Compiler (oxlint native)

Enforce React Compiler rules on `**/*.tsx` with oxlint's built-in **`react/react-compiler`** rule — no `eslint-plugin-react-compiler` jsPlugin or extra devDependency.

```javascript
// oxlint.config.mjs — `plugins` must include `'react'`
{
  files: ['**/*.tsx'],
  jsPlugins: [{ name: 'react-hooks-js', specifier: 'eslint-plugin-react-hooks' }],
  rules: {
    ...reactHooksJs.rules,
    'react/react-compiler': 'error',
  },
}
```

**Migration from `eslint-plugin-react-compiler`:** remove the `react-compiler-js` jsPlugin and `eslint-plugin-react-compiler` from `package.json`; replace `'react-compiler-js/react-compiler': 'error'` with `'react/react-compiler': 'error'`. Drop any Dependabot `ignore` entry for `eslint-plugin-react-compiler`.

Requires oxlint with the `react` plugin enabled (see [examples/oxlint.config.mjs](../examples/oxlint.config.mjs)). Component conventions: skill `react-dev`.

## Scaffold setup

**devDependencies** (pin versions together across apps):

```json
{
  "devDependencies": {
    "eslint-plugin-react-hooks": "^7.1.1",
    "oxfmt": "0.52.0",
    "oxlint": "1.67.0",
    "oxlint-config-react-hooks-js": "^1.1.3",
    "oxlint-tsgolint": "^0.23.0"
  }
}
```

Do **not** add `eslint-plugin-react-compiler` — use native `react/react-compiler` in oxlint (see above).

**scripts** — use `--fix --fix-dangerously` on write-mode lint so suggestion/dangerous fixes apply (e.g. removing unused imports). Plain `--fix` only applies safe fixes.

```json
{
  "scripts": {
    "lint": "oxlint --fix --fix-dangerously --deny-warnings -c oxlint.config.mjs .",
    "lint-check": "oxlint --deny-warnings -c oxlint.config.mjs .",
    "format": "oxfmt --write -c oxfmt.config.mjs .",
    "format-check": "oxfmt --check -c oxfmt.config.mjs ."
  }
}
```

- **`bun run lint`** — fix and write; fails on remaining issues (`--deny-warnings` where used).
- **`bun run lint-check`** — read-only; use in CI / `check` pipelines.
- **`bun run format`** — oxfmt write; does not remove unused imports.

**VS Code** — extension `oxc.oxc-vscode`, `oxc.typeAware: true`:

```json
{
  "oxc.fixKind": "dangerous_fix_or_suggestion",
  "oxc.typeAware": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.oxc": "always",
    "source.fixAllDangerous.oxc": "always"
  }
}
```

- **`oxc.fixKind`** — which fix levels appear in quick-fix / LSP (`dangerous_fix_or_suggestion` matches CLI boldness).
- **`source.fixAll.oxc`** — safe fixes + suggestions on save.
- **`source.fixAllDangerous.oxc`** — dangerous fixes on save (pairs with `--fix-dangerously` on CLI).

React Compiler and component conventions: skill `react-dev`.
