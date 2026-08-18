import { describe, expect, it } from 'vitest'
import {
  dataSchemaDumpKey,
  dataSchemaManifestKey,
  dataSchemaSpecKey,
  dataSchemaSnapshotDumpKey,
  dataSchemaSnapshotId,
  dataSchemaSnapshotManifestKey,
  dataSchemaSnapshotSpecKey,
  parseDataSchemaSnapshotFolder,
  parseDataSchemaTableFolder,
} from './dataSchemaS3Keys'

describe('data-schema S3 keys', () => {
  it('uses flat current files under the table prefix', () => {
    expect(dataSchemaSpecKey('euvm_cutouts_point')).toBe('data-schema/euvm_cutouts_point/spec.json')
    expect(dataSchemaDumpKey('euvm_cutouts_point')).toBe('data-schema/euvm_cutouts_point/data.dump')
    expect(dataSchemaManifestKey('euvm_cutouts_point')).toBe(
      'data-schema/euvm_cutouts_point/data.manifest.json',
    )
  })

  it('formats snapshot ids in UTC, not local time', () => {
    expect(dataSchemaSnapshotId(new Date('2026-08-13T08:00:00Z'))).toBe('20260813T0800')
    expect(dataSchemaSnapshotId(new Date('2026-08-13T00:30:00Z'))).toBe('20260813T0030')
  })

  it('uses the same filenames inside snapshots/<UTC>/', () => {
    expect(dataSchemaSnapshotSpecKey('euvm_cutouts_point', '20260813T0800')).toBe(
      'data-schema/euvm_cutouts_point/snapshots/20260813T0800/spec.json',
    )
    expect(dataSchemaSnapshotDumpKey('euvm_cutouts_point', '20260813T0800')).toBe(
      'data-schema/euvm_cutouts_point/snapshots/20260813T0800/data.dump',
    )
    expect(dataSchemaSnapshotManifestKey('euvm_cutouts_point', '20260813T0800')).toBe(
      'data-schema/euvm_cutouts_point/snapshots/20260813T0800/data.manifest.json',
    )
  })

  it('parses table and snapshot folders from S3 common prefixes', () => {
    expect(parseDataSchemaTableFolder('data-schema/euvm_cutouts_point/')).toBe('euvm_cutouts_point')
    expect(parseDataSchemaTableFolder('data-schema/NotValid/')).toBeNull()
    expect(
      parseDataSchemaSnapshotFolder(
        'data-schema/euvm_cutouts_point/snapshots/20260813T0800/',
        'euvm_cutouts_point',
      ),
    ).toBe('20260813T0800')
    expect(
      parseDataSchemaSnapshotFolder(
        'data-schema/euvm_cutouts_point/snapshots/not-a-snapshot/',
        'euvm_cutouts_point',
      ),
    ).toBeNull()
  })
})
