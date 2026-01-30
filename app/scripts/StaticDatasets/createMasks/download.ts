import { styleText } from 'node:util'
import { z } from 'zod'

const geojsonPolygon = z.object({
  type: z.literal('Polygon'),
  coordinates: z.array(z.array(z.tuple([z.number(), z.number()]))),
})
const geojsonMultipolyon = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(z.array(z.array(z.tuple([z.number(), z.number()])))),
})
const geojsonInputSchema = z.union([geojsonPolygon, geojsonMultipolyon])

// We always use the production DB since that holds all relevant relations
// Duplicates `getBoundaryExportApiBaseUrl` because this file is in a symlinked directory and cannot import from the main app
const API_URL_BOUNDARIES = 'https://tilda-geo.de/api/boundary'

export async function downloadGeoJson(idsString: string) {
  const url = new URL(API_URL_BOUNDARIES)
  idsString
    .split(',')
    .map(Number)
    .filter(Boolean)
    .forEach((id) => {
      url.searchParams.append('ids', String(id))
    })

  console.info(styleText(['inverse', 'bold'], 'DOWNLOAD'), url.href)
  const response = await fetch(url.href)

  if (!response.ok) {
    throw new Error(`Failed to download geojson: ${response.status} ${response.statusText}`)
  }

  try {
    const data = await response.json()
    const geoJson = geojsonInputSchema.parse(data)
    return geoJson
  } catch (error) {
    console.error(styleText('red', 'ERROR: Download failed for'), url.href, error)
    throw error
  }
}
