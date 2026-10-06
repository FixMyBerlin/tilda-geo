import type { QaSystemStatus } from '@/prisma/generated/client'
import {
  calculateSystemStatus,
  getEffectiveSystemStatus,
} from '@/server/qa-configs/evaluation/qaEvaluationRules'
import { fractionToPercent, roundTo } from '@/shared/qaThresholdPercent'

// Pure helpers shared by the QA config form (percent inputs), the QA config list (percent
// display) and the "Probe-Rechnung" preview panel. Kept in one place so the admin form ↔ schema
// percent/fraction conversion never drifts from what the preview shows. See qaThresholdCalculations.test.ts.

/**
 * Mirrors `processing/topics/parking/9_qa_parkings_euvm_voronoi.sql` step 3 (`relative`): ratio of
 * current to reference count. Reference 0 is a real, expected input (not a "no data" case — that's
 * what `calculateSystemStatus`'s `null` handles), so it uses the same special cases as the SQL:
 * both 0 → no difference (1), reference 0 with any current count → an extreme ratio (99), which
 * safely lands in PROBLEMATIC unless the absolute tolerance already covers it.
 */
export function computeRelativeFromCounts(reference: number, current: number): number {
  if (reference === 0) return current === 0 ? 1 : 99
  return roundTo(current / reference, 3)
}

export type QaThresholdPreviewInput = {
  reference: number
  current: number
  /** 0–1 fraction, as stored on `QaConfig`. */
  goodThresholdFraction: number
  /** 0–1 fraction, as stored on `QaConfig`. */
  needsReviewThresholdFraction: number
  absoluteDifferenceThreshold: number
  changedByTrustedEditors: boolean
}

export type QaThresholdPreviewResult = {
  effectiveSystemStatus: QaSystemStatus
  /** current - reference; positive = grew, negative = shrank. */
  difference: number
  absoluteDifferenceWithinThreshold: boolean
  /** Short German step-by-step explanation, one entry per step. */
  steps: string[]
}

function formatSignedInteger(value: number) {
  if (value === 0) return '±0'
  return value > 0 ? `+${value}` : `${value}`
}

function formatPercent(value: number) {
  return value.toLocaleString('de-DE', { maximumFractionDigits: 1 })
}

/** Runs the real evaluation rules (`qaEvaluationRules.ts`) on two example counts and explains the result. */
export function evaluateQaThresholdPreview(
  input: QaThresholdPreviewInput,
): QaThresholdPreviewResult {
  const {
    reference,
    current,
    goodThresholdFraction,
    needsReviewThresholdFraction,
    absoluteDifferenceThreshold,
    changedByTrustedEditors,
  } = input

  const relative = computeRelativeFromCounts(reference, current)
  const difference = current - reference
  const systemStatus = calculateSystemStatus(relative, {
    goodThreshold: goodThresholdFraction,
    needsReviewThreshold: needsReviewThresholdFraction,
  })
  const { effectiveSystemStatus, absoluteDifferenceWithinThreshold } = getEffectiveSystemStatus({
    systemStatus,
    absoluteDifference: difference,
    absoluteDifferenceThreshold,
    changedByTrustedEditors,
  })

  const steps = [`Differenz: ${formatSignedInteger(difference)} Stellplätze`]

  if (absoluteDifferenceWithinThreshold) {
    steps.push(`Innerhalb der absoluten Toleranz (±${absoluteDifferenceThreshold}) → Gut`)
    return { effectiveSystemStatus, difference, absoluteDifferenceWithinThreshold, steps }
  }
  steps.push(`Über der absoluten Toleranz (±${absoluteDifferenceThreshold})`)

  const normalizedRelative = relative > 0 && relative < 1 ? 1 / relative : relative
  const percent = roundTo(Math.abs(normalizedRelative - 1) * 100, 1)
  const goodPercent = fractionToPercent(goodThresholdFraction)
  const needsReviewPercent = fractionToPercent(needsReviewThresholdFraction)
  const percentPhrase =
    systemStatus === 'GOOD'
      ? `bis ${formatPercent(goodPercent)} % → Gut`
      : systemStatus === 'NEEDS_REVIEW'
        ? `über ${formatPercent(goodPercent)} % → Überprüfung nötig`
        : `über ${formatPercent(needsReviewPercent)} % → Problematisch`
  steps.push(
    `Prozentual ${formatPercent(percent)} % (gemessen am kleineren Wert) → ${percentPhrase}`,
  )

  if (effectiveSystemStatus === 'TRUSTED_EDITOR_CHANGE') {
    steps.push('Zuletzt von Nutzer:innen der Vertrauensliste bearbeitet → Gut (Vertrauensliste)')
  }

  return { effectiveSystemStatus, difference, absoluteDifferenceWithinThreshold, steps }
}

