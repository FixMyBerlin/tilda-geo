import type { FeatureCollection } from 'geojson'
import { z } from 'zod'
import { corsHeaders } from '../../../_util/cors'
import { convertGeoJsonToCsv } from './convertGeoJsonToCsv'
import { fetchS3Json } from './fetchS3Json'

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
      properties: z.record(z.any()).nullable().optional(),
      id: z.union([z.string(), z.number()]).optional(),
    }),
  ),
})

/**
 * Handles CSV export requests by fetching GeoJSON data directly from S3 and converting to CSV
 */
export async function handleCsvExport(geojsonUrl: string, baseName: string) {
  if (!geojsonUrl) {
    return Response.json(
      { statusText: 'Bad Request', message: 'No GeoJSON data available for CSV export' },
      { status: 400, headers: corsHeaders },
    )
  }

  try {
    // Fetch raw JSON data directly from S3 without compression, validated with Zod
    const geojsonData = await fetchS3Json(geojsonUrl, GeoJsonFeatureCollectionSchema)

    // Convert GeoJSON to CSV
    // Type is validated by Zod schema and matches FeatureCollection (used by geoJSONToWkt)
    const csvData = await convertGeoJsonToCsv(geojsonData as FeatureCollection)

    // Return CSV response
    return new Response(csvData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${baseName}.csv"`,
      },
    })
  } catch (error) {
    console.error('CSV export error:', error)
    return Response.json(
      { statusText: 'Internal Server Error', message: 'Failed to generate CSV' },
      { status: 500, headers: corsHeaders },
    )
  }
}
