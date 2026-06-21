import { connect } from 'node:net'
import { note } from '@clack/prompts'
import { logErr, logOk } from './predevLog'

const label = 'check_dev_server'
const DEV_HOST = '127.0.0.1'
const DEV_PORT = 5173

function isPortInUse(host: string, port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = connect({ host, port })
    socket.once('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(false)
    })
  })
}

export async function checkDevServer() {
  const inUse = await isPortInUse(DEV_HOST, DEV_PORT)
  if (!inUse) {
    logOk(label)
    return
  }

  note(
    `Only one dev server can run at a time (OSM auth requires ${process.env.VITE_APP_ORIGIN ?? `http://${DEV_HOST}:${DEV_PORT}`}).\n\nStop the other \`nub run dev\` — check other Cursor windows or worktrees.`,
    'Port already in use',
  )
  logErr(label, `port ${DEV_PORT} already in use (another nub run dev?). Stop it first.`)
  process.exit(1)
}

if (import.meta.main) {
  await checkDevServer()
}
