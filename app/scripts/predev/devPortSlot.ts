import { DEFAULT_DATABASE_PORT, DEFAULT_TILES_PORT } from '@/server/envDefaultPorts'
import { isHostPortAvailable } from './devStackPorts'
import { logErr } from './predevLog'

export const DEV_DB_PORT_BASE = Number(DEFAULT_DATABASE_PORT)
export const DEV_TILES_PORT_BASE = Number(DEFAULT_TILES_PORT)
export const DEV_VITE_PORT_BASE = 5173
export const MAX_DEV_PORT_SLOT = 5

export type DevPortSlotConfig = {
  slot: number
  databasePort: number
  tilesPort: number
  vitePort: number
  appOrigin: string
}

export function devPortSlotErrorMessage(raw: string | undefined) {
  const trimmed = raw?.trim()
  if (!trimmed || trimmed === '0') return undefined
  const n = Number(trimmed)
  if (!Number.isInteger(n) || n < 1 || n > MAX_DEV_PORT_SLOT) {
    return `DEV_PORT_SLOT must be 0 or 1..${MAX_DEV_PORT_SLOT}, got: ${raw}`
  }
  return undefined
}

export function parseDevPortSlot(raw: string | undefined) {
  const err = devPortSlotErrorMessage(raw)
  if (err) throw new Error(err)
  const trimmed = raw?.trim()
  if (!trimmed || trimmed === '0') return 0
  return Number(trimmed)
}

export function exitOnInvalidDevPortSlot(label: string, env: NodeJS.ProcessEnv = process.env) {
  const err = devPortSlotErrorMessage(env.DEV_PORT_SLOT)
  if (!err) return
  logErr(label, err)
  process.exit(1)
}

export function portsFromSlot(slot: number): DevPortSlotConfig {
  if (slot === 0) {
    return {
      slot: 0,
      databasePort: DEV_DB_PORT_BASE,
      tilesPort: DEV_TILES_PORT_BASE,
      vitePort: DEV_VITE_PORT_BASE,
      appOrigin: `http://127.0.0.1:${DEV_VITE_PORT_BASE}`,
    }
  }
  if (slot < 1 || slot > MAX_DEV_PORT_SLOT) {
    throw new Error(`Invalid DEV_PORT_SLOT: ${slot}`)
  }
  const vitePort = DEV_VITE_PORT_BASE + slot
  return {
    slot,
    databasePort: DEV_DB_PORT_BASE + slot,
    tilesPort: DEV_TILES_PORT_BASE + slot,
    vitePort,
    appOrigin: `http://127.0.0.1:${vitePort}`,
  }
}

export function devPortSlotConfigFromEnv(env: NodeJS.ProcessEnv = process.env) {
  return portsFromSlot(parseDevPortSlot(env.DEV_PORT_SLOT))
}

export function isDevPortSlotMode(env: NodeJS.ProcessEnv = process.env) {
  return parseDevPortSlot(env.DEV_PORT_SLOT) > 0
}

/** Slots 1–5 require matching OSM OAuth redirect origins (user-maintained list). */
export function applyDevPortSlotToProcessEnv(env: NodeJS.ProcessEnv = process.env) {
  const config = devPortSlotConfigFromEnv(env)
  if (config.slot === 0) return config

  env.DATABASE_PORT = String(config.databasePort)
  env.TILES_PORT = String(config.tilesPort)
  env.VITE_TILES_PORT = String(config.tilesPort)
  env.DEV_VITE_PORT = String(config.vitePort)
  env.VITE_APP_ORIGIN = config.appOrigin
  return config
}

export async function findFirstFreeDevPortSlot(
  checkPort: (port: number) => Promise<boolean> = isHostPortAvailable,
) {
  for (let slot = 1; slot <= MAX_DEV_PORT_SLOT; slot++) {
    const { databasePort, tilesPort, vitePort } = portsFromSlot(slot)
    const [dbFree, tilesFree, viteFree] = await Promise.all([
      checkPort(databasePort),
      checkPort(tilesPort),
      checkPort(vitePort),
    ])
    if (dbFree && tilesFree && viteFree) return slot
  }
  return undefined
}
