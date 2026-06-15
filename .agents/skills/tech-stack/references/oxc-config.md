# Oxlint / oxfmt defaults

Templates: [examples/oxfmt.config.mjs](../examples/oxfmt.config.mjs), [examples/oxlint.config.mjs](../examples/oxlint.config.mjs).

Derived from [tilda-geo](https://github.com/FixMyBerlin/tilda-geo) and [trassenscout](https://github.com/FixMyBerlin/trassenscout). Copy on scaffold; tune `ignorePatterns`, `sortTailwindcss.stylesheet`, and overrides for your layout.

## Commonly tuned per project

Most FMC apps share the same core (plugins, type-aware lint, switch exhaustiveness, React Compiler + hooks on `**/*.tsx`, Prettier-style options). These are the usual intentional divergences:

- **`singleQuote`** — template defaults to `true`; flip to match an existing codebase.
- **`ignorePatterns`** — keep oxlint and oxfmt in sync; add generated paths or tool folders for your repo layout.
- **`sortTailwindcss.stylesheet`** — point at your global CSS entry.
- **Custom oxlint `jsPlugins`** — e.g. TanStack Start auth-boundary rules; see skill `tanstack-start-auth` → [endpoint-auth-lint.md](../../tanstack-start-auth/references/endpoint-auth-lint.md).

## Scaffold setup

**devDependencies** (pin versions together across apps):

```json
{
  "devDependencies": {
    "eslint-plugin-react-compiler": "19.0.0-beta-ebf51a3-20250411",
    "eslint-plugin-react-hooks": "^7.1.1",
    "oxfmt": "0.52.0",
    "oxlint": "1.67.0",
    "oxlint-config-react-hooks-js": "^1.1.3",
    "oxlint-tsgolint": "^0.23.0"
  }
}
```

**scripts:**

```json
{
  "scripts": {
    "lint": "oxlint --fix --deny-warnings -c oxlint.config.mjs .",
    "lint-check": "oxlint --deny-warnings -c oxlint.config.mjs .",
    "format": "oxfmt --write -c oxfmt.config.mjs .",
    "format-check": "oxfmt --check -c oxfmt.config.mjs ."
  }
}
```

**VS Code:** extension `oxc.oxc-vscode`, `oxc.typeAware: true`, point `oxc.fmt.configPath` and `oxc.lint.configPath` at your configs. Optional: `source.format.oxc` on save.

React Compiler and component conventions: skill `react-dev`.
