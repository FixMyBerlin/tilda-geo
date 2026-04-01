import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { AccessedRegionsSchema } from '@/server/users/schema'

export async function getUserWithMemberships(input: { userId: string }, headers: Headers) {
  await requireAdmin(headers)
  const { userId } = input

  const user = await db.user.findFirst({
    where: { id: userId },
    select: {
      id: true,
      accessedRegions: true,
      Membership: { select: { id: true, region: { select: { slug: true } } } },
    },
  })

  if (!user) {
    return null
  }

  return {
    ...user,
    accessedRegions: AccessedRegionsSchema.parse(user.accessedRegions ?? []),
  }
}
