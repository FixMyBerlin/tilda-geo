import { expect, test } from '@playwright/test'
import { TEST_REGION_NOTES_MODE_URL, TEST_REGION_URL } from '../fixtures/routes'
import { expectNoConsoleErrors } from '../utils/console'
import { verifyMapRendered, waitForMapLoad } from '../utils/maps'

test.describe('Smoke – region mode pages (unauthenticated)', () => {
  test('QA mode redirects guests to access-denied, preserving the intended URL in from', async ({
    page,
  }) => {
    await page.goto('/regionen/parkraum-berlin-euvm/qa?map=14/52.5/13.4')
    await page.waitForURL((url) => new URL(url).pathname === '/access-denied')
    const url = new URL(page.url())
    const from = url.searchParams.get('from')
    expect(from).toContain('/regionen/parkraum-berlin-euvm/qa')
    expect(from).toContain('map=14/52.5/13.4')
    await expect(page.getByRole('heading', { name: 'Anmeldung erforderlich' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Qualitätssicherung' })).toHaveCount(0)
  })

  test('Prüflisten mode redirects guests to access-denied with sign-in callback', async ({
    page,
  }) => {
    await page.goto('/regionen/parkraum-berlin-euvm/prueflisten?map=14/52.5/13.4')
    await page.waitForURL((url) => new URL(url).pathname === '/access-denied')
    const url = new URL(page.url())
    const from = url.searchParams.get('from')
    expect(from).toContain('/regionen/parkraum-berlin-euvm/prueflisten')
    expect(from).toContain('map=14/52.5/13.4')
    await expect(page.getByRole('heading', { name: 'Anmeldung erforderlich' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Prüflisten' })).toHaveCount(0)

    const signInHref = await page
      .getByRole('main')
      .getByRole('link', { name: 'Anmelden' })
      .getAttribute('href')
    expect(signInHref).toContain('/api/sign-in/osm')
    const decoded = decodeURIComponent(signInHref ?? '')
    expect(decoded).toContain('callbackURL')
    expect(decoded).toContain('/regionen/parkraum-berlin-euvm/prueflisten')
    expect(decoded).toContain('map=14/52.5/13.4')
  })

  test('notes mode renders panel and map side by side', async ({ page }) => {
    await page.goto(TEST_REGION_NOTES_MODE_URL)

    // beforeLoad normalization may add search params but must keep the mode sub-path
    expect(new URL(page.url()).pathname).toBe(TEST_REGION_NOTES_MODE_URL)

    await expect(page.getByRole('heading', { name: 'OSM-Hinweise' })).toBeVisible({
      timeout: 30_000,
    })
    await expect(page.getByRole('button', { name: 'Neuer Hinweis' })).toBeVisible()
    await waitForMapLoad(page)
    await verifyMapRendered(page)

    await expectNoConsoleErrors(page)
  })

  test('Summieren mode is open to guests and shows the drawing hint', async ({ page }) => {
    await page.goto('/regionen/parkraum-berlin-euvm/summieren?map=14/52.5/13.4')
    expect(new URL(page.url()).pathname).toBe('/regionen/parkraum-berlin-euvm/summieren')

    await expect(page.getByRole('heading', { name: 'Summieren' })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('In die Karte klicken, um eine Fläche zu zeichnen')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Hilfe zum Zeichnen' })).toBeVisible()
    // The datasets are no longer layers of the category list.
    await expect(page.getByText('Summieren:')).toHaveCount(0)
    await waitForMapLoad(page)
    await verifyMapRendered(page)

    // Compact tab: the label is only visible while the mode is active.
    const switcher = page.getByRole('navigation', { name: 'Modus' })
    await switcher.getByRole('link', { name: 'Karte' }).click()
    await page.waitForURL((url) => new URL(url).pathname === '/regionen/parkraum-berlin-euvm')
    await expect(page.getByText('In die Karte klicken, um eine Fläche zu zeichnen')).toHaveCount(0)
    await expect(switcher.getByRole('link', { name: 'Summieren' })).toHaveAttribute(
      'title',
      'Summieren',
    )
  })

  test('legacy "Summieren: …" layer on the map redirects into Summieren', async ({ page }) => {
    // `config` from before the layers left the category list: street parking sums switched on.
    await page.goto('/regionen/parkraum-berlin-euvm?v=3&config=dgp49i.4qfrqd.8&map=14/52.5/13.4')
    await page.waitForURL(
      (url) => new URL(url).pathname === '/regionen/parkraum-berlin-euvm/summieren',
    )
    await expect(page.getByRole('heading', { name: 'Summieren' })).toBeVisible({ timeout: 30_000 })
  })

  test('Summieren redirects to the map in a region without a dataset to sum', async ({ page }) => {
    await page.goto(`${TEST_REGION_URL}/summieren`)
    await page.waitForURL((url) => new URL(url).pathname === TEST_REGION_URL)
  })

  test('legacy osmNotes=true on the map redirects into Hinweise', async ({ page }) => {
    await page.goto(`${TEST_REGION_URL}?osmNotes=true`)
    await page.waitForURL((url) => new URL(url).pathname === TEST_REGION_NOTES_MODE_URL)
    await expect(page.getByRole('heading', { name: 'OSM-Hinweise' })).toBeVisible({
      timeout: 30_000,
    })
    expect(new URL(page.url()).searchParams.has('osmNotes')).toBe(false)

    await expectNoConsoleErrors(page)
  })

  test('mode switch preserves search params and does not remount the map', async ({ page }) => {
    await page.goto(TEST_REGION_URL)
    await waitForMapLoad(page)

    const urlBefore = new URL(page.url())
    const mapParam = urlBefore.searchParams.get('map')
    const configParam = urlBefore.searchParams.get('config')
    expect(mapParam).toBeTruthy()
    expect(configParam).toBeTruthy()

    // Remember the map canvas DOM node — a map remount would create a new one
    await page.waitForSelector('.maplibregl-canvas')
    await page.evaluate(() => {
      // oxlint-disable-next-line typescript/no-explicit-any -- Just for tests…
      ;(window as any).__mapCanvasBeforeModeSwitch = document.querySelector('.maplibregl-canvas')
    })

    // Switch to the notes mode via the header mode switcher (link only — the highlight pill
    // duplicates the labels in aria-hidden spans that still match getByText).
    await page
      .getByRole('navigation', { name: 'Modus' })
      .getByRole('link', { name: 'Hinweise' })
      .click()
    await page.waitForURL((url) => new URL(url).pathname === TEST_REGION_NOTES_MODE_URL)
    await expect(page.getByRole('heading', { name: 'OSM-Hinweise' })).toBeVisible({
      timeout: 30_000,
    })

    // Map view and category config survive the mode switch (URL is the source of truth)
    const urlAfter = new URL(page.url())
    expect(urlAfter.searchParams.get('map')).toBe(mapParam)
    expect(urlAfter.searchParams.get('config')).toBe(configParam)

    // The map must not remount when switching modes (it mounts in the shared layout route)
    await verifyMapRendered(page)
    const canvasIsSameDomNode = await page.evaluate(() => {
      // oxlint-disable-next-line typescript/no-explicit-any -- Just for tests…
      return (
        (window as any).__mapCanvasBeforeModeSwitch === document.querySelector('.maplibregl-canvas')
      )
    })
    expect(canvasIsSameDomNode).toBe(true)

    // And back to the default map mode, still keeping the params
    await page
      .getByRole('navigation', { name: 'Modus' })
      .getByRole('link', { name: 'Karte' })
      .click()
    await page.waitForURL((url) => new URL(url).pathname === TEST_REGION_URL)
    const urlBack = new URL(page.url())
    expect(urlBack.searchParams.get('map')).toBe(mapParam)
    expect(urlBack.searchParams.get('config')).toBe(configParam)

    await expectNoConsoleErrors(page)
  })
})
