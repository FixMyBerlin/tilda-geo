import { beforeEach, describe, expect, it, vi } from 'vitest'

const s3ObjectExists = vi.fn()

vi.mock('./dataSchemaS3.server', () => ({
  s3ObjectExists: (...args: unknown[]) => s3ObjectExists(...args),
}))

import { resolveLatestDataSchemaDumpKey } from './resolveLatestDataSchemaDumpKey'

const sha256 = 'b'.repeat(64)

describe('resolveLatestDataSchemaDumpKey', () => {
  beforeEach(() => {
    s3ObjectExists.mockReset()
  })

  it('prefers the content-addressed object dump when it exists', async () => {
    s3ObjectExists.mockResolvedValue(true)
    await expect(
      resolveLatestDataSchemaDumpKey({} as never, 'bucket', 'euvm_cutouts_point', sha256),
    ).resolves.toBe(`data-schema/euvm_cutouts_point/objects/${sha256}.dump`)
  })

  it('falls back to latest/table.dump when the object dump is missing', async () => {
    s3ObjectExists.mockResolvedValue(false)
    await expect(
      resolveLatestDataSchemaDumpKey({} as never, 'bucket', 'euvm_cutouts_point', sha256),
    ).resolves.toBe('data-schema/euvm_cutouts_point/latest/table.dump')
  })

  it('falls back to latest/table.dump for non-hex sha256 without calling S3', async () => {
    await expect(
      resolveLatestDataSchemaDumpKey({} as never, 'bucket', 'euvm_cutouts_point', 'abc'),
    ).resolves.toBe('data-schema/euvm_cutouts_point/latest/table.dump')
    expect(s3ObjectExists).not.toHaveBeenCalled()
  })
})
