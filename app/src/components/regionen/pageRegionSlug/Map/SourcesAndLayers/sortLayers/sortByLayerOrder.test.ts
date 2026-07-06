import { describe, expect, test } from 'vitest'
import { sortByLayerOrder } from './sortByLayerOrder'

type Entry = { layerId: string; label?: string }
const entry = (layerId: string, label?: string): Entry => ({ layerId, label })
const getKey = (e: Entry) => e.layerId
const ids = (entries: Entry[]) => entries.map((e) => e.layerId)

describe('sortByLayerOrder', () => {
  test('empty order list keeps the original order (parity mode)', () => {
    const items = [entry('c'), entry('a'), entry('b')]
    const result = sortByLayerOrder({ items, getKey, orderedKeys: [] })
    expect(ids(result)).toEqual(['c', 'a', 'b'])
  })

  test('sorts items by the order list, bottom-first', () => {
    const items = [entry('c'), entry('a'), entry('b')]
    const result = sortByLayerOrder({ items, getKey, orderedKeys: ['a', 'b', 'c'] })
    expect(ids(result)).toEqual(['a', 'b', 'c'])
  })

  test('gaps in the order list are fine — a region renders only its subset', () => {
    // Order list knows layers of ALL regions; this "region" only has two of them.
    const items = [entry('z'), entry('a')]
    const orderedKeys = ['a', 'm', 'x', 'z'] // 'm' and 'x' do not exist in this region
    const result = sortByLayerOrder({ items, getKey, orderedKeys })
    expect(ids(result)).toEqual(['a', 'z'])
  })

  test('unknown keys keep their relative order and go after all known keys', () => {
    const items = [entry('new2'), entry('b'), entry('new1'), entry('a')]
    const result = sortByLayerOrder({ items, getKey, orderedKeys: ['a', 'b'] })
    expect(ids(result)).toEqual(['a', 'b', 'new2', 'new1'])
  })

  test('does not mutate the input array', () => {
    const items = [entry('b'), entry('a')]
    const result = sortByLayerOrder({ items, getKey, orderedKeys: ['a', 'b'] })
    expect(ids(items)).toEqual(['b', 'a'])
    expect(ids(result)).toEqual(['a', 'b'])
  })

  test('works with realistic atlas layer keys', () => {
    const items = [
      entry('source:bikelanes--subcat:bikelanes--style:default--layer:line_label'),
      entry('source:roads--subcat:roads--style:default--layer:line_base'),
      entry('source:bikelanes--subcat:bikelanes--style:default--layer:line_base'),
    ]
    const orderedKeys = [
      'source:roads--subcat:roads--style:default--layer:line_base',
      'source:bikelanes--subcat:bikelanes--style:default--layer:line_base',
      'source:bikelanes--subcat:bikelanes--style:default--layer:line_label',
    ]
    const result = sortByLayerOrder({ items, getKey, orderedKeys })
    expect(ids(result)).toEqual(orderedKeys)
  })
})
