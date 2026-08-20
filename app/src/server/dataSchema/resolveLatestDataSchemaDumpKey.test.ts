import { beforeEach, describe, expect, it, vi } from 'vitest'

const s3ObjectExists = vi.fn()

vi.mock('./dataSchemaS3.server', () => ({
  s3ObjectExists: (...args: unknown[]) => s3ObjectExists(...args),
}))

import { resolveDataSchemaDumpKey } from './resolveLatestDataSchemaDumpKey'

describe('resolveDataSchemaDumpKey', () => {
  beforeEach(() => {
    s3ObjectExists.mockReset()
  })

  it('returns data.dump when it exists', async () => {
    s3ObjectExists.mockResolvedValue(true)
    await expect(resolveDataSchemaDumpKey('euvm_cutouts_point')).resolves.toBe(
      'data-schema/euvm_cutouts_point/data.dump',
    )
  })

  it('returns snapshots/<id>/data.dump', async () => {
    s3ObjectExists.mockResolvedValue(true)
    await expect(resolveDataSchemaDumpKey('euvm_cutouts_point', '20260813T0800')).resolves.toBe(
      'data-schema/euvm_cutouts_point/snapshots/20260813T0800/data.dump',
    )
  })

  it('throws when the dump object does not exist', async () => {
    s3ObjectExists.mockResolvedValue(false)
    await expect(resolveDataSchemaDumpKey('euvm_cutouts_point')).rejects.toThrow(
      /No dump object at data-schema\/euvm_cutouts_point\/data\.dump/,
    )
  })
})
