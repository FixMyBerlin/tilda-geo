import { expect, test } from '@playwright/test'
import { cleanupStubbedSessionData, createStubbedAdminSession } from '../fixtures/auth'

/**
 * `__root` `beforeLoad` strips trailing slashes (see router `trailingSlash: 'never'`).
 */
test.describe('Trailing slash → canonical path (public routes)', () => {
  for (const [withSlash, expectedPath] of [
    ['/regionen/', '/regionen'],
    ['/kontakt/', '/kontakt'],
    ['/docs/mapillary-coverage/', '/docs/mapillary-coverage'],
  ] as const) {
    test(`${withSlash} becomes ${expectedPath}`, async ({ page }) => {
      await page.goto(withSlash)
      await expect(page).toHaveURL((url) => new URL(url).pathname === expectedPath)
    })
  }
})

test.describe('Trailing slash → canonical path (admin)', () => {
  test('/admin/ becomes /admin when logged in as admin', async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string')
    }

    await createStubbedAdminSession(page, baseURL, { identityKey: 'trailing-slash-admin' })
    await page.goto('/admin/')
    await expect(page).toHaveURL((url) => new URL(url).pathname === '/admin')
  })

  test.afterEach(async () => {
    await cleanupStubbedSessionData('ADMIN', 'trailing-slash-admin')
  })
})
