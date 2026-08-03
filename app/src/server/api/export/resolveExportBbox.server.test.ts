import { describe, expect, test } from 'vitest'
import type { RegionGeoJsonBBox } from '@/server/regions/regionGeoJson'
import { resolveExportBbox } from './resolveExportBbox.server'

const regionBbox = [13.0, 52.3, 13.8, 52.6] satisfies RegionGeoJsonBBox

describe('resolveExportBbox', () => {
  test('none present → uses region bbox', () => {
    const result = resolveExportBbox(new URLSearchParams(), regionBbox)
    expect(result).toEqual({
      ok: true,
      source: 'region',
      bbox: { minlon: 13.0, minlat: 52.3, maxlon: 13.8, maxlat: 52.6 },
    })
  })

  test('all four present → uses query bbox', () => {
    const params = new URLSearchParams({
      minlon: '7.7',
      minlat: '49.3',
      maxlon: '10.5',
      maxlat: '51.6',
    })
    const result = resolveExportBbox(params, regionBbox)
    expect(result).toEqual({
      ok: true,
      source: 'query',
      bbox: { minlon: 7.7, minlat: 49.3, maxlon: 10.5, maxlat: 51.6 },
    })
  })

  test('partial params → error', () => {
    const params = new URLSearchParams({ minlon: '7.7', minlat: '49.3' })
    const result = resolveExportBbox(params, regionBbox)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/all of minlon/)
    }
  })

  test('empty string among params → error (not coerced to 0)', () => {
    const params = new URLSearchParams({
      minlon: '7.7',
      minlat: '',
      maxlon: '10.5',
      maxlat: '51.6',
    })
    const result = resolveExportBbox(params, regionBbox)
    expect(result.ok).toBe(false)
  })

  test('non-numeric query values → error', () => {
    const params = new URLSearchParams({
      minlon: 'abc',
      minlat: '49.3',
      maxlon: '10.5',
      maxlat: '51.6',
    })
    const result = resolveExportBbox(params, regionBbox)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/finite numbers/)
    }
  })

  test('none present + null region bbox → error', () => {
    const result = resolveExportBbox(new URLSearchParams(), null)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toMatch(/no bbox/)
    }
  })
})
