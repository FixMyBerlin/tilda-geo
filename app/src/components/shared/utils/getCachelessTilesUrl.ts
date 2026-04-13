import { z } from 'zod'
import type { EnvironmentValues } from '@/server/envSchema'
import { getTilesUrl } from './getTilesUrl'
import { envKey } from './isEnv'
import { makeOriginFromParts, type UrlParts } from './urlParts'

export const cachelessBaseUrl: Record<EnvironmentValues, UrlParts> = {
  development: { protocol: 'http', host: 'localhost', port: 3000 },
  staging: { protocol: 'https', host: 'staging-cacheless.tilda-geo.de' },
  production: { protocol: 'https', host: 'cacheless.tilda-geo.de' },
}

export const cachelessHostSchema = z.enum([
  cachelessBaseUrl.development.host,
  cachelessBaseUrl.staging.host,
  cachelessBaseUrl.production.host,
])

export const getCachelessTilesUrl = ({ url, cacheless }: { url: string; cacheless: boolean }) => {
  if (!cacheless) return url

  const tilesBase = getTilesUrl()
  const cachelessBase = makeOriginFromParts(cachelessBaseUrl[envKey])

  if (!url.startsWith(tilesBase)) return url
  return `${cachelessBase}${url.slice(tilesBase.length)}`
}
