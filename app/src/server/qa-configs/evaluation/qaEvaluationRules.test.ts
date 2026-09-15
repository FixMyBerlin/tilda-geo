import { describe, expect, test } from 'vitest'
import {
  calculateSystemStatus,
  checkTrustedEditors,
  getEffectiveSystemStatus,
  getQaUpdateDecision,
  type QaLastEditor,
} from './qaEvaluationRules'

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
      changedByTrustedEditors: false,
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
        changedByTrustedEditors: false,
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
        changedByTrustedEditors: false,
      },
    })

    expect(result.dataChanged).toBe(false)
    expect(result.shouldCreate).toBe(false)
  })

  test('creates a new evaluation when relative changed outside absolute threshold', () => {
    const result = getQaUpdateDecision({
      previousEvaluation: { systemStatus: 'NEEDS_REVIEW', userStatus: null },
      evaluation: {
        systemStatus: 'NEEDS_REVIEW',
        previousRelative: 1.3,
        currentRelative: 0.7,
        absoluteDifference: 10,
        absoluteDifferenceThreshold: 4,
        changedByTrustedEditors: false,
      },
    })

    expect(result.systemStatusChanged).toBe(false)
    expect(result.relativeChanged).toBe(true)
    expect(result.absoluteDifferenceWithinThreshold).toBe(false)
    expect(result.dataChanged).toBe(true)
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
        changedByTrustedEditors: false,
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
        changedByTrustedEditors: false,
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
        changedByTrustedEditors: false,
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
        changedByTrustedEditors: false,
      },
    })

    expect(result.shouldReset).toBe(false)
    expect(result.shouldCreate).toBe(false)
  })

  test('a trusted editor change never resets a human decision (only GOOD does)', () => {
    const result = getQaUpdateDecision({
      previousEvaluation: { systemStatus: 'PROBLEMATIC', userStatus: 'NOT_OK_DATA_ERROR' },
      evaluation: {
        systemStatus: 'PROBLEMATIC',
        previousRelative: 2,
        currentRelative: 2.2,
        absoluteDifference: 50,
        absoluteDifferenceThreshold: 4,
        changedByTrustedEditors: true,
      },
    })

    expect(result.effectiveSystemStatus).toBe('TRUSTED_EDITOR_CHANGE')
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

  test('treats mirrored ratios symmetrically around 1.0', () => {
    const config = { goodThreshold: 0.1, needsReviewThreshold: 0.2 }

    expect(calculateSystemStatus(1.25, config)).toBe('PROBLEMATIC')
    expect(calculateSystemStatus(0.8, config)).toBe('PROBLEMATIC')
  })
})

describe('getEffectiveSystemStatus()', () => {
  test('absolute difference within threshold always wins, even when changed by trusted editors', () => {
    const result = getEffectiveSystemStatus({
      systemStatus: 'PROBLEMATIC',
      absoluteDifference: 4,
      absoluteDifferenceThreshold: 4,
      changedByTrustedEditors: true,
    })

    expect(result.effectiveSystemStatus).toBe('GOOD')
  })

  test('a bad percent status changed by trusted editors becomes TRUSTED_EDITOR_CHANGE', () => {
    const result = getEffectiveSystemStatus({
      systemStatus: 'PROBLEMATIC',
      absoluteDifference: 50,
      absoluteDifferenceThreshold: 4,
      changedByTrustedEditors: true,
    })

    expect(result.effectiveSystemStatus).toBe('TRUSTED_EDITOR_CHANGE')
  })

  test('a bad percent status not changed by trusted editors stays as-is', () => {
    const result = getEffectiveSystemStatus({
      systemStatus: 'PROBLEMATIC',
      absoluteDifference: 50,
      absoluteDifferenceThreshold: 4,
      changedByTrustedEditors: false,
    })

    expect(result.effectiveSystemStatus).toBe('PROBLEMATIC')
  })

  test('a GOOD percent status is never turned into TRUSTED_EDITOR_CHANGE', () => {
    const result = getEffectiveSystemStatus({
      systemStatus: 'GOOD',
      absoluteDifference: 50,
      absoluteDifferenceThreshold: 4,
      changedByTrustedEditors: true,
    })

    expect(result.effectiveSystemStatus).toBe('GOOD')
  })
})

