import { expect, test } from '@playwright/test'
import db from '../../src/server/db.server'
import { qaIndicatorsSchema } from '../../src/server/qa-configs/schemas/qaIndicatorsSchema'
import { getQaIndicatorsTableName } from '../../src/server/qa-configs/utils/getQaTableName'
import { cleanupStubbedSessionData, createStubbedAdminSession } from '../fixtures/auth'
import { expectNoConsoleErrors } from '../utils/console'
import { waitForMapLoad } from '../utils/maps'

const REGION = 'parkraum-berlin-euvm'
const QA_MODE_URL = `/regionen/${REGION}/qa`
const REAL_EMAIL_PREFIX = 'e2e-qa-mode-'

// The evaluation rows this test writes (seeded + submitted), removed again in afterEach.
let seededArea: { configId: number; areaId: string; since: Date } | undefined

test.describe('QA mode (stubbed admin login)', () => {
  test.describe.configure({ mode: 'serial' })

  test.afterEach(async () => {
    if (seededArea) {
      await db.qaEvaluation.deleteMany({
        where: {
          configId: seededArea.configId,
          areaId: seededArea.areaId,
          createdAt: { gte: seededArea.since },
        },
      })
      seededArea = undefined
    }
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

    const activeConfig = await db.qaConfig.findFirst({
      where: { isActive: true, region: { slug: REGION } },
      select: { id: true, label: true, indicators: true, mapTable: true },
    })
    if (!activeConfig) throw new Error(`No active QA config for ${REGION}`)
    // Indicator labels are per config (admin-editable), so read the one to toggle from the config.
    const indicators = qaIndicatorsSchema.parse(activeConfig.indicators)
    const [firstIndicator, secondIndicator] = indicators
    if (!firstIndicator || !secondIndicator)
      throw new Error(`Config "${activeConfig.label}" needs two indicators`)

    // The "Problematisch" filter below needs one open problematic indicator, which a local DB whose
    // reference matches the current data does not have: seed one before the page loads.
    const [seedRow] = await db.$queryRawUnsafe<{ area_id: string }[]>(
      `SELECT area_id FROM ${getQaIndicatorsTableName(activeConfig.mapTable)} WHERE indicator_key = $1 ORDER BY area_id LIMIT 1`,
      firstIndicator.key,
    )
    if (!seedRow) throw new Error(`No processed QA cells for "${activeConfig.label}"`)
    seededArea = { configId: activeConfig.id, areaId: seedRow.area_id, since: new Date() }
    await db.qaEvaluation.create({
      data: {
        configId: activeConfig.id,
        areaId: seedRow.area_id,
        indicatorKey: firstIndicator.key,
        systemStatus: 'PROBLEMATIC',
        evaluatorType: 'SYSTEM',
      },
    })

    await page.goto(QA_MODE_URL)
    expect(new URL(page.url()).pathname).toBe(QA_MODE_URL)

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

    // Attribute filter: toggle one indicator off, trigger label switches from "Alle" to a count.
    const attributesButton = page.getByRole('button', { name: /^Attribute:/ })
    await expect(attributesButton).toContainText('Alle')
    await attributesButton.click()
    await page.getByRole('checkbox', { name: secondIndicator.label }).click()
    await expect(attributesButton).toContainText('ausgewählt')
    // "Alle Attribute" resets the filter back to every indicator.
    await page.getByRole('checkbox', { name: 'Alle Attribute' }).click()
    await expect(attributesButton).toContainText('Alle')
    await page.keyboard.press('Escape')

    // Still filtered to "pending-problematic" (system Problematisch, no user decision yet), so the
    // first area has an open indicator, which the decision form preselects.
    const firstArea = page.getByRole('button', { name: /^Bereich #/ }).first()
    await expect(firstArea).toBeVisible({ timeout: 10_000 })
    await firstArea.click()

    const saveButton = page.getByRole('button', { name: 'Speichern' })
    await expect(saveButton).toBeDisabled({ timeout: 10_000 })
    await page.getByRole('radio', { name: /OK \(Strukturelle Änderung\)/ }).check()
    await saveButton.click()

    // The decision shows up in the thread of the area.
    await expect(page.getByRole('heading', { name: 'Verlauf' })).toBeVisible({ timeout: 10_000 })
    await expect(
      page.getByRole('list').getByText('OK (Strukturelle Änderung)').first(),
    ).toBeVisible({ timeout: 10_000 })

    await expectNoConsoleErrors(page)
  })
})
