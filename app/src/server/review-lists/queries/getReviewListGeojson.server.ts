import { z } from 'zod'
import { getAppSession } from '@/server/auth/session.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'
import { entriesToFeatureCollection } from '../geojson'
import { assertListInRegion } from './assertListInRegion.server'

const Schema = z.object({
  regionSlug: z.string(),
  listId: z.number(),
})

/** Full review list as a downloadable GeoJSON FeatureCollection. */
export async function getReviewListGeojson(input: z.infer<typeof Schema>, headers: Headers) {
  const { regionSlug, listId } = Schema.parse(input)

  const session = await getAppSession(headers)
  const { isAuthorized } = await canAccessMemberModeForRegion(session, regionSlug)
  if (!isAuthorized) return entriesToFeatureCollection([])
  await assertListInRegion(listId, regionSlug)

  const entries = await db.reviewEntry.findMany({
    where: { listId },
    select: {
      id: true,
      geometry: true,
      properties: true,
      status: true,
      source: true,
      importId: true,
      _count: { select: { comments: true } },
    },
    orderBy: { id: 'asc' },
  })

  return entriesToFeatureCollection(entries)
}
