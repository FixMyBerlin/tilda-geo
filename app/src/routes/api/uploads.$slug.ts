import { createFileRoute } from '@tanstack/react-router'
import type { MapDataSourceExternalRenderFormat } from '@/scripts/StaticDatasets/types'
import { handleCsvExport } from '@/server/api/uploads/handleCsvExport'
import { parseSlugAndFormat } from '@/server/api/uploads/parseSlugAndFormat'
import { proxyExternalUrl } from '@/server/api/uploads/proxyExternalUrl'
import { proxyS3Url } from '@/server/api/uploads/proxyS3Url.server'
import { staticDatasetUploadFormats } from '@/server/api/uploads/staticDatasetUploadFormats.const'
import { notFoundJson } from '@/server/api/util/apiJsonResponses.server'
import {
  guardRegionMembership,
  guardRegionMembershipBearer,
  hasBearerToken,
} from '@/server/api/util/authGuards.server'
import { corsHeaders } from '@/server/api/util/cors'
import db from '@/server/db.server'

// A browser on another origin sends the Bearer token, which makes the request non-simple.
const preflightResponse = () =>
  new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers':
        'Authorization, Content-Type, Accept, Accept-Encoding, Range, If-None-Match',
      'Access-Control-Max-Age': '600',
    },
  })

/**
 * The answer depends on who asks: shared caches must not keep it, and the browser has to ask again
 * each time (If-None-Match gives a cheap 304 once the token is checked).
 */
function withPrivateCaching(response: Response) {
  const headers = new Headers(response.headers)
  headers.set('Cache-Control', 'private, no-cache')
  headers.append('Vary', 'Authorization')
  return new Response(response.body, { status: response.status, headers })
}

export const Route = createFileRoute('/api/uploads/$slug')({
  ssr: false,
  server: {
    handlers: {
      OPTIONS: preflightResponse,
      GET: async ({ request, params }) => {
        const { slug } = params

        const parseResult = parseSlugAndFormat({
          slug,
          allowedFormats: [...staticDatasetUploadFormats],
          fallbackFormat: 'pmtiles',
        })
        if (!parseResult.success) {
          return parseResult.response
        }
        const { baseName, extension, usedFallback } = parseResult.result

        const upload = await db.mapDatasetUpload.findFirst({
          where: { slug: baseName },
          include: { regions: { select: { id: true } } },
        })

        if (upload === null) {
          return notFoundJson({ headers: corsHeaders })
        }

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

        if (!allowedFormats.includes(extension)) {
          const isLegacyPmtilesFallbackWithoutPmtiles =
            usedFallback && extension === 'pmtiles' && !upload.pmtilesUrl
          const formatHints = allowedFormats.map((format) => `/api/uploads/${baseName}.${format}`)

          const message = isLegacyPmtilesFallbackWithoutPmtiles
            ? `Legacy URL fallback uses .pmtiles, but this dataset has no PMTiles file. Use ${formatHints.join(', ')}`
            : `Requested format "${extension}" is not available. Use ${allowedFormats.map((f) => `.${f}`).join(', ')}`

          return Response.json(
            {
              statusText: 'Format not available',
              message,
            },
            { status: 400, headers: corsHeaders },
          )
        }

        let tokenAuthenticated = false
        if (!upload.public) {
          const regionIds = upload.regions.map((region) => region.id)
          // A Bearer token is used on its own (no cookie fallback), so its errors say what is wrong.
          if (hasBearerToken(request)) {
            const authResponse = await guardRegionMembershipBearer({
              request,
              regionIds,
              responseHeaders: corsHeaders,
            })
            if (authResponse) {
              return authResponse
            }
            tokenAuthenticated = true
          } else {
            const authResponse = await guardRegionMembership({
              headers: request.headers,
              regionIds,
              responseHeaders: corsHeaders,
            })
            if (authResponse) {
              return authResponse
            }
          }
        }

        const finish = (response: Response) =>
          tokenAuthenticated ? withPrivateCaching(response) : response

        if (extension === 'csv') {
          const geojsonUrl = upload.geojsonUrl
          if (!geojsonUrl) {
            return Response.json(
              { statusText: 'GeoJSON URL not available' },
              { status: 500, headers: corsHeaders },
            )
          }
          return finish(await handleCsvExport(geojsonUrl, baseName))
        }

        if (upload.externalSourceUrl && upload.cacheTtlSeconds) {
          return finish(
            await proxyExternalUrl(
              request,
              upload.externalSourceUrl,
              upload.cacheTtlSeconds,
              extension as MapDataSourceExternalRenderFormat,
              baseName,
            ),
          )
        }

        const fileUrl = extension === 'pmtiles' ? upload.pmtilesUrl : upload.geojsonUrl
        if (!fileUrl) {
          return Response.json(
            { statusText: 'File URL not found in upload' },
            { status: 500, headers: corsHeaders },
          )
        }
        const downloadFilename = extension === 'geojson' ? `${baseName}.geojson` : undefined
        return finish(await proxyS3Url(request, fileUrl, downloadFilename))
      },
    },
  },
})
