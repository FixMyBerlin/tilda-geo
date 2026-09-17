import { expect, test } from '@playwright/test'
import db from '../../src/server/db.server'
import { cleanupStubbedSessionData, createStubbedAdminSession } from '../fixtures/auth'
import { expectNoConsoleErrors } from '../utils/console'
import { waitForMapLoad } from '../utils/maps'

// woldegk is an internal-notes (TILDA) PUBLIC region — Hinweise is one list, not folders.
const REGION = 'woldegk'
const NOTES_MODE_URL = `/regionen/${REGION}/hinweise`
const REAL_EMAIL_PREFIX = 'e2e-notes-mode-'

test.describe('Notes mode – region notes list (stubbed admin login)', () => {
  test.afterEach(async () => {
    await cleanupStubbedSessionData('ADMIN', 'notes-mode-list')
    await db.user.deleteMany({ where: { email: { startsWith: REAL_EMAIL_PREFIX } } })
  })

  test('Hinweise shows one list for the region notes kind, without folders', async ({
    page,
  }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') throw new Error('Playwright baseURL must be a string')

    const user = await createStubbedAdminSession(page, baseURL, {
      identityKey: 'notes-mode-list',
    })
    await db.user.update({
      where: { id: user.id },
      data: { email: `${REAL_EMAIL_PREFIX}${user.id}@example.com` },
    })

    await page.goto(NOTES_MODE_URL)
    await expect(page.getByRole('heading', { name: 'Hinweise' })).toBeVisible({ timeout: 30_000 })
    await waitForMapLoad(page)

    await page.getByRole('button', { name: 'Suchen' }).click()
    await expect(page.getByPlaceholder('Hinweise durchsuchen…')).toBeVisible()
    await expect(page.getByPlaceholder('Neuer Ordner…')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Anlegen' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Umbenennen' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Löschen' })).toHaveCount(0)

    await expectNoConsoleErrors(page)
  })
})
