// We use bun.sh to run this file
import { getBoundaryExportApiBaseUrl } from '@/src/app/_components/utils/getExportApiUrl'
import { staticRegion } from '@/src/data/regions.const'
import {
  bbox,
  buffer,
  centerOfMass,
  difference,
  feature,
  featureCollection,
  point,
  polygon,
  simplify,
} from '@turf/turf'
import { styleText } from 'node:util'
import { Feature, MultiPolygon, Polygon } from 'geojson'
import path from 'node:path'
import { z } from 'zod'

console.log(styleText(['inverse', 'bold'], 'START'), __filename)

const geojsonPolygon = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
})
const geojsonMultipolyon = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))),
})
const geojsonInputSchema = z.union([geojsonPolygon, geojsonMultipolyon])
const geoJsonResultSchema = z.object({
  type: z.literal('Feature'),
  geometry: geojsonMultipolyon.or(geojsonPolygon),
  properties: z.object({
    kind: z.enum(['boundary', 'buffer']),
    ids: z.string(),
    region: z.string(),
  }),
})

const errorLog: any[] = []

const handleError = (error: (string | Record<string, string | number>)[]) => {
  errorLog.push(Date.now().toString(), error)
  const errorMessage = error.map((e) => typeof e === 'string' ? e : JSON.stringify(e)).join(' ')
  console.error(styleText(['bgYellow', 'black'], errorMessage))
}

const saveErrors = async () => {
  const fileName = 'error.log'
  const filePath = path.resolve(__dirname, fileName)
  await Bun.write(filePath, JSON.stringify(errorLog, undefined, 2))
}

const downloadGeoJson = async (idsString: string) => {
  // We always use the production DB since that holds all relevant releations
  const url = new URL(getBoundaryExportApiBaseUrl('production'))
  idsString
    .split(',')
    .map(Number)
    .filter(Boolean)
    .forEach((id) => {
      url.searchParams.append('ids', String(id))
    })

  console.info(styleText(['inverse', 'bold'], 'DOWNLOAD'), url.href)
  const response = await fetch(url.href)

  try {
    const data = await response.json()
    const geoJson = geojsonInputSchema.parse(data)
    return geoJson
  } catch (error) {
    handleError([
      'ERROR: Download failed for',
      url.href,
      {
        statusCode: response.status,
        statusText: response.statusText,
        response: JSON.stringify(response),
      },
    ])
  }
}

const createBoundaryFeature = (geojson, ids: string, region: string) => {
  const boundaryPoly = simplify(geojson, { tolerance: 0.0001, highQuality: false })

  const result = geoJsonResultSchema.parse(feature(boundaryPoly, { kind: 'boundary', ids, region }))
  return result
}

const createBufferFeature = (
  boundaryPoly: ReturnType<typeof createBoundaryFeature>,
  ids: string,
  region: string,
) => {
  const bufferedFeature = buffer(boundaryPoly, 10, { units: 'kilometers' })!
  const result = geoJsonResultSchema.parse(
    feature(bufferedFeature.geometry, { kind: 'buffer', ids, region }),
  )
  return result
}

const createMaskFeature = (featureToCutOut: ReturnType<typeof createBufferFeature>) => {
  const germanyBufferedBbox = [-2.9991468, 42.3057833, 20.8835987, 58.1121625] as const
  const germanyBboxPolygon = polygon(
    [
      [
        [germanyBufferedBbox[0], germanyBufferedBbox[1]],
        [germanyBufferedBbox[0], germanyBufferedBbox[3]],
        [germanyBufferedBbox[2], germanyBufferedBbox[3]],
        [germanyBufferedBbox[2], germanyBufferedBbox[1]],
        [germanyBufferedBbox[0], germanyBufferedBbox[1]],
      ],
    ],
    featureToCutOut.properties, // those will be added to the returning feature
  )

  const mask = difference(
    featureCollection([
      germanyBboxPolygon as Feature<Polygon | MultiPolygon>,
      featureToCutOut as Feature<Polygon | MultiPolygon>,
    ]),
  )
  const result = geoJsonResultSchema.parse(mask)
  return result
}

// 1. Collect the boundary and mask per region
const collectedFeatures: ReturnType<typeof createBufferFeature>[] = []
for (const region of staticRegion) {
  const { slug: regionName, osmRelationIds } = region
  if (!osmRelationIds.length) continue
  console.info(styleText(['inverse', 'bold'], `INFO: Now working on region ${regionName}`))

  const geojson = await downloadGeoJson(osmRelationIds.map(String).join(','))
  if (geojson) {
    const ids = osmRelationIds.join(',')

    const boundaryFeature = createBoundaryFeature(geojson, ids, regionName)
    const bufferFeature = createBufferFeature(boundaryFeature, ids, regionName)
    const mask = createMaskFeature(bufferFeature)

    collectedFeatures.push(boundaryFeature)
    collectedFeatures.push(mask)

    // Store separate files for debugging
    await Bun.write(
      path.resolve(__dirname, `./geojson/${regionName}-boundary-for-debugging.geojson`),
      JSON.stringify(boundaryFeature),
    )
    await Bun.write(
      path.resolve(__dirname, `./geojson/${regionName}-buffered-boundary-for-debugging.geojson`),
      JSON.stringify(bufferFeature),
    )
    await Bun.write(
      path.resolve(__dirname, `./geojson/${regionName}-mask-for-debugging.geojson`),
      JSON.stringify(mask),
    )
    // And also store the bbox and centerOfMass for use in regions.const.ts
    await Bun.write(
      path.resolve(__dirname, `./geojson/${regionName}-bbox-center-for-reference.geojson`),
      JSON.stringify(
        point(centerOfMass(boundaryFeature).geometry.coordinates, {
          bbox: bbox(boundaryFeature),
        }),
      ),
    )
  }
}

// 2. Save them locally to be picked up by createMbtiles
const collectedFeatureCollection = featureCollection(collectedFeatures)
const boundariesAndMaskGeojson = path.resolve(__dirname, './geojson/atlas-regional-masks.geojson')
await Bun.write(boundariesAndMaskGeojson, JSON.stringify(collectedFeatureCollection))

await saveErrors()
console.info(styleText(['inverse', 'bold'], 'FINISHED createGeojson'))
