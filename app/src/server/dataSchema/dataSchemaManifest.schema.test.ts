import { describe, expect, it } from 'vitest'
import { buildDataSchemaManifest } from './buildDataSchemaManifest'
import { parseDataSchemaManifest } from './dataSchemaManifest.schema'

const validManifest = buildDataSchemaManifest({
  table: 'euvm_cutouts_point',
  publishedAt: '2026-08-13T08:00:00Z',
  sha256: 'a'.repeat(64),
  rowCount: 3,
})

describe('parseDataSchemaManifest', () => {
  it('returns a valid manifest', () => {
    expect(parseDataSchemaManifest(validManifest, 'euvm_cutouts_point').table).toBe(
      'euvm_cutouts_point',
    )
  })

  it('throws when latest exists but is invalid so snapshot cannot no-op', () => {
    expect(() =>
      parseDataSchemaManifest({ table: 'euvm_cutouts_point' }, 'euvm_cutouts_point'),
    ).toThrow(/Invalid manifest for "euvm_cutouts_point"/)
  })

  it('rejects a valid manifest for a different table', () => {
    expect(() => parseDataSchemaManifest(validManifest, 'other_table')).toThrow(
      /Manifest table mismatch/,
    )
  })
})
