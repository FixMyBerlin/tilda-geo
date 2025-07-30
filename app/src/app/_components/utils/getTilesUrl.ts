import { envKey, isDev } from './isEnv'

const tilesBaseUrl = {
  development: 'http://localhost:3000',
  staging: 'https://staging-tiles.tilda-geo.de',
  production: 'https://tiles.tilda-geo.de',
}

export const getTilesUrl = (path?: string) => {
  let base = tilesBaseUrl[envKey]

  // NEXT_PUBLIC_TILES_ENV is a helper for local development
  if (process.env.NEXT_PUBLIC_TILES_ENV) {
    base = tilesBaseUrl[process.env.NEXT_PUBLIC_TILES_ENV]
  }

  if (!path) return base
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${base}/${cleanPath}`
}

export const makeTileUrlCacheless = ({ url, cacheless }: { url: string; cacheless: boolean }) => {
  return cacheless === true ? url.replace('tiles', 'cacheless') : url
}

export const isDevTilesUrl =
  'NEXT_PUBLIC_TILES_ENV' in process.env
    ? process.env.NEXT_PUBLIC_TILES_ENV === 'development'
    : isDev
