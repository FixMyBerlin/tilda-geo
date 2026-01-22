#!/usr/bin/env bun

// We use bun.sh to run this file
import { staticRegion, type RegionSlug } from '@/src/data/regions.const'
import fs from 'node:fs'
import path from 'node:path'
import { styleText } from 'node:util'
import { createMaskConfig } from './createMasks/config'
import { downloadGeoJson } from './createMasks/download'

console.log(styleText(['inverse', 'bold'], 'START'), __filename)

const masksFolder = path.resolve(__dirname, './geojson/masks')

// Group regions by their complete set of relation IDs
// When a region has multiple relation IDs, the API returns one combined hull for all of them
type RelationGroup = {
  relationIds: number[] // Sorted array of relation IDs as unique identifier
  relationIdsKey: string // Hyphen-separated sorted IDs for folder naming (valid slug format)
  regions: Set<RegionSlug> // Set of region slugs to avoid duplicates
}

const relationGroups = new Map<RelationGroup['relationIdsKey'], RelationGroup>()

for (const region of staticRegion) {
  const { slug: regionSlug, osmRelationIds } = region
  if (!osmRelationIds.length) {
    console.info(styleText('yellow', `Skipping ${regionSlug} - no osmRelationIds`))
    continue
  }

  // Create a unique key from sorted relation IDs (so [1,2,3] and [3,2,1] are treated the same)
  const sortedIds = [...osmRelationIds].sort((a, b) => a - b)
  const relationIdsKey = sortedIds.join('-')

  if (!relationGroups.has(relationIdsKey)) {
    relationGroups.set(relationIdsKey, {
      relationIds: sortedIds,
      relationIdsKey,
      regions: new Set(),
    })
  }
  const group = relationGroups.get(relationIdsKey)!
  group.regions.add(regionSlug)
}

// Process each relation ID combination group
for (const { relationIds, relationIdsKey, regions } of relationGroups.values()) {
  console.info(
    styleText(['inverse', 'bold'], 'INFO: Processing relation'),
    relationIdsKey,
    `(${regions.size} region${regions.size > 1 ? 's' : ''})`,
  )

  const relationMaskFolder = path.join(masksFolder, `relation-${relationIdsKey}`)

  // Always create folder if it doesn't exist
  if (!fs.existsSync(relationMaskFolder)) {
    console.info(styleText('blue', `Creating folder structure for relation ${relationIdsKey}...`))
    fs.mkdirSync(relationMaskFolder, { recursive: true })
  }

  const maskConfig = createMaskConfig(Array.from(regions))

  const config = maskConfig.configs[0]
  if (!config) {
    throw new Error(`No config found for relation ${relationIdsKey}`)
  }

  const metaContent = `import { MetaData } from '../../../types'

export const data: MetaData = {
  regions: ${JSON.stringify(maskConfig.regions)},
  public: true,
  systemLayer: true,
  dataSourceType: 'local',
  mapRenderFormat: 'geojson',
  geometricPrecision: 'mask',
  hideDownloadLink: true,
  configs: [
    {
      name: ${JSON.stringify(config.name)},
      attributionHtml: ${JSON.stringify(config.attributionHtml)},
      inspector: {
        enabled: false,
      },
      category: undefined,
      updatedAt: undefined,
      description: undefined,
      dataSourceMarkdown: undefined,
      licence: undefined,
      licenceOsmCompatible: undefined,
      osmIdConfig: undefined,
      legends: undefined,
      layers: ${JSON.stringify(config.layers, null, 2)},
    },
  ],
} satisfies MetaData
`

  // Always overwrite meta.ts with all regions that use this relation ID combination
  await Bun.write(path.join(relationMaskFolder, 'meta.ts'), metaContent)
  console.info(styleText('green', `✓ Updated meta.ts for relation ${relationIdsKey}`))

  // Generate transform.ts if it doesn't exist
  const transformPath = path.join(relationMaskFolder, 'transform.ts')
  if (!fs.existsSync(transformPath)) {
    const transformContent = `import { transformRegionToMask } from '../../../createMasks/transform'
import { Polygon, MultiPolygon } from 'geojson'

export const transform = (
  data: Polygon | MultiPolygon,
) => {
  const bufferDistanceKm = 10
  return transformRegionToMask(data, bufferDistanceKm)
}
`
    await Bun.write(transformPath, transformContent)
  }

  // Download geojson from server (use all relation IDs - API returns one combined hull)
  // Only download if file doesn't exist yet
  const geojsonFilename = path.join(relationMaskFolder, `${relationIdsKey}.geojson`)
  if (!fs.existsSync(geojsonFilename)) {
    const idsString = relationIds.map(String).join(',')
    const geojson = await downloadGeoJson(idsString)

    if (!geojson) {
      console.error(styleText('red', `Failed to download geojson for relation ${relationIdsKey}`))
      continue
    }

    // Save raw geojson file (transformation will happen via transform.ts during static dataset processing)
    await Bun.write(geojsonFilename, JSON.stringify(geojson, null, 2))
    console.info(styleText('green', `✓ Updated ${geojsonFilename}`))
  } else {
    console.info(styleText('blue', `✓ GeoJSON already exists for relation ${relationIdsKey}`))
  }
}

console.info(styleText(['inverse', 'bold'], 'FINISHED createMasks'))
