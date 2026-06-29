import { createFileRoute } from '@tanstack/react-router'
import { getExportJob, removeExportJob } from '@/server/api/export/exportJobs.server'
import { createExportFileResponseStream } from '@/server/api/export/streamExportFile.server'
import { notFoundJson } from '@/server/api/util/apiJsonResponses.server'
import { corsHeaders } from '@/server/api/util/cors'

export const Route = createFileRoute('/api/export-download/$jobId')({
  ssr: true,
  server: {
    handlers: {
      // Streams the finished file from disk, then deletes the temp file and the job.
      GET: ({ params }) => {
        const job = getExportJob(params.jobId)
        if (!job || job.status !== 'done' || !job.outputFilePath || job.outputBytes == null) {
          return notFoundJson({
            headers: corsHeaders,
            message: 'Export not ready, expired or not found',
          })
        }

        const logPrefix = `[EXPORT-JOB:${job.id}]`

        return new Response(
          createExportFileResponseStream({
            outputFilePath: job.outputFilePath,
            logPrefix,
            requestStartedAt: Date.now(),
            onFinalized: () => removeExportJob(job.id),
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': job.mimeType ?? 'application/octet-stream',
              'Content-Length': job.outputBytes.toString(),
              'Content-Disposition': `attachment; filename="${job.filename}"`,
            },
          },
        )
      },
    },
  },
})
