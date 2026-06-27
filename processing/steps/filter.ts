import { join } from 'node:path'
import { bboxPolygon, featureCollection, union } from '@turf/turf'
import { $ } from 'bun'
import { OSM_FILTERED_DIR, OSMIUM_FILTER_BBOX_DIR } from '../constants/directories.const'
import type { TopicConfigBbox } from '../constants/topics.const'
import type { TagFilterProfile } from '../constants/topics.tagFilters.const'
import {
  profileFilteredFileName,
  tagFilterProfileHashKey,
  tagFilterProfiles,
} from '../constants/topics.tagFilters.const'
import { directoryHasChanged, updateDirectoryHash } from '../utils/hashing'
import { isDev } from '../utils/isDev'
import { readHashFromFile, writeHashForFile } from '../utils/persistentData'
import { originalFilePath } from './download'

/**
 * Get the full path to the filtered file.
 * @param fileName file name
 * @returns full path to the file
 */
export const filteredFilePath = (fileName: string) => join(OSM_FILTERED_DIR, fileName)

const OSMIUM_FILTER_BBOX_FILE = `${OSMIUM_FILTER_BBOX_DIR}/merged-bboxes.geojson`

export type TagFilterSource = {
  fileName: string
  changed: boolean
  inputFromDownload?: boolean
}

type TagFilterForProfileParams = {
  profile: TagFilterProfile
  source: TagFilterSource
  outputFileName?: string
}

type BboxFilterInputOptions = {
  inputFromDownload?: boolean
}

function resolveInputPath(fileName: string, inputFromDownload: boolean) {
  return inputFromDownload ? originalFilePath(fileName) : filteredFilePath(fileName)
}

async function logPbfFileInfo(label: string, pbfPath: string) {
  try {
    const info = await $`osmium fileinfo -e ${pbfPath}`.text()
    console.log(`Filter: ${label} fileinfo`, info.trim())
  } catch (error) {
    console.warn(`Filter: Could not read fileinfo for ${pbfPath}:`, error)
  }
}

/**
 * Apply osmium tags-filter for a named profile. Expressions are passed inline on the command line.
 */
export async function tagFilterForProfile({
  profile,
  source,
  outputFileName = profileFilteredFileName(profile),
}: TagFilterForProfileParams) {
  const expressions = tagFilterProfiles[profile]
  const inputFromDownload = source.inputFromDownload ?? false
  const pbfPath = filteredFilePath(outputFileName)
  const pbfMissing = !(await Bun.file(pbfPath).exists())

  const expressionsHash = JSON.stringify(expressions)
  const hashKey = tagFilterProfileHashKey(profile, outputFileName)
  const storedHash = await readHashFromFile(hashKey)
  const filtersChanged = storedHash !== expressionsHash
  // Only run tag filters if the source, expressions, or output PBF changed.
  const runFilter = source.changed || filtersChanged || pbfMissing

  if (runFilter) {
    console.log(`Filter: Tag-filtering profile "${profile}"...`, JSON.stringify({ outputFileName }))
    const inputPath = resolveInputPath(source.fileName, inputFromDownload)
    try {
      await $`osmium tags-filter \
                  --overwrite \
                  --output=${pbfPath} \
                  ${inputPath} \
                  ${expressions}`
    } catch (error) {
      throw new Error(`Failed to tag-filter profile "${profile}": ${error}`)
    }
    await writeHashForFile(hashKey, expressionsHash)
    await logPbfFileInfo(`profile ${profile}`, pbfPath)
  } else {
    console.log(
      `Filter: ⏩ Skipping tag filter for profile "${profile}". Expressions and source are unchanged.`,
      JSON.stringify({ sourceChanged: source.changed, filtersChanged, pbfMissing, outputFileName }),
    )
  }

  // Return source.changed (not runFilter) so filter regeneration does not disable diffing.
  // The separate `regenerated` flag is only for downstream derived-filter cache invalidation.
  return { fileName: outputFileName, fileChanged: source.changed, regenerated: runFilter }
}

/**
 * Create filtered pbf files based on bboxes.
 * Bboxes are TopicConfigBbox tuples from processing/constants/topics.const.ts.
 * Regenerates the filtered file when bbox changes or source file changed, but doesn't affect
 * the fileChanged flag used for diffing decisions (similar to tagFilterForProfile).
 */
export async function bboxesFilter(
  inputFileName: string,
  outputName: string,
  bboxes: Readonly<Array<TopicConfigBbox>>,
  sourceFileChanged: boolean,
  options?: BboxFilterInputOptions,
) {
  const firstBbox = bboxes[0]
  if (!firstBbox) {
    throw new Error(`bboxesFilter requires at least one bbox, received ${JSON.stringify(bboxes)}`)
  }

  // Merge bboxes before handing them to osmium to avoid
  // https://github.com/osmcode/osmium-tool/issues/266.
  const mergedBboxPolygonFeatures =
    bboxes.length > 1
      ? union(featureCollection(bboxes.map((bbox) => bboxPolygon(bbox))))
      : bboxPolygon(firstBbox)
  if (!mergedBboxPolygonFeatures) {
    throw new Error(`Failed to merge bboxes ${JSON.stringify(bboxes)}`)
  }

  Bun.write(OSMIUM_FILTER_BBOX_FILE, JSON.stringify(mergedBboxPolygonFeatures))

  const filteredPbfExists = await Bun.file(filteredFilePath(outputName)).exists()
  const filterDirChanged = await directoryHasChanged(OSMIUM_FILTER_BBOX_DIR)
  // Regenerate if source file changed, bbox filter changed, or file is missing.
  // Bbox changes trigger regeneration but do not affect diffing by themselves.
  const shouldRegenerate = sourceFileChanged || filterDirChanged || !filteredPbfExists
  if (!shouldRegenerate) {
    console.log(
      '⏩ Skipping osmium extract for bboxFilter. The directory that stores the bbox filter geojson did not change.',
      JSON.stringify({
        filteredPbfExists,
        OSMIUM_FILTER_BBOX_FILE,
        sourceFileChanged,
        filterDirChanged,
        outputName,
      }),
      isDev ? JSON.stringify(mergedBboxPolygonFeatures) : '',
    )
    return false
  }
  updateDirectoryHash(OSMIUM_FILTER_BBOX_DIR)

  const inputPath = resolveInputPath(inputFileName, options?.inputFromDownload ?? false)

  console.log(
    'ℹ️ Filtering the OSM file with bboxes...',
    JSON.stringify({
      OSMIUM_FILTER_BBOX_FILE,
      sourceFileChanged,
      filterDirChanged,
      inputFileName,
      outputName,
    }),
    isDev ? JSON.stringify(mergedBboxPolygonFeatures) : '',
  )
  try {
    await $`osmium extract \
              --overwrite \
              --set-bounds \
              --polygon ${OSMIUM_FILTER_BBOX_FILE} \
              --output ${filteredFilePath(outputName)} \
              ${inputPath}`
  } catch (error) {
    throw new Error(`Failed to filter the OSM file by polygon: ${error}`)
  }
  return true
}
