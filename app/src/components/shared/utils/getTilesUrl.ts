import { z } from 'zod'
import type { EnvironmentValues } from '@/server/envSchema'
import { devTilesPort } from './devTilesPort'
import { envKey } from './isEnv'
import { makeOriginFromParts, type UrlParts } from './urlParts'

const tilesBaseUrl: Record<EnvironmentValues, UrlParts> = {
  development: { protocol: 'http', host: 'localhost', port: devTilesPort() },
  staging: { protocol: 'https', host: 'staging-tiles.tilda-geo.de' },
  production: { protocol: 'https', host: 'tiles.tilda-geo.de' },
}

export const tilesHostSchema = z.enum([
  tilesBaseUrl.development.host,
  tilesBaseUrl.staging.host,
  tilesBaseUrl.production.host,
])

export const getTilesUrl = (path?: string) => {
  // Self-hosted instances (e.g. Flächenfinder) run their own tile server and set this
  // to override the fixed per-environment host above, which only covers the main deploys.
  const overrideHost = import.meta.env.VITE_TILES_URL
  const base = overrideHost
    ? makeOriginFromParts({ protocol: 'https', host: overrideHost })
    : makeOriginFromParts(tilesBaseUrl[envKey])

  if (!path) return base
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${base}/${cleanPath}`
}
