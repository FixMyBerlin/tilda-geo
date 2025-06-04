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
 * @param fileChanged whether that file changed since the last run
 * @returns the resulting file's name
 */
export async function tagFilter(fileName: string, fileChanged: boolean) {
  const pbfPath = filteredFilePath(fileName)
  const pbfMissing = !(await Bun.file(pbfPath).exists())

  // Only run tag filters if the file or the filters have changed
  const filtersChanged = await directoryHasChanged(OSMIUM_FILTER_EXPRESSIONS_DIR)
  const runFilter = fileChanged || filtersChanged || pbfMissing
  if (runFilter) {
    console.log('Filtering the OSM file...')
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
      '⏩ Skipping tag filter. The file and filters are unchanged.',
      JSON.stringify({ fileChanged, filtersChanged, pbfMissing }),
    )
  }

  updateDirectoryHash(OSMIUM_FILTER_EXPRESSIONS_DIR)

  return { fileName, fileChanged: runFilter }
}

/**
 * Filter the OSM file with osmium and the given ids.
 * @param fileName the file to filter
 * @param ids the ids to filter
 * @returns the resulting file's name
 */
export async function idFilter(fileName: string, ids: string) {
  if (params.idFilter === '') return

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

  return { fileName: ID_FILTERED_FILE, fileChanged: true }
}

export async function bboxesFilter(fileName: string, bboxes: Readonly<Array<TopicConfigBbox>>) {
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

  const pbfFileName = filteredFilePath(`bbox_filtered_${fileName}`)
  const filedPbfExists = await Bun.file(pbfFileName).exists()
  const filterDirChanged = await directoryHasChanged(OSMIUM_FILTER_BBOX_DIR)
  if (filedPbfExists && !filterDirChanged) {
    console.log(
      '⏩ Skipping osmium extract for bboxFilter. The directory that stores the bbox filter geojson did not change.',
      JSON.stringify({ filedPbfExists, OSMIUM_FILTER_BBOX_FILE }),
    )
    return
  }
  updateDirectoryHash(OSMIUM_FILTER_BBOX_DIR)

  console.log('ℹ️ Filtering the OSM file with bboxes...', OSMIUM_FILTER_BBOX_FILE)
  try {
    await $`osmium extract \
              --overwrite \
              --set-bounds \
              --polygon ${OSMIUM_FILTER_BBOX_FILE} \
              --output ${pbfFileName} \
              ${filteredFilePath(fileName)}`
  } catch (error) {
    throw new Error(`Failed to filter the OSM file by polygon: ${error}`)
  }
}
