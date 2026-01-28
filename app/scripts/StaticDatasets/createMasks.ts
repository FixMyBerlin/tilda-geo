#!/usr/bin/env bun

// We use bun.sh to run this file
import { staticRegion } from '@/src/data/regions.const'
import { feature, featureCollection } from '@turf/turf'
import fs from 'node:fs'
import path from 'node:path'
import { styleText } from 'node:util'
import { downloadGeoJson } from './createMasks/download'

console.log(styleText(['inverse', 'bold'], 'START'), __filename)

const masksFolder = path.resolve(__dirname, './geojson/masks')

// Process each region individually
for (const region of staticRegion) {
  const { slug: regionSlug, mask } = region

  // Skip regions without mask configuration
  if (!mask) {
    console.info(styleText('yellow', `Skipping ${regionSlug} - no mask configuration`))
    continue
  }

  const { osmRelationIds, bufferKm } = mask

  if (!osmRelationIds.length) {
    console.info(styleText('yellow', `Skipping ${regionSlug} - no osmRelationIds in mask`))
    continue
  }

  console.info(
    styleText(['inverse', 'bold'], 'INFO: Processing region'),
    regionSlug,
    `(relation IDs: ${osmRelationIds.join(', ')})`,
  )

  // Create folder name based on region slug
  const regionMaskFolder = path.join(masksFolder, `region-${regionSlug}`)

  // Always create folder if it doesn't exist
  if (!fs.existsSync(regionMaskFolder)) {
    console.info(styleText('blue', `Creating folder structure for region ${regionSlug}...`))
    fs.mkdirSync(regionMaskFolder, { recursive: true })
  }

  // Generate relation IDs key for GeoJSON filename (sorted, hyphen-separated)
  const sortedIds = [...osmRelationIds].sort((a, b) => a - b)
  const relationIdsKey = sortedIds.join('-')

  // Generate transform.ts - always overwrite
  const transformPath = path.join(regionMaskFolder, 'transform.ts')
  const transformContent = `import { transformRegionMask } from '../../_sharedMasks/transform'
import { FeatureCollection } from 'geojson'

export const transform = (data: FeatureCollection) => {
  return transformRegionMask({ data, bufferDistanceKm: ${bufferKm} })
}
`
  await Bun.write(transformPath, transformContent)
  console.info(styleText('green', `✓ Updated transform.ts for region ${regionSlug}`))

  // Generate meta.ts - only create if missing
  const metaPath = path.join(regionMaskFolder, 'meta.ts')
  if (!fs.existsSync(metaPath)) {
    const metaContent = `import { MetaData } from '../../../types'
import { maskMeta } from '../../_sharedMasks/maskMeta'
import { maskLayers } from '../../_sharedMasks/maskLayers'

// @ts-expect-error - See createMasks.ts
export const data: MetaData = maskMeta({
  regions: ['${regionSlug}'],
  layers: maskLayers,
})
`
    await Bun.write(metaPath, metaContent)
    console.info(styleText('green', `✓ Created meta.ts for region ${regionSlug}`))
  } else {
    console.info(styleText('blue', `✓ meta.ts already exists for region ${regionSlug} (skipped)`))
  }

  // Download geojson from server (use all relation IDs - API returns one combined hull)
  // Only download if file doesn't exist yet
  const geojsonFilename = path.join(regionMaskFolder, `${relationIdsKey}.geojson`)
  if (!fs.existsSync(geojsonFilename)) {
    const idsString = sortedIds.map(String).join(',')
    const geometry = await downloadGeoJson(idsString)

    if (!geometry) {
      console.error(styleText('red', `Failed to download geojson for region ${regionSlug}`))
      continue
    }

    // Wrap geometry in FeatureCollection for proper GeoJSON format
    const regionFeature = feature(geometry, {})
    const featureCollectionData = featureCollection([regionFeature])

    // Save raw geojson file (transformation will happen via transform.ts during static dataset processing)
    // Prettier formatting is handled by the npm script chain (regions:masks:format)
    await Bun.write(geojsonFilename, JSON.stringify(featureCollectionData, null, 2))
    console.info(styleText('green', `✓ Updated ${geojsonFilename}`))
  } else {
    console.info(styleText('blue', `✓ GeoJSON already exists for region ${regionSlug}`))
  }
}

console.info(styleText(['inverse', 'bold'], 'FINISHED createMasks'))
