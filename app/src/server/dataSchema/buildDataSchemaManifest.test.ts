import { describe, expect, it } from 'vitest'
import { assertManifestMatchesTable, buildDataSchemaManifest } from './buildDataSchemaManifest'
import { dataSchemaManifestSchema } from './dataSchemaManifest.schema'

const sha256 = 'a'.repeat(64)

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
  it('builds a slim pointer manifest', () => {
    const manifest = buildDataSchemaManifest({
      table: 'euvm_cutouts_point',
      publishedAt: '2026-08-12T10:42:00Z',
      sha256,
      rowCount: 10,
    })
    expect(manifest).toEqual({
      table: 'euvm_cutouts_point',
      sha256,
      publishedAt: '2026-08-12T10:42:00Z',
      rowCount: 10,
      snapshotId: null,
    })
    expect(() => assertManifestMatchesTable(manifest, 'wrong_table')).toThrow()
  })
})

describe('dataSchemaManifestSchema', () => {
  it('accepts a current manifest', () => {
    const parsed = dataSchemaManifestSchema.parse({
      table: 'euvm_cutouts_point',
      publishedAt: '2026-08-12T10:42:00Z',
      sha256,
      rowCount: 10,
      snapshotId: null,
    })
    expect(parsed.sha256).toBe(sha256)
  })

  it('rejects a nested file.sha256 without a top-level sha256', () => {
    expect(() =>
      dataSchemaManifestSchema.parse({
        table: 'euvm_cutouts_point',
        publishedAt: '2026-08-12T10:42:00Z',
        file: { sha256 },
        rowCount: 10,
      }),
    ).toThrow()
  })
})
