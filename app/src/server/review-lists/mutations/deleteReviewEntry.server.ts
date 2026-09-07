import { z } from 'zod'
import { requireAuth } from '@/server/auth/session.server'
import { authorizeRegionMemberByRegionSlug } from '@/server/authorization/authorizeRegionMember.server'
import db from '@/server/db.server'
import { assertEntryInRegion } from '../queries/assertListInRegion.server'

const Schema = z.object({
  regionSlug: z.string(),
  entryId: z.number(),
})

/** Delete a review entry (comments cascade via the schema). */
export async function deleteReviewEntry(input: z.infer<typeof Schema>, headers: Headers) {
  const session = await requireAuth(headers)
  const { regionSlug, entryId } = Schema.parse(input)

  await authorizeRegionMemberByRegionSlug(session, regionSlug)
  await assertEntryInRegion(entryId, regionSlug)

  return db.reviewEntry.delete({ where: { id: entryId } })
}
