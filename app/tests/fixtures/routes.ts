export const TEST_REGION_SLUG = 'radinfra'
export const TEST_REGION_URL = `/regionen/${TEST_REGION_SLUG}`
export const TEST_REGION_URL_WITH_CONFIG =
  '/regionen/radinfra?map=17/52.3494/13.6267&config=1p2va4k.7h3d.9klzpc&data=mapillary-cycleway-traffic-signs&bg=esri&osmNotes=true&v=2'

export const PUBLIC_ROUTES = ['/', '/kontakt', '/datenschutz', '/settings/user'] as const

/** All public routes for autonomous smoke tests (unauthenticated). One test per route. */
export const PUBLIC_SMOKE_ROUTES = [
  '/',
  '/kontakt',
  '/datenschutz',
  '/oAuthError',
  '/settings/user',
  '/docs/mapillary-coverage',
  '/regionen',
  '/regionen/stats',
  TEST_REGION_URL,
] as const

export const ADMIN_REDIRECT_SMOKE_ROUTE = '/admin' as const

export const REGION_ROUTES = ['/regionen', TEST_REGION_URL, TEST_REGION_URL_WITH_CONFIG] as const

export const ADMIN_ROUTES = [
  '/admin',
  '/admin/regions',
  '/admin/uploads',
  '/admin/qa-configs',
  '/admin/memberships',
] as const

export const DOCS_ROUTES = ['/docs/mapillary-coverage'] as const
