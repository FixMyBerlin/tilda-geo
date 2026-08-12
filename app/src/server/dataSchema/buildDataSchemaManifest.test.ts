import { describe, expect, it } from 'vitest'
import {
  assertManifestMatchesTable,
  buildDataSchemaManifest,
  inheritLargeFromPreviousManifest,
} from './buildDataSchemaManifest'

describe('assertManifestMatchesTable', () => {
  it('accepts matching table names', () => {
    expect(() =>
      assertManifestMatchesTable({ table: 'euvm_cutouts_point' }, 'euvm_cutouts_point'),
    ).not.toThrow()
  })

  it('rejects a manifest whose table does not match', () => {
    expect(() =>
      assertManifestMatchesTable({ table: 'other_table' }, 'euvm_cutouts_point'),
    ).toThrow(/Manifest table mismatch/)
  })
})

describe('buildDataSchemaManifest', () => {
  it('builds a valid manifest and rejects table mismatch via parse', () => {
    const manifest = buildDataSchemaManifest({
      table: 'euvm_cutouts_point',
      publishedAt: '2026-08-12T10:42:00Z',
      snapshotId: null,
      bytes: 100,
      sha256: 'abc',
      rowCount: 10,
      large: false,
      pgDumpVersion: '17.5',
      publishedBy: 'tester',
      publishedFrom: 'development',
    })
    expect(manifest.table).toBe('euvm_cutouts_point')
    expect(() => assertManifestMatchesTable(manifest, 'wrong_table')).toThrow()
  })
})

describe('inheritLargeFromPreviousManifest', () => {
  it('defaults to false when no previous manifest exists', () => {
    expect(inheritLargeFromPreviousManifest(null)).toBe(false)
    expect(inheritLargeFromPreviousManifest(undefined)).toBe(false)
  })

  it('inherits large: true from a previous latest manifest', () => {
    expect(inheritLargeFromPreviousManifest({ large: true })).toBe(true)
  })

  it('inherits large: false from a previous latest manifest', () => {
    expect(inheritLargeFromPreviousManifest({ large: false })).toBe(false)
  })
})
