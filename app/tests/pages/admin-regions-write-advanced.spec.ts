import { expect, test } from '@playwright/test'
import { createAdminApiToken } from '../../src/server/admin/adminApiTokens.server'
import db from '../../src/server/db.server'
import { regionMaskUploadSlug } from '../../src/server/regions/masks/generateRegionMask.server'

const JOIN_SLUG = 'e2e-api-region-join'
const DELETE_BLOCK_SLUG = 'e2e-api-region-delete-block'
const LOGO_REGION_A = 'e2e-api-region-logo-a'
const LOGO_REGION_B = 'e2e-api-region-logo-b'
const TOKEN_NAME = 'e2e-admin-regions-write-advanced'
const USER_EMAIL = 'e2e-admin-regions-write-advanced@users.openstreetmap.invalid'

const TEST_SLUGS = [JOIN_SLUG, DELETE_BLOCK_SLUG, LOGO_REGION_A, LOGO_REGION_B]

let token = ''
let userId = ''

const baseRegionConfig = (slug: string) => ({
  slug,
  name: `E2E ${slug}`,
  fullName: `E2E ${slug} (full)`,
  promoted: false,
  status: 'PUBLIC' as const,
  product: 'radverkehr' as const,
  notes: 'osmNotes' as const,
  showSearch: false,
  mapLat: 52.5,
  mapLng: 13.4,
  mapZoom: 10,
  logoWhiteBackgroundRequired: false,
  headerLogoId: null,
  bbox: null,
  cacheWarming: null,
  categories: ['poi'],
  backgroundSources: [] as string[],
  exports: [] as string[],
  navigationLinks: [] as Array<{
    name: string
    internalPath: string | null
    externalUrl: string | null
    sortOrder: number
  }>,
  contractId: null,
  maskOsmRelationIds: [] as number[],
  maskBufferKm: 10,
  welcome: null,
})

const authHeaders = () => ({
  Authorization: `Bearer ${token}`,
})

