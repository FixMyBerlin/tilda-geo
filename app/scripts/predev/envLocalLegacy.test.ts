import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { LEGACY_PORT_KEYS, stripLegacyPortsFromEnvLocal } from './envLocalLegacy'

describe('stripLegacyPortsFromEnvLocal', () => {
  let dir = ''
  let localPath = ''

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('strips all legacy port keys and keeps other lines', () => {
    dir = mkdtempSync(join(tmpdir(), 'env-local-legacy-'))
    localPath = join(dir, '.env.local')
    writeFileSync(
      localPath,
      [
        'DEV_STACK_ID=wt_foo',
        'DATABASE_PORT=5433',
        'TILES_PORT=3001',
        'VITE_TILES_PORT=3001',
        'DEV_VITE_PORT=5174',
        'DEV_OFFSET_PORTS=1',
        'VITE_APP_ORIGIN=http://127.0.0.1:5174',
        'DEV_PORT_SLOT=1',
      ].join('\n'),
    )

    const warn = vi.spyOn(console, 'log').mockImplementation(() => {})
    expect(stripLegacyPortsFromEnvLocal(localPath)).toBe(true)
    expect(readFileSync(localPath, 'utf8')).toBe(
      ['DEV_STACK_ID=wt_foo', 'DEV_PORT_SLOT=1', ''].join('\n'),
    )
    expect(warn).toHaveBeenCalled()
    const warning = String(warn.mock.calls[0]?.[0])
    for (const key of LEGACY_PORT_KEYS) {
      expect(warning).toContain(key)
    }
    expect(warning).toMatch(/DEV_PORT_SLOT=1\.\.5/)
  })

  test('returns false when no legacy keys are present', () => {
    dir = mkdtempSync(join(tmpdir(), 'env-local-legacy-'))
    localPath = join(dir, '.env.local')
    const content = 'DEV_STACK_ID=wt_foo\nDEV_PORT_SLOT=2\n'
    writeFileSync(localPath, content)

    const warn = vi.spyOn(console, 'log').mockImplementation(() => {})
    expect(stripLegacyPortsFromEnvLocal(localPath)).toBe(false)
    expect(readFileSync(localPath, 'utf8')).toBe(content)
    expect(warn).not.toHaveBeenCalled()
  })
})
