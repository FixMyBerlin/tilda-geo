// We use bun.sh to run this file
import { select } from '@clack/prompts'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'parse-gitignore'
import slugify from 'slugify'
import { parseArgs } from 'util'
import { getRegions } from './api'
import { MetaData } from './types'
import { findGeojson } from './updateStaticDatasets/findGeojson'
import { ignoreFolder } from './updateStaticDatasets/ignoreFolder'
import { processExternalSource } from './updateStaticDatasets/processExternalSource'
import { processLocalSource } from './updateStaticDatasets/processLocalSource'
import { transformFile } from './updateStaticDatasets/transformFile'
import { import_ } from './utils/import_'
import { green, inverse, red, yellow } from './utils/log'

function loadEnvFiles(environment: string) {
  const scriptDir = path.dirname(__filename)
  const appRoot = path.resolve(scriptDir, '../..')

  // Map 'dev' to 'development' for file naming
  const envFileSuffix = environment === 'dev' ? 'development' : environment

  // Load base .env from app root
  const baseEnvPath = path.join(appRoot, '.env')
  if (fs.existsSync(baseEnvPath)) {
    dotenv.config({ path: baseEnvPath })
  }

  // Load environment-specific .env file from scripts/StaticDatasets directory
  const envFilePath = path.join(scriptDir, `.env.${envFileSuffix}`)
  if (!fs.existsSync(envFilePath)) {
    red(`Environment file not found: ${envFilePath}`)
    process.exit(1)
  }
  dotenv.config({ path: envFilePath, override: true })
}

// Parse command line arguments
// use --env to specify environment (dev/staging/production), otherwise will prompt
// use --keep-tmp to keep temporary generated files
// use --folder-filter to run only folders that include this filter string (check the full path, so `region-bb` (group folder) and `bb-` (dataset folder) will both work)
const { values, positionals } = parseArgs({
  args: Bun.argv,
  options: {
    env: { type: 'string' },
    'keep-tmp': { type: 'boolean' },
    'folder-filter': { type: 'string' },
  },
  strict: true,
  allowPositionals: true,
})

// Determine environment: use --env flag or prompt user
let environment: string
if (values.env) {
  const validEnvs = ['dev', 'staging', 'production']
  if (!validEnvs.includes(values.env)) {
    red(`Invalid environment: ${values.env}. Must be one of: ${validEnvs.join(', ')}`)
    process.exit(1)
  }
  environment = values.env
} else {
  const selected = await select({
    message: 'Select environment:',
    options: [
      { value: 'dev', label: 'Development' },
      { value: 'staging', label: 'Staging' },
      { value: 'production', label: 'Production' },
    ],
  })

  if (!selected || typeof selected !== 'string') {
    red('No environment selected. Aborting.')
    process.exit(1)
  }
  environment = selected
}

// Load environment files before accessing process.env
loadEnvFiles(environment)

const geoJsonFolder = 'scripts/StaticDatasets/geojson'
export const tempFolder = 'scripts/StaticDatasets/_geojson_temp'
if (!fs.existsSync(tempFolder)) fs.mkdirSync(tempFolder, { recursive: true })

const regions = await getRegions()
const existingRegionSlugs = regions.map((region) => region.slug)

const keepTemporaryFiles = !!values['keep-tmp']
const folderFilterTerm = values['folder-filter']

inverse('Starting update with settings', [
  {
    API_ROOT_URL: process.env.API_ROOT_URL,
    S3_UPLOAD_FOLDER: process.env.S3_UPLOAD_FOLDER,
    keepTemporaryFiles,
    folderFilterTerm,
  },
])

const updateIgnorePath = path.join(geoJsonFolder, '.updateignore')
const ignorePatterns = fs.existsSync(updateIgnorePath)
  ? parse(fs.readFileSync(updateIgnorePath)).patterns
  : []

if (!fs.existsSync(geoJsonFolder)) {
  red(`folder "${geoJsonFolder}" does not exists. Please run "npm run StaticDatasets:link"?`)
  process.exit(1)
}

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

for (const { datasetFolderPath, regionFolder, datasetFolder } of datasetFileFolderData) {
  const regionAndDatasetFolder = `${regionFolder}/${datasetFolder}`

  if (ignoreFolder(regionAndDatasetFolder, ignorePatterns)) {
    yellow(`Ignoring folder "${regionAndDatasetFolder}"`)
    continue
  } else {
    inverse(`Processing folder "${regionAndDatasetFolder}"...`)
  }

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
    case 'external':
      // TypeScript narrows metaData to the external variant here
      await processExternalSource(metaData, uploadSlug, regionSlugs, regionAndDatasetFolder)
      break
    case 'local':
      // Get the one `.geojson` file that we will handle ready
      const geojsonFullFilename = findGeojson(datasetFolderPath)
      if (!geojsonFullFilename) {
        // Logging is part of findGeojson()
        continue
      }

      // Create the transformed data (or duplicate existing geojson)
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
      )
      break
  }

  green('  OK')
}

// List processed temp geojson files when --keep-tmp present for easy access to check the file
if (keepTemporaryFiles) {
  inverse('Processed temporary files')
  const tempGeojsonFiles = fs
    .readdirSync(tempFolder)
    .filter((file) => file.endsWith('.geojson') || file.endsWith('.geojson.gz'))
    .filter((file) => (folderFilterTerm ? file.includes(folderFilterTerm) : true))
    .sort()
  tempGeojsonFiles.map((file) => {
    console.log(`  ${path.join(tempFolder, file)}`)
  })
}

// Clean up
if (!keepTemporaryFiles) {
  fs.rmSync(tempFolder, { recursive: true, force: true })
}

// For production runs, add a tag so we can see which data was published
//   https://github.com/FixMyBerlin/tilda-static-data/tags
// How to use: Compare with the previous tag at
//   https://github.com/FixMyBerlin/tilda-static-data/compare/main...publish_2024-05-23_prd
if (process.env.S3_UPLOAD_FOLDER === 'production') {
  const currentDateTime = new Date().toISOString()
  const tagName = `publish_${currentDateTime}_${process.env.S3_UPLOAD_FOLDER}`
  const tagMessage = `publish data to ${process.env.S3_UPLOAD_FOLDER}`

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

inverse('DONE')
