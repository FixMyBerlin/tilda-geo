import { describe, expect, test } from 'vitest'
import {
  DEFAULT_REVIEW_LIST_STATUS_STYLES,
  parseReviewListStatusStyles,
  readableTextColor,
} from './reviewListStatusStyles'

describe('parseReviewListStatusStyles', () => {
  test('null and invalid values fall back to the defaults', () => {
    expect(parseReviewListStatusStyles(null)).toEqual(DEFAULT_REVIEW_LIST_STATUS_STYLES)
    expect(parseReviewListStatusStyles({ OK: { label: 'OK', color: 'green' } })).toEqual(
      DEFAULT_REVIEW_LIST_STATUS_STYLES,
    )
  })

  test('a complete value is kept', () => {
    const styles = {
      ...DEFAULT_REVIEW_LIST_STATUS_STYLES,
      OK: { label: 'Erledigt', color: '#2563eb' },
    }
    expect(parseReviewListStatusStyles(styles)).toEqual(styles)
  })
})

describe('readableTextColor', () => {
  test('dark text on light colors, white text on dark colors', () => {
    expect(readableTextColor('#facc15')).toBe('#111827')
    expect(readableTextColor('#ffffff')).toBe('#111827')
    expect(readableTextColor('#16a34a')).toBe('#ffffff')
    expect(readableTextColor('#6b7280')).toBe('#ffffff')
  })
})
