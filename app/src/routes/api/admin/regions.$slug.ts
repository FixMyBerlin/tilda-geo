import { createFileRoute } from '@tanstack/react-router'
import { adminApiErrorResponse } from '@/server/api/admin/adminApiErrors.server'
import { adminApiAuditContext, guardAdminApi } from '@/server/api/admin/guardAdminApi.server'
import db from '@/server/db.server'
import { regionInclude, regionRowToClient } from '@/server/regions/regionConfigMapper.server'
import { deleteRegionConfig, updateRegionConfig } from '@/server/regions/regionWriteService.server'

export const Route = createFileRoute('/api/admin/regions/$slug')({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { access, response } = await guardAdminApi(request)
        if (!access) return response

        const regionRow = await db.region.findFirst({
          where: { slug: params.slug },
          include: regionInclude,
        })
        if (!regionRow) {
          return Response.json({ message: 'Not found' }, { status: 404 })
        }
        return Response.json(regionRowToClient(regionRow), { status: 200 })
      },
      PUT: async ({ request, params }) => {
        const { access, auth, response } = await guardAdminApi(request)
        if (!access) return response

        let body: unknown
        try {
          body = await request.json()
        } catch {
          return Response.json({ message: 'Invalid JSON body' }, { status: 400 })
        }

        try {
          const region = await updateRegionConfig(
            params.slug,
            body as never,
            adminApiAuditContext(auth, request),
          )
          return Response.json(region, { status: 200 })
        } catch (error) {
          return adminApiErrorResponse(error, { fallbackMessage: 'Update failed' })
        }
      },
      DELETE: async ({ request, params }) => {
        const { access, auth, response } = await guardAdminApi(request)
        if (!access) return response

        // Not a free delete: deleteRegionConfig → assertRegionCanBeDeleted refuses regions that
        // still have memberships, notes, QA configs, or user map-dataset uploads (409). DB FKs on
        // those child tables are Restrict (no Cascade), so a slipped guard still fails at delete.
        try {
          await deleteRegionConfig(params.slug, adminApiAuditContext(auth, request))
          return Response.json({ message: 'Deleted' }, { status: 200 })
        } catch (error) {
          return adminApiErrorResponse(error, {
            fallbackMessage: 'Delete failed',
            conflictOnGuardError: true,
          })
        }
      },
    },
  },
})
