import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import {
  BoundaryNotFoundError,
  fetchBoundaryGeometry,
} from '@/server/regions/masks/fetchBoundaryGeometry.server'

const idType = z.coerce.bigint().positive()
const BoundarySearchSchema = z.object({
  ids: z.array(idType).min(1),
})

export const Route = createFileRoute('/api/boundary')({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const parsed = BoundarySearchSchema.safeParse({ ids: url.searchParams.getAll('ids') })
        if (!parsed.success) {
          return new Response('Bad Request', { status: 400 })
        }

        const osmRelationIds = parsed.data.ids.map((id) => Number(id))

        let geom
        try {
          geom = await fetchBoundaryGeometry(osmRelationIds)
        } catch (e) {
          if (e instanceof BoundaryNotFoundError) {
            return new Response(e.message, { status: 404 })
          }
          throw e
        }

        return new Response(JSON.stringify(geom), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': 'attachment; filename="boundary.geojson"',
          },
        })
      },
    },
  },
})
