import { describe, expect, it } from 'vitest'
import type { UserDataset } from '@/lib/spaceFinderUserGeojson'
import {
  SpaceFinderAreaFormSchema,
  type SpaceFinderAreaFormValues,
  spaceFinderTitleSchema,
} from './spaceFinderFormSchemas'

const square: GeoJSON.Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [13.4, 52.5],
      [13.401, 52.5],
      [13.401, 52.501],
      [13.4, 52.501],
      [13.4, 52.5],
    ],
  ],
}

const dataset = (id: string, name: string): UserDataset => ({
  id,
  name,
  mode: 'bonus',
  geojson: { type: 'FeatureCollection', features: [] },
})

const values = (change: Partial<SpaceFinderAreaFormValues> = {}): SpaceFinderAreaFormValues => ({
  title: 'Schillerkiez',
  studyArea: square,
  userDatasets: [],
  useCase: 'fahrradbox',
  areaSizeM2: 2,
  ...change,
})

describe('spaceFinderTitleSchema', () => {
  it('trims and rejects blank names', () => {
    expect(spaceFinderTitleSchema.parse(' A ')).toBe('A')
    expect(spaceFinderTitleSchema.safeParse('   ').success).toBe(false)
    expect(spaceFinderTitleSchema.safeParse('x'.repeat(121)).success).toBe(false)
  })
})

describe('SpaceFinderAreaFormSchema', () => {
  it('accepts a complete form', () => {
    expect(SpaceFinderAreaFormSchema.safeParse(values()).success).toBe(true)
  })

  it('needs a study area', () => {
    expect(SpaceFinderAreaFormSchema.safeParse(values({ studyArea: null })).success).toBe(false)
  })

  it('rejects datasets with an empty or repeated name', () => {
    expect(
      SpaceFinderAreaFormSchema.safeParse(values({ userDatasets: [dataset('a', ' ')] })).success,
    ).toBe(false)
    expect(
      SpaceFinderAreaFormSchema.safeParse(
        values({ userDatasets: [dataset('a', 'Tabu'), dataset('b', 'tabu ')] }),
      ).success,
    ).toBe(false)
  })
})
