import { describe, expect, test } from 'vitest'
import { getAllAtlasLayerKeys } from './getAllAtlasLayerKeys'

describe('getAllAtlasLayerKeys', () => {
  test('enumerates a substantial, unique set of layer keys in the expected format', () => {
    const keys = getAllAtlasLayerKeys()
    expect(keys.length).toBeGreaterThan(100)
    expect(new Set(keys).size).toBe(keys.length)
    for (const key of keys) {
      expect(key, `malformed layer key: ${key}`).toMatch(
        /^source:.+--subcat:.+--style:.+--layer:.+$/,
      )
    }
  })
})
