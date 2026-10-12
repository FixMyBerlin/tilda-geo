import type { QaEvaluationStatus, QaSystemStatus } from '@/prisma/generated/client'

export type QaIndicatorThresholdValues = {
  goodThreshold: number
  needsReviewThreshold: number
  absoluteDifferenceThreshold: number
}

// Values arrive from NUMERIC columns (rounded to 4 decimals in SQL); the epsilon keeps
// boundary values like 0.2 on the inclusive side after float conversion.
const EPSILON = 1e-9

/**
 * Status of one indicator in one cell (docs: QA-Documentation.md, "Thresholds and status").
 * `difference` within the absolute threshold always wins (noise floor in dataset units);
 * otherwise the relative `deviation` (0–1) decides.
 */
export function calculateIndicatorStatus(input: {
  deviation: number
  difference: number
  thresholds: QaIndicatorThresholdValues
}) {
  const { deviation, difference, thresholds } = input

  if (difference <= thresholds.absoluteDifferenceThreshold + EPSILON) {
    return 'GOOD' as const satisfies QaSystemStatus
  }
  if (deviation <= thresholds.goodThreshold + EPSILON) {
    return 'GOOD' as const satisfies QaSystemStatus
  }
  if (deviation <= thresholds.needsReviewThreshold + EPSILON) {
    return 'NEEDS_REVIEW' as const satisfies QaSystemStatus
  }
  return 'PROBLEMATIC' as const satisfies QaSystemStatus
}

/** Cleared by the system when the indicator becomes GOOD again. */
const QA_RESETTABLE_USER_STATUSES: readonly QaEvaluationStatus[] = [
  'NOT_OK_DATA_ERROR',
  'NOT_OK_PROCESSING_ERROR',
  'OK_QA_TOOLING_ERROR',
]

const isResettableUserStatus = (status: QaEvaluationStatus) =>
  QA_RESETTABLE_USER_STATUSES.includes(status)

/**
 * Nightly decision for one (cell, indicator), given its latest evaluation row and the
 * freshly computed system status (docs: QA-Documentation.md, "Nightly update rules").
 *
 * - `create`: write a SYSTEM row (first sighting, or system status changed without a user decision)
 * - `reset`: write a SYSTEM row that clears a resettable user decision
 * - `none`: write nothing
 *
 * A resettable decision is only cleared when the indicator *becomes* GOOD, i.e. the status stored
 * on the user row (the system status at decision time) was not GOOD. A reviewer who marks a GOOD
 * indicator as NOT_OK keeps that decision; the system has no signal that it was fixed.
 */
export function getQaUpdateDecision(input: {
  previous: { systemStatus: QaSystemStatus; userStatus: QaEvaluationStatus | null } | null
  systemStatus: QaSystemStatus
}) {
  const { previous, systemStatus } = input

  if (!previous) return 'create' as const

  if (previous.userStatus === null) {
    return previous.systemStatus === systemStatus ? ('none' as const) : ('create' as const)
  }

  if (!isResettableUserStatus(previous.userStatus)) return 'none' as const

  const becameGood = systemStatus === 'GOOD' && previous.systemStatus !== 'GOOD'
  return becameGood ? ('reset' as const) : ('none' as const)
}

/**
 * One (osmUser, updatedAt) pair among the last edits on a cell's features, from processing
 * (`<map>_last_editors`). `amount` is the dataset measure of those features (parking: spaces,
 * bikelanes: meters), `updatedAt` Unix epoch seconds; `osmUser` is null for anonymized extracts.
 */
export type QaLastEditor = {
  osmUser: string | null
  amount: number
  updatedAt: number
}

/**
 * Did trusted OSM users make the edits since the reference was frozen? Edits by others are
 * tolerated up to the indicator's absolute threshold (same unit as `amount`).
 * Docs: QA-Documentation.md, "Trusted OSM editors".
 */
export function checkTrustedEditors({
  lastEditors,
  trustedOsmUsernames,
  referenceFrozenAt,
  absoluteDifferenceThreshold,
}: {
  lastEditors: readonly QaLastEditor[]
  // Lowercase, trimmed OSM display names — normalized at the input schema.
  trustedOsmUsernames: readonly string[]
  // 00:00 UTC of the freeze day; edits from that moment on count.
  referenceFrozenAt: Date
  absoluteDifferenceThreshold: number
}) {
  const trustedUsernames = new Set(trustedOsmUsernames)
  const cutoffMs = referenceFrozenAt.getTime()

  const trustedEditorsFound = new Set<string>()
  let untrustedAmount = 0

  for (const editor of lastEditors) {
    if (editor.updatedAt * 1000 < cutoffMs) {
      // Edited before the reference was frozen — part of the frozen baseline, not a new edit.
      continue
    }

    if (editor.osmUser !== null && trustedUsernames.has(editor.osmUser.toLowerCase())) {
      trustedEditorsFound.add(editor.osmUser)
    } else {
      untrustedAmount += editor.amount
    }
  }

  const passed =
    trustedEditorsFound.size > 0 && untrustedAmount <= absoluteDifferenceThreshold + EPSILON

  return {
    passed,
    trustedEditors: [...trustedEditorsFound].sort((a, b) => a.localeCompare(b)),
    untrustedAmount,
  }
}

/**
 * Trusted editors turn a non-GOOD indicator into TRUSTED_EDITOR_CHANGE ("Gut (Vertrauensliste)").
 * Applied after `calculateIndicatorStatus`, so a difference within the absolute threshold stays
 * GOOD. It is not GOOD itself, so it never resets a human decision (`getQaUpdateDecision`).
 */
export function applyTrustedEditors(systemStatus: QaSystemStatus, trustedEditorsPassed: boolean) {
  if (systemStatus !== 'GOOD' && trustedEditorsPassed) {
    return 'TRUSTED_EDITOR_CHANGE' as const satisfies QaSystemStatus
  }
  return systemStatus
}
