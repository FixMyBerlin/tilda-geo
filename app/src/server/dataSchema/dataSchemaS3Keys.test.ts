import { describe, expect, it } from 'vitest'
import {
  dataSchemaDumpKey,
  dataSchemaDumpReadKeys,
  dataSchemaLegacyObjectDumpKey,
  dataSchemaManifestKey,
  dataSchemaManifestReadKeys,
  dataSchemaSpecKey,
  dataSchemaSpecReadKeys,
  dataSchemaSnapshotDumpKey,
  dataSchemaSnapshotManifestKey,
} from './dataSchemaS3Keys'

const sha256 = 'c'.repeat(64)

describe('data-schema S3 keys', () => {
  it('uses flat current files under the table prefix', () => {
    expect(dataSchemaSpecKey('euvm_cutouts_point')).toBe('data-schema/euvm_cutouts_point/spec.json')
    expect(dataSchemaDumpKey('euvm_cutouts_point')).toBe('data-schema/euvm_cutouts_point/data.dump')
    expect(dataSchemaManifestKey('euvm_cutouts_point')).toBe(
      'data-schema/euvm_cutouts_point/data.manifest.json',
    )
  })

  it('uses the same filenames inside snapshots/<UTC>/', () => {
    expect(dataSchemaSnapshotDumpKey('euvm_cutouts_point', '20260813T0800')).toBe(
      'data-schema/euvm_cutouts_point/snapshots/20260813T0800/data.dump',
    )
    expect(dataSchemaSnapshotManifestKey('euvm_cutouts_point', '20260813T0800')).toBe(
      'data-schema/euvm_cutouts_point/snapshots/20260813T0800/data.manifest.json',
    )
  })

  it('tries data.dump before leftover hashed or latest dumps', () => {
    expect(dataSchemaDumpReadKeys('euvm_cutouts_point', sha256)).toEqual([
      'data-schema/euvm_cutouts_point/data.dump',
      `data-schema/euvm_cutouts_point/objects/${sha256}.dump`,
      'data-schema/euvm_cutouts_point/latest/table.dump',
    ])
  })

  it('tries spec.json before leftover sources/spec.json', () => {
    expect(dataSchemaSpecReadKeys('euvm_cutouts_point')).toEqual([
      'data-schema/euvm_cutouts_point/spec.json',
      'data-schema/euvm_cutouts_point/sources/spec.json',
    ])
  })

  it('tries data.manifest.json before leftover latest/manifest.json', () => {
    expect(dataSchemaManifestReadKeys('euvm_cutouts_point')).toEqual([
      'data-schema/euvm_cutouts_point/data.manifest.json',
      'data-schema/euvm_cutouts_point/latest/manifest.json',
    ])
  })

  it('tries snapshot data.dump before leftover snapshot table.dump', () => {
    expect(dataSchemaDumpReadKeys('euvm_cutouts_point', sha256, '20260813T0800')).toEqual([
      'data-schema/euvm_cutouts_point/snapshots/20260813T0800/data.dump',
      'data-schema/euvm_cutouts_point/snapshots/20260813T0800/table.dump',
      `data-schema/euvm_cutouts_point/objects/${sha256}.dump`,
    ])
    expect(dataSchemaManifestReadKeys('euvm_cutouts_point', '20260813T0800')).toEqual([
      'data-schema/euvm_cutouts_point/snapshots/20260813T0800/data.manifest.json',
      'data-schema/euvm_cutouts_point/snapshots/20260813T0800/manifest.json',
    ])
  })

  it('rejects a non-hex sha256 for the leftover objects/ key', () => {
    expect(() => dataSchemaLegacyObjectDumpKey('euvm_cutouts_point', 'abc')).toThrow(
      /64 lowercase hex/,
    )
  })
})
