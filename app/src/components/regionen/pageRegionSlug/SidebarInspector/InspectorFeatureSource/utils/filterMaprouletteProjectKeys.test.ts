import { describe, expect, test } from 'vitest'
import type { TodoId } from '@/data/processingTypes/todoId.generated.const'
import { filterMaprouletteProjectKeys, isCurrentnessId } from './filterMaprouletteProjectKeys'

const currentness = 'currentness_too_old' as TodoId
const currentnessMapillary = 'currentness_too_old__mapillary' as TodoId
const missingOneway = 'missing_oneway' as TodoId
const missingSurface = 'missing_surface' as TodoId

describe('isCurrentnessId', () => {
  test('matches currentness todo and campaign style ids', () => {
    expect(isCurrentnessId(currentness)).toBe(true)
    expect(isCurrentnessId(currentnessMapillary)).toBe(true)
    expect(isCurrentnessId('currentness_too_old')).toBe(true)
    expect(isCurrentnessId('currentness_too_old__mapillary')).toBe(true)
    expect(isCurrentnessId(missingOneway)).toBe(false)
    expect(isCurrentnessId('default')).toBe(false)
    expect(isCurrentnessId(undefined)).toBe(false)
  })
})

describe('filterMaprouletteProjectKeys', () => {
  test('keeps only currentness todos when no other todos are present', () => {
    expect(filterMaprouletteProjectKeys([currentness], undefined)).toEqual([currentness])
    expect(filterMaprouletteProjectKeys([currentness, currentnessMapillary], undefined)).toEqual([
      currentness,
      currentnessMapillary,
    ])
  })

  test('removes currentness todos when other todos are present', () => {
    expect(filterMaprouletteProjectKeys([missingOneway, currentness], undefined)).toEqual([
      missingOneway,
    ])
    expect(
      filterMaprouletteProjectKeys(
        [missingOneway, currentness, currentnessMapillary, missingSurface],
        'default',
      ),
    ).toEqual([missingOneway, missingSurface])
  })

  test('keeps currentness todos when the active campaign filter is currentness', () => {
    expect(
      filterMaprouletteProjectKeys([missingOneway, currentness], 'currentness_too_old'),
    ).toEqual([missingOneway, currentness])
    expect(
      filterMaprouletteProjectKeys(
        [missingOneway, currentnessMapillary],
        'currentness_too_old__mapillary',
      ),
    ).toEqual([missingOneway, currentnessMapillary])
  })
})
