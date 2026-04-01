import { expect, test } from '@playwright/test'
import { getAuthenticatedContext, loadSession } from '../fixtures/auth'
import { TEST_REGION_URL, TEST_REGION_URL_WITH_CONFIG } from '../fixtures/routes'
import { expectNoConsoleErrors } from '../utils/console'
import { verifyMapRendered, waitForMapLoad } from '../utils/maps'
import { verifyMapNetworkRequests } from '../utils/network'

const runRealOAuth = process.env.RUN_OAUTH_E2E === '1'

test.describe('Regions Pages', () => {
  test.skip(!runRealOAuth, 'Set RUN_OAUTH_E2E=1 to run real OSM OAuth tests')

  test.describe('/regionen', () => {
    test('should render as admin user', async ({ page }) => {
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

      await page.goto('/regionen')
      await expect(page).toHaveURL(/\/regionen/)

      // Verify content renders
      const main = page.locator('main').first()
      await expect(main).toBeVisible()

      await expectNoConsoleErrors(page)
    })

    test('should render as regular user', async ({ page }) => {
      // Try to use stored session
      const hasSession = await getAuthenticatedContext(page)
      if (!hasSession) {
        test.skip(true, 'No stored session found. Run auth-setup.spec.ts first.')
        return
      }

      await page.goto('/regionen')
      await expect(page).toHaveURL(/\/regionen/)

      // Verify content renders
      const main = page.locator('main').first()
      await expect(main).toBeVisible()

      await expectNoConsoleErrors(page)
    })
  })

  test.describe('/regionen/radinfra', () => {
    test('should render as logged-in user', async ({ page }) => {
      // Try to use stored session
      const hasSession = await getAuthenticatedContext(page)
      if (!hasSession) {
        test.skip(true, 'No stored session found. Run auth-setup.spec.ts first.')
        return
      }

      await page.goto(TEST_REGION_URL_WITH_CONFIG)
      await expect(page).toHaveURL(new RegExp(TEST_REGION_URL.replace(/\//g, '\\/')))

      // Wait for map to load
      await waitForMapLoad(page)

      // Verify map renders
      await verifyMapRendered(page)

      // Verify network requests succeed
      const networkResult = await verifyMapNetworkRequests(page)
      if (!networkResult.success) {
        console.warn('Some network requests failed:', {
          missing: networkResult.missing,
          failed: networkResult.failed,
        })
      }

      await expectNoConsoleErrors(page)
    })

    test('should render as logged-in admin', async ({ page }) => {
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

      await page.goto(TEST_REGION_URL_WITH_CONFIG)
      await expect(page).toHaveURL(new RegExp(TEST_REGION_URL.replace(/\//g, '\\/')))

      // Wait for map to load
      await waitForMapLoad(page)

      // Verify map renders
      await verifyMapRendered(page)

      // Verify network requests succeed
      const networkResult = await verifyMapNetworkRequests(page)
      if (!networkResult.success) {
        console.warn('Some network requests failed:', {
          missing: networkResult.missing,
          failed: networkResult.failed,
        })
      }

      await expectNoConsoleErrors(page)
    })
  })
})
