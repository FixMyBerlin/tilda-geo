import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { adminApiErrorResponse } from '@/server/api/admin/adminApiErrors.server'
import { guardAdminApi } from '@/server/api/admin/guardAdminApi.server'
import { mapProcessingRunDetail } from '@/server/processing/mapProcessingRunTimings'
import { getProcessingRun } from '@/server/processing/queries/getProcessingRun.server'

const detailQuerySchema = z.object({
  topic: z.string().min(1).optional(),
})

export const Route = createFileRoute('/api/admin/processing/$metaId')({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { access, response } = await guardAdminApi(request)
        if (!access) return response

        const metaId = Number(params.metaId)
        if (!Number.isInteger(metaId) || metaId <= 0) {
          return Response.json({ message: 'Invalid metaId' }, { status: 400 })
        }

        const parsed = detailQuerySchema.safeParse(
          Object.fromEntries(new URL(request.url).searchParams.entries()),
        )
        if (!parsed.success) {
          return Response.json(
            { message: 'Invalid query', issues: parsed.error.issues },
            { status: 400 },
          )
        }

        try {
          const run = await getProcessingRun(metaId)
          return Response.json(mapProcessingRunDetail(run, parsed.data.topic), { status: 200 })
        } catch (error) {
          if (error instanceof Error && /not found|invalid meta data/i.test(error.message)) {
            return Response.json({ message: error.message }, { status: 404 })
          }
          return adminApiErrorResponse(error, { fallbackMessage: 'Failed to load processing run' })
        }
      },
    },
  },
})
