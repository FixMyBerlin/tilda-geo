import { expect, test } from '@playwright/test'
import { expectNoConsoleErrors } from '../utils/console'

test.describe('Smoke – region beforeLoad URL handling', () => {
  test('/regionen/bb-kampagne does not throw URL construction errors', async ({ page }) => {
    const urlErrors: string[] = []

    page.on('console', (msg) => {
      if (msg.type() !== 'error') return
      const text = msg.text()
      if (text.includes("Failed to construct 'URL': Invalid URL")) {
        urlErrors.push(text)
      }
    })

    await page.goto('/regionen/bb-kampagne')

    const main = page.locator('main').first()
    await expect(main).toBeVisible()
    await expect(urlErrors).toEqual([])
    await expectNoConsoleErrors(page)
  })
})
