import { createFileRoute } from '@tanstack/react-router'
import { guardAdminApi } from '@/server/api/admin/guardAdminApi.server'
import { mapProcessingRunListItem } from '@/server/processing/mapProcessingRunTimings'
import { listProcessingRuns } from '@/server/processing/queries/listProcessingRuns.server'
import { createOffsetSearchSchema } from '@/shared/pagination/offsetSearchSchema'

const listQuerySchema = createOffsetSearchSchema({ maxTake: 200 })

export const Route = createFileRoute('/api/admin/processing')({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { access, response } = await guardAdminApi(request)
        if (!access) return response

        const parsed = listQuerySchema.safeParse(
          Object.fromEntries(new URL(request.url).searchParams.entries()),
        )
        if (!parsed.success) {
          return Response.json(
            { message: 'Invalid query', issues: parsed.error.issues },
            { status: 400 },
          )
        }

        const result = await listProcessingRuns(parsed.data)
        return Response.json(
          {
            ...result,
            rows: result.rows.map(mapProcessingRunListItem),
          },
          { status: 200 },
        )
      },
    },
  },
})
