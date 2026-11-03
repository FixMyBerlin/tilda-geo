import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { authorizeSpaceFinderRegion } from '../authorizeSpaceFinderRegion.server'

export const BoundaryGeomInput = z.object({ regionSlug: z.string(), boundaryId: z.string() })

export async function getBoundaryGeom(data: z.infer<typeof BoundaryGeomInput>, headers: Headers) {
  const session = await requireAuth(headers)
  await authorizeSpaceFinderRegion(session, data.regionSlug)

  const rows = await db.$queryRaw<{ geom: object }[]>`
    SELECT ST_AsGeoJSON(ST_Transform(b.geom, 4326))::json AS geom
    FROM public.boundaries b
    WHERE b.id = ${data.boundaryId}
  `
  const geom = rows[0]?.geom
  if (!geom) throw new Error(`Gebietsgrenze ${data.boundaryId} nicht gefunden`)
  return geom
}
