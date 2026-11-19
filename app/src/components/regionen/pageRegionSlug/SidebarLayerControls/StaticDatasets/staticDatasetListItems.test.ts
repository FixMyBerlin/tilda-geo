import { describe, expect, test } from 'vitest'
import type { RegionDataset } from '@/server/uploads/queries/getUploadsForRegion.server'
import {
  activeStyleKey,
  createStaticDatasetListItems,
  listItemDefaultKey,
  selectStyle,
} from './staticDatasetListItems'

const dataset = (
  id: string,
  name: string,
  subId?: string,
  styleGroup?: { key: string; name: string; position: number },
) => ({ id, name, subId, styleGroup: styleGroup ?? null }) as RegionDataset

describe('createStaticDatasetListItems', () => {
  test('bundles the configs of a style group in meta.ts order and sorts entries by name', () => {
    const group = { key: 'b-upload:datensatz-b', name: 'Datensatz B' }
    const items = createStaticDatasetListItems([
      dataset('b-upload', 'Oberflächenmaterial', 'ofm', { ...group, position: 1 }),
      dataset('z-upload', 'Zebra'),
      dataset('b-upload', 'Standard', undefined, { ...group, position: 0 }),
      dataset('a-upload', 'Anfang'),
    ])

    expect(items.map((item) => item.name)).toEqual(['Anfang', 'Datensatz B', 'Zebra'])
    const styleGroup = items[1]
    expect(styleGroup?.type).toBe('styleGroup')
    if (styleGroup?.type !== 'styleGroup') return
    expect(styleGroup.styles.map(({ key }) => key)).toEqual(['b-upload', 'b-upload--ofm'])
    expect(listItemDefaultKey(styleGroup)).toBe('b-upload')
  })

  test('keeps configs without style group as their own entries', () => {
    const items = createStaticDatasetListItems([
      dataset('parken', 'Öffentlich', 'pub'),
      dataset('parken', 'Privat', 'priv'),
    ])
    expect(items.map((item) => [item.type, item.key])).toEqual([
      ['dataset', 'parken--pub'],
      ['dataset', 'parken--priv'],
    ])
  })
})

describe('selectStyle', () => {
  const styleKeys = ['c', 'c--vgl']

  test('replaces the active style in place', () => {
    expect(selectStyle(['x', 'c', 'y'], styleKeys, 'c--vgl')).toEqual(['x', 'c--vgl', 'y'])
  })

  test('cleans up URLs that hold several styles of one group', () => {
    expect(selectStyle(['c--vgl', 'x', 'c'], styleKeys, 'c')).toEqual(['c', 'x'])
  })

  test('appends the style when the group is off', () => {
    expect(selectStyle(['x'], styleKeys, 'c--vgl')).toEqual(['x', 'c--vgl'])
  })
})

test('activeStyleKey returns the first style of the group in the data param', () => {
  expect(activeStyleKey(['x', 'c--vgl', 'c'], ['c', 'c--vgl'])).toBe('c--vgl')
  expect(activeStyleKey(['x'], ['c', 'c--vgl'])).toBeUndefined()
})
