import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { isProd } from '@/components/shared/utils/isEnv'
import { Prisma } from '@/prisma/generated/client'
import { geoDataClient } from '@/server/prisma-client.server'

const idType = z.coerce.bigint().positive()
const BoundarySearchSchema = z.object({
  ids: z.array(idType).min(1),
})

export const Route = createFileRoute('/api/boundary')({
  ssr: true,
  server: {
    handlers: {
      GET: async ({ request }) => {
        let params: z.infer<typeof BoundarySearchSchema>
        try {
          const url = new URL(request.url)
          params = BoundarySearchSchema.parse({ ids: url.searchParams.getAll('ids') })
        } catch (e) {
          if (!isProd) throw e
          console.error(e)
          return new Response('Bad Request', { status: 400 })
        }

        try {
          const { ids } = params

          const nHits = await geoDataClient.$executeRaw`
            SELECT osm_id
            FROM boundaries
            WHERE osm_id IN (${Prisma.join(ids)})
          `
          if (nHits !== ids.length) {
            return new Response(
              "Couldn't find given ids. At least one id is wrong or dupplicated.",
              {
                status: 404,
              },
            )
          }

          const boundary = await geoDataClient.$queryRaw<Array<Record<'geom', unknown>>>`
            SELECT ST_AsGeoJSON(ST_Transform(ST_UNION(geom), 4326))::jsonb AS geom
            FROM boundaries
            WHERE osm_id IN (${Prisma.join(ids)})
          `
          const geom = boundary?.at(0)?.geom
          if (!geom) {
            return new Response('Internal Server Error', { status: 500 })
          }

          return new Response(JSON.stringify(geom), {
            status: 200,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Content-Disposition': 'attachment; filename="boundary.geojson"',
            },
          })
        } catch (e) {
          if (!isProd) throw e
          console.error(e)
          return new Response('Internal Server Error', { status: 500 })
        }
      },
    },
  },
})
