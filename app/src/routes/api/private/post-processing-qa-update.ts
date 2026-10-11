import { createFileRoute } from '@tanstack/react-router'
import { GuardEndpointSchema, guardEndpoint } from '@/server/api/private/guardEndpoint'
import { runQaUpdate } from '@/server/qa-configs/evaluation/runQaUpdate.server'

export const Route = createFileRoute('/api/private/post-processing-qa-update')({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { access, response } = guardEndpoint(request, GuardEndpointSchema)
        if (access === false) return response

        // `?dryRun=1` answers with the decision counts instead of triggering a background write.
        // Used to calibrate a new indicator's thresholds on staging before production.
        const dryRun = new URL(request.url).searchParams.get('dryRun') === '1'
        if (dryRun) {
          return Response.json(await runQaUpdate(request.headers, { dryRun: true }), {
            status: 200,
          })
        }

        runQaUpdate(request.headers, { dryRun: false }).catch((error) => {
          console.error('QA update: Unhandled error in background task', error)
        })

        return Response.json({ message: 'TRIGGERED' }, { status: 200 })
      },
    },
  },
})
