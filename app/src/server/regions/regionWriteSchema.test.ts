import { describe, expect, test } from 'vitest'
import {
  RegionWriteSchema,
  RegionFormRawSchema,
  RegionFormSchema,
  type RegionWriteInput,
} from './regionWriteSchema'

const validBase: RegionWriteInput = {
  slug: 'test-region',
  name: 'Test',
  fullName: 'Test Region',
  promoted: false,
  status: 'PUBLIC',
  product: 'radverkehr',
  notes: 'osmNotes',
  showSearch: false,
  mapLat: 52.5,
  mapLng: 13.4,
  mapZoom: 12,
  logoWhiteBackgroundRequired: false,
  headerLogoId: null,
  bbox: null,
  cacheWarming: null,
  categories: ['poi'],
  backgroundSources: [],
  exports: [],
  navigationLinks: [],
  contractId: null,
}

const fullBbox = { bbox: [13.0, 52.3, 13.8, 52.6] as const }

describe('RegionWriteSchema', () => {
  test('accepts a minimal valid config (no exports, no bbox)', () => {
    expect(RegionWriteSchema.safeParse(validBase).success).toBe(true)
  })

  describe('exports ⇔ bbox invariant', () => {
    test('exports + full bbox → valid', () => {
      const result = RegionWriteSchema.safeParse({
        ...validBase,
        exports: ['parkings'],
        ...fullBbox,
      })
      expect(result.success).toBe(true)
    })

    test('exports without bbox → invalid', () => {
      const result = RegionWriteSchema.safeParse({ ...validBase, exports: ['parkings'] })
      expect(result.success).toBe(false)
    })

    test('bbox without exports → invalid', () => {
      const result = RegionWriteSchema.safeParse({ ...validBase, ...fullBbox })
      expect(result.success).toBe(false)
    })

    test('invalid bbox tuple length + exports → invalid', () => {
      const result = RegionWriteSchema.safeParse({
        ...validBase,
        exports: ['parkings'],
        bbox: [13.0, 52.3, 13.8],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('field validation', () => {
    test('empty categories → invalid', () => {
      expect(RegionWriteSchema.safeParse({ ...validBase, categories: [] }).success).toBe(false)
    })

    test('invalid slug format → invalid', () => {
      expect(RegionWriteSchema.safeParse({ ...validBase, slug: 'Test Region' }).success).toBe(false)
    })

    test('unknown category id → invalid', () => {
      expect(
        RegionWriteSchema.safeParse({ ...validBase, categories: ['not-a-real-category'] }).success,
      ).toBe(false)
    })

    test('unknown export id → invalid', () => {
      const result = RegionWriteSchema.safeParse({
        ...validBase,
        exports: ['not-a-real-export'],
        ...fullBbox,
      })
      expect(result.success).toBe(false)
    })

    test('unknown background source id → invalid', () => {
      const result = RegionWriteSchema.safeParse({
        ...validBase,
        backgroundSources: ['not-a-real-background'],
      })
      expect(result.success).toBe(false)
    })
  })
})

const regionFormBase = {
  slug: 'test-region',
  name: 'Test',
  fullName: 'Test Region',
  promoted: 'false' as const,
  status: 'PUBLIC' as const,
  product: 'radverkehr' as const,
  notes: 'osmNotes' as const,
  showSearch: 'false' as const,
  mapLat: '52.5',
  mapLng: '13.4',
  mapZoom: '10',
  headerLogoId: '',
  logoWhiteBackgroundRequired: 'false' as const,
  downloadsEnabled: 'false' as const,
  bboxMinLng: '',
  bboxMinLat: '',
  bboxMaxLng: '',
  bboxMaxLat: '',
  cacheWarmingEnabled: 'false' as const,
  cacheWarmingMinZoom: '',
  cacheWarmingMaxZoom: '',
  cacheWarmingTables: '',
  categories: 'poi',
  backgroundSources: '',
  exports: '',
  navigationLinks: [],
  contractId: '',
}

describe('RegionFormRawSchema en decimal map fields', () => {
  test('accepts dot decimals like 51.07', () => {
    const result = RegionFormRawSchema.safeParse({
      ...regionFormBase,
      mapLat: '51.07',
      mapLng: '13.35',
      mapZoom: '11.8',
    })
    expect(result.success).toBe(true)
  })

  test('rejects comma decimals', () => {
    const result = RegionFormRawSchema.safeParse({
      ...regionFormBase,
      mapLat: '51,07',
    })
    expect(result.success).toBe(false)
  })
})

describe('RegionFormSchema', () => {
  test('parses EN decimal strings into numbers for the map', () => {
    const parsed = RegionFormSchema.parse({
      ...regionFormBase,
      mapLat: '51.07',
      mapLng: '13.35',
      mapZoom: '6',
    })
    expect(parsed.mapLat).toBe(51.07)
    expect(parsed.mapLng).toBe(13.35)
    expect(parsed.mapZoom).toBe(6)
  })

  test('partial bbox form fields + exports → invalid', () => {
    const result = RegionFormSchema.safeParse({
      ...regionFormBase,
      downloadsEnabled: 'true',
      exports: 'parkings',
      bboxMinLng: '13.0',
      bboxMinLat: '52.3',
      bboxMaxLng: '13.8',
      bboxMaxLat: '',
    })
    expect(result.success).toBe(false)
  })
})
