import { createFileRoute } from '@tanstack/react-router'
import { GuardEndpointSchema, guardEndpoint } from '@/server/api/private/guardEndpoint'
import { runPostProcessingHookCombined } from '@/server/api/private/postProcessingHookTasks.server'

export const Route = createFileRoute('/api/private/post-processing-hook')({
  ssr: true,
  server: {
    handlers: {
      GET: ({ request }) => {
        const { access, response } = guardEndpoint(request, GuardEndpointSchema)
        if (access === false) return response

        runPostProcessingHookCombined().catch((error) => {
          console.error('Statistics: Unhandled error in background task', error)
        })

        return Response.json({ message: 'TRIGGERED' }, { status: 200 })
      },
    },
  },
})
