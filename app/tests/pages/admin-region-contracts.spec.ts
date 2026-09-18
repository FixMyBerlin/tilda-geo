import { expect, test } from '@playwright/test'
import db from '../../src/server/db.server'
import { cleanupStubbedSessionData, createStubbedAdminSession } from '../fixtures/auth'

const CONTRACT_SLUG = 'e2e-region-contract'
const CONTRACT_NAME = 'E2E Region Contract'
const UPDATED_NAME = 'E2E Region Contract Updated'
const IDENTITY_KEY = 'admin-region-contracts-crud'

test.describe('Admin region contracts CRUD', () => {
  test.describe.configure({ mode: 'serial' })

  test.afterAll(async () => {
    await db.regionContract.deleteMany({ where: { slug: CONTRACT_SLUG } })
  })

  test.afterEach(async () => {
    await cleanupStubbedSessionData('ADMIN', IDENTITY_KEY)
  })

  test('lists, creates, edits, and deletes a contract', async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string for stubbed login tests')
    }

    await db.regionContract.deleteMany({ where: { slug: CONTRACT_SLUG } })
    await createStubbedAdminSession(page, baseURL, { identityKey: IDENTITY_KEY })

    await page.goto('/admin/region-contracts')
    await expect(page).toHaveURL(/\/admin\/region-contracts/)
    // Under load the link click can beat hydration; a full reload of /new then wipes the filled fields.
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('link', { name: 'Neuer Auftrag' })).toBeVisible()

    await page.getByRole('link', { name: 'Neuer Auftrag' }).click()
    await expect(page).toHaveURL(/\/admin\/region-contracts\/new/)

    await page.getByLabel('Slug').fill(CONTRACT_SLUG)
    await page.getByLabel('Name').fill(CONTRACT_NAME)
    // The submit/cancel/delete actions render twice (desktop aside + mobile bar); the aside
    // region is the one visible at the default desktop viewport, so scope to it.
    const asideActions = page.getByRole('complementary', { name: 'Abschnitte und Aktionen' })
    await asideActions.getByRole('button', { name: 'Erstellen' }).click()

    await expect(page).toHaveURL(/\/admin\/region-contracts$/)
    const createdRow = page.getByRole('row', { name: new RegExp(CONTRACT_NAME) })
    await expect(createdRow).toBeVisible()

    await createdRow.getByRole('link', { name: 'Bearbeiten' }).click()
    await expect(page).toHaveURL(new RegExp(`/admin/region-contracts/${CONTRACT_SLUG}/edit`))
    await page.waitForLoadState('networkidle')

    await page.getByLabel('Name').fill(UPDATED_NAME)
    await asideActions.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByRole('heading', { name: UPDATED_NAME })).toBeVisible()

    // Aside deletes confirm via the native `window.confirm` dialog.
    page.once('dialog', (dialog) => dialog.accept())
    await asideActions.getByRole('button', { name: 'Auftrag löschen' }).click()

    await expect(page).toHaveURL(/\/admin\/region-contracts$/)
    await expect(page.getByRole('row', { name: new RegExp(UPDATED_NAME) })).toHaveCount(0)

    const deleted = await db.regionContract.findUnique({ where: { slug: CONTRACT_SLUG } })
    expect(deleted).toBeNull()
  })
})
