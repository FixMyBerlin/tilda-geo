import { styleText } from 'node:util'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { isProd } from '@/components/shared/utils/isEnv'
import { Prisma } from '@/prisma/generated/client'
import { guardEndpoint } from '@/server/api/private/guardEndpoint'
import { warmCache } from '@/server/api/private/warmCache'
import { extendBunRequestIdleTimeout } from '@/server/http/extendBunRequestIdleTimeout.server'
import { getRegions } from '@/server/regions/queries/getRegions.server'

const Schema = z.object({
  apiKey: z.string(),
})

async function warmRegionsFromDb() {
  const regions = await getRegions({
    where: {
      cacheWarming: { not: Prisma.DbNull },
      bbox: { not: Prisma.DbNull },
    },
  })

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
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Full warming can take minutes with zero response bytes until complete.
        // Bun's default ~10s idleTimeout otherwise closes the connection (empty reply).
        extendBunRequestIdleTimeout(request, 0)

        const { access, response } = guardEndpoint(request, Schema)
        if (access === false) return response

        try {
          await warmRegionsFromDb()
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
