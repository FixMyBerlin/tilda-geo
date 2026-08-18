import { describe, expect, it } from 'vitest'
import { parsePullArgs } from './args'

describe('parsePullArgs', () => {
  it('parses --table', () => {
    expect(parsePullArgs(['--table', 'euvm_cutouts_point']).table).toBe('euvm_cutouts_point')
  })

  it('parses --snapshot with --table', () => {
    expect(parsePullArgs(['--table', 'euvm_cutouts_point', '--snapshot', '20260813T0800'])).toEqual(
      {
        table: 'euvm_cutouts_point',
        snapshotId: '20260813T0800',
        help: false,
      },
    )
  })

  it('rejects --snapshot without --table', () => {
    expect(() => parsePullArgs(['--snapshot', '20260813T0800'])).toThrow(
      /--snapshot requires --table/,
    )
  })
})
