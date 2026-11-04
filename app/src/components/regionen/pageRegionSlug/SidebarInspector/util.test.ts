import { polygon } from '@turf/turf'
import { describe, expect, test } from 'vitest'
import type { UrlFeature } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/types'
import { allUrlFeaturesInBounds } from './util'

const visibleArea = polygon([
  [
    [13, 52],
    [14, 52],
    [14, 53],
    [13, 53],
    [13, 52],
  ],
])
const urlFeature = (coordinates: UrlFeature['coordinates']) => ({ coordinates }) as UrlFeature

describe('allUrlFeaturesInBounds', () => {
  test('points inside the visible area are in bounds', () => {
    expect(allUrlFeaturesInBounds([urlFeature([13.5, 52.5])], visibleArea)).toBe(true)
  })

  test('a point outside the visible area is not in bounds', () => {
    expect(
      allUrlFeaturesInBounds([urlFeature([13.5, 52.5]), urlFeature([15, 52.5])], visibleArea),
    ).toBe(false)
  })

  test('a bbox that overlaps the visible area is in bounds', () => {
    expect(allUrlFeaturesInBounds([urlFeature([13.8, 52.8, 14.5, 53.5])], visibleArea)).toBe(true)
  })

  test('a bbox that covers the whole visible area is not in bounds', () => {
    expect(allUrlFeaturesInBounds([urlFeature([12, 51, 15, 54])], visibleArea)).toBe(false)
    expect(allUrlFeaturesInBounds([urlFeature([13, 52, 14, 53])], visibleArea)).toBe(false)
  })
})
