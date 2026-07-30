import { expect, test } from '@playwright/test'
import {
  createAdminApiToken,
  revokeAdminApiToken,
} from '../../src/server/admin/adminApiTokens.server'
import db from '../../src/server/db.server'

// Exercises the admin REST API end-to-end against the running app (the same path the tilda-geo MCP
// server uses): Bearer auth via guardAdminApi → regionWriteService → DB, with audit attribution.
// Browser form CRUD is covered indirectly (form/list render via admin smoke tests); driving the form
// itself is flaky against the Vite dev server (optimizeDeps mid-session reloads), so the write path
// is verified here through the API instead.

const SLUG = 'e2e-api-region'
const UNKNOWN_SLUG = 'e2e-api-region-does-not-exist'
const TOKEN_NAME = 'e2e-admin-regions-crud'
const USER_EMAIL = 'e2e-admin-regions-crud@users.openstreetmap.invalid'

let token = ''
let tokenId = ''
let userId = ''
let regionRecordId = ''

const regionConfig = {
  slug: SLUG,
  name: 'E2E API Region',
  fullName: 'E2E API Region (full)',
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
}

const authHeaders = (extra?: Record<string, string>) => ({
  Authorization: `Bearer ${token}`,
  ...extra,
})

test.describe('Admin regions REST API CRUD', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    await db.region.deleteMany({ where: { slug: SLUG } })
    const user = await db.user.upsert({
      where: { email: USER_EMAIL },
      update: { role: 'ADMIN' },
      create: { email: USER_EMAIL, osmId: 1_900_000_001, osmName: 'e2e-admin-crud', role: 'ADMIN' },
    })
    userId = user.id
    const created = await createAdminApiToken({ name: TOKEN_NAME, createdById: userId })
    token = created.token
    tokenId = created.row.id
  })

  test.afterAll(async () => {
    await db.region.deleteMany({ where: { slug: SLUG } })
    await db.adminApiToken.deleteMany({ where: { createdById: userId } })
    await db.user.deleteMany({ where: { id: userId } })
  })

  test('rejects requests without a Bearer token (401)', async ({ request }) => {
    const res = await request.get('/api/admin/regions')
    expect(res.status()).toBe(401)
  })

  test('POST creates a region (201) attributed to the token via changeSource API', async ({
    request,
  }) => {
    const res = await request.post('/api/admin/regions', {
      headers: authHeaders(),
      data: regionConfig,
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    expect(body.slug).toBe(SLUG)
    expect(body.categories).toEqual(['poi'])

    const region = await db.region.findUniqueOrThrow({ where: { slug: SLUG } })
    regionRecordId = String(region.id)
    expect(region.maskOsmRelationIds).toEqual([])
    expect(region.maskBufferKm).toBe(10)
    const audit = await db.auditLog.findFirst({
      where: { model: 'Region', recordId: regionRecordId, action: 'CREATE' },
      orderBy: { createdAt: 'desc' },
    })
    expect(audit).not.toBeNull()
    expect(audit?.userId).toBe(userId)
    expect((audit?.metadata as { changeSource?: string } | null)?.changeSource).toBe('API')
    expect((audit?.metadata as { adminTokenId?: string } | null)?.adminTokenId).toBe(tokenId)
  })

  test('GET returns the created region', async ({ request }) => {
    const res = await request.get(`/api/admin/regions/${SLUG}`, { headers: authHeaders() })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.slug).toBe(SLUG)
    expect(body.name).toBe('E2E API Region')
  })

  test('GET audit-log returns history for the created region', async ({ request }) => {
    const res = await request.get(`/api/admin/audit-log?model=Region&recordId=${regionRecordId}`, {
      headers: authHeaders(),
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.rows.length).toBeGreaterThan(0)
    expect(body.rows.some((row: { action: string }) => row.action === 'CREATE')).toBe(true)
  })

  test('PUT updates the region and records UPDATE audit attributed to the token owner', async ({
    request,
  }) => {
    const res = await request.put(`/api/admin/regions/${SLUG}`, {
      headers: authHeaders(),
      data: { ...regionConfig, name: 'E2E API Region (edited)' },
    })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.name).toBe('E2E API Region (edited)')

    const audit = await db.auditLog.findFirst({
      where: { model: 'Region', recordId: regionRecordId, action: 'UPDATE' },
      orderBy: { createdAt: 'desc' },
    })
    expect(audit).not.toBeNull()
    expect(audit?.userId).toBe(userId)
    expect((audit?.metadata as { changeSource?: string } | null)?.changeSource).toBe('API')
    expect((audit?.metadata as { adminTokenId?: string } | null)?.adminTokenId).toBe(tokenId)
  })

  test('PUT unknown slug returns 404', async ({ request }) => {
    const res = await request.put(`/api/admin/regions/${UNKNOWN_SLUG}`, {
      headers: authHeaders(),
      data: { ...regionConfig, slug: UNKNOWN_SLUG },
    })
    expect(res.status()).toBe(404)
  })

  test('POST with an invalid config returns 400', async ({ request }) => {
    const res = await request.post('/api/admin/regions', {
      headers: authHeaders(),
      data: { ...regionConfig, slug: 'another-e2e', categories: [] },
    })
    expect(res.status()).toBe(400)
  })

  test('rejects requests when token owner is no longer admin (401)', async ({ request }) => {
    await db.user.update({ where: { id: userId }, data: { role: 'USER' } })
    const res = await request.get('/api/admin/regions', { headers: authHeaders() })
    expect(res.status()).toBe(401)
    await db.user.update({ where: { id: userId }, data: { role: 'ADMIN' } })
  })

  test('DELETE removes the region, records DELETE audit, then GET → 404', async ({ request }) => {
    const del = await request.delete(`/api/admin/regions/${SLUG}`, { headers: authHeaders() })
    expect(del.status()).toBe(200)

    const audit = await db.auditLog.findFirst({
      where: { model: 'Region', recordId: regionRecordId, action: 'DELETE' },
      orderBy: { createdAt: 'desc' },
    })
    expect(audit).not.toBeNull()
    expect(audit?.userId).toBe(userId)
    expect((audit?.metadata as { changeSource?: string } | null)?.changeSource).toBe('API')
    expect((audit?.metadata as { adminTokenId?: string } | null)?.adminTokenId).toBe(tokenId)

    const res = await request.get(`/api/admin/regions/${SLUG}`, { headers: authHeaders() })
    expect(res.status()).toBe(404)
  })

  test('DELETE unknown slug returns 404', async ({ request }) => {
    const res = await request.delete(`/api/admin/regions/${UNKNOWN_SLUG}`, {
      headers: authHeaders(),
    })
    expect(res.status()).toBe(404)
  })

  test('rejects requests with a revoked token (401)', async ({ request }) => {
    await revokeAdminApiToken(tokenId)
    const res = await request.get('/api/admin/regions', { headers: authHeaders() })
    expect(res.status()).toBe(401)
  })
})
