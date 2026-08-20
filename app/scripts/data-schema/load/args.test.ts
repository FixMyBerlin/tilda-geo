import { describe, expect, it } from 'vitest'
import { parseLoadArgs } from './args'

describe('parseLoadArgs', () => {
  it('allows omitting --table', () => {
    expect(parseLoadArgs([]).table).toBeUndefined()
  })

  it('parses --table and optional --file', () => {
    expect(parseLoadArgs(['--table', 'euvm_cutouts_point']).table).toBe('euvm_cutouts_point')
    expect(parseLoadArgs(['--table', 'euvm_cutouts_point', '--file', '/tmp/a.gpkg']).file).toBe(
      '/tmp/a.gpkg',
    )
  })

  it('rejects a table name longer than 63 characters', () => {
    expect(() => parseLoadArgs(['--table', `a${'x'.repeat(63)}`])).toThrow()
  })

  it('rejects removed --with-raw', () => {
    expect(() => parseLoadArgs(['--table', 'euvm_cutouts_point', '--with-raw'])).toThrow(
      /Unknown option '--with-raw'/,
    )
  })
})
