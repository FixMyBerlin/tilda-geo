import { describe, expect, test } from 'vitest'
import {
  firstSpaceFinderVariantId,
  type PlanningAreasRow,
  sortedSpaceFinderAreas,
  spaceFinderSelectedVariant,
  spaceFinderVariantStatus,
} from './spaceFinderCollectionOptions'

const area = (overrides: Partial<PlanningAreasRow>) =>
  ({
    id: 1,
    title: 'Gebiet',
    createdAt: new Date('2026-01-01'),
    variants: [],
    ...overrides,
  }) as PlanningAreasRow

const variant = (id: number, title = 'Variante') =>
  ({ id, title, currentRunId: null, jobs: [], runs: [] }) as never

const areas = [
  area({ id: 2, title: 'Neu', createdAt: new Date('2026-02-01'), variants: [variant(20)] }),
  area({
    id: 1,
    title: 'Alt',
    createdAt: new Date('2026-01-01'),
    variants: [variant(10, 'Standard'), variant(11, 'B')],
  }),
]

describe('sortedSpaceFinderAreas', () => {
  test('orders areas oldest first regardless of input order', () => {
    expect(sortedSpaceFinderAreas(areas).map((a) => a.id)).toEqual([1, 2])
  })
})

describe('firstSpaceFinderVariantId', () => {
  test('picks the first variant of the oldest area', () => {
    expect(firstSpaceFinderVariantId(areas)).toBe(10)
  })

  test('skips areas without variants', () => {
    expect(firstSpaceFinderVariantId([area({ id: 1, variants: [] }), areas[0]!])).toBe(20)
  })
})

describe('spaceFinderSelectedVariant', () => {
  test('resolves a variant id to its area', () => {
    expect(spaceFinderSelectedVariant(areas, 11)).toEqual({
      areaId: 1,
      areaTitle: 'Alt',
      variantId: 11,
      variantTitle: 'B',
      variantCount: 2,
    })
  })

  test('returns undefined for unknown or missing ids', () => {
    expect(spaceFinderSelectedVariant(areas, 99)).toBeUndefined()
    expect(spaceFinderSelectedVariant(areas, undefined)).toBeUndefined()
  })
})

describe('spaceFinderVariantStatus', () => {
  const base = { currentRunId: null, jobs: [], runs: [] }

  test('running beats everything else', () => {
    expect(
      spaceFinderVariantStatus({
        ...base,
        currentRunId: 1,
        jobs: [{ status: 'RUNNING' }],
      } as never),
    ).toBe('running')
  })

  test('stale complete run', () => {
    expect(
      spaceFinderVariantStatus({
        ...base,
        currentRunId: 1,
        runs: [{ status: 'COMPLETE', stale: true }],
      } as never),
    ).toBe('stale')
  })

  test('complete and not calculated', () => {
    expect(spaceFinderVariantStatus({ ...base, currentRunId: 1 } as never)).toBe('complete')
    expect(spaceFinderVariantStatus(base as never)).toBe('none')
  })
})
