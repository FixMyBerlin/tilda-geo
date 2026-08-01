import { createFileRoute } from '@tanstack/react-router'
import { adminApiErrorResponse } from '@/server/api/admin/adminApiErrors.server'
import { adminApiAuditContext, guardAdminApi } from '@/server/api/admin/guardAdminApi.server'
import { createRegionUploadFromBytes } from '@/server/regions/uploads/createRegionUploadFromBytes.server'
import { regionUploadFromBytesInputSchema } from '@/server/regions/uploads/regionUploadFromBytes.schema'

export const Route = createFileRoute('/api/admin/region-uploads')({
  ssr: false,
  server: {
    handlers: {
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
          const input = regionUploadFromBytesInputSchema.parse(body)
          const created = await createRegionUploadFromBytes(
            input,
            adminApiAuditContext(auth, request),
          )
          return Response.json(created, { status: 201 })
        } catch (error) {
          return adminApiErrorResponse(error, { fallbackMessage: 'Upload failed' })
        }
      },
    },
  },
})
