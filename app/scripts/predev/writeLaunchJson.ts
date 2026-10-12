import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { applyDevPortSlotToProcessEnv, exitOnInvalidDevPortSlot } from './devPortSlot'
import { logOk } from './predevLog'

const label = 'launch_json'

/**
 * `app/.claude/launch.json` for the Claude desktop preview. The file has to name a fixed port, so
 * predev writes it from this checkout's `DEV_PORT_SLOT` instead of committing one for 5173
 * (git-ignored; every worktree gets its own).
 */
export function buildLaunchJson(vitePort: number) {
  return {
    version: '0.0.1',
    configurations: [
      {
        name: 'tilda-app',
        runtimeExecutable: 'bun',
        // Same env files as `bun run dev`, so vite.config.ts applies the slot (ports, db, origin).
        runtimeArgs: ['--env-file=../.env', '--env-file=../.env.local', 'run', 'dev:vite'],
        port: vitePort,
        // 127.0.0.1, not localhost: OSM OAuth only accepts the registered 127.0.0.1 origins.
        url: `http://127.0.0.1:${vitePort}`,
      },
    ],
  }
}

export function writeLaunchJson(appDir: string) {
  const { vitePort } = applyDevPortSlotToProcessEnv()
  const filePath = path.join(appDir, '.claude', 'launch.json')
  const content = `${JSON.stringify(buildLaunchJson(vitePort), null, 2)}\n`
  const current = existsSync(filePath) ? readFileSync(filePath, 'utf8') : undefined
  if (current === content) return { changed: false }

  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, content)
  return { changed: true }
}

if (import.meta.main) {
  exitOnInvalidDevPortSlot(label)
  const { changed } = writeLaunchJson(path.resolve(import.meta.dir, '../..'))
  logOk(changed ? `${label} (wrote .claude/launch.json)` : label)
}
