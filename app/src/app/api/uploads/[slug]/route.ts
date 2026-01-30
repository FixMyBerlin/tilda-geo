/**
 * Upload API Route - handles requests for uploaded files with authentication.
 * See docs/Uploads.md for details.
 */

// Disable Next.js caching for this route to avoid 2MB fetch cache limit
// External sources can be large files (>2MB), so we use file-based caching instead
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import db from '@/db'
import { MapDataSourceExternalRenderFormat } from '@/scripts/StaticDatasets/types'
import { getBlitzContext } from '@/src/blitz-server'
import { corsHeaders } from '../../_util/cors'
import { handleCsvExport } from './utils/handleCsvExport'
import { parseSlugAndFormat } from './utils/parseSlugAndFormat'
import { proxyExternalUrl } from './utils/proxyExternalUrl'
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

  // Determine allowed formats based on which URLs are present
  // CSV is only available for local sources (not external)
  const allowedFormats: string[] = []
  if (upload.geojsonUrl) {
    allowedFormats.push('geojson')
    if (!upload.externalSourceUrl) {
      allowedFormats.push('csv')
    }
  }
  if (upload.pmtilesUrl) {
    allowedFormats.push('pmtiles')
  }

  // Validate format is allowed for this upload
  if (!allowedFormats.includes(extension)) {
    return Response.json(
      {
        statusText: 'Format not available',
        message: `Requested format "${extension}" is not available. Use ${allowedFormats.map((f) => `.${f}`).join(', ')}`,
      },
      { status: 400, headers: corsHeaders },
    )
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

  // Handle CSV export (only for local sources)
  if (extension === 'csv') {
    return handleCsvExport(upload.geojsonUrl!, baseName)
  }

  // Handle `dataSourceType: 'external'` which we proxy and cache from an external URL
  if (upload.externalSourceUrl && upload.cacheTtlSeconds) {
    return proxyExternalUrl(
      request,
      upload.externalSourceUrl,
      upload.cacheTtlSeconds,
      extension as MapDataSourceExternalRenderFormat,
      baseName,
    )
  }

  // Handle regular file requests (pmtiles/geojson)
  // `dataSourceType: 'local'` from S3
  // First a TS guard since our Types are not perfect…
  const fileUrl = extension === 'pmtiles' ? upload.pmtilesUrl : upload.geojsonUrl
  if (!fileUrl) {
    return Response.json(
      { statusText: 'File URL not found in upload' },
      { status: 500, headers: corsHeaders },
    )
  }
  // Note: The download header does not interfere with Maplibre rendering of this route
  const downloadFilename = extension === 'geojson' ? `${baseName}.geojson` : undefined
  return proxyS3Url(request, fileUrl, downloadFilename)
}
