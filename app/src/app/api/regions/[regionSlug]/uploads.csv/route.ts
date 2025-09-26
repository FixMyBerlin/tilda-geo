/**
 * API route for region CSV data export
 *
 * ACCESS CONTROL:
 * This route is ONLY accessible to users who have membership in the specified region.
 * It does NOT matter if the region or uploads are public - this route requires region membership.
 * Admins have access to all regions.
 *
 * Endpoints:
 * - GET /api/regions/{regionSlug}/uploads.csv - Returns CSV with all uploads metadata for the region
 */

import db from '@/db'
import { getBlitzContext } from '@/src/blitz-server'
import { corsHeaders } from '../../../_util/cors'
import { convertRegionUploadsToCsv } from './utils/convertRegionUploadsToCsv'

export async function GET(request: Request, { params }: { params: { regionSlug: string } }) {
  const { regionSlug } = params
  const baseName = regionSlug

  // Check if region exists
  const region = await db.region.findFirst({
    where: { slug: baseName },
  })

  if (!region) {
    return Response.json(
      { statusText: 'Not Found', message: 'Region not found' },
      { status: 404, headers: corsHeaders },
    )
  }

  // Security check: ALWAYS require region membership (regardless of public/private status)
  // This route is for region members only - it's not a general public API
  const forbidden = Response.json(
    { statusText: 'Forbidden', message: 'Access denied to this region' },
    { status: 403, headers: corsHeaders },
  )
  const { session } = await getBlitzContext()
  if (!session.userId) {
    return forbidden
  }
  if (session.role !== 'ADMIN') {
    // Check if user has membership in this region
    const membershipExists = !!(await db.membership.count({
      where: { userId: session.userId!, regionId: region.id },
    }))
    if (!membershipExists) {
      return forbidden
    }
  }

  // Get uploads for the region
  // Since we already verified region membership above, we can show ALL uploads for this region
  // No additional filtering needed - if user has region access, they see all region uploads
  const uploads = await db.upload.findMany({
    where: { regions: { some: { slug: baseName } } },
    include: { regions: { select: { id: true, slug: true } } },
  })

  // Generate and return CSV export
  try {
    const csvData = await convertRegionUploadsToCsv(uploads, baseName)

    return new Response(csvData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${baseName}-datasets.csv"`,
      },
    })
  } catch (error) {
    console.error('Region CSV export error:', error)
    return Response.json(
      { statusText: 'Internal Server Error', message: 'Failed to generate CSV' },
      { status: 500, headers: corsHeaders },
    )
  }
}
