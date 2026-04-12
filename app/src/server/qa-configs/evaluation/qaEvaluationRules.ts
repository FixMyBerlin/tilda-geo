import type { QaSystemStatus } from '@/prisma/generated/client'

export const qaResettableUserStatuses = [
  'NOT_OK_DATA_ERROR',
  'NOT_OK_PROCESSING_ERROR',
  'OK_QA_TOOLING_ERROR',
] as const

export type QaUserStatus = (typeof qaResettableUserStatuses)[number] | string

export function calculateSystemStatus(
  relative: number | null,
  config: { goodThreshold: number; needsReviewThreshold: number },
) {
  if (relative === null) {
    return 'NEEDS_REVIEW' as const
  }

  const normalizedRelative = relative > 0 && relative < 1 ? 1 / relative : relative
  const difference = Math.abs(normalizedRelative - 1.0)

  if (difference <= config.goodThreshold) {
    return 'GOOD' as const
  }
  if (difference <= config.needsReviewThreshold) {
    return 'NEEDS_REVIEW' as const
  }
  return 'PROBLEMATIC' as const
}

export function shouldResetUserDecision(
  newSystemStatus: QaSystemStatus,
  previousUserStatus: QaUserStatus | null,
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

export function shouldCreateNewEvaluation(
  previousEvaluation: { systemStatus: QaSystemStatus; userStatus: QaUserStatus | null } | null,
  newSystemStatus: QaSystemStatus,
) {
  if (!previousEvaluation) return true

  const previousSystemStatus = previousEvaluation.systemStatus
  const hasUserDecision = previousEvaluation.userStatus !== null

  if (!hasUserDecision) {
    return previousSystemStatus !== newSystemStatus
  }

  return shouldResetUserDecision(newSystemStatus, previousEvaluation.userStatus)
}

export function getEffectiveSystemStatus(input: {
  systemStatus: QaSystemStatus
  absoluteDifference: number | null
  absoluteDifferenceThreshold: number
}) {
  const absoluteDifferenceWithinThreshold =
    input.absoluteDifference !== null &&
    Math.abs(input.absoluteDifference) <= input.absoluteDifferenceThreshold

  const effectiveSystemStatus = absoluteDifferenceWithinThreshold ? 'GOOD' : input.systemStatus

  return { absoluteDifferenceWithinThreshold, effectiveSystemStatus }
}

export function getQaUpdateDecision(input: {
  previousEvaluation: { systemStatus: QaSystemStatus; userStatus: QaUserStatus | null } | null
  evaluation: {
    systemStatus: QaSystemStatus
    previousRelative: number | null
    currentRelative: number | null
    absoluteDifference: number | null
    absoluteDifferenceThreshold: number
  }
}) {
  const { absoluteDifferenceWithinThreshold, effectiveSystemStatus } = getEffectiveSystemStatus({
    systemStatus: input.evaluation.systemStatus,
    absoluteDifference: input.evaluation.absoluteDifference,
    absoluteDifferenceThreshold: input.evaluation.absoluteDifferenceThreshold,
  })

  const shouldReset = shouldResetUserDecision(
    effectiveSystemStatus,
    input.previousEvaluation?.userStatus ?? null,
  )
  const systemStatusChanged = input.previousEvaluation?.systemStatus !== effectiveSystemStatus
  const relativeChanged = input.evaluation.previousRelative !== input.evaluation.currentRelative
  const dataChanged = systemStatusChanged || (relativeChanged && !absoluteDifferenceWithinThreshold)
  const shouldCreate =
    shouldReset || shouldCreateNewEvaluation(input.previousEvaluation, effectiveSystemStatus)

  return {
    effectiveSystemStatus,
    absoluteDifferenceWithinThreshold,
    shouldReset,
    systemStatusChanged,
    relativeChanged,
    dataChanged,
    shouldCreate,
  }
}
