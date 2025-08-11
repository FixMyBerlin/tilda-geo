// We use bun.sh to run this file
import { getExportOgrApiBboxUrl } from '@/src/app/_components/utils/getExportApiUrl'
import { SourceExportApiIdentifier } from '@/src/app/regionen/[regionSlug]/_mapData/mapDataSources/export/exportIdentifier'
import chalk from 'chalk'
import fs from 'node:fs'
import { tilesetConfigs } from './datasets'

const ENV_SOURCE: typeof process.env.NEXT_PUBLIC_APP_ENV = 'staging'

async function main() {
  console.log(chalk.inverse.bold('START'), __filename)

  // Folder
  const folderFgb = 'scripts/MapboxTilesets/flatgeobuf'
  const folderMbtiles = 'scripts/MapboxTilesets/mbtiles'

  console.log(
    chalk.inverse.bold('INFO'),
    'Opening mbtiles folder so you may "replace" the Mapbox tilesets in the browser.',
  )
  Bun.spawnSync(['open', folderMbtiles])

  // Fetch, Write, Transform with GDAL API
  for (const dataset of Object.entries(tilesetConfigs)) {
    console.log('\n')
    const datasetKey = dataset[0] as SourceExportApiIdentifier
    const { sourceLayer, uploadUrl, bbox } = dataset[1]

    // Check if files already exist
    const fgbFile = `${folderFgb}/atlas_${datasetKey}.fgb`
    const mbtilesFile = `${folderMbtiles}/atlas_${datasetKey}.mbtiles`

    if (fs.existsSync(fgbFile) && fs.existsSync(mbtilesFile)) {
      console.log(
        chalk.inverse.bold(chalk.yellow('  SKIP')),
        `${datasetKey} - files already exist`,
        { uploadUrl },
      )
      continue
    }

    try {
      // Fetch Export API with GDAL (better quality data)
      const apiKey = process.env.ATLAS_API_KEY
      // The `apiKey` will skip the region check (hence the `noRegion`)
      const url = getExportOgrApiBboxUrl('noRegion', datasetKey, bbox, 'fgb', ENV_SOURCE, apiKey)
      console.log(chalk.inverse.bold(chalk.yellow('  FETCH')), url)
      const fetchExportFgb = await fetch(url)

      if (!fetchExportFgb.ok) {
        console.error('  Error failed', datasetKey, ':', fetchExportFgb)
        continue
      }

      // For debugging: Write FGB Response
      console.log(chalk.inverse.bold(chalk.yellow('  WRITE')), fgbFile)
      const fgbBuffer = await fetchExportFgb.arrayBuffer()
      fs.writeFileSync(fgbFile, Buffer.from(fgbBuffer))

      // Create mbTiles with Tippecanoe
      console.log(chalk.inverse.bold('  RUN'), 'tippecanoe', mbtilesFile)
      Bun.spawnSync(
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
        {
          onExit(_proc, exitCode, _signalCode, error) {
            exitCode && console.log('exitCode:', exitCode)
            error && console.log('error:', error)
          },
        },
      )

      // Hint on how to upload
      if (uploadUrl) {
        console.log(chalk.inverse.bold('  NOW…'), 'upload', mbtilesFile, 'on', uploadUrl)
      } else {
        console.log(
          chalk.inverse.bold('  NOW…'),
          'upload',
          mbtilesFile,
          'to',
          `https://console.mapbox.com/studio/tilesets/?q=${datasetKey}`,
          '(and then add the upload URL to the processing file…)',
        )
      }
    } catch (error) {
      console.error('  Error handling', datasetKey, ':', error)
    }
  }

  console.log('\n', chalk.inverse.bold('DONE'))
}

main()
