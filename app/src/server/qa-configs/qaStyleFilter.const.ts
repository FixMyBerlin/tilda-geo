import type { QaListStyleKey } from '@/src/server/qa-configs/listStyleKeys.const'
import type { QaEvaluationStatus, QaSystemStatus } from '@prisma/client'

/**
 * Prisma where fragment for QaEvaluation: filter by list style.
 * - User-status styles: filter by userStatus only.
 * - Pending styles: filter by userStatus null + systemStatus.
 */
export type QaListStyleWhereFragment =
  | { userStatus: QaEvaluationStatus; systemStatus?: undefined }
  | { userStatus: null; systemStatus: QaSystemStatus }

/** Single source of truth: styleKey → DB filter for list query and in-memory matching. */
export const QA_LIST_STYLE_WHERE: Record<QaListStyleKey, QaListStyleWhereFragment> = {
  'user-not-ok-processing': { userStatus: 'NOT_OK_PROCESSING_ERROR' },
  'user-not-ok-osm': { userStatus: 'NOT_OK_DATA_ERROR' },
  'user-ok-construction': { userStatus: 'OK_STRUCTURAL_CHANGE' },
  'user-ok-reference-error': { userStatus: 'OK_REFERENCE_ERROR' },
  'user-ok-qa-tooling-error': { userStatus: 'OK_QA_TOOLING_ERROR' },
  'user-pending-needs-review': { userStatus: null, systemStatus: 'NEEDS_REVIEW' },
  'user-pending-problematic': { userStatus: null, systemStatus: 'PROBLEMATIC' },
} as const

export type QaEvaluationStatusFields = {
  userStatus: QaEvaluationStatus | null
  systemStatus: QaSystemStatus
}

/** Check if an evaluation matches the given list style (uses same criteria as QA_LIST_STYLE_WHERE). */
export function matchesListStyle(
  evaluation: QaEvaluationStatusFields,
  styleKey: QaListStyleKey,
) {
  const filter = QA_LIST_STYLE_WHERE[styleKey]
  if (evaluation.userStatus !== filter.userStatus) return false
  if (filter.systemStatus != null) {
    return evaluation.systemStatus === filter.systemStatus
  }
  return true
}
