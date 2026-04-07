import { z } from 'zod'
import type { EnvironmentValues } from '@/server/envSchema'
import { envKey } from './isEnv'
import { makeOriginFromParts, type UrlParts } from './urlParts'

const tilesBaseUrl: Record<EnvironmentValues, UrlParts> = {
  development: { protocol: 'http', host: 'localhost', port: 3000 },
  staging: { protocol: 'https', host: 'staging-tiles.tilda-geo.de' },
  production: { protocol: 'https', host: 'tiles.tilda-geo.de' },
}

export const tilesHostSchema = z.enum([
  tilesBaseUrl.development.host,
  tilesBaseUrl.staging.host,
  tilesBaseUrl.production.host,
])

export const getTilesUrl = (path?: string) => {
  const base = makeOriginFromParts(tilesBaseUrl[envKey])

  if (!path) return base
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${base}/${cleanPath}`
}
