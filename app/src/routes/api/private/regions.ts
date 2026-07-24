import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { guardEndpoint } from '@/server/api/private/guardEndpoint'
import { getRegions } from '@/server/regions/queries/getRegions.server'

const Schema = z.object({
  apiKey: z.string(),
})

export const Route = createFileRoute('/api/private/regions')({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { access, response } = guardEndpoint(request, Schema)
        if (access === false) return response

        const regions = await getRegions()
        const payload = regions.map((region) => ({
          slug: region.slug,
          name: region.name,
          mask: region.mask,
          bbox: region.bbox,
          cacheWarming: region.cacheWarming,
        }))

        return Response.json(payload, { status: 200 })
      },
    },
  },
})
