import { expect, test } from '@playwright/test'
import { ADMIN_REDIRECT_SMOKE_ROUTE, PUBLIC_SMOKE_ROUTES } from '../fixtures/routes'
import { expectNoConsoleErrors } from '../utils/console'

test.describe('Smoke – public routes (unauthenticated)', () => {
  for (const route of PUBLIC_SMOKE_ROUTES) {
    test(`${route} renders without crash or unexpected redirect`, async ({ page }) => {
      await page.goto(route)

      const url = page.url()
      const path = new URL(url).pathname
      const expectedPath = route.split('?')[0]
      expect(path).toBe(expectedPath)

      const main = page.locator('main').first()
      await expect(main).toBeVisible()

      await expectNoConsoleErrors(page)
    })
  }

  test(`${ADMIN_REDIRECT_SMOKE_ROUTE} redirects when unauthenticated`, async ({ page }) => {
    await page.goto(ADMIN_REDIRECT_SMOKE_ROUTE)

    await page.waitForURL((url) => new URL(url).pathname !== '/admin', {
      timeout: 10_000,
    })
    await expectNoConsoleErrors(page)
  })
})
