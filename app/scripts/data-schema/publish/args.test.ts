import { describe, expect, it } from 'vitest'
import { parsePublishArgs } from './args'

describe('parsePublishArgs', () => {
  it('allows omitting --table', () => {
    expect(parsePublishArgs([]).table).toBeUndefined()
  })

  it('parses --mode snapshot', () => {
    expect(parsePublishArgs(['--table', 'euvm_cutouts_point', '--mode', 'snapshot']).mode).toBe(
      'snapshot',
    )
  })

  it('parses --mode override', () => {
    expect(parsePublishArgs(['--table', 'euvm_cutouts_point', '--mode', 'override']).mode).toBe(
      'override',
    )
  })

  it('parses --spec-only', () => {
    expect(parsePublishArgs(['--table', 'euvm_cutouts_point', '--spec-only']).specOnly).toBe(true)
  })

  it('rejects --spec-only with --mode', () => {
    expect(() =>
      parsePublishArgs(['--table', 'euvm_cutouts_point', '--spec-only', '--mode', 'snapshot']),
    ).toThrow(/omit --mode/)
    expect(() =>
      parsePublishArgs(['--table', 'euvm_cutouts_point', '--spec-only', '--mode', 'override']),
    ).toThrow(/omit --mode/)
  })

  it('rejects removed flags', () => {
    expect(() => parsePublishArgs(['--table', 'euvm_cutouts_point', '--snapshot'])).toThrow(
      /Unknown option '--snapshot'/,
    )
    expect(() => parsePublishArgs(['--table', 'euvm_cutouts_point', '--force'])).toThrow(
      /Unknown option '--force'/,
    )
    expect(() => parsePublishArgs(['--table', 'euvm_cutouts_point', '--with-source-file'])).toThrow(
      /Unknown option '--with-source-file'/,
    )
  })
})
