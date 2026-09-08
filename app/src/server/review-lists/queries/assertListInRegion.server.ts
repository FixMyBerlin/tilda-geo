import { AuthorizationError } from '@/server/auth/errors'
import db from '@/server/db.server'

/** Throws unless the review list is linked to the region; returns the list id. */
export async function assertListInRegion(listId: number, regionSlug: string) {
  const list = await db.reviewList.findFirst({
    where: { id: listId, regions: { some: { slug: regionSlug } } },
    select: { id: true },
  })
  if (!list) throw new AuthorizationError('Review list does not belong to this region')
  return list.id
}

/** Throws unless the review entry's list is linked to the region; returns the entry id. */
export async function assertEntryInRegion(entryId: number, regionSlug: string) {
  const entry = await db.reviewEntry.findFirst({
    where: { id: entryId, list: { regions: { some: { slug: regionSlug } } } },
    select: { id: true },
  })
  if (!entry) throw new AuthorizationError('Review entry does not belong to this region')
  return entry.id
}
