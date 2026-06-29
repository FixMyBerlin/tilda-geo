import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import {
  buildExportFilename,
  exportParamsSchema,
  parseExportSearch,
} from '@/server/api/export/exportRequest.server'
import { generateExport } from '@/server/api/export/generateExport.server'
import { createExportFileResponseStream } from '@/server/api/export/streamExportFile.server'
import {
  badRequestJson,
  forbiddenJson,
  internalServerErrorJson,
  notFoundJson,
} from '@/server/api/util/apiJsonResponses.server'
import { resolveRegionAccessStatus } from '@/server/api/util/authGuards.server'
import { corsHeaders } from '@/server/api/util/cors'

const createExportRunId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export const Route = createFileRoute('/api/export/$regionSlug/$tableName')({
  ssr: true,
  params: {
    parse: (rawParams) => exportParamsSchema.parse(rawParams),
  },
  server: {
    handlers: {
      // Synchronous direct download (public API / direct URL use). For large regions
      // the in-app UI uses the async job flow (`/api/export-start`) to avoid timeouts.
      GET: async ({ request, params }) => {
        const exportRunId = createExportRunId()
        const logPrefix = `[EXPORT:${exportRunId}]`
        const requestStartedAt = Date.now()
        const parsedSearch = parseExportSearch(new URL(request.url).searchParams)

        if (!parsedSearch.success) {
          console.error(logPrefix, 'invalid export query params', {
            url: request.url,
            issues: parsedSearch.error.issues,
          })
          return badRequestJson({ headers: corsHeaders, info: z.flattenError(parsedSearch.error) })
        }

        const { regionSlug, tableName } = params
        const { apiKey, format, ...bbox } = parsedSearch.data
        console.info(logPrefix, 'start export', { regionSlug, tableName, format, bbox })

        const status = await resolveRegionAccessStatus({
          headers: request.headers,
          regionSlug,
          apiKey,
        })
        if (status !== 200) {
          console.warn(logPrefix, 'access denied', { status, regionSlug, tableName })
          return status === 404
            ? notFoundJson({ headers: corsHeaders })
            : forbiddenJson({ headers: corsHeaders })
        }

        try {
          const { outputFilePath, outputBytes, mimeType } = await generateExport({
            tableName,
            regionSlug,
            format,
            bbox,
            logPrefix,
          })
          const filename = await buildExportFilename(tableName, format)

          console.info(logPrefix, 'starting response stream', {
            filename,
            mimeType,
            contentLength: outputBytes,
            totalDurationMs: Date.now() - requestStartedAt,
          })

          return new Response(
            createExportFileResponseStream({ outputFilePath, logPrefix, requestStartedAt }),
            {
              headers: {
                ...corsHeaders,
                'Content-Type': mimeType,
                'Content-Length': outputBytes.toString(),
                'Content-Disposition': `attachment; filename="${filename}"`,
              },
            },
          )
        } catch (error) {
          console.error(logPrefix, 'export failed', {
            regionSlug,
            tableName,
            requestUrl: request.url,
            totalDurationMs: Date.now() - requestStartedAt,
            error,
          })
          return internalServerErrorJson({ headers: corsHeaders, cause: error })
        }
      },
    },
  },
})