describe('checkTrustedEditors()', () => {
  const referenceFrozenAt = new Date('2026-01-01T00:00:00Z')
  const afterCutoffSeconds = Math.floor(referenceFrozenAt.getTime() / 1000) + 3600
  const beforeCutoffSeconds = Math.floor(referenceFrozenAt.getTime() / 1000) - 3600
  const exactCutoffSeconds = Math.floor(referenceFrozenAt.getTime() / 1000)

  function check(
    lastEditors: QaLastEditor[],
    overrides: Partial<Parameters<typeof checkTrustedEditors>[0]> = {},
  ) {
    return checkTrustedEditors({
      lastEditors,
      trustedOsmUsernames: ['alice', 'bob'],
      referenceFrozenAt,
      absoluteDifferenceThreshold: 4,
      ...overrides,
    })
  }

  test('passes when a trusted editor made the only post-cutoff edit', () => {
    const result = check([{ osmUser: 'Alice', spaceCount: 3, updatedAt: afterCutoffSeconds }])

    expect(result).toEqual({ passed: true, trustedEditors: ['Alice'], untrustedSpaceCount: 0 })
  })

  test('untrusted space count equal to the threshold still passes', () => {
    const result = check([
      { osmUser: 'Alice', spaceCount: 1, updatedAt: afterCutoffSeconds },
      { osmUser: 'Carol', spaceCount: 4, updatedAt: afterCutoffSeconds },
    ])

    expect(result.untrustedSpaceCount).toBe(4)
    expect(result.passed).toBe(true)
  })

  test('untrusted space count above the threshold fails', () => {
    const result = check([
      { osmUser: 'Alice', spaceCount: 1, updatedAt: afterCutoffSeconds },
      { osmUser: 'Carol', spaceCount: 5, updatedAt: afterCutoffSeconds },
    ])

    expect(result.untrustedSpaceCount).toBe(5)
    expect(result.passed).toBe(false)
  })

  test('null osmUser is never trusted', () => {
    const result = check([{ osmUser: null, spaceCount: 2, updatedAt: afterCutoffSeconds }])

    expect(result).toEqual({ passed: false, trustedEditors: [], untrustedSpaceCount: 2 })
  })

  test('cell with no points (empty last_editors) never passes', () => {
    expect(check([])).toEqual({ passed: false, trustedEditors: [], untrustedSpaceCount: 0 })
  })

  test('entries edited before the freeze day are ignored entirely', () => {
    const result = check([{ osmUser: 'Carol', spaceCount: 10, updatedAt: beforeCutoffSeconds }])

    expect(result).toEqual({ passed: false, trustedEditors: [], untrustedSpaceCount: 0 })
  })

  test('an edit exactly at 00:00 UTC of the freeze day counts', () => {
    const result = check([{ osmUser: 'Alice', spaceCount: 3, updatedAt: exactCutoffSeconds }])

    expect(result).toEqual({ passed: true, trustedEditors: ['Alice'], untrustedSpaceCount: 0 })
  })

  test('matches case-insensitively against the already-normalized trusted list', () => {
    const result = check([{ osmUser: 'Alice', spaceCount: 0, updatedAt: afterCutoffSeconds }])

    expect(result).toEqual({ passed: true, trustedEditors: ['Alice'], untrustedSpaceCount: 0 })
  })

  test('returns trusted editors unique and sorted', () => {
    const result = check([
      { osmUser: 'Bob', spaceCount: 0, updatedAt: afterCutoffSeconds },
      { osmUser: 'Alice', spaceCount: 0, updatedAt: afterCutoffSeconds },
      { osmUser: 'Bob', spaceCount: 0, updatedAt: afterCutoffSeconds + 1 },
    ])

    expect(result.trustedEditors).toEqual(['Alice', 'Bob'])
  })

  test('fails when the trusted username list is empty', () => {
    const result = check([{ osmUser: 'Alice', spaceCount: 0, updatedAt: afterCutoffSeconds }], {
      trustedOsmUsernames: [],
    })

    expect(result.passed).toBe(false)
  })
})
