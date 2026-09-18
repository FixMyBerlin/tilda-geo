import { expect, test } from '@playwright/test'
import {
  cleanupStubbedSessionData,
  createStubbedAdminSession,
  createStubbedUserSession,
} from '../fixtures/auth'
import { ADMIN_REDIRECT_SMOKE_ROUTE, ADMIN_ROUTES } from '../fixtures/routes'
import {
  type ConsoleMessage,
  collectConsoleErrors,
  expectNoConsoleErrors,
  filterAcceptableErrors,
} from '../utils/console'
import { escapeRegExp } from '../utils/regex'
import { collectServerErrors, expectNoServerErrors } from '../utils/server'

test.describe('Admin Pages (stubbed login)', () => {
  // Serial: stubbed sessions + Better Auth session updates hit the same DB; parallel runs
  // occasionally caused P2025 (session row missing) and 500s on session routes.
  test.describe.configure({ mode: 'serial' })

  for (const route of ADMIN_ROUTES) {
    // Nested describe so each afterEach only runs for its route; otherwise Playwright runs
    // every registered afterEach after every test and parallel workers delete each other's DB sessions.
    test.describe(route, () => {
      test.afterEach(async () => {
        await cleanupStubbedSessionData('ADMIN', route)
      })

      test(`should render ${route} without console or server errors`, async ({
        page,
      }, testInfo) => {
        const baseURL = testInfo.project.use.baseURL
        if (typeof baseURL !== 'string') {
          throw new Error('Playwright baseURL must be a string for stubbed login tests')
        }

        await createStubbedAdminSession(page, baseURL, { identityKey: route })

        const consoleMessages = collectConsoleErrors(page)
        const serverErrors = collectServerErrors(page, baseURL)

        await page.goto(route)
        await expect(page).toHaveURL(new RegExp(escapeRegExp(route)))
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
    })
  }

  test.describe('regions new (search params)', () => {
    test('should render with optional slug query', async ({ page }, testInfo) => {
      const baseURL = testInfo.project.use.baseURL
      if (typeof baseURL !== 'string') {
        throw new Error('Playwright baseURL must be a string for stubbed login tests')
      }

      await createStubbedAdminSession(page, baseURL, {
        identityKey: 'admin-regions-new-slug',
      })

      const consoleMessages = collectConsoleErrors(page)
      const serverErrors = collectServerErrors(page, baseURL)

      await page.goto('/admin/regions/new?slug=radinfra')
      await expect(page).toHaveURL(/\/admin\/regions\/new/)
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
      await cleanupStubbedSessionData('ADMIN', 'admin-regions-new-slug')
    })
  })

  test.describe('memberships new (search params)', () => {
    test('should render with numeric userId query', async ({ page }, testInfo) => {
      const baseURL = testInfo.project.use.baseURL
      if (typeof baseURL !== 'string') {
        throw new Error('Playwright baseURL must be a string for stubbed login tests')
      }

      await createStubbedAdminSession(page, baseURL, {
        identityKey: 'admin-memberships-new-userid',
      })

      const consoleMessages = collectConsoleErrors(page)
      const serverErrors = collectServerErrors(page, baseURL)

      await page.goto('/admin/memberships/new?userId=1')
      await expect(page).toHaveURL(/\/admin\/memberships\/new/)
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
      await cleanupStubbedSessionData('ADMIN', 'admin-memberships-new-userid')
    })
  })

  test.describe('memberships pagination', () => {
    test('pages via links, keeps history and resets the page on search', async ({
      page,
    }, testInfo) => {
      const baseURL = testInfo.project.use.baseURL
      if (typeof baseURL !== 'string') {
        throw new Error('Playwright baseURL must be a string for stubbed login tests')
      }

      await createStubbedAdminSession(page, baseURL, {
        identityKey: 'admin-memberships-pagination',
      })
      const serverErrors = collectServerErrors(page, baseURL)

      // Small page size so the seeded users span several pages.
      await page.goto('/admin/memberships?pageSize=1')
      const pagination = page.getByRole('navigation', { name: 'Seitennummerierung' })
      await expect(pagination).toBeVisible()
      await expect(pagination.getByRole('link', { name: 'Seite 1' })).toHaveAttribute(
        'aria-current',
        'page',
      )

      await pagination.getByRole('link', { name: 'Weiter' }).click()
      await expect(page).toHaveURL(/[?&]page=2(&|$)/)
      await expect(page).toHaveURL(/[?&]pageSize=1(&|$)/)
      await expect(pagination.getByRole('link', { name: 'Seite 2' })).toHaveAttribute(
        'aria-current',
        'page',
      )

      await pagination.getByRole('link', { name: 'Weiter' }).click()
      await expect(page).toHaveURL(/[?&]page=3(&|$)/)

      await page.goBack()
      await expect(page).toHaveURL(/[?&]page=2(&|$)/)
      await expect(pagination.getByRole('link', { name: 'Seite 2' })).toHaveAttribute(
        'aria-current',
        'page',
      )
      // Let the back navigation's loader settle before the debounced search navigation starts.
      await page.waitForLoadState('networkidle')

      await page.getByRole('searchbox', { name: 'Nutzer durchsuchen' }).fill('playwright')
      await expect(page).toHaveURL(/[?&]q=playwright(&|$)/)
      await expect(page).not.toHaveURL(/[?&]page=/)

      // Invalid values fall back to the defaults, which are stripped from the URL.
      await page.goto('/admin/memberships?page=abc&pageSize=9999')
      await expect(page).toHaveURL(/\/admin\/memberships$/)

      await expectNoServerErrors(page, serverErrors)
    })

    test.afterEach(async () => {
      await cleanupStubbedSessionData('ADMIN', 'admin-memberships-pagination')
    })
  })

  test.describe('memberships region filter', () => {
    test('shows the region from the URL and clears it', async ({ page }, testInfo) => {
      const baseURL = testInfo.project.use.baseURL
      if (typeof baseURL !== 'string') {
        throw new Error('Playwright baseURL must be a string for stubbed login tests')
      }

      await createStubbedAdminSession(page, baseURL, {
        identityKey: 'admin-memberships-region-filter',
      })
      const serverErrors = collectServerErrors(page, baseURL)

      await page.goto('/admin/memberships?regionSlug=radinfra')
      // `exact: true`: the sidebar's own region switcher ("Region öffnen…") is now on every admin
      // page, so a substring match on "Region" would resolve to both comboboxes.
      const regionFilter = page.getByRole('combobox', { name: 'Region', exact: true })
      await expect(regionFilter).toHaveValue('radinfra.de')
      await expect(page.getByRole('link', { name: 'Neue Mitgliedschaft' })).toHaveAttribute(
        'href',
        /[?&]regionSlug=radinfra(&|$)/,
      )

      await page.getByRole('button', { name: 'Regionsfilter aufheben' }).click()
      await expect(page).not.toHaveURL(/regionSlug=/)
      await expect(regionFilter).toHaveValue('')

      await expectNoServerErrors(page, serverErrors)
    })

    test.afterEach(async () => {
      await cleanupStubbedSessionData('ADMIN', 'admin-memberships-region-filter')
    })
  })
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
      expect(redirectedUrl.searchParams.get('callbackURL')).toBe('/admin')
    }
    await expectNoConsoleErrors(page)
    await expectNoServerErrors(page, serverErrors)
  })
})
