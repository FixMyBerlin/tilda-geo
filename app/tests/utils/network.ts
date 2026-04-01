import type { Page } from '@playwright/test'

export interface NetworkRequest {
  url: string
  status: number
  method: string
}

export const EXPECTED_MAP_REQUESTS = [
  {
    pattern: /clarity\.maptiles\.arcgis\.com.*tile/,
    description: 'ArcGIS imagery tiles',
  },
  {
    pattern: /api\.openstreetmap\.org.*notes\.json/,
    description: 'OSM notes API',
  },
  {
    pattern: /tiles\.tilda-geo\.de.*atlas_generalized_bikelanes/,
    description: 'Tilda vector tiles',
  },
  {
    pattern: /tilda-geo\.de\/api\/uploads.*\.pmtiles/,
    description: 'PMTiles uploads',
  },
  {
    pattern: /tiles\.mapillary\.com.*mly1_public/,
    description: 'Mapillary tiles',
  },
] as const

export async function verifyMapNetworkRequests(page: Page, timeout = 30000) {
  const requests: NetworkRequest[] = []

  page.on('response', (response) => {
    requests.push({
      url: response.url(),
      status: response.status(),
      method: response.request().method(),
    })
  })

  const checkInterval = 500
  const maxChecks = timeout / checkInterval

  for (let i = 0; i < maxChecks; i++) {
    const found = EXPECTED_MAP_REQUESTS.map((expected) => {
      const foundRequest = requests.find((req) => expected.pattern.test(req.url))
      return {
        ...expected,
        found: !!foundRequest,
        status: foundRequest?.status,
      }
    })

    const allFound = found.every((f) => f.found && f.status && f.status < 400)

    if (allFound) {
      return {
        success: true,
        missing: [],
        failed: [],
      }
    }

    await page.waitForTimeout(checkInterval)
  }

  const found = EXPECTED_MAP_REQUESTS.map((expected) => {
    const foundRequest = requests.find((req) => expected.pattern.test(req.url))
    return {
      ...expected,
      found: !!foundRequest,
      status: foundRequest?.status,
      request: foundRequest,
    }
  })

  const missing = found.filter((f) => !f.found).map((f) => f.description)
  const failed = found
    .filter((f): f is typeof f & { request: NonNullable<typeof f.request> } =>
      Boolean(f.found && f.status && f.status >= 400 && f.request),
    )
    .map((f) => f.request)

  return {
    success: missing.length === 0 && failed.length === 0,
    missing,
    failed,
  }
}
