import type { QaSystemStatus } from '@prisma/client'
import { createFileRoute } from '@tanstack/react-router'
import { GuardEndpointSchema, guardEndpoint } from '@/server/api/private/guardEndpoint'
import db from '@/server/db.server'
import type { QaDecisionDataStored } from '@/server/qa-configs/schemas/qaDecisionDataSchema'
import {
  qaDecisionDataSchema,
  transformEvaluationWithDecisionData,
} from '@/server/qa-configs/schemas/qaDecisionDataSchema'
import {
  calculateSystemStatus,
  getQaUpdateDecision,
} from '@/server/qa-configs/evaluation/qaEvaluationRules'
import { getQaTableName } from '@/server/qa-configs/utils/getQaTableName'
import { updateProcessingMetaAsync } from '@/server/statistics/analysis/updateProcessingStatus.server'

async function getCurrentEvaluation(configId: number, areaId: string) {
  const evaluation = await db.qaEvaluation.findFirst({
    where: { configId, areaId },
    orderBy: { createdAt: 'desc' },
  })

  if (!evaluation) return null
  return transformEvaluationWithDecisionData(evaluation)
}

async function upsertQaEvaluationWithRules(
  configId: number,
  areaId: string,
  evaluation: {
    systemStatus: QaSystemStatus
    previousRelative: number | null
    currentRelative: number | null
    absoluteDifference: number | null
    absoluteDifferenceThreshold: number
    decisionData: QaDecisionDataStored
  },
) {
  const previousEvaluation = await getCurrentEvaluation(configId, areaId)
  const qaUpdateDecision = getQaUpdateDecision({
    previousEvaluation: previousEvaluation
      ? {
          systemStatus: previousEvaluation.systemStatus,
          userStatus: previousEvaluation.userStatus,
        }
      : null,
    evaluation,
  })

  if (!previousEvaluation) {
    const newEvaluation = await db.qaEvaluation.create({
      data: {
        configId,
        areaId,
        systemStatus: qaUpdateDecision.effectiveSystemStatus,
        evaluatorType: 'SYSTEM',
        userStatus: null,
        body: null,
        userId: null,
        decisionData: evaluation.decisionData,
      },
    })

    return transformEvaluationWithDecisionData(newEvaluation)
  }

  if (qaUpdateDecision.shouldReset) {
    const newEvaluation = await db.qaEvaluation.create({
      data: {
        configId,
        areaId,
        systemStatus: qaUpdateDecision.effectiveSystemStatus,
        evaluatorType: 'SYSTEM',
        userStatus: null,
        body: null,
        userId: null,
        decisionData: evaluation.decisionData,
      },
    })

    return transformEvaluationWithDecisionData(newEvaluation)
  }

  if (!qaUpdateDecision.dataChanged) {
    return previousEvaluation
  }

  if (qaUpdateDecision.shouldCreate) {
    const newEvaluation = await db.qaEvaluation.create({
      data: {
        configId,
        areaId,
        systemStatus: qaUpdateDecision.effectiveSystemStatus,
        evaluatorType: 'SYSTEM',
        userStatus: null,
        body: null,
        userId: null,
        decisionData: evaluation.decisionData,
      },
    })

    return transformEvaluationWithDecisionData(newEvaluation)
  } else {
    return previousEvaluation
  }
}

async function qaUpdate() {
  const startTime = Date.now()
  console.log('QA update: Started processing')

  try {
    await updateProcessingMetaAsync('qa_update_started_at')

    const qaConfigs = await db.qaConfig.findMany({
      where: { isActive: true },
      include: { region: true },
    })

    let totalEvaluations = 0
    let newEvaluations = 0

    for (const config of qaConfigs) {
      const tableName = getQaTableName(config.mapTable)

      type QaAreaRow = {
        id: string
        relative: number | null
        previous_relative: number | null
        count_reference: number | null
        count_current: number | null
        absoluteDifference: number | null
      }
      const areas = await db.$queryRawUnsafe<QaAreaRow[]>(`
        SELECT
          id,
          relative::float,
          previous_relative::float,
          count_reference,
          count_current,
          difference as "absoluteDifference"
        FROM ${tableName}
      `)

      for (const area of areas) {
        const systemStatus = calculateSystemStatus(area.relative, config)

        const decisionData = qaDecisionDataSchema.parse({
          relative: area.relative,
          currentCount: area.count_current,
          referenceCount: area.count_reference,
          absoluteChange: area.absoluteDifference,
          goodThreshold: config.goodThreshold,
          needsReviewThreshold: config.needsReviewThreshold,
        })

        const evaluation = await upsertQaEvaluationWithRules(config.id, area.id.toString(), {
          systemStatus,
          previousRelative: area.previous_relative,
          currentRelative: area.relative,
          absoluteDifference: area.absoluteDifference,
          absoluteDifferenceThreshold: config.absoluteDifferenceThreshold,
          decisionData,
        })

        totalEvaluations++
        if (
          evaluation?.createdAt &&
          new Date(evaluation.createdAt).getTime() > Date.now() - 60000
        ) {
          newEvaluations++
        }
      }
    }

    await updateProcessingMetaAsync('qa_update_completed_at')

    const secondsElapsed = Math.round((Date.now() - startTime) / 100) / 10
    console.log(`QA update: Completed in ${secondsElapsed} s`)

    return {
      success: true,
      totalEvaluations,
      newEvaluations,
      configsProcessed: qaConfigs.length,
    }
  } catch (error) {
    console.error('QA update: Error', error)
    throw error
  }
}

export const Route = createFileRoute('/api/private/post-processing-qa-update')({
  ssr: true,
  server: {
    handlers: {
      GET: ({ request }) => {
        const { access, response } = guardEndpoint(request, GuardEndpointSchema)
        if (access === false) return response

        qaUpdate().catch((error) => {
          console.error('QA update: Unhandled error in background task', error)
        })

        return Response.json({ message: 'TRIGGERED' }, { status: 200 })
      },
    },
  },
})
