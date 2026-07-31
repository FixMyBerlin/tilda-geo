import { createFileRoute } from '@tanstack/react-router'
import { convertRegionUploadsToCsv } from '@/server/api/regions/convertRegionUploadsToCsv'
import { notFoundJson } from '@/server/api/util/apiJsonResponses.server'
import { guardRegionMembership } from '@/server/api/util/authGuards.server'
import { corsHeaders } from '@/server/api/util/cors'
import db from '@/server/db.server'

export const Route = createFileRoute('/api/regions/$regionSlug/uploads-csv')({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const { regionSlug } = params
        const baseName = regionSlug

        const region = await db.region.findFirst({
          where: { slug: baseName },
        })

        if (!region) {
          return notFoundJson({ headers: corsHeaders })
        }

        const authResponse = await guardRegionMembership({
          headers: request.headers,
          regionIds: [region.id],
          responseHeaders: corsHeaders,
        })
        if (authResponse) {
          return authResponse
        }

        const uploads = await db.mapDatasetUpload.findMany({
          where: {
            systemLayer: false,
            regions: { some: { slug: baseName } },
          },
          include: {
            regions: { select: { id: true, slug: true } },
            layerConfigs: { orderBy: [{ subId: 'asc' }, { id: 'asc' }] },
          },
        })

        const csvData = await convertRegionUploadsToCsv(uploads, baseName)

        return new Response(csvData, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${baseName}-datasets.csv"`,
          },
        })
      },
    },
  },
})
