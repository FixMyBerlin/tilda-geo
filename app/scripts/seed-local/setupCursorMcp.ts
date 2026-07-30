import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import * as p from '@clack/prompts'
import { buildMcpCursorConfigJson } from '@/server/mcp/mcpCursorConfig'
import { LOCAL_DEV_ADMIN_API_TOKEN } from './adminApiToken.const'

export const LOCAL_DEV_MCP_SERVER_KEY = 'tilda-geo-admin--DEV' as const

function mcpConfigPath(home = homedir()) {
  return join(home, '.cursor', 'mcp.json')
}

function resolveLocalMcpOrigin() {
  const origin = process.env.VITE_APP_ORIGIN?.trim()
  if (!origin) {
    throw new Error('VITE_APP_ORIGIN is unset; cannot build local MCP URL.')
  }
  const url = new URL(origin)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`VITE_APP_ORIGIN must be http(s) (got ${url.protocol}).`)
  }
  return url.origin
}

export function buildLocalDevMcpServerEntry(origin = resolveLocalMcpOrigin()) {
  const parsed = JSON.parse(
    buildMcpCursorConfigJson({
      envLabel: 'DEV',
      origin,
      apiToken: LOCAL_DEV_ADMIN_API_TOKEN,
    }),
  ) as { mcpServers: Record<string, unknown> }
  return parsed.mcpServers[LOCAL_DEV_MCP_SERVER_KEY]
}

export function formatManualLocalDevMcpJson(origin = resolveLocalMcpOrigin()) {
  return buildMcpCursorConfigJson({
    envLabel: 'DEV',
    origin,
    apiToken: LOCAL_DEV_ADMIN_API_TOKEN,
  })
}

export function mergeLocalDevMcpServer(
  existing: unknown,
  serverEntry: unknown,
): { next: { mcpServers: Record<string, unknown> }; action: 'add' | 'replace' | 'unchanged' } {
  const root =
    existing && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {}
  const mcpServers =
    root.mcpServers && typeof root.mcpServers === 'object' && !Array.isArray(root.mcpServers)
      ? { ...(root.mcpServers as Record<string, unknown>) }
      : {}

  const previous = mcpServers[LOCAL_DEV_MCP_SERVER_KEY]
  if (JSON.stringify(previous) === JSON.stringify(serverEntry)) {
    return {
      next: { ...root, mcpServers: { ...mcpServers, [LOCAL_DEV_MCP_SERVER_KEY]: serverEntry } },
      action: 'unchanged',
    }
  }

  return {
    next: { ...root, mcpServers: { ...mcpServers, [LOCAL_DEV_MCP_SERVER_KEY]: serverEntry } },
    action: previous === undefined ? 'add' : 'replace',
  }
}

/**
 * Optionally add/update tilda-geo-admin--DEV in an existing ~/.cursor/mcp.json.
 * Never creates the file. Never throws — seed/restore must not fail on Cursor config issues.
 */
export async function offerLocalCursorMcpSetup(options?: {
  homeDir?: string
  isTty?: boolean
  confirm?: (message: string) => Promise<boolean>
}) {
  try {
    return await offerLocalCursorMcpSetupInner(options)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`Cursor MCP setup skipped with error: ${message}`)
    return { status: 'skipped' as const, reason: message }
  }
}

async function offerLocalCursorMcpSetupInner(options?: {
  homeDir?: string
  isTty?: boolean
  confirm?: (message: string) => Promise<boolean>
}) {
  const homeDir = options?.homeDir ?? homedir()
  const isTty = options?.isTty ?? Boolean(process.stdin.isTTY)
  const path = mcpConfigPath(homeDir)

  let origin: string
  let manualJson: string
  try {
    origin = resolveLocalMcpOrigin()
    manualJson = formatManualLocalDevMcpJson(origin)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    process.stdout.write(`Skipped Cursor MCP config: ${message}\n`)
    return { status: 'skipped' as const, reason: message }
  }

  if (!existsSync(path)) {
    process.stdout.write(
      [
        `Skipped: ${path} does not exist (will not create it).`,
        'Add this manually to ~/.cursor/mcp.json:',
        manualJson,
        '',
      ].join('\n'),
    )
    return { status: 'skipped' as const, reason: 'missing-file' }
  }

  if (!isTty) {
    process.stdout.write(
      [`Skipped Cursor MCP prompt (non-interactive). Merge into ${path}:`, manualJson, ''].join(
        '\n',
      ),
    )
    return { status: 'skipped' as const, reason: 'non-tty' }
  }

  let existing: unknown
  try {
    existing = JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    process.stdout.write(
      [`Skipped: could not parse ${path} (${message}).`, 'Merge manually:', manualJson, ''].join(
        '\n',
      ),
    )
    return { status: 'skipped' as const, reason: 'parse-error' }
  }

  const serverEntry = buildLocalDevMcpServerEntry(origin)
  const { next, action } = mergeLocalDevMcpServer(existing, serverEntry)
  if (action === 'unchanged') {
    process.stdout.write(`Cursor MCP already configured (${LOCAL_DEV_MCP_SERVER_KEY}).\n`)
    return { status: 'unchanged' as const }
  }

  p.note(
    [
      `File: ${path}`,
      `Action: ${action} ${LOCAL_DEV_MCP_SERVER_KEY}`,
      `URL: ${new URL('/mcp', origin).href}`,
      `Authorization: Bearer ${LOCAL_DEV_ADMIN_API_TOKEN}`,
      'Other mcpServers entries are preserved.',
    ].join('\n'),
    'Cursor MCP config',
  )

  const confirm =
    options?.confirm ??
    (async (message: string) => {
      const answer = await p.confirm({ message, initialValue: false })
      return !p.isCancel(answer) && answer === true
    })

  const ok = await confirm(`Update ${path}?`)
  if (!ok) {
    process.stdout.write(['Declined. Manual entry:', manualJson, ''].join('\n'))
    return { status: 'declined' as const }
  }

  await writeFile(path, `${JSON.stringify(next, null, 2)}\n`)
  process.stdout.write(`Updated ${path} (${action} ${LOCAL_DEV_MCP_SERVER_KEY}).\n`)
  return { status: 'updated' as const, action }
}
