import { describe, expect, it } from 'vitest'
import { parsePullArgs } from './args'

describe('parsePullArgs', () => {
  it('parses --table', () => {
    expect(parsePullArgs(['--table', 'euvm_cutouts_point']).table).toBe('euvm_cutouts_point')
  })
})
