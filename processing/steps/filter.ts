import { bboxPolygon, featureCollection, union } from '@turf/turf'
import { $ } from 'bun'
import { join } from 'path'
import {
  ID_FILTERED_FILE,
  OSM_FILTERED_DIR,
  OSMIUM_FILTER_BBOX_DIR,
  OSMIUM_FILTER_EXPRESSIONS_DIR,
} from '../constants/directories.const'
import type { TopicConfigBbox } from '../constants/topics.const'
import { directoryHasChanged, updateDirectoryHash } from '../utils/hashing'
import { isDev } from '../utils/isDev'
import { params } from '../utils/parameters'
import { originalFilePath } from './download'

/**
 * Get the full path to the filtered file.
 * @param fileName file name
 * @returns full path to the file
 */
export const filteredFilePath = (fileName: string) => join(OSM_FILTERED_DIR, fileName)
const OSMIUM_FILTER_EXPRESSIONS_FILE = `${OSMIUM_FILTER_EXPRESSIONS_DIR}/filter-expressions.txt`
const OSMIUM_FILTER_BBOX_FILE = `${OSMIUM_FILTER_BBOX_DIR}/merged-bboxes.geojson`

/**
 * Filter the OSM file wiht osmiumm and the given filter expressions.
 * The filter expressions are defined in /filter/filter-expressions.txt
 * @param fileName the file to filter
 * @param sourceFileChanged whether the source OSM file changed since the last run (new download)
 * @returns the resulting file's name and whether the source file changed (not whether filters were regenerated)
 */
export async function tagFilter(fileName: string, sourceFileChanged: boolean) {
  const pbfPath = filteredFilePath(fileName)
  const pbfMissing = !(await Bun.file(pbfPath).exists())

  // Only run tag filters if the file or the filters have changed
  const filtersChanged = await directoryHasChanged(OSMIUM_FILTER_EXPRESSIONS_DIR)
  const runFilter = sourceFileChanged || filtersChanged || pbfMissing
  if (runFilter) {
    console.log('Filter: Filtering the OSM file...')
    try {
      await $`osmium tags-filter \
                  --overwrite \
                  --expressions ${OSMIUM_FILTER_EXPRESSIONS_FILE} \
                  --output=${pbfPath} \
                  ${originalFilePath(fileName)}`
    } catch (error) {
      throw new Error(`Failed to filter the OSM file: ${error}`)
    }
  } else {
    console.log(
      'Filter: ⏩ Skipping tag filter. The file and filters are unchanged.',
      JSON.stringify({ sourceFileChanged, filtersChanged, pbfMissing }),
    )
  }

  updateDirectoryHash(OSMIUM_FILTER_EXPRESSIONS_DIR)

  // Return sourceFileChanged (not runFilter) so that filter regeneration doesn't skip diffing
  // Filter regeneration is needed, but shouldn't affect diffing logic
  return { fileName, fileChanged: sourceFileChanged }
}

/**
 * Filter the OSM file with osmium and the given ids.
 * Regenerates the filtered file when ID filter is active, but doesn't affect
 * the fileChanged flag used for diffing decisions (same as tagFilter/bboxesFilter).
 * @param fileName the file to filter
 * @param sourceFileChanged whether the source OSM file changed since the last run (new download)
 * @param ids the ids to filter, use format `w123 w234`
 * @returns the resulting file's name and sourceFileChanged flag (not affected by filter regeneration)
 */
export async function idFilter(fileName: string, sourceFileChanged: boolean, ids: typeof params.idFilter) {
  if (params.idFilter === false) return

  console.log(`Filtering the OSM file with \`ID_FILTER=${ids}\`...`)
  try {
    await $`osmium getid \
              --overwrite \
              --output=${filteredFilePath(ID_FILTERED_FILE)} \
              --verbose-ids ${filteredFilePath(fileName)} \
              ${ids}`
  } catch (error) {
    throw new Error(`Failed to filter the OSM file by ids: ${error}`)
  }

  // Return sourceFileChanged (not true) so that ID filter regeneration doesn't skip diffing
  // ID filter is used for testing/debugging, but filtered data can still be diffed against previous run
  return { fileName: ID_FILTERED_FILE, fileChanged: sourceFileChanged }
}

/**
 * Create filtered pbf files based on bboxes.
 * Regenerates the filtered file when bbox changes or source file changed, but doesn't affect
 * the fileChanged flag used for diffing decisions (similar to tagFilter).
 * @param filename
 * @param outputName
 * @param bboxes Array of Bboxes as defined in processing/constants/topics.const.ts
 * @param sourceFileChanged whether the source OSM file changed since the last run (new download)
 */
export async function bboxesFilter(
  fileName: string,
  outputName: string,
  bboxes: Readonly<Array<TopicConfigBbox>>,
  sourceFileChanged: boolean,
) {
  // Generate the osmium filter file.
  // We need to merge the bboxes to prevent https://github.com/osmcode/osmium-tool/issues/266
  const mergedBboxPolygonFeatures =
    bboxes.length > 1
      ? union(featureCollection(bboxes.map((bbox) => bboxPolygon(bbox))))
      : bboxPolygon(bboxes[0])
  if (!mergedBboxPolygonFeatures) {
    throw new Error(`Failed to merge bboxes ${JSON.stringify(bboxes)}`)
  }

  Bun.write(OSMIUM_FILTER_BBOX_FILE, JSON.stringify(mergedBboxPolygonFeatures))

  const filteredPbfExists = await Bun.file(filteredFilePath(outputName)).exists()
  const filterDirChanged = await directoryHasChanged(OSMIUM_FILTER_BBOX_DIR)
  // Regenerate if source file changed, bbox filter changed, or file is missing
  // Note: filterDirChanged (PROCESS_ONLY_BBOX changes) triggers regeneration but doesn't affect diffing
  const shouldRegenerate = sourceFileChanged || filterDirChanged || !filteredPbfExists
  if (!shouldRegenerate) {
    console.log(
      '⏩ Skipping osmium extract for bboxFilter. The directory that stores the bbox filter geojson did not change.',
      JSON.stringify({ filteredPbfExists, OSMIUM_FILTER_BBOX_FILE, sourceFileChanged, filterDirChanged }),
      isDev ? JSON.stringify(mergedBboxPolygonFeatures) : '',
    )
    return
  }
  updateDirectoryHash(OSMIUM_FILTER_BBOX_DIR)

  console.log(
    'ℹ️ Filtering the OSM file with bboxes...',
    JSON.stringify({ OSMIUM_FILTER_BBOX_FILE, sourceFileChanged, filterDirChanged }),
    isDev ? JSON.stringify(mergedBboxPolygonFeatures) : '',
  )
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
}
