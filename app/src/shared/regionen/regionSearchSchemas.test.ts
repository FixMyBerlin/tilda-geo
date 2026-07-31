import { describe, expect, test } from 'vitest'
import {
  defaultMapSearchValue,
  parseQaParam,
  parseRegionSearch,
  regionSearchSchema,
  serializeQaParam,
} from '@/shared/regionen/regionSearchSchemas'
import { routerSearch } from '@/shared/routing/routerSearch'

describe('routerSearch', () => {
  test('keeps map slashes readable in stringify output', () => {
    const search = { map: '11.8/52.507/13.367' }
    const stringified = routerSearch.stringify(search)
    expect(stringified).toContain('map=11.8/52.507/13.367')
    expect(stringified).not.toContain('%2F')

    const parsed = routerSearch.parse(stringified)
    expect(parsed).toEqual(search)
  })

  test('keeps JSON arrays readable', () => {
    const search = { data: ['foo', 'bar'] }
    const stringified = routerSearch.stringify(search)
    expect(stringified).toContain('data=["foo","bar"]')

    const parsed = routerSearch.parse(stringified)
    expect(parsed).toEqual(search)
  })
})

describe('regionSearchSchema', () => {
  test('applies map default when missing', () => {
    const parsed = regionSearchSchema.parse({})
    expect(parsed.map).toBe(defaultMapSearchValue)
  })

  test('parses legacy qa style alias', () => {
    const parsed = parseRegionSearch({ qa: 'my-config--user-pending' })
    expect(parseQaParam(parsed.qa)).toEqual({
      configSlug: 'my-config',
      style: 'user-pending-problematic',
    })
  })

  test('round-trips qa param serialize', () => {
    const wire = serializeQaParam({ configSlug: 'cfg', style: 'actionable' })
    expect(wire).toBe('cfg--actionable')
    expect(parseQaParam(wire)).toEqual({ configSlug: 'cfg', style: 'actionable' })
  })

  test('parses comma-separated data param', () => {
    const parsed = regionSearchSchema.parse({ data: 'a,b' })
    expect(parsed.data).toEqual(['a', 'b'])
  })

  test('omits empty data param from URL stringify', () => {
    const parsed = regionSearchSchema.parse({ data: ['dataset-a'] })
    expect(routerSearch.stringify(parsed)).toContain('data=')

    const cleared = { ...parsed, data: undefined }
    expect(routerSearch.stringify(cleared)).not.toContain('data=')
  })
})
