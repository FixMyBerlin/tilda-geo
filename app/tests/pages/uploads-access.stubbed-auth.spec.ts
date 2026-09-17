import { expect, test } from '@playwright/test'
import db from '../../src/server/db.server'
import { cleanupStubbedSessionData, createStubbedUserSession } from '../fixtures/auth'

// Non-public static dataset files are member/admin-only on the file route itself, so knowing the
// URL is not enough. The guard logic is unit-tested in authGuards.server.test.ts; this checks the
// route wiring.
const REGION = 'radinfra'
const SLUG = 'e2e-non-public-upload'
const FILE_URL = `/api/uploads/${SLUG}.geojson`

test.describe('Non-public upload files', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    const region = await db.region.findUniqueOrThrow({ where: { slug: REGION } })
    await db.mapDatasetUpload.deleteMany({ where: { slug: SLUG } })
    await db.mapDatasetUpload.create({
      data: {
        slug: SLUG,
        public: false,
        configs: [],
        mapRenderFormat: 'geojson',
        mapRenderUrl: 'https://example.invalid/e2e.geojson',
        geojsonUrl: 'https://example.invalid/e2e.geojson',
        githubUrl: 'https://example.invalid',
        regions: { connect: { id: region.id } },
      },
    })
  })

  test.afterAll(async () => {
    await db.mapDatasetUpload.deleteMany({ where: { slug: SLUG } })
  })

  test('guest gets 401', async ({ request }) => {
    expect((await request.get(FILE_URL)).status()).toBe(401)
  })

  test('signed-in non-member gets 403, member passes the guard', async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') throw new Error('Playwright baseURL must be a string')
    const identityKey = 'uploads-access'
    const user = await createStubbedUserSession(page, baseURL, { identityKey })

    try {
      expect((await page.request.get(FILE_URL)).status()).toBe(403)

      const region = await db.region.findUniqueOrThrow({ where: { slug: REGION } })
      await db.membership.create({ data: { userId: user.id, regionId: region.id } })
      // The file URL is fake, so the proxy fails after the guard; only 401/403 would mean denied.
      expect([401, 403]).not.toContain((await page.request.get(FILE_URL)).status())
    } finally {
      await db.membership.deleteMany({ where: { userId: user.id } })
      await cleanupStubbedSessionData('USER', identityKey)
      await db.user.deleteMany({ where: { id: user.id } })
    }
  })
})
