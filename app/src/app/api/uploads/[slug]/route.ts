import db from '@/db'
import { getBlitzContext } from '@/src/blitz-server'
import { corsHeaders } from '../../_util/cors'
import { proxyS3Url } from './proxyS3Url'

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const { slug } = params

  // Extract file extension and base name
  const lastDotIndex = slug.lastIndexOf('.')
  let baseName: string
  let extension: string

  if (lastDotIndex === -1) {
    // No file extension found - fallback to pmtiles for old URLs
    baseName = slug
    extension = 'pmtiles'
  } else {
    baseName = slug.substring(0, lastDotIndex)
    extension = slug.substring(lastDotIndex + 1).toLowerCase()

    // Validate file extension when provided
    if (!['pmtiles', 'geojson'].includes(extension)) {
      return Response.json(
        { statusText: 'Bad Request', message: 'Unsupported file type. Use .pmtiles or .geojson' },
        { status: 400, headers: corsHeaders },
      )
    }
  }

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
    const session = (await getBlitzContext()).session
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

  // Note: The download header does not interferre with Maplibre rendering of this route
  const downloadFilename = extension === 'geojson' ? `${baseName}.geojson` : undefined
  return proxyS3Url(request, fileUrl, downloadFilename)
}
