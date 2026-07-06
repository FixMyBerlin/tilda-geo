import { describe, expect, test } from 'vitest'
import { atlasLayerOrder } from './atlasLayerOrder.const'
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

  test('every key in the static default order list exists in code (no stale entries)', () => {
    const keys = new Set(getAllAtlasLayerKeys())
    const stale = atlasLayerOrder.filter((key) => !keys.has(key))
    expect(stale, `atlasLayerOrder contains keys that no longer exist in code`).toEqual([])
  })
})
