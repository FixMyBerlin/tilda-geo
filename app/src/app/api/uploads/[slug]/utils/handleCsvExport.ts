import { corsHeaders } from '../../../_util/cors'
import { convertGeoJsonToCsv } from './convertGeoJsonToCsv'
import { fetchS3Json } from './fetchS3Json'

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
    // Fetch raw JSON data directly from S3 without compression
    const geojsonData = await fetchS3Json(geojsonUrl)

    // Convert GeoJSON to CSV
    const csvData = await convertGeoJsonToCsv(geojsonData)

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
