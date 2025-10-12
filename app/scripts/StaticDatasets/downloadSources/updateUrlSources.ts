// We use bun.sh to run this file
import path from 'node:path'
import { import_ } from '../utils/import_'
import { green, inverse, red } from '../utils/log'
import {
  getDatasetFolders,
  getIgnorePatterns,
  logStartMessage,
  parseSharedArgs,
  shouldProcessFolder,
} from './shared'
import { DownloadConfig } from './types'

// use --folder-filter to run only folders that include this filter string
const { values } = parseSharedArgs(Bun.argv)
const folderFilterTerm = values['folder-filter']

logStartMessage('URL download update', {
  folderFilterTerm,
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

  // Only process URL sources
  if (downloadConfig.format !== 'URL') continue

  const regionAndDatasetFolder = `${regionFolder}/${datasetFolder}`
  if (!shouldProcessFolder(regionAndDatasetFolder, ignorePatterns)) {
    continue
  } else {
    inverse(`Processing folder "${regionAndDatasetFolder}"...`)
  }

  try {
    // Handle URL download - no transformation, just download raw file
    if (!downloadConfig.url) {
      red(`  URL source missing url in ${datasetFolderPath}`)
      continue
    }

    console.log('  Downloading from URL:', downloadConfig.url)

    const response = await fetch(downloadConfig.url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Extract filename from URL
    const urlPath = new URL(downloadConfig.url).pathname
    const originalFilename = path.basename(urlPath)
    const filepath = path.join(datasetFolderPath, originalFilename)

    await Bun.write(filepath, response)
    green('  Data saved', filepath)
  } catch (error) {
    red('   Error', error, downloadConfig)
    continue
  }
}

inverse('DONE')
