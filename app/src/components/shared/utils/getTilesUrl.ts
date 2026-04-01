import type { AppEnv } from '@/server/envSchema'
import { envKey, isDev } from './isEnv'

const tilesBaseUrl: Record<AppEnv, string> = {
  development: 'http://localhost:3000',
  staging: 'https://staging-tiles.tilda-geo.de',
  production: 'https://tiles.tilda-geo.de',
}

export const getTilesUrl = (path?: string) => {
  const env: AppEnv = import.meta.env.VITE_TILES_ENV ?? envKey
  const base = tilesBaseUrl[env]

  if (!path) return base
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${base}/${cleanPath}`
}

export const makeTileUrlCacheless = ({ url, cacheless }: { url: string; cacheless: boolean }) => {
  return cacheless === true ? url.replace('tiles', 'cacheless') : url
}

export const isDevTilesUrl =
  import.meta.env.VITE_TILES_ENV !== undefined
    ? import.meta.env.VITE_TILES_ENV === 'development'
    : isDev
