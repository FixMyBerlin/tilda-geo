import { describe, expect, it } from 'vitest'
import { parsePublishArgs } from './args'

describe('parsePublishArgs', () => {
  it('parses --snapshot as mode snapshot', () => {
    expect(parsePublishArgs(['--table', 'euvm_cutouts_point', '--snapshot']).mode).toBe('snapshot')
  })

  it('parses --spec-only', () => {
    expect(parsePublishArgs(['--table', 'euvm_cutouts_point', '--spec-only']).specOnly).toBe(true)
  })
})
