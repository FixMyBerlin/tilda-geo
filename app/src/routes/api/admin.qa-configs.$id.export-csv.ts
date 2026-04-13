import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { internalServerErrorJson, notFoundJson } from '@/server/api/util/apiJsonResponses.server'
import { guardAdmin } from '@/server/api/util/authGuards.server'
import { corsHeaders } from '@/server/api/util/cors'
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

        const authResponse = await guardAdmin(request.headers, corsHeaders)
        if (authResponse) {
          return authResponse
        }

        const data = await getQaConfigExportRows({ configId: id })
        if (data === null) {
          return notFoundJson({ headers: corsHeaders })
        }

        try {
          const csv = buildQaConfigExportCsv(data.rows)
          const filename = getQaConfigExportFilename(data.config.slug)
          return new Response(`\uFEFF${csv}`, {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="${filename}"`,
            },
          })
        } catch (error) {
          console.error('QA config CSV export error:', error)
          return internalServerErrorJson({ headers: corsHeaders, message: 'Export failed' })
        }
      },
    },
  },
})
