import { describe, expect, test } from 'vitest'
import { parseSlugAndFormat } from './parseSlugAndFormat'

describe('parseSlugAndFormat()', () => {
  test('marks fallback usage for extension-less legacy urls', () => {
    const result = parseSlugAndFormat({
      slug: 'nudafa-combined',
      allowedFormats: ['pmtiles', 'geojson', 'csv'],
      fallbackFormat: 'pmtiles',
    })

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.result).toMatchObject({
      baseName: 'nudafa-combined',
      extension: 'pmtiles',
      usedFallback: true,
    })
  })

  test('does not mark fallback when extension is explicit', () => {
    const result = parseSlugAndFormat({
      slug: 'nudafa-combined.geojson',
      allowedFormats: ['pmtiles', 'geojson', 'csv'],
      fallbackFormat: 'pmtiles',
    })

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.result).toMatchObject({
      baseName: 'nudafa-combined',
      extension: 'geojson',
      usedFallback: false,
    })
  })
})
