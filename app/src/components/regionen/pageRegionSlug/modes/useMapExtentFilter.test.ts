import { describe, expect, test } from 'vitest'
import { bboxesOverlap } from './useMapExtentFilter'

const view = [13.3, 52.5, 13.4, 52.6] as const

describe('bboxesOverlap', () => {
  test('line whose start lies outside the view but crosses it', () => {
    expect(bboxesOverlap([13.2, 52.55, 13.35, 52.56], view)).toBe(true)
  })
  test('line completely outside the view', () => {
    expect(bboxesOverlap([13.0, 52.55, 13.1, 52.56], view)).toBe(false)
  })
  test('line bbox larger than the view', () => {
    expect(bboxesOverlap([13.0, 52.0, 14.0, 53.0], view)).toBe(true)
  })
  test('point as zero-size bbox, inside and outside', () => {
    expect(bboxesOverlap([13.35, 52.55, 13.35, 52.55], view)).toBe(true)
    expect(bboxesOverlap([13.45, 52.55, 13.45, 52.55], view)).toBe(false)
  })
  test('touching edge counts', () => {
    expect(bboxesOverlap([13.4, 52.55, 13.5, 52.56], view)).toBe(true)
  })
})
