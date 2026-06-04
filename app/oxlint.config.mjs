import { defineConfig } from 'oxlint'

export default defineConfig({
  plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'react'],
  options: { typeAware: true },
  ignorePatterns: ['src/routeTree.gen.ts', '.output/**'],
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
      jsPlugins: [{ name: 'react-compiler-js', specifier: 'eslint-plugin-react-compiler' }],
      rules: {
        'react-compiler-js/react-compiler': 'error',
      },
    },
  ],
})
