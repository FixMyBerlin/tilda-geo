import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import {
  createExportJob,
  removeExportJob,
  updateExportJob,
} from '@/server/api/export/exportJobs.server'
import {
  buildExportFilename,
  exportParamsSchema,
  parseExportSearch,
} from '@/server/api/export/exportRequest.server'
import { generateExport } from '@/server/api/export/generateExport.server'
import {
  badRequestJson,
  forbiddenJson,
  notFoundJson,
} from '@/server/api/util/apiJsonResponses.server'
import { resolveRegionAccessStatus } from '@/server/api/util/authGuards.server'
import { corsHeaders } from '@/server/api/util/cors'

export const Route = createFileRoute('/api/export-start/$regionSlug/$tableName')({
  ssr: true,
  params: {
    parse: (rawParams) => exportParamsSchema.parse(rawParams),
  },
  server: {
    handlers: {
      // Starts a background export and returns a job id. The client then polls
      // `/api/export-status/$jobId` and finally downloads `/api/export-download/$jobId`.
      GET: async ({ request, params }) => {
        const rawSearchParams = new URL(request.url).searchParams
        const parsedSearch = parseExportSearch(rawSearchParams)
        if (!parsedSearch.success) {
          return badRequestJson({ headers: corsHeaders, info: z.flattenError(parsedSearch.error) })
        }

        const { regionSlug, tableName } = params
        const { apiKey, format, ...bbox } = parsedSearch.data

        const status = await resolveRegionAccessStatus({
          headers: request.headers,
          regionSlug,
          apiKey,
        })
        if (status !== 200) {
          return status === 404
            ? notFoundJson({ headers: corsHeaders })
            : forbiddenJson({ headers: corsHeaders })
        }

        const filename = await buildExportFilename(tableName, format)
        const job = createExportJob(filename)
        const logPrefix = `[EXPORT-JOB:${job.id}]`
        console.info(logPrefix, 'start export', { regionSlug, tableName, format, bbox })

        // Fire-and-forget: generation runs in the background, progress is pushed into the job.
        void generateExport({
          tableName,
          regionSlug,
          format,
          bbox,
          logPrefix,
          onProgress: (percent) => updateExportJob(job.id, { percent }),
        })
          .then(({ outputFilePath, outputBytes, mimeType }) => {
            updateExportJob(job.id, {
              status: 'done',
              percent: 100,
              outputFilePath,
              outputBytes,
              mimeType,
            })
          })
          .catch((error) => {
            console.error(logPrefix, 'export generation failed', { error })
            updateExportJob(job.id, {
              status: 'error',
              error: error instanceof Error ? error.message : 'Export failed',
            })
            // Drop the failed job after a short grace period so the client can read the error.
            setTimeout(() => removeExportJob(job.id), 60_000).unref?.()
          })

        return Response.json({ jobId: job.id, filename }, { headers: corsHeaders })
      },
    },
  },
})
