import {
  applyTrustedEditors,
  calculateIndicatorStatus,
  checkTrustedEditors,
  type QaIndicatorThresholdValues,
  type QaLastEditor,
} from './qaEvaluationRules'

/** The config fields the trusted-editor check needs (`QaConfig.trustedOsmUsernames` etc.). */
export type QaTrustedEditorsConfig = {
  trustedOsmUsernames: string[]
  referenceFrozenAt: Date
}

/**
 * System status of one indicator in one cell, trusted editors applied (docs: QA-Documentation.md,
 * "Trusted OSM editors"). The editor list belongs to the cell and is shared by all its indicators;
 * the tolerance for untrusted edits is the indicator's own `absoluteDifferenceThreshold`.
 * Every path that computes a live status (nightly, detail panel, user decision, threshold preview)
 * goes through here so they cannot disagree.
 */
export function calculateQaIndicatorSystemStatus(input: {
  deviation: number
  difference: number
  indicator: QaIndicatorThresholdValues
  lastEditors: readonly QaLastEditor[]
  trustConfig: QaTrustedEditorsConfig
}) {
  const { deviation, difference, indicator, lastEditors, trustConfig } = input

  const thresholdStatus = calculateIndicatorStatus({ deviation, difference, thresholds: indicator })
  const trustedCheck = checkTrustedEditors({
    lastEditors,
    trustedOsmUsernames: trustConfig.trustedOsmUsernames,
    referenceFrozenAt: trustConfig.referenceFrozenAt,
    absoluteDifferenceThreshold: indicator.absoluteDifferenceThreshold,
  })

  return {
    systemStatus: applyTrustedEditors(thresholdStatus, trustedCheck.passed),
    trustedCheck,
  }
}

function formatFreezeDate(date: Date) {
  return date.toLocaleDateString('de-DE', { timeZone: 'UTC' })
}

// German body text for a TRUSTED_EDITOR_CHANGE row, see docs/QA-Documentation.md.
export function buildTrustedEditorChangeBody(input: {
  referenceFrozenAt: Date
  trustedEditors: string[]
  untrustedAmount: number
  absoluteDifferenceThreshold: number
  unit: string
}) {
  let body = `Automatisch als »Gut (Vertrauensliste)« bewertet: Die seit dem ${formatFreezeDate(input.referenceFrozenAt)} geänderten ${input.unit} wurden zuletzt von vertrauenswürdigen OSM-Nutzer:innen bearbeitet: ${input.trustedEditors.join(', ')}.`

  if (input.untrustedAmount > 0) {
    body += ` ${formatAmount(input.untrustedAmount)} ${input.unit} wurden zuletzt von anderen Nutzer:innen bearbeitet (innerhalb der zulässigen Differenz von ${input.absoluteDifferenceThreshold}).`
  }

  return body
}

// Amounts are rounded to one decimal by processing; summing several can add float noise.
function formatAmount(amount: number) {
  return (Math.round(amount * 10) / 10).toLocaleString('de-DE')
}
