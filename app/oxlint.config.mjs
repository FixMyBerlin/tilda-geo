import { defineConfig } from 'oxlint'
import reactHooksJs from 'oxlint-config-react-hooks-js/configs/recommended-latest.json' with { type: 'json' }

export default defineConfig({
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'react'],
  options: { typeAware: true },
  ignorePatterns: [
    // Agent skills/reference docs — not application source
    '../.agents/**',
    // TanStack Router codegen; overwritten by `bun run codegen` (see tilda-geo/app)
    'src/routeTree.gen.ts',
    // Vite/Nitro production build output
    '.output/**',
    // Playwright HTML report from `e2e` (gitignored)
    // "playwright-report/**",
  ],
  rules: {
    'typescript/switch-exhaustiveness-check': 'error',
    'typescript/no-floating-promises': 'off',
    'typescript/no-duplicate-type-constituents': 'off',
    'typescript/no-redundant-type-constituents': 'off',
    'typescript/restrict-template-expressions': 'off',
    'typescript/no-base-to-string': 'off',
    'typescript/await-thenable': 'off',
    'typescript/unbound-method': 'off',
    'typescript/no-meaningless-void-operator': 'off',
    'typescript/no-useless-default-assignment': 'off',
    'typescript/no-misused-spread': 'off',
    'typescript/require-array-sort-compare': 'off',
    'typescript/no-array-delete': 'off',
  },
  overrides: [
    {
      files: ['tests/**'],
      rules: {
        'react/rules-of-hooks': 'off',
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        'typescript/no-non-null-assertion': 'off',
      },
    },
    {
      files: ['**/*.tsx'],
      jsPlugins: [{ name: 'react-hooks-js', specifier: 'eslint-plugin-react-hooks' }],
      rules: {
        ...reactHooksJs.rules,
        'react/react-compiler': 'error',
      },
    },
    // Browser API guard — only for code that ships to the client (components + route UI).
    // Server code (*.server.ts, *.functions.ts, src/routes/api/**, src/server/**) is excluded:
    // it runs on Bun/Nitro and may use whatever the server runtime supports (Node/Bun APIs).
    {
      files: ['src/components/**', 'src/routes/**'],
      excludeFiles: ['**/*.server.ts', '**/*.functions.ts', 'src/routes/api/**'],
      jsPlugins: [{ name: 'compat', specifier: 'eslint-plugin-compat' }],
      rules: {
        'compat/compat': 'error',
      },
    },
  ],
})
