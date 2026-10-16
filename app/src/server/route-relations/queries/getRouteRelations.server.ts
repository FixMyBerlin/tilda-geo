import { z } from 'zod'
import {
  type RouteRelationType,
  routeRelationTypes,
} from '@/data/processingTypes/routeRelationTypes.const'
import { Prisma } from '@/prisma/generated/client'
import { geoDataClient } from '@/server/prisma-client.server'

const routeTypes = Object.keys(routeRelationTypes) as [RouteRelationType, ...RouteRelationType[]]

export const RouteRelationsSchema = z.object({
  groups: z
    .array(
      z.object({
        route: z.enum(routeTypes),
        // Berlin peaks at 95 bus relations on one way; the cap only guards against abuse.
        relationIds: z.array(z.number().int().positive()).max(2000),
      }),
    )
    .max(routeTypes.length),
})

// `tags` as the `routes` topic writes them.
type RouteRelationRow = { osm_id: bigint; tags: { name?: string; ref?: string } }

/** Name and ref of the route relations a way belongs to, from the `routes` topic tables. */
export async function getRouteRelations({ groups }: z.infer<typeof RouteRelationsSchema>) {
  const results = await Promise.all(
    groups.map(async ({ route, relationIds }) => {
      if (!relationIds.length) return []
      // The table name comes from the fixed `routeRelationTypes` map, not from the request.
      const table = Prisma.raw(`public."${routeRelationTypes[route].table}"`)
      const rows = await geoDataClient.$queryRaw<RouteRelationRow[]>`
        SELECT osm_id, tags
        FROM ${table}
        WHERE osm_type = 'R' AND osm_id IN (${Prisma.join(relationIds.map((id) => BigInt(id)))})
      `
      return rows.map((row) => ({
        route,
        relationId: Number(row.osm_id),
        name: row.tags.name ?? null,
        ref: row.tags.ref ?? null,
      }))
    }),
  )
  return results.flat()
}
