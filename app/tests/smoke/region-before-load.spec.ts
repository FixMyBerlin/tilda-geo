import { expect, test } from '@playwright/test'
import { TEST_REGION_URL } from '../fixtures/routes'
import { expectNoConsoleErrors } from '../utils/console'

test.describe('Smoke – region beforeLoad URL handling', () => {
  test(`${TEST_REGION_URL} does not throw URL construction errors`, async ({ page }) => {
    const urlErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() !== 'error') return
      const text = msg.text()
      if (text.includes("Failed to construct 'URL': Invalid URL")) {
        urlErrors.push(text)
      }
    })

    await page.goto(TEST_REGION_URL)

    const main = page.locator('main').first()
    await expect(main).toBeVisible()
    await expect(urlErrors).toEqual([])
    await expectNoConsoleErrors(page)
  })
})
