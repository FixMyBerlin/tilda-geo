import { describe, expect, test } from 'vitest'
import { parseRegionWelcomeSections, regionWelcomeSectionsSchema } from './regionWelcomeSections'

describe('regionWelcomeSectionsSchema', () => {
  test('accepts up to 8 sections', () => {
    const sections = Array.from({ length: 8 }, (_, sortOrder) => ({
      title: `Section ${sortOrder}`,
      sortOrder,
    }))
    expect(regionWelcomeSectionsSchema.safeParse(sections).success).toBe(true)
  })

  test('rejects more than 8 sections', () => {
    const sections = Array.from({ length: 9 }, (_, sortOrder) => ({
      title: `Section ${sortOrder}`,
      sortOrder,
    }))
    expect(regionWelcomeSectionsSchema.safeParse(sections).success).toBe(false)
  })

  test('rejects section without title', () => {
    expect(regionWelcomeSectionsSchema.safeParse([{ title: '', sortOrder: 0 }]).success).toBe(false)
  })
})

describe('parseRegionWelcomeSections', () => {
  test('sorts by sortOrder', () => {
    expect(
      parseRegionWelcomeSections([
        { title: 'B', sortOrder: 1 },
        { title: 'A', sortOrder: 0 },
      ]),
    ).toEqual([
      { title: 'A', sortOrder: 0 },
      { title: 'B', sortOrder: 1 },
    ])
  })

  test('corrupt value degrades to empty array', () => {
    expect(parseRegionWelcomeSections(null)).toEqual([])
    expect(parseRegionWelcomeSections('not-json')).toEqual([])
    expect(parseRegionWelcomeSections([{ sortOrder: 0 }])).toEqual([])
  })
})
