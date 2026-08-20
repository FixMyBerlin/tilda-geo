/** @type {import('knip').KnipConfig} */
// @see .agents/skills/tech-stack/references/knip.md
const strict = process.env.KNIP_STRICT === '1'

export default {
  entry: [
    'src/router.tsx',
    'src/routes/**/*.{ts,tsx}',
    'src/**/*.test.{ts,tsx}',
    'src/server/instrumentation/nitro-*.plugin.server.ts',
    'scripts/**/*.{ts,js}',
    '../.github/scripts/generate-deploy-env.ts',
    'tests/**/*.ts',
    'prisma/seeds/**/*.ts',
  ],
  ignore: ['.agents/**'],
  ignoreFiles: ['scripts/StaticDatasets/geojson/**'],
  ignoreIssues: {
    'scripts/StaticDatasets/types.ts': ['exports', 'types'],
    // Consumed by ../.github/scripts/generate-deploy-env.ts (outside app/ workspace)
    'src/components/shared/utils/getAppBaseUrl.ts': ['exports'],
    'src/components/shared/utils/getCachelessTilesUrl.ts': ['exports'],
    'src/components/shared/utils/getTilesUrl.ts': ['exports'],
  },
  ignoreBinaries: ['code', 'gdal', 'gdalinfo', 'gh', 'github', 'ogr2ogr', 'ogrinfo'],
  ignoreDependencies: [
    '@tanstack/router-plugin',
    // Symlinked scripts/StaticDatasets/geojson/** (ignoreFiles above)
    'papaparse',
    '@types/papaparse',
    '@maplibre/maplibre-gl-style-spec',
    // Direct deps for `update-browserslist-db` (not imported in app code)
    'baseline-browser-mapping',
    'caniuse-lite',
  ],
  rules: {
    files: 'error',
    dependencies: 'error',
    devDependencies: 'error',
    unlisted: 'error',
    binaries: 'error',
    exports: strict ? 'error' : 'warn',
    types: strict ? 'error' : 'warn',
    enumMembers: strict ? 'error' : 'warn',
    duplicates: 'warn',
  },
}
