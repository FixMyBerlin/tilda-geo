import db from '@/db'
import {
  SYSTEM_STATUS_TO_LETTER,
  USER_STATUS_TO_LETTER,
} from '@/src/app/regionen/[regionSlug]/_components/SidebarInspector/InspectorQa/qaConfigs'
import { checkRegionAuthorization } from '@/src/server/authorization/checkRegionAuthorization'
import { resolver } from '@blitzjs/rpc'
import { Ctx } from 'blitz'
import { z } from 'zod'

const Schema = z.object({
  configId: z.number(),
  regionSlug: z.string(),
  userIds: z.array(z.number()).optional(),
})

export type QaMapData = {
  areaId: string
  systemStatus: string | null // Letter representing system status (G, N, P)
  userStatus: string | null // Letter representing user status (S, R, D, P, QA)
}

export default resolver.pipe(
  resolver.zod(Schema),
  async ({ configId, regionSlug, userIds }, { session }: Ctx) => {
    // Check authorization for the region
    const authResult = await checkRegionAuthorization(session, regionSlug)
    if (!authResult.isAuthorized) {
      return []
    }

    // NOTE: We do not check that the config actually belongs to the authorized region.
    // If someone want to work around this, she can see some color values… nothing too special.

    // Get latest evaluations for each area
    // If userIds is provided, only include evaluations from those users
    const evaluations = await db.qaEvaluation.findMany({
      where: {
        configId,
        ...(userIds && userIds.length > 0 ? { userId: { in: userIds } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['areaId'],
    })

    // Return areaId and status information for map styling and filtering
    const qaData: QaMapData[] = evaluations.map((evaluation) => {
      const systemStatus = evaluation.systemStatus
      const userStatus = evaluation.userStatus
      const systemStatusLetter = SYSTEM_STATUS_TO_LETTER[systemStatus]
      const userStatusLetter = userStatus ? USER_STATUS_TO_LETTER[userStatus] : null

      return {
        areaId: evaluation.areaId,
        systemStatus: systemStatusLetter,
        userStatus: userStatusLetter,
      }
    })

    return qaData
  },
)
