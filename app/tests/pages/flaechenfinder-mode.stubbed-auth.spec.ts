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
// Planungsgebiete the form tests create; removed again afterwards.
const AREA_PREFIX = 'E2E Formular'

const modeUrlWith = (space: Record<string, unknown>) =>
  `${MODE_URL}?space=${encodeURIComponent(JSON.stringify(space))}`

// A small square in Neukölln, well below the study area size limit.
const studyAreaFile = (name: string) => ({
  name,
  mimeType: 'application/geo+json',
  buffer: Buffer.from(
    JSON.stringify({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [13.42, 52.475],
            [13.425, 52.475],
            [13.425, 52.478],
            [13.42, 52.478],
            [13.42, 52.475],
          ],
        ],
      },
    }),
  ),
})

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

  test('creates and edits a Planungsgebiet and adds a Variante', async ({ page }, testInfo) => {
    test.setTimeout(120_000)
    await withStubbedAdmin(page, testInfo, 'flaechenfinder-forms', async () => {
      try {
        await page.goto(modeUrlWith({ new: 'area' }))
        const create = page.getByRole('button', { name: 'Anlegen', exact: true })
        await expect(create).toBeVisible({ timeout: 30_000 })

        // Errors appear only after the first submit, next to their fields.
        await expect(page.getByText('Bitte einen Namen angeben.')).toHaveCount(0)
        await create.click()
        await expect(page.getByText('Bitte einen Namen angeben.')).toBeVisible()
        await expect(
          page.getByText('Bitte ein Gebiet auswählen, zeichnen oder hochladen.'),
        ).toBeVisible()

        // A typed name stays when a file brings its own name.
        const title = `${AREA_PREFIX} eigener Name`
        await page.getByLabel('Name', { exact: true }).fill(title)
        await page.getByRole('button', { name: 'Eigenes Gebiet' }).click()
        await page
          .locator('input[type="file"]')
          .first()
          .setInputFiles(studyAreaFile(`${AREA_PREFIX} Datei.geojson`))
        await expect(page.getByLabel('Name', { exact: true })).toHaveValue(title)
        await expect(
          page.getByText('Bitte ein Gebiet auswählen, zeichnen oder hochladen.'),
        ).toHaveCount(0)

        await create.click()
        await expect(page.getByText(`Planungsgebiet »${title}« angelegt.`)).toBeVisible({
          timeout: 30_000,
        })
        const area = await db.planningArea.findFirstOrThrow({
          where: { title },
          select: { id: true, variants: { select: { id: true } } },
        })
        const variantId = area.variants[0]!.id

        // Editing: an empty name is caught in the form, not as a raw server error.
        await page.goto(modeUrlWith({ key: variantId, edit: 'area' }))
        const name = page.getByLabel('Name', { exact: true })
        await expect(name).toHaveValue(title, { timeout: 30_000 })
        await name.fill('  ')
        await page.getByRole('button', { name: 'Speichern', exact: true }).click()
        await expect(page.getByText('Bitte einen Namen angeben.')).toBeVisible()
        await name.fill(`${title} geändert`)
        await page.getByRole('button', { name: 'Speichern', exact: true }).click()
        await expect(page.getByText('Planungsgebiet gespeichert.')).toBeVisible({
          timeout: 30_000,
        })

        // A new Variante is created in a modal, prefilled with the next »Variante N«.
        await page.goto(modeUrlWith({ key: variantId }))
        await page.getByRole('button', { name: /Variante »Variante 1«/ }).click()
        await page.getByRole('button', { name: 'Neue Variante mit Standardwerten…' }).click()
        const modal = page.getByRole('dialog')
        await expect(modal.getByLabel('Name der Variante')).toHaveValue('Variante 2')
        await modal.getByRole('button', { name: 'Anlegen', exact: true }).click()
        await expect(page.getByText('Variante angelegt.', { exact: false })).toBeVisible({
          timeout: 30_000,
        })
        const variants = await db.planningVariant.findMany({
          where: { areaId: area.id },
          select: { title: true },
          orderBy: { id: 'asc' },
        })
        expect(variants.map((variant) => variant.title)).toEqual(['Variante 1', 'Variante 2'])
      } finally {
        await db.planningArea.deleteMany({ where: { title: { startsWith: AREA_PREFIX } } })
      }
    })
  })
})
