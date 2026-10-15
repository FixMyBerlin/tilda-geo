import { expect, test, type Page, type TestInfo } from '@playwright/test'
import db from '../../src/server/db.server'
import { cleanupStubbedSessionData, createStubbedAdminSession } from '../fixtures/auth'
import { expectNoConsoleErrors } from '../utils/console'
import { waitForMapLoad } from '../utils/maps'

// Seed regions with `spaceFinderEnabled` on: `dev-flaechenfinder` has two Planungsgebiete
// (`seedPlanning`: Schillerkiez, Herrfurthplatz (mit Eigenen Daten)), `dev-flaechenfinder-empty` has none.
const REGION = 'dev-flaechenfinder'
const EMPTY_REGION = 'dev-flaechenfinder-empty'
const MODE_URL = `/regionen/${REGION}/flaechenfinder`
const EMPTY_MODE_URL = `/regionen/${EMPTY_REGION}/flaechenfinder`
const REAL_EMAIL_PREFIX = 'e2e-flaechenfinder-'

const withStubbedAdmin = async (
  page: Page,
  testInfo: TestInfo,
  identityKey: string,
  run: () => Promise<void>,
) => {
  const baseURL = testInfo.project.use.baseURL
  if (typeof baseURL !== 'string') throw new Error('Playwright baseURL must be a string')

  const user = await createStubbedAdminSession(page, baseURL, { identityKey })
  // Real email so the contact-profile modal doesn't intercept the page.
  await db.user.update({
    where: { id: user.id },
    data: { email: `${REAL_EMAIL_PREFIX}${user.id}@example.com` },
  })

  try {
    await run()
    await expectNoConsoleErrors(page)
  } finally {
    await cleanupStubbedSessionData('ADMIN', identityKey)
    await db.user.deleteMany({ where: { id: user.id } })
  }
}

test.describe('Flächenfinder mode (stubbed admin login)', () => {
  test('renders the panel with the seeded Planungsgebiete', async ({ page }, testInfo) => {
    test.setTimeout(60_000)
    await withStubbedAdmin(page, testInfo, 'flaechenfinder-panel', async () => {
      await page.goto(MODE_URL)
      expect(new URL(page.url()).pathname).toBe(MODE_URL)
      await expect(
        page
          .getByRole('navigation', { name: 'Modus' })
          .getByRole('link', { name: 'Flächenfinder' }),
      ).toBeVisible({ timeout: 30_000 })
      await waitForMapLoad(page)
      // The first area is opened on entry; the other one sits in the collection dropdown.
      await expect(page.getByText('Schillerkiez').first()).toBeVisible({ timeout: 30_000 })
    })
  })

  test('shows the empty state in a region without Planungsgebiete', async ({ page }, testInfo) => {
    test.setTimeout(60_000)
    await withStubbedAdmin(page, testInfo, 'flaechenfinder-empty', async () => {
      await page.goto(EMPTY_MODE_URL)
      expect(new URL(page.url()).pathname).toBe(EMPTY_MODE_URL)
      await waitForMapLoad(page)
      await expect(
        page.getByText('Noch kein Planungsgebiet in dieser Region.').first(),
      ).toBeVisible({ timeout: 30_000 })
    })
  })
})
