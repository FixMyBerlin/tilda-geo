import { describe, expect, it } from 'vitest'
import { asidePgIdentifier } from './pgIdentifier'

describe('asidePgIdentifier', () => {
  it('appends a hash suffix without needing truncation for short names', () => {
    const result = asidePgIdentifier('euvm_cutouts_point_geom_idx', '__old')
    expect(result.endsWith('__old')).toBe(true)
    expect(result.startsWith('euvm_cutouts_point_geom_idx_')).toBe(true)
    expect(new TextEncoder().encode(result).byteLength).toBeLessThanOrEqual(63)
  })

  it('stays within 63 bytes for long base names', () => {
    const longBase = 'a'.repeat(80)
    const result = asidePgIdentifier(longBase, '__old')
    expect(new TextEncoder().encode(result).byteLength).toBe(63)
    expect(result.endsWith('__old')).toBe(true)
    expect(result.startsWith('a')).toBe(true)
  })

  it('produces collision-free aside names for long names sharing a truncated prefix', () => {
    const a = `${'x'.repeat(70)}_alpha`
    const b = `${'x'.repeat(70)}_beta`
    const asideA = asidePgIdentifier(a, '__old')
    const asideB = asidePgIdentifier(b, '__old')
    expect(asideA).not.toBe(asideB)
    expect(new TextEncoder().encode(asideA).byteLength).toBeLessThanOrEqual(63)
    expect(new TextEncoder().encode(asideB).byteLength).toBeLessThanOrEqual(63)
  })

  it('is deterministic so rollback can use a recorded original→aside map', () => {
    const original = 'census_population_points_geom_idx_extra_long_name_padding'
    const aside = asidePgIdentifier(original, '__old')
    expect(asidePgIdentifier(original, '__old')).toBe(aside)
    // String-slicing the suffix would not recover `original` after truncation — use the map.
    const sliced = aside.endsWith('__old') ? aside.slice(0, -'__old'.length) : aside
    expect(sliced).not.toBe(original)
  })

  it('maps owned sequence names aside for rollback (same naming as indexes/constraints)', () => {
    const original = 'euvm_cutouts_point_id_seq'
    const aside = asidePgIdentifier(original, '__old')
    const sequences = [{ from: original, to: aside }]
    expect(sequences[0]!.to).not.toBe(original)
    expect(sequences[0]!.to.endsWith('__old')).toBe(true)
    expect(new TextEncoder().encode(sequences[0]!.to).byteLength).toBeLessThanOrEqual(63)
    // Rollback renames to → from using the recorded map, not string slicing.
    expect(asidePgIdentifier(sequences[0]!.from, '__old')).toBe(sequences[0]!.to)
  })
})