type QaThresholdRangeStatus = Extract<QaSystemStatus, 'GOOD' | 'NEEDS_REVIEW' | 'PROBLEMATIC'>

/** Upper bound for the 0…cap scan in `computeQaThresholdRanges` (preview only). */
const MAX_RANGE_CAP = 10_000

export type QaThresholdRanges = {
  reference: number
  cap: number
  byStatus: Record<QaThresholdRangeStatus, string>
}

function classifyForRange(
  reference: number,
  current: number,
  goodThresholdFraction: number,
  needsReviewThresholdFraction: number,
  absoluteDifferenceThreshold: number,
): QaThresholdRangeStatus {
  const relative = computeRelativeFromCounts(reference, current)
  const systemStatus = calculateSystemStatus(relative, {
    goodThreshold: goodThresholdFraction,
    needsReviewThreshold: needsReviewThresholdFraction,
  })
  // No trust-list overlay here — the range line explains the plain %/absolute bands, so the
  // effective status is only ever GOOD, NEEDS_REVIEW or PROBLEMATIC.
  const { effectiveSystemStatus } = getEffectiveSystemStatus({
    systemStatus,
    absoluteDifference: current - reference,
    absoluteDifferenceThreshold,
    changedByTrustedEditors: false,
  })
  return effectiveSystemStatus as QaThresholdRangeStatus
}

function groupConsecutive(
  values: number[],
  statusOf: (value: number) => QaThresholdRangeStatus,
): Map<QaThresholdRangeStatus, Array<[number, number]>> {
  const runs = new Map<QaThresholdRangeStatus, Array<[number, number]>>()
  let openStatus: QaThresholdRangeStatus | null = null
  let start = 0

  const closeRun = (endValue: number) => {
    if (openStatus === null) return
    const list = runs.get(openStatus) ?? []
    list.push([start, endValue])
    runs.set(openStatus, list)
  }

  let lastValue = start
  for (const value of values) {
    const status = statusOf(value)
    if (status !== openStatus) {
      closeRun(value - 1)
      openStatus = status
      start = value
    }
    lastValue = value
  }
  closeRun(lastValue)

  return runs
}

function formatRuns(runs: Array<[number, number]>) {
  return runs.map(([start, end]) => (start === end ? `${start}` : `${start}–${end}`)).join(' und ')
}

/**
 * For a given reference count, which integer "current" counts fall into which status — evaluated
 * with the real rules (`GOOD`/`NEEDS_REVIEW`/`PROBLEMATIC` only, see `classifyForRange`) over
 * `0…cap`. `PROBLEMATIC` renders as "sonst" once its run touches either end of that range, since
 * the band is then structurally unbounded on that side rather than a real numeric limit.
 */
export function computeQaThresholdRanges(input: {
  reference: number
  goodThresholdFraction: number
  needsReviewThresholdFraction: number
  absoluteDifferenceThreshold: number
}): QaThresholdRanges | null {
  const {
    reference,
    goodThresholdFraction,
    needsReviewThresholdFraction,
    absoluteDifferenceThreshold,
  } = input
  if (!Number.isFinite(reference) || reference < 0) return null

  const cap = Math.min(
    Math.max(
      Math.round(reference * 3 + absoluteDifferenceThreshold),
      Math.round(absoluteDifferenceThreshold * 4),
      10,
    ),
    MAX_RANGE_CAP,
  )
  const values = Array.from({ length: cap + 1 }, (_, i) => i)
  const runs = groupConsecutive(values, (value) =>
    classifyForRange(
      reference,
      value,
      goodThresholdFraction,
      needsReviewThresholdFraction,
      absoluteDifferenceThreshold,
    ),
  )

  const goodRuns = runs.get('GOOD') ?? []
  const needsReviewRuns = runs.get('NEEDS_REVIEW') ?? []
  const problematicRuns = runs.get('PROBLEMATIC') ?? []
  const problematicTouchesBoundary = problematicRuns.some(
    ([start, end]) => start === 0 || end === cap,
  )

  return {
    reference,
    cap,
    byStatus: {
      GOOD: goodRuns.length ? formatRuns(goodRuns) : 'keine',
      NEEDS_REVIEW: needsReviewRuns.length ? formatRuns(needsReviewRuns) : 'keine',
      PROBLEMATIC: problematicRuns.length
        ? problematicTouchesBoundary
          ? 'sonst'
          : formatRuns(problematicRuns)
        : 'keine',
    },
  }
}
