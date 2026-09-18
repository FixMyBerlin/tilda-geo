import { describe, expect, test } from 'vitest'
import { fractionToPercent, percentToFraction } from '@/shared/qaThresholdPercent'
import {
  computeQaThresholdRanges,
  computeRelativeFromCounts,
  evaluateQaThresholdPreview,
} from './qaThresholdCalculations'

describe('fractionToPercent()', () => {
  test('converts a stored fraction to the percent shown in the admin form', () => {
    expect(fractionToPercent(0.1)).toBe(10)
    expect(fractionToPercent(0.2)).toBe(20)
    expect(fractionToPercent(0)).toBe(0)
    expect(fractionToPercent(1)).toBe(100)
  })

  test('rounds away float noise instead of showing e.g. 28.999999999999996', () => {
    expect(fractionToPercent(0.29)).toBe(29)
    expect(0.29 * 100).not.toBe(29) // the float noise this guards against
  })
})

describe('percentToFraction()', () => {
  test('is the inverse of fractionToPercent for whole percents', () => {
    expect(percentToFraction(10)).toBe(0.1)
    expect(percentToFraction(20)).toBe(0.2)
    expect(percentToFraction(0)).toBe(0)
    expect(percentToFraction(100)).toBe(1)
  })

  test('rounds away float noise instead of storing e.g. 0.30000000000000004', () => {
    expect(percentToFraction(30)).toBe(0.3)
  })

  test('round-trips through fractionToPercent', () => {
    for (const percent of [0, 1, 5, 10, 12.5, 20, 33, 50, 100]) {
      expect(fractionToPercent(percentToFraction(percent))).toBe(percent)
    }
  })
})

describe('computeRelativeFromCounts()', () => {
  test('is the ratio of current to reference', () => {
    expect(computeRelativeFromCounts(20, 24)).toBe(1.2)
    expect(computeRelativeFromCounts(20, 13)).toBe(0.65)
  })

  test('reference 0 with no current is "no difference"', () => {
    expect(computeRelativeFromCounts(0, 0)).toBe(1)
  })

  test('reference 0 with any current count is an extreme ratio', () => {
    expect(computeRelativeFromCounts(0, 5)).toBe(99)
  })
})

const defaultConfig = {
  goodThresholdFraction: 0.1,
  needsReviewThresholdFraction: 0.2,
  absoluteDifferenceThreshold: 4,
}

describe('evaluateQaThresholdPreview()', () => {
  test('20 -> 24: within the absolute tolerance (±4) is GOOD, regardless of the 20% percent', () => {
    const result = evaluateQaThresholdPreview({
      reference: 20,
      current: 24,
      changedByTrustedEditors: false,
      ...defaultConfig,
    })

    expect(result.effectiveSystemStatus).toBe('GOOD')
    expect(result.absoluteDifferenceWithinThreshold).toBe(true)
    expect(result.difference).toBe(4)
  })

  test('20 -> 26: past the absolute tolerance and past the 20% needs-review threshold -> PROBLEMATIC', () => {
    const result = evaluateQaThresholdPreview({
      reference: 20,
      current: 26,
      changedByTrustedEditors: false,
      ...defaultConfig,
    })

    expect(result.effectiveSystemStatus).toBe('PROBLEMATIC')
    expect(result.absoluteDifferenceWithinThreshold).toBe(false)
  })

  test('20 -> 13: a shrink is measured against the smaller value (inverted ratio) -> PROBLEMATIC', () => {
    const result = evaluateQaThresholdPreview({
      reference: 20,
      current: 13,
      changedByTrustedEditors: false,
      ...defaultConfig,
    })

    expect(result.effectiveSystemStatus).toBe('PROBLEMATIC')
    expect(result.difference).toBe(-7)
  })

  test('0 -> 5: reference 0 outside the absolute tolerance -> PROBLEMATIC', () => {
    const result = evaluateQaThresholdPreview({
      reference: 0,
      current: 5,
      changedByTrustedEditors: false,
      ...defaultConfig,
    })

    expect(result.effectiveSystemStatus).toBe('PROBLEMATIC')
  })

  test('0 -> 3: reference 0 within the absolute tolerance (±4) -> GOOD', () => {
    const result = evaluateQaThresholdPreview({
      reference: 0,
      current: 3,
      changedByTrustedEditors: false,
      ...defaultConfig,
    })

    expect(result.effectiveSystemStatus).toBe('GOOD')
  })

  test('a bad percent status becomes TRUSTED_EDITOR_CHANGE when flagged as trusted', () => {
    const result = evaluateQaThresholdPreview({
      reference: 20,
      current: 26,
      changedByTrustedEditors: true,
      ...defaultConfig,
    })

    expect(result.effectiveSystemStatus).toBe('TRUSTED_EDITOR_CHANGE')
    expect(result.steps.at(-1)).toMatch(/Vertrauensliste/)
  })
})

describe('computeQaThresholdRanges()', () => {
  test('a small reference has no room for a needs-review band (10 % good ≈ the ±4 absolute tolerance)', () => {
    const ranges = computeQaThresholdRanges({ reference: 20, ...defaultConfig })

    expect(ranges).not.toBeNull()
    expect(ranges?.byStatus.GOOD).toBe('16–24')
    expect(ranges?.byStatus.NEEDS_REVIEW).toBe('keine')
    expect(ranges?.byStatus.PROBLEMATIC).toBe('sonst')
  })

  test('a larger reference shows all three bands, PROBLEMATIC unbounded on both sides', () => {
    const ranges = computeQaThresholdRanges({ reference: 100, ...defaultConfig })

    expect(ranges).not.toBeNull()
    expect(ranges?.byStatus.GOOD).toBe('91–109')
    expect(ranges?.byStatus.NEEDS_REVIEW).toBe('84–90 und 110–120')
    expect(ranges?.byStatus.PROBLEMATIC).toBe('sonst')
  })

  test('returns null for a negative reference', () => {
    expect(computeQaThresholdRanges({ reference: -1, ...defaultConfig })).toBeNull()
  })

  test('handles a reference of 0 without crashing', () => {
    const ranges = computeQaThresholdRanges({ reference: 0, ...defaultConfig })

    expect(ranges).not.toBeNull()
    expect(ranges?.byStatus.GOOD).toBe('0–4')
  })

  test('caps the scan so a huge reference cannot allocate millions of entries', () => {
    const ranges = computeQaThresholdRanges({ reference: 5_000_000, ...defaultConfig })

    expect(ranges).not.toBeNull()
    expect(ranges?.cap).toBe(10_000)
  })
})
