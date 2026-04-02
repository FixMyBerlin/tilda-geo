import { defineConfig } from 'oxfmt'

export default defineConfig({
  useTabs: false,
  tabWidth: 2,
  printWidth: 100,
  singleQuote: true,
  jsxSingleQuote: false,
  quoteProps: 'as-needed',
  trailingComma: 'all',
  semi: false,
  arrowParens: 'always',
  bracketSameLine: false,
  bracketSpacing: true,
  endOfLine: 'lf',
  sortImports: {
    newlinesBetween: false,
  },
  sortTailwindcss: {
    stylesheet: 'src/components/shared/layouts/global.css',
    functions: ['twMerge', 'twJoin'],
  },
  sortPackageJson: true,
  ignorePatterns: [
    'src/routeTree.gen.ts',
    'scripts/StaticDatasets/geojson/**/*.geojson',
    'scripts/StaticDatasets/geojson/**/*.geojson.gz',
    'scripts/StaticDatasets/geojson/**/*.json',
  ],
  overrides: [
    {
      files: ['**/translations/*.const.ts'],
      options: {
        printWidth: 320,
      },
    },
  ],
})
