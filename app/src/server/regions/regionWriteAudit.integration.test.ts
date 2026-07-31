import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { adminFormAuditContext } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import type { RegionWriteInput } from '@/server/regions/regionWriteSchema'
import { updateRegionConfig } from '@/server/regions/regionWriteService.server'
import { isIntegrationDbAvailable } from '../../../test/integrationDb'

const integrationDb = await isIntegrationDbAvailable()
const REGION_SLUG = 'vitest-admin-form-audit'
const ADMIN_USER_ID = 'vitest-admin-form-audit-user'

const regionConfig = {
  slug: REGION_SLUG,
  name: 'Vitest admin form audit',
  fullName: 'Vitest admin form audit (full)',
  promoted: false,
  status: 'PUBLIC',
  product: 'radverkehr',
  notes: 'osmNotes',
  showSearch: false,
  mapLat: 52.5,
  mapLng: 13.4,
  mapZoom: 10,
  logoWhiteBackgroundRequired: false,
  headerLogoId: null,
  bbox: null,
  cacheWarming: null,
  categories: ['poi'],
  backgroundSources: [],
  exports: [],
  navigationLinks: [],
  contractId: null,
  maskOsmRelationIds: [],
  maskBufferKm: 10,
} satisfies RegionWriteInput

describe.skipIf(!integrationDb)('region write audit — ADMIN_FORM path (integration)', () => {
  let regionRecordId = ''

  beforeAll(async () => {
    await db.region.deleteMany({ where: { slug: REGION_SLUG } })
    await db.user.deleteMany({ where: { id: ADMIN_USER_ID } })

    await db.user.create({
      data: {
        id: ADMIN_USER_ID,
        email: 'vitest-admin-form-audit@users.openstreetmap.invalid',
        osmId: 1_900_000_004,
        osmName: 'vitest-admin-form-audit',
        role: 'ADMIN',
      },
    })

    await db.region.create({
      data: {
        slug: REGION_SLUG,
        name: regionConfig.name,
        fullName: regionConfig.fullName,
        categoryAssignments: { create: { categoryId: 'poi', sortOrder: 0 } },
      },
    })

    const region = await db.region.findUniqueOrThrow({ where: { slug: REGION_SLUG } })
    regionRecordId = String(region.id)
  })

  afterAll(async () => {
    await db.region.deleteMany({ where: { slug: REGION_SLUG } })
    await db.user.deleteMany({ where: { id: ADMIN_USER_ID } })
  })

  test('updateRegionConfig records userId and ADMIN_FORM changeSource', async () => {
    const headers = new Headers({ 'user-agent': 'vitest-admin-form-audit' })

    await updateRegionConfig(
      REGION_SLUG,
      { ...regionConfig, name: 'Vitest admin form audit (edited)' },
      adminFormAuditContext(headers, ADMIN_USER_ID),
    )

    const audit = await db.auditLog.findFirst({
      where: { model: 'Region', recordId: regionRecordId, action: 'UPDATE' },
      orderBy: { createdAt: 'desc' },
    })

    expect(audit).not.toBeNull()
    expect(audit?.userId).toBe(ADMIN_USER_ID)
    expect((audit?.metadata as { changeSource?: string } | null)?.changeSource).toBe('ADMIN_FORM')
    expect((audit?.metadata as { adminTokenId?: string } | null)?.adminTokenId).toBeUndefined()
  })

  test('updateRegionConfig audits category assignment changes', async () => {
    const headers = new Headers({ 'user-agent': 'vitest-admin-form-audit' })

    await updateRegionConfig(
      REGION_SLUG,
      { ...regionConfig, categories: ['poi', 'roads'] },
      adminFormAuditContext(headers, ADMIN_USER_ID),
    )

    const assignmentAudit = await db.auditLog.findFirst({
      where: {
        model: 'RegionCategoryAssignment',
        action: 'CREATE',
        newData: { path: ['regionId'], equals: Number(regionRecordId) },
        metadata: { path: ['changeSource'], equals: 'ADMIN_FORM' },
      },
      orderBy: { createdAt: 'desc' },
    })

    expect(assignmentAudit).not.toBeNull()
    expect(assignmentAudit?.userId).toBe(ADMIN_USER_ID)
  })
})
