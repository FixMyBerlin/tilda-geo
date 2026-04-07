// We use bun.sh to run this file

import fs from 'node:fs'
import path from 'node:path'
import { parseArgs, styleText } from 'node:util'
import { select } from '@clack/prompts'
import dotenv from 'dotenv'
import type { SourceExportApiIdentifier } from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/export/exportIdentifier'
import { getExportOgrApiBboxUrl } from '@/components/shared/utils/getExportApiUrl'
import type { EnvironmentValues } from '@/server/envSchema'
import { getValidatedEnv, mapboxTilesetsSchema } from '../shared/env'
import { tilesetConfigs } from './datasets'

const log = {
  info: (msg: string, ...rest: unknown[]) =>
    console.log(styleText(['inverse', 'bold'], msg), ...rest),
  warn: (msg: string, ...rest: unknown[]) =>
    console.log(styleText(['inverse', 'bold', 'yellow'], msg), ...rest),
  error: (msg: string, ...rest: unknown[]) =>
    console.error(styleText(['inverse', 'bold', 'red'], msg), ...rest),
}

const envMap = {
  dev: 'development',
  staging: 'staging',
  production: 'production',
} as const satisfies Record<string, EnvironmentValues>

type CliEnv = keyof typeof envMap

const cliEnvKeys = Object.keys(envMap) as CliEnv[]

const isCliEnv = (v: string): v is CliEnv => v in envMap

const cliEnvSelectOptions: { value: CliEnv; label: string }[] = [
  { value: 'dev', label: 'Development (localhost)' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
]

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    env: { type: 'string' },
    filter: { type: 'string' },
    force: { type: 'boolean' },
  },
  strict: true,
  allowPositionals: true,
})

let cliEnv: CliEnv
if (values.env) {
  if (!isCliEnv(values.env)) {
    log.error(
      'ERROR',
      `Invalid environment: ${values.env}. Must be one of: ${cliEnvKeys.join(', ')}`,
    )
    process.exit(1)
  }
  cliEnv = values.env
} else {
  const selected = await select({
    message: 'Select environment to fetch tiles from:',
    options: cliEnvSelectOptions,
  })
  if (typeof selected !== 'string' || !isCliEnv(selected)) {
    log.error('ERROR', 'No environment selected. Aborting.')
    process.exit(1)
  }
  cliEnv = selected
}

const envSource = envMap[cliEnv]

const scriptDir = path.dirname(__filename)
const repoRoot = path.resolve(scriptDir, '../../..')
const repoEnvPath = path.join(repoRoot, '.env')
if (fs.existsSync(repoEnvPath)) {
  dotenv.config({ path: repoEnvPath })
}

async function main() {
  const env = getValidatedEnv(mapboxTilesetsSchema)

  log.info('START', __filename)

  const folderFgb = 'scripts/MapboxTilesets/flatgeobuf'
  const folderMbtiles = 'scripts/MapboxTilesets/mbtiles'
  fs.mkdirSync(folderFgb, { recursive: true })
  fs.mkdirSync(folderMbtiles, { recursive: true })

  const filterTerm = values.filter
  const force = !!values.force

  log.info('CONFIG', { env: cliEnv, envSource, filter: filterTerm ?? '(all)', force })

  const allDatasets = Object.entries(tilesetConfigs)
  const datasets = filterTerm
    ? allDatasets.filter(([key]) => key.includes(filterTerm))
    : allDatasets

  if (datasets.length === 0) {
    log.warn('SKIP', `No datasets match filter "${filterTerm}"`)
    process.exit(0)
  }

  log.info('INFO', `Processing ${datasets.length}/${allDatasets.length} datasets`)

  for (const dataset of datasets) {
    console.log('\n')
    const datasetKey = dataset[0] as SourceExportApiIdentifier
    const { sourceLayer, uploadUrl, bbox } = dataset[1]

    const fgbFile = `${folderFgb}/atlas_${datasetKey}.fgb`
    const mbtilesFile = `${folderMbtiles}/atlas_${datasetKey}.mbtiles`

    if (!force && fs.existsSync(fgbFile) && fs.existsSync(mbtilesFile)) {
      log.warn('  SKIP', `${datasetKey} — files already exist (use --force to re-download)`)
      continue
    }

    try {
      const url = getExportOgrApiBboxUrl(
        'noRegion',
        datasetKey,
        bbox,
        'fgb',
        envSource,
        env.ATLAS_API_KEY,
      )
      log.warn('  FETCH', url)
      const fetchExportFgb = await fetch(url)

      if (!fetchExportFgb.ok) {
        log.error(
          '  ERROR',
          `Fetch failed for ${datasetKey}: ${fetchExportFgb.status} ${fetchExportFgb.statusText}`,
        )
        continue
      }

      log.warn('  WRITE', fgbFile)
      const fgbBuffer = await fetchExportFgb.arrayBuffer()
      fs.writeFileSync(fgbFile, Buffer.from(fgbBuffer))

      log.info('  RUN', `tippecanoe → ${mbtilesFile}`)
      const tippecanoe = Bun.spawnSync(
        [
          'tippecanoe',
          `--output=${mbtilesFile}`,
          '--force',
          '--maximum-zoom=g', // Automatically choose a maxzoom that should be sufficient to clearly distinguish the features and the detail within each feature https://github.com/felt/tippecanoe#zoom-levels
          '-rg', // If you use -rg, it will guess a drop rate that will keep at most 50,000 features in the densest tile https://github.com/felt/tippecanoe#dropping-a-fixed-fraction-of-features-by-zoom-level
          '--drop-densest-as-needed', // https://github.com/felt/tippecanoe?tab=readme-ov-file#dropping-a-fraction-of-features-to-keep-under-tile-size-limits
          '--extend-zooms-if-still-dropping', // https://github.com/felt/tippecanoe?tab=readme-ov-file#zoom-levels
          `--layer=${sourceLayer}`, // We need to specify a specifiy layer name which was initially used by Mapbox when we uploaded the geojson files, otherwise the stiles need to be updated…
          fgbFile,
        ],
        { stderr: 'pipe' },
      )

      if (tippecanoe.exitCode !== 0) {
        log.error(
          '  ERROR',
          `tippecanoe failed for ${datasetKey} (exit ${tippecanoe.exitCode}): ${tippecanoe.stderr.toString()}`,
        )
        continue
      }

      if (uploadUrl) {
        log.info('  NOW…', `upload ${mbtilesFile} on ${uploadUrl}`)
      } else {
        log.info(
          '  NOW…',
          `upload ${mbtilesFile} to https://console.mapbox.com/studio/tilesets/?q=${datasetKey} (and then add the upload URL to datasets.ts)`,
        )
      }
    } catch (error) {
      log.error('  ERROR', `handling ${datasetKey}: ${error}`)
    }
  }

  log.info(
    '\nINFO',
    'Opening mbtiles folder so you may "replace" the Mapbox tilesets in the browser.',
  )
  Bun.spawnSync(['open', folderMbtiles])

  console.log('\n')
  log.info('DONE', '')
}

void main()
