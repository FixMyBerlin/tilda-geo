import db, { Prisma } from '@/db'
import { AccessedRegionsSchema } from '@/src/server/users/schema'
import { resolver } from '@blitzjs/rpc'
import { paginate } from 'blitz'

interface GetUsersInput
  extends Pick<Prisma.UserFindManyArgs, 'where' | 'orderBy' | 'skip' | 'take'> {}

export default resolver.pipe(
  resolver.authorize('ADMIN'),
  async ({ where, orderBy = { id: 'asc' }, skip = 0, take = 100 }: GetUsersInput) => {
    const {
      items: users,
      hasMore,
      nextPage,
      count,
    } = await paginate({
      skip,
      take,
      maxTake: 1000, // See `MAX_TAKE` in `app/src/app/admin/memberships/page.tsx`
      count: () => db.user.count({ where }),
      query: (paginateArgs) =>
        db.user.findMany({
          ...paginateArgs,
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
            Membership: { select: { id: true, region: { select: { slug: true } } } },
          },
        }),
    })

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
  },
)
