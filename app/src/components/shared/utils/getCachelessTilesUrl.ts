import type { EnvironmentValues } from '@/server/envSchema'
import { devTilesPort } from './devTilesPort'
import { getTilesUrl } from './getTilesUrl'
import { envKey } from './isEnv'
import { makeOriginFromParts, type UrlParts } from './urlParts'

const cachelessBaseUrl: Record<EnvironmentValues, UrlParts> = {
  development: { protocol: 'http', host: 'localhost', port: devTilesPort() },
  staging: { protocol: 'https', host: 'staging-cacheless.tilda-geo.de' },
  production: { protocol: 'https', host: 'cacheless.tilda-geo.de' },
}

export const getCachelessTilesUrl = ({ url, cacheless }: { url: string; cacheless: boolean }) => {
  if (!cacheless) return url

  const tilesBase = getTilesUrl()
  const cachelessBase = makeOriginFromParts(cachelessBaseUrl[envKey])

  if (!url.startsWith(tilesBase)) return url
  return `${cachelessBase}${url.slice(tilesBase.length)}`
}
