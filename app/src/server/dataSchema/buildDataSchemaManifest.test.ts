import { describe, expect, it } from 'vitest'
import { assertManifestMatchesTable, buildDataSchemaManifest } from './buildDataSchemaManifest'

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
      publishedBy: 'tester',
      publishedFrom: 'development',
    })
    expect(manifest.table).toBe('euvm_cutouts_point')
    expect(() => assertManifestMatchesTable(manifest, 'wrong_table')).toThrow()
  })

  it('keeps optional spec provenance when provided', () => {
    const manifest = buildDataSchemaManifest({
      table: 'euvm_cutouts_point',
      publishedAt: '2026-08-12T10:42:00Z',
      snapshotId: null,
      bytes: 100,
      sha256: 'abc',
      rowCount: 10,
      publishedBy: 'tester',
      publishedFrom: 'staging',
      sourceFile: 'euvm_cutouts_point.geojson',
      specSha256: 'd'.repeat(64),
    })
    expect(manifest.provenance.sourceFile).toBe('euvm_cutouts_point.geojson')
    expect(manifest.provenance.specSha256).toBe('d'.repeat(64))
  })
})
