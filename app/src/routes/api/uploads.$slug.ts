import { createFileRoute } from '@tanstack/react-router'
import type { MapDataSourceExternalRenderFormat } from '@/scripts/StaticDatasets/types'
import { handleCsvExport } from '@/server/api/uploads/handleCsvExport'
import { parseSlugAndFormat } from '@/server/api/uploads/parseSlugAndFormat'
import { withPrivateCaching } from '@/server/api/uploads/privateCaching.server'
import { proxyExternalUrl } from '@/server/api/uploads/proxyExternalUrl'
import { proxyS3Url } from '@/server/api/uploads/proxyS3Url.server'
import { staticDatasetUploadFormats } from '@/server/api/uploads/staticDatasetUploadFormats.const'
import { notFoundJson } from '@/server/api/util/apiJsonResponses.server'
import { guardRegionMembershipBySessionOrToken } from '@/server/api/util/authGuards.server'
import { corsHeaders, preflightResponse } from '@/server/api/util/cors'
import db from '@/server/db.server'

// A browser on another origin sends the Bearer token, which makes the request non-simple.
const uploadsPreflightResponse = () =>
  preflightResponse({
    methods: 'GET, HEAD, OPTIONS',
    allowHeaders: 'Authorization, Content-Type, Accept, Accept-Encoding, Range, If-None-Match',
  })

export const Route = createFileRoute('/api/uploads/$slug')({
  ssr: false,
  server: {
    handlers: {
      OPTIONS: uploadsPreflightResponse,
      // TanStack Start answers HEAD with this handler too and drops the body: same access check,
      // CORS and caching headers as GET. The proxies and the CSV export see `request.method` and
      // skip the transfer or conversion of the file for HEAD.
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

        // Access first: a guest must not learn which formats a private file has. Existing private
        // files answer 401 / 403 for every format (a missing slug stays 404).
        if (!upload.public) {
          const authResponse = await guardRegionMembershipBySessionOrToken({
            request,
            regionIds: upload.regions.map((region) => region.id),
            tokenScope: 'uploads',
            responseHeaders: corsHeaders,
          })
          if (authResponse) {
            return authResponse
          }
        }

        const respond = async () => {
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

          if (extension === 'csv') {
            const geojsonUrl = upload.geojsonUrl
            if (!geojsonUrl) {
              return Response.json(
                { statusText: 'GeoJSON URL not available' },
                { status: 500, headers: corsHeaders },
              )
            }
            return handleCsvExport(request, geojsonUrl, baseName)
          }

          if (upload.externalSourceUrl && upload.cacheTtlSeconds) {
            return proxyExternalUrl(
              request,
              upload.externalSourceUrl,
              upload.cacheTtlSeconds,
              extension as MapDataSourceExternalRenderFormat,
              baseName,
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
          return proxyS3Url(request, fileUrl, downloadFilename)
        }

        // Private files depend on who asks (cookie or token): no shared cache, the browser keeps them for one hour.
        // One exit for all answers of the file, so errors (400 format, 500) are private, too.
        const response = await respond()
        return upload.public ? response : withPrivateCaching(response)
      },
    },
  },
})
