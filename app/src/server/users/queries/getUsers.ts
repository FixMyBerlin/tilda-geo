import db, { Prisma } from '@/db'
import { resolver } from '@blitzjs/rpc'

interface GetUsersInput extends Pick<Prisma.UserFindManyArgs, 'where' | 'orderBy'> {}

export default resolver.pipe(
  resolver.authorize('ADMIN'),
  async ({ where, orderBy = { id: 'asc' } }: GetUsersInput) => {
    const users = await db.user.findMany({
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
      },
    })

    return users
  },
)
