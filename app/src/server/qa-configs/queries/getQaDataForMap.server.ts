import { z } from 'zod'
import {
  SYSTEM_STATUS_TO_LETTER,
  USER_STATUS_TO_LETTER,
} from '@/components/regionen/pageRegionSlug/SidebarInspector/InspectorQa/qaConfigs'
import { getAppSession } from '@/server/auth/session.server'
import db from '@/server/db.server'
import { canAccessQaForRegion } from '@/server/qa-configs/authorization/canAccessQaForRegion.server'

const Schema = z.object({
  configId: z.number(),
  regionSlug: z.string(),
  userIds: z.array(z.string()).optional(),
})

export type QaMapData = {
  areaId: string
  systemStatus: string | null // Letter representing system status (G, N, P)
  userStatus: string | null // Letter representing user status (S, R, D, P, QA)
}

export async function getQaDataForMap(input: z.infer<typeof Schema>, headers: Headers) {
  const appSession = await getAppSession(headers)

  const { configId, regionSlug, userIds } = Schema.parse(input)

  // Check authorization for the region
  const authResult = await canAccessQaForRegion(appSession, regionSlug)
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
}
