import { expect, test } from '@playwright/test'
import { getAuthenticatedContext, loadSession } from '../fixtures/auth'
import { ADMIN_ROUTES } from '../fixtures/routes'
import { expectNoConsoleErrors } from '../utils/console'
import { escapeRegExp } from '../utils/regex'

const runRealOAuth = process.env.RUN_OAUTH_E2E === '1'

test.describe('Admin Pages', () => {
  test.skip(!runRealOAuth, 'Set RUN_OAUTH_E2E=1 to run real OSM OAuth tests')

  test.beforeEach(async ({ page }) => {
    // Try to use stored session
    const hasSession = await getAuthenticatedContext(page)
    if (!hasSession) {
      test.skip(true, 'No stored session found. Run auth-setup.spec.ts first.')
      return
    }

    const session = loadSession()
    if (!session) {
      test.skip(true, 'No stored session found. Run auth-setup.spec.ts first.')
      return
    }

    // Switch to admin role
    const { switchUserToAdmin } = await import('../fixtures/auth')
    await switchUserToAdmin(session.userId)
  })

  for (const route of ADMIN_ROUTES) {
    test(`should render ${route}`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(new RegExp(escapeRegExp(route)))

      // Verify admin layout renders (pink background)
      const adminLayout = page.locator('.bg-pink-300').first()
      await expect(adminLayout).toBeVisible()

      // Verify content renders
      const main = page.locator('main').first()
      await expect(main).toBeVisible()

      await expectNoConsoleErrors(page)
    })
  }
})
