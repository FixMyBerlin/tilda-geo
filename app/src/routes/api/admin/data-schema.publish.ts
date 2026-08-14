import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { apiJsonMessages } from '@/server/api/util/apiJsonResponses.server'
import { AuthorizationError } from '@/server/auth/errors'
import { requireAdmin } from '@/server/auth/session.server'
import { dataSchemaIdentifierSchema } from '@/server/dataSchema/dataSchemaSpec.schema'
import { publishDataSchemaTableFromEnvironment } from '@/server/dataSchema/publishDataSchemaTable.server'
import { extendBunRequestIdleTimeout } from '@/server/http/extendBunRequestIdleTimeout.server'

const bodySchema = z.object({
  table: dataSchemaIdentifierSchema,
  snapshot: z.boolean().optional(),
})

export const Route = createFileRoute('/api/admin/data-schema/publish')({
  ssr: false,
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          await requireAdmin(request.headers)
          // After auth only — unauthenticated clients must not hold idle connections open.
          extendBunRequestIdleTimeout(request, 0)

          const json = await request.json().catch(() => null)
          const parsed = bodySchema.safeParse(json)
          if (!parsed.success) {
            return Response.json(
              { ok: false, message: 'Invalid body', issues: parsed.error.issues },
              { status: 400 },
            )
          }

          const result = await publishDataSchemaTableFromEnvironment({
            table: parsed.data.table,
            snapshot: parsed.data.snapshot ?? false,
          })
          return Response.json(
            {
              ok: true,
              rowCount: result.rowCount,
              bytes: result.bytes,
              sha256: result.sha256,
              snapshotId: result.snapshotId,
            },
            { status: 200 },
          )
        } catch (error) {
          if (error instanceof AuthorizationError) {
            const status = error.message === apiJsonMessages.notAuthenticated ? 401 : 403
            return Response.json({ ok: false, message: error.message }, { status })
          }
          const message = error instanceof Error ? error.message : String(error)
          return Response.json({ ok: false, message }, { status: 500 })
        }
      },
    },
  },
})
