import { note } from '@clack/prompts'
import {
  applyDevPortSlotToProcessEnv,
  DEV_VITE_PORT_BASE,
  exitOnInvalidDevPortSlot,
  findFirstFreeDevPortSlot,
  isDevPortSlotMode,
  portsFromSlot,
} from './devPortSlot'
import { probeHostPort } from './devStackPorts'
import { logErr, logOk } from './predevLog'

const label = 'check_dev_server'
const DEV_HOST = '127.0.0.1'

function isPortInUse(host: string, port: number) {
  return probeHostPort(host, port).then((state) => state === 'open')
}

function parallelSlotHint(slot: number) {
  const { vitePort } = portsFromSlot(slot)
  return (
    `Or run this worktree on a parallel port slot: add \`DEV_PORT_SLOT=${slot}\` to .env.local and rerun. ` +
    `Requires the OAuth redirect URL http://127.0.0.1:${vitePort} to be registered.`
  )
}

export async function checkDevServer() {
  exitOnInvalidDevPortSlot(label)
  const { vitePort } = applyDevPortSlotToProcessEnv()
  const inUse = await isPortInUse(DEV_HOST, vitePort)
  if (!inUse) {
    logOk(label)
    return
  }

  const origin =
    process.env.VITE_APP_ORIGIN ??
    `http://${DEV_HOST}:${isDevPortSlotMode() ? vitePort : DEV_VITE_PORT_BASE}`

  let extra = ''
  if (!isDevPortSlotMode()) {
    const freeSlot = await findFirstFreeDevPortSlot()
    if (freeSlot !== undefined) {
      extra = `\n\n${parallelSlotHint(freeSlot)}`
    }
  }

  note(
    `Only one dev server can run at a time (OSM auth requires ${origin}).\n\nStop the other \`bun run dev\` — check other Cursor windows or worktrees.${extra}`,
    'Port already in use',
  )
  logErr(label, `port ${vitePort} already in use (another bun run dev?). Stop it first.`)
  process.exit(1)
}

if (import.meta.main) {
  await checkDevServer()
}
