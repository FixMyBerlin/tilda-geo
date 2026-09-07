import { z } from 'zod'
import { getAppSession } from '@/server/auth/session.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'

const Schema = z.object({
  regionSlug: z.string(),
  listId: z.number(),
})

/**
 * Entries of a review list as a GeoJSON FeatureCollection for the map + list panel. The list must
 * be linked to the region the user is acting from.
 */
export async function getReviewEntriesForList(input: z.infer<typeof Schema>, headers: Headers) {
  const { regionSlug, listId } = Schema.parse(input)

  const session = await getAppSession(headers)
  const { isAuthorized } = await canAccessMemberModeForRegion(session, regionSlug)
  if (!isAuthorized)
    return { featureCollection: { type: 'FeatureCollection' as const, features: [] } }

  const list = await db.reviewList.findFirst({
    where: { id: listId, regions: { some: { slug: regionSlug } } },
    select: { id: true },
  })
  if (!list) return { featureCollection: { type: 'FeatureCollection' as const, features: [] } }

  const entries = await db.reviewEntry.findMany({
    where: { listId },
    select: {
      id: true,
      geometry: true,
      geometryType: true,
      properties: true,
      status: true,
      source: true,
      importId: true,
      createdBy: { select: { id: true, osmName: true } },
      _count: { select: { comments: true } },
    },
    orderBy: { id: 'asc' },
  })

  const features = entries.map((entry) => ({
    type: 'Feature' as const,
    id: entry.id,
    geometry: entry.geometry,
    properties: {
      id: entry.id,
      status: entry.status,
      source: entry.source,
      importId: entry.importId,
      geometryType: entry.geometryType,
      authorName: entry.createdBy?.osmName ?? null,
      commentCount: entry._count.comments,
      // Display attributes from upload/drawing (kept under a namespace to avoid clobbering ours).
      data: entry.properties ?? {},
    },
  }))

  return { featureCollection: { type: 'FeatureCollection' as const, features } }
}
