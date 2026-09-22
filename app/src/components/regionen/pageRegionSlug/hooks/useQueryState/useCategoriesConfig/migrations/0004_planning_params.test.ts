import { describe, expect, test } from 'vitest'
import migration from './0004_planning_params'

const run = (search: string) => {
  const url = new URL(`https://example.com/regionen/berlin${search}`)
  return new URL(migration(url.toString(), { categories: [] })).searchParams
}

describe('0004_planning_params migration', () => {
  test('folds planningVariant into ff.key and drops the legacy keys', () => {
    const params = run('?planning=true&planningVariant=3')
    expect(JSON.parse(params.get('ff')!)).toEqual({ key: 3 })
    expect(params.has('planning')).toBe(false)
    expect(params.has('planningVariant')).toBe(false)
  })

  test('planningScenario is used when planningVariant is absent', () => {
    const params = run('?planning=true&planningScenario=7')
    expect(JSON.parse(params.get('ff')!)).toEqual({ key: 7 })
    expect(params.has('planningScenario')).toBe(false)
  })

  test('planningVariant wins over planningScenario when both are present', () => {
    const params = run('?planningVariant=3&planningScenario=7')
    expect(JSON.parse(params.get('ff')!)).toEqual({ key: 3 })
  })

  test('drops planningArea and planningRun (derived from the variant, not stored)', () => {
    const params = run('?planningVariant=3&planningArea=1&planningRun=9')
    expect(JSON.parse(params.get('ff')!)).toEqual({ key: 3 })
    expect(params.has('planningArea')).toBe(false)
    expect(params.has('planningRun')).toBe(false)
  })

  test('non-default planningScore is kept, kombination (default) is omitted', () => {
    const params = run('?planningVariant=3&planningScore=bedarf')
    expect(JSON.parse(params.get('ff')!)).toEqual({ key: 3, score: 'bedarf' })

    const paramsDefault = run('?planningVariant=3&planningScore=kombination')
    expect(JSON.parse(paramsDefault.get('ff')!)).toEqual({ key: 3 })
  })

  test('planningHexagons=false maps to opacity 0', () => {
    const params = run('?planningVariant=3&planningHexagons=false')
    expect(JSON.parse(params.get('ff')!)).toEqual({ key: 3, opacity: 0 })
  })

  test('planningHexagonsOpacity is kept when not the 100% default', () => {
    const params = run('?planningVariant=3&planningHexagonsOpacity=40')
    expect(JSON.parse(params.get('ff')!)).toEqual({ key: 3, opacity: 40 })
  })

  test('planningHexagonsOpacity=100 (default) is omitted', () => {
    const params = run('?planningVariant=3&planningHexagonsOpacity=100')
    expect(JSON.parse(params.get('ff')!)).toEqual({ key: 3 })
  })

  test('planningMinArea is only kept when planningAreaFilter is on', () => {
    const params = run('?planningVariant=3&planningMinArea=25&planningAreaFilter=true')
    expect(JSON.parse(params.get('ff')!)).toEqual({ key: 3, minArea: 25 })

    const paramsFilterOff = run('?planningVariant=3&planningMinArea=25&planningAreaFilter=false')
    expect(JSON.parse(paramsFilterOff.get('ff')!)).toEqual({ key: 3 })
  })

  test('no legacy planning params leaves the URL untouched (no ff written)', () => {
    const params = run('?map=13/52.5/13.4')
    expect(params.has('ff')).toBe(false)
    expect(params.get('map')).toBe('13/52.5/13.4')
  })

  test('?planning=true alone (no variant) writes no ff (nothing to select)', () => {
    const params = run('?planning=true')
    expect(params.has('ff')).toBe(false)
    expect(params.has('planning')).toBe(false)
  })

  test('does not change the pathname', () => {
    const url = new URL(
      migration('https://example.com/regionen/berlin?planningVariant=3', { categories: [] }),
    )
    expect(url.pathname).toBe('/regionen/berlin')
  })
})
