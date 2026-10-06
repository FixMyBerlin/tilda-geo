import { expect, test } from '@playwright/test'
import db from '../../src/server/db.server'
import { cleanupStubbedSessionData, createStubbedAdminSession } from '../fixtures/auth'
import { expectNoConsoleErrors } from '../utils/console'
import { waitForMapLoad } from '../utils/maps'

const REGION = 'parkraum-berlin-euvm'
const QA_MODE_URL = `/regionen/${REGION}/qa`
const REAL_EMAIL_PREFIX = 'e2e-qa-mode-'

test.describe('QA mode (stubbed admin login)', () => {
  test.describe.configure({ mode: 'serial' })

  test.afterEach(async () => {
    await cleanupStubbedSessionData('ADMIN', 'qa-mode')
    await db.user.deleteMany({ where: { email: { startsWith: REAL_EMAIL_PREFIX } } })
  })

  test('select config + status filter, area list renders', async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') throw new Error('Playwright baseURL must be a string')

    const user = await createStubbedAdminSession(page, baseURL, { identityKey: 'qa-mode' })
    // Real email so the contact-profile modal doesn't intercept clicks (deleted in afterEach).
    await db.user.update({
      where: { id: user.id },
      data: { email: `${REAL_EMAIL_PREFIX}${user.id}@example.com` },
    })

    await page.goto(QA_MODE_URL)
    expect(new URL(page.url()).pathname).toBe(QA_MODE_URL)

    const activeConfig = await db.qaConfig.findFirst({
      where: { isActive: true, region: { slug: REGION } },
      select: { label: true },
    })
    if (!activeConfig) throw new Error(`No active QA config for ${REGION}`)

    const qaHeading = page.getByRole('heading', { name: /^QA:/ })
    await expect(qaHeading).toBeVisible({ timeout: 30_000 })
    await waitForMapLoad(page)

    await qaHeading.click()
    await page.getByRole('option', { name: activeConfig.label, exact: true }).click()

    const statusSelect = page.getByLabel('Status')
    await expect(statusSelect).toBeEnabled()
    await statusSelect.click()
    await page.getByRole('option', { name: /Problematisch/ }).click()
    await expect(page.getByText(/Bereiche mit diesem Status|Bereich|Lädt/).first()).toBeVisible({
      timeout: 10_000,
    })

    const extentSelect = page.getByRole('button', { name: 'Ausschnitt' })
    await expect(extentSelect).toBeVisible()
    await expect(extentSelect).toContainText('Nur Karte')
    await extentSelect.click()
    await page.getByRole('option', { name: 'Überall' }).click()
    await expect(extentSelect).toContainText('Überall')
    await expect(
      page.getByText(/Bereiche mit diesem Status|Bereich|Lädt|angezeigt/).first(),
    ).toBeVisible({
      timeout: 10_000,
    })

    await expectNoConsoleErrors(page)
  })
})
