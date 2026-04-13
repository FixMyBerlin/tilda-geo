import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { UserRoleEnum } from '@/prisma/generated/client'
import { getFreshSession } from '@/server/auth/session.server'
import { buildQaConfigExportCsv } from '@/server/qa-configs/export/buildQaConfigExportCsv'
import { getQaConfigExportFilename } from '@/server/qa-configs/export/getQaConfigExportFilename'
import { getQaConfigExportRows } from '@/server/qa-configs/queries/getQaConfigExportRows.server'

const qaConfigExportParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const Route = createFileRoute('/api/admin/qa-configs/$id/export-csv')({
  ssr: true,
  params: {
    parse: (rawParams) => qaConfigExportParamsSchema.parse(rawParams),
  },
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { id } = params

        const session = await getFreshSession(request.headers)
        if (!session) {
          return Response.json(
            { statusText: 'Unauthorized', message: 'Not authenticated' },
            { status: 401 },
          )
        }
        if (session.role !== UserRoleEnum.ADMIN) {
          return Response.json(
            { statusText: 'Forbidden', message: 'Admin access required' },
            { status: 403 },
          )
        }

        const data = await getQaConfigExportRows({ configId: id })
        if (data === null) {
          return Response.json(
            { statusText: 'Not Found', message: 'QA config not found' },
            { status: 404 },
          )
        }

        try {
          const csv = buildQaConfigExportCsv(data.rows)
          const filename = getQaConfigExportFilename(data.config.slug)
          return new Response(`\uFEFF${csv}`, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          })
        } catch (error) {
          console.error('QA config CSV export error:', error)
          return Response.json(
            { statusText: 'Internal Server Error', message: 'Export failed' },
            { status: 500 },
          )
        }
      },
    },
  },
})
