import { z } from 'zod'
import { getAppSession } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { canAccessQaForRegion } from '@/server/qa-configs/authorization/canAccessQaForRegion.server'

const Schema = z.object({
  configId: z.number(),
  regionSlug: z.string(),
})

export async function getQaUsersForConfig(input: z.infer<typeof Schema>, headers: Headers) {
  const appSession = await getAppSession(headers)

  const { configId, regionSlug } = Schema.parse(input)

  // Check authorization for the region
  const authResult = await canAccessQaForRegion(appSession, regionSlug)
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

  const userIds = userCounts.map((uc) => uc.userId).filter(Boolean)
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
  const userInput = userCounts
    .map((uc) => (uc.userId ? ([uc.userId, uc._count.id] as const) : null))
    .filter(Boolean)
  const userCountMap = new Map(userInput)

  return users.map((user) => {
    return {
      id: user.id,
      osmName: user.osmName,
      firstName: user.firstName,
      lastName: user.lastName,
      count: userCountMap.get(user.id) || 0,
      currentUser: appSession?.userId === user.id,
    }
  })
}
