import { expect, test } from '@playwright/test'
import type { AuthenticatedContext } from './fixtures/auth'
import { saveSession } from './fixtures/auth'

const runRealOAuth = process.env.RUN_OAUTH_E2E === '1'

function getUserIdFromSessionDataCookie(rawValue: string) {
  const decoded = decodeURIComponent(rawValue)
  const parsed = JSON.parse(Buffer.from(decoded, 'base64url').toString('utf-8')) as {
    session?: {
      user?: {
        id?: string
      }
    }
  }
  return parsed.session?.user?.id
}

test.describe('Auth Setup', () => {
  test.skip(!runRealOAuth, 'Set RUN_OAUTH_E2E=1 to run real OSM OAuth tests')

  test('perform OAuth flow and store session', async ({ page }, testInfo) => {
    const username = process.env.TEST_OSM_USERNAME
    const password = process.env.TEST_OSM_PASSWORD

    if (!username || !password) {
      test.skip(true, 'TEST_OSM_USERNAME and TEST_OSM_PASSWORD must be set in .env.test')
      return
    }

    await page.goto('/api/auth/sign-in/osm')
    await page.waitForURL(/openstreetmap\.org/, { timeout: 10000 })

    await page.fill('input[name="username"]', username)
    await page.fill('input[name="password"]', password)
    await page.click('button[type="submit"]')

    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string for OAuth setup')
    }
    await page.waitForURL((url) => url.toString().startsWith(baseURL), { timeout: 30000 })
    await page.waitForTimeout(2000)

    const cookies = await page.context().cookies()
    const sessionCookie = cookies.find((c) => c.name.startsWith('tilda.session'))
    const sessionDataCookie = cookies.find((c) => c.name === 'tilda.session_data')

    if (!sessionCookie || !sessionDataCookie) {
      throw new Error('Session cookie not found after OAuth flow')
    }

    const userId = getUserIdFromSessionDataCookie(sessionDataCookie.value)
    if (!userId) {
      throw new Error('Could not extract user id from tilda.session_data cookie')
    }
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000

    const session: AuthenticatedContext = {
      cookies,
      userId,
      expiresAt,
    }

    saveSession(session)

    await page.goto('/')
    const isLoggedIn = await page
      .locator('[data-testid="user-info"]')
      .isVisible()
      .catch(() => false)

    expect(isLoggedIn).toBeTruthy()
  })
})
