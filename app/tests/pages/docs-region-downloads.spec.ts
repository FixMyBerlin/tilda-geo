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

/** PUBLIC, bbox + exports (download UI when authorized). */
const SLUG_DEUTSCHLAND = 'deutschland'
/** PUBLIC, no bbox (no download section even when authorized). */
const SLUG_RADINFRA = 'radinfra'
/** Seed PRIVATE — `beforeAll` forces DB row to PRIVATE for stable auth checks. */
const SLUG_PRIVATE = 'trassenscout-umfragen'
/** Seed DEACTIVATED — `beforeAll` forces DB row to DEACTIVATED; bbox + exports in static data. */
const SLUG_DEACTIVATED_BB = 'bb'

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

  test('`r` = region without bbox: no Downloads; «Zur Region» when PUBLIC', async ({ page }) => {
    await page.goto(`${DOCS_ROADS}?r=${SLUG_RADINFRA}`)
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Downloads' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Zur Region' })).toBeVisible()
    await expectNoConsoleErrors(page)
  })

  test('`r` = PRIVATE region, anonymous: no «Zur Region» (no authorized region context)', async ({
    page,
  }) => {
    await page.goto(`${DOCS_ROADS}?r=${SLUG_PRIVATE}`)
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Zur Region' })).toHaveCount(0)
    await expectNoConsoleErrors(page)
  })

  test('`r` = PRIVATE region, logged-in user without membership: no «Zur Region»', async ({
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

  test('`r` = DEACTIVATED region, anonymous: no Downloads and no «Zur Region»', async ({
    page,
  }) => {
    await page.goto(`${DOCS_ROADS}?r=${SLUG_DEACTIVATED_BB}`)
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Downloads' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Zur Region' })).toHaveCount(0)
    await expectNoConsoleErrors(page)
  })

  test('`r` = PUBLIC region with bbox, anonymous: Downloads and format links', async ({ page }) => {
    await page.goto(`${DOCS_ROADS}?r=${SLUG_DEUTSCHLAND}`)
    await expect(page.locator('main').first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Downloads' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'GPKG' }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Zur Region' })).toBeVisible()
    await expectNoConsoleErrors(page)
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
