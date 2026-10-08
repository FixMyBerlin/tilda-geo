import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest'
import { isIntegrationDbAvailable } from '../../../test/integrationDb'

const integrationDb = await isIntegrationDbAvailable()

const { requireAdmin } = vi.hoisted(() => ({ requireAdmin: vi.fn() }))

vi.mock('@/server/auth/session.server', () => ({ requireAdmin }))

import { Route as uploadsCreateRoute } from '@/routes/api/uploads.create'
import type { AuditContext } from '@/server/audit/auditContext.server'
import { auditRegionLinksChange } from '@/server/audit/auditRegionLinks.server'
import type { AdminApiCaller } from '@/server/auth/memberCaller.server'
import db from '@/server/db.server'
import { createNoteFolder } from '@/server/notes/mutations/createNoteFolder.server'
import { deleteNoteFolder } from '@/server/notes/mutations/deleteNoteFolder.server'
import { deleteNoteFolderForAdmin } from '@/server/notes/mutations/deleteNoteFolderForAdmin.server'
import { updateNoteFolderForAdmin } from '@/server/notes/mutations/updateNoteFolderForAdmin.server'
import {
  createRegionContract,
  updateRegionContract,
} from '@/server/region-contracts/regionContractWriteService.server'
import { createReviewList } from '@/server/review-lists/mutations/createReviewList.server'
import { deleteReviewList } from '@/server/review-lists/mutations/deleteReviewList.server'
import { deleteReviewListForAdmin } from '@/server/review-lists/mutations/deleteReviewListForAdmin.server'
import { updateReviewListForAdmin } from '@/server/review-lists/mutations/updateReviewListForAdmin.server'
import { deleteMapDatasetUpload } from '@/server/uploads/mapDatasetUploadService.server'

const ADMIN_USER_ID = 'vitest-audit-region-links-admin'
const REGION_A = 'vitest-audit-region-links-a'
const REGION_B = 'vitest-audit-region-links-b'
const CONTRACT_SLUG = 'vitest-audit-region-links-contract'
const UPLOAD_SLUG = 'vitest-audit-region-links-upload'

// Token caller (admin MCP) → changeSource API; plain headers (admin UI) → ADMIN_FORM.
const apiCaller: AdminApiCaller = {
  headers: new Headers({ 'user-agent': 'vitest-audit-region-links' }),
  session: { userId: ADMIN_USER_ID, role: 'ADMIN' },
  adminTokenId: 'vitest-audit-region-links-token',
}
const apiContext: AuditContext = { userId: ADMIN_USER_ID, metadata: { changeSource: 'API' } }
const adminHeaders = new Headers({ 'user-agent': 'vitest-audit-region-links' })

/** All audit rows of one record, oldest first, reduced to what the tests compare. */
async function auditRows(model: string, recordId: number) {
  const rows = await db.auditLog.findMany({
    where: { model, recordId: String(recordId) },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  })
  return rows.map(({ action, changedFields, oldData, newData, userId, metadata }) => ({
    action,
    changedFields,
    oldData,
    newData,
    userId,
    metadata,
  }))
}

const regionsRow = (oldSlugs: string[], newSlugs: string[], changeSource = 'API') => ({
  action: 'UPDATE',
  changedFields: ['regions'],
  oldData: { regionSlugs: oldSlugs },
  newData: { regionSlugs: newSlugs },
  userId: ADMIN_USER_ID,
  metadata: expect.objectContaining({ changeSource }),
})

async function cleanup() {
  await db.noteFolder.deleteMany({ where: { createdById: ADMIN_USER_ID } })
  await db.reviewList.deleteMany({ where: { createdById: ADMIN_USER_ID } })
  await db.mapDatasetUpload.deleteMany({ where: { slug: UPLOAD_SLUG } })
  await db.region.deleteMany({ where: { slug: { in: [REGION_A, REGION_B] } } })
  await db.regionContract.deleteMany({ where: { slug: CONTRACT_SLUG } })
  await db.user.deleteMany({ where: { id: ADMIN_USER_ID } })
}

