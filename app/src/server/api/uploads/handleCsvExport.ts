import { headObject } from '@better-upload/server/helpers'
import type { FeatureCollection } from 'geojson'
import { z } from 'zod'
import { getConfiguredS3Client } from '@/server/s3Client.server'
import { internalServerErrorJson } from '../util/apiJsonResponses.server'
import { corsHeaders } from '../util/cors'
import { convertGeoJsonToCsv } from './convertGeoJsonToCsv'
import { fetchS3Json } from './fetchS3Json.server'
import { ifNoneMatchHasEtag } from './privateCaching.server'

// GeoJSON FeatureCollection schema
// Aligned with geojson package types (used by geoJSONToWkt from betterknown)
const GeoJsonFeatureCollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(
    z.object({
      type: z.literal('Feature'),
      geometry: z.object({
        type: z.enum([
          'Point',
          'LineString',
          'Polygon',
          'MultiPoint',
          'MultiLineString',
          'MultiPolygon',
          'GeometryCollection',
        ]),
        coordinates: z.any(), // Coordinates structure varies by geometry type
      }),
      properties: z.record(z.string(), z.any()).nullable().optional(),
      id: z.union([z.string(), z.number()]).optional(),
    }),
  ),
})

// Bump when the CSV conversion changes.
const CSV_CONVERSION_VERSION = 'v1'

/**
 * The CSV is made from the GeoJSON file, so its ETag comes from the ETag of that S3 object. Weak,
 * because the same file gives the same table only as long as the conversion does not change.
 */
const csvEtag = (geojsonEtag: string) =>
  `W/"${geojsonEtag.replaceAll('"', '')}-csv-${CSV_CONVERSION_VERSION}"`

/**
 * Handles CSV export requests by fetching GeoJSON data directly from S3 and converting to CSV.
 * Only the metadata of the S3 object is asked for first: a matching `If-None-Match` is a `304`
 * and a `HEAD` is answered, both without fetching or converting the file.
 */
export async function handleCsvExport(request: Request, geojsonUrl: string, baseName: string) {
  if (!geojsonUrl) {
    return Response.json(
      { statusText: 'Bad Request', message: 'No GeoJSON data available for CSV export' },
      { status: 400, headers: corsHeaders },
    )
  }

  try {
    const { hostname, pathname } = new URL(geojsonUrl)
    const bucket = hostname.split('.')[0]
    if (!bucket) throw new Error('Invalid S3 URL: could not parse bucket from hostname')
    const { eTag } = await headObject(getConfiguredS3Client(), {
      bucket,
      key: pathname.substring(1),
    })
    const headers = {
      ...corsHeaders,
      ETag: csvEtag(eTag),
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${baseName}.csv"`,
    }

    if (ifNoneMatchHasEtag(request, headers.ETag)) {
      return new Response(null, { status: 304, headers: { ...corsHeaders, ETag: headers.ETag } })
    }
    if (request.method === 'HEAD') {
      return new Response(null, { status: 200, headers })
    }

    // Fetch raw JSON data directly from S3 without compression, validated with Zod
    const geojsonData = await fetchS3Json(geojsonUrl, GeoJsonFeatureCollectionSchema)

    // Convert GeoJSON to CSV
    // Type is validated by Zod schema and matches FeatureCollection (used by geoJSONToWkt)
    const csvData = await convertGeoJsonToCsv(geojsonData as FeatureCollection)

    // Return CSV response
    return new Response(csvData, { status: 200, headers })
  } catch (error) {
    console.error('CSV export error:', error)
    return internalServerErrorJson({
      headers: corsHeaders,
      message: 'Failed to generate CSV',
    })
  }
}
