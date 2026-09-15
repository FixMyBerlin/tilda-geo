import type { QaSystemStatus } from '@/prisma/generated/client'

const qaResettableUserStatuses = [
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

function shouldResetUserDecision(
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

function shouldCreateNewEvaluation(
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

function pickEffectiveSystemStatus({
  systemStatus,
  absoluteDifferenceWithinThreshold,
  changedByTrustedEditors,
}: {
  systemStatus: QaSystemStatus
  absoluteDifferenceWithinThreshold: boolean
  changedByTrustedEditors: boolean
}) {
  // 1. A small absolute difference is no change, whatever the percentage says.
  if (absoluteDifferenceWithinThreshold) return 'GOOD'

  // 2. A larger difference is fine when trusted OSM users made the edits.
  if (systemStatus !== 'GOOD' && changedByTrustedEditors) return 'TRUSTED_EDITOR_CHANGE'

  // 3. Otherwise the percent-based status applies.
  return systemStatus
}

export function getEffectiveSystemStatus({
  systemStatus,
  absoluteDifference,
  absoluteDifferenceThreshold,
  changedByTrustedEditors,
}: {
  systemStatus: QaSystemStatus
  absoluteDifference: number | null
  absoluteDifferenceThreshold: number
  // Whether trusted OSM users made the edits since the reference was frozen.
  changedByTrustedEditors: boolean
}) {
  const absoluteDifferenceWithinThreshold =
    absoluteDifference !== null && Math.abs(absoluteDifference) <= absoluteDifferenceThreshold

  return {
    absoluteDifferenceWithinThreshold,
    effectiveSystemStatus: pickEffectiveSystemStatus({
      systemStatus,
      absoluteDifferenceWithinThreshold,
      changedByTrustedEditors,
    }),
  }
}

// One (osmUser, updatedAt) pair aggregated from the last edit(s) touching a voronoi cell's points.
// updatedAt is the OSM object's last-edit time as Unix epoch seconds; always present because
// osm2pgsql runs with --extra-attributes. osmUser is null for an anonymized extract. Produced by
// processing step 9.
export type QaLastEditor = {
  osmUser: string | null
  spaceCount: number
  updatedAt: number
}

// Did trusted OSM users make the edits since the reference baseline was frozen?
// See docs/QA-Documentation.md.
export function checkTrustedEditors({
  lastEditors,
  trustedOsmUsernames,
  referenceFrozenAt,
  absoluteDifferenceThreshold,
}: {
  lastEditors: QaLastEditor[]
  // Lowercase, trimmed OSM display names — normalized at the input schema.
  trustedOsmUsernames: string[]
  // 00:00 UTC of the freeze day; edits from that moment on count.
  referenceFrozenAt: Date
  absoluteDifferenceThreshold: number
}) {
  const trustedUsernames = new Set(trustedOsmUsernames)
  const cutoffMs = referenceFrozenAt.getTime()

  const trustedEditorsFound = new Set<string>()
  let untrustedSpaceCount = 0

  for (const editor of lastEditors) {
    if (editor.updatedAt * 1000 < cutoffMs) {
      // Edited before the reference was frozen — part of the frozen baseline, not a new edit.
      continue
    }

    if (editor.osmUser !== null && trustedUsernames.has(editor.osmUser.toLowerCase())) {
      trustedEditorsFound.add(editor.osmUser)
    } else {
      untrustedSpaceCount += editor.spaceCount
    }
  }

  const passed = trustedEditorsFound.size > 0 && untrustedSpaceCount <= absoluteDifferenceThreshold

  return {
    passed,
    trustedEditors: [...trustedEditorsFound].sort((a, b) => a.localeCompare(b)),
    untrustedSpaceCount,
  }
}

export function getQaUpdateDecision(input: {
  previousEvaluation: { systemStatus: QaSystemStatus; userStatus: QaUserStatus | null } | null
  evaluation: {
    systemStatus: QaSystemStatus
    previousRelative: number | null
    currentRelative: number | null
    absoluteDifference: number | null
    absoluteDifferenceThreshold: number
    changedByTrustedEditors: boolean
  }
}) {
  const { absoluteDifferenceWithinThreshold, effectiveSystemStatus } = getEffectiveSystemStatus({
    systemStatus: input.evaluation.systemStatus,
    absoluteDifference: input.evaluation.absoluteDifference,
    absoluteDifferenceThreshold: input.evaluation.absoluteDifferenceThreshold,
    changedByTrustedEditors: input.evaluation.changedByTrustedEditors,
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
