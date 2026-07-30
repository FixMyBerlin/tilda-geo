import { createFileRoute } from '@tanstack/react-router'
import { adminApiErrorResponse } from '@/server/api/admin/adminApiErrors.server'
import { adminApiAuditContext, guardAdminApi } from '@/server/api/admin/guardAdminApi.server'
import { getRegions } from '@/server/regions/queries/getRegions.server'
import { createRegionConfig } from '@/server/regions/regionWriteService.server'

export const Route = createFileRoute('/api/admin/regions')({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { access, response } = await guardAdminApi(request)
        if (!access) return response

        const regions = await getRegions()
        return Response.json(regions, { status: 200 })
      },
      POST: async ({ request }) => {
        const { access, auth, response } = await guardAdminApi(request)
        if (!access) return response

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return Response.json({ message: 'Invalid JSON body' }, { status: 400 })
        }

        try {
          const region = await createRegionConfig(
            body as never,
            adminApiAuditContext(auth, request),
          )
          return Response.json(region, { status: 201 })
        } catch (error) {
          return adminApiErrorResponse(error, { fallbackMessage: 'Create failed' })
        }
      },
    },
  },
})
