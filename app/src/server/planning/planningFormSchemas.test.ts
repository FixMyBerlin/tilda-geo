import { describe, expect, it } from 'vitest'
import type { UserDataset } from '@/lib/planningUserGeojson'
import {
  PlanningAreaFormSchema,
  type PlanningAreaFormValues,
  planningTitleSchema,
} from './planningFormSchemas'

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

const values = (change: Partial<PlanningAreaFormValues> = {}): PlanningAreaFormValues => ({
  title: 'Schillerkiez',
  studyArea: square,
  userDatasets: [],
  useCase: 'fahrradbox',
  areaSizeM2: 2,
  ...change,
})

describe('planningTitleSchema', () => {
  it('trims and rejects blank names', () => {
    expect(planningTitleSchema.parse(' A ')).toBe('A')
    expect(planningTitleSchema.safeParse('   ').success).toBe(false)
    expect(planningTitleSchema.safeParse('x'.repeat(121)).success).toBe(false)
  })
})

describe('PlanningAreaFormSchema', () => {
  it('accepts a complete form', () => {
    expect(PlanningAreaFormSchema.safeParse(values()).success).toBe(true)
  })

  it('needs a study area', () => {
    expect(PlanningAreaFormSchema.safeParse(values({ studyArea: null })).success).toBe(false)
  })

  it('rejects datasets with an empty or repeated name', () => {
    expect(
      PlanningAreaFormSchema.safeParse(values({ userDatasets: [dataset('a', ' ')] })).success,
    ).toBe(false)
    expect(
      PlanningAreaFormSchema.safeParse(
        values({ userDatasets: [dataset('a', 'Tabu'), dataset('b', 'tabu ')] }),
      ).success,
    ).toBe(false)
  })
})
