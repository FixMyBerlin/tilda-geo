import { existsSync, readFileSync, writeFileSync } from 'node:fs'

/** Per-worktree port keys from pre-727fccd predev; safe to delete once all worktrees migrated. */
const LEGACY_PORT_LINE = /^(?:DATABASE_PORT|TILES_PORT|VITE_TILES_PORT)=/

/** Drop legacy per-worktree port keys from older `.env.local` files. Returns true if file changed. */
export function stripLegacyPortsFromEnvLocal(localPath: string) {
  if (!existsSync(localPath)) return false
  const content = readFileSync(localPath, 'utf8')
  const lines = content.split('\n').filter((line) => !LEGACY_PORT_LINE.test(line))
  const cleaned = `${lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd()}\n`
  if (cleaned === content) return false
  writeFileSync(localPath, cleaned)
  return true
}
