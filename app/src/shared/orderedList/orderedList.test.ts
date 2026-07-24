import { describe, expect, test } from 'vitest'
import { withSortOrder } from './assignSortOrder'
import { withClientListKeys } from './clientListKey'
import { joinCommaList, parseCommaList } from './commaList'
import { removeIdFromList, reorderIds, toggleIdInList } from './orderedIds'

describe('commaList', () => {
  test('parseCommaList splits on commas and newlines', () => {
    expect(parseCommaList('poi, roads\nbikelanes')).toEqual(['poi', 'roads', 'bikelanes'])
  })

  test('joinCommaList joins with comma space', () => {
    expect(joinCommaList(['poi', 'roads'])).toBe('poi, roads')
  })
})

describe('orderedIds', () => {
  test('toggleIdInList adds at end and removes existing ids', () => {
    expect(toggleIdInList(['poi'], 'roads')).toEqual(['poi', 'roads'])
    expect(toggleIdInList(['poi', 'roads'], 'poi')).toEqual(['roads'])
  })

  test('removeIdFromList removes one id', () => {
    expect(removeIdFromList(['poi', 'roads'], 'poi')).toEqual(['roads'])
  })

  test('reorderIds accepts valid permutations only', () => {
    const ids = ['poi', 'roads', 'bikelanes']
    expect(reorderIds(ids, ['roads', 'poi', 'bikelanes'])).toEqual(['roads', 'poi', 'bikelanes'])
    expect(reorderIds(ids, ['poi', 'roads'])).toEqual(ids)
    expect(reorderIds(ids, ['poi', 'roads', 'unknown'])).toEqual(ids)
  })
})

describe('withSortOrder', () => {
  test('reindexes sortOrder from zero', () => {
    expect(
      withSortOrder([
        { name: 'B', sortOrder: 9 },
        { name: 'A', sortOrder: 2 },
      ]),
    ).toEqual([
      { name: 'B', sortOrder: 0 },
      { name: 'A', sortOrder: 1 },
    ])
  })
})

describe('withClientListKeys', () => {
  test('preserves existing keys and assigns missing ones', () => {
    const [kept, added] = withClientListKeys([{ name: 'A', _key: 'stable' }, { name: 'B' }])
    expect(kept).toEqual({ name: 'A', _key: 'stable' })
    expect(added).toBeDefined()
    if (!added) throw new Error('expected added item')
    expect(added.name).toBe('B')
    expect(added._key).toEqual(expect.any(String))
    expect(added._key.length).toBeGreaterThan(0)
  })
})
