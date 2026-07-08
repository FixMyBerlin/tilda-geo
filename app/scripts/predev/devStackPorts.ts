import { connect } from 'node:net'

export const DEV_DB_PORT = 5432
export const DEV_TILES_PORT = 3000
export const PORT_PROBE_TIMEOUT_MS = 1000

export function probeHostPort(host: string, port: number) {
  return new Promise<'open' | 'closed'>((resolve) => {
    const socket = connect({ host, port })
    const finish = (state: 'open' | 'closed') => {
      clearTimeout(timer)
      socket.removeAllListeners()
      socket.destroy()
      resolve(state)
    }
    const timer = setTimeout(() => finish('closed'), PORT_PROBE_TIMEOUT_MS)
    socket.once('connect', () => finish('open'))
    socket.once('error', () => finish('closed'))
  })
}

function isPortFreeOnHost(host: string, port: number) {
  return probeHostPort(host, port).then((state) => state === 'closed')
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

export function stackIdFromRepoRoot(repoRoot: string) {
  const base = repoRoot.split('/').pop() ?? 'tilda'
  const sanitized = base.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '')
  return `wt_${sanitized || 'geo'}`
}

export function composeContainerPrefixFromStackId(stackId: string) {
  return stackId ? `${stackId}_` : ''
}
