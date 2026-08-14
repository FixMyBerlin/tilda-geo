import { beforeEach, describe, expect, it, vi } from 'vitest'

const s3ObjectExists = vi.fn()

vi.mock('./dataSchemaS3.server', () => ({
  s3ObjectExists: (...args: unknown[]) => s3ObjectExists(...args),
}))

import { resolveDataSchemaDumpKey } from './resolveLatestDataSchemaDumpKey'

const sha256 = 'b'.repeat(64)

describe('resolveDataSchemaDumpKey', () => {
  beforeEach(() => {
    s3ObjectExists.mockReset()
  })

  it('prefers data.dump when it exists', async () => {
    s3ObjectExists.mockImplementation(async (key: string) => key.endsWith('/data.dump'))
    await expect(resolveDataSchemaDumpKey('euvm_cutouts_point', sha256)).resolves.toBe(
      'data-schema/euvm_cutouts_point/data.dump',
    )
  })

  it('falls back to objects/<sha> for leftover publishes', async () => {
    s3ObjectExists.mockImplementation(async (key: string) => key.includes('/objects/'))
    await expect(resolveDataSchemaDumpKey('euvm_cutouts_point', sha256)).resolves.toBe(
      `data-schema/euvm_cutouts_point/objects/${sha256}.dump`,
    )
  })

  it('falls back to latest/table.dump when data.dump and objects/ are missing', async () => {
    s3ObjectExists.mockImplementation(async (key: string) => key.endsWith('/latest/table.dump'))
    await expect(resolveDataSchemaDumpKey('euvm_cutouts_point', sha256)).resolves.toBe(
      'data-schema/euvm_cutouts_point/latest/table.dump',
    )
  })

  it('prefers snapshots/<id>/data.dump', async () => {
    s3ObjectExists.mockImplementation(
      async (key: string) => key.includes('/snapshots/') && key.endsWith('/data.dump'),
    )
    await expect(
      resolveDataSchemaDumpKey('euvm_cutouts_point', sha256, '20260813T0800'),
    ).resolves.toBe('data-schema/euvm_cutouts_point/snapshots/20260813T0800/data.dump')
  })

  it('falls back to leftover snapshot table.dump', async () => {
    s3ObjectExists.mockImplementation(async (key: string) =>
      key.endsWith('/snapshots/20260813T0800/table.dump'),
    )
    await expect(
      resolveDataSchemaDumpKey('euvm_cutouts_point', sha256, '20260813T0800'),
    ).resolves.toBe('data-schema/euvm_cutouts_point/snapshots/20260813T0800/table.dump')
  })

  it('throws when no dump object exists', async () => {
    s3ObjectExists.mockResolvedValue(false)
    await expect(resolveDataSchemaDumpKey('euvm_cutouts_point', sha256)).rejects.toThrow(
      /No dump object for data\.euvm_cutouts_point/,
    )
  })
})
