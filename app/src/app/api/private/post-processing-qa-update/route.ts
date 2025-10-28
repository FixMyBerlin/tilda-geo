import db from '@/db'
import { getQaTableName } from '@/src/server/qa-configs/utils/getQaTableName'
import { QaSystemStatus } from '@prisma/client'
import { NextRequest } from 'next/server'
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
  return db.qaEvaluation.findFirst({
    where: { configId, areaId },
    orderBy: { createdAt: 'desc' },
  })
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

  // For OK decisions: Never reset (user decision is permanent)
  return false
}

async function upsertQaEvaluationWithRules(
  configId: number,
  areaId: string,
  evaluation: {
    systemStatus: QaSystemStatus
    previousRelative: number | null
    currentRelative: number | null
  },
) {
  const previousEvaluation = await getCurrentEvaluation(configId, areaId)

  // Check if data changed significantly
  const dataChanged = evaluation.previousRelative !== evaluation.currentRelative

  if (!dataChanged) {
    // No significant change - no new evaluation needed
    return previousEvaluation
  }

  // Check if we need to create a new evaluation or keep existing
  if (shouldCreateNewEvaluation(previousEvaluation, evaluation.systemStatus)) {
    return db.qaEvaluation.create({
      data: {
        configId,
        areaId,
        systemStatus: evaluation.systemStatus,
        evaluatorType: 'SYSTEM',
        // Reset user decision (set to null)
        userStatus: null,
        body: null,
        userId: null,
      },
    })
  } else {
    // No change needed - keep existing evaluation
    return previousEvaluation
  }
}

export async function GET(request: NextRequest) {
  const { access, response } = guardEnpoint(request, GuardEnpointSchema)
  if (!access) return response

  try {
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

      // Query the map table to get areas with their relative values
      // Include areas with null relative values (they need review)
      const areas = await db.$queryRawUnsafe(`
        SELECT
          id,
          relative,
          previous_relative
        FROM ${tableName}
      `)

      for (const area of areas as any[]) {
        const systemStatus = calculateSystemStatus(area.relative, config)

        const evaluation = await upsertQaEvaluationWithRules(config.id, area.id.toString(), {
          systemStatus,
          previousRelative: area.previous_relative,
          currentRelative: area.relative,
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

    return Response.json({
      success: true,
      totalEvaluations,
      newEvaluations,
      configsProcessed: qaConfigs.length,
    })
  } catch (error) {
    console.error('QA update error:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
