import { defineConfig } from 'oxfmt'
import baseConfig from './oxfmt.config.mjs'

// format-static-datasets-geojson only — never run on a full tree; see scripts/StaticDatasets/README.md § Formatting.
// Unlike oxfmt.config.mjs, geojson/ is not ignored so explicit paths under the symlink work.
export default defineConfig({
  ...baseConfig,
  ignorePatterns: ['scripts/StaticDatasets/_geojson_temp/**'],
})
