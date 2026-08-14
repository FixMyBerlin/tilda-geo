import { describe, expect, it } from 'vitest'
import {
  dataSchemaDumpKey,
  dataSchemaManifestKey,
  dataSchemaSpecKey,
  dataSchemaSnapshotDumpKey,
  dataSchemaSnapshotManifestKey,
} from './dataSchemaS3Keys'

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
})
