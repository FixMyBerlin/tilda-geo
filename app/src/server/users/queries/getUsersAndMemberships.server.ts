import type { Prisma } from '@/prisma/generated/client'
import { requireAdmin } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { AccessedRegionsSchema } from '@/server/users/schema'
import { paginate } from '@/server/utils/paginate.server'

type GetUsersInput = Pick<Prisma.UserFindManyArgs, 'where' | 'orderBy' | 'skip' | 'take'>

const DEFAULT_TAKE = 50
const MAX_TAKE = 200

export type UserWithMemberships = Awaited<ReturnType<typeof getUsersAndMemberships>>['rows'][number]

export async function getUsersAndMemberships(input: GetUsersInput = {}, headers: Headers) {
  await requireAdmin(headers)
  const { where, orderBy = { id: 'asc' } } = input

  const result = await paginate({
    skip: input.skip,
    take: input.take,
    defaultTake: DEFAULT_TAKE,
    maxTake: MAX_TAKE,
    count: () => db.user.count({ where }),
    query: ({ skip, take }) =>
      db.user.findMany({
        skip,
        take,
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
          memberships: { select: { id: true, region: { select: { slug: true, status: true } } } },
        },
      }),
  })

  return {
    ...result,
    rows: result.rows.map((user) => ({
      ...user,
      accessedRegions: AccessedRegionsSchema.parse(user.accessedRegions ?? []),
    })),
  }
}
