import { expect, test, type Page, type TestInfo } from '@playwright/test'
import db from '../../src/server/db.server'
import { cleanupStubbedSessionData, createStubbedUserSession } from '../fixtures/auth'

// Guests are covered in smoke/region-modes.spec.ts and every other mode spec logs in as ADMIN,
// which skips the membership check. These cover the non-admin USER paths.
const PUBLIC_REGION = 'radinfra'
// PUBLIC region with internal notes only, so Hinweise is member-only.
const INTERNAL_NOTES_REGION = 'woldegk'
const REAL_EMAIL_PREFIX = 'e2e-modes-access-'

const withStubbedUser = async (
  page: Page,
  testInfo: TestInfo,
  identityKey: string,
  run: (user: { id: string }) => Promise<void>,
) => {
  const baseURL = testInfo.project.use.baseURL
  if (typeof baseURL !== 'string') throw new Error('Playwright baseURL must be a string')

  const user = await createStubbedUserSession(page, baseURL, { identityKey })
  // Real email so the contact-profile modal doesn't intercept the page.
  await db.user.update({
    where: { id: user.id },
    data: { email: `${REAL_EMAIL_PREFIX}${user.id}@example.com` },
  })

  try {
    await run(user)
  } finally {
    await db.membership.deleteMany({ where: { userId: user.id } })
    await cleanupStubbedSessionData('USER', identityKey)
    await db.user.deleteMany({ where: { id: user.id } })
  }
}

test.describe('Region modes – non-admin access (stubbed user login)', () => {
  for (const path of [
    `/regionen/${PUBLIC_REGION}/qa`,
    `/regionen/${PUBLIC_REGION}/prueflisten`,
    `/regionen/${INTERNAL_NOTES_REGION}/hinweise`,
  ]) {
    test(`logged-in non-member is denied ${path}`, async ({ page }, testInfo) => {
      // Distinct identity per test: they run in parallel and the stub user is keyed by it.
      await withStubbedUser(
        page,
        testInfo,
        `modes-access-${path.replaceAll('/', '-')}`,
        async () => {
          await page.goto(path)
          await page.waitForURL((url) => new URL(url).pathname === '/access-denied')
          await expect(page.getByRole('heading', { name: 'Zugriff verweigert' })).toBeVisible()
        },
      )
    })
  }

  test('region member (not admin) can open Prüflisten', async ({ page }, testInfo) => {
    await withStubbedUser(page, testInfo, 'modes-access-member', async (user) => {
      const region = await db.region.findUniqueOrThrow({
        where: { slug: PUBLIC_REGION },
        select: { id: true },
      })
      await db.membership.create({ data: { userId: user.id, regionId: region.id } })

      const path = `/regionen/${PUBLIC_REGION}/prueflisten`
      await page.goto(path)
      expect(new URL(page.url()).pathname).toBe(path)
      await expect(page.getByRole('heading', { name: 'Prüflisten' })).toBeVisible({
        timeout: 30_000,
      })
    })
  })
})
