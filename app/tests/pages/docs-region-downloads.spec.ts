import { expect, test } from '@playwright/test'
import type { RegionStatus } from '../../src/prisma/generated/enums'
import db from '../../src/server/db.server'
import {
  cleanupStubbedSessionData,
  createStubbedAdminSession,
  createStubbedUserSession,
} from '../fixtures/auth'
import { expectNoConsoleErrors } from '../utils/console'

const DOCS_ROADS = '/docs/roads'
const DOCS_PARKINGS = '/docs/parkings'

/**
 * Slugs from `prisma/seeds/regionSeedCatalog.ts` (fresh migrate + seed).
 * Production-like PUBLIC regions (radinfra / parkraum-*) are seeded; status fixtures stay `dev-*`.
 */
/** PUBLIC, bbox + exports (download UI when member/admin). */
const SLUG_DOWNLOADS = 'parkraum-berlin-euvm'
/** PUBLIC, no bbox (no download section) — radinfra mirrors regions.const. */
const SLUG_NO_DOWNLOADS = 'radinfra'
/** PUBLIC parkraum + parkings exports — regression for #3421. */
const SLUG_PARKRAUM = 'parkraum-berlin-euvm'
/** Seed PRIVATE — `beforeAll` forces DB row to PRIVATE for stable auth checks. */
const SLUG_PRIVATE = 'dev-status-private'
/** Seed DEACTIVATED — `beforeAll` forces DB row to DEACTIVATED; bbox + exports in seed. */
const SLUG_DEACTIVATED = 'dev-status-closed'

const PARKRAUM_EXPORT_BBOX =
  'minlon=13.0883&minlat=52.3382&maxlon=13.7611&maxlat=52.6755&format=fgb'
const DEACTIVATED_EXPORT_BBOX =
  'minlon=13.3579&minlat=52.2095&maxlon=13.825&maxlat=52.4784&format=fgb'

let regionStatusRestore: Array<{ slug: string; status: RegionStatus }> = []

test.beforeAll(async () => {
  const targets: Array<{ slug: string; status: RegionStatus }> = [
    { slug: SLUG_PRIVATE, status: 'PRIVATE' },
    { slug: SLUG_DEACTIVATED, status: 'DEACTIVATED' },
  ]
  regionStatusRestore = []
  for (const { slug, status } of targets) {
    const row = await db.region.findUnique({ where: { slug }, select: { status: true } })
    if (!row) {
      throw new Error(
        `E2E docs-region-downloads: region "${slug}" missing — run prisma migrate + seed.`,
      )
    }
    regionStatusRestore.push({ slug, status: row.status })
    await db.region.update({ where: { slug }, data: { status } })
  }
})

test.afterAll(async () => {
  for (const { slug, status } of regionStatusRestore) {
    await db.region.update({ where: { slug }, data: { status } })
  }
  await db.$disconnect()
})

