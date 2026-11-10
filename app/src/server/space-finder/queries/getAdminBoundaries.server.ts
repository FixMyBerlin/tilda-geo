import { z } from 'zod'
import { Prisma } from '@/prisma/generated/client'
import { requireAuth } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { parseRegionGeoJsonBBox } from '@/server/regions/regionGeoJson'
import { authorizeSpaceFinderRegion } from '../authorizeSpaceFinderRegion.server'

export const BoundarySearchInput = z.object({
  regionSlug: z.string(),
  query: z.string().max(100).default(''),
})

const MAX_BOUNDARY_RESULTS = 20

const escapeLikePattern = (value: string) => value.replace(/[\\%_]/g, '\\$&')

export async function getAdminBoundaries(
  data: z.infer<typeof BoundarySearchInput>,
  headers: Headers,
) {
  const session = await requireAuth(headers)
  await authorizeSpaceFinderRegion(session, data.regionSlug)

  const region = await db.region.findFirst({
    where: { slug: data.regionSlug },
    select: { maskOsmRelationIds: true, bbox: true },
  })
  const relationKeys = (region?.maskOsmRelationIds ?? []).map((id) => `relation/${id}`)
  const regionBbox = parseRegionGeoJsonBBox(region?.bbox)

  const regionFilter =
    relationKeys.length > 0
      ? Prisma.sql`AND ST_Intersects(
          b.geom,
          (SELECT ST_Union(geom) FROM public.boundaries WHERE id = ANY(${relationKeys}::text[]))
        )`
      : regionBbox
        ? Prisma.sql`AND ST_Intersects(
            b.geom,
            ST_Transform(
              ST_MakeEnvelope(${regionBbox[0]}, ${regionBbox[1]}, ${regionBbox[2]}, ${regionBbox[3]}, 4326),
              3857
            )
          )`
        : Prisma.empty

  const query = data.query.trim()
  const nameFilter =
    query === ''
      ? Prisma.empty
      : Prisma.sql`AND b.tags->>'name' ILIKE ${`%${escapeLikePattern(query)}%`}`

  const orderBy =
    query === ''
      ? Prisma.sql`ORDER BY (b.tags->>'admin_level')::int, b.tags->>'name'`
      : Prisma.sql`ORDER BY
          CASE
            WHEN lower(b.tags->>'name') = lower(${query}) THEN 0
            WHEN b.tags->>'name' ILIKE ${`${escapeLikePattern(query)}%`} THEN 1
            ELSE 2
          END,
          (b.tags->>'admin_level')::int,
          b.tags->>'name'`

  const rows = await db.$queryRaw<
    { id: string; name: string; name_prefix: string | null; admin_level: string }[]
  >`
    SELECT
      b.id,
      b.tags->>'name' AS name,
      b.tags->>'name_prefix' AS name_prefix,
      b.tags->>'admin_level' AS admin_level
    FROM public.boundaries b
    WHERE (b.tags->>'admin_level')::int IN (8, 9, 10)
      AND b.tags->>'name' IS NOT NULL
      AND b.tags->>'name' <> ''
      ${nameFilter}
      ${regionFilter}
    ${orderBy}
    LIMIT ${MAX_BOUNDARY_RESULTS + 1}
  `
  return {
    boundaries: rows.slice(0, MAX_BOUNDARY_RESULTS),
    hasMore: rows.length > MAX_BOUNDARY_RESULTS,
  }
}
