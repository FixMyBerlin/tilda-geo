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

/** PUBLIC, bbox + exports (download UI when member/admin). */
const SLUG_DEUTSCHLAND = 'deutschland'
/** PUBLIC, no bbox (no download section). */
const SLUG_RADINFRA = 'radinfra'
/** PUBLIC, bbox + parkings exports — regression for #3421. */
const SLUG_PARKRAUM_BERLIN_EUVM = 'parkraum-berlin-euvm'
/** Seed PRIVATE — `beforeAll` forces DB row to PRIVATE for stable auth checks. */
const SLUG_PRIVATE = 'trassenscout-umfragen'
/** Seed DEACTIVATED — `beforeAll` forces DB row to DEACTIVATED; bbox + exports in static data. */
const SLUG_DEACTIVATED_BB = 'bb'

const PARKRAUM_EUVM_EXPORT_BBOX =
  'minlon=13.0883&minlat=52.3382&maxlon=13.7611&maxlat=52.6755&format=fgb'
const BB_EXPORT_BBOX =
  'minlon=11.2662278&minlat=51.359064&maxlon=14.7658159&maxlat=53.5590907&format=fgb'

let regionStatusRestore: Array<{ slug: string; status: RegionStatus }> = []

test.beforeAll(async () => {
  const targets: Array<{ slug: string; status: RegionStatus }> = [
    { slug: SLUG_PRIVATE, status: 'PRIVATE' },
    { slug: SLUG_DEACTIVATED_BB, status: 'DEACTIVATED' },
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
    await page.goto(`${DOCS_ROADS}?r=${SLUG_RADINFRA}`)
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
    await page.goto(`${DOCS_ROADS}?r=${SLUG_DEACTIVATED_BB}`)
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Downloads' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Zur Region' })).toHaveCount(0)
    await expectNoConsoleErrors(page)
  })

  test('`r` = PUBLIC region with bbox, anonymous: region box but no Downloads', async ({
    page,
  }) => {
    await page.goto(`${DOCS_ROADS}?r=${SLUG_DEUTSCHLAND}`)
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Zur Region' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Downloads' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'GPKG' })).toHaveCount(0)
    await expectNoConsoleErrors(page)
  })

  test('`r` = parkraum-berlin-euvm on parkings docs, anonymous: region box but no Downloads (#3421)', async ({
    page,
  }) => {
    await page.goto(`${DOCS_PARKINGS}?r=${SLUG_PARKRAUM_BERLIN_EUVM}`)
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

    await createStubbedAdminSession(page, baseURL, { identityKey: 'docs-r-de-admin' })
    try {
      await page.goto(`${DOCS_ROADS}?r=${SLUG_DEUTSCHLAND}`)
      await expect(page.locator('main').first()).toBeVisible()
      await expect(page.getByRole('heading', { level: 2, name: 'Downloads' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'GPKG' }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: 'Zur Region' })).toBeVisible()
      await expectNoConsoleErrors(page)
    } finally {
      await cleanupStubbedSessionData('ADMIN', 'docs-r-de-admin')
    }
  })

  test('`r` = DEACTIVATED region, admin: Downloads and format links', async ({
    page,
  }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string')
    }

    await createStubbedAdminSession(page, baseURL, { identityKey: 'docs-r-bb-admin' })
    try {
      await page.goto(`${DOCS_ROADS}?r=${SLUG_DEACTIVATED_BB}`)
      await expect(page.locator('main').first()).toBeVisible()
      await expect(page.getByRole('heading', { level: 2, name: 'Downloads' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'GPKG' }).first()).toBeVisible()
      await expect(page.getByRole('link', { name: 'Zur Region' })).toBeVisible()
      await expectNoConsoleErrors(page)
    } finally {
      await cleanupStubbedSessionData('ADMIN', 'docs-r-bb-admin')
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
      `${baseURL}/api/export/${SLUG_PARKRAUM_BERLIN_EUVM}/parkings?${PARKRAUM_EUVM_EXPORT_BBOX}`,
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
        `${baseURL}/api/export/${SLUG_PARKRAUM_BERLIN_EUVM}/parkings?${PARKRAUM_EUVM_EXPORT_BBOX}`,
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
      where: { slug: SLUG_DEACTIVATED_BB },
      select: { id: true },
    })
    if (!region) {
      throw new Error(`E2E docs-region-downloads: region "${SLUG_DEACTIVATED_BB}" missing.`)
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
        `${baseURL}/api/export/${SLUG_DEACTIVATED_BB}/roads?${BB_EXPORT_BBOX}`,
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
