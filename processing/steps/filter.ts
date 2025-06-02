import { bboxPolygon, featureCollection, union } from '@turf/turf'
import { $ } from 'bun'
import { join } from 'path'
import {
  FILTER_DIR,
  FILTER_EXPRESSIONS,
  ID_FILTERED_FILE,
  OSM_FILTERED_DIR,
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

/**
 * Filter the OSM file wiht osmiumm and the given filter expressions.
 * The filter expressions are defined in /filter/filter-expressions.txt
 * @param fileName the file to filter
 * @param fileChanged whether that file changed since the last run
 * @returns the resulting file's name
 */
export async function tagFilter(fileName: string, fileChanged: boolean) {
  const filePath = filteredFilePath(fileName)
  const fileMissing = !(await Bun.file(filePath).exists())

  // Only run tag filters if the file or the filters have changed
  const filtersChanged = await directoryHasChanged(FILTER_DIR)
  const runFilter = fileChanged || filtersChanged || fileMissing
  if (fileChanged || filtersChanged || fileMissing) {
    console.log('Filtering the OSM file...')
    try {
      await $`osmium tags-filter \
                  --overwrite \
                  --expressions ${FILTER_EXPRESSIONS} \
                  --output=${filePath} \
                  ${originalFilePath(fileName)}`
    } catch (error) {
      throw new Error(`Failed to filter the OSM file: ${error}`)
    }
  } else {
    console.log(
      '⏩ Skipping tag filter. The file and filters are unchanged.',
      JSON.stringify({
        fileChanged,
        filtersChanged,
        fileMissing,
      }),
    )
  }

  updateDirectoryHash(FILTER_DIR)

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

export async function bboxesFilter(
  fileName: string,
  outputName: string,
  bboxes: Readonly<Array<TopicConfigBbox>>,
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

  const filterFile = filteredFilePath(`${outputName.split('.').at(0)}_filter.geojson`)
  Bun.write(filterFile, JSON.stringify(mergedBboxPolygonFeatures))

  const filedPbfExists = await Bun.file(filteredFilePath(outputName)).exists()
  const filterDirChanged = await directoryHasChanged(FILTER_DIR)
  if (filedPbfExists && !filterDirChanged) {
    console.log(
      '⏩ Skipping osmium extract for bboxFilter. The directory that stores the bbox filter geojson did not change.',
      JSON.stringify({ fileExists: filedPbfExists, FILTER_DIR, filterFile }),
    )
    return
  }
  updateDirectoryHash(FILTER_DIR)

  console.log('ℹ️ Filtering the OSM file with bboxes...', filterFile)
  try {
    await $`osmium extract \
              --overwrite \
              --set-bounds \
              --polygon ${filterFile} \
              --output ${filteredFilePath(outputName)} \
              ${filteredFilePath(fileName)}`
  } catch (error) {
    throw new Error(`Failed to filter the OSM file by polygon: ${error}`)
  }
}
