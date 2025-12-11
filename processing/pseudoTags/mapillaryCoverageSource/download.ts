import { $ } from 'bun'
import { isSameMinute } from 'date-fns'
import { join } from 'node:path'
import { PSEUDO_TAGS_DATA } from '../../constants/directories.const'
import { berlinTimeString } from '../../utils/berlinTime'
import { humanFileSize } from '../../utils/humanFileSize'
import {
  getLatestMapillaryCoverageMetadata,
  initializeMapillaryCoverageMetadataTable,
  insertMapillaryCoverageMetadata,
} from './metadata'
import { mapillaryDataDatesSchema, osmDataDatesSchema } from './schema'
import { mapillaryCoverageSources } from './source.const'

export async function downloadMapillaryCoverage() {
  // Initialize
  console.log('Initialize: Pseudo Tags')
  await initializeMapillaryCoverageMetadataTable()
  const csvDestPath = join(PSEUDO_TAGS_DATA, 'mapillary_coverage.csv')
  await $`mkdir -p ${PSEUDO_TAGS_DATA}`

  // Fetch JSON metadata files to check if dates have changed
  const mapillaryMetadataRes = await fetch(mapillaryCoverageSources.mapillaryDataDates)
  if (!mapillaryMetadataRes.ok) throw new Error('Failed to download Mapillary data dates JSON')
  const validatedMapillaryDates = mapillaryDataDatesSchema.parse(await mapillaryMetadataRes.json())

  const osmMetadataRes = await fetch(mapillaryCoverageSources.osmDataDates)
  if (!osmMetadataRes.ok) throw new Error('Failed to download OSM data dates JSON')
  const validatedOsmDates = osmDataDatesSchema.parse(await osmMetadataRes.json())

  // Check if dates changed by comparing with database
  const latestMetadata = await getLatestMapillaryCoverageMetadata()
  const datesChanged =
    !latestMetadata ||
    !isSameMinute(latestMetadata.ml_data_from, validatedMapillaryDates.ml_data_from) ||
    !isSameMinute(latestMetadata.osm_data_from, validatedOsmDates.osm_data_from)

  // Check if CSV file exists
  const csvExists = await Bun.file(csvDestPath).exists()

  if (!csvExists || datesChanged) {
    console.log(
      'Pseudo Tags: Downloading Mapillary Coverage',
      mapillaryCoverageSources.github,
      JSON.stringify({ csvExists, datesChanged }),
    )

    // Download CSV
    const csvRes = await fetch(mapillaryCoverageSources.data)
    if (!csvRes.ok) throw new Error('Failed to download Mapillary coverage CSV')
    await Bun.write(csvDestPath, await csvRes.arrayBuffer())
    const { size } = await Bun.file(csvDestPath).stat()

    // Store metadata in database
    await insertMapillaryCoverageMetadata(
      validatedMapillaryDates.ml_data_from,
      validatedOsmDates.osm_data_from,
    )

    console.log(
      'Pseudo Tags: Pseudo tags data for Mapillary coverage downloaded.',
      humanFileSize(size),
      `Data from ${berlinTimeString(validatedMapillaryDates.ml_data_from)}`,
    )
  } else {
    console.log(
      'Pseudo Tags: ⏩ Skipping download – Mapillary coverage CSV exists and dates did not change.',
      `Data from ${berlinTimeString(validatedMapillaryDates.ml_data_from)}`,
    )
  }
}