describe.skipIf(!integrationDb)('region links audit rows (integration)', () => {
  beforeAll(async () => {
    requireAdmin.mockResolvedValue({ userId: ADMIN_USER_ID })
    await cleanup()
    await db.user.create({
      data: {
        id: ADMIN_USER_ID,
        email: 'vitest-audit-region-links@users.openstreetmap.invalid',
        osmId: 1_900_000_011,
        osmName: 'vitest-audit-region-links',
        role: 'ADMIN',
      },
    })
    await db.region.create({ data: { slug: REGION_A } })
    await db.region.create({ data: { slug: REGION_B } })
  })

  afterAll(cleanup)

  test('helper writes nothing for the same slugs in another order', async () => {
    const recordId = 1_900_000_011
    await auditRegionLinksChange(
      {
        model: 'NoteFolder',
        recordId,
        oldRegionSlugs: [REGION_B, REGION_A],
        newRegionSlugs: [REGION_A, REGION_B, REGION_A],
      },
      apiContext,
    )
    expect(await auditRows('NoteFolder', recordId)).toEqual([])
  })

  describe.each([
    {
      model: 'NoteFolder',
      create: (name: string) => createNoteFolder({ regionSlug: REGION_A, name }, apiCaller),
      updateForAdmin: updateNoteFolderForAdmin,
      deleteForMember: (id: number) =>
        deleteNoteFolder({ regionSlug: REGION_A, folderId: id }, apiCaller),
      deleteForAdmin: deleteNoteFolderForAdmin,
    },
    {
      model: 'ReviewList',
      create: (name: string) => createReviewList({ regionSlug: REGION_A, name }, apiCaller),
      updateForAdmin: updateReviewListForAdmin,
      deleteForMember: (id: number) =>
        deleteReviewList({ regionSlug: REGION_A, listId: id }, apiCaller),
      deleteForAdmin: deleteReviewListForAdmin,
    },
  ])('$model', ({ model, create, updateForAdmin, deleteForMember, deleteForAdmin }) => {
    test('create, admin update and admin delete log the region slugs', async () => {
      const { id } = await create('Vitest region links')
      expect(await auditRows(model, id)).toEqual([
        expect.objectContaining({ action: 'CREATE', userId: ADMIN_USER_ID }),
        regionsRow([], [REGION_A]),
      ])

      // Relation-only: the extension writes no row, so the regions row is the only trace.
      const linked = await updateForAdmin(
        id,
        { name: 'Vitest region links', regionSlugs: [REGION_B, REGION_A] },
        apiCaller,
      )
      expect(linked.success).toBe(true)
      expect((await auditRows(model, id)).slice(2)).toEqual([
        regionsRow([REGION_A], [REGION_A, REGION_B]),
      ])

      // Column-only: the automatic row, no regions row.
      await updateForAdmin(
        id,
        { name: 'Vitest region links renamed', regionSlugs: [REGION_A, REGION_B] },
        apiCaller,
      )
      expect((await auditRows(model, id)).slice(3)).toEqual([
        expect.objectContaining({ action: 'UPDATE', changedFields: ['updatedAt', 'name'] }),
      ])

      // Column and relation: the automatic row plus the regions row.
      await updateForAdmin(id, { name: 'Vitest region links', regionSlugs: [REGION_B] }, apiCaller)
      expect((await auditRows(model, id)).slice(4)).toEqual([
        expect.objectContaining({ action: 'UPDATE', changedFields: ['updatedAt', 'name'] }),
        regionsRow([REGION_A, REGION_B], [REGION_B]),
      ])

      // Nothing changed: no row at all.
      await updateForAdmin(id, { name: 'Vitest region links', regionSlugs: [REGION_B] }, apiCaller)
      expect(await auditRows(model, id)).toHaveLength(6)

      await deleteForAdmin({ id }, adminHeaders)
      expect((await auditRows(model, id)).slice(6)).toEqual([
        expect.objectContaining({ action: 'DELETE', userId: ADMIN_USER_ID }),
        regionsRow([REGION_B], [], 'ADMIN_FORM'),
      ])
    })

    test('a failed update logs nothing', async () => {
      const { id } = await create('Vitest region links failed')
      const failed = await updateForAdmin(
        id,
        { name: 'Vitest region links failed', regionSlugs: ['vitest-audit-region-links-nope'] },
        apiCaller,
      )
      expect(failed.success).toBe(false)
      expect(await auditRows(model, id)).toHaveLength(2)
    })

    test('member delete logs the region it was linked to', async () => {
      const { id } = await create('Vitest region links member')
      await deleteForMember(id)
      expect((await auditRows(model, id)).slice(2)).toEqual([
        expect.objectContaining({ action: 'DELETE', userId: ADMIN_USER_ID }),
        regionsRow([REGION_A], []),
      ])
    })
  })

  test('RegionContract: create and update log the region slugs', async () => {
    const config = { slug: CONTRACT_SLUG, name: 'Vitest region links', status: 'ACTIVE' as const }
    const created = await createRegionContract({ ...config, regionSlugs: [REGION_A] }, apiContext)
    expect(created.regionSlugs).toEqual([REGION_A])
    const { id } = created

    const createRows = await auditRows('RegionContract', id)
    expect(createRows).toEqual([
      expect.objectContaining({ action: 'CREATE', userId: ADMIN_USER_ID }),
      regionsRow([], [REGION_A]),
    ])
    // Only columns in the automatic row, no included relations.
    expect(createRows[0]?.newData).not.toHaveProperty('regions')
    expect(createRows[0]?.newData).not.toHaveProperty('_count')

    const relinked = await updateRegionContract(
      CONTRACT_SLUG,
      { ...config, regionSlugs: [REGION_B] },
      apiContext,
    )
    expect(relinked.regionSlugs).toEqual([REGION_B])
    expect((await auditRows('RegionContract', id)).slice(2)).toEqual([
      regionsRow([REGION_A], [REGION_B]),
    ])

    await updateRegionContract(
      CONTRACT_SLUG,
      { ...config, name: 'Vitest region links renamed', regionSlugs: [REGION_A, REGION_B] },
      apiContext,
    )
    expect((await auditRows('RegionContract', id)).slice(3)).toEqual([
      expect.objectContaining({ action: 'UPDATE', changedFields: ['updatedAt', 'name'] }),
      regionsRow([REGION_B], [REGION_A, REGION_B]),
    ])

    await updateRegionContract(
      CONTRACT_SLUG,
      { ...config, name: 'Vitest region links renamed', regionSlugs: [REGION_A, REGION_B] },
      apiContext,
    )
    expect(await auditRows('RegionContract', id)).toHaveLength(5)
  })

  test('MapDatasetUpload: the uploads API and delete log the region slugs', async () => {
    const post = uploadsCreateRoute.options.server?.handlers
    if (!post || typeof post !== 'object' || !('POST' in post) || typeof post.POST !== 'function') {
      throw new Error('expected a POST handler on /api/uploads/create')
    }
    const handler = post.POST as (ctx: { request: Request }) => Promise<Response>
    const upload = async (regionSlugs: string[]) => {
      const response = await handler({
        request: new Request('http://localhost/api/uploads/create', {
          method: 'POST',
          headers: { 'user-agent': 'vitest-audit-region-links' },
          body: JSON.stringify({
            apiKey: process.env.ATLAS_API_KEY,
            uploadSlug: UPLOAD_SLUG,
            regionSlugs,
            isPublic: false,
            hideDownloadLink: false,
            configs: [],
            mapRenderFormat: 'geojson',
            mapRenderUrl: 'https://example.com/vitest.geojson',
            githubUrl: 'https://example.com/vitest',
            systemLayer: false,
          }),
        }),
      })
      expect(response.status).toBe(201)
      const { id } = await db.mapDatasetUpload.findUniqueOrThrow({ where: { slug: UPLOAD_SLUG } })
      return id
    }
    const scriptRegionsRow = (oldSlugs: string[], newSlugs: string[]) => ({
      ...regionsRow(oldSlugs, newSlugs),
      userId: null,
    })

    const firstId = await upload([REGION_A])
    expect(await auditRows('MapDatasetUpload', firstId)).toEqual([
      expect.objectContaining({ action: 'CREATE' }),
      scriptRegionsRow([], [REGION_A]),
    ])

    // Replaced with the same regions: DELETE and CREATE only.
    const sameId = await upload([REGION_A])
    expect(await auditRows('MapDatasetUpload', sameId)).toEqual([
      expect.objectContaining({ action: 'CREATE' }),
    ])

    // Replaced with other regions: the change is logged on the new row.
    const changedId = await upload([REGION_A, REGION_B])
    expect(await auditRows('MapDatasetUpload', changedId)).toEqual([
      expect.objectContaining({ action: 'CREATE' }),
      scriptRegionsRow([REGION_A], [REGION_A, REGION_B]),
    ])

    await deleteMapDatasetUpload(UPLOAD_SLUG, apiContext)
    expect((await auditRows('MapDatasetUpload', changedId)).slice(2)).toEqual([
      expect.objectContaining({ action: 'DELETE', userId: ADMIN_USER_ID }),
      regionsRow([REGION_A, REGION_B], []),
    ])
  })
})
