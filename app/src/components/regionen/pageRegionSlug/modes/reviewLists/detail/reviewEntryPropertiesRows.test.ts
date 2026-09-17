import { describe, expect, test } from 'vitest'
import {
  buildInitialRows,
  collectUnionKeys,
  coercePropertyValue,
  ensureTrailingEmpty,
  serializePropertyRows,
  validatePropertyRows,
} from './reviewEntryPropertiesRows'

const keysOf = (rows: { key: string; value: string }[]) => rows.map((row) => row.key)
const valuesOf = (rows: { key: string; value: string }[]) => rows.map((row) => row.value)

describe('buildInitialRows', () => {
  test('lists keys with a value on this entry first, then empty union keys, then a blank row', () => {
    const rows = buildInitialRows({ name: 'Elbe', count: 3 }, ['name', 'city', 'source'])

    expect(keysOf(rows)).toEqual(['name', 'count', 'city', 'source', ''])
    expect(valuesOf(rows)).toEqual(['Elbe', '3', '', '', ''])
    expect(new Set(rows.map((row) => row._key)).size).toBe(rows.length)
  })

  test('skips empty values on this entry and still appends them from the union as empty inputs', () => {
    const rows = buildInitialRows({ name: 'Elbe', city: '  ', extra: null }, ['city', 'note'])

    expect(keysOf(rows)).toEqual(['name', 'city', 'note', ''])
    expect(valuesOf(rows)).toEqual(['Elbe', '', '', ''])
  })

  test('always ends with a trailing blank add-row when the entry and union are empty', () => {
    const rows = buildInitialRows(null, [])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ key: '', value: '' })
  })
})

describe('collectUnionKeys', () => {
  test('walks list features in order and skips reserved tilda_ keys', () => {
    expect(
      collectUnionKeys([
        { properties: { data: { name: 'A', tilda_status: 'OPEN' } } },
        { properties: { data: { name: 'B', city: 'Hamburg' } } },
        { properties: { data: 'not-an-object' } },
      ]),
    ).toEqual(['name', 'city'])
  })
})

describe('ensureTrailingEmpty', () => {
  test('appends a blank row when the last row is no longer blank', () => {
    const existing = { _key: 'keep', key: 'name', value: 'Elbe' }
    const next = ensureTrailingEmpty([existing])
    expect(next).toHaveLength(2)
    expect(next[0]).toBe(existing)
    expect(next[1]).toMatchObject({ key: '', value: '' })
    expect(next[1]?._key).not.toBe('keep')
  })

  test('does not add a second blank row when one is already trailing', () => {
    const rows = [
      { _key: 'a', key: 'name', value: 'Elbe' },
      { _key: 'b', key: '', value: '' },
    ]
    expect(ensureTrailingEmpty(rows)).toEqual(rows)
  })
})

describe('validatePropertyRows', () => {
  test('rejects duplicate keys after trim', () => {
    const errors = validatePropertyRows([
      { _key: '1', key: 'name', value: 'A' },
      { _key: '2', key: ' name ', value: 'B' },
      { _key: '3', key: '', value: '' },
    ])
    expect(errors.get('1')).toBe('Schlüssel ist bereits vergeben.')
    expect(errors.get('2')).toBe('Schlüssel ist bereits vergeben.')
    expect(errors.has('3')).toBe(false)
  })

  test('rejects keys that start with tilda_', () => {
    const errors = validatePropertyRows([
      { _key: '1', key: 'tilda_importId', value: 'abc' },
      { _key: '2', key: 'name', value: 'Elbe' },
    ])
    expect(errors.get('1')).toBe('Schlüssel mit dem Präfix „tilda_“ sind reserviert.')
    expect(errors.has('2')).toBe(false)
  })
})

describe('serializePropertyRows', () => {
  test('coerces numbers, objects and arrays to strings', () => {
    expect(
      serializePropertyRows([
        { key: 'count', value: 3 },
        { key: 'meta', value: { ok: true } },
        { key: 'tags', value: ['a', 'b'] },
      ]),
    ).toEqual({
      count: '3',
      meta: '{"ok":true}',
      tags: '["a","b"]',
    })
  })

  test('trims keys and drops empty values so clearing everything yields {}', () => {
    expect(
      serializePropertyRows([
        { key: ' name ', value: '  Elbe  ' },
        { key: 'gone', value: '   ' },
        { key: 'also', value: null },
        { key: 'missing', value: undefined },
        { key: '', value: 'orphan' },
      ]),
    ).toEqual({ name: 'Elbe' })

    expect(
      serializePropertyRows([
        { key: 'gone', value: '' },
        { key: '', value: '' },
      ]),
    ).toEqual({})
  })
})

describe('coercePropertyValue', () => {
  test('stringifies objects and arrays, otherwise uses String', () => {
    expect(coercePropertyValue(false)).toBe('false')
    expect(coercePropertyValue(0)).toBe('0')
    expect(coercePropertyValue({ a: 1 })).toBe('{"a":1}')
  })
})
