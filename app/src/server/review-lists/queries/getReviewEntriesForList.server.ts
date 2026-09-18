import { feature, featureCollection } from '@turf/turf'
import type { Geometry } from 'geojson'
import { z } from 'zod'
import { getAppSession } from '@/server/auth/session.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'
import { formatUserDisplayName } from '@/shared/userDisplayName'
import { reviewEntryGeometrySchema } from '../geojson'

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

  const list = isAuthorized
    ? await db.reviewList.findFirst({
        where: { id: listId, regions: { some: { slug: regionSlug } } },
        select: { id: true },
      })
    : null

  const entries = list
    ? await db.reviewEntry.findMany({
        where: { listId },
        select: {
          id: true,
          geometry: true,
          geometryType: true,
          properties: true,
          status: true,
          source: true,
          importId: true,
          createdBy: { select: { id: true, osmName: true, firstName: true, lastName: true } },
          _count: { select: { comments: true } },
        },
        orderBy: { id: 'asc' },
      })
    : []

  const features = entries.map((entry) =>
    feature(
      reviewEntryGeometrySchema.parse(entry.geometry) as Geometry,
      {
        id: entry.id,
        status: entry.status,
        source: entry.source,
        importId: entry.importId,
        geometryType: entry.geometryType,
        authorName: formatUserDisplayName(entry.createdBy) ?? null,
        authorOsmName: entry.createdBy?.osmName ?? null,
        commentCount: entry._count.comments,
        // Display attributes from upload/drawing (kept under a namespace to avoid clobbering ours).
        // Writes store `normalizeProperties` → Record<string, string>; Prisma types the column as Json.
        data: (entry.properties ?? {}) as Record<string, string>,
      },
      { id: entry.id },
    ),
  )

  return { featureCollection: featureCollection(features) }
}
