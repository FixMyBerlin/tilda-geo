import { describe, expect, test } from 'vitest'
import {
  COMPOSIT_PARENT_HIGHWAY_ROW_TAG_KEY,
  COMPOSIT_PARENT_HIGHWAY_VALUE_SOURCE_KEYS,
  resolveCompositParentHighwayDisplay,
} from './resolveCompositParentHighwayDisplay'

describe('resolveCompositParentHighwayDisplay', () => {
  test('returns null when no parent-highway source is present', () => {
    expect(resolveCompositParentHighwayDisplay({})).toBeNull()
    expect(
      resolveCompositParentHighwayDisplay({
        _parent_highway: undefined,
        road: '',
        highway: undefined,
      }),
    ).toBeNull()
  })

  test('uses _parent_highway first and keeps OSM highway translation key', () => {
    expect(
      resolveCompositParentHighwayDisplay({
        _parent_highway: 'primary',
        road: 'footway_sidewalk',
        highway: 'cycleway',
      }),
    ).toEqual({
      rowTagKey: COMPOSIT_PARENT_HIGHWAY_ROW_TAG_KEY,
      valueTagKey: '_parent_highway',
      tagValue: 'primary',
    })
  })

  test('falls back to classified road when _parent_highway is missing', () => {
    expect(
      resolveCompositParentHighwayDisplay({
        road: 'footway_sidewalk',
        highway: 'cycleway',
      }),
    ).toEqual({
      rowTagKey: COMPOSIT_PARENT_HIGHWAY_ROW_TAG_KEY,
      valueTagKey: 'road',
      tagValue: 'footway_sidewalk',
    })
  })

  test('falls back to highway on the bikelane geometry last', () => {
    expect(
      resolveCompositParentHighwayDisplay({
        highway: 'cycleway',
      }),
    ).toEqual({
      rowTagKey: COMPOSIT_PARENT_HIGHWAY_ROW_TAG_KEY,
      valueTagKey: 'highway',
      tagValue: 'cycleway',
    })
  })

  test('always labels the row from _parent_highway even when value comes from road', () => {
    const display = resolveCompositParentHighwayDisplay({ road: 'service_alley' })
    expect(display?.rowTagKey).toBe('_parent_highway')
    expect(display?.valueTagKey).toBe('road')
  })

  test('documents lookup priority for staging/production parity', () => {
    expect(COMPOSIT_PARENT_HIGHWAY_VALUE_SOURCE_KEYS).toEqual([
      '_parent_highway',
      'road',
      'highway',
    ])
  })
})
