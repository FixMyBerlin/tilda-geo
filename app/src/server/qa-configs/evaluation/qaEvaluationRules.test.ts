import { describe, expect, test } from 'vitest'
import {
  applyTrustedEditors,
  calculateIndicatorStatus,
  checkTrustedEditors,
  getQaUpdateDecision,
  type QaLastEditor,
} from './qaEvaluationRules'

const parkingThresholds = {
  goodThreshold: 0.1,
  needsReviewThreshold: 0.2,
  absoluteDifferenceThreshold: 4,
}

// The deviation itself is computed in SQL (tilda_qa_compute_indicators, qa_functions.test.sql).
describe('calculateIndicatorStatus()', () => {
  test('a difference within the absolute threshold is GOOD whatever the deviation (inclusive)', () => {
    const status = (difference: number) =>
      calculateIndicatorStatus({ deviation: 1, difference, thresholds: parkingThresholds })
    expect(status(4)).toBe('GOOD')
    expect(status(4.1)).toBe('PROBLEMATIC')
  })

  test('maps deviation into bands with inclusive upper bounds', () => {
    const status = (deviation: number) =>
      calculateIndicatorStatus({ deviation, difference: 99, thresholds: parkingThresholds })
    expect(status(0.1)).toBe('GOOD')
    expect(status(0.1001)).toBe('NEEDS_REVIEW')
    expect(status(0.2)).toBe('NEEDS_REVIEW')
    expect(status(0.2001)).toBe('PROBLEMATIC')
    // Boundary survives float arithmetic: 1.2 − 1 = 0.19999999999999996
    expect(status(1.2 - 1)).toBe('NEEDS_REVIEW')
  })
})

// Mirrors the table in docs/QA-Documentation.md, "Nightly update rules".
describe('getQaUpdateDecision()', () => {
  const G = 'GOOD'
  const N = 'NEEDS_REVIEW'
  const P = 'PROBLEMATIC'
  const T = 'TRUSTED_EDITOR_CHANGE'
  test.each([
    ['first sighting', null, null, P, 'create'],
    ['no user status, unchanged', N, null, N, 'none'],
    ['no user status, changed', N, null, G, 'create'],
    ['no user status, into trusted', P, null, T, 'create'],
    ['no user status, out of trusted', T, null, P, 'create'],
    ['permanent OK, even when GOOD', P, 'OK_STRUCTURAL_CHANGE', G, 'none'],
    ['permanent OK, when worse', G, 'OK_REFERENCE_ERROR', P, 'none'],
    ['resettable becomes GOOD', P, 'NOT_OK_DATA_ERROR', G, 'reset'],
    ['resettable becomes GOOD', N, 'NOT_OK_PROCESSING_ERROR', G, 'reset'],
    ['resettable becomes GOOD', P, 'OK_QA_TOOLING_ERROR', G, 'reset'],
    ['resettable, status moves but not GOOD', P, 'NOT_OK_DATA_ERROR', N, 'none'],
    ['resettable, trusted is not GOOD', P, 'NOT_OK_DATA_ERROR', T, 'none'],
    ['resettable set on a GOOD indicator: no fix signal', G, 'NOT_OK_DATA_ERROR', G, 'none'],
  ] as const)('%s', (_, previousSystemStatus, userStatus, systemStatus, expected) => {
    const previous = previousSystemStatus
      ? { systemStatus: previousSystemStatus, userStatus }
      : null
    expect(getQaUpdateDecision({ previous, systemStatus })).toBe(expected)
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
    const result = check([{ osmUser: 'Alice', amount: 3, updatedAt: afterCutoffSeconds }])

    expect(result).toEqual({ passed: true, trustedEditors: ['Alice'], untrustedAmount: 0 })
  })

  test('untrusted amount up to the threshold passes (inclusive), above it fails', () => {
    const withUntrusted = (amount: number) =>
      check([
        { osmUser: 'Alice', amount: 1, updatedAt: afterCutoffSeconds },
        { osmUser: 'Carol', amount, updatedAt: afterCutoffSeconds },
      ])

    expect(withUntrusted(4)).toMatchObject({ passed: true, untrustedAmount: 4 })
    expect(withUntrusted(5)).toMatchObject({ passed: false, untrustedAmount: 5 })
  })

  test('fractional untrusted amounts that sum to the threshold still pass', () => {
    // 0.1 + 0.2 = 0.30000000000000004
    const result = check(
      [
        { osmUser: 'Alice', amount: 1, updatedAt: afterCutoffSeconds },
        { osmUser: 'Carol', amount: 0.1, updatedAt: afterCutoffSeconds },
        { osmUser: 'Dave', amount: 0.2, updatedAt: afterCutoffSeconds },
      ],
      { absoluteDifferenceThreshold: 0.3 },
    )

    expect(result.passed).toBe(true)
  })

  test('null osmUser is never trusted', () => {
    const result = check([{ osmUser: null, amount: 2, updatedAt: afterCutoffSeconds }])

    expect(result).toEqual({ passed: false, trustedEditors: [], untrustedAmount: 2 })
  })

  test('cell without features never passes', () => {
    expect(check([])).toEqual({ passed: false, trustedEditors: [], untrustedAmount: 0 })
  })

  test('edits before the freeze day are ignored entirely, one exactly at 00:00 UTC of it counts', () => {
    expect(check([{ osmUser: 'Carol', amount: 10, updatedAt: beforeCutoffSeconds }])).toEqual({
      passed: false,
      trustedEditors: [],
      untrustedAmount: 0,
    })
    expect(check([{ osmUser: 'Alice', amount: 3, updatedAt: exactCutoffSeconds }])).toEqual({
      passed: true,
      trustedEditors: ['Alice'],
      untrustedAmount: 0,
    })
  })

  test('fails when the trusted username list is empty', () => {
    const result = check([{ osmUser: 'Alice', amount: 0, updatedAt: afterCutoffSeconds }], {
      trustedOsmUsernames: [],
    })

    expect(result.passed).toBe(false)
  })
})

describe('applyTrustedEditors()', () => {
  test('a passed check turns NEEDS_REVIEW and PROBLEMATIC into TRUSTED_EDITOR_CHANGE, nothing else', () => {
    expect(applyTrustedEditors('NEEDS_REVIEW', true)).toBe('TRUSTED_EDITOR_CHANGE')
    expect(applyTrustedEditors('PROBLEMATIC', true)).toBe('TRUSTED_EDITOR_CHANGE')
    // The absolute threshold already won.
    expect(applyTrustedEditors('GOOD', true)).toBe('GOOD')
    expect(applyTrustedEditors('PROBLEMATIC', false)).toBe('PROBLEMATIC')
  })
})
