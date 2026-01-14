// We use bun.sh to run this file
import fs from 'node:fs'
import path from 'node:path'
import { createWfsUrl } from './downloadSources/createWfsUrl'
import { fetchAndStoreGeopackage } from './downloadSources/fetchAndStoreGeopackage'
import {
  getDataFilename,
  getDatasetFolders,
  getIgnorePatterns,
  logStartMessage,
  parseSharedArgs,
  shouldProcessFolder,
} from './downloadSources/shared'
import { transformGeopackageToGeojson } from './downloadSources/transformGeopackageToGeojson'
import { DownloadConfig } from './downloadSources/types'
import { checkFilesizeAndGzip } from './updateWfsSources/checkFilesizeAndGzip'
import { import_ } from './utils/import_'
import { green, inverse, red } from './utils/log'

export const tempFolder = 'scripts/StaticDatasets/_geojson_temp'
if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder, { recursive: true })

// use --folder-filter to run only folders that include this filter string (check the full path, so `region-bb` (group folder) and `bb-` (dataset folder) will both work)
const { values } = parseSharedArgs(Bun.argv)
const keepTemporaryFiles = !!values['keep-tmp']
const folderFilterTerm = values['folder-filter']

logStartMessage('WFS download update', {
  folderFilterTerm,
  keepTemporaryFiles,
})

const ignorePatterns = getIgnorePatterns()
const datasetFileFolderData = getDatasetFolders(folderFilterTerm)

for (const { datasetFolderPath, regionFolder, datasetFolder } of datasetFileFolderData) {
  // Get the `downloadConfig.js` data ready
  const downloadConfig = await import_<DownloadConfig>(
    datasetFolderPath,
    'downloadConfig',
    'downloadConfig',
  )
  if (!downloadConfig) continue

  const dataFilename = getDataFilename(downloadConfig.layer)

  const regionAndDatasetFolder = `${regionFolder}/${datasetFolder}`
  if (!shouldProcessFolder(regionAndDatasetFolder, ignorePatterns)) {
    // console.log(`Ignoring folder "${regionAndDatasetFolder}"`)
    continue
  } else {
    inverse(`Processing folder "${regionAndDatasetFolder}"...`)
  }

  const wfsUrl = createWfsUrl(downloadConfig)
  console.log('  Downloading', wfsUrl.toString())
  try {
    const geoPackageFilename = path.join(tempFolder, `${dataFilename}.gpkg`)
    const geojsonFilename = path.join(datasetFolderPath, `${dataFilename}.wfs.geojson`)
    await fetchAndStoreGeopackage(wfsUrl, geoPackageFilename)
    await transformGeopackageToGeojson(geoPackageFilename, geojsonFilename)
    const resultFilename = await checkFilesizeAndGzip(geojsonFilename)

    green('  Data saved', resultFilename)
  } catch (error) {
    red('   Error', error, downloadConfig, wfsUrl.toString())
    continue
  }
}

inverse('DONE')
