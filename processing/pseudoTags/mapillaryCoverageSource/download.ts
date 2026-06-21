import { Buffer } from 'node:buffer'
import { existsSync } from 'node:fs'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { isSameMinute } from 'date-fns'
import { PSEUDO_TAGS_DATA } from '../../constants/directories.const'
import { berlinTimeString } from '../../utils/berlinTime'
import { humanFileSize } from '../../utils/humanFileSize'
import { params } from '../../utils/parameters'
import { $ } from '../../utils/sh'
import {
  getLatestMapillaryCoverageMetadata,
  initializeMapillaryCoverageMetadataTable,
  insertMapillaryCoverageMetadata,
} from './metadata'
import { mapillaryDataDatesSchema, osmDataDatesSchema } from './schema'
import { mapillaryCoverageSources } from './source.const'

/** `fixed` keeps the CSV from the reference run; `reference` always refreshes the baseline. */
export async function downloadMapillaryCoverage() {
  const { diffingMode } = params
  // Initialize
  console.log('[Pseudo Tags][Mapillary] Initialize and download Metadata…')
  await initializeMapillaryCoverageMetadataTable()
  const csvDestPath = join(PSEUDO_TAGS_DATA, 'mapillary_coverage.csv')
  await $`mkdir -p ${PSEUDO_TAGS_DATA}`
  const csvExists = existsSync(csvDestPath)

  if (diffingMode === 'fixed') {
    if (!csvExists) {
      console.warn(
        '[Pseudo Tags][Mapillary] fixed mode: mapillary_coverage.csv missing — continuing without Mapillary pseudo-tags (run reference mode first for comparable diffs).',
      )
      return
    }
    console.log(
      '[Pseudo Tags][Mapillary] fixed mode: reusing baseline CSV from reference run (no download).',
    )
    return
  }

  // Fetch JSON metadata files to check if dates have changed
  const mapillaryMetadataRes = await fetch(mapillaryCoverageSources.mapillaryDataDates)
  if (!mapillaryMetadataRes.ok)
    throw new Error('Pseudo Tags][Mapillary] ERROR: Failed to download Mapillary data dates JSON')
  const validatedMapillaryDates = mapillaryDataDatesSchema.parse(await mapillaryMetadataRes.json())

  const osmMetadataRes = await fetch(mapillaryCoverageSources.osmDataDates)
  if (!osmMetadataRes.ok)
    throw new Error('Pseudo Tags][Mapillary] Failed to download OSM data dates JSON')
  const validatedOsmDates = osmDataDatesSchema.parse(await osmMetadataRes.json())

  // Check if dates changed by comparing with database
  const latestMetadata = await getLatestMapillaryCoverageMetadata()
  const datesChanged =
    !latestMetadata ||
    !isSameMinute(latestMetadata.ml_data_from, validatedMapillaryDates.ml_data_from) ||
    !isSameMinute(latestMetadata.osm_data_from, validatedOsmDates.osm_data_from)

  const forceDownload = diffingMode === 'reference'
  const shouldDownload = forceDownload || !csvExists || datesChanged

  if (shouldDownload) {
    console.time('[Pseudo Tags][Mapillary] Download-Timer')
    console.log(
      '[Pseudo Tags][Mapillary] Download Mapillary Coverage…',
      forceDownload ? 'reference mode: refreshing baseline CSV for fixed-run comparisons.' : '',
      mapillaryCoverageSources.github,
      JSON.stringify({ csvExists, datesChanged, forceDownload, diffingMode }),
    )

    // Download CSV
    const csvRes = await fetch(mapillaryCoverageSources.data)
    if (!csvRes.ok)
      throw new Error('[Pseudo Tags][Mapillary] ERROR: Failed to download Mapillary coverage CSV')
    await mkdir(dirname(csvDestPath), { recursive: true })
    await writeFile(csvDestPath, Buffer.from(await csvRes.arrayBuffer()))
    const { size } = await stat(csvDestPath)

    // Store metadata in database
    await insertMapillaryCoverageMetadata(
      validatedMapillaryDates.ml_data_from,
      validatedOsmDates.osm_data_from,
    )

    console.log(
      '[Pseudo Tags][Mapillary] Download finished',
      humanFileSize(size),
      `Data from ${berlinTimeString(validatedMapillaryDates.ml_data_from)}`,
    )
    console.timeEnd('[Pseudo Tags][Mapillary] Download-Timer')
  } else {
    console.log(
      '[Pseudo Tags][Mapillary] ⏩ Skipping download.',
      'Mapillary coverage CSV exists and dates did not change.',
      `Data from ${berlinTimeString(validatedMapillaryDates.ml_data_from)}`,
    )
  }
}
