import { describe, expect, it } from 'vitest'
import { parseOsmRelationIds } from '@/server/regions/masks/parseOsmRelationIds.server'

describe('parseOsmRelationIds', () => {
  it('parses comma- and whitespace-separated ids', () => {
    expect(parseOsmRelationIds('62422, 62423')).toEqual([62422, 62423])
    expect(parseOsmRelationIds('62422 62423')).toEqual([62422, 62423])
  })

  it('dedupes ids', () => {
    expect(parseOsmRelationIds('62422, 62422')).toEqual([62422])
  })

  it('rejects invalid tokens', () => {
    expect(() => parseOsmRelationIds('abc')).toThrow('Ungültige OSM Relation ID')
    expect(() => parseOsmRelationIds('62422, abc')).toThrow('Ungültige OSM Relation ID')
    expect(() => parseOsmRelationIds('0')).toThrow('Ungültige OSM Relation ID')
  })
})
