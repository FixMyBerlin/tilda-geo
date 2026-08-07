import { describe, expect, test } from 'vitest'
import {
  COMPOSIT_PARENT_HIGHWAY_ROW_TAG_KEY,
  COMPOSIT_PARENT_HIGHWAY_VALUE_SOURCE_KEYS,
  resolveCompositParentHighwayDisplay,
} from './resolveCompositParentHighwayDisplay'

describe('resolveCompositParentHighwayDisplay', () => {
  test('returns null when no parent-road source is present', () => {
    expect(resolveCompositParentHighwayDisplay({})).toBeNull()
    expect(
      resolveCompositParentHighwayDisplay({
        parent_road: undefined,
        road: '',
      }),
    ).toBeNull()
  })

  test('uses parent_road first', () => {
    expect(
      resolveCompositParentHighwayDisplay({
        parent_road: 'primary',
        road: 'footway_sidewalk',
      }),
    ).toEqual({
      rowTagKey: COMPOSIT_PARENT_HIGHWAY_ROW_TAG_KEY,
      valueTagKey: 'parent_road',
      tagValue: 'primary',
    })
  })

  test('falls back to classified road when parent_road is missing', () => {
    expect(
      resolveCompositParentHighwayDisplay({
        road: 'footway_sidewalk',
      }),
    ).toEqual({
      rowTagKey: COMPOSIT_PARENT_HIGHWAY_ROW_TAG_KEY,
      valueTagKey: 'road',
      tagValue: 'footway_sidewalk',
    })
  })

  test('always labels the row from parent_road even when value comes from road', () => {
    const display = resolveCompositParentHighwayDisplay({ road: 'service_alley' })
    expect(display?.rowTagKey).toBe('parent_road')
    expect(display?.valueTagKey).toBe('road')
  })

  test('documents lookup priority', () => {
    expect(COMPOSIT_PARENT_HIGHWAY_VALUE_SOURCE_KEYS).toEqual(['parent_road', 'road'])
  })
})
