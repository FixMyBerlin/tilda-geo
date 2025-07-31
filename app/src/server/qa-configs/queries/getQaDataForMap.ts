import db from '@/db'
import {
  QA_SYSTEM_STATUS_COLORS,
  QA_USER_STATUS_COLORS,
} from '@/src/app/regionen/[regionSlug]/_components/SidebarInspector/InspectorQa/qaConfigs'
import { checkRegionAuthorization } from '@/src/server/authorization/checkRegionAuthorization'
import { resolver } from '@blitzjs/rpc'
import { QaEvaluationStatus, QaSystemStatus } from '@prisma/client'
import { Ctx } from 'blitz'
import { z } from 'zod'

const Schema = z.object({
  configId: z.number(),
  regionSlug: z.string(),
})

export type QaMapData = {
  areaId: string
  displayColor: string
}

// Helper function to determine display color based on evaluation status
function getDisplayColor(
  systemStatus: QaSystemStatus,
  userStatus: QaEvaluationStatus | null,
): string {
  // If user has made a decision, use user status color
  if (userStatus) {
    return QA_USER_STATUS_COLORS[userStatus]
  }

  // Otherwise use system status color
  return QA_SYSTEM_STATUS_COLORS[systemStatus]
}

export default resolver.pipe(
  resolver.zod(Schema),
  async ({ configId, regionSlug }, { session }: Ctx) => {
    // Check authorization for the region
    const authResult = await checkRegionAuthorization(session, regionSlug)
    if (!authResult.isAuthorized) {
      return []
    }

    // NOTE: We do not check that the config actually belongs to the authorized region.
    // If someone want to work around this, she can see some color values… nothing too special.

    // Get latest evaluations for each area
    const evaluations = await db.qaEvaluation.findMany({
      where: { configId },
      orderBy: { createdAt: 'desc' },
      distinct: ['areaId'],
    })

    // Return only areaId and display color for map styling
    const qaData: QaMapData[] = evaluations.map((evaluation) => {
      const systemStatus = evaluation.systemStatus
      const userStatus = evaluation.userStatus
      const displayColor = getDisplayColor(systemStatus, userStatus)

      return {
        areaId: evaluation.areaId,
        displayColor,
      }
    })

    console.log(`✅ getQaDataForMap: returning ${qaData.length} map data entries`)
    return qaData
  },
)
