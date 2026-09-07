import { describe, expect, test } from 'vitest'
import { getAllAtlasLayerEntries, getAllAtlasLayerKeys } from './getAllAtlasLayerKeys'

describe('getAllAtlasLayerKeys', () => {
  test('enumerates unique keys in createLayerKeyAtlasGeo format, including radinfra bikelanes', () => {
    const keys = getAllAtlasLayerKeys()
    expect(keys.length).toBeGreaterThan(100)
    expect(new Set(keys).size).toBe(keys.length)
    for (const key of keys) {
      expect(key, `malformed layer key: ${key}`).toMatch(
        /^source:.+--subcat:.+--style:.+--layer:.+$/,
      )
    }
    expect(
      keys.some((key) =>
        key.startsWith('source:atlas_bikelanes--subcat:bikelanes--style:default--layer:'),
      ),
    ).toBe(true)
  })

  test('entries have a string defaultBeforeId and keys match getAllAtlasLayerKeys', () => {
    const entries = getAllAtlasLayerEntries()
    const keys = getAllAtlasLayerKeys()
    expect(entries.length).toBeGreaterThan(100)
    for (const entry of entries) {
      // Every atlas layer type has a type default in beforeId.ts, so this is always resolved in code.
      expect(entry.defaultBeforeId, `no default anchor for ${entry.layerKey}`).toBeTruthy()
    }
    expect(keys).toEqual(entries.map((entry) => entry.layerKey))
  })
})
