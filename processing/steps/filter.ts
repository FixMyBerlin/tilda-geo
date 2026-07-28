import { join } from 'node:path'
import { bboxPolygon, featureCollection, union } from '@turf/turf'
import { $ } from 'bun'
import {
  NIGHTLY_BBOX_FILTERED_FILE,
  NIGHTLY_FILTERED_FILE,
  OSM_FILTERED_DIR,
  OSMIUM_FILTER_BBOX_DIR,
  OSMIUM_FILTER_EXPRESSIONS_DIR,
  WEEKEND_BBOX_FILTERED_FILE,
  WEEKEND_FILTERED_FILE,
} from '../constants/directories.const'
import type { Topic, TopicConfigBbox, TopicSchedule } from '../constants/topics.const'
import { isDev } from '../utils/isDev'
import { params } from '../utils/parameters'
import { readHashFromFile, writeHashForFile } from '../utils/persistentData'
import { originalFilePath } from './download'

/**
 * Get the full path to the filtered file.
 * @param fileName file name
 * @returns full path to the file
 */
export const filteredFilePath = (fileName: string) => join(OSM_FILTERED_DIR, fileName)
const OSMIUM_FILTER_EXPRESSIONS_NIGHTLY_FILE = `${OSMIUM_FILTER_EXPRESSIONS_DIR}/filter-expressions-nightly.txt`
const OSMIUM_FILTER_EXPRESSIONS_WEEKEND_FILE = `${OSMIUM_FILTER_EXPRESSIONS_DIR}/filter-expressions-weekend.txt`
const OSMIUM_FILTER_BBOX_FILE = `${OSMIUM_FILTER_BBOX_DIR}/merged-bboxes.geojson`
const NIGHTLY_FILTER_HASH_KEY = 'tag-filter/nightly'
const WEEKEND_FILTER_HASH_KEY = 'tag-filter/weekend'

type ScheduleTagFilterConfig = {
  label: 'nightly' | 'weekend'
  sourceFileName: string
  outputFileName: string
  expressionsFile: string
  hashKey: string
  sourceFileChanged: boolean
}

async function filterExpressionsFileHasChanged(filePath: string, hashKey: string) {
  const newHash = await $`shasum "${filePath}"`.text()
  const oldHash = await readHashFromFile(hashKey)
  return oldHash !== newHash
}

async function updateFilterExpressionsFileHash(filePath: string, hashKey: string) {
  const newHash = await $`shasum "${filePath}"`.text()
  await writeHashForFile(hashKey, newHash)
}

/**
 * Run osmium tags-filter for one schedule (nightly or weekend).
 * Returns filterRegenerated — callers keep fileChanged tied to the download, not filter regen,
 * so filter regeneration does not skip diffing.
 */
async function runScheduleTagFilter({
  label,
  sourceFileName,
  outputFileName,
  expressionsFile,
  hashKey,
  sourceFileChanged,
}: ScheduleTagFilterConfig) {
  const pbfPath = filteredFilePath(outputFileName)
  const pbfMissing = !(await Bun.file(pbfPath).exists())
  const filtersChanged = await filterExpressionsFileHasChanged(expressionsFile, hashKey)
  // Only run tag filters if the file or the filters have changed
  const runFilter = sourceFileChanged || filtersChanged || pbfMissing

  if (runFilter) {
    console.log(`Filter: Filtering ${label} OSM file...`)
    try {
      await $`osmium tags-filter \
                  --overwrite \
                  --expressions ${expressionsFile} \
                  --output=${pbfPath} \
                  ${originalFilePath(sourceFileName)}`
    } catch (error) {
      throw new Error(`Failed to filter ${label} OSM file: ${error}`)
    }
  } else {
    console.log(
      `Filter: ⏩ Skipping ${label} tag filter. The file and filters are unchanged.`,
      JSON.stringify({ sourceFileChanged, filtersChanged, pbfMissing }),
    )
  }

  await updateFilterExpressionsFileHash(expressionsFile, hashKey)

  return { fileName: outputFileName, filterRegenerated: runFilter }
}

