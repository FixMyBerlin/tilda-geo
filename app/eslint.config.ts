import parser from '@typescript-eslint/parser'
import reactCompiler from 'eslint-plugin-react-compiler'

export default [
  { ignores: ['src/routeTree.gen.ts', '.output/**', 'node_modules/**'] },
  {
    files: ['**/*.tsx'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-compiler': reactCompiler,
    },
    rules: {
      'react-compiler/react-compiler': 'error',
    },
  },
]
