import { describe, expect, test } from 'vitest'
import { spaceFinderCollectionOptions } from './spaceFinderCollectionOptions'

const area = (overrides: Partial<Parameters<typeof spaceFinderCollectionOptions>[0][number]>) =>
  ({
    id: 1,
    title: 'Gebiet',
    createdAt: new Date('2026-01-01'),
    variants: [],
    ...overrides,
  }) as Parameters<typeof spaceFinderCollectionOptions>[0][number]

describe('spaceFinderCollectionOptions', () => {
  test('orders areas oldest first regardless of input order, keeps variant order', () => {
    const areas = [
      area({
        id: 2,
        title: 'Neu',
        createdAt: new Date('2026-02-01'),
        variants: [{ id: 20, title: 'Standard' } as never],
      }),
      area({
        id: 1,
        title: 'Alt',
        createdAt: new Date('2026-01-01'),
        variants: [{ id: 10, title: 'Standard' } as never, { id: 11, title: 'B' } as never],
      }),
    ]

    const options = spaceFinderCollectionOptions(areas)

    expect(options.map((o) => o.variantId)).toEqual([10, 11, 20])
    expect(options[0]?.label).toBe('Gebiet »Alt«: Variante »Standard«')
  })

  test('returns no options for areas without variants', () => {
    expect(spaceFinderCollectionOptions([area({ variants: [] })])).toEqual([])
  })
})
