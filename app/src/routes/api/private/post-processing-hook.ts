import { createFileRoute } from '@tanstack/react-router'
import { isProd } from '@/components/shared/utils/isEnv'
import { GuardEndpointSchema, guardEndpoint } from '@/server/api/private/guardEndpoint'
import { registerSQLFunctions } from '@/server/instrumentation/registerSQLFunctions.server'
import { analysis } from '@/server/statistics/analysis/analysis.server'
import { updateProcessingMetaAsync } from '@/server/statistics/analysis/updateProcessingStatus.server'

async function runStatistics() {
  try {
    await updateProcessingMetaAsync('statistics_started_at')

    await registerSQLFunctions()
    await analysis()

    await updateProcessingMetaAsync('statistics_completed_at')
  } catch (e) {
    console.error('Statistics: Error', e)
    if (!isProd) throw e
  }
}

export const Route = createFileRoute('/api/private/post-processing-hook')({
  ssr: true,
  server: {
    handlers: {
      GET: ({ request }) => {
        const { access, response } = guardEndpoint(request, GuardEndpointSchema)
        if (access === false) return response

        runStatistics().catch((error) => {
          console.error('Statistics: Unhandled error in background task', error)
        })

        return Response.json({ message: 'TRIGGERED' }, { status: 200 })
      },
    },
  },
})
