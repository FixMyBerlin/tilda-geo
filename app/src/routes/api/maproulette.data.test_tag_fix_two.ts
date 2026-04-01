import { Prisma } from '@prisma/client'
import { createFileRoute } from '@tanstack/react-router'
import * as turf from '@turf/turf'
import type { LineString } from 'geojson'
import { z } from 'zod'
import {
  mapillaryUrl,
  osmTypeIdString,
} from '@/components/regionen/pageRegionSlug/SidebarInspector/Tools/osmUrls/osmUrls'
import { pointFromGeometry } from '@/components/regionen/pageRegionSlug/SidebarInspector/Tools/osmUrls/pointFromGeometry'
import { isProd } from '@/components/shared/utils/isEnv'
import { geoDataClient } from '@/server/prisma-client.server'

const idType = z.coerce.bigint().positive()
const MaprouletteSchema = z.object({
  ids: z.union([z.array(idType), idType.transform((x) => [x])]),
})

export const Route = createFileRoute('/api/maproulette/data/test_tag_fix_two')({
  ssr: true,
  server: {
    handlers: {
      GET: async ({ request }) => {
        let parsedParams: z.infer<typeof MaprouletteSchema>
        const searchParams = new URL(request.url).searchParams
        try {
          parsedParams = MaprouletteSchema.parse({
            ids: searchParams.getAll('ids'),
          })
        } catch (e) {
          if (!isProd) throw e
          console.error(e)
          return new Response('Bad Request', { status: 200 })
        }

        try {
          const { ids } = parsedParams

          const nHits = await geoDataClient.$executeRaw`
            SELECT osm_id FROM boundaries WHERE osm_id IN (${Prisma.join(ids)})`
          if (nHits !== ids.length) {
            return new Response(
              "Couldn't find given ids. At least one id is wrong or dupplicated.",
              {
                status: 404,
              },
            )
          }

          type QueryTpye = { type: string; id: string; geometry: LineString }[]
          const sqlWays = await geoDataClient.$queryRaw<QueryTpye>`
            SELECT
              roads.osm_type as type,
              roads.osm_id as id,
              ST_AsGeoJSON(ST_Transform(roads.geom, 4326))::jsonb AS geometry
            FROM public.roads as roads,
              (
                SELECT ST_Union(boundaries.geom) as union_geom
                FROM public.boundaries as boundaries
                WHERE boundaries.osm_id IN (${Prisma.join(ids)})
              ) as subquery
            WHERE
              roads.tags->>'bikelane_left' = 'missing'
              AND roads.tags->>'bikelane_right' = 'missing'
              AND ST_intersects(subquery.union_geom, roads.geom);
          `

          const markdown = ({ id, type, geometry }) => {
            const [lng, lat] = pointFromGeometry(geometry)
            return `
## Kontext

TOOD

## Aufgabe

TODO

## Hilfsmittel

* [Mapillary-Link zu dieser Stelle](${mapillaryUrl(geometry)})
* [TILDA Radverkehr an dieser Stelle](https://tilda-geo.de/regionen/deutschland?map=13/${lat}/${lng})
* [OpenStreetMap](https://www.openstreetmap.org/${osmTypeIdString(type, id)})
`
          }

          const featureCollections = sqlWays.map(({ type, id, geometry }) => {
            const idString = osmTypeIdString(type, id)
            const properties = {
              id: idString,
              task_updated_at: new Date().toISOString(),
              task_markdown: markdown({
                id,
                type,
                geometry,
              }).replaceAll('\n', ' \n'),
            }

            const feature = turf.truncate(turf.feature(geometry, properties), {
              precision: 8,
            })

            const maprouletteCooperativeWork = {
              meta: {
                version: 2,
                type: 1,
              },
              operations: [
                {
                  operationType: 'modifyElement',
                  data: {
                    id: idString,
                    operations: [
                      {
                        operation: 'setTags',
                        data: {
                          'cycleway:both': 'no',
                        },
                      },
                    ],
                  },
                },
              ],
            }

            /**
             * MapRoulette cooperative challenge (Tag Fix) format:
             * https://learn.maproulette.org/en-US/documentation/creating-cooperative-challenges/
             */
            return {
              type: 'FeatureCollection',
              features: [feature],
              cooperativeWork: maprouletteCooperativeWork,
            }
          })

          return Response.json(featureCollections, {
            headers: {
              'Access-Control-Allow-Origin': '*',
            },
          })
        } catch (error) {
          console.error(error)
          return Response.json(
            { error: 'Internal Server Error', info: isProd ? undefined : error },
            { status: 500 },
          )
        }
      },
    },
  },
})
