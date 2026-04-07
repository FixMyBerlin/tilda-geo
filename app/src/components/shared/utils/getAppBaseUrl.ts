import { z } from 'zod'
import type { EnvironmentValues } from '@/server/envSchema'
import { makeOriginFromParts, type UrlParts } from './urlParts'

export const appBaseUrlParts: Record<EnvironmentValues, UrlParts> = {
  development: { protocol: 'http', host: '127.0.0.1', port: 5173 },
  staging: { protocol: 'https', host: 'staging.tilda-geo.de' },
  production: { protocol: 'https', host: 'tilda-geo.de' },
}

export const appHostSchema = z.enum([
  appBaseUrlParts.development.host,
  appBaseUrlParts.staging.host,
  appBaseUrlParts.production.host,
])

export const getAppBaseUrl = (path?: string, env?: EnvironmentValues) => {
  const environment = env ?? import.meta.env.VITE_APP_ENV
  const base = makeOriginFromParts(appBaseUrlParts[environment])

  if (!path) return base
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${base}/${cleanPath}`
}
