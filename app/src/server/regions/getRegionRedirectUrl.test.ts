import { describe, expect, test, vi } from 'vitest'
import { createFreshCategoriesConfig } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/createFreshCategoriesConfig'
import type {
  MapDataCategoryConfig,
  MapDataCategoryParam,
} from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/type'
import { simplifyConfigForParams } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/utils/simplifyConfigForParams'
import { configs } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v2/configs'
import { calcConfigChecksum } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v2/lib'
import { parse } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v2/parse'
import { serialize } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/useCategoriesConfig/v2/serialize'
import { parseMapParam } from '@/components/regionen/pageRegionSlug/hooks/useQueryState/utils/mapParam'
import type { MapDataCategoryId } from '@/components/regionen/pageRegionSlug/mapData/mapDataCategories/MapDataCategoryId'
import { getRegionRedirectUrl } from './getRegionRedirectUrl.server'

const { mockGetRegionConfigTemplate } = vi.hoisted(() => ({
  mockGetRegionConfigTemplate: vi.fn(
    async (_checksum: string): Promise<MapDataCategoryParam[] | undefined> => undefined,
  ),
}))

// Inline region fixtures with only the fields the redirect/decode path reads.
// `map` (map param) and `categories` (fresh config + checksum); other region fields are unused here.
const { regionFixtures } = vi.hoisted(() => ({
  regionFixtures: {
    parkraum: {
      map: { lat: 52.4918, lng: 13.4261, zoom: 13.5 },
      categories: ['parkingLars', 'mapillary'],
    },
    berlin: {
      map: { lat: 52.507, lng: 13.367, zoom: 11.8 },
      categories: [
        'bikelanes',
        'roads',
        'surface',
        'parkingTilda',
        'parkingLars',
        'bicycleParking',
        'poi',
        'mapillary',
      ],
    },
    'bb-pg': {
      map: { lat: 52.3968, lng: 13.0342, zoom: 11 },
      categories: ['poi', 'bikelanes', 'roads', 'surface', 'bicycleParking', 'mapillary'],
    },
    bibi: {
      map: { lat: 48.95793, lng: 9.1395, zoom: 13 },
      categories: [
        'poi',
        'bikelanes',
        'roads',
        'surface',
        'lit',
        'parkingLars',
        'parkingTilda',
        'mapillary',
      ],
    },
    bb: {
      map: { lat: 52.3968, lng: 13.0342, zoom: 11 },
      categories: ['poi', 'bikelanes', 'roads', 'surface', 'bicycleParking', 'mapillary'],
    },
    'parkraum-berlin-euvm': {
      map: { lat: 52.507, lng: 13.367, zoom: 11.8 },
      categories: ['parkingTilda', 'roads', 'mapillary'],
    },
  } as Record<string, { map: { lat: number; lng: number; zoom: number }; categories: string[] }>,
}))

vi.mock('@/server/regions/queries/getRegion.server', () => ({
  getRegion: vi.fn(async ({ slug }: { slug: string }) => {
    const entry = regionFixtures[slug]
    if (!entry) throw new Error('not found')
    return {
      id: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      slug,
      promoted: true,
      status: 'PUBLIC' as const,
      ...entry,
    }
  }),
}))

// Unit tests mock tier-2 (DB template) to miss so decode falls through to the frozen archive
// (tier 3). resolveConfigTemplate is reimplemented here so it calls the mocked
// getRegionConfigTemplate (same-module closure would bypass vi.mock).
vi.mock('@/server/regions/regionConfigTemplates.server', () => ({
  getRegionConfigTemplate: mockGetRegionConfigTemplate,
  upsertRegionConfigTemplate: vi.fn(),
  resolveConfigTemplate: async (checksum: string, freshConfig: MapDataCategoryConfig[]) => {
    if (checksum === calcConfigChecksum(freshConfig)) {
      return simplifyConfigForParams(freshConfig)
    }
    return (
      (await mockGetRegionConfigTemplate(checksum)) ??
      (checksum in configs
        ? (configs[checksum as keyof typeof configs] as MapDataCategoryParam[])
        : undefined)
    )
  },
}))

function getUrl(redirectUrl: string | null) {
  if (!redirectUrl) throw new Error('Expected redirect URL but got null')
  return new URL(redirectUrl)
}

