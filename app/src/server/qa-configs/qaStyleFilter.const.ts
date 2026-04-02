import type { QaEvaluationStatus, QaSystemStatus } from '@prisma/client'
import type { QaListStyleKey } from '@/server/qa-configs/listStyleKeys.const'

/**
 * Filter shape for a list style (used by matchesListStyle only).
 * List query loads latest evaluation per areaId first, then applies this — do not use as SQL where
 * without that, or older rows would match while the latest row differs.
 */
export type QaListStyleWhereFragment =
  | { userStatus: QaEvaluationStatus; systemStatus?: undefined }
  | { userStatus: null; systemStatus: QaSystemStatus }

/** Single source of truth: styleKey → filter (matchesListStyle / map filter semantics). */
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

/** Check if an evaluation matches the given list style (must be the latest row for that areaId). */
export function matchesListStyle(evaluation: QaEvaluationStatusFields, styleKey: QaListStyleKey) {
  const filter = QA_LIST_STYLE_WHERE[styleKey]
  if (filter === undefined) return false
  if (evaluation.userStatus !== filter.userStatus) return false
  if (filter.systemStatus != null) {
    return evaluation.systemStatus === filter.systemStatus
  }
  return true
}
