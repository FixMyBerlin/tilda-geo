import { expect, test } from '@playwright/test'
import {
  cleanupStubbedSessionData,
  createStubbedAdminSession,
  createStubbedUserSession,
} from '../fixtures/auth'
import { ADMIN_REDIRECT_SMOKE_ROUTE, ADMIN_ROUTES } from '../fixtures/routes'
import {
  collectConsoleErrors,
  expectNoConsoleErrors,
  filterAcceptableErrors,
  type ConsoleMessage,
} from '../utils/console'
import { collectServerErrors, expectNoServerErrors } from '../utils/server'

test.describe('Admin Pages (stubbed login)', () => {
  for (const route of ADMIN_ROUTES) {
    test(`should render ${route} without console or server errors`, async ({ page }, testInfo) => {
      const baseURL = testInfo.project.use.baseURL
      if (typeof baseURL !== 'string') {
        throw new Error('Playwright baseURL must be a string for stubbed login tests')
      }

      await createStubbedAdminSession(page, baseURL, { identityKey: route })

      const consoleMessages = collectConsoleErrors(page)
      const serverErrors = collectServerErrors(page, baseURL)

      await page.goto(route)
      await expect(page).toHaveURL(new RegExp(route.replace(/\//g, '\\/')))
      await expect(page.locator('main').first()).toBeVisible()

      const blockingConsoleErrors = filterAcceptableErrors(consoleMessages).filter(
        (message: ConsoleMessage) => message.type === 'error',
      )
      if (blockingConsoleErrors.length > 0) {
        throw new Error(
          `Console errors found:\n${blockingConsoleErrors.map((message) => message.text).join('\n')}`,
        )
      }

      await expectNoServerErrors(page, serverErrors)
    })

    test.afterEach(async () => {
      await cleanupStubbedSessionData('ADMIN', route)
    })
  }
})

test.describe('Admin access (non-admin and unauthenticated)', () => {
  test('logged-in non-admin is redirected to access-denied and sees message', async ({
    page,
  }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string for stubbed login tests')
    }

    await createStubbedUserSession(page, baseURL, { identityKey: 'non-admin-redirect' })
    const serverErrors = collectServerErrors(page, baseURL)
    await page.goto(ADMIN_REDIRECT_SMOKE_ROUTE)

    await expect(page).toHaveURL(/\/access-denied/)
    await expect(page.getByRole('heading', { name: 'Zugriff verweigert' })).toBeVisible()
    await expect(page.getByText('keine Berechtigung')).toBeVisible()
    await expectNoConsoleErrors(page)
    await expectNoServerErrors(page, serverErrors)
  })

  test.afterEach(async () => {
    await cleanupStubbedSessionData('USER', 'non-admin-redirect')
  })

  test('unauthenticated user is redirected to sign-in with callbackURL when visiting /admin', async ({
    page,
  }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string for stubbed login tests')
    }

    const serverErrors = collectServerErrors(page, baseURL)
    await page.goto(ADMIN_REDIRECT_SMOKE_ROUTE)

    await page.waitForURL((url) => new URL(url).pathname !== '/admin', { timeout: 10_000 })
    const redirectedUrl = new URL(page.url())
    const pathname = redirectedUrl.pathname
    const isSignInPage = pathname === '/api/sign-in/osm' || pathname === '/login'
    expect(isSignInPage, `Expected redirect to sign-in page, got ${pathname}`).toBe(true)
    if (pathname === '/api/sign-in/osm') {
      expect(redirectedUrl.searchParams.get('callbackURL')).toBe(`${baseURL}/admin`)
    }
    await expectNoConsoleErrors(page)
    await expectNoServerErrors(page, serverErrors)
  })
})
