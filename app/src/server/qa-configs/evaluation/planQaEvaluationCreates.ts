import type { QaEvaluationStatus, QaSystemStatus } from '@/prisma/generated/client'
import {
  buildTrustedEditorChangeBody,
  calculateQaIndicatorSystemStatus,
  type QaTrustedEditorsConfig,
} from '@/server/qa-configs/evaluation/calculateQaIndicatorSystemStatus'
import {
  getQaUpdateDecision,
  type QaIndicatorThresholdValues,
  type QaLastEditor,
} from '@/server/qa-configs/evaluation/qaEvaluationRules'
import type { QaDecisionData } from '@/server/qa-configs/schemas/qaDecisionDataSchema'
import type { QaIndicator } from '@/server/qa-configs/schemas/qaIndicatorsSchema'

/** One row of `public.<mapTable>_indicators`, numbers already cast to float. */
export type QaIndicatorTableRow = {
  areaId: string
  indicatorKey: string
  reference: number
  current: number
  difference: number
  deviation: number
  breakdown: Record<string, { reference: number; current: number }> | null
}

/** Latest `QaEvaluation` per (config, area, indicator) — `createdAt DESC, id DESC`. */
export type QaLatestEvaluationRow = {
  areaId: string
  indicatorKey: string
  systemStatus: QaSystemStatus
  userStatus: QaEvaluationStatus | null
}

type QaEvaluationCreate = {
  areaId: string
  indicatorKey: string
  systemStatus: QaSystemStatus
  // German explanation on TRUSTED_EDITOR_CHANGE rows, null otherwise.
  body: string | null
  decisionData: QaDecisionData
}

type QaEvaluationPlan = {
  creates: QaEvaluationCreate[]
  /** Distinct areas seen in `<map>_indicators`. */
  areas: number
  /** (area, indicator) pairs judged, i.e. table rows whose key exists in the config. */
  indicators: number
  /** Rows to write because the status changed or the pair was never seen. */
  created: number
  /** Rows to write that clear a resettable user decision (subset of `creates`, counted apart). */
  resets: number
  /** Rows in `creates` with TRUSTED_EDITOR_CHANGE, for the log line. */
  trustedEditorChanges: number
  /** Keys present in `<map>_indicators` but not in `config.indicators` — logged and skipped. */
  unknownIndicatorKeys: string[]
  /** Keys in `config.indicators` with no row at all in `<map>_indicators` — logged and skipped. */
  missingIndicatorKeys: string[]
}

const latestRowKey = (areaId: string, indicatorKey: string) => `${areaId}\u0000${indicatorKey}`

/**
 * The nightly decision for one config, as a pure function.
 *
 * Everything the route does per config besides I/O lives here: match the `<map>_indicators` rows
 * against `config.indicators`, compute each indicator's system status, and ask
 * `getQaUpdateDecision` whether a row has to be written. Unknown/missing indicator keys are
 * reported, never guessed — an indicator without a table row keeps whatever it had.
 *
 * Output order is area order as delivered by the table query, and `config.indicators` order within
 * an area, so a run writes rows in a stable, readable order.
 */
export function planQaEvaluationCreates(input: {
  indicatorRows: QaIndicatorTableRow[]
  latestRows: QaLatestEvaluationRow[]
  indicators: QaIndicator[]
  /** Dataset unit, for the TRUSTED_EDITOR_CHANGE body. */
  unit: string
  /** `<map>_last_editors` per area; a missing area means no edits (empty list). */
  lastEditorsByAreaId: Map<string, QaLastEditor[]>
  trustConfig: QaTrustedEditorsConfig
}) {
  const { indicatorRows, latestRows, indicators, unit, lastEditorsByAreaId, trustConfig } = input

  const indicatorByKey = new Map(indicators.map((indicator) => [indicator.key, indicator]))

  const latestByAreaAndIndicator = new Map(
    latestRows.map((row) => [latestRowKey(row.areaId, row.indicatorKey), row]),
  )

  // Group by area (insertion-ordered) so one pass over the table drives everything below.
  const rowsByArea = new Map<string, Map<string, QaIndicatorTableRow>>()
  const unknownIndicatorKeys = new Set<string>()
  const seenIndicatorKeys = new Set<string>()

  for (const row of indicatorRows) {
    if (!indicatorByKey.has(row.indicatorKey)) {
      unknownIndicatorKeys.add(row.indicatorKey)
      continue
    }
    seenIndicatorKeys.add(row.indicatorKey)
    const areaRows = rowsByArea.get(row.areaId) ?? new Map<string, QaIndicatorTableRow>()
    areaRows.set(row.indicatorKey, row)
    rowsByArea.set(row.areaId, areaRows)
  }

  const creates: QaEvaluationCreate[] = []
  let indicatorCount = 0
  let created = 0
  let resets = 0
  let trustedEditorChanges = 0

  for (const [areaId, areaRows] of rowsByArea) {
    const lastEditors = lastEditorsByAreaId.get(areaId) ?? []
    for (const indicator of indicators) {
      const row = areaRows.get(indicator.key)
      if (!row) continue
      indicatorCount += 1

      const { systemStatus, trustedCheck } = calculateQaIndicatorSystemStatus({
        deviation: row.deviation,
        difference: row.difference,
        indicator,
        lastEditors,
        trustConfig,
      })

      const previous = latestByAreaAndIndicator.get(latestRowKey(areaId, indicator.key)) ?? null
      const decision = getQaUpdateDecision({
        previous: previous
          ? { systemStatus: previous.systemStatus, userStatus: previous.userStatus }
          : null,
        systemStatus,
      })
      if (decision === 'none') continue

      creates.push({
        areaId,
        indicatorKey: indicator.key,
        systemStatus,
        body:
          systemStatus === 'TRUSTED_EDITOR_CHANGE'
            ? buildTrustedEditorChangeBody({
                referenceFrozenAt: trustConfig.referenceFrozenAt,
                trustedEditors: trustedCheck.trustedEditors,
                untrustedAmount: trustedCheck.untrustedAmount,
                absoluteDifferenceThreshold: indicator.absoluteDifferenceThreshold,
                unit,
              })
            : null,
        decisionData: buildQaDecisionData(row, indicator),
      })
      if (systemStatus === 'TRUSTED_EDITOR_CHANGE') trustedEditorChanges += 1
      if (decision === 'reset') {
        resets += 1
      } else {
        created += 1
      }
    }
  }

  return {
    creates,
    areas: rowsByArea.size,
    indicators: indicatorCount,
    created,
    resets,
    trustedEditorChanges,
    unknownIndicatorKeys: [...unknownIndicatorKeys].sort(),
    missingIndicatorKeys: indicators
      .map((indicator) => indicator.key)
      .filter((key) => !seenIndicatorKeys.has(key)),
  } satisfies QaEvaluationPlan
}

/** v2 snapshot of the values and thresholds a decision was taken on. */
export function buildQaDecisionData(
  row: Pick<
    QaIndicatorTableRow,
    'reference' | 'current' | 'difference' | 'deviation' | 'breakdown'
  >,
  indicator: QaIndicatorThresholdValues,
) {
  return {
    reference: row.reference,
    current: row.current,
    difference: row.difference,
    deviation: row.deviation,
    ...(row.breakdown ? { breakdown: row.breakdown } : {}),
    thresholds: {
      goodThreshold: indicator.goodThreshold,
      needsReviewThreshold: indicator.needsReviewThreshold,
      absoluteDifferenceThreshold: indicator.absoluteDifferenceThreshold,
    },
  } satisfies QaDecisionData
}
