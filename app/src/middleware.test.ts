import { NextRequest } from 'next/server'
import { describe, expect, test } from 'vitest'
import { configs } from './app/regionen/[regionSlug]/_hooks/useQueryState/useCategoriesConfig/v2/configs'
import { parse } from './app/regionen/[regionSlug]/_hooks/useQueryState/useCategoriesConfig/v2/parse'
import { parseMapParam } from './app/regionen/[regionSlug]/_hooks/useQueryState/utils/mapParam'
import { middleware } from './middleware'

function getStatus(response: ReturnType<typeof middleware>) {
  return response.status
}

function getUrl(response: ReturnType<typeof middleware>) {
  // @ts-expect-error response is not type correctly; could not find docs or a github ticket on this
  return new URL(response.headers.get('location'))
}

describe('middleware()', () => {
  test('NextJS middleware redirect behavior with hostname normalization', () => {
    // NOTE: NextRequest normalizes 127.0.0.1 to localhost when created
    // This is a Next.js limitation that cannot be fixed in middleware
    // The client-side workaround (DevMiddlewareHostnameWorkaround) handles this
    // This test documents the current behavior - NextRequest.url is already normalized
    const mockRequest = new NextRequest('http://127.0.0.1:5173/regionen/berlin')
    const response = middleware(mockRequest)!
    const url = getUrl(response)
    // This tests confirms / documents the NextJS Bug/Limitation…
    // This should be 127.0.0.1:5173
    expect(url.host).toBe('localhost:5173')
  })

  describe('Make sure the guards work', () => {
    test('Do nothing on home', () => {
      const mockRequest = new NextRequest('http://127.0.0.1:5173/')
      const response = middleware(mockRequest)
      expect(getStatus(response)).toBe(200)
    })

    test('Do nothing if path does not start with "/regionen"', () => {
      const mockRequest = new NextRequest('http://127.0.0.1:5173/somethingelse')
      const response = middleware(mockRequest)
      expect(getStatus(response)).toBe(200)
    })

    test('Do nothing on /regionen', () => {
      const mockRequest = new NextRequest('http://127.0.0.1:5173/regionen')
      const response = middleware(mockRequest)
      expect(getStatus(response)).toBe(200)
    })

    test('Do nothing on subpages of the map /regionen/:slug/foo', () => {
      const mockRequest = new NextRequest('http://127.0.0.1:5173/regionen/berlin/foo')
      const response = middleware(mockRequest)
      expect(getStatus(response)).toBe(200)
    })

    test('Do nothing when region is unknown', () => {
      const mockRequest = new NextRequest('http://127.0.0.1:5173/regionen/unkownRegion')
      const response = middleware(mockRequest)
      expect(getStatus(response)).toBe(200)
    })
  })

  describe('Make we migrate and redirect renamed regions', () => {
    test('Redirect when matching a renamed region and apply map params', () => {
      const mockRequest = new NextRequest('http://127.0.0.1:5173/regionen/bb-ag?theme=foobar')
      const response = middleware(mockRequest)
      const url = getUrl(response)

      // Migrated region
      expect(url.pathname).toBe('/regionen/bb-pg')
      // But still handling the map params
      expect(typeof url.searchParams.get('map')).toBe('string')
      expect(typeof url.searchParams.get('config')).toBe('string')
    })

    test('Redirect subpage when matching a renamed region', () => {
      const mockRequest = new NextRequest('http://127.0.0.1:5173/regionen/bb-ag/foobar')
      const response = middleware(mockRequest)
      const url = getUrl(response)

      expect(url.pathname).toBe('/regionen/bb-pg/foobar')
    })
  })

  describe('Make sure the redirects work for /regionen/:slug', () => {
    test('INIT: Add missing map, config params', () => {
      const mockRequest = new NextRequest('http://127.0.0.1:5173/regionen/berlin')
      const response = middleware(mockRequest)
      const url = getUrl(response)

      expect(typeof url.searchParams.get('map')).toBe('string')
      expect(typeof url.searchParams.get('config')).toBe('string')
    })

    test('MIGRATION: Migrate `lat`, `lng`, `zoom` params to `map` param', () => {
      const mockRequest = new NextRequest(
        'http://127.0.0.1:5173/regionen/berlin?lat=1&lng=2&zoom=3',
      )
      const response = middleware(mockRequest)
      const url = getUrl(response)

      expect(url.searchParams.get('map')).toBe('3/1/2')
      expect(url.searchParams.getAll('map').length).toBe(1)
      expect(url.searchParams.get('lat')).toBe(null)
      expect(url.searchParams.get('lng')).toBe(null)
      expect(url.searchParams.get('zoom')).toBe(null)
    })

    test('MIGRATION: Migrate `lat`, `lng` to `map` param', () => {
      const mockRequest = new NextRequest('http://127.0.0.1:5173/regionen/berlin?lat=1&lng=2')
      const response = middleware(mockRequest)
      const url = getUrl(response)

      expect(url.searchParams.get('map')).toBe('12.1/1/2') // using mapParamFallback.zoom
      expect(url.searchParams.getAll('map').length).toBe(1)
      expect(url.searchParams.get('lat')).toBe(null)
      expect(url.searchParams.get('lng')).toBe(null)
      expect(url.searchParams.get('zoom')).toBe(null)
    })

    test('MIGRATION: Migrate `lat`, `lng` to `map` param but not if map is present', () => {
      const mockRequest = new NextRequest(
        'http://127.0.0.1:5173/regionen/berlin?lat=1&lng=2&map=5/6/7',
      )
      const response = middleware(mockRequest)
      const url = getUrl(response)

      expect(url.searchParams.get('map')).toBe('5/6/7')
      expect(url.searchParams.getAll('map').length).toBe(1)
      expect(url.searchParams.get('lat')).toBe(null)
      expect(url.searchParams.get('lng')).toBe(null)
      expect(url.searchParams.get('zoom')).toBe(null)
    })

    const sharedMockMigrationRequest = new NextRequest(
      'http://127.0.0.1:5173/regionen/berlin?config=!(i~fromTo~a~~topics~!(i~shops~s~!(i~hidden~a)(i~default~a~_F))(i~education~s~!(i~hidden~a)(i~default~a~_F))(i~places~s~!(i~hidden~a~_F)(i~default~a)(i~circle~a~_F))(i~buildings~s~!(i~hidden~a)(i~default~a~_F))(i~landuse~s~!(i~hidden~a~_F)(i~default~a))(i~barriers~s~!(i~hidden~a~_F)(i~default~a))(i~boundaries~s~!(i~hidden~a)(i~default~a~_F)(i~level-8~a~_F)(i~level-9-10~a~_F)))(i~bikelanes~a~~topics~!(i~bikelanes~s~!(i~hidden~a~_F)(i~default~a)(i~verification~a~_F)(i~completeness~a~_F)(i~bikelane*_oneway*_arrows~a~_F))(i~bikelanesPresence*_legacy~s~!(i~hidden~a)(i~default~a~_F))(i~places~s~!(i~hidden~a~_F)(i~default~a)(i~circle~a~_F))(i~landuse~s~!(i~hidden~a)(i~default~a~_F)))(i~roadClassification~a~_F~topics~!(i~roadClassification*_legacy~s~!(i~hidden~a~_F)(i~default~a)(i~oneway~a~_F))(i~bikelanes~s~!(i~hidden~a)(i~default~a~_F)(i~verification~a~_F)(i~completeness~a~_F)(i~bikelane*_oneway*_arrows~a~_F))(i~maxspeed*_legacy~s~!(i~hidden~a)(i~default~a~_F)(i~details~a~_F))(i~surfaceQuality*_legacy~s~!(i~hidden~a)(i~default~a~_F)(i~bad~a~_F)(i~completeness~a~_F)(i~freshness~a~_F))(i~places~s~!(i~hidden~a~_F)(i~default~a)(i~circle~a~_F))(i~landuse~s~!(i~hidden~a)(i~default~a~_F)))(i~lit~a~_F~topics~!(i~lit*_legacy~s~!(i~hidden~a~_F)(i~default~a)(i~completeness~a~_F)(i~freshness~a~_F))(i~places~s~!(i~hidden~a)(i~default~a~_F)(i~circle~a~_F))(i~landuse~s~!(i~hidden~a)(i~default~a~_F)))(i~parking~a~_F~topics~!(i~parking~s~!(i~hidden~a~_F)(i~default~a)(i~presence~a~_F)(i~surface~a~_F))(i~parkingPoints~s~!(i~hidden~a)(i~default~a~_F))(i~parkingAreas~s~!(i~hidden~a~_F)(i~default~a)(i~street*_side~a~_F))(i~parkingDebug~s~!(i~hidden~a)(i~default~a~_F))(i~parkingStats~s~!(i~hidden~a)(i~stats-admin-level-4~a~_F)(i~default~a~_F)(i~stats-admin-level-10~a~_F)(i~length-admin-level-4~a~_F)(i~length-admin-level-9~a~_F)(i~length-admin-level-10~a~_F))(i~landuse~s~!(i~hidden~a)(i~default~a~_F)))~',
    )

    test('MIGRATION: Update old `config`s: Check if all `nameMigrations` are done', () => {
      const response = middleware(sharedMockMigrationRequest)
      const url = getUrl(response)
      const configParam = url.searchParams.get('config')

      // Check if all `nameMigrations` are done
      expect(configParam?.includes('fromTo')).toBeFalsy()
      expect(configParam?.includes('shops')).toBeFalsy()
      expect(configParam?.includes('roadClassification')).toBeFalsy()
      expect(configParam?.includes('topics')).toBeFalsy()
    })

    test('MIGRATION: Make sure params are only present once', () => {
      const responseMigrated = middleware(sharedMockMigrationRequest)
      const urlMigrated = getUrl(responseMigrated)

      expect(urlMigrated.toString().match(/config=/g)?.length).toBe(1)
      expect(urlMigrated.toString().match(/map=/g)?.length).toBe(1)
      expect(urlMigrated.toString().match(/topics=/g)?.length).toBe(undefined)
    })

    test('TEST: Invalid map param is handled properly', () => {
      // see also useMapParam.test.ts
      let response = middleware(
        new NextRequest('http://127.0.0.1:5173/regionen/bibi?map=11/48.9/9.9'),
      )
      let map = getUrl(response).searchParams.get('map')!
      expect(parseMapParam(map)).toStrictEqual({ zoom: 11, lat: 48.9, lng: 9.9 })

      response = middleware(new NextRequest('http://127.0.0.1:5173/regionen/bibi?map=11/48A9/9.9'))
      map = getUrl(response).searchParams.get('map')!
      expect(parseMapParam(map)).toHaveProperty('zoom')
    })

    test('CLEANUP: Remove unused params', () => {
      const mockRequest = new NextRequest(
        'http://127.0.0.1:5173/regionen/berlin?theme=theme&config=config&foo=foo&bar=bar&map=map',
      )
      const response = middleware(mockRequest)
      const url = getUrl(response)

      expect(url.searchParams.get('theme')).toBe(null)
      expect(url.searchParams.get('foo')).toBe(null)
      expect(url.searchParams.get('bar')).toBe(null)
      expect(typeof url.searchParams.get('map')).toBe('string')
      expect(typeof url.searchParams.get('config')).toBe('string')
    })

    test('MIGRATION: Check if migration 0002 works', () => {
      const request = new NextRequest(
        'http://127.0.0.1:5173/regionen/bb?v=1&map=11/52.397/13.034&config=!(i~poi~a~~sc~!(i~poi~s~!(i~hidden~a~_F)(i~default~a~_F)(i~education~a))(i~poiPlaces~s~!(i~hidden~a~_F)(i~default~a)(i~circle~a~_F))(i~poiBoundaries~s~!(i~hidden~a)(i~default~a~_F)(i~category*_district*_label~a~_F)(i~category*_municipality~a~_F)(i~category*_municipality*_label~a~_F))(i~poiPlusBarriers~s~!(i~default~a~_F))(i~poiPlusLanduse~s~!(i~default~a~_F))(i~poiPlusPublicTransport~s~!(i~default~a~_F)))(i~bikelanes~a~_F~sc~!(i~bikelanes~s~!(i~hidden~a~_F)(i~default~a)(i~details~a~_F)(i~width~a~_F))(i~bikelanes*_plus*_presence~s~!(i~default~a~_F))(i~bikelanes*_plus*_width~s~!(i~default~a~_F))(i~bikelanes*_plus*_surface*_smoothness~s~!(i~default~a~_F))(i~bikelanes*_plus*_signs~s~!(i~default~a~_F))(i~bikelanes*_plus*_routes~s~!(i~default~a~_F)))(i~roads~a~~sc~!(i~roads~s~!(i~hidden~a~_F)(i~default~a~_F)(i~sidestreets~a~_F)(i~mainstreets~a))(i~maxspeed~s~!(i~hidden~a~_F)(i~default~a~_F)(i~below30~a~_F)(i~above40~a))(i~roads*_plus*_oneway~s~!(i~default~a~_F))(i~roads*_plus*_footways~s~!(i~default~a~_F)))(i~surface~a~_F~sc~!(i~surfaceRoads~s~!(i~hidden~a~_F)(i~default~a)(i~bad~a~_F))(i~surfaceBikelanes~s~!(i~hidden~a)(i~default~a~_F)(i~bad~a~_F)))(i~bicycleParking~a~~sc~!(i~bicycleParking~s~!(i~hidden~a~_F)(i~default~a)))(i~mapillary~a~~sc~!(i~mapillaryCoverage~s~!(i~hidden~a~_F)(i~default~a~_F)(i~all~a~_F)(i~age~a)(i~pano~a~_F)))~',
      )
      const response = middleware(request)
      const url = getUrl(response)

      expect(url.searchParams.get('v')).toBe('2')
      expect(url.searchParams.get('config')).toBe('166cmie.ivb7ah.2r53k')
    })

    test('MIGRATION: Migrate old parking category to parkingLars', () => {
      // This test verifies the SOLUTION: what happens WITH migration in the middleware.
      // This test verifies that URLs with the old config hash `1r6doko` (which uses category ID 'parking')
      // are properly migrated to use the new category ID 'parkingLars'.
      // The category was renamed in commit 6df2b6b0e40896a37d05ff8616a2f5221c18ea7d
      // The middleware calls migrateConfigCategoryIds() BEFORE mergeCategoriesConfig(),
      // which maps 'parking' -> 'parkingLars' so the merge succeeds.
      // See mergeCategoriesConfig.test.ts "Renamed category IDs are ignored..." for the PROBLEM (without migration).
      const request = new NextRequest(
        'http://127.0.0.1:5173/regionen/parkraum?map=13.5%2F52.4918%2F13.4261&config=1r6doko.4qfsxx.0&v=2',
      )
      const response = middleware(request)
      const url = getUrl(response)

      const configParam = url.searchParams.get('config')
      expect(configParam).toBeTruthy()

      // The migrated config should use the new checksum for parkraum (12nl2cs) which uses parkingLars
      // The config should be successfully transformed, _not_ reset to defaults
      expect(configParam?.startsWith('12nl2cs')).toBe(true)

      // Verify the config is valid (not empty or error state)
      expect(configParam?.length).toBeGreaterThan(10)
    })

    test('MIGRATION: Preserve subcategory visibility when UI changes from radiobutton to checkbox (14ltyea to 1qldklk)', () => {
      // Background: UI changed from radiobutton (14ltyea) to checkbox (1qldklk), causing config format change.
      // Verifies that all subcategory states are preserved when migrating between these formats.
      const request = new NextRequest(
        'http://127.0.0.1:5173/regionen/parkraum-berlin-euvm?map=13.5%2F52.4918%2F13.4261&config=14ltyea.a09bxt.0&v=2',
      )
      const response = middleware(request)
      const url = getUrl(response)

      const configParam = url.searchParams.get('config')
      expect(configParam).toBeTruthy()
      expect(configParam?.startsWith('1qldklk')).toBe(true)

      // Parse migrated config and verify all subcategory states
      const checksum = configParam!.split('.')[0]!
      const simplifiedConfig = configs[checksum]
      const parsedConfig = parse(configParam!, simplifiedConfig)
      const parkingTildaCategory = parsedConfig.find((c) => c.id === 'parkingTilda')!

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
  })
})