test.describe('Docs page — region `r` search param and download UI', () => {
  // Serial: shared DB mutations in `beforeAll` + stubbed sessions are easier to reason about than parallel workers.
  test.describe.configure({ mode: 'serial' })

  test('without `r`: no Downloads section and no «Zur Region»', async ({ page }) => {
    await page.goto(DOCS_ROADS)
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Downloads' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Zur Region' })).toHaveCount(0)
    await expectNoConsoleErrors(page)
  })

  test('`r` = PUBLIC region without bbox: «Zur Region» but no Downloads', async ({ page }) => {
    await page.goto(`${DOCS_ROADS}?r=${SLUG_NO_DOWNLOADS}`)
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Downloads' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Zur Region' })).toBeVisible()
    await expectNoConsoleErrors(page)
  })

  test('`r` = PRIVATE region, anonymous: no region box', async ({ page }) => {
    await page.goto(`${DOCS_ROADS}?r=${SLUG_PRIVATE}`)
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Zur Region' })).toHaveCount(0)
    await expectNoConsoleErrors(page)
  })

  test('`r` = PRIVATE region, logged-in user without membership: no region box', async ({
    page,
  }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string')
    }

    const user = await createStubbedUserSession(page, baseURL, {
      identityKey: 'docs-r-private-user',
    })
    await db.membership.deleteMany({ where: { userId: user.id } })
    try {
      await page.goto(`${DOCS_ROADS}?r=${SLUG_PRIVATE}`)
      await expect(page.locator('main').first()).toBeVisible()
      await expect(page.getByRole('link', { name: 'Zur Region' })).toHaveCount(0)
      await expectNoConsoleErrors(page)
    } finally {
      await cleanupStubbedSessionData('USER', 'docs-r-private-user')
    }
  })

  test('`r` = DEACTIVATED region, anonymous: no region box', async ({ page }) => {
    await page.goto(`${DOCS_ROADS}?r=${SLUG_DEACTIVATED}`)
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Downloads' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Zur Region' })).toHaveCount(0)
    await expectNoConsoleErrors(page)
  })

  test('`r` = PUBLIC region with bbox, anonymous: region box but no Downloads', async ({
    page,
  }) => {
    await page.goto(`${DOCS_ROADS}?r=${SLUG_DOWNLOADS}`)
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Zur Region' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Downloads' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'GPKG' })).toHaveCount(0)
    await expectNoConsoleErrors(page)
  })

  test('`r` = parkraum region on parkings docs, anonymous: region box but no Downloads (#3421)', async ({
    page,
  }) => {
    await page.goto(`${DOCS_PARKINGS}?r=${SLUG_PARKRAUM}`)
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Zur Region' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Downloads' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'GPKG' })).toHaveCount(0)
    await expectNoConsoleErrors(page)
  })

  test('`r` = PUBLIC region with bbox, admin: Downloads and format links', async ({
    page,
  }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string')
    }

    await createStubbedAdminSession(page, baseURL, { identityKey: 'docs-r-downloads-admin' })
    try {
      await page.goto(`${DOCS_ROADS}?r=${SLUG_DOWNLOADS}`)
      await expect(page.locator('main').first()).toBeVisible()
      await expect(page.getByRole('heading', { level: 2, name: 'Downloads' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'GPKG' }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: 'Zur Region' })).toBeVisible()
      await expectNoConsoleErrors(page)
    } finally {
      await cleanupStubbedSessionData('ADMIN', 'docs-r-downloads-admin')
    }
  })

  test('`r` = DEACTIVATED region, admin: Downloads and format links', async ({
    page,
  }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string')
    }

    await createStubbedAdminSession(page, baseURL, { identityKey: 'docs-r-deactivated-admin' })
    try {
      await page.goto(`${DOCS_ROADS}?r=${SLUG_DEACTIVATED}`)
      await expect(page.locator('main').first()).toBeVisible()
      await expect(page.getByRole('heading', { level: 2, name: 'Downloads' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'GPKG' }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: 'Zur Region' })).toBeVisible()
      await expectNoConsoleErrors(page)
    } finally {
      await cleanupStubbedSessionData('ADMIN', 'docs-r-deactivated-admin')
    }
  })
})

test.describe('Export API — region membership required', () => {
  test('anonymous export request is rejected', async ({ request }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string')
    }

    const response = await request.get(
      `${baseURL}/api/export/${SLUG_PARKRAUM}/parkings?${PARKRAUM_EXPORT_BBOX}`,
    )
    expect([401, 403]).toContain(response.status())
  })

  test('admin export request is not forbidden', async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string')
    }

    await createStubbedAdminSession(page, baseURL, { identityKey: 'export-api-admin' })
    try {
      const response = await page.request.get(
        `${baseURL}/api/export/${SLUG_PARKRAUM}/parkings?${PARKRAUM_EXPORT_BBOX}`,
      )
      expect(response.status()).not.toBe(403)
      expect(response.status()).not.toBe(401)
      expect(response.status()).not.toBe(404)
    } finally {
      await cleanupStubbedSessionData('ADMIN', 'export-api-admin')
    }
  })

  test('deactivated region export rejects non-admin members', async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string')
    }

    const user = await createStubbedUserSession(page, baseURL, {
      identityKey: 'export-api-deactivated-member',
    })
    const region = await db.region.findUnique({
      where: { slug: SLUG_DEACTIVATED },
      select: { id: true },
    })
    if (!region) {
      throw new Error(`E2E docs-region-downloads: region "${SLUG_DEACTIVATED}" missing.`)
    }

    await db.membership.upsert({
      where: {
        regionId_userId: {
          regionId: region.id,
          userId: user.id,
        },
      },
      update: {},
      create: {
        regionId: region.id,
        userId: user.id,
      },
    })

    try {
      const response = await page.request.get(
        `${baseURL}/api/export/${SLUG_DEACTIVATED}/roads?${DEACTIVATED_EXPORT_BBOX}`,
      )
      expect(response.status()).toBe(403)
    } finally {
      await db.membership.deleteMany({
        where: {
          regionId: region.id,
          userId: user.id,
        },
      })
      await cleanupStubbedSessionData('USER', 'export-api-deactivated-member')
    }
  })
})
