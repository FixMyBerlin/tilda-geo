import { describe, expect, test } from 'vitest'
import { calculateSystemStatus, getQaUpdateDecision } from './qaEvaluationRules'

function getRelative(referenceCount: number, currentCount: number) {
  if (referenceCount === 0 && currentCount === 0) return 1
  if (referenceCount === 0 && currentCount > 0) return 99
  return Number((currentCount / referenceCount).toFixed(3))
}

function getDecisionInput(
  referenceCount: number,
  currentCount: number,
  previousRelative?: number | null,
) {
  const currentRelative = getRelative(referenceCount, currentCount)
  const systemStatus = calculateSystemStatus(currentRelative, {
    goodThreshold: 0.1,
    needsReviewThreshold: 0.2,
  })

  return {
    previousEvaluation: null,
    evaluation: {
      systemStatus,
      previousRelative: previousRelative ?? currentRelative,
      currentRelative,
      absoluteDifference: referenceCount - currentCount,
      absoluteDifferenceThreshold: 4,
    },
  } as const
}

describe('getQaUpdateDecision()', () => {
  test('creates an evaluation on first run', () => {
    const result = getQaUpdateDecision(getDecisionInput(100, 100))
    expect(result.shouldCreate).toBe(true)
  })

  test('marks mirrored medium deviations with equal severity (regression #3175)', () => {
    const osmHigher = getDecisionInput(20, 25)
    const osmLower = getDecisionInput(25, 20)

    const osmHigherDecision = getQaUpdateDecision(osmHigher)
    const osmLowerDecision = getQaUpdateDecision(osmLower)

    expect(osmHigherDecision.effectiveSystemStatus).toBe('PROBLEMATIC')
    expect(osmLowerDecision.effectiveSystemStatus).toBe('PROBLEMATIC')
  })

  test('marks extreme mirrored deviations as problematic for both directions (#3175 examples)', () => {
    const osmHigher = getDecisionInput(20, 60)
    const osmLower = getDecisionInput(60, 20)

    const osmHigherDecision = getQaUpdateDecision(osmHigher)
    const osmLowerDecision = getQaUpdateDecision(osmLower)

    expect(osmHigherDecision.effectiveSystemStatus).toBe('PROBLEMATIC')
    expect(osmLowerDecision.effectiveSystemStatus).toBe('PROBLEMATIC')
  })

  test('absolute-difference threshold overrides percent status to GOOD', () => {
    const result = getQaUpdateDecision({
      previousEvaluation: { systemStatus: 'NEEDS_REVIEW', userStatus: null },
      evaluation: {
        systemStatus: 'PROBLEMATIC',
        previousRelative: 0.9,
        currentRelative: 0.84,
        absoluteDifference: 4,
        absoluteDifferenceThreshold: 4,
      },
    })

    expect(result.absoluteDifferenceWithinThreshold).toBe(true)
    expect(result.effectiveSystemStatus).toBe('GOOD')
    expect(result.dataChanged).toBe(true)
    expect(result.shouldCreate).toBe(true)
  })

  test('returns no-op when status and relevant data did not change', () => {
    const result = getQaUpdateDecision({
      previousEvaluation: { systemStatus: 'GOOD', userStatus: null },
      evaluation: {
        systemStatus: 'GOOD',
        previousRelative: 1,
        currentRelative: 1,
        absoluteDifference: 0,
        absoluteDifferenceThreshold: 4,
      },
    })

    expect(result.dataChanged).toBe(false)
    expect(result.shouldCreate).toBe(false)
  })

  test('keeps NOT_OK user decision unless system becomes GOOD', () => {
    const result = getQaUpdateDecision({
      previousEvaluation: { systemStatus: 'PROBLEMATIC', userStatus: 'NOT_OK_DATA_ERROR' },
      evaluation: {
        systemStatus: 'NEEDS_REVIEW',
        previousRelative: 0.5,
        currentRelative: 0.7,
        absoluteDifference: 50,
        absoluteDifferenceThreshold: 4,
      },
    })

    expect(result.effectiveSystemStatus).toBe('NEEDS_REVIEW')
    expect(result.shouldReset).toBe(false)
    expect(result.shouldCreate).toBe(false)
  })

  test('resets NOT_OK user decision when system becomes GOOD', () => {
    const result = getQaUpdateDecision({
      previousEvaluation: { systemStatus: 'PROBLEMATIC', userStatus: 'NOT_OK_PROCESSING_ERROR' },
      evaluation: {
        systemStatus: 'GOOD',
        previousRelative: 0.6,
        currentRelative: 1,
        absoluteDifference: 0,
        absoluteDifferenceThreshold: 4,
      },
    })

    expect(result.shouldReset).toBe(true)
    expect(result.shouldCreate).toBe(true)
  })

  test('resets QA_TOOLING_ERROR only when effective status becomes GOOD', () => {
    const result = getQaUpdateDecision({
      previousEvaluation: { systemStatus: 'PROBLEMATIC', userStatus: 'OK_QA_TOOLING_ERROR' },
      evaluation: {
        systemStatus: 'PROBLEMATIC',
        previousRelative: 2,
        currentRelative: 2.2,
        absoluteDifference: 4,
        absoluteDifferenceThreshold: 4,
      },
    })

    expect(result.effectiveSystemStatus).toBe('GOOD')
    expect(result.shouldReset).toBe(true)
    expect(result.shouldCreate).toBe(true)
  })

  test('keeps OK_STRUCTURAL_CHANGE permanently', () => {
    const result = getQaUpdateDecision({
      previousEvaluation: { systemStatus: 'PROBLEMATIC', userStatus: 'OK_STRUCTURAL_CHANGE' },
      evaluation: {
        systemStatus: 'GOOD',
        previousRelative: 0.4,
        currentRelative: 1,
        absoluteDifference: 0,
        absoluteDifferenceThreshold: 4,
      },
    })

    expect(result.shouldReset).toBe(false)
    expect(result.shouldCreate).toBe(false)
  })
})

describe('calculateSystemStatus()', () => {
  test('returns NEEDS_REVIEW for null relative', () => {
    expect(
      calculateSystemStatus(null, {
        goodThreshold: 0.1,
        needsReviewThreshold: 0.2,
      }),
    ).toBe('NEEDS_REVIEW')
  })

  test('maps values into GOOD, NEEDS_REVIEW and PROBLEMATIC bands', () => {
    expect(
      calculateSystemStatus(1.05, {
        goodThreshold: 0.1,
        needsReviewThreshold: 0.2,
      }),
    ).toBe('GOOD')
    expect(
      calculateSystemStatus(1.2, {
        goodThreshold: 0.1,
        needsReviewThreshold: 0.2,
      }),
    ).toBe('NEEDS_REVIEW')
    expect(
      calculateSystemStatus(1.201, {
        goodThreshold: 0.1,
        needsReviewThreshold: 0.2,
      }),
    ).toBe('PROBLEMATIC')
  })
})
