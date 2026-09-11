import type { QaSystemStatus } from '@/prisma/generated/client'
import { qaDecisionDataSchema } from '@/server/qa-configs/schemas/qaDecisionDataSchema'
import { calculateSystemStatus, getQaUpdateDecision, type QaUserStatus } from './qaEvaluationRules'

export type QaAreaRow = {
  id: string
  relative: number | null
  previous_relative: number | null
  count_reference: number | null
  count_current: number | null
  absoluteDifference: number | null
}

export type QaPreviousEvaluation = {
  systemStatus: QaSystemStatus
  userStatus: QaUserStatus | null
}

export function planQaEvaluationCreates(input: {
  configId: number
  config: {
    goodThreshold: number
    needsReviewThreshold: number
    absoluteDifferenceThreshold: number
  }
  areas: QaAreaRow[]
  previousByAreaId: Map<string, QaPreviousEvaluation>
}) {
  const { configId, config, areas, previousByAreaId } = input

  return areas.flatMap((area) => {
    const areaId = area.id.toString()
    const previousEvaluation = previousByAreaId.get(areaId) ?? null
    const decision = getQaUpdateDecision({
      previousEvaluation,
      evaluation: {
        systemStatus: calculateSystemStatus(area.relative, config),
        previousRelative: area.previous_relative,
        currentRelative: area.relative,
        absoluteDifference: area.absoluteDifference,
        absoluteDifferenceThreshold: config.absoluteDifferenceThreshold,
      },
    })

    const shouldCreate =
      !previousEvaluation || decision.shouldReset || (decision.dataChanged && decision.shouldCreate)
    if (!shouldCreate) return []

    return [
      {
        configId,
        areaId,
        systemStatus: decision.effectiveSystemStatus,
        evaluatorType: 'SYSTEM' as const,
        userStatus: null,
        body: null,
        userId: null,
        decisionData: qaDecisionDataSchema.parse({
          relative: area.relative,
          currentCount: area.count_current,
          referenceCount: area.count_reference,
          absoluteChange: area.absoluteDifference,
          goodThreshold: config.goodThreshold,
          needsReviewThreshold: config.needsReviewThreshold,
        }),
      },
    ]
  })
}
