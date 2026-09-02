import { describe, expect, test } from 'vitest'
import type { TRegion } from '@/server/regions/regionConfigMapper.server'
import { redactRegionForDeniedAccess } from './redactRegionForDeniedAccess.server'

const privateRegion = {
  id: 1,
  createdAt: new Date('2020-01-01'),
  updatedAt: new Date('2020-01-01'),
  slug: 'secret',
  promoted: false,
  status: 'PRIVATE',
  name: 'Secret',
  fullName: 'Secret Region',
  product: 'radverkehr',
  notes: 'osmNotes',
  showSearch: true,
  spaceFinderEnabled: true,
  mask: { osmRelationIds: [1], bufferKm: 2 },
  map: { lat: 52.5, lng: 13.4, zoom: 12 },
  logoWhiteBackgroundRequired: false,
  logoPath: '/api/region-uploads/9/logo.svg',
  navigationLinks: [{ name: 'Docs', href: 'https://example.com' }],
  categories: ['roads'],
  backgroundSources: ['mapnik'],
  cacheWarming: { minZoom: 8, maxZoom: 10, tables: ['roads'] },
  contract: {
    id: 1,
    slug: 'c',
    name: 'C',
    status: 'ACTIVE',
    regionCount: 1,
  },
  exports: null,
  bbox: null,
  welcome: {
    enabled: true,
    title: 'Confidential welcome',
    subtitle: 'Internal only',
    bodyMarkdown: 'Secret markdown',
    image: {
      uploadId: 9,
      path: '/api/region-uploads/9/logo.svg',
      altText: 'Partner',
    },
    sections: [{ title: 'FAQ', bodyMarkdown: 'Answer', sortOrder: 0 }],
  },
} satisfies TRegion

describe('redactRegionForDeniedAccess', () => {
  test('keeps identity fields for the denied screen / head', () => {
    const redacted = redactRegionForDeniedAccess(privateRegion)
    expect(redacted.slug).toBe('secret')
    expect(redacted.name).toBe('Secret')
    expect(redacted.fullName).toBe('Secret Region')
    expect(redacted.status).toBe('PRIVATE')
    expect(redacted.product).toBe('radverkehr')
  })

  test('strips welcome content and logo path', () => {
    const redacted = redactRegionForDeniedAccess(privateRegion)
    expect(redacted.welcome).toBeNull()
    expect(redacted.logoPath).toBeNull()
  })

  test('strips config that must not leak to slug-guessers', () => {
    const redacted = redactRegionForDeniedAccess(privateRegion)
    expect(redacted.mask).toBeNull()
    expect(redacted.map).toEqual({ lat: 0, lng: 0, zoom: 0 })
    expect(redacted.categories).toEqual([])
    expect(redacted.backgroundSources).toEqual([])
    expect(redacted.navigationLinks).toEqual([])
    expect(redacted.cacheWarming).toBeUndefined()
    expect(redacted.contract).toBeNull()
    expect(redacted.exports).toBeNull()
    expect(redacted.bbox).toBeNull()
  })
})
