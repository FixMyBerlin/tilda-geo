import db from '@/db'
import { AccessedRegionsSchema } from '@/src/server/users/schema'
import { resolver } from '@blitzjs/rpc'

export default resolver.pipe(
  resolver.authorize('ADMIN'),
  async ({ userId }: { userId: number }) => {
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
  },
)
