import { Prisma } from '@/prisma/generated/client'
import { geoDataClient } from '@/server/prisma-client.server'

/** Which OSM relation IDs exist in the geo `boundaries` table (mask geometry source). Soft check for admin UI. */
export async function lookupBoundaryOsmIds(osmRelationIds: number[]) {
  const uniqueIds = [...new Set(osmRelationIds)]
  if (uniqueIds.length === 0) {
    return { found: [] as number[], missing: [] as number[] }
  }

  const ids = uniqueIds.map((id) => BigInt(id))
  const rows = await geoDataClient.$queryRaw<Array<{ osm_id: bigint }>>`
    SELECT osm_id
    FROM boundaries
    WHERE osm_id IN (${Prisma.join(ids)})
  `
  const foundSet = new Set(rows.map((row) => Number(row.osm_id)))
  const found = uniqueIds.filter((id) => foundSet.has(id))
  const missing = uniqueIds.filter((id) => !foundSet.has(id))
  return { found, missing }
}
