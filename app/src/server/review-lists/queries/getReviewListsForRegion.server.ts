import { z } from 'zod'
import { getAppSession } from '@/server/auth/session.server'
import { canAccessMemberModeForRegion } from '@/server/authorization/canAccessMemberModeForRegion.server'
import db from '@/server/db.server'

const Schema = z.object({ regionSlug: z.string() })

type ReviewListRegion = {
  slug: string
  name: string
}

export type ReviewListForRegion = {
  id: number
  name: string
  entryCount: number
  /** All regions this list is linked to. >1 means shared (UI hint). */
  regions: ReviewListRegion[]
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
      regions: { select: { slug: true, name: true }, orderBy: { name: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return {
    lists: lists.map((list): ReviewListForRegion => {
      const regions = list.regions.map((region) => ({
        slug: region.slug,
        name: region.name.trim() || region.slug,
      }))
      return {
        id: list.id,
        name: list.name,
        entryCount: list._count.entries,
        regions,
      }
    }),
  }
}
