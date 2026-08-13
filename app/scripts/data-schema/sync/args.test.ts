import { describe, expect, it } from 'vitest'
import { parseSyncArgs } from './args'

describe('parseSyncArgs', () => {
  it('parses --with-raw', () => {
    expect(parseSyncArgs(['--with-raw']).withRaw).toBe(true)
  })
})
