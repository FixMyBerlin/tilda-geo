import { styleText } from 'node:util'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { isProd } from '@/components/shared/utils/isEnv'
import type { StaticRegion } from '@/data/regions.const'
import { staticRegion } from '@/data/regions.const'
import { guardEndpoint } from '@/server/api/private/guardEndpoint'
import { warmCache } from '@/server/api/private/warmCache'

const Schema = z.object({
  apiKey: z.string(),
})

async function warmRegions(regions: StaticRegion[]) {
  const greenCheckmark = styleText(['bold', 'green'], ' ✓')
  const whiteCircle = styleText(['bold', 'white'], ' ○')
  for (const region of regions) {
    if (region.cacheWarming !== undefined && region.bbox != null) {
      const { minZoom, maxZoom, tables } = region.cacheWarming
      console.log(whiteCircle, `Warming cache for ${region.slug} (${minZoom}-${maxZoom})`)
      const startTime = Date.now()
      await warmCache(region.bbox, minZoom, maxZoom, tables)
      const secondsElapsed = Math.round((Date.now() - startTime) / 100) / 10
      console.log(greenCheckmark, `Warmed cache for ${region.slug} in ${secondsElapsed} s`)
    }
  }
}

export const Route = createFileRoute('/api/private/warm-cache')({
  ssr: true,
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { access, response } = guardEndpoint(request, Schema)
        if (access === false) return response

        try {
          await warmRegions(staticRegion)
          return Response.json({ message: 'OK' }, { status: 200 })
        } catch (e) {
          console.error(e)
          if (!isProd) throw e
          return Response.json({ message: 'Internal Server Error' }, { status: 500 })
        }
      },
    },
  },
})
