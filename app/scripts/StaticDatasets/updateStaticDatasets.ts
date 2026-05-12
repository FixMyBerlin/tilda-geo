// We use bun.sh to run this file
import fs from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { select } from '@clack/prompts'
import { parse } from 'parse-gitignore'
import slugify from 'slugify'
import { getValidatedEnv, staticDatasetsS3CredentialsSchema } from '../shared/env'
import { getRegions } from './api'
import {
  buildStaticDatasetsApiConfig,
  S3_UPLOAD_FOLDER_BY_APP_ENV,
  STATIC_DATASETS_CLI_ENV_TO_APP,
  STATIC_DATASETS_CLI_ENVS,
  type StaticDatasetsCliEnv,
} from './staticDatasetsAppEnv.const'
import type { MetaData } from './types'
import { findGeojson } from './updateStaticDatasets/findGeojson'
import { ignoreFolder } from './updateStaticDatasets/ignoreFolder'
import { processExternalSource } from './updateStaticDatasets/processExternalSource'
import { processLocalSource } from './updateStaticDatasets/processLocalSource'
import { transformFile } from './updateStaticDatasets/transformFile'
import { import_ } from './utils/import_'
import { green, inverse, red, yellow } from './utils/log'

const isStaticDatasetsCliEnv = (value: string | undefined): value is StaticDatasetsCliEnv =>
  value !== undefined && (STATIC_DATASETS_CLI_ENVS as readonly string[]).includes(value)

const { values, positionals: _positionals } = parseArgs({
  args: Bun.argv,
  options: {
    env: { type: 'string' },
    'keep-tmp': { type: 'boolean' },
    'folder-filter': { type: 'string' },
  },
  strict: true,
  allowPositionals: true,
})

let cliEnv: StaticDatasetsCliEnv
if (values.env) {
  if (!isStaticDatasetsCliEnv(values.env)) {
    red(
      `Invalid environment: ${values.env}. Must be one of: ${STATIC_DATASETS_CLI_ENVS.join(', ')}`,
    )
    process.exit(1)
  }
  cliEnv = values.env
} else {
  const selected = await select({
    message: 'Select environment:',
    options: STATIC_DATASETS_CLI_ENVS.map((value) => ({
      value,
      label: STATIC_DATASETS_CLI_ENV_TO_APP[value],
    })),
  })

  if (typeof selected !== 'string' || !isStaticDatasetsCliEnv(selected)) {
    red('No environment selected. Aborting.')
    process.exit(1)
  }
  cliEnv = selected
}

getValidatedEnv(staticDatasetsS3CredentialsSchema)

const appEnv = STATIC_DATASETS_CLI_ENV_TO_APP[cliEnv]
const api = buildStaticDatasetsApiConfig(appEnv)

const geoJsonFolder = 'scripts/StaticDatasets/geojson'
export const tempFolder = 'scripts/StaticDatasets/_geojson_temp'
if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder, { recursive: true })

const regions = await getRegions(api)
const existingRegionSlugs = regions.map((region) => region.slug)

const keepTemporaryFiles = !!values['keep-tmp']
const folderFilterTerm = values['folder-filter']

inverse('Starting update with settings', [
  {
    apiRootUrlFromTarget: api.apiRootUrl,
    s3UploadFolderFromTarget: S3_UPLOAD_FOLDER_BY_APP_ENV[appEnv],
    keepTemporaryFiles,
    folderFilterTerm,
  },
])

const updateIgnorePath = path.join(geoJsonFolder, '.updateignore')
const ignorePatterns = fs.existsSync(updateIgnorePath)
  ? parse(fs.readFileSync(updateIgnorePath)).patterns
  : []

if (!fs.existsSync(geoJsonFolder)) {
  red(`folder "${geoJsonFolder}" does not exists. Please run "bun run static-datasets-link"?`)
  process.exit(1)
}

// Collect the file and folder data that we iterate over
const regionGroupFolderPaths = fs
  .readdirSync(geoJsonFolder)
  // Make sure we only select folders, no files
  .filter((item) => fs.statSync(path.join(geoJsonFolder, item)).isDirectory())

const datasetFileFolderData = regionGroupFolderPaths
  .flatMap((regionGroupFolder) => {
    const subFolders = fs.readdirSync(path.join(geoJsonFolder, regionGroupFolder))
    return subFolders.flatMap((datasetFolder) => {
      const targetFolder = path.join(geoJsonFolder, regionGroupFolder, datasetFolder)
      const regionAndDatasetFolder = `${regionGroupFolder}/${datasetFolder}`
      if (folderFilterTerm && !regionAndDatasetFolder.includes(folderFilterTerm)) return []
      if (!fs.statSync(targetFolder).isDirectory()) return []
      return [{ datasetFolderPath: targetFolder, regionFolder: regionGroupFolder, datasetFolder }]
    })
  })
  .filter(Boolean)
  .sort((a, b) => a.datasetFolderPath.localeCompare(b.datasetFolderPath))

