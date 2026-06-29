import { createFileRoute } from '@tanstack/react-router'
import { getExportJob } from '@/server/api/export/exportJobs.server'
import { notFoundJson } from '@/server/api/util/apiJsonResponses.server'
import { corsHeaders } from '@/server/api/util/cors'

export const Route = createFileRoute('/api/export-status/$jobId')({
  ssr: true,
  server: {
    handlers: {
      // Polled by the client to drive the progress bar.
      GET: ({ params }) => {
        const job = getExportJob(params.jobId)
        if (!job) {
          return notFoundJson({ headers: corsHeaders, message: 'Export job not found or expired' })
        }
        return Response.json(
          {
            status: job.status,
            percent: job.percent,
            filename: job.filename,
            ...(job.status === 'error' ? { error: job.error } : {}),
          },
          { headers: corsHeaders },
        )
      },
    },
  },
})
