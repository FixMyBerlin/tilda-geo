import db from '@/db'
import {
  qaDecisionDataSchema,
  QaDecisionDataStored,
  transformEvaluationWithDecisionData,
} from '@/src/server/qa-configs/schemas/qaDecisionDataSchema'
import { getQaTableName } from '@/src/server/qa-configs/utils/getQaTableName'
import { updateProcessingMetaAsync } from '@/src/server/statistics/analysis/updateProcessingStatus'
import { QaSystemStatus } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { guardEnpoint, GuardEnpointSchema } from '../_utils/guardEndpoint'

// Helper function to calculate system status based on relative value and thresholds
function calculateSystemStatus(relative: number | null, config: any): QaSystemStatus {
  if (relative === null) {
    return 'NEEDS_REVIEW' // Handle NULL relative values
  }

  const difference = Math.abs(relative - 1.0)

  if (difference <= config.goodThreshold) {
    return 'GOOD'
  } else if (difference <= config.needsReviewThreshold) {
    return 'NEEDS_REVIEW'
  } else {
    return 'PROBLEMATIC'
  }
}

// Helper function to get current evaluation for an area
async function getCurrentEvaluation(configId: number, areaId: string) {
  const evaluation = await db.qaEvaluation.findFirst({
    where: { configId, areaId },
    orderBy: { createdAt: 'desc' },
  })

  if (!evaluation) return null
  return transformEvaluationWithDecisionData(evaluation)
}

// Helper function to determine if we need to create a new evaluation
function shouldCreateNewEvaluation(
  previousEvaluation: any,
  newSystemStatus: QaSystemStatus,
): boolean {
  if (!previousEvaluation) return true

  const previousSystemStatus = previousEvaluation.systemStatus
  const hasUserDecision = previousEvaluation.userStatus !== null

  // If no user decision, create new evaluation if system status changed
  if (!hasUserDecision) {
    return previousSystemStatus !== newSystemStatus
  }

  // If user decision exists, only create new evaluation if we need to reset it
  return shouldResetUserDecision(
    previousSystemStatus,
    newSystemStatus,
    previousEvaluation.userStatus,
  )
}

// Helper function to determine if user decision should be reset
function shouldResetUserDecision(
  previousSystemStatus: QaSystemStatus,
  newSystemStatus: QaSystemStatus,
  previousUserStatus: string | null,
): boolean {
  if (!previousUserStatus) return false

  // Check if previous user decision was NOT_OK
  const isNotOkDecision =
    previousUserStatus === 'NOT_OK_DATA_ERROR' || previousUserStatus === 'NOT_OK_PROCESSING_ERROR'

  if (isNotOkDecision) {
    // For NOT_OK decisions: Only reset when system becomes GOOD (problem resolved)
    return newSystemStatus === 'GOOD'
  }

  // For OK_QA_TOOLING_ERROR: Reset when system becomes GOOD (QA tooling error resolved)
  if (previousUserStatus === 'OK_QA_TOOLING_ERROR') {
    return newSystemStatus === 'GOOD'
  }

  // For OK decisions (OK_STRUCTURAL_CHANGE, OK_REFERENCE_ERROR): Never reset (user decision is permanent)
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

  // If there's no previous evaluation, always create an initial evaluation
  if (!previousEvaluation) {
    const newEvaluation = await db.qaEvaluation.create({
      data: {
        configId,
        areaId,
        systemStatus: evaluation.systemStatus,
        evaluatorType: 'SYSTEM',
        userStatus: null,
        body: null,
        userId: null,
        decisionData: evaluation.decisionData,
      },
    })

    return transformEvaluationWithDecisionData(newEvaluation)
  }

  // Check if we need to reset a user decision (before checking dataChanged)
  // This ensures NOT_OK decisions get reset to GOOD even when absolute difference is within threshold
  const shouldReset = shouldResetUserDecision(
    previousEvaluation.systemStatus,
    evaluation.systemStatus,
    previousEvaluation.userStatus,
  )
  if (shouldReset) {
    const newEvaluation = await db.qaEvaluation.create({
      data: {
        configId,
        areaId,
        systemStatus: evaluation.systemStatus,
        evaluatorType: 'SYSTEM',
        userStatus: null,
        body: null,
        userId: null,
        decisionData: evaluation.decisionData,
      },
    })

    return transformEvaluationWithDecisionData(newEvaluation)
  }

  // Check if system status changed - if it did, we should update regardless of absolute difference threshold
  const systemStatusChanged = previousEvaluation.systemStatus !== evaluation.systemStatus

  // Check if data changed significantly
  // If absolute difference is <= threshold, it's not considered a change
  // If absoluteDifference is NULL, treat it as a change (needs evaluation)
  const absoluteDifferenceWithinThreshold =
    evaluation.absoluteDifference !== null &&
    Math.abs(evaluation.absoluteDifference) <= evaluation.absoluteDifferenceThreshold

  const relativeChanged = evaluation.previousRelative !== evaluation.currentRelative

  // Data is considered changed if:
  // 1. System status changed (always update when status changes), OR
  // 2. Relative changed AND absolute difference exceeds threshold
  const dataChanged = systemStatusChanged || (relativeChanged && !absoluteDifferenceWithinThreshold)

  if (!dataChanged) {
    // No significant change - no new evaluation needed
    return previousEvaluation
  }

  // Check if we need to create a new evaluation or keep existing
  if (shouldCreateNewEvaluation(previousEvaluation, evaluation.systemStatus)) {
    const newEvaluation = await db.qaEvaluation.create({
      data: {
        configId,
        areaId,
        systemStatus: evaluation.systemStatus,
        evaluatorType: 'SYSTEM',
        // Reset user decision (set to null)
        userStatus: null,
        body: null,
        userId: null,
        // Store decision data snapshot
        decisionData: evaluation.decisionData,
      },
    })

    return transformEvaluationWithDecisionData(newEvaluation)
  } else {
    // No change needed - keep existing evaluation
    return previousEvaluation
  }
}

async function qaUpdate() {
  const startTime = Date.now()
  console.log('QA update: Started processing')

  try {
    // Record start time in database
    await updateProcessingMetaAsync('qa_update_started_at')

    // Get all active QA configs from database
    const qaConfigs = await db.qaConfig.findMany({
      where: { isActive: true },
      include: { region: true },
    })

    let totalEvaluations = 0
    let newEvaluations = 0

    for (const config of qaConfigs) {
      // Get areas from the map table
      const tableName = getQaTableName(config.mapTable)

      // Query the map table to get areas with their relative values and counts
      // Include areas with null relative values (they need review)
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

        // Prepare decision data for storage
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
          evaluation &&
          evaluation.createdAt &&
          new Date(evaluation.createdAt).getTime() > Date.now() - 60000
        ) {
          newEvaluations++
        }
      }
    }

    // Record completion time in database
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
    // Don't record completion on error - it's fine if it stays undefined
    throw error
  }
}

export async function GET(request: NextRequest) {
  const { access, response } = guardEnpoint(request, GuardEnpointSchema)
  if (!access) return response

  // Fire and forget - don't await
  qaUpdate().catch((error) => {
    console.error('QA update: Unhandled error in background task', error)
  })

  return NextResponse.json({ message: 'TRIGGERED' }, { status: 200 })
}
