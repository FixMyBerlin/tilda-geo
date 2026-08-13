import { describe, expect, it } from 'vitest'
import { parseVerifyArgs } from './args'

describe('parseVerifyArgs', () => {
  it('parses optional --table', () => {
    expect(parseVerifyArgs([]).table).toBeUndefined()
    expect(parseVerifyArgs(['--table', 'euvm_cutouts_point']).table).toBe('euvm_cutouts_point')
  })
})
