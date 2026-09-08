import { z } from 'zod'
import { getAppSession } from '@/server/auth/session.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'

const Schema = z.object({ regionSlug: z.string() })

export type ReviewListForRegion = {
  id: number
  name: string
  entryCount: number
  /** Slugs of all regions this list is linked to. >1 means shared (UI hint). */
  regionSlugs: string[]
}

/** Review lists linked to a region, with entry counts + shared-region info. */
export async function getReviewListsForRegion(input: z.infer<typeof Schema>, headers: Headers) {
  const { regionSlug } = Schema.parse(input)

  const session = await getAppSession(headers)
  const { isAuthorized } = await canAccessMemberModeForRegion(session, regionSlug)
  if (!isAuthorized) return { lists: [] as ReviewListForRegion[] }

  const lists = await db.reviewList.findMany({
    where: { regions: { some: { slug: regionSlug } } },
    select: {
      id: true,
      name: true,
      _count: { select: { entries: true } },
      regions: { select: { slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return {
    lists: lists.map((list): ReviewListForRegion => ({
      id: list.id,
      name: list.name,
      entryCount: list._count.entries,
      regionSlugs: list.regions.map((region) => region.slug),
    })),
  }
}
