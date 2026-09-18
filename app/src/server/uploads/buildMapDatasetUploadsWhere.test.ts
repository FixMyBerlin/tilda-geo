import { describe, expect, test } from 'vitest'
import {
  buildMapDatasetUploadsFilterWhere,
  buildMapDatasetUploadsWhere,
} from './buildMapDatasetUploadsWhere.server'

describe('buildMapDatasetUploadsWhere', () => {
  test('defaults to non-system datasets without other filters', () => {
    expect(buildMapDatasetUploadsWhere({})).toEqual({ systemLayer: false })
    expect(buildMapDatasetUploadsWhere({ kind: 'system', q: '  ' })).toEqual({ systemLayer: true })
  })

  test('combines region and search terms', () => {
    const where = buildMapDatasetUploadsWhere({ regionSlug: ' bibi ', q: 'radweg  berlin' })
    expect(where.systemLayer).toBe(false)
    expect(where.regions).toEqual({ some: { slug: 'bibi' } })
    expect(where.AND).toHaveLength(2)
    const [first] = where.AND as Array<{ OR: Array<Record<string, unknown>> }>
    expect(first?.OR).toContainEqual({ slug: { contains: 'radweg', mode: 'insensitive' } })
    expect(first?.OR).toContainEqual({
      layerConfigs: { some: { name: { contains: 'radweg', mode: 'insensitive' } } },
    })
  })
})

describe('buildMapDatasetUploadsFilterWhere', () => {
  test('omits the kind clause', () => {
    expect(buildMapDatasetUploadsFilterWhere({ regionSlug: 'bibi' })).toEqual({
      regions: { some: { slug: 'bibi' } },
    })
  })
})
