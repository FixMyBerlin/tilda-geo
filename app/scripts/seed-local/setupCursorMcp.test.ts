import { mkdirSync } from 'node:fs'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test } from 'vitest'
import { LOCAL_DEV_ADMIN_API_TOKEN } from './adminApiToken.const'
import {
  LOCAL_DEV_MCP_SERVER_KEY,
  mergeLocalDevMcpServer,
  offerLocalCursorMcpSetup,
} from './setupCursorMcp'

const previousOrigin = process.env.VITE_APP_ORIGIN

afterEach(() => {
  if (previousOrigin === undefined) {
    Reflect.deleteProperty(process.env, 'VITE_APP_ORIGIN')
  } else {
    process.env.VITE_APP_ORIGIN = previousOrigin
  }
})

describe('mergeLocalDevMcpServer', () => {
  test('adds and replaces only the DEV server key', () => {
    const entry = {
      url: 'http://127.0.0.1:5173/mcp',
      headers: { Authorization: `Bearer ${LOCAL_DEV_ADMIN_API_TOKEN}` },
    }
    const added = mergeLocalDevMcpServer(
      { mcpServers: { other: { url: 'https://example.com' } } },
      entry,
    )
    expect(added.action).toBe('add')
    expect(added.next.mcpServers.other).toEqual({ url: 'https://example.com' })
    expect(added.next.mcpServers[LOCAL_DEV_MCP_SERVER_KEY]).toEqual(entry)

    const replaced = mergeLocalDevMcpServer(
      { mcpServers: { [LOCAL_DEV_MCP_SERVER_KEY]: { url: 'old' }, other: { url: 'keep' } } },
      entry,
    )
    expect(replaced.action).toBe('replace')
    expect(replaced.next.mcpServers.other).toEqual({ url: 'keep' })
  })
})

describe('offerLocalCursorMcpSetup', () => {
  test('skips when mcp.json is missing and prints nothing fatal', async () => {
    process.env.VITE_APP_ORIGIN = 'http://127.0.0.1:5173'
    const home = await mkdtemp(join(tmpdir(), 'tilda-mcp-missing-'))
    mkdirSync(join(home, '.cursor'), { recursive: true })

    const result = await offerLocalCursorMcpSetup({
      homeDir: home,
      isTty: true,
      confirm: async () => true,
    })
    expect(result.status).toBe('skipped')
    if (result.status === 'skipped') expect(result.reason).toBe('missing-file')
  })

  test('adds the DEV entry when confirmed', async () => {
    process.env.VITE_APP_ORIGIN = 'http://127.0.0.1:5173'
    const home = await mkdtemp(join(tmpdir(), 'tilda-mcp-add-'))
    const cursorDir = join(home, '.cursor')
    mkdirSync(cursorDir, { recursive: true })
    const path = join(cursorDir, 'mcp.json')
    await writeFile(path, `${JSON.stringify({ mcpServers: { keep: { url: 'x' } } }, null, 2)}\n`)

    const result = await offerLocalCursorMcpSetup({
      homeDir: home,
      isTty: true,
      confirm: async () => true,
    })
    expect(result.status).toBe('updated')

    const written = JSON.parse(await readFile(path, 'utf8')) as {
      mcpServers: Record<string, { url?: string; headers?: { Authorization?: string } }>
    }
    expect(written.mcpServers.keep).toEqual({ url: 'x' })
    expect(written.mcpServers[LOCAL_DEV_MCP_SERVER_KEY]?.url).toBe('http://127.0.0.1:5173/mcp')
    expect(written.mcpServers[LOCAL_DEV_MCP_SERVER_KEY]?.headers?.Authorization).toBe(
      `Bearer ${LOCAL_DEV_ADMIN_API_TOKEN}`,
    )
  })
})
