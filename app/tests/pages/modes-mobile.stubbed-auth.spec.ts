import { expect, test, type Page, type TestInfo } from '@playwright/test'
import db from '../../src/server/db.server'
import { cleanupStubbedSessionData, createStubbedAdminSession } from '../fixtures/auth'
import { expectNoConsoleErrors } from '../utils/console'
import { waitForMapLoad } from '../utils/maps'

const MOBILE_VIEWPORT = { width: 390, height: 844 }
const REAL_EMAIL_PREFIX = 'e2e-modes-mobile-'

const dismissWelcomeIfOpen = async (page: Page) => {
  if (!page.url().includes('dialog=welcome')) return
  await page.getByRole('button', { name: 'Zur Karte' }).first().click()
}

const withStubbedAdmin = async (
  page: Page,
  testInfo: TestInfo,
  identityKey: string,
  run: () => Promise<void>,
) => {
  const baseURL = testInfo.project.use.baseURL
  if (typeof baseURL !== 'string') throw new Error('Playwright baseURL must be a string')

  const user = await createStubbedAdminSession(page, baseURL, { identityKey })
  await db.user.update({
    where: { id: user.id },
    data: { email: `${REAL_EMAIL_PREFIX}${user.id}@example.com` },
  })

  try {
    await run()
  } finally {
    await cleanupStubbedSessionData('ADMIN', identityKey)
    await db.user.deleteMany({ where: { email: { startsWith: REAL_EMAIL_PREFIX } } })
  }
}

test.describe('Region modes (mobile)', () => {
  test.use({ viewport: MOBILE_VIEWPORT })

  test('Hinweise: switcher, dock, map stays interactive (not a dialog)', async ({
    page,
  }, testInfo) => {
    await withStubbedAdmin(page, testInfo, 'modes-mobile-notes', async () => {
      await page.goto('/regionen/woldegk')
      await dismissWelcomeIfOpen(page)
      await waitForMapLoad(page)

      const switcher = page.getByRole('button', { name: /^Modus:/ })
      await expect(switcher).toBeVisible()
      await switcher.click()
      await page.getByRole('menuitem', { name: 'Hinweise' }).click()

      await expect(page).toHaveURL(/\/regionen\/woldegk\/hinweise/)
      await expect(page.getByRole('heading', { name: 'Hinweise' })).toBeVisible({ timeout: 30_000 })
      await expect(page.getByLabel('Modus-Panel')).toHaveAttribute('data-expanded', 'true')
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(page.locator('.maplibregl-canvas').first()).toBeVisible()

      await page.getByRole('button', { name: /^Modus:/ }).click()
      await page.getByRole('menuitem', { name: 'Karte' }).click()
      await expect(page).toHaveURL(/\/regionen\/woldegk\/?(?:\?|$)/)
      await expect(page.getByRole('heading', { name: 'Hinweise' })).toHaveCount(0)

      await expectNoConsoleErrors(page)
    })
  })

  test('QA: list renders in the mobile dock', async ({ page }, testInfo) => {
    await withStubbedAdmin(page, testInfo, 'modes-mobile-qa', async () => {
      await page.goto('/regionen/parkraum-berlin-euvm/qa?map=14/52.5/13.4')
      await dismissWelcomeIfOpen(page)

      await expect(page.getByRole('heading', { name: /^QA:/ })).toBeVisible({ timeout: 30_000 })
      await waitForMapLoad(page)
      await expect(page.getByRole('button', { name: /^Modus:/ })).toBeVisible()
      await expect(page.getByLabel('Modus-Panel')).toBeVisible()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(page.locator('.maplibregl-canvas').first()).toBeVisible()

      await expectNoConsoleErrors(page)
    })
  })

  test('Prüflisten: list renders in the mobile dock', async ({ page }, testInfo) => {
    await withStubbedAdmin(page, testInfo, 'modes-mobile-review', async () => {
      await page.goto('/regionen/radinfra/prueflisten')
      await dismissWelcomeIfOpen(page)

      await expect(page.getByRole('heading', { name: /Prüflisten|Liste / })).toBeVisible({
        timeout: 30_000,
      })
      await waitForMapLoad(page)
      await expect(page.getByRole('button', { name: /^Modus:/ })).toBeVisible()
      await expect(page.getByLabel('Modus-Panel')).toBeVisible()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      await expect(page.locator('.maplibregl-canvas').first()).toBeVisible()

      await expectNoConsoleErrors(page)
    })
  })
})