/**
 * Filter the OSM file with osmium and the nightly filter expressions.
 * The filter expressions are defined in /filter/filter-expressions-nightly.txt
 *
 * sourceFileChanged is whether the regional download changed since the last run (new download).
 * filterRegenerated in the result is separate — index.ts uses it for bbox clip regen, not diffing.
 */
export async function nightlyTagFilter(fileName: string, sourceFileChanged: boolean) {
  return runScheduleTagFilter({
    label: 'nightly',
    sourceFileName: fileName,
    outputFileName: NIGHTLY_FILTERED_FILE,
    expressionsFile: OSMIUM_FILTER_EXPRESSIONS_NIGHTLY_FILE,
    hashKey: NIGHTLY_FILTER_HASH_KEY,
    sourceFileChanged,
  })
}

/**
 * Filter the OSM file with osmium and the weekend filter expressions.
 * The filter expressions are defined in /filter/filter-expressions-weekend.txt
 *
 * Runs from the regional download, not the nightly PBF — weekend topics need a wider tag set.
 */
export async function weekendTagFilter(downloadFileName: string, sourceFileChanged: boolean) {
  return runScheduleTagFilter({
    label: 'weekend',
    sourceFileName: downloadFileName,
    outputFileName: WEEKEND_FILTERED_FILE,
    expressionsFile: OSMIUM_FILTER_EXPRESSIONS_WEEKEND_FILE,
    hashKey: WEEKEND_FILTER_HASH_KEY,
    sourceFileChanged,
  })
}

type ResolveTopicInputFileOptions = {
  schedule: TopicSchedule
  topic: Topic
  pipelineFileName: string
  sourceFileName: string
  fileChanged: boolean
  topicBboxes: readonly TopicConfigBbox[] | null
}

/**
 * Resolve the osm2pgsql input PBF for one topic.
 * 1. Start from the nightly schedule PBF prepared in index.ts (tag filter + optional global bbox).
 * 2. Weekend topics swap in the weekend schedule PBF from the regional download.
 * 3. Apply either the dev global bbox (weekend only; nightly global bbox is already in index.ts)
 *    or topic-config bboxes (e.g. parking in production).
 */
export async function resolveTopicInputFile({
  schedule,
  topic,
  pipelineFileName,
  sourceFileName,
  fileChanged,
  topicBboxes,
}: ResolveTopicInputFileOptions) {
  let schedulePbf = pipelineFileName
  let upstreamFilterRegenerated = false

  if (schedule === 'weekend') {
    const weekendFilter = await weekendTagFilter(sourceFileName, fileChanged)
    schedulePbf = weekendFilter.fileName
    upstreamFilterRegenerated = weekendFilter.filterRegenerated
  }

  if (params.processOnlyBbox) {
    // In dev mode with PROCESS_ONLY_BBOX we already applied a global bbox filter in index.ts
    // for nightly topics. Weekend topics still need their own global bbox clip here.
    if (schedule === 'weekend') {
      await bboxesFilter(
        schedulePbf,
        WEEKEND_BBOX_FILTERED_FILE,
        [params.processOnlyBbox],
        fileChanged,
        upstreamFilterRegenerated,
      )
      return WEEKEND_BBOX_FILTERED_FILE
    }
    return schedulePbf
  }

  // Bboxes: create a topic-specific filtered source file (e.g. parking in production).
  // Skipped when PROCESS_ONLY_BBOX is active — global bbox already applied above or in index.ts.
  if (topicBboxes) {
    const topicPbf = `${topic}_extracted.osm.pbf`
    await bboxesFilter(schedulePbf, topicPbf, topicBboxes, fileChanged, upstreamFilterRegenerated)
    return topicPbf
  }

  return schedulePbf
}

/**
 * Apply PROCESS_ONLY_BBOX once as a global filter on the nightly schedule PBF.
 * Returns sourceFileChanged to keep diffing behavior aligned with tag filters.
 * upstreamFilterRegenerated forces bbox clip regen when the nightly tag filter changed.
 */
