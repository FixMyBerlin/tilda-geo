import { createFileRoute } from '@tanstack/react-router'
import { guardAdminApi } from '@/server/api/admin/guardAdminApi.server'
import { auditLogListSchema } from '@/server/audit/auditLogFilters.schema'
import { listAuditLog } from '@/server/audit/queries/listAuditLog.server'

export const Route = createFileRoute('/api/admin/audit-log')({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { access, response } = await guardAdminApi(request)
        if (!access) return response

        const parsed = auditLogListSchema.safeParse(
          Object.fromEntries(new URL(request.url).searchParams.entries()),
        )
        if (!parsed.success) {
          return Response.json(
            { message: 'Invalid query', issues: parsed.error.issues },
            { status: 400 },
          )
        }

        const result = await listAuditLog(parsed.data)
        return Response.json(result, { status: 200 })
      },
    },
  },
})
