import { createFileRoute } from '@tanstack/react-router'
import { convertRegionUploadsToCsv } from '@/server/api/regions/convertRegionUploadsToCsv'
import { corsHeaders } from '@/server/api/util/cors'
import { getAppSession } from '@/server/auth/session.server'
import db from '@/server/db.server'

export const Route = createFileRoute('/api/regions/$regionSlug/uploads-csv')({
  ssr: true,
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { regionSlug } = params
        const baseName = regionSlug

        const region = await db.region.findFirst({
          where: { slug: baseName },
        })

        if (!region) {
          return Response.json(
            { statusText: 'Not Found', message: 'Region not found' },
            { status: 404, headers: corsHeaders },
          )
        }

        const forbidden = Response.json(
          { statusText: 'Forbidden', message: 'Access denied to this region' },
          { status: 403, headers: corsHeaders },
        )
        const appSession = await getAppSession(request.headers)
        if (!appSession?.userId) {
          return forbidden
        }
        if (appSession.role !== 'ADMIN') {
          const membershipExists = !!(await db.membership.count({
            where: { userId: appSession.userId, regionId: region.id },
          }))
          if (!membershipExists) {
            return forbidden
          }
        }

        const uploads = await db.upload.findMany({
          where: { regions: { some: { slug: baseName } } },
          include: { regions: { select: { id: true, slug: true } } },
        })

        try {
          const csvData = await convertRegionUploadsToCsv(uploads, baseName)

          return new Response(csvData, {
            status: 200,
            headers: {
              ...corsHeaders,
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="${baseName}-datasets.csv"`,
            },
          })
        } catch (error) {
          console.error('Region CSV export error:', error)
          return Response.json(
            { statusText: 'Internal Server Error', message: 'Failed to generate CSV' },
            { status: 500, headers: corsHeaders },
          )
        }
      },
    },
  },
})
