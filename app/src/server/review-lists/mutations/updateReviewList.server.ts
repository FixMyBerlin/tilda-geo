import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'

const Schema = z.object({
  regionSlug: z.string(),
  listId: z.number(),
  name: z.string().trim().min(1).optional(),
  /** Full set of region slugs the list should belong to (for sharing across regions). */
  regionSlugs: z.array(z.string()).min(1).optional(),
})

/** Rename a review list and/or set the regions it is shared with. The list must belong to the acting region. */
export async function updateReviewList(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const { regionSlug, listId, name, regionSlugs } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)

  // Sharing the list into other regions requires membership of each target region too — otherwise
  // a member of one region could plant the list into regions they have no access to.
  if (regionSlugs) {
    for (const targetSlug of regionSlugs) {
      if (targetSlug !== regionSlug) await authorizeRegionMemberByRegionSlug(session, targetSlug)
    }
  }

  const list = await db.reviewList.findFirstOrThrow({
    where: { id: listId, regions: { some: { slug: regionSlug } } },
    select: { id: true },
  })

  return db.reviewList.update({
    where: { id: list.id },
    data: {
      updatedById: session.userId,
      ...(name ? { name } : {}),
      // `set` by slug replaces the full region link set; the acting region must remain included.
      ...(regionSlugs
        ? { regions: { set: [...new Set([regionSlug, ...regionSlugs])].map((slug) => ({ slug })) } }
        : {}),
    },
    select: { id: true, name: true },
  })
}
