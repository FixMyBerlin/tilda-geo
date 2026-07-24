import { createFileRoute } from '@tanstack/react-router'
import { feature, featureCollection } from '@turf/turf'
import { z } from 'zod'
import { geoDataClient } from '@/server/prisma-client.server'

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
const dbStatGeometrySchema = z.discriminatedUnion('type', [geometryMultiPolygon, geometryPolygon])
const DbStatSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.enum(['4', '6']),
  regionalschluessel: z.string().nullable(),
  road_length: z.record(z.string(), z.number()),
  bikelane_length: z.record(z.string(), z.number()).nullable(),
  geometry: dbStatGeometrySchema,
})
const DbStatsSchema = z.array(DbStatSchema)

export const Route = createFileRoute('/api/stats')({
  ssr: false,
  server: {
    handlers: {
      GET: async () => {
        const raw = await geoDataClient.$queryRaw`
            SELECT
              id,
              name,
              level,
              regionalschluessel,
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

        const parsed = DbStatsSchema.safeParse(raw)
        if (!parsed.success) {
          return new Response('Bad Request', { status: 400 })
        }

        const features = parsed.data.map(({ geometry, ...properties }) => {
          return feature(geometry, properties, { id: properties.id })
        })

        return Response.json(featureCollection(features))
      },
    },
  },
})
