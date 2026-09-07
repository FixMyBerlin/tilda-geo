import { expect, test, type Page, type TestInfo } from '@playwright/test'
import db from '../../src/server/db.server'
import { cleanupStubbedSessionData, createStubbedAdminSession } from '../fixtures/auth'
import { expectNoConsoleErrors } from '../utils/console'
import { waitForMapLoad } from '../utils/maps'

// A region member/admin can reach the review lists mode even with no lists (to bootstrap one).
const REGION = 'radinfra'
const MODE_URL = `/regionen/${REGION}/prueflisten`
const REAL_EMAIL_PREFIX = 'e2e-review-lists-'

/** Upload with explicit `properties.id` so entries are stable across tests. */
const SAMPLE_GEOJSON = JSON.stringify({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [13.4, 52.5] },
      properties: { id: 'kreuzung-a', name: 'Kreuzung A' },
    },
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [13.41, 52.51] },
      properties: { id: 'kreuzung-b', name: 'Kreuzung B' },
    },
  ],
})

const parseReviewListsParam = (page: Page) => {
  const raw = new URL(page.url()).searchParams.get('rl')
  if (!raw) return {}
  try {
    return JSON.parse(raw) as { move?: boolean }
  } catch {
    return {}
  }
}

const setUploadFile = async (page: Page, name: string, contents: string) => {
  await page
    .locator('[data-testid="review-list-geojson-upload-modal"] input[type="file"]')
    .setInputFiles({
      name,
      mimeType: 'application/geo+json',
      buffer: Buffer.from(contents),
    })
}

const confirmAndCloseUpload = async (page: Page, successText: string | RegExp) => {
  const modal = page.getByTestId('review-list-geojson-upload-modal')
  await modal.getByRole('button', { name: 'Hinzufügen' }).click()
  await expect(modal.getByText(successText)).toBeVisible({ timeout: 30_000 })
  await modal.getByRole('button', { name: 'Schließen' }).first().click()
  await expect(modal).toBeHidden()
}

const showAllEntries = async (page: Page) => {
  await page.getByRole('button', { name: 'Ausschnitt: Nur Karte' }).click()
  await page.getByRole('option', { name: 'Überall' }).click()
}

const withStubbedReviewListsAdmin = async (
  page: Page,
  testInfo: TestInfo,
  identityKey: string,
  run: (ctx: { listName: string }) => Promise<void>,
) => {
  const baseURL = testInfo.project.use.baseURL
  if (typeof baseURL !== 'string') throw new Error('Playwright baseURL must be a string')

  const user = await createStubbedAdminSession(page, baseURL, { identityKey })
  await db.user.update({
    where: { id: user.id },
    data: { email: `${REAL_EMAIL_PREFIX}${user.id}@example.com` },
  })
  const listName = `E2E Liste ${identityKey} ${Date.now()}`

  try {
    await page.goto(MODE_URL)
    expect(new URL(page.url()).pathname).toBe(MODE_URL)
    await expect(page.getByRole('heading', { name: 'Prüflisten' })).toBeVisible()
    await waitForMapLoad(page)
    await run({ listName })
    await expectNoConsoleErrors(page)
  } finally {
    await cleanupStubbedSessionData('ADMIN', identityKey)
    await db.reviewList.deleteMany({ where: { name: listName } })
    await db.user.deleteMany({ where: { id: user.id } })
  }
}

const createListAndUploadSample = async (page: Page, listName: string) => {
  await page.getByRole('button', { name: 'Neue Prüfliste…' }).click()
  await page.getByLabel('Name').fill(listName)
  await page.getByRole('button', { name: 'Anlegen' }).click()
  await expect(page.getByRole('heading', { name: `Liste »${listName}«` })).toBeVisible()

  await page.getByRole('button', { name: 'GeoJSON hochladen' }).click()
  await expect(page.getByRole('heading', { name: 'GeoJSON hochladen' })).toBeVisible()
  await setUploadFile(page, 'entries.geojson', SAMPLE_GEOJSON)
  await confirmAndCloseUpload(page, '2 Einträge wurden hinzugefügt.')

  await showAllEntries(page)
  await expect(page.getByText('Prüfeintrag #', { exact: false }).first()).toBeVisible({
    timeout: 30_000,
  })
}

test.describe('Review lists mode (stubbed admin login)', () => {
  test('creates a list and uploads GeoJSON so entries render', async ({ page }, testInfo) => {
    test.setTimeout(60_000)
    await withStubbedReviewListsAdmin(
      page,
      testInfo,
      'review-lists-upload',
      async ({ listName }) => {
        await createListAndUploadSample(page, listName)
        await expect(page.getByText('Prüfeintrag #', { exact: false })).toHaveCount(2)
      },
    )
  })

  test('comments on an entry and toggles rl.move chrome/URL', async ({ page }, testInfo) => {
    test.setTimeout(60_000)
    await withStubbedReviewListsAdmin(
      page,
      testInfo,
      'review-lists-comment',
      async ({ listName }) => {
        await createListAndUploadSample(page, listName)

        await page.getByText('Prüfeintrag #', { exact: false }).first().click()
        await expect(page.getByRole('heading', { name: /Prüfeintrag #/ })).toBeVisible({
          timeout: 10_000,
        })

        await page.getByRole('button', { name: 'Geometrie bearbeiten' }).click()
        await expect(
          page.getByRole('button', { name: 'Geometrie-Bearbeitung beenden' }),
        ).toHaveAttribute('aria-pressed', 'true')
        await expect.poll(() => parseReviewListsParam(page).move === true).toBe(true)
        await expect(page.getByRole('button', { name: 'Ändern' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Teil hinzufügen' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Teil löschen' })).toBeVisible()
        await page.getByRole('button', { name: 'Geometrie-Bearbeitung beenden' }).click()
        await expect(page.getByRole('button', { name: 'Geometrie bearbeiten' })).toHaveAttribute(
          'aria-pressed',
          'false',
        )
        await expect.poll(() => parseReviewListsParam(page).move).toBeUndefined()

        await page.getByPlaceholder('Kommentar hinzufügen…').fill('Sieht problematisch aus')
        await page.getByRole('button', { name: 'Kommentieren' }).click()
        await expect(page.getByText('Sieht problematisch aus')).toBeVisible({ timeout: 10_000 })
      },
    )
  })

  test('clicking a list entry flies the map (map param)', async ({ page }, testInfo) => {
    test.setTimeout(60_000)
    await withStubbedReviewListsAdmin(
      page,
      testInfo,
      'review-lists-flyto',
      async ({ listName }) => {
        await createListAndUploadSample(page, listName)

        await page.getByText('Prüfeintrag #', { exact: false }).first().click()
        await expect(page.getByRole('heading', { name: /Prüfeintrag #/ })).toBeVisible({
          timeout: 10_000,
        })

        // Clicking a list entry flies the shared map to it — this only works because <MapProvider>
        // wraps the panel <Outlet/>, so the panel's useMap() resolves. The uploaded entries sit near
        // [13.4, 52.5]; the `map` URL param (zoom/lat/lng) must reflect the flyTo at zoom ≥ 15.
        await expect
          .poll(
            () => {
              const map = new URL(page.url()).searchParams.get('map')
              if (!map) return false
              const [zoom, lat, lng] = map.split('/').map(Number)
              if (zoom === undefined || lat === undefined || lng === undefined) return false
              return zoom >= 15 && Math.abs(lat - 52.5) < 0.1 && Math.abs(lng - 13.4) < 0.1
            },
            { timeout: 6_000 },
          )
          .toBe(true)
      },
    )
  })
})
