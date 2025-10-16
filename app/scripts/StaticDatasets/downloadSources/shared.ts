import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'parse-gitignore'
import slugify from 'slugify'
import { parseArgs } from 'util'
import { ignoreFolder } from '../updateStaticDatasets/ignoreFolder'
import { inverse } from '../utils/log'

const geoJsonFolder = 'scripts/StaticDatasets/geojson'

export interface SharedArgs {
  'folder-filter'?: string
  'keep-tmp'?: boolean
}

export const parseSharedArgs = (args: string[]) => {
  const { values, positionals } = parseArgs({
    args,
    options: {
      'keep-tmp': { type: 'boolean' },
      'folder-filter': { type: 'string' },
    },
    strict: true,
    allowPositionals: true,
  })

  return {
    values: values as SharedArgs,
    positionals,
  }
}

export const getIgnorePatterns = () => {
  const updateIgnorePath = path.join(geoJsonFolder, '.updateignore')
  return fs.existsSync(updateIgnorePath) ? parse(fs.readFileSync(updateIgnorePath)).patterns : []
}

export const getDatasetFolders = (folderFilterTerm?: string) => {
  // Collect the file and folder data that we iterate over
  const regionGroupFolderPaths = fs
    .readdirSync(geoJsonFolder)
    // Make sure we only select folders, no files
    .filter((item) => fs.statSync(path.join(geoJsonFolder, item)).isDirectory())

  const datasetFileFolderData = regionGroupFolderPaths
    .map((regionGroupFolder) => {
      const subFolders = fs.readdirSync(path.join(geoJsonFolder, regionGroupFolder))
      return subFolders.map((datasetFolder) => {
        const targetFolder = path.join(geoJsonFolder, regionGroupFolder, datasetFolder)
        // If a `folder-filter` is given, we only look at folder that include this term
        if (folderFilterTerm && !targetFolder.includes(folderFilterTerm)) return
        // Make sure we only select folders, no files
        if (!fs.statSync(targetFolder).isDirectory()) return

        return { datasetFolderPath: targetFolder, regionFolder: regionGroupFolder, datasetFolder }
      })
    })
    .flat()
    .filter(Boolean)
    .sort((a, b) => a.datasetFolderPath.localeCompare(b.datasetFolderPath))

  return datasetFileFolderData
}

export const shouldProcessFolder = (regionAndDatasetFolder: string, ignorePatterns: string[]) => {
  return !ignoreFolder(regionAndDatasetFolder, ignorePatterns)
}

export const getDataFilename = (datasetFolder: string) => {
  return slugify(datasetFolder.replaceAll(':', '-'))
}

export const logStartMessage = (scriptName: string, settings: Record<string, any>) => {
  inverse(`Starting ${scriptName} with settings`, [settings])
}
