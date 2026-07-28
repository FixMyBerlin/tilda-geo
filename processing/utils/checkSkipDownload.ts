import { basename, join } from 'node:path'
import {
  NIGHTLY_FILTERED_FILE,
  OSM_FILTERED_DIR,
  WEEKEND_FILTERED_FILE,
} from '../constants/directories.const'
import { topicsConfig } from '../constants/topics.const'
import { originalFilePath } from '../steps/download'
import { params } from '../utils/parameters'
import { isBerlinSaturday } from './berlinTime'
import { isDev } from './isDev'
import { getTopicScheduleSkipReason } from './topicScheduleEligibility'

export async function checkSkipDownload() {
  const fileName = basename(params.pbfDownloadUrl)
  const filePath = originalFilePath(fileName)
  const fileExists = await Bun.file(filePath).exists()
  const isSaturdayRun = isBerlinSaturday(new Date())
  const weekendTopicWillRun = Array.from(topicsConfig).some(
    ([topic, entry]) =>
      entry.schedule === 'weekend' &&
      getTopicScheduleSkipReason(topic, entry, isSaturdayRun) === null,
  )
  // `index.ts` always prepares the nightly PBF before topics. Weekend topics need an additional
  // schedule PBF, so `SKIP_DOWNLOAD=1` can only rely on filtered files when all needed outputs exist.
  const requiredFilteredFiles = [
    NIGHTLY_FILTERED_FILE,
    ...(weekendTopicWillRun ? [WEEKEND_FILTERED_FILE] : []),
  ]
  const filteredFiles = await Promise.all(
    requiredFilteredFiles.map(async (filteredFileName) => ({
      fileName: filteredFileName,
      exists: await Bun.file(join(OSM_FILTERED_DIR, filteredFileName)).exists(),
    })),
  )
  const requiredFilteredFilesExist = filteredFiles.every((file) => file.exists)

  // Check if the regional download already exists.
  // We also check filtered PBFs because those are what processing actually needs; if they are
  // present, SKIP_DOWNLOAD=1 can skip re-downloading even when the raw file is missing.
  if (isDev) {
    console.log(
      'checkSkipDownload:',
      JSON.stringify({
        fileExists,
        filteredFiles,
        requiredFilteredFilesExist,
        weekendTopicWillRun,
        paramSkipDownload: params.skipDownload,
      }),
    )
  }

  return {
    fileName,
    fileExists,
    filePath,
    skipDownload: (fileExists || requiredFilteredFilesExist) && params.skipDownload,
  }
}
