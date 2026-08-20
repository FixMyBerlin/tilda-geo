import { DEFAULT_TILES_PORT } from '@/server/envDefaultPorts'

/** Local Martin tiles host port — slot mode sets `VITE_TILES_PORT` via predev / vite.config. */
export function devTilesPort() {
  const fromVite = import.meta.env.VITE_TILES_PORT
  if (fromVite) return Number(fromVite)
  const fromEnv = process.env.TILES_PORT ?? process.env.VITE_TILES_PORT
  if (fromEnv) return Number(fromEnv)
  return Number(DEFAULT_TILES_PORT)
}