export async function globalBboxFilter(
  fileName: string,
  sourceFileChanged: boolean,
  upstreamFilterRegenerated = false,
) {
  if (params.processOnlyBbox === null) return

  console.log(
    `Filtering the OSM file globally with \`PROCESS_ONLY_BBOX=${params.processOnlyBbox.join(',')}\`...`,
  )
  await bboxesFilter(
    fileName,
    NIGHTLY_BBOX_FILTERED_FILE,
    [params.processOnlyBbox],
    sourceFileChanged,
    upstreamFilterRegenerated,
  )

  // Return sourceFileChanged (not shouldRegenerate) so bbox regen does not skip diffing
  return { fileName: NIGHTLY_BBOX_FILTERED_FILE, fileChanged: sourceFileChanged }
}

/**
 * Create a bbox-clipped pbf from an already tag-filtered pbf.
 * Regenerates when the bbox, the source download, or the upstream tag filter changed — but the
 * caller keeps fileChanged tied to the download, so bbox regeneration never skips diffing.
 * @param sourceFileChanged whether the source OSM file changed since the last run (new download)
 * @param upstreamFilterRegenerated when true the upstream tag filter changed and this extract must regen
 */
export async function bboxesFilter(
  fileName: string,
  outputName: string,
  bboxes: Readonly<Array<TopicConfigBbox>>,
  sourceFileChanged: boolean,
  upstreamFilterRegenerated = false,
) {
  // Generate the osmium filter file.
  // We need to merge the bboxes to prevent https://github.com/osmcode/osmium-tool/issues/266
  const firstBbox = bboxes[0]
  if (!firstBbox) {
    throw new Error(`bboxesFilter requires at least one bbox, received ${JSON.stringify(bboxes)}`)
  }

  const mergedBboxPolygonFeatures =
    bboxes.length > 1
      ? union(featureCollection(bboxes.map((bbox) => bboxPolygon(bbox))))
      : bboxPolygon(firstBbox)
  if (!mergedBboxPolygonFeatures) {
    throw new Error(`Failed to merge bboxes ${JSON.stringify(bboxes)}`)
  }

  const filteredPbfExists = await Bun.file(filteredFilePath(outputName)).exists()
  const bboxFilterHashKey = `bbox-filter/${outputName}`
  const bboxFilterHash = JSON.stringify(mergedBboxPolygonFeatures)
  const filterChanged = (await readHashFromFile(bboxFilterHashKey)) !== bboxFilterHash
  // Regenerate if source file changed, bbox filter changed, upstream tag filter changed, or file is missing
  // Note: filterChanged (PROCESS_ONLY_BBOX changes) triggers regeneration but doesn't affect diffing
  const shouldRegenerate =
    sourceFileChanged || filterChanged || upstreamFilterRegenerated || !filteredPbfExists
  if (!shouldRegenerate) {
    console.log(
      '⏩ Skipping osmium extract for bboxFilter. The bbox filter and source PBF are unchanged.',
      JSON.stringify({
        filteredPbfExists,
        OSMIUM_FILTER_BBOX_FILE,
        sourceFileChanged,
        filterChanged,
        upstreamFilterRegenerated,
      }),
      isDev ? JSON.stringify(mergedBboxPolygonFeatures) : '',
    )
    return
  }

  console.log(
    'ℹ️ Filtering the OSM file with bboxes...',
    JSON.stringify({
      OSMIUM_FILTER_BBOX_FILE,
      sourceFileChanged,
      filterChanged,
      upstreamFilterRegenerated,
    }),
    isDev ? JSON.stringify(mergedBboxPolygonFeatures) : '',
  )
  // Must finish writing before osmium reads it below
  await Bun.write(OSMIUM_FILTER_BBOX_FILE, bboxFilterHash)
  try {
    await $`osmium extract \
              --overwrite \
              --set-bounds \
              --polygon ${OSMIUM_FILTER_BBOX_FILE} \
              --output ${filteredFilePath(outputName)} \
              ${filteredFilePath(fileName)}`
  } catch (error) {
    throw new Error(`Failed to filter the OSM file by polygon: ${error}`)
  }
  await writeHashForFile(bboxFilterHashKey, bboxFilterHash)
}
