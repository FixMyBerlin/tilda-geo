import { styleText } from 'node:util'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import type {
  TableId,
  UnionTiles,
} from '@/components/regionen/pageRegionSlug/mapData/mapDataSources/tables.const'
import { isProd } from '@/components/shared/utils/isEnv'
import { GuardEndpointSchema, guardEndpoint } from '@/server/api/private/guardEndpoint'
import { warmCache } from '@/server/api/private/warmCache'
import { extendBunRequestIdleTimeout } from '@/server/http/extendBunRequestIdleTimeout.server'

const Schema = GuardEndpointSchema.extend({
  bbox: z
    .string()
    .transform((value) => value.split(',').map((part) => Number(part.trim())))
    .refine((numbers) => numbers.length === 4 && numbers.every((n) => Number.isFinite(n)), {
      message: 'bbox must be 4 comma separated numbers',
    }),
  minZoom: z.coerce.number().int().min(0).max(24),
  maxZoom: z.coerce.number().int().min(0).max(24),
  tables: z
    .string()
    .transform((value) =>
      value
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0),
    )
    .refine((tables) => tables.length > 0, { message: 'tables must not be empty' }),
})

export const Route = createFileRoute('/api/private/warm-cache-delta')({
  ssr: false,
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Full warming can take minutes with zero response bytes until complete.
        // Bun's default ~10s idleTimeout otherwise closes the connection (empty reply).
        extendBunRequestIdleTimeout(request, 0)

        const { access, response } = guardEndpoint(request, GuardEndpointSchema)
        if (access === false) return response

        try {
          const searchParams = new URL(request.url).searchParams
          const parsed = Schema.parse({
            apiKey: searchParams.get('apiKey'),
            bbox: searchParams.get('bbox'),
            minZoom: searchParams.get('minZoom'),
            maxZoom: searchParams.get('maxZoom'),
            tables: searchParams.get('tables'),
          })
          if (parsed.minZoom > parsed.maxZoom) {
            return Response.json({ message: 'minZoom must be <= maxZoom' }, { status: 400 })
          }

          const bbox = parsed.bbox as [number, number, number, number]
          const whiteCircle = styleText(['bold', 'white'], ' ○')
          console.log(
            whiteCircle,
            `Delta cache warming for bbox ${parsed.bbox.join(',')} (${parsed.minZoom}-${parsed.maxZoom})`,
          )

          await warmCache(
            bbox,
            parsed.minZoom,
            parsed.maxZoom,
            parsed.tables as Array<UnionTiles<TableId>>,
          )

          return Response.json({ message: 'OK' }, { status: 200 })
        } catch (error) {
          console.error(error)
          if (!isProd) throw error
          return Response.json({ message: 'Internal Server Error' }, { status: 500 })
        }
      },
    },
  },
})
