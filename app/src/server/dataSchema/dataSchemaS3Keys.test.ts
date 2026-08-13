import { describe, expect, it } from 'vitest'
import { dataSchemaObjectDumpKey } from './dataSchemaS3Keys'

describe('dataSchemaObjectDumpKey', () => {
  it('builds a content-addressed key', () => {
    const sha256 = 'c'.repeat(64)
    expect(dataSchemaObjectDumpKey('euvm_cutouts_point', sha256)).toBe(
      `data-schema/euvm_cutouts_point/objects/${sha256}.dump`,
    )
  })

  it('rejects a non-hex sha256', () => {
    expect(() => dataSchemaObjectDumpKey('euvm_cutouts_point', 'abc')).toThrow(/64 lowercase hex/)
  })
})
