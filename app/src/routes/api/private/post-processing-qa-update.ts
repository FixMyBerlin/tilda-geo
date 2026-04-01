import type { QaSystemStatus } from '@prisma/client'
import { createFileRoute } from '@tanstack/react-router'
import { GuardEndpointSchema, guardEndpoint } from '@/server/api/private/guardEndpoint'
import db from '@/server/db.server'
import type { QaDecisionDataStored } from '@/server/qa-configs/schemas/qaDecisionDataSchema'
import {
  qaDecisionDataSchema,
  transformEvaluationWithDecisionData,
} from '@/server/qa-configs/schemas/qaDecisionDataSchema'
import { getQaTableName } from '@/server/qa-configs/utils/getQaTableName'
import { updateProcessingMetaAsync } from '@/server/statistics/analysis/updateProcessingStatus.server'

function calculateSystemStatus(
  relative: number | null,
  config: { goodThreshold: number; needsReviewThreshold: number },
) {
  if (relative === null) {
    return 'NEEDS_REVIEW'
  }

  const normalizedRelative = relative > 0 && relative < 1 ? 1 / relative : relative
  const difference = Math.abs(normalizedRelative - 1.0)

  if (difference <= config.goodThreshold) {
    return 'GOOD'
  } else if (difference <= config.needsReviewThreshold) {
    return 'NEEDS_REVIEW'
  } else {
    return 'PROBLEMATIC'
  }
}

async function getCurrentEvaluation(configId: number, areaId: string) {
  const evaluation = await db.qaEvaluation.findFirst({
    where: { configId, areaId },
    orderBy: { createdAt: 'desc' },
  })

  if (!evaluation) return null
  return transformEvaluationWithDecisionData(evaluation)
}

function shouldCreateNewEvaluation(
  previousEvaluation: { systemStatus: QaSystemStatus; userStatus: string | null } | null,
  newSystemStatus: QaSystemStatus,
) {
  if (!previousEvaluation) return true

  const previousSystemStatus = previousEvaluation.systemStatus
  const hasUserDecision = previousEvaluation.userStatus !== null

  if (!hasUserDecision) {
    return previousSystemStatus !== newSystemStatus
  }

  return shouldResetUserDecision(
    previousSystemStatus,
    newSystemStatus,
    previousEvaluation.userStatus,
  )
}

function shouldResetUserDecision(
  _previousSystemStatus: QaSystemStatus,
  newSystemStatus: QaSystemStatus,
  previousUserStatus: string | null,
) {
  if (!previousUserStatus) return false

  const isNotOkDecision =
    previousUserStatus === 'NOT_OK_DATA_ERROR' || previousUserStatus === 'NOT_OK_PROCESSING_ERROR'

  if (isNotOkDecision) {
    return newSystemStatus === 'GOOD'
  }

  if (previousUserStatus === 'OK_QA_TOOLING_ERROR') {
    return newSystemStatus === 'GOOD'
  }

  return false
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

  // Absolute diff is checked first: if within threshold, effective status is GOOD (%-based status is ignored for update rules)
  const absoluteDifferenceWithinThreshold =
    evaluation.absoluteDifference !== null &&
    Math.abs(evaluation.absoluteDifference) <= evaluation.absoluteDifferenceThreshold
  const effectiveSystemStatus: QaSystemStatus = absoluteDifferenceWithinThreshold
    ? 'GOOD'
    : evaluation.systemStatus

  if (!previousEvaluation) {
    const newEvaluation = await db.qaEvaluation.create({
      data: {
        configId,
        areaId,
        systemStatus: effectiveSystemStatus,
        evaluatorType: 'SYSTEM',
        userStatus: null,
        body: null,
        userId: null,
        decisionData: evaluation.decisionData,
      },
    })

    return transformEvaluationWithDecisionData(newEvaluation)
  }

  const shouldReset = shouldResetUserDecision(
    previousEvaluation.systemStatus,
    effectiveSystemStatus,
    previousEvaluation.userStatus,
  )
  if (shouldReset) {
    const newEvaluation = await db.qaEvaluation.create({
      data: {
        configId,
        areaId,
        systemStatus: effectiveSystemStatus,
        evaluatorType: 'SYSTEM',
        userStatus: null,
        body: null,
        userId: null,
        decisionData: evaluation.decisionData,
      },
    })

    return transformEvaluationWithDecisionData(newEvaluation)
  }

  // Check if effective system status changed (previous vs effective new status)
  const systemStatusChanged = previousEvaluation.systemStatus !== effectiveSystemStatus

  const relativeChanged = evaluation.previousRelative !== evaluation.currentRelative

  // Data is considered changed if:
  // 1. Effective system status changed (e.g. GOOD -> NEEDS_REVIEW), OR
  // 2. Relative changed AND absolute difference exceeds threshold (so %-based change matters)
  const dataChanged = systemStatusChanged || (relativeChanged && !absoluteDifferenceWithinThreshold)

  if (!dataChanged) {
    return previousEvaluation
  }

  if (shouldCreateNewEvaluation(previousEvaluation, effectiveSystemStatus)) {
    const newEvaluation = await db.qaEvaluation.create({
      data: {
        configId,
        areaId,
        systemStatus: effectiveSystemStatus,
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
