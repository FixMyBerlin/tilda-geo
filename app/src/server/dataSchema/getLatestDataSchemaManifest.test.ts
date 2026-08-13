import { describe, expect, it } from 'vitest'
import { buildDataSchemaManifest } from './buildDataSchemaManifest'
import { parseLatestDataSchemaManifest } from './getLatestDataSchemaManifest'

const validManifest = buildDataSchemaManifest({
  table: 'euvm_cutouts_point',
  publishedAt: '2026-08-13T08:00:00Z',
  snapshotId: null,
  bytes: 12,
  sha256: 'a'.repeat(64),
  rowCount: 3,
  publishedBy: 'tester',
  publishedFrom: 'development',
})

describe('parseLatestDataSchemaManifest', () => {
  it('returns a valid manifest', () => {
    expect(parseLatestDataSchemaManifest(validManifest, 'euvm_cutouts_point').table).toBe(
      'euvm_cutouts_point',
    )
  })

  it('throws when latest exists but is invalid so snapshot cannot no-op', () => {
    expect(() =>
      parseLatestDataSchemaManifest({ table: 'euvm_cutouts_point' }, 'euvm_cutouts_point'),
    ).toThrow(/Invalid latest manifest for "euvm_cutouts_point"/)
  })

  it('rejects a valid manifest for a different table', () => {
    expect(() => parseLatestDataSchemaManifest(validManifest, 'other_table')).toThrow(
      /Manifest table mismatch/,
    )
  })
})
