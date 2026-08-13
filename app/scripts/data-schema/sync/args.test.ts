import { describe, expect, it } from 'vitest'
import { parseSyncArgs } from './args'

describe('parseSyncArgs', () => {
  it('parses --table', () => {
    expect(parseSyncArgs(['--table', 'euvm_cutouts_point']).table).toBe('euvm_cutouts_point')
  })
})
