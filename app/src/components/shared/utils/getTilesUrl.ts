import type { AppEnv } from '@/server/envSchema'
import { envKey } from './isEnv'

const tilesBaseUrl: Record<AppEnv, string> = {
  development: 'http://localhost:3000',
  staging: 'https://staging-tiles.tilda-geo.de',
  production: 'https://tiles.tilda-geo.de',
}

export const getTilesUrl = (path?: string) => {
  const base = tilesBaseUrl[envKey]

  if (!path) return base
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${base}/${cleanPath}`
}

export const makeTileUrlCacheless = ({ url, cacheless }: { url: string; cacheless: boolean }) => {
  return cacheless === true ? url.replace('tiles', 'cacheless') : url
}

export const isDevTilesUrl = envKey === 'development'
