import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { isIntegrationDbAvailable } from '../../../../test/integrationDb'

const integrationDb = await isIntegrationDbAvailable()

const { fetchBoundaryGeometry, requireAdmin } = vi.hoisted(() => ({
  fetchBoundaryGeometry: vi.fn(),
  requireAdmin: vi.fn(),
}))

vi.mock('@/server/regions/masks/fetchBoundaryGeometry.server', () => ({
  fetchBoundaryGeometry,
  BoundaryNotFoundError: class BoundaryNotFoundError extends Error {},
}))

vi.mock('@/server/regions/masks/mapDatasetUploadsS3.server', () => ({
  uploadMapDatasetToS3: vi.fn().mockResolvedValue('https://example.com/e2e-mask.geojson'),
  deleteMapDatasetFromS3: vi.fn().mockResolvedValue(undefined),
  mapDatasetUploadS3Key: vi.fn((slug: string, filename: string) => `${slug}/${filename}`),
}))

vi.mock('@/server/auth/session.server', () => ({
  requireAdmin,
}))

import db from '@/server/db.server'
import { regionMaskUploadSlug } from '@/server/regions/masks/generateRegionMask.server'
import { generateRegionMaskWithData } from '@/server/regions/mutations/generateRegionMask.server'

const REGION_SLUG = 'vitest-mask-regen'
const ADMIN_USER_ID = 'vitest-mask-regen-admin'

describe.skipIf(!integrationDb)('generateRegionMaskWithData (integration)', () => {
  let regionRecordId = ''

  beforeAll(async () => {
    requireAdmin.mockResolvedValue({ userId: ADMIN_USER_ID })
    fetchBoundaryGeometry.mockResolvedValue({
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ],
    })

    await db.region.deleteMany({ where: { slug: REGION_SLUG } })
    await db.mapDatasetUpload.deleteMany({ where: { slug: regionMaskUploadSlug(REGION_SLUG) } })
    await db.user.deleteMany({ where: { id: ADMIN_USER_ID } })

    await db.user.create({
      data: {
        id: ADMIN_USER_ID,
        email: 'vitest-mask-regen@users.openstreetmap.invalid',
        osmId: 1_900_000_003,
        osmName: 'vitest-mask-regen',
        role: 'ADMIN',
      },
    })

    const region = await db.region.create({
      data: {
        slug: REGION_SLUG,
        name: REGION_SLUG,
        fullName: REGION_SLUG,
        categoryAssignments: { create: { categoryId: 'poi', sortOrder: 0 } },
      },
    })
    regionRecordId = String(region.id)
  })

  afterAll(async () => {
    await db.mapDatasetUpload.deleteMany({ where: { slug: regionMaskUploadSlug(REGION_SLUG) } })
    await db.region.deleteMany({ where: { slug: REGION_SLUG } })
    await db.user.deleteMany({ where: { id: ADMIN_USER_ID } })
  })

  test('creates MapDatasetUpload on update, then removes it when mask is disabled', async () => {
    const headers = new Headers()

    const enableResult = await generateRegionMaskWithData(
      {
        slug: REGION_SLUG,
        maskOsmRelationIds: [62422],
        maskBufferKm: 10,
      },
      headers,
    )
    expect(enableResult.success).toBe(true)

    const upload = await db.mapDatasetUpload.findFirst({
      where: { slug: regionMaskUploadSlug(REGION_SLUG), systemLayer: true },
    })
    expect(upload).not.toBeNull()

    const regionWithMask = await db.region.findUniqueOrThrow({ where: { slug: REGION_SLUG } })
    expect(regionWithMask.maskOsmRelationIds).toEqual([62422])

    const disableResult = await generateRegionMaskWithData(
      {
        slug: REGION_SLUG,
        maskOsmRelationIds: [],
        maskBufferKm: 10,
      },
      headers,
    )
    expect(disableResult.success).toBe(true)
    expect(disableResult.message).toMatch(/deaktiviert/)

    const uploadAfterDisable = await db.mapDatasetUpload.findFirst({
      where: { slug: regionMaskUploadSlug(REGION_SLUG), systemLayer: true },
    })
    expect(uploadAfterDisable).toBeNull()

    const regionAfterDisable = await db.region.findUniqueOrThrow({ where: { slug: REGION_SLUG } })
    expect(regionAfterDisable.maskOsmRelationIds).toEqual([])
    expect(regionAfterDisable.maskBufferKm).toBe(10)

    const audit = await db.auditLog.findFirst({
      where: {
        model: 'Region',
        recordId: regionRecordId,
        action: 'UPDATE',
      },
      orderBy: { createdAt: 'desc' },
    })
    expect(audit).not.toBeNull()
    expect(audit?.userId).toBe(ADMIN_USER_ID)
    expect((audit?.metadata as { changeSource?: string } | null)?.changeSource).toBe('ADMIN_FORM')
  })
})
