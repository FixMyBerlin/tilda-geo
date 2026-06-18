import { connect } from 'node:net'

const DB_PORT_MIN = 5432
const DB_PORT_MAX = 5499
const TILES_PORT_MIN = 3000
const TILES_PORT_MAX = 3099

export function isPortFreeOnHost(host: string, port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = connect({ host, port })
    socket.once('connect', () => {
      socket.destroy()
      resolve(false)
    })
    socket.once('error', () => {
      socket.destroy()
      resolve(true)
    })
  })
}

/** Host ports published by running Docker containers (`0.0.0.0:5432->5432/tcp`). */
export async function publishedHostPorts() {
  const proc = Bun.spawn(['docker', 'ps', '--format', '{{.Ports}}'], {
    stdout: 'pipe',
    stderr: 'pipe',
  })
  const out = await new Response(proc.stdout).text()
  await proc.exited
  const ports = new Set<number>()
  for (const match of out.matchAll(/:(\d+)->/g)) {
    ports.add(Number(match[1]))
  }
  return ports
}

export async function isHostPortAvailable(port: number, host = '127.0.0.1') {
  const published = await publishedHostPorts()
  if (published.has(port)) return false
  return isPortFreeOnHost(host, port)
}

export async function allocatePortPair() {
  for (let dbPort = DB_PORT_MIN; dbPort <= DB_PORT_MAX; dbPort++) {
    const tilesPort = TILES_PORT_MIN + (dbPort - DB_PORT_MIN)
    if (tilesPort > TILES_PORT_MAX) break
    const dbFree = await isHostPortAvailable(dbPort)
    const tilesFree = await isHostPortAvailable(tilesPort)
    if (dbFree && tilesFree) {
      return { databasePort: dbPort, tilesPort }
    }
  }
  throw new Error(`No free db (${DB_PORT_MIN}-${DB_PORT_MAX}) + tiles port pair found`)
}

export function stackIdFromRepoRoot(repoRoot: string) {
  const base = repoRoot.split('/').pop() ?? 'tilda'
  const sanitized = base.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
  return `wt_${sanitized || 'geo'}`
}

export function composeContainerPrefixFromStackId(stackId: string) {
  return stackId ? `${stackId}_` : ''
}
