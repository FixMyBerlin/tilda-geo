import { describe, expect, test } from 'vitest'
import { type QaDatasetKey, qaDatasets } from '../qaDatasets.const'
import { type QaIndicator, qaIndicatorsSchema } from './qaIndicatorsSchema'
import { validateQaIndicatorTagKeys } from './validateQaIndicatorTagKeys'

const thresholds = { goodThreshold: 0.1, needsReviewThreshold: 0.2, absoluteDifferenceThreshold: 4 }
const indicator = (key: string): QaIndicator => ({ key, label: key, ...thresholds })

describe('qaIndicatorsSchema', () => {
  test('rejects an empty list and duplicate keys', () => {
    expect(qaIndicatorsSchema.safeParse([]).success).toBe(false)
    expect(qaIndicatorsSchema.safeParse([indicator('surface'), indicator('surface')]).success).toBe(
      false,
    )
  })
})

describe('validateQaIndicatorTagKeys', () => {
  test('rejects an unknown tag with a German error message', () => {
    const errors = validateQaIndicatorTagKeys('bikelanes', [indicator('not_a_real_tag')])
    expect(errors).toHaveLength(1)
    expect(errors[0]).toContain('not_a_real_tag')
    expect(errors[0]).toContain('nicht wählbar')
  })

  test('rejects numeric tags (one class per number)', () => {
    expect(validateQaIndicatorTagKeys('bikelanes', [indicator('width')])).toHaveLength(1)
  })
})

describe('qaDatasets default indicators', () => {
  test.each(Object.keys(qaDatasets) as QaDatasetKey[])(
    '%s defaults pass the schema and exist in the topic docs',
    (dataset) => {
      const indicators = qaIndicatorsSchema.parse(qaDatasets[dataset].defaultIndicators)
      expect(validateQaIndicatorTagKeys(dataset, indicators)).toEqual([])
    },
  )
})
