import { expect, test, type Page } from '@playwright/test'
import db from '../../src/server/db.server'
import { cleanupStubbedSessionData, createStubbedUserSession } from '../fixtures/auth'

/** Time for hydration + contact-profile modal to open when no real contact email is set. */
const MODAL_OPEN_WINDOW_MS = 4000

/** Panel inside Headless UI (outer `Dialog` may report hidden during transitions in dev). */
const contactProfilePromptPanel = (page: Page) =>
  page.locator('[data-testid="contact-profile-prompt-modal"]')

test.describe('Contact profile prompt modal', () => {
  test.describe.configure({ mode: 'serial' })

  test.afterEach(async () => {
    await cleanupStubbedSessionData('USER', 'contact-profile-modal-incomplete')
    await cleanupStubbedSessionData('USER', 'contact-profile-modal-complete')
  })

  test('shows when user has no real contact email (OSM placeholder)', async ({
    page,
  }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string for stubbed login tests')
    }

    await createStubbedUserSession(page, baseURL, {
      identityKey: 'contact-profile-modal-incomplete',
    })

    await page.goto('/')
    await expect(page.locator('main').first()).toBeVisible()

    // StrictMode can mount two panels; assert the first visible panel.
    await expect(contactProfilePromptPanel(page).first()).toBeVisible({
      timeout: 15_000,
    })
  })

  test('does not show when user has a real contact email', async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string for stubbed login tests')
    }

    const user = await createStubbedUserSession(page, baseURL, {
      identityKey: 'contact-profile-modal-complete',
    })

    await db.user.update({
      where: { id: user.id },
      data: {
        email: `e2e-contact-complete-${user.id}@example.com`,
      },
    })

    await page.goto('/')
    await expect(page.locator('main').first()).toBeVisible()

    await page.waitForTimeout(MODAL_OPEN_WINDOW_MS)
    await expect(contactProfilePromptPanel(page)).toHaveCount(0)
  })
})