test.describe('Admin regions REST API — advanced writes', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    await db.region.deleteMany({ where: { slug: { in: TEST_SLUGS } } })
    const user = await db.user.upsert({
      where: { email: USER_EMAIL },
      update: { role: 'ADMIN' },
      create: { email: USER_EMAIL, osmId: 1_900_000_002, osmName: 'e2e-advanced', role: 'ADMIN' },
    })
    userId = user.id
    const created = await createAdminApiToken({ name: TOKEN_NAME, createdById: userId })
    token = created.token
  })

  test.afterAll(async () => {
    await db.mapDatasetUpload.deleteMany({
      where: { slug: regionMaskUploadSlug(DELETE_BLOCK_SLUG) },
    })
    await db.region.deleteMany({ where: { slug: { in: TEST_SLUGS } } })
    await db.adminApiToken.deleteMany({ where: { createdById: userId } })
    await db.user.deleteMany({ where: { id: userId } })
  })

  test('PUT replaces join-table rows with correct sortOrder and clears removed assignments', async ({
    request,
  }) => {
    const initial = {
      ...baseRegionConfig(JOIN_SLUG),
      categories: ['poi', 'roads'],
      exports: ['parkings'],
      bbox: [13.0, 52.0, 14.0, 53.0],
      navigationLinks: [{ name: 'Docs', internalPath: '/docs', externalUrl: null, sortOrder: 0 }],
    }

    const createRes = await request.post('/api/admin/regions', {
      headers: authHeaders(),
      data: initial,
    })
    expect(createRes.status()).toBe(201)

    const region = await db.region.findUniqueOrThrow({
      where: { slug: JOIN_SLUG },
      include: {
        categoryAssignments: { orderBy: { sortOrder: 'asc' } },
        exportAssignments: { orderBy: { exportId: 'asc' } },
        navigationLinks: { orderBy: { sortOrder: 'asc' } },
      },
    })
    expect(region.categoryAssignments.map((row) => row.categoryId)).toEqual(['poi', 'roads'])
    expect(region.categoryAssignments.map((row) => row.sortOrder)).toEqual([0, 1])
    expect(region.exportAssignments.map((row) => row.exportId)).toEqual(['parkings'])
    expect(region.navigationLinks).toHaveLength(1)

    const updateRes = await request.put(`/api/admin/regions/${JOIN_SLUG}`, {
      headers: authHeaders(),
      data: {
        ...initial,
        categories: ['bikelanes'],
        exports: [],
        bbox: null,
        navigationLinks: [],
      },
    })
    expect(updateRes.status()).toBe(200)
    const body = await updateRes.json()
    expect(body.categories).toEqual(['bikelanes'])
    expect(body.exports).toEqual([])
    expect(body.navigationLinks).toEqual([])

    const updated = await db.region.findUniqueOrThrow({
      where: { slug: JOIN_SLUG },
      include: {
        categoryAssignments: { orderBy: { sortOrder: 'asc' } },
        exportAssignments: true,
        navigationLinks: true,
        backgroundAssignments: true,
      },
    })
    expect(updated.categoryAssignments).toHaveLength(1)
    expect(updated.categoryAssignments[0]?.categoryId).toBe('bikelanes')
    expect(updated.categoryAssignments[0]?.sortOrder).toBe(0)
    expect(updated.exportAssignments).toHaveLength(0)
    expect(updated.navigationLinks).toHaveLength(0)
    expect(updated.backgroundAssignments).toHaveLength(0)
  })

  test('DELETE returns 409 when mapDatasetUploads block deletion', async ({ request }) => {
    const config = baseRegionConfig(DELETE_BLOCK_SLUG)
    const createRes = await request.post('/api/admin/regions', {
      headers: authHeaders(),
      data: config,
    })
    expect(createRes.status()).toBe(201)

    const region = await db.region.findUniqueOrThrow({ where: { slug: DELETE_BLOCK_SLUG } })
    await db.mapDatasetUpload.create({
      data: {
        slug: regionMaskUploadSlug(DELETE_BLOCK_SLUG),
        configs: [],
        public: true,
        hideDownloadLink: true,
        mapRenderFormat: 'geojson',
        mapRenderUrl: 'https://example.com/e2e-mask.geojson',
        githubUrl: '',
        geojsonUrl: 'https://example.com/e2e-mask.geojson',
        systemLayer: true,
        regions: { connect: { id: region.id } },
      },
    })

    const del = await request.delete(`/api/admin/regions/${DELETE_BLOCK_SLUG}`, {
      headers: authHeaders(),
    })
    expect(del.status()).toBe(409)
    const body = await del.json()
    expect(body.message).toMatch(/Map-Dataset-Upload/)

    await db.region.findUniqueOrThrow({ where: { slug: DELETE_BLOCK_SLUG } })
  })

  test('POST rejects headerLogoId on CREATE', async ({ request }) => {
    const regionAConfig = baseRegionConfig(LOGO_REGION_A)
    const createA = await request.post('/api/admin/regions', {
      headers: authHeaders(),
      data: regionAConfig,
    })
    expect(createA.status()).toBe(201)

    const regionA = await db.region.findUniqueOrThrow({ where: { slug: LOGO_REGION_A } })
    const upload = await db.regionUpload.create({
      data: {
        title: 'E2E logo A',
        s3Key: `e2e/${LOGO_REGION_A}/logo.png`,
        mimeType: 'image/png',
        fileSize: 100,
        regionId: regionA.id,
        createdById: userId,
      },
    })

    const createB = await request.post('/api/admin/regions', {
      headers: authHeaders(),
      data: { ...baseRegionConfig(LOGO_REGION_B), headerLogoId: upload.id },
    })
    expect(createB.status()).toBe(400)
    const body = await createB.json()
    expect(body.message).toMatch(/Header-Logo kann beim Anlegen nicht gesetzt werden/)

    await db.region.deleteMany({ where: { slug: LOGO_REGION_B } })
  })

  test('PUT rejects headerLogoId from another region', async ({ request }) => {
    const regionA = await db.region.findUniqueOrThrow({ where: { slug: LOGO_REGION_A } })
    const upload = await db.regionUpload.findFirstOrThrow({ where: { regionId: regionA.id } })

    const createB = await request.post('/api/admin/regions', {
      headers: authHeaders(),
      data: baseRegionConfig(LOGO_REGION_B),
    })
    expect(createB.status()).toBe(201)

    const put = await request.put(`/api/admin/regions/${LOGO_REGION_B}`, {
      headers: authHeaders(),
      data: { ...baseRegionConfig(LOGO_REGION_B), headerLogoId: upload.id },
    })
    expect(put.status()).toBe(400)
    const body = await put.json()
    expect(body.message).toMatch(/gehört nicht zu dieser Region/)
  })
})