// Track folders that failed so we can summarize at the end without scrolling
const failedFolders: { folder: string; error: string }[] = []

for (const { datasetFolderPath, regionFolder, datasetFolder } of datasetFileFolderData) {
  const regionAndDatasetFolder = `${regionFolder}/${datasetFolder}`

  if (ignoreFolder(regionAndDatasetFolder, ignorePatterns)) {
    yellow(`Ignoring folder "${regionAndDatasetFolder}"`)
    continue
  } else {
    inverse(`Processing folder "${regionAndDatasetFolder}"...`)
  }

  try {
    // Guard invalid folder names (characters)
    const uploadSlug = slugify(datasetFolder.replaceAll('_', '-'))
    if (datasetFolder !== uploadSlug) {
      yellow(
        `  Folder name "${datasetFolder}" in ${regionAndDatasetFolder} is not a valid slug.
      \n  A valid slug would be "${uploadSlug}"`,
      )
      continue
    }

    // Get the `meta.js` data ready
    const metaData = await import_<MetaData>(datasetFolderPath, 'meta', 'data')
    if (metaData === null) {
      yellow(`  File 'meta.ts' is missing in folder ${datasetFolderPath}`)
      continue
    }

    // Create database entries dataset per region (from meta.ts)
    const regionSlugs: string[] = []
    for (const regionSlug of metaData.regions) {
      if (existingRegionSlugs.includes(regionSlug)) {
        regionSlugs.push(regionSlug)
      } else {
        yellow(`  region "${regionSlug}" (defined in meta.regions) does not exist.`)
      }
    }

    // Check if any layer has layout.visibility property
    for (const config of metaData.configs) {
      for (const layer of config.layers) {
        if (layer?.layout?.visibility) {
          red(
            `  layer "${layer.id}" has layout.visibility specified which is an error. Remove this property from the layer definition. Otherwise bugs come up like the layer does not show due to a hidden visibility.`,
          )
        }
      }
    }

    // Route to appropriate processor based on data source type
    switch (metaData.dataSourceType) {
      case 'external': {
        await processExternalSource(
          metaData,
          uploadSlug,
          regionSlugs,
          regionAndDatasetFolder,
          api,
          appEnv,
        )
        break
      }
      case 'local': {
        const geojsonFullFilename = findGeojson(datasetFolderPath)
        if (!geojsonFullFilename) {
          continue
        }
        const transformedFilepath = await transformFile(
          datasetFolderPath,
          geojsonFullFilename,
          tempFolder,
        )
        await processLocalSource(
          metaData,
          uploadSlug,
          regionSlugs,
          transformedFilepath,
          tempFolder,
          regionAndDatasetFolder,
          api,
          appEnv,
        )
        break
      }
    }

    green('  OK')
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    red(`  FAILED to process "${regionAndDatasetFolder}": ${message}`)
    if (error instanceof Error && error.stack) {
      console.error(error.stack)
    }
    failedFolders.push({ folder: regionAndDatasetFolder, error: message })
  }
}

// List processed temp geojson files when --keep-tmp present for easy access to check the file
if (keepTemporaryFiles) {
  inverse('Processed temporary files')
  const tempGeojsonFiles = fs
    .readdirSync(tempFolder)
    .filter((file) => file.endsWith('.geojson') || file.endsWith('.geojson.gz'))
    .filter((file) => (folderFilterTerm ? file.includes(folderFilterTerm) : true))
    .sort()
  for (const file of tempGeojsonFiles) {
    console.log(`  ${path.join(tempFolder, file)}`)
  }
}

// Clean up
if (!keepTemporaryFiles) {
  fs.rmSync(tempFolder, { recursive: true, force: true })
}

// For production runs, add a tag so we can see which data was published
//   https://github.com/FixMyBerlin/tilda-static-data/tags
// How to use: Compare with the previous tag at
//   https://github.com/FixMyBerlin/tilda-static-data/compare/main...publish_2024-05-23_prd
if (appEnv === 'production') {
  const folder = S3_UPLOAD_FOLDER_BY_APP_ENV[appEnv]
  const currentDateTime = new Date().toISOString()
  const tagName = `publish_${currentDateTime}_${folder}`
  const tagMessage = `publish data to ${folder}`

  try {
    Bun.spawnSync(['git', 'tag', '-a', tagName, '-m', tagMessage], {
      cwd: '../../tilda-static-data',
    })
    Bun.spawnSync(['git', 'push', 'origin', tagName], {
      cwd: '../../tilda-static-data',
    })
    console.log(`Tag '${tagName}' has been created and pushed to GitHub.`)
  } catch (error) {
    console.error('Failed to create or push git tag:', error)
  }
}

if (failedFolders.length > 0) {
  red(`Pipeline finished with ${failedFolders.length} failed folder(s):`)
  for (const { folder, error } of failedFolders) {
    red(`  - ${folder}: ${error}`)
  }
  inverse('DONE (with errors)')
  process.exit(1)
}

inverse('DONE')
