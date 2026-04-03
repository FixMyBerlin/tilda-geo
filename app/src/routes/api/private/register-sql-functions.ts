import { createFileRoute } from '@tanstack/react-router'
import { GuardEndpointSchema, guardEndpoint } from '@/server/api/private/guardEndpoint'
import { runRegisterSqlFunctionsTask } from '@/server/api/private/postProcessingHookTasks.server'

export const Route = createFileRoute('/api/private/register-sql-functions')({
  ssr: true,
  server: {
    handlers: {
      GET: ({ request }) => {
        const { access, response } = guardEndpoint(request, GuardEndpointSchema)
        if (access === false) return response

        runRegisterSqlFunctionsTask().catch((error) => {
          console.error('Register SQL functions: Unhandled error in background task', error)
        })

        return Response.json({ message: 'TRIGGERED' }, { status: 200 })
      },
    },
  },
})
