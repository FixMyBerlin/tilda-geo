import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { createAdminApiToken } from '@/server/admin/adminApiTokens.server'
import { adminApiAuditContext } from '@/server/api/admin/guardAdminApi.server'
import { adminFormAuditContext } from '@/server/audit/auditContext.server'
import db from '@/server/db.server'
import type { RegionWriteInput } from '@/server/regions/regionWriteSchema'
import { updateRegionConfig } from '@/server/regions/regionWriteService.server'
import { isIntegrationDbAvailable } from '../../../test/integrationDb'

const integrationDb = await isIntegrationDbAvailable()
const REGION_SLUG = 'vitest-admin-form-audit'
const API_REGION_SLUG = 'vitest-api-audit'
const ADMIN_USER_ID = 'vitest-admin-form-audit-user'
const API_ADMIN_USER_ID = 'vitest-api-audit-user'

const regionConfig = {
  slug: REGION_SLUG,
  name: 'Vitest admin form audit',
  fullName: 'Vitest admin form audit (full)',
  promoted: false,
  status: 'PUBLIC',
  product: 'radverkehr',
  notes: 'osmNotes',
  showSearch: false,
  spaceFinderEnabled: true,
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
  welcome: null,
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

  test('updateRegionConfig audits welcome fields on Region', async () => {
    const headers = new Headers({ 'user-agent': 'vitest-admin-form-audit' })

    await updateRegionConfig(
      REGION_SLUG,
      {
        ...regionConfig,
        welcome: {
          enabled: true,
          title: 'Willkommen in Vitest',
          subtitle: 'Test',
          bodyMarkdown: 'Intro',
          image: null,
          sections: [{ title: 'FAQ', bodyMarkdown: 'Antwort', sortOrder: 0 }],
        },
      },
      adminFormAuditContext(headers, ADMIN_USER_ID),
    )

    const regionAudit = await db.auditLog.findFirst({
      where: {
        model: 'Region',
        recordId: regionRecordId,
        action: 'UPDATE',
        metadata: { path: ['changeSource'], equals: 'ADMIN_FORM' },
      },
      orderBy: { createdAt: 'desc' },
    })

    expect(regionAudit).not.toBeNull()
    expect(regionAudit?.userId).toBe(ADMIN_USER_ID)
    const changedFields = (regionAudit?.metadata as { changedFields?: string[] } | null)
      ?.changedFields
    expect(changedFields).toEqual(
      expect.arrayContaining(['welcomeEnabled', 'welcomeTitle', 'welcomeSections']),
    )
  })
})

describe.skipIf(!integrationDb)('region write audit — API path (integration)', () => {
  let regionRecordId = ''
  let adminTokenId = ''

  beforeAll(async () => {
    await db.region.deleteMany({ where: { slug: API_REGION_SLUG } })
    await db.user.deleteMany({ where: { id: API_ADMIN_USER_ID } })
    await db.adminApiToken.deleteMany({ where: { createdById: API_ADMIN_USER_ID } })

    await db.user.create({
      data: {
        id: API_ADMIN_USER_ID,
        email: 'vitest-api-audit@users.openstreetmap.invalid',
        osmId: 1_900_000_005,
        osmName: 'vitest-api-audit',
        role: 'ADMIN',
      },
    })

    const { row } = await createAdminApiToken({
      name: 'vitest-api-audit',
      createdById: API_ADMIN_USER_ID,
    })
    adminTokenId = row.id

    await db.region.create({
      data: {
        slug: API_REGION_SLUG,
        name: regionConfig.name,
        fullName: regionConfig.fullName,
        categoryAssignments: { create: { categoryId: 'poi', sortOrder: 0 } },
      },
    })

    const region = await db.region.findUniqueOrThrow({ where: { slug: API_REGION_SLUG } })
    regionRecordId = String(region.id)
  })

  afterAll(async () => {
    await db.adminApiToken.deleteMany({ where: { createdById: API_ADMIN_USER_ID } })
    await db.region.deleteMany({ where: { slug: API_REGION_SLUG } })
    await db.user.deleteMany({ where: { id: API_ADMIN_USER_ID } })
  })

  test('updateRegionConfig audits welcome fields on Region with API changeSource and token attribution', async () => {
    const request = new Request('http://localhost', {
      headers: { 'user-agent': 'vitest-api-audit' },
    })
    const auditContext = adminApiAuditContext(
      { tokenId: adminTokenId, createdById: API_ADMIN_USER_ID, changeSource: 'API' },
      request,
    )

    await updateRegionConfig(
      API_REGION_SLUG,
      {
        ...regionConfig,
        slug: API_REGION_SLUG,
        welcome: {
          enabled: true,
          title: 'Willkommen via API',
          subtitle: 'Test',
          bodyMarkdown: 'Intro',
          image: null,
          sections: [{ title: 'FAQ', bodyMarkdown: 'Antwort', sortOrder: 0 }],
        },
      },
      auditContext,
    )

    const regionAudit = await db.auditLog.findFirst({
      where: {
        model: 'Region',
        recordId: regionRecordId,
        action: 'UPDATE',
        metadata: { path: ['changeSource'], equals: 'API' },
      },
      orderBy: { createdAt: 'desc' },
    })

    expect(regionAudit).not.toBeNull()
    expect(regionAudit?.userId).toBe(API_ADMIN_USER_ID)
    expect((regionAudit?.metadata as { adminTokenId?: string } | null)?.adminTokenId).toBe(
      adminTokenId,
    )
    const changedFields = (regionAudit?.metadata as { changedFields?: string[] } | null)
      ?.changedFields
    expect(changedFields).toEqual(
      expect.arrayContaining(['welcomeEnabled', 'welcomeTitle', 'welcomeSections']),
    )
  })
})
