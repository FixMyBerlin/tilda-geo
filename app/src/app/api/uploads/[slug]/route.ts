/**
 * Upload API Route
 *
 * Handles requests for uploaded files (pmtiles/geojson/csv) with authentication.
 *
 * File Access:
 * - GET /api/uploads/{slug} - Returns pmtiles (fallback for old URLs)
 * - GET /api/uploads/{slug}.pmtiles - Returns pmtiles file
 * - GET /api/uploads/{slug}.geojson - Returns geojson file
 * - GET /api/uploads/{slug}.csv - CSV export of geojson data with semicolon delimiter
 *   CSV format:
 *   - geometry_type: Geometry type (Point, LineString, Polygon, etc.)
 *   - geometry_wkt: WKT representation (QGIS compatible)
 *   - All GeoJSON feature properties as additional columns
 *
 */

import db from '@/db'
import { getBlitzContext } from '@/src/blitz-server'
import { corsHeaders } from '../../_util/cors'
import { handleCsvExport } from './utils/handleCsvExport'
import { parseSlugAndFormat } from './utils/parseSlugAndFormat'
import { proxyS3Url } from './utils/proxyS3Url'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const { slug } = params

  // Parse slug and format
  const parseResult = parseSlugAndFormat({
    slug,
    allowedFormats: ['pmtiles', 'geojson', 'csv'],
    fallbackFormat: 'pmtiles',
  })
  if (!parseResult.success) {
    return parseResult.response
  }
  const { baseName, extension } = parseResult.result!

  // Find the upload by base name (without extension)
  const upload = await db.upload.findFirst({
    where: { slug: baseName },
    include: { regions: { select: { id: true } } },
  })

  if (upload === null) {
    return Response.json({ statusText: 'Not Found' }, { status: 404, headers: corsHeaders })
  }

  // Security checks
  if (!upload.public) {
    const forbidden = Response.json(
      { statusText: 'Forbidden' },
      { status: 403, headers: corsHeaders },
    )
    const { session } = await getBlitzContext()
    if (!session.userId) {
      return forbidden
    }
    if (session.role !== 'ADMIN') {
      // user must be a member in one or more regions the upload is related to
      const regionIds = upload.regions.map((region) => region.id)
      const membershipExists = !!(await db.membership.count({
        where: { userId: session.userId!, region: { id: { in: regionIds } } },
      }))
      if (!membershipExists) {
        return forbidden
      }
    }
  }

  // Get the appropriate URL from upload
  const fileUrl = extension === 'pmtiles' ? upload.pmtilesUrl : upload.geojsonUrl

  if (!fileUrl) {
    return Response.json(
      { statusText: 'File URL not found in upload' },
      { status: 500, headers: corsHeaders },
    )
  }

  // Handle CSV export by first getting GeoJSON data, then converting
  if (extension === 'csv') {
    return handleCsvExport(upload.geojsonUrl, baseName)
  }

  // Handle regular file requests (pmtiles/geojson)
  // Note: The download header does not interfere with Maplibre rendering of this route
  const downloadFilename = extension === 'geojson' ? `${baseName}.geojson` : undefined
  return proxyS3Url(request, fileUrl, downloadFilename)
}
