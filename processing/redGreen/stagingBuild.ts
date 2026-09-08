import { basename, dirname, resolve } from 'node:path'
import { OSM_DOWNLOAD_DIR, OSM_FILTERED_DIR } from '../constants/directories.const'
import { runAfterthoughts } from '../steps/afterthoughts'
import { generateTypes } from '../steps/generateTypes'
import { initialize } from '../steps/initialize'
import { createProcessingEntry, updateProcessingEntry } from '../steps/metadata'
import { processTopics } from '../steps/processTopics'
import type { RedGreenConfig } from './config'
import { copyFile } from './db'

export async function runStagingBuild(config: RedGreenConfig) {
  const recutFileName = basename(config.recutPbfPath)
  const targetFilteredPath = `${OSM_FILTERED_DIR}/${recutFileName}`
  await copyFile(config.recutPbfPath, targetFilteredPath)

  await initialize()
  const processingId = await createProcessingEntry()
  const startedAt = Date.now()

  // processTopics/updateProcessingEntry resolve `sourceFileName` via originalFilePath()
  // in OSM_DOWNLOAD_DIR; the working PBF (Geofabrik baseline + catch-up) is the true
  // "OSM data from" source and lives there by default.
  if (resolve(dirname(config.workingPbfPath)) !== resolve(OSM_DOWNLOAD_DIR)) {
    throw new Error(
      `WORKING_PBF_PATH must be a file directly in ${OSM_DOWNLOAD_DIR} (got ${config.workingPbfPath})`,
    )
  }
  const sourceFileName = basename(config.workingPbfPath)

  const ranTopics = await processTopics(recutFileName, true, processingId, sourceFileName)
  await generateTypes()
  await runAfterthoughts(processingId, true, ranTopics)

  await updateProcessingEntry(processingId, sourceFileName, Date.now() - startedAt)
}
