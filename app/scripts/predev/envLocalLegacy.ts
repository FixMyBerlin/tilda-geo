import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { logWarn } from './predevLog'

/** Derived port keys — use DEV_PORT_SLOT in .env.local instead. */
export const LEGACY_PORT_KEYS = [
  'DATABASE_PORT',
  'TILES_PORT',
  'VITE_TILES_PORT',
  'DEV_VITE_PORT',
  'DEV_OFFSET_PORTS',
  'VITE_APP_ORIGIN',
] as const

const LEGACY_PORT_LINE = new RegExp(`^(?:${LEGACY_PORT_KEYS.join('|')})=`)

/** Drop legacy per-worktree port keys from older `.env.local` files. Returns true if file changed. */
export function stripLegacyPortsFromEnvLocal(localPath: string) {
  if (!existsSync(localPath)) return false
  const content = readFileSync(localPath, 'utf8')
  const removed = new Set<string>()
  const lines = content.split('\n').filter((line) => {
    const match = line.match(LEGACY_PORT_LINE)
    if (!match) return true
    const key = line.slice(0, line.indexOf('='))
    removed.add(key)
    return false
  })
  const cleaned = `${lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()}\n`
  if (cleaned === content) return false
  writeFileSync(localPath, cleaned)
  logWarn(
    'env_local',
    `Removed legacy port keys (${[...removed].sort().join(', ')}) from .env.local — use DEV_PORT_SLOT=1..5 instead`,
  )
  return true
}
