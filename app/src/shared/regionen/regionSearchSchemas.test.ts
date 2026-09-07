import { describe, expect, test } from 'vitest'
import {
  compactQaParam,
  qaStatusForMapFilter,
  resolvedQaStatusSelectValue,
} from '@/components/regionen/pageRegionSlug/modes/qa/qaConfigStyles'
import {
  defaultMapSearchValue,
  getQaParamFromSearch,
  parseRegionSearch,
  regionSearchSchema,
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

  test('stringifies string arrays as comma lists', () => {
    const search = { data: ['foo', 'bar'] }
    const stringified = routerSearch.stringify(search)
    expect(stringified).toContain('data=foo,bar')
    expect(stringified).not.toContain('[')

    const parsed = routerSearch.parse(stringified)
    expect(parsed).toEqual({ data: 'foo,bar' })
  })

  test('omits empty arrays from stringify', () => {
    expect(routerSearch.stringify({ data: [] })).toBe('')
  })

  test('omits bg default, bg3d false, and empty data', () => {
    const stringified = routerSearch.stringify({
      map: '11.8/52.507/13.367',
      bg: 'default',
      bg3d: false,
      data: [],
    })
    expect(stringified).toContain('map=11.8/52.507/13.367')
    expect(stringified).not.toContain('bg=')
    expect(stringified).not.toContain('bg3d=')
    expect(stringified).not.toContain('data=')
  })

  test('stringifies notesMode as pretty JSON, not jsurl', () => {
    const search = { notesMode: { completed: false, extent: 'view' } }
    const stringified = decodeURIComponent(routerSearch.stringify(search))
    expect(stringified).toContain('notesMode={"completed":false,"extent":"view"}')
    expect(stringified).not.toContain('notesMode=(')
  })
})

describe('regionSearchSchema', () => {
  test('applies map default when missing', () => {
    const parsed = regionSearchSchema.parse({})
    expect(parsed.map).toBe(defaultMapSearchValue)
  })

  test('keeps URL migration version v', () => {
    expect(regionSearchSchema.parse({ v: '3' }).v).toBe('3')
  })

  test('validateSearch then stringify always includes map=0/0/0', () => {
    expect(defaultMapSearchValue).toBe('0/0/0')
    // Link-like stringify without validateSearch can omit map.
    expect(routerSearch.stringify({ bg3d: false })).toBe('')
    // navigate() runs validateSearch before stringify, so off-map hrefs get the sentinel.
    expect(routerSearch.stringify(regionSearchSchema.parse({}))).toContain('map=0/0/0')
    expect(routerSearch.stringify(regionSearchSchema.parse({ bg3d: false }))).toContain('map=0/0/0')
  })

  test('parses qa JSON object', () => {
    const parsed = parseRegionSearch({
      qa: { key: 'euvm-parkraum-2026', status: 'pending-problematic' },
    })
    expect(getQaParamFromSearch(parsed)).toEqual({
      key: 'euvm-parkraum-2026',
      status: 'pending-problematic',
    })
  })

  test('compacts qa param: Alle Status stores all, missing key drops qa', () => {
    expect(compactQaParam({ key: 'cfg' })).toEqual({ key: 'cfg' })
    expect(compactQaParam({ key: 'cfg', status: 'all' })).toEqual({
      key: 'cfg',
      status: 'all',
    })
    expect(compactQaParam({ key: 'cfg', status: 'pending-needs-review' })).toEqual({
      key: 'cfg',
      status: 'pending-needs-review',
    })
    expect(compactQaParam({ key: '' })).toBeUndefined()
  })

  test('missing qa status is the default filter, not Alle Status', () => {
    expect(resolvedQaStatusSelectValue(undefined)).toBe('pending-needs-review')
    expect(qaStatusForMapFilter(undefined)).toBe('pending-needs-review')
    expect(qaStatusForMapFilter('all')).toBeUndefined()
  })

  test('parses qa Alle Status', () => {
    const parsed = parseRegionSearch({ qa: { key: 'cfg', status: 'all' } })
    expect(getQaParamFromSearch(parsed)).toEqual({ key: 'cfg', status: 'all' })
  })

  test('parses qa extent all and omits view from compact', () => {
    const parsed = parseRegionSearch({
      qa: {
        key: 'cfg',
        status: 'pending-needs-review',
        users: ['u1'],
        search: 'foo',
        extent: 'all',
      },
    })
    expect(getQaParamFromSearch(parsed)).toEqual({
      key: 'cfg',
      status: 'pending-needs-review',
      users: ['u1'],
      search: 'foo',
      extent: 'all',
    })
    expect(compactQaParam({ key: 'cfg', extent: 'view' })).toEqual({ key: 'cfg' })
    expect(
      compactQaParam({
        key: 'cfg',
        status: 'ok-construction',
        users: ['u1'],
        search: 'bar',
        extent: 'all',
      }),
    ).toEqual({
      key: 'cfg',
      status: 'ok-construction',
      users: ['u1'],
      search: 'bar',
      extent: 'all',
    })
  })

  // A retired status key in a bookmark used to drop the whole qa param, losing the config key.
  test('resets stale qa filter fields but keeps the config key', () => {
    expect(parseRegionSearch({ qa: { key: 'cfg', status: 'actionable' } }).qa).toEqual({
      key: 'cfg',
    })
    expect(parseRegionSearch({ qa: { key: 'cfg', extent: 'orphaned' } }).qa).toEqual({ key: 'cfg' })
    expect(parseRegionSearch({ qa: { key: 'cfg', users: 'u1' } }).qa).toEqual({ key: 'cfg' })
    expect(
      parseRegionSearch({ qa: { key: 'cfg', status: 'actionable', search: 'foo' } }).qa,
    ).toEqual({ key: 'cfg', search: 'foo' })
  })

  test('drops the qa param without a config key', () => {
    expect(parseRegionSearch({ qa: { status: 'pending-needs-review' } }).qa).toBeUndefined()
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

  test('parses flat notesMode JSON', () => {
    const parsed = parseRegionSearch({
      notesMode: { search: 'kreuzung', completed: false, extent: 'view' },
    })
    expect(parsed.notesMode).toEqual({
      search: 'kreuzung',
      completed: false,
      extent: 'view',
    })
  })

  test('parses flat rl JSON with key', () => {
    const parsed = parseRegionSearch({
      rl: { key: 7, search: 'foo', status: 'OPEN' },
    })
    expect(parsed.rl).toEqual({ key: 7, search: 'foo', status: 'OPEN' })
  })
})
