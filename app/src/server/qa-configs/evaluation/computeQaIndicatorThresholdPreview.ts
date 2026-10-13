import type { QaSystemStatus } from '@/prisma/generated/client'
import {
  calculateQaIndicatorSystemStatus,
  type QaTrustedEditorsConfig,
} from './calculateQaIndicatorSystemStatus'
import type { QaIndicatorThresholdValues, QaLastEditor } from './qaEvaluationRules'

export type QaIndicatorPreviewRow = {
  areaId: string
  reference: number
  current: number
  difference: number
  deviation: number
}

const TOP_DIFFERENCES_LIMIT = 10

/**
 * Admin "Mit aktuellen Daten prüfen": status counts and the largest differences for one
 * indicator's `<map>_indicators` rows under the thresholds typed into the form (not necessarily
 * saved). Uses the nightly's status function, trusted editors included. Pure, so it is
 * unit-testable; previewQaIndicatorThresholds.server.ts loads the rows.
 */
export function computeQaIndicatorThresholdPreview(input: {
  rows: readonly QaIndicatorPreviewRow[]
  thresholds: QaIndicatorThresholdValues
  lastEditorsByAreaId: Map<string, QaLastEditor[]>
  trustConfig: QaTrustedEditorsConfig
}) {
  const counts: Record<QaSystemStatus, number> = {
    GOOD: 0,
    NEEDS_REVIEW: 0,
    PROBLEMATIC: 0,
    TRUSTED_EDITOR_CHANGE: 0,
  }
  for (const row of input.rows) {
    const { systemStatus } = calculateQaIndicatorSystemStatus({
      deviation: row.deviation,
      difference: row.difference,
      indicator: input.thresholds,
      lastEditors: input.lastEditorsByAreaId.get(row.areaId) ?? [],
      trustConfig: input.trustConfig,
    })
    counts[systemStatus] += 1
  }

  return {
    good: counts.GOOD,
    needsReview: counts.NEEDS_REVIEW,
    problematic: counts.PROBLEMATIC,
    trustedEditorChange: counts.TRUSTED_EDITOR_CHANGE,
    topDifferences: [...input.rows]
      .sort((a, b) => b.difference - a.difference)
      .slice(0, TOP_DIFFERENCES_LIMIT),
  }
}
