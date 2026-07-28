import { defineConfig } from 'oxfmt'
import baseConfig from './oxfmt.config.mjs'

export default defineConfig({
  ...baseConfig,
  ignorePatterns: [
    'scripts/StaticDatasets/_geojson_temp/**',
    'scripts/StaticDatasets/geojson/**/*.geojson',
    'scripts/StaticDatasets/geojson/**/*.json',
  ],
})
