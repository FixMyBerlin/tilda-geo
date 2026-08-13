import { describe, expect, it } from 'vitest'
import { parseLoadArgs } from './args'

describe('parseLoadArgs', () => {
  it('parses --table and optional --file', () => {
    expect(parseLoadArgs(['--table', 'euvm_cutouts_point']).table).toBe('euvm_cutouts_point')
    expect(parseLoadArgs(['--table', 'euvm_cutouts_point', '--file', '/tmp/a.gpkg']).file).toBe(
      '/tmp/a.gpkg',
    )
  })
})
