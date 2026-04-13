import { createFileRoute } from '@tanstack/react-router'
import { GuardEndpointSchema, guardEndpoint } from '@/server/api/private/guardEndpoint'
import { runStatisticsAnalysisTask } from '@/server/api/private/postProcessingHookTasks.server'

export const Route = createFileRoute('/api/private/post-processing-statistics')({
  ssr: true,
  server: {
    handlers: {
      GET: ({ request }) => {
        const { access, response } = guardEndpoint(request, GuardEndpointSchema)
        if (access === false) return response

        runStatisticsAnalysisTask().catch((error) => {
          console.error('Post-processing statistics: Unhandled error in background task', error)
        })

        return Response.json({ message: 'TRIGGERED' }, { status: 200 })
      },
    },
  },
})
