import db from '@/db'
import { resolver } from '@blitzjs/rpc'
import { z } from 'zod'

const Schema = z.object({
  configId: z.number(),
})

export type QaConfigStats = {
  totalAreas: number
  evaluationStats: {
    SYSTEM: {
      GOOD: number
      NEEDS_REVIEW: number
      PROBLEMATIC: number
    }
    USER: {
      OK_STRUCTURAL_CHANGE: number
      OK_REFERENCE_ERROR: number
      NOT_OK_DATA_ERROR: number
      NOT_OK_PROCESSING_ERROR: number
      OK_QA_TOOLING_ERROR: number
    }
  }
}

export default resolver.pipe(
  resolver.zod(Schema),
  resolver.authorize('ADMIN'),
  async ({ configId }) => {
    // Get latest evaluations for each area
    const evaluations = await db.qaEvaluation.findMany({
      where: { configId },
      orderBy: { createdAt: 'desc' },
      distinct: ['areaId'],
      select: {
        evaluatorType: true,
        systemStatus: true,
        userStatus: true,
        areaId: true,
      },
    })

    // Initialize stats structure
    const stats: QaConfigStats = {
      totalAreas: evaluations.length,
      evaluationStats: {
        SYSTEM: {
          GOOD: 0,
          NEEDS_REVIEW: 0,
          PROBLEMATIC: 0,
        },
        USER: {
          OK_STRUCTURAL_CHANGE: 0,
          OK_REFERENCE_ERROR: 0,
          NOT_OK_DATA_ERROR: 0,
          NOT_OK_PROCESSING_ERROR: 0,
          OK_QA_TOOLING_ERROR: 0,
        },
      },
    }

    // Group evaluations by evaluatorType and status
    for (const evaluation of evaluations) {
      switch (evaluation.evaluatorType) {
        case 'SYSTEM': {
          switch (evaluation.systemStatus) {
            case 'GOOD':
              stats.evaluationStats.SYSTEM.GOOD++
              break
            case 'NEEDS_REVIEW':
              stats.evaluationStats.SYSTEM.NEEDS_REVIEW++
              break
            case 'PROBLEMATIC':
              stats.evaluationStats.SYSTEM.PROBLEMATIC++
              break
          }
          break
        }
        case 'USER': {
          if (!evaluation.userStatus) break
          switch (evaluation.userStatus) {
            case 'OK_STRUCTURAL_CHANGE':
              stats.evaluationStats.USER.OK_STRUCTURAL_CHANGE++
              break
            case 'OK_REFERENCE_ERROR':
              stats.evaluationStats.USER.OK_REFERENCE_ERROR++
              break
            case 'NOT_OK_DATA_ERROR':
              stats.evaluationStats.USER.NOT_OK_DATA_ERROR++
              break
            case 'NOT_OK_PROCESSING_ERROR':
              stats.evaluationStats.USER.NOT_OK_PROCESSING_ERROR++
              break
            case 'OK_QA_TOOLING_ERROR':
              stats.evaluationStats.USER.OK_QA_TOOLING_ERROR++
              break
          }
          break
        }
      }
    }

    return stats
  },
)
