import { z } from 'zod'
import db from '@/server/db.server'

export const MembershipSchema = z.object({
  userId: z.string().nullish(),
  regionSlug: z.string().nullish(),
})

export async function membershipExists(input: z.infer<typeof MembershipSchema>) {
  const { userId, regionSlug } = MembershipSchema.parse(input)
  if (!userId || !regionSlug) return false

  const count = await db.membership.count({
    where: { userId, region: { slug: regionSlug } },
  })
  return Boolean(count)
}