async function redirectOnly(locationHref: string, regionSlug: string) {
  const { redirectUrl } = await getRegionRedirectUrl(locationHref, regionSlug)
  return redirectUrl
}

function extractSlugFromUrl(url: string) {
  const pathname = new URL(url).pathname.slice(1)
  const parts = pathname.split('/')
  return parts[1] ?? parts[0] ?? ''
}

function parseCategoryFromResponse(
  redirectUrl: string | null,
  expectedChecksum: string,
  categoryId: string,
) {
  const url = getUrl(redirectUrl)
  const configParam = url.searchParams.get('config')
  expect(configParam).toBeTruthy()
  if (expectedChecksum) {
    expect(configParam?.startsWith(expectedChecksum)).toBe(true)
  }

  const checksum = configParam?.split('.')[0]
  if (!configParam || !checksum) throw new Error('Missing config param or checksum')
  const simplifiedConfig = configs[checksum as keyof typeof configs]
  const parsedConfig = parse(configParam, simplifiedConfig as MapDataCategoryConfig[])
  const category = parsedConfig.find((c) => c.id === categoryId)
  if (!category) throw new Error('Category not found')
  return category
}

describe('getRegionRedirectUrl()', () => {
  test('handles path-only URLs (e.g. from TanStack Router location.href)', async () => {
    const pathOnlyUrl = '/regionen/parkraum?map=13.5/52.4918/13.4261'
    const redirectUrl = await redirectOnly(pathOnlyUrl, 'parkraum')
    expect(redirectUrl).toBeTruthy()
    const resultUrl = getUrl(redirectUrl)
    expect(resultUrl.pathname).toBe('/regionen/parkraum')
    expect(resultUrl.searchParams.has('map')).toBe(true)
  })

  test('redirect preserves request host', async () => {
    const url = 'http://127.0.0.1:5173/regionen/berlin'
    const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
    expect(redirectUrl).toBeTruthy()
    const resultUrl = getUrl(redirectUrl)
    // Request URL host may be 127.0.0.1 or localhost
    expect(['127.0.0.1:5173', 'localhost:5173']).toContain(resultUrl.host)
  })

  describe('Make sure the guards work', () => {
    test('Do nothing on home', async () => {
      const url = 'http://127.0.0.1:5173/'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBe(null)
    })

    test('Do nothing if path does not start with "/regionen"', async () => {
      const url = 'http://127.0.0.1:5173/somethingelse'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBe(null)
    })

    test('Do nothing on /regionen', async () => {
      const url = 'http://127.0.0.1:5173/regionen'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBe(null)
    })

    test('Do nothing when region is unknown', async () => {
      const url = 'http://127.0.0.1:5173/regionen/unkownRegion'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBe(null)
    })
  })

  describe('Make we migrate and redirect renamed regions', () => {
    test('Redirect when matching a renamed region and apply map params', async () => {
      const url = 'http://127.0.0.1:5173/regionen/bb-ag?theme=foobar'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      const resultUrl = getUrl(redirectUrl)

      // Migrated region
      expect(resultUrl.pathname).toBe('/regionen/bb-pg')
      // But still handling the map params
      expect(typeof resultUrl.searchParams.get('map')).toBe('string')
      expect(typeof resultUrl.searchParams.get('config')).toBe('string')
    })

    test('Do not redirect when rename target slug is missing from DB', async () => {
      const { getRegion } = await import('@/server/regions/queries/getRegion.server')
      vi.mocked(getRegion).mockRejectedValueOnce(new Error('not found'))

      const url = 'http://127.0.0.1:5173/regionen/bb-ag'
      const { redirectUrl, region } = await getRegionRedirectUrl(url, 'bb-ag')
      expect(redirectUrl).toBe(null)
      expect(region).toBe(null)
    })
  })

  describe('Make sure the redirects work for /regionen/:slug', () => {
    test('INIT: Add missing map, config params', async () => {
      const url = 'http://127.0.0.1:5173/regionen/berlin'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      const resultUrl = getUrl(redirectUrl)

      expect(resultUrl.searchParams.get('map')).toBe('11.8/52.507/13.367')
      expect(typeof resultUrl.searchParams.get('config')).toBe('string')
    })

    test('INIT: Replace typed-search map sentinel with region.map', async () => {
      const url = 'http://127.0.0.1:5173/regionen/berlin?map=0/0/0'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      const resultUrl = getUrl(redirectUrl)

      expect(resultUrl.searchParams.get('map')).toBe('11.8/52.507/13.367')
    })

    test('MIGRATION: Migrate `lat`, `lng`, `zoom` params to `map` param', async () => {
      const url = 'http://127.0.0.1:5173/regionen/berlin?lat=1&lng=2&zoom=3'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      const resultUrl = getUrl(redirectUrl)

      expect(resultUrl.searchParams.get('map')).toBe('3/1/2')
      expect(resultUrl.searchParams.getAll('map').length).toBe(1)
      expect(resultUrl.searchParams.get('lat')).toBe(null)
      expect(resultUrl.searchParams.get('lng')).toBe(null)
      expect(resultUrl.searchParams.get('zoom')).toBe(null)
    })

    test('MIGRATION: Migrate `lat`, `lng` to `map` param', async () => {
      const url = 'http://127.0.0.1:5173/regionen/berlin?lat=1&lng=2'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      const resultUrl = getUrl(redirectUrl)

      expect(resultUrl.searchParams.get('map')).toBe('0/1/2') // using mapParamFallback.zoom
      expect(resultUrl.searchParams.getAll('map').length).toBe(1)
      expect(resultUrl.searchParams.get('lat')).toBe(null)
      expect(resultUrl.searchParams.get('lng')).toBe(null)
      expect(resultUrl.searchParams.get('zoom')).toBe(null)
    })

    test('MIGRATION: Migrate `lat`, `lng` to `map` param but not if map is present', async () => {
      const url = 'http://127.0.0.1:5173/regionen/berlin?lat=1&lng=2&map=5/6/7'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      const resultUrl = getUrl(redirectUrl)

      expect(resultUrl.searchParams.get('map')).toBe('5/6/7')
      expect(resultUrl.searchParams.getAll('map').length).toBe(1)
      expect(resultUrl.searchParams.get('lat')).toBe(null)
      expect(resultUrl.searchParams.get('lng')).toBe(null)
      expect(resultUrl.searchParams.get('zoom')).toBe(null)
    })

    const sharedMockMigrationUrl =
      'http://127.0.0.1:5173/regionen/berlin?config=!(i~fromTo~a~~topics~!(i~shops~s~!(i~hidden~a)(i~default~a~_F))(i~education~s~!(i~hidden~a)(i~default~a~_F))(i~places~s~!(i~hidden~a~_F)(i~default~a)(i~circle~a~_F))(i~buildings~s~!(i~hidden~a)(i~default~a~_F))(i~landuse~s~!(i~hidden~a~_F)(i~default~a))(i~barriers~s~!(i~hidden~a~_F)(i~default~a))(i~boundaries~s~!(i~hidden~a)(i~default~a~_F)(i~level-8~a~_F)(i~level-9-10~a~_F)))(i~bikelanes~a~~topics~!(i~bikelanes~s~!(i~hidden~a~_F)(i~default~a)(i~verification~a~_F)(i~completeness~a~_F)(i~bikelane*_oneway*_arrows~a~_F))(i~bikelanesPresence*_legacy~s~!(i~hidden~a)(i~default~a~_F))(i~places~s~!(i~hidden~a~_F)(i~default~a)(i~circle~a~_F))(i~landuse~s~!(i~hidden~a)(i~default~a~_F)))(i~roadClassification~a~_F~topics~!(i~roadClassification*_legacy~s~!(i~hidden~a~_F)(i~default~a)(i~oneway~a~_F))(i~bikelanes~s~!(i~hidden~a)(i~default~a~_F)(i~verification~a~_F)(i~completeness~a~_F)(i~bikelane*_oneway*_arrows~a~_F))(i~maxspeed*_legacy~s~!(i~hidden~a)(i~default~a~_F)(i~details~a~_F))(i~surfaceQuality*_legacy~s~!(i~hidden~a)(i~default~a~_F)(i~bad~a~_F)(i~completeness~a~_F)(i~freshness~a~_F))(i~places~s~!(i~hidden~a~_F)(i~default~a)(i~circle~a~_F))(i~landuse~s~!(i~hidden~a)(i~default~a~_F)))(i~lit~a~_F~topics~!(i~lit*_legacy~s~!(i~hidden~a~_F)(i~default~a)(i~completeness~a~_F)(i~freshness~a~_F))(i~places~s~!(i~hidden~a~_F)(i~default~a~_F)(i~circle~a~_F))(i~landuse~s~!(i~hidden~a)(i~default~a~_F)))(i~parking~a~_F~topics~!(i~parking~s~!(i~hidden~a~_F)(i~default~a)(i~presence~a~_F)(i~surface~a~_F))(i~parkingPoints~s~!(i~hidden~a)(i~default~a~_F))(i~parkingAreas~s~!(i~hidden~a~_F)(i~default~a)(i~street*_side~a~_F))(i~parkingDebug~s~!(i~hidden~a)(i~default~a~_F))(i~parkingStats~s~!(i~hidden~a)(i~stats-admin-level-4~a~_F)(i~default~a~_F)(i~stats-admin-level-10~a~_F)(i~length-admin-level-4~a~_F)(i~length-admin-level-9~a~_F)(i~length-admin-level-10~a~_F))(i~landuse~s~!(i~hidden~a)(i~default~a~_F)))~'

    test('MIGRATION: Update old `config`s: Check if all `nameMigrations` are done', async () => {
      const redirectUrl = await redirectOnly(
        sharedMockMigrationUrl,
        extractSlugFromUrl(sharedMockMigrationUrl),
      )
      expect(redirectUrl).toBeTruthy()
      const resultUrl = getUrl(redirectUrl)
      const configParam = resultUrl.searchParams.get('config')

      // Check if all `nameMigrations` are done
      expect(configParam?.includes('fromTo')).toBeFalsy()
      expect(configParam?.includes('shops')).toBeFalsy()
      expect(configParam?.includes('roadClassification')).toBeFalsy()
      expect(configParam?.includes('topics')).toBeFalsy()
    })

    test('MIGRATION: Make sure params are only present once', async () => {
      const redirectUrlMigrated = await redirectOnly(
        sharedMockMigrationUrl,
        extractSlugFromUrl(sharedMockMigrationUrl),
      )
      expect(redirectUrlMigrated).toBeTruthy()
      const urlMigrated = getUrl(redirectUrlMigrated)

      expect(urlMigrated.toString().match(/config=/g)?.length).toBe(1)
      expect(urlMigrated.toString().match(/map=/g)?.length).toBe(1)
      expect(urlMigrated.toString().match(/topics=/g)?.length).toBe(undefined)
    })

    test('TEST: Invalid map param is handled properly', async () => {
      // see also useMapParam.test.ts
      let url = 'http://127.0.0.1:5173/regionen/bibi?map=11/48.9/9.9'
      let redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      const map = getUrl(redirectUrl).searchParams.get('map')
      expect(map).toBeTruthy()
      expect(parseMapParam(map ?? '')).toStrictEqual({ zoom: 11, lat: 48.9, lng: 9.9 })

      url = 'http://127.0.0.1:5173/regionen/bibi?map=11/48A9/9.9'
      redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      const map2 = getUrl(redirectUrl).searchParams.get('map')
      expect(map2).toBeTruthy()
      expect(parseMapParam(map2 ?? '')).toHaveProperty('zoom')
    })

    test('CLEANUP: Remove unused params', async () => {
      const url =
        'http://127.0.0.1:5173/regionen/berlin?theme=theme&config=config&foo=foo&bar=bar&map=map'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      const resultUrl = getUrl(redirectUrl)

      expect(resultUrl.searchParams.get('theme')).toBe(null)
      expect(resultUrl.searchParams.get('foo')).toBe(null)
      expect(resultUrl.searchParams.get('bar')).toBe(null)
      expect(typeof resultUrl.searchParams.get('map')).toBe('string')
      expect(typeof resultUrl.searchParams.get('config')).toBe('string')
    })

    test('MIGRATION: Check if migration 0002 works', async () => {
      const url =
        'http://127.0.0.1:5173/regionen/bb?v=1&map=11/52.397/13.034&config=!(i~poi~a~~sc~!(i~poi~s~!(i~hidden~a~_F)(i~default~a~_F)(i~education~a))(i~poiPlaces~s~!(i~hidden~a~_F)(i~default~a)(i~circle~a~_F))(i~poiBoundaries~s~!(i~hidden~a)(i~default~a~_F)(i~category*_district*_label~a~_F)(i~category*_municipality~a~_F)(i~category*_municipality*_label~a~_F))(i~poiPlusBarriers~s~!(i~default~a~_F))(i~poiPlusLanduse~s~!(i~default~a~_F))(i~poiPlusPublicTransport~s~!(i~default~a~_F)))(i~bikelanes~a~_F~sc~!(i~bikelanes~s~!(i~hidden~a~_F)(i~default~a)(i~details~a~_F)(i~width~a~_F))(i~bikelanes*_plus*_presence~s~!(i~default~a~_F))(i~bikelanes*_plus*_width~s~!(i~default~a~_F))(i~bikelanes*_plus*_surface*_smoothness~s~!(i~default~a~_F))(i~bikelanes*_plus*_signs~s~!(i~default~a~_F))(i~bikelanes*_plus*_routes~s~!(i~default~a~_F)))(i~roads~a~~sc~!(i~roads~s~!(i~hidden~a~_F)(i~default~a~_F)(i~sidestreets~a~_F)(i~mainstreets~a))(i~maxspeed~s~!(i~hidden~a~_F)(i~default~a~_F)(i~below30~a~_F)(i~above40~a))(i~roads*_plus*_oneway~s~!(i~default~a~_F))(i~roads*_plus*_footways~s~!(i~default~a~_F)))(i~surface~a~_F~sc~!(i~surfaceRoads~s~!(i~hidden~a~_F)(i~default~a)(i~bad~a~_F))(i~surfaceBikelanes~s~!(i~hidden~a)(i~default~a~_F)(i~bad~a~_F)))(i~bicycleParking~a~~sc~!(i~bicycleParking~s~!(i~hidden~a~_F)(i~default~a)))(i~mapillary~a~~sc~!(i~mapillaryCoverage~s~!(i~hidden~a~_F)(i~default~a~_F)(i~all~a~_F)(i~age~a)(i~pano~a~_F)))~'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      const resultUrl = getUrl(redirectUrl)

      expect(resultUrl.searchParams.get('v')).toBe('2')
      expect(resultUrl.searchParams.get('config')).toBe('166cmie.ivb7ah.2r53k')
    })

    test('MIGRATION: Preserve already-short config when version is missing', async () => {
      const url =
        'http://127.0.0.1:5173/regionen/parkraum-berlin-euvm?map=18.5/52.5/13.4&config=gzvfwv.miikl.2tbmq'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      const resultUrl = getUrl(redirectUrl)

      expect(resultUrl.searchParams.get('v')).toBe('2')

      const parkingTildaCategory = parseCategoryFromResponse(redirectUrl, '', 'parkingTilda')
      expect(parkingTildaCategory.active).toBe(true)

      const parkingTilda = parkingTildaCategory.subcategories.find((s) => s.id === 'parkingTilda')!
      expect(parkingTilda.styles.find((s) => s.id === 'default')?.active).toBe(true)

      const parkingTildaOffStreet = parkingTildaCategory.subcategories.find(
        (s) => s.id === 'parkingTildaOffStreet',
      )!
      expect(parkingTildaOffStreet.styles.find((s) => s.id === 'default')?.active).toBe(true)

      const parkingTildaNo = parkingTildaCategory.subcategories.find(
        (s) => s.id === 'parkingTildaNo',
      )!
      expect(parkingTildaNo.styles.find((s) => s.id === 'default')?.active).toBe(true)
    })

    test('MIGRATION: Migrate old parking category to parkingLars', async () => {
      // This test verifies the SOLUTION: what happens WITH migration in the redirect logic.
      // This test verifies that URLs with the old config hash `1r6doko` (which uses category ID 'parking')
      // are properly migrated to use the new category ID 'parkingLars'.
      // The category was renamed in commit 6df2b6b0e40896a37d05ff8616a2f5221c18ea7d
      // The redirect logic calls migrateConfigCategoryIds() BEFORE mergeCategoriesConfig(),
      // which maps 'parking' -> 'parkingLars' so the merge succeeds.
      // See mergeCategoriesConfig.test.ts "Renamed category IDs are ignored..." for the PROBLEM (without migration).
      const url =
        'http://127.0.0.1:5173/regionen/parkraum?map=13.5%2F52.4918%2F13.4261&config=1r6doko.4qfsxx.0&v=2'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      const resultUrl = getUrl(redirectUrl)

      const configParam = resultUrl.searchParams.get('config')
      expect(configParam).toBeTruthy()

      // The migrated config should use the new checksum for parkraum (12nl2cs) which uses parkingLars
      // The config should be successfully transformed, _not_ reset to defaults
      expect(configParam?.startsWith('12nl2cs')).toBe(true)

      // Verify the config is valid (not empty or error state)
      expect(configParam?.length).toBeGreaterThan(10)
    })

    test('MIGRATION: Preserve subcategory visibility when UI changes from radiobutton to checkbox (14ltyea to 1qldklk)', async () => {
      // Background: UI changed from radiobutton (14ltyea) to checkbox (1qldklk), causing config format change.
      // Verifies that all subcategory states are preserved when migrating between these formats.
      const url =
        'http://127.0.0.1:5173/regionen/parkraum-berlin-euvm?map=13.5%2F52.4918%2F13.4261&config=14ltyea.a09bxt.0&v=2'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      const parkingTildaCategory = parseCategoryFromResponse(redirectUrl, '1qldklk', 'parkingTilda')

      // Öffentliches Straßenparken => Surface is and stay active
      const parkingTilda = parkingTildaCategory.subcategories.find((s) => s.id === 'parkingTilda')!
      expect(parkingTilda.styles.find((s) => s.id === 'surface')?.active).toBe(true)

      // Öffentliches Parken abseits des Straßenraums => Default is and stay active
      const parkingTildaOffStreet = parkingTildaCategory.subcategories.find(
        (s) => s.id === 'parkingTildaOffStreet',
      )!
      expect(parkingTildaOffStreet.styles.find((s) => s.id === 'default')?.active).toBe(true)

      // Privates Straßenparken => Active, now default (default style active, hidden style not active)
      const parkingTildaPrivate = parkingTildaCategory.subcategories.find(
        (s) => s.id === 'parkingTildaPrivate',
      )!
      expect(parkingTildaPrivate.styles.find((s) => s.id === 'hidden')?.active).toBe(false)
      expect(parkingTildaPrivate.styles.find((s) => s.id === 'default')?.active).toBe(true)

      // Parkverbote => active is and stay active
      const parkingTildaNo = parkingTildaCategory.subcategories.find(
        (s) => s.id === 'parkingTildaNo',
      )!
      expect(parkingTildaNo.styles.find((s) => s.id === 'default')?.active).toBe(true)

      // Parkraum Stanzungen => active is and stay active
      const parkingTildaCutouts = parkingTildaCategory.subcategories.find(
        (s) => s.id === 'parkingTildaCutouts',
      )!
      expect(parkingTildaCutouts.styles.find((s) => s.id === 'default')?.active).toBe(true)
    })

    test('CONFIG TEMPLATE (tier 2): a stored checksum resolves via getRegionConfigTemplate, not reset', async () => {
      // A ?config= URL whose checksum matches an older category combination: not the region's
      // current fresh config (tier 1) and not in the frozen archive — only in RegionConfigTemplate.
      const oldCategories = ['poi', 'bikelanes'] as MapDataCategoryId[]
      const oldFresh = createFreshCategoriesConfig(oldCategories).map((category) =>
        category.id === 'poi' ? { ...category, active: true } : category,
      )
      const checksum = calcConfigChecksum(oldFresh)
      const template = simplifyConfigForParams(oldFresh)
      const configParam = serialize(oldFresh)

      const berlinCategories = regionFixtures.berlin!.categories as MapDataCategoryId[]
      const berlinFresh = createFreshCategoriesConfig(berlinCategories)
      const berlinChecksum = calcConfigChecksum(berlinFresh)
      expect(checksum).not.toBe(berlinChecksum)

      mockGetRegionConfigTemplate.mockResolvedValueOnce(template)

      const url = `http://127.0.0.1:5173/regionen/berlin?v=2&map=11/52.5/13.4&config=${configParam}`
      const redirectUrl = await redirectOnly(url, 'berlin')

      expect(mockGetRegionConfigTemplate).toHaveBeenCalledWith(checksum)
      expect(redirectUrl).toBeTruthy()
      const resultConfig = getUrl(redirectUrl).searchParams.get('config')
      expect(resultConfig?.startsWith(berlinChecksum)).toBe(true)
      expect(resultConfig).not.toBe(configParam)

      const parsed = parse(
        resultConfig!,
        simplifyConfigForParams(berlinFresh) as MapDataCategoryConfig[],
      )
      expect(parsed.find((category) => category.id === 'poi')?.active).toBe(true)
    })

    test('CONFIG TEMPLATE (tier 3): frozen archive checksum decodes when DB template misses', async () => {
      const url =
        'http://127.0.0.1:5173/regionen/parkraum?map=13.5%2F52.4918%2F13.4261&config=1r6doko.4qfsxx.0&v=2'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      expect(getUrl(redirectUrl).searchParams.get('config')?.startsWith('12nl2cs')).toBe(true)
    })

    test('CONFIG: unknown checksum resets to region defaults', async () => {
      const berlinCategories = regionFixtures.berlin!.categories as MapDataCategoryId[]
      const berlinChecksum = calcConfigChecksum(createFreshCategoriesConfig(berlinCategories))
      const url =
        'http://127.0.0.1:5173/regionen/berlin?v=2&map=11/52.5/13.4&config=zzunknown.zzzzzz.0'
      const redirectUrl = await redirectOnly(url, 'berlin')
      expect(redirectUrl).toBeTruthy()
      expect(getUrl(redirectUrl).searchParams.get('config')?.startsWith(berlinChecksum)).toBe(true)
    })

    test('CONFIG: corrupt bits reset to defaults without throwing', async () => {
      const parkraumCategories = regionFixtures.parkraum!.categories as MapDataCategoryId[]
      const parkraumChecksum = calcConfigChecksum(createFreshCategoriesConfig(parkraumCategories))
      const url =
        'http://127.0.0.1:5173/regionen/parkraum?map=13.5/52.4918/13.4261&config=1r6doko.&v=2'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      expect(getUrl(redirectUrl).searchParams.get('config')?.startsWith(parkraumChecksum)).toBe(
        true,
      )
    })

    test('MIGRATION: Ensure hidden is active when checkbox was off and no style is active after merge (14ltyea.a099j9.0 to 1qldklk)', async () => {
      // Background: When migrating from old format (checkbox) to new format (dropdown),
      // if a checkbox was OFF (default: false), it should become "hidden" active in the new format.
      // This test verifies that parkingTildaPrivate, which was a checkbox (off) in production config,
      // correctly migrates to have "hidden" active instead of showing an empty dropdown.
      const url =
        'http://127.0.0.1:5173/regionen/parkraum-berlin-euvm?map=15/52.4928/13.4088&config=14ltyea.a099j9.0&v=2'
      const redirectUrl = await redirectOnly(url, extractSlugFromUrl(url))
      expect(redirectUrl).toBeTruthy()
      const parkingTildaCategory = parseCategoryFromResponse(redirectUrl, '1qldklk', 'parkingTilda')

      // Privates Straßenparken => Was checkbox (off), should now have "hidden" active
      const parkingTildaPrivate = parkingTildaCategory.subcategories.find(
        (s) => s.id === 'parkingTildaPrivate',
      )!
      const hiddenStyle = parkingTildaPrivate.styles.find((s) => s.id === 'hidden')
      expect(hiddenStyle).toBeTruthy()
      expect(hiddenStyle?.active).toBe(true)

      // Verify no other style is active (all should be false)
      const activeStyles = parkingTildaPrivate.styles.filter((s) => s.active)
      expect(activeStyles.length).toBe(1)
      expect(activeStyles[0]?.id).toBe('hidden')
    })
  })

  describe('redirect loop regression', () => {
    test('stabilizes after one redirect (no infinite loop)', async () => {
      const url = 'http://127.0.0.1:5173/regionen/parkraum'
      const r1 = await redirectOnly(url, 'parkraum')
      expect(r1).toBeTruthy()
      const r2 = await redirectOnly(r1!, 'parkraum')
      expect(r2).toBeNull()
    })

    test('does not redirect when only query encoding differs', async () => {
      const seeded = await redirectOnly('http://127.0.0.1:5173/regionen/parkraum', 'parkraum')
      const normalized = getUrl(seeded!).toString()
      const decoded = normalized.replace(/%2F/g, '/').replace(/%5B%5D/g, '[]')

      expect(await redirectOnly(normalized, 'parkraum')).toBeNull()
      expect(await redirectOnly(decoded, 'parkraum')).toBeNull()
    })
  })
})
