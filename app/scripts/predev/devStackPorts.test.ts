import { createServer } from 'node:net'
import { describe, expect, test } from 'vitest'
import { PORT_PROBE_TIMEOUT_MS, probeHostPort } from './devStackPorts'

async function listenEphemeral() {
  const server = createServer()
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve())
  })
  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('expected TCP address')
  }
  return { server, port: address.port }
}

async function closeServer(server: ReturnType<typeof createServer>) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()))
  })
}

describe('probeHostPort', () => {
  test('returns open when a server is listening', async () => {
    const { server, port } = await listenEphemeral()
    try {
      expect(await probeHostPort('127.0.0.1', port)).toBe('open')
    } finally {
      await closeServer(server)
    }
  })

  test('returns closed when nothing is listening', async () => {
    const { server, port } = await listenEphemeral()
    await closeServer(server)
    expect(await probeHostPort('127.0.0.1', port)).toBe('closed')
  })

  test('resolves within the probe timeout (does not hang)', async () => {
    const started = Date.now()
    await probeHostPort('127.0.0.1', 1)
    expect(Date.now() - started).toBeLessThan(PORT_PROBE_TIMEOUT_MS + 500)
  })
})
