import { describe, expect, test } from 'vitest'
import {
  sourceIdToWarmingTablesKey,
  sourceIdsToWarmingTables,
  warmableSources,
  warmableTablesKeySet,
  warmingTablesKeyToSourceId,
  warmingTablesToSourceIds,
} from './cacheWarmingSources'
import { parseRegionCacheWarming, cacheWarmingToWriteInput } from './regionGeoJson'
import {
  RegionFormRawSchema,
  RegionFormSchema,
  RegionWriteSchema,
  regionConfigToFormValues,
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
  maskOsmRelationIds: [],
  maskBufferKm: 10,
  welcome: null,
}

const fullBbox = { bbox: [13.0, 52.3, 13.8, 52.6] as const }

describe('RegionWriteSchema', () => {
  test('accepts a minimal valid config (no exports, no bbox)', () => {
    expect(RegionWriteSchema.safeParse(validBase).success).toBe(true)
  })

  test('rejects unknown keys (strict)', () => {
    const result = RegionWriteSchema.safeParse({ ...validBase, notAField: true })
    expect(result.success).toBe(false)
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

  describe('cacheWarming', () => {
    test('accepts joined source tile paths (bb-style)', () => {
      const result = RegionWriteSchema.safeParse({
        ...validBase,
        cacheWarming: {
          minZoom: 8,
          maxZoom: 10,
          tables: ['bikelanes', 'roads', 'boundaries,boundaryLabels', 'barrierAreas,barrierLines'],
        },
      })
      expect(result.success).toBe(true)
    })

    test('rejects unknown table path', () => {
      const result = RegionWriteSchema.safeParse({
        ...validBase,
        cacheWarming: {
          minZoom: 8,
          maxZoom: 10,
          tables: ['not-a-real-table'],
        },
      })
      expect(result.success).toBe(false)
    })

    test('rejects empty tables', () => {
      const result = RegionWriteSchema.safeParse({
        ...validBase,
        cacheWarming: { minZoom: 8, maxZoom: 10, tables: [] },
      })
      expect(result.success).toBe(false)
    })

    test('rejects out-of-range zoom', () => {
      expect(
        RegionWriteSchema.safeParse({
          ...validBase,
          cacheWarming: { minZoom: 2, maxZoom: 10, tables: ['bikelanes'] },
        }).success,
      ).toBe(false)
      expect(
        RegionWriteSchema.safeParse({
          ...validBase,
          cacheWarming: { minZoom: 8, maxZoom: 20, tables: ['bikelanes'] },
        }).success,
      ).toBe(false)
    })

    test('rejects minZoom > maxZoom', () => {
      const result = RegionWriteSchema.safeParse({
        ...validBase,
        cacheWarming: { minZoom: 12, maxZoom: 8, tables: ['bikelanes'] },
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
  cacheWarmingSources: '',
  categories: 'poi',
  backgroundSources: '',
  exports: '',
  navigationLinks: [],
  contractId: '',
  maskEnabled: 'false' as const,
  maskOsmRelationIds: '',
  maskBufferKm: '10',
  welcomeEnabled: 'false' as const,
  welcomeTitle: '',
  welcomeSubtitle: '',
  welcomeBodyMarkdown: '',
  welcomeImageUploadId: '',
  welcomeImageAltText: '',
  welcomeSections: [],
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

describe('RegionFormRawSchema navigationLinks', () => {
  test('ignores empty trailing rows', () => {
    const result = RegionFormRawSchema.safeParse({
      ...regionFormBase,
      navigationLinks: [{ name: '', linkType: 'external', path: '', sortOrder: 0 }],
    })
    expect(result.success).toBe(true)
  })

  test('rejects internal path without leading slash', () => {
    const result = RegionFormRawSchema.safeParse({
      ...regionFormBase,
      navigationLinks: [
        { name: 'Impressum', linkType: 'internal', path: 'impressum', sortOrder: 0 },
      ],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('„/“'))).toBe(true)
    }
  })

  test('rejects external URL without https', () => {
    const result = RegionFormRawSchema.safeParse({
      ...regionFormBase,
      navigationLinks: [
        { name: 'Website', linkType: 'external', path: 'http://example.com', sortOrder: 0 },
      ],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('https://'))).toBe(true)
    }
  })

  test('accepts valid internal and external links', () => {
    const result = RegionFormRawSchema.safeParse({
      ...regionFormBase,
      navigationLinks: [
        { name: 'Impressum', linkType: 'internal', path: '/regionen/test/impressum', sortOrder: 0 },
        { name: 'Website', linkType: 'external', path: 'https://example.com', sortOrder: 1 },
      ],
    })
    expect(result.success).toBe(true)
  })
})

describe('RegionFormRawSchema cacheWarming', () => {
  test('disabled + empty → valid', () => {
    expect(RegionFormRawSchema.safeParse(regionFormBase).success).toBe(true)
  })

  test('enabled + empty fields → invalid with field paths', () => {
    const result = RegionFormRawSchema.safeParse({
      ...regionFormBase,
      cacheWarmingEnabled: 'true',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('cacheWarmingMinZoom')
      expect(paths).toContain('cacheWarmingMaxZoom')
      expect(paths).toContain('cacheWarmingSources')
    }
  })

  test('enabled + decimal zoom → invalid', () => {
    const result = RegionFormRawSchema.safeParse({
      ...regionFormBase,
      cacheWarmingEnabled: 'true',
      cacheWarmingMinZoom: '9.5',
      cacheWarmingMaxZoom: '13',
      cacheWarmingSources: 'atlas_bikelanes',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join('.') === 'cacheWarmingMinZoom')).toBe(true)
    }
  })

  test('enabled + out-of-range zoom → invalid', () => {
    const result = RegionFormRawSchema.safeParse({
      ...regionFormBase,
      cacheWarmingEnabled: 'true',
      cacheWarmingMinZoom: '2',
      cacheWarmingMaxZoom: '13',
      cacheWarmingSources: 'atlas_bikelanes',
    })
    expect(result.success).toBe(false)
  })

  test('enabled + min > max → invalid', () => {
    const result = RegionFormRawSchema.safeParse({
      ...regionFormBase,
      cacheWarmingEnabled: 'true',
      cacheWarmingMinZoom: '12',
      cacheWarmingMaxZoom: '8',
      cacheWarmingSources: 'atlas_bikelanes',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join('.') === 'cacheWarmingMaxZoom')).toBe(true)
    }
  })

  test('enabled + unknown source id → invalid', () => {
    const result = RegionFormRawSchema.safeParse({
      ...regionFormBase,
      cacheWarmingEnabled: 'true',
      cacheWarmingMinZoom: '9',
      cacheWarmingMaxZoom: '13',
      cacheWarmingSources: 'not-a-source',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message.includes('Ungültige Cache-Warming-Quelle')),
      ).toBe(true)
    }
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

  test('disabled + empty → cacheWarming null', () => {
    const parsed = RegionFormSchema.parse(regionFormBase)
    expect(parsed.cacheWarming).toBeNull()
  })

  test('enabled + sources maps to joined tables paths', () => {
    const parsed = RegionFormSchema.parse({
      ...regionFormBase,
      cacheWarmingEnabled: 'true',
      cacheWarmingMinZoom: '9',
      cacheWarmingMaxZoom: '13',
      cacheWarmingSources: 'atlas_bikelanes, atlas_boundaries',
    })
    expect(parsed.cacheWarming).toEqual({
      minZoom: 9,
      maxZoom: 13,
      tables: ['bikelanes', 'boundaries,boundaryLabels'],
    })
  })

  test('round-trips joined tables via form values', () => {
    const config: RegionWriteInput = {
      ...validBase,
      cacheWarming: {
        minZoom: 8,
        maxZoom: 10,
        tables: ['boundaries,boundaryLabels', 'barrierAreas,barrierLines'],
      },
    }
    const formValues = regionConfigToFormValues(config)
    expect(formValues.cacheWarmingEnabled).toBe('true')
    expect(formValues.cacheWarmingSources).toContain('atlas_boundaries')
    expect(formValues.cacheWarmingSources).toContain('atlas_barriers')

    const parsed = RegionFormSchema.parse(formValues)
    expect(parsed.cacheWarming?.tables).toEqual([
      'boundaries,boundaryLabels',
      'barrierAreas,barrierLines',
    ])
  })

  test('round-trips mask OSM relation IDs into the form string field', () => {
    const config: RegionWriteInput = {
      ...validBase,
      maskOsmRelationIds: [2787952, 62504],
      maskBufferKm: 1.5,
    }
    const formValues = regionConfigToFormValues(config)
    expect(formValues.maskEnabled).toBe('true')
    expect(formValues.maskOsmRelationIds).toBe('2787952, 62504')
    expect(formValues.maskBufferKm).toBe('1.5')

    const parsed = RegionFormSchema.parse(formValues)
    expect(parsed.maskOsmRelationIds).toEqual([2787952, 62504])
    expect(parsed.maskBufferKm).toBe(1.5)
  })
})

describe('RegionFormSchema welcome image', () => {
  test('rejects image uploadId but empty altText', () => {
    const result = RegionFormRawSchema.safeParse({
      ...regionFormBase,
      welcomeEnabled: 'true',
      welcomeTitle: 'Willkommen',
      welcomeImageUploadId: '1',
      welcomeImageAltText: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes('welcomeImageAltText'))).toBe(
        true,
      )
    }
  })

  test('accepts image with uploadId and altText', () => {
    const result = RegionFormSchema.safeParse({
      ...regionFormBase,
      welcomeEnabled: 'true',
      welcomeTitle: 'Willkommen',
      welcomeImageUploadId: '1',
      welcomeImageAltText: 'Radwege auf der Karte',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.welcome?.image).toEqual({
        uploadId: 1,
        altText: 'Radwege auf der Karte',
      })
    }
  })
})

describe('RegionFormSchema welcome disable preserves content', () => {
  test('disabled toggle keeps welcome object with enabled false', () => {
    const parsed = RegionFormSchema.parse({
      ...regionFormBase,
      welcomeEnabled: 'false',
      welcomeTitle: 'Saved title',
      welcomeSubtitle: 'Saved subtitle',
      welcomeBodyMarkdown: 'Saved body',
      welcomeSections: [{ title: 'FAQ', bodyMarkdown: 'Answer', sortOrder: 0 }],
    })
    expect(parsed.welcome).toEqual({
      enabled: false,
      title: 'Saved title',
      subtitle: 'Saved subtitle',
      bodyMarkdown: 'Saved body',
      image: null,
      sections: [{ title: 'FAQ', bodyMarkdown: 'Answer', sortOrder: 0 }],
    })
  })
})

describe('RegionWelcomeWriteSchema', () => {
  test('enabled requires non-empty title', () => {
    const result = RegionWriteSchema.safeParse({
      ...validBase,
      welcome: {
        enabled: true,
        title: '',
        image: null,
        sections: [],
      },
    })
    expect(result.success).toBe(false)
  })

  test('rejects more than 8 sections', () => {
    const result = RegionWriteSchema.safeParse({
      ...validBase,
      welcome: {
        enabled: true,
        title: 'Willkommen',
        image: null,
        sections: [
          { title: 'A', sortOrder: 0 },
          { title: 'B', sortOrder: 1 },
          { title: 'C', sortOrder: 2 },
          { title: 'D', sortOrder: 3 },
          { title: 'E', sortOrder: 4 },
          { title: 'F', sortOrder: 5 },
          { title: 'G', sortOrder: 6 },
          { title: 'H', sortOrder: 7 },
          { title: 'I', sortOrder: 8 },
        ],
      },
    })
    expect(result.success).toBe(false)
  })

  test('image requires non-empty altText', () => {
    const result = RegionWriteSchema.safeParse({
      ...validBase,
      welcome: {
        enabled: true,
        title: 'Willkommen',
        image: { uploadId: 1, altText: '' },
        sections: [],
      },
    })
    expect(result.success).toBe(false)
  })

  test('accepts enabled welcome with image and sections', () => {
    const result = RegionWriteSchema.safeParse({
      ...validBase,
      welcome: {
        enabled: true,
        title: 'Willkommen',
        subtitle: 'Untertitel',
        bodyMarkdown: 'Intro',
        image: { uploadId: 1, altText: 'Hero-Bild' },
        sections: [{ title: 'FAQ', bodyMarkdown: 'Antwort', sortOrder: 0 }],
      },
    })
    expect(result.success).toBe(true)
  })
})

describe('cacheWarmingSources helpers', () => {
  test('warmable tile-path keys are unique', () => {
    expect(warmableTablesKeySet.size).toBe(warmableSources.length)
  })

  test('maps atlas_boundaries to joined tables key', () => {
    expect(sourceIdToWarmingTablesKey('atlas_boundaries')).toBe('boundaries,boundaryLabels')
    expect(warmingTablesKeyToSourceId('boundaries,boundaryLabels')).toBe('atlas_boundaries')
  })

  test('sourceIdsToWarmingTables / warmingTablesToSourceIds round-trip', () => {
    const ids = ['atlas_bikelanes', 'atlas_boundaries']
    const tables = sourceIdsToWarmingTables(ids)
    expect(tables).toEqual(['bikelanes', 'boundaries,boundaryLabels'])
    expect(warmingTablesToSourceIds(tables)).toEqual(ids)
  })

  test('drops orphan table keys on reverse map', () => {
    expect(warmingTablesToSourceIds(['bikelanes', 'legacy_orphan'])).toEqual(['atlas_bikelanes'])
  })
})

describe('parseRegionCacheWarming (lenient read)', () => {
  test('still accepts out-of-range zoom so legacy rows do not become null', () => {
    const parsed = parseRegionCacheWarming({
      minZoom: 2,
      maxZoom: 20,
      tables: ['bikelanes'],
    })
    expect(parsed).toEqual({ minZoom: 2, maxZoom: 20, tables: ['bikelanes'] })
  })
})

describe('cacheWarmingToWriteInput (strict write round-trip)', () => {
  test('clamps out-of-range zooms so RegionWriteSchema accepts the result', () => {
    const write = cacheWarmingToWriteInput({
      minZoom: 2,
      maxZoom: 20,
      tables: ['bikelanes'],
    })
    expect(write).toEqual({ minZoom: 4, maxZoom: 14, tables: ['bikelanes'] })
    expect(
      RegionWriteSchema.safeParse({
        ...validBase,
        cacheWarming: write,
      }).success,
    ).toBe(true)
  })

  test('drops unknown tables and nulls when none remain', () => {
    expect(
      cacheWarmingToWriteInput({
        minZoom: 8,
        maxZoom: 10,
        tables: ['legacy_orphan'],
      }),
    ).toBeNull()
  })
})
