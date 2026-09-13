import type { QaSystemStatus } from '@/prisma/generated/client'
import { qaDecisionDataSchema } from '@/server/qa-configs/schemas/qaDecisionDataSchema'
import {
  calculateSystemStatus,
  checkTrustedEditors,
  getQaUpdateDecision,
  type QaLastEditor,
  type QaUserStatus,
} from './qaEvaluationRules'

export type QaAreaRow = {
  id: string
  relative: number | null
  previous_relative: number | null
  count_reference: number | null
  count_current: number | null
  absoluteDifference: number | null
  // Aggregated from the map table's `last_editors` JSONB column; [] when the cell has no points.
  last_editors: QaLastEditor[]
}

export type QaPreviousEvaluation = {
  systemStatus: QaSystemStatus
  userStatus: QaUserStatus | null
}

export type QaEvaluationConfig = {
  goodThreshold: number
  needsReviewThreshold: number
  absoluteDifferenceThreshold: number
  trustedOsmUsernames: string[]
  referenceFrozenAt: Date
}

function formatFreezeDate(date: Date) {
  return date.toLocaleDateString('de-DE', { timeZone: 'UTC' })
}

// German body text for a TRUSTED_EDITOR_CHANGE row, see docs/QA-Documentation.md.
function buildTrustedEditorChangeBody(input: {
  referenceFrozenAt: Date
  trustedEditors: string[]
  untrustedSpaceCount: number
  absoluteDifferenceThreshold: number
}) {
  let body = `Automatisch als »Gut (Vertrauensliste)« bewertet: Die seit dem ${formatFreezeDate(input.referenceFrozenAt)} geänderten Stellplätze wurden zuletzt von vertrauenswürdigen OSM-Nutzer:innen bearbeitet: ${input.trustedEditors.join(', ')}.`

  if (input.untrustedSpaceCount > 0) {
    body += ` ${input.untrustedSpaceCount} Stellplätze wurden zuletzt von anderen Nutzer:innen bearbeitet (innerhalb der zulässigen Differenz von ${input.absoluteDifferenceThreshold}).`
  }

  return body
}

export function planQaEvaluationCreates(input: {
  configId: number
  config: QaEvaluationConfig
  areas: QaAreaRow[]
  previousByAreaId: Map<string, QaPreviousEvaluation>
}) {
  const { configId, config, areas, previousByAreaId } = input

  return areas.flatMap((area) => {
    const areaId = area.id.toString()
    const previousEvaluation = previousByAreaId.get(areaId) ?? null

    const trustedCheck = checkTrustedEditors({
      lastEditors: area.last_editors,
      trustedOsmUsernames: config.trustedOsmUsernames,
      referenceFrozenAt: config.referenceFrozenAt,
      absoluteDifferenceThreshold: config.absoluteDifferenceThreshold,
    })

    const decision = getQaUpdateDecision({
      previousEvaluation,
      evaluation: {
        systemStatus: calculateSystemStatus(area.relative, config),
        previousRelative: area.previous_relative,
        currentRelative: area.relative,
        absoluteDifference: area.absoluteDifference,
        absoluteDifferenceThreshold: config.absoluteDifferenceThreshold,
        changedByTrustedEditors: trustedCheck.passed,
      },
    })

    const shouldCreate =
      !previousEvaluation || decision.shouldReset || (decision.dataChanged && decision.shouldCreate)
    if (!shouldCreate) return []

    return [
      {
        configId,
        areaId,
        systemStatus: decision.effectiveSystemStatus,
        evaluatorType: 'SYSTEM' as const,
        userStatus: null,
        body:
          decision.effectiveSystemStatus === 'TRUSTED_EDITOR_CHANGE'
            ? buildTrustedEditorChangeBody({
                referenceFrozenAt: config.referenceFrozenAt,
                trustedEditors: trustedCheck.trustedEditors,
                untrustedSpaceCount: trustedCheck.untrustedSpaceCount,
                absoluteDifferenceThreshold: config.absoluteDifferenceThreshold,
              })
            : null,
        userId: null,
        decisionData: qaDecisionDataSchema.parse({
          relative: area.relative,
          currentCount: area.count_current,
          referenceCount: area.count_reference,
          absoluteChange: area.absoluteDifference,
          goodThreshold: config.goodThreshold,
          needsReviewThreshold: config.needsReviewThreshold,
        }),
      },
    ]
  })
}
