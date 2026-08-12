import { beforeEach, describe, expect, it, vi } from 'vitest'

const s3ObjectExists = vi.fn()
const getS3ObjectJson = vi.fn()

vi.mock('./dataSchemaS3.server', () => ({
  s3ObjectExists: (...args: unknown[]) => s3ObjectExists(...args),
  getS3ObjectJson: (...args: unknown[]) => getS3ObjectJson(...args),
}))

import { resolveLargeForRepublish } from './resolveLargeForRepublish'

describe('resolveLargeForRepublish', () => {
  beforeEach(() => {
    s3ObjectExists.mockReset()
    getS3ObjectJson.mockReset()
  })

  it('returns an explicit override without reading S3', async () => {
    await expect(resolveLargeForRepublish({} as never, 'bucket', 't', true)).resolves.toBe(true)
    await expect(resolveLargeForRepublish({} as never, 'bucket', 't', false)).resolves.toBe(false)
    expect(s3ObjectExists).not.toHaveBeenCalled()
  })

  it('inherits large: true from previous latest/manifest when override is omitted', async () => {
    s3ObjectExists.mockResolvedValue(true)
    getS3ObjectJson.mockResolvedValue({
      manifestVersion: 1,
      table: 'census_population_points',
      publishedAt: '2026-08-01T00:00:00Z',
      snapshotId: null,
      file: { name: 'table.dump', bytes: 1, sha256: 'abc' },
      rowCount: 1,
      large: true,
      pgDumpVersion: '17',
      provenance: { publishedBy: 'x', publishedFrom: 'development' },
    })
    await expect(
      resolveLargeForRepublish({} as never, 'bucket', 'census_population_points', undefined),
    ).resolves.toBe(true)
  })

  it('defaults to false when there is no previous latest/manifest', async () => {
    s3ObjectExists.mockResolvedValue(false)
    await expect(resolveLargeForRepublish({} as never, 'bucket', 't', undefined)).resolves.toBe(
      false,
    )
    expect(getS3ObjectJson).not.toHaveBeenCalled()
  })
})
