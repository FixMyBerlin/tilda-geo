import db from '@/db'
import { checkRegionAuthorization } from '@/src/server/authorization/checkRegionAuthorization'
import { resolver } from '@blitzjs/rpc'
import { Ctx } from 'blitz'
import { z } from 'zod'

const Schema = z.object({
  configId: z.number(),
  regionSlug: z.string(),
})

export default resolver.pipe(
  resolver.zod(Schema),
  async ({ configId, regionSlug }, { session }: Ctx) => {
    // Check authorization for the region
    const authResult = await checkRegionAuthorization(session, regionSlug)
    if (!authResult.isAuthorized) {
      return []
    }

    // Get unique users and their evaluation counts at the database level
    const userCounts = await db.qaEvaluation.groupBy({
      by: ['userId'],
      where: {
        configId,
        evaluatorType: 'USER',
        userId: { not: null },
      },
      _count: {
        id: true,
      },
    })

    const userIds = userCounts.map((uc) => uc.userId!)
    if (userIds.length === 0) {
      return []
    }

    // Fetch user details
    const users = await db.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        osmName: true,
        firstName: true,
        lastName: true,
      },
    })

    // Map users with their counts
    const userCountMap = new Map(userCounts.map((uc) => [uc.userId!, uc._count.id]))

    return users.map((user) => ({
      id: user.id,
      osmName: user.osmName,
      firstName: user.firstName,
      lastName: user.lastName,
      count: userCountMap.get(user.id) || 0,
      currentUser: session?.userId === user.id,
    }))
  },
)
