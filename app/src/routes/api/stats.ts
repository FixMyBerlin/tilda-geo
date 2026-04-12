import { createFileRoute } from '@tanstack/react-router'
import { feature, featureCollection } from '@turf/turf'
import { z } from 'zod'
import { isProd } from '@/components/shared/utils/isEnv'
import { geoDataClient } from '@/server/prisma-client.server'
import { hasAggregatedLengthsTable } from '@/server/statistics/queries/guardAggregatedLengths.server'

const position = z.tuple([z.number(), z.number()])
const linearRing = z.array(position)
const polygon = z.array(linearRing)
const geometryMultiPolygon = z.object({
  type: z.literal('MultiPolygon'),
  coordinates: z.array(polygon),
})
const geometryPolygon = z.object({
  type: z.literal('Polygon'),
  coordinates: polygon,
})
const DbStatSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.enum(['4', '6']),
  road_length: z.record(z.string(), z.number()),
  bikelane_length: z.record(z.string(), z.number()).nullable(),
  geometry: geometryMultiPolygon.or(geometryPolygon),
})
const DbStatsSchema = z.array(DbStatSchema)

export const Route = createFileRoute('/api/stats')({
  ssr: true,
  server: {
    handlers: {
      GET: async () => {
        const tableExists = await hasAggregatedLengthsTable()
        if (!tableExists) {
          return Response.json(featureCollection([]))
        }

        try {
          const raw = await geoDataClient.$queryRaw`
            SELECT
              id,
              name,
              level,
              road_length,
              bikelane_length,
              ST_AsGeoJSON(
                ST_SimplifyPreserveTopology(
                  ST_Transform(geom, 4326),
                  1
                ),
                6
              )::jsonb AS geometry
            FROM public.aggregated_lengths;`

          const parsed = DbStatsSchema.parse(raw)

          const features = parsed.map(({ geometry, ...properties }) => {
            return feature(geometry, properties, { id: properties.id })
          })

          return Response.json(featureCollection(features))
        } catch (error) {
          console.error(error)
          return Response.json(
            {
              error: 'Internal Server Error',
              info: isProd ? undefined : error,
            },
            { status: 500 },
          )
        }
      },
    },
  },
})
