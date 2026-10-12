import { describe, expect, test } from 'vitest'
import {
  computeQaIndicatorThresholdPreview,
  type QaIndicatorPreviewRow,
} from './computeQaIndicatorThresholdPreview'

const thresholds = {
  goodThreshold: 0.1,
  needsReviewThreshold: 0.2,
  absoluteDifferenceThreshold: 4,
}

const referenceFrozenAt = new Date('2026-01-01T00:00:00Z')

const row = (areaId: string, difference: number, deviation: number): QaIndicatorPreviewRow => ({
  areaId,
  reference: 100,
  current: 100 - difference,
  difference,
  deviation,
})

describe('computeQaIndicatorThresholdPreview()', () => {
  test('counts the statuses the nightly would write, trusted editors included', () => {
    const result = computeQaIndicatorThresholdPreview({
      rows: [
        row('good', 0, 0),
        row('needsReview', 15, 0.15),
        row('problematic', 50, 0.5),
        row('trusted', 50, 0.5),
      ],
      thresholds,
      lastEditorsByAreaId: new Map([
        [
          'trusted',
          [{ osmUser: 'alice', amount: 50, updatedAt: referenceFrozenAt.getTime() / 1000 }],
        ],
      ]),
      trustConfig: { trustedOsmUsernames: ['alice'], referenceFrozenAt },
    })

    expect(result).toMatchObject({
      good: 1,
      needsReview: 1,
      problematic: 1,
      trustedEditorChange: 1,
    })
  })
})
