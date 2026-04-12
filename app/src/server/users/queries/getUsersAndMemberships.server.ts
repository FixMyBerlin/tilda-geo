import type { Prisma } from '@/prisma/generated/client'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { AccessedRegionsSchema } from '@/server/users/schema'

type GetUsersInput = Pick<Prisma.UserFindManyArgs, 'where' | 'orderBy' | 'skip' | 'take'>

export type UserWithMemberships = Awaited<
  ReturnType<typeof getUsersAndMemberships>
>['users'][number]

export async function getUsersAndMemberships(input: GetUsersInput = {}, headers: Headers) {
  await requireAdmin(headers)
  const { where, orderBy = { id: 'asc' }, skip = 0, take = 100 } = input

  // Simple pagination implementation
  const count = await db.user.count({ where })
  const users = await db.user.findMany({
    skip,
    take: Math.min(take, 1000), // See `MAX_TAKE` in `app/src/app/admin/memberships/page.tsx`
    where,
    orderBy,
    select: {
      id: true,
      osmId: true,
      osmName: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      createdAt: true,
      accessedRegions: true,
      // We cannot pass this part via select in the page component since TS will not be able to infer the types then
      Membership: { select: { id: true, region: { select: { slug: true, status: true } } } },
    },
  })

  const hasMore = skip + users.length < count
  const nextPage = hasMore ? { skip: skip + take, take } : null

  // Parse and validate accessedRegions with zod schema to ensure clean data
  const usersWithValidatedRegions = users.map((user) => ({
    ...user,
    accessedRegions: AccessedRegionsSchema.parse(user.accessedRegions ?? []),
  }))

  return {
    users: usersWithValidatedRegions,
    nextPage,
    hasMore,
    count,
  }
}
