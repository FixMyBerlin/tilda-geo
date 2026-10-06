import { describe, expect, test } from 'vitest'
import { reviewDrawSessionKind, reviewDrawStartMode } from './reviewDrawSessionMode'
import { REVIEW_DRAW_MODE } from './reviewTerraDrawConfig'

describe('reviewDrawSessionKind', () => {
  test('maps drawSession strings to compose / edit / idle', () => {
    expect(reviewDrawSessionKind('new')).toBe('compose')
    expect(reviewDrawSessionKind('edit-42')).toBe('edit')
    expect(reviewDrawSessionKind('idle')).toBeNull()
  })
})

describe('reviewDrawStartMode', () => {
  test('compose starts in the toolbar geometry mode, never select', () => {
    expect(reviewDrawStartMode('compose')).toBe(REVIEW_DRAW_MODE.point)
    expect(reviewDrawStartMode('compose', REVIEW_DRAW_MODE.point)).toBe(REVIEW_DRAW_MODE.point)
    expect(reviewDrawStartMode('compose', REVIEW_DRAW_MODE.linestring)).toBe(
      REVIEW_DRAW_MODE.linestring,
    )
    expect(reviewDrawStartMode('compose', REVIEW_DRAW_MODE.polygon)).toBe(REVIEW_DRAW_MODE.polygon)
    expect(reviewDrawStartMode('compose', REVIEW_DRAW_MODE.select)).toBe(REVIEW_DRAW_MODE.point)
  })

  test('edit always starts in select, even if a draw mode is passed', () => {
    expect(reviewDrawStartMode('edit')).toBe(REVIEW_DRAW_MODE.select)
    expect(reviewDrawStartMode('edit', REVIEW_DRAW_MODE.point)).toBe(REVIEW_DRAW_MODE.select)
    expect(reviewDrawStartMode('edit', REVIEW_DRAW_MODE.linestring)).toBe(REVIEW_DRAW_MODE.select)
  })
})
