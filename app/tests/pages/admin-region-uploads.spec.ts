import { expect, test } from '@playwright/test'
import {
  createAdminApiToken,
  revokeAdminApiToken,
} from '../../src/server/admin/adminApiTokens.server'
import db from '../../src/server/db.server'

// Bearer region-uploads create (same service MCP region_uploads_create uses) → attach welcome.image.

const SLUG = 'e2e-api-region-upload'
const TOKEN_NAME = 'e2e-admin-region-uploads'
const USER_EMAIL = 'e2e-admin-region-uploads@users.openstreetmap.invalid'

// 1×1 PNG
const TINY_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

let token = ''
let tokenId = ''
let userId = ''

const regionConfig = {
  slug: SLUG,
  name: 'E2E Upload Region',
  fullName: 'E2E Upload Region (full)',
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
  welcome: null,
}

const authHeaders = () => ({
  Authorization: `Bearer ${token}`,
})

test.describe('Admin region uploads REST API', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    await db.regionUpload.deleteMany({ where: { region: { slug: SLUG } } })
    await db.region.deleteMany({ where: { slug: SLUG } })
    const user = await db.user.upsert({
      where: { email: USER_EMAIL },
      update: { role: 'ADMIN' },
      create: {
        email: USER_EMAIL,
        osmId: 1_900_000_003,
        osmName: 'e2e-admin-uploads',
        role: 'ADMIN',
      },
    })
    userId = user.id
    const created = await createAdminApiToken({ name: TOKEN_NAME, createdById: userId })
    token = created.token
    tokenId = created.row.id
  })

  test.afterAll(async () => {
    await db.regionUpload.deleteMany({ where: { region: { slug: SLUG } } })
    await db.region.deleteMany({ where: { slug: SLUG } })
    await db.adminApiToken.deleteMany({ where: { createdById: userId } })
    await db.user.deleteMany({ where: { id: userId } })
  })

  test('POST creates a region for upload tests', async ({ request }) => {
    const res = await request.post('/api/admin/regions', {
      headers: authHeaders(),
      data: regionConfig,
    })
    expect(res.status()).toBe(201)
  })

  test('POST /api/admin/region-uploads creates a library row and attaches via welcome.image', async ({
    request,
  }) => {
    const uploadRes = await request.post('/api/admin/region-uploads', {
      headers: authHeaders(),
      data: {
        regionSlug: SLUG,
        filename: 'e2e-welcome.png',
        mimeType: 'image/png',
        contentBase64: TINY_PNG_BASE64,
      },
    })
    expect(uploadRes.status()).toBe(201)
    const uploadBody = await uploadRes.json()
    expect(uploadBody.uploadId).toEqual(expect.any(Number))
    expect(uploadBody.title).toBe('e2e-welcome.png')
    expect(uploadBody.mimeType).toBe('image/png')
    expect(uploadBody.regionSlug).toBe(SLUG)

    const row = await db.regionUpload.findUniqueOrThrow({ where: { id: uploadBody.uploadId } })
    expect(row.title).toBe('e2e-welcome.png')
    expect(row.createdById).toBe(userId)

    const audit = await db.auditLog.findFirst({
      where: { model: 'RegionUpload', recordId: String(uploadBody.uploadId), action: 'CREATE' },
      orderBy: { createdAt: 'desc' },
    })
    expect(audit).not.toBeNull()
    expect((audit?.metadata as { changeSource?: string } | null)?.changeSource).toBe('API')
    expect((audit?.metadata as { adminTokenId?: string } | null)?.adminTokenId).toBe(tokenId)

    const put = await request.put(`/api/admin/regions/${SLUG}`, {
      headers: authHeaders(),
      data: {
        ...regionConfig,
        welcome: {
          enabled: true,
          title: 'E2E Welcome',
          subtitle: null,
          bodyMarkdown: null,
          image: { uploadId: uploadBody.uploadId, altText: 'E2E hero' },
          sections: [],
        },
      },
    })
    expect(put.status()).toBe(200)
    const putBody = await put.json()
    expect(putBody.welcome?.image?.uploadId).toBe(uploadBody.uploadId)
    expect(putBody.welcome?.image?.altText).toBe('E2E hero')

    const region = await db.region.findUniqueOrThrow({ where: { slug: SLUG } })
    expect(region.welcomeImageUploadId).toBe(uploadBody.uploadId)
    expect(region.welcomeImageAltText).toBe('E2E hero')
  })

  test('PUT with an unknown write key returns 400', async ({ request }) => {
    const res = await request.put(`/api/admin/regions/${SLUG}`, {
      headers: authHeaders(),
      data: { ...regionConfig, notAField: true },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.message).toBe('Validation failed')
    expect(body.issues).toEqual(expect.any(Array))
  })

  test('POST upload rejects unknown region', async ({ request }) => {
    const res = await request.post('/api/admin/region-uploads', {
      headers: authHeaders(),
      data: {
        regionSlug: 'e2e-api-region-upload-missing',
        filename: 'x.png',
        mimeType: 'image/png',
        contentBase64: TINY_PNG_BASE64,
      },
    })
    expect(res.status()).toBe(404)
  })

  test('POST upload rejects invalid mime type', async ({ request }) => {
    const res = await request.post('/api/admin/region-uploads', {
      headers: authHeaders(),
      data: {
        regionSlug: SLUG,
        filename: 'x.gif',
        mimeType: 'image/gif',
        contentBase64: TINY_PNG_BASE64,
      },
    })
    expect(res.status()).toBe(400)
  })

  test('POST upload rejects bytes that do not match the declared mime type', async ({
    request,
  }) => {
    const res = await request.post('/api/admin/region-uploads', {
      headers: authHeaders(),
      data: {
        regionSlug: SLUG,
        filename: 'not-a-png.png',
        mimeType: 'image/png',
        contentBase64: Buffer.from('<svg onload="alert(1)" />').toString('base64'),
      },
    })
    expect(res.status()).toBe(400)
  })

  test('rejects revoked token (401)', async ({ request }) => {
    await revokeAdminApiToken(tokenId)
    const res = await request.post('/api/admin/region-uploads', {
      headers: authHeaders(),
      data: {
        regionSlug: SLUG,
        filename: 'x.png',
        mimeType: 'image/png',
        contentBase64: TINY_PNG_BASE64,
      },
    })
    expect(res.status()).toBe(401)
  })
})
