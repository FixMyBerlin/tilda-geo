import { expect, test } from '@playwright/test'
import db from '../../src/server/db.server'
import { cleanupStubbedSessionData, createStubbedAdminSession } from '../fixtures/auth'
import { TEST_REGION_URL } from '../fixtures/routes'
import { getMapLayerIds, waitForAtlasGeoLayers, waitForMapLoad } from '../utils/maps'

// Every test that writes the MapLayerOrder table lives in this one serial file: Playwright runs
// spec files in parallel and the table is a global singleton, so two files snapshotting and
// restoring it concurrently would race and leak state.

const IDENTITY_KEY = 'admin-layer-order'
// Fixed keys instead of getAllAtlasLayerKeys(): that module pulls in the map config, which reads
// `import.meta.env` and cannot load in the Playwright (Node) runtime. All three are in the
// bikelanes default style, which the test region renders; tests fail loudly if they vanish.
const SAMPLE_KEY = 'source:atlas_bikelanes--subcat:bikelanes--style:default--layer:smooth-colors'
const ORDER_KEY_A = 'source:atlas_bikelanes--subcat:bikelanes--style:default--layer:width-colors'
const ORDER_KEY_B = 'source:atlas_bikelanes--subcat:bikelanes--style:default--layer:oneway-color'
const ORDER_ANCHOR = 'atlas-app-beforeid-below-roadname'

async function openRegionMap(page: import('@playwright/test').Page) {
  await page.goto(TEST_REGION_URL)
  await page.waitForURL(/map=/, { timeout: 30_000 })
  await waitForMapLoad(page, 60_000)
  await waitForAtlasGeoLayers(page)
}

test.describe('Admin layer order', () => {
  test.describe.configure({ mode: 'serial' })

  let previousRows: Array<{ layerKey: string; beforeId: string | null; position: number }> = []
  // The stub helpers find their user by the stub email; restore it if a test changed it.
  let stubbedUserEmail: { id: string; email: string } | null = null

  test.beforeEach(async () => {
    previousRows = await db.mapLayerOrder.findMany({
      select: { layerKey: true, beforeId: true, position: true },
      orderBy: { position: 'asc' },
    })
    stubbedUserEmail = null
  })

  test.afterEach(async () => {
    await db.mapLayerOrder.deleteMany()
    if (previousRows.length > 0) {
      await db.mapLayerOrder.createMany({ data: previousRows })
    }
    if (stubbedUserEmail) {
      await db.user.update({
        where: { id: stubbedUserEmail.id },
        data: { email: stubbedUserEmail.email },
      })
    }
    await cleanupStubbedSessionData('ADMIN', IDENTITY_KEY)
  })

  test('lists atlas keys and the save control without writing', async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string for stubbed login tests')
    }

    await createStubbedAdminSession(page, baseURL, { identityKey: IDENTITY_KEY })
    await page.goto('/admin/layer-order')
    await expect(page).toHaveURL(/\/admin\/layer-order/)
    await expect(
      page.getByRole('heading', { name: /Standard \(Position aus der Layer-Konfiguration\)/ }),
    ).toBeVisible()
    await expect(page.locator('li', { hasText: SAMPLE_KEY })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Reihenfolge speichern' })).toBeVisible()
  })

  test("changing a layer's group and saving writes the full list", async ({ page }, testInfo) => {
    const baseURL = testInfo.project.use.baseURL
    if (typeof baseURL !== 'string') {
      throw new Error('Playwright baseURL must be a string for stubbed login tests')
    }

    const user = await createStubbedAdminSession(page, baseURL, { identityKey: IDENTITY_KEY })
    // A real email keeps the contact-profile prompt modal closed; it would otherwise cover the save button.
    stubbedUserEmail = { id: user.id, email: user.email }
    await db.user.update({
      where: { id: user.id },
      data: { email: `e2e-layer-order-${user.id}@example.com` },
    })
    await page.goto('/admin/layer-order')
    // Saving confirms via window.confirm when stale DB keys get dropped.
    page.on('dialog', (dialog) => dialog.accept())

    const row = page.locator('li', { hasText: SAMPLE_KEY })
    await expect(row).toBeVisible()
    // The UI lists every code key plus stale DB keys; the save must write exactly the code keys.
    const listedRows = await page
      .getByRole('listitem')
      .filter({ has: page.getByRole('combobox', { name: 'Gruppe wechseln' }) })
      .count()
    const staleRows = await page.getByText('nicht mehr im Code', { exact: false }).count()

    await row
      .getByRole('combobox', { name: 'Gruppe wechseln' })
      .selectOption('atlas-app-beforeid-top')
    await page.getByRole('button', { name: 'Reihenfolge speichern' }).click()

    await expect
      .poll(async () => {
        const saved = await db.mapLayerOrder.findUnique({ where: { layerKey: SAMPLE_KEY } })
        return saved?.beforeId ?? null
      })
      .toBe('atlas-app-beforeid-top')

    const rows = await db.mapLayerOrder.findMany({ orderBy: { position: 'asc' } })
    expect(rows).toHaveLength(listedRows - staleRows)
    expect(rows.map((entry) => entry.position)).toEqual(rows.map((_, index) => index))
    expect(new Set(rows.map((entry) => entry.layerKey)).size).toBe(rows.length)
  })

  test('seeded DB order is the runtime stack inside one beforeId group on the map', async ({
    page,
  }) => {
    // Rows are restored from `previousRows` in afterEach.
    await db.mapLayerOrder.deleteMany()
    await db.mapLayerOrder.createMany({
      data: [
        { layerKey: ORDER_KEY_A, beforeId: ORDER_ANCHOR, position: 0 },
        { layerKey: ORDER_KEY_B, beforeId: ORDER_ANCHOR, position: 1 },
      ],
    })

    await openRegionMap(page)
    const firstPass = await getMapLayerIds(page)
    const indexA = firstPass.indexOf(ORDER_KEY_A)
    const indexB = firstPass.indexOf(ORDER_KEY_B)
    expect(indexA, `missing ${ORDER_KEY_A}`).toBeGreaterThan(-1)
    expect(indexB, `missing ${ORDER_KEY_B}`).toBeGreaterThan(-1)
    expect(indexA, 'position 0 must be below position 1').toBeLessThan(indexB)
    // Both were pinned to the same anchor, so both sit below it.
    const anchorIndex = firstPass.indexOf(ORDER_ANCHOR)
    expect(indexB).toBeLessThan(anchorIndex)

    // Swap the order in the DB; the map picks it up on the next load (staleTime: Infinity).
    await db.mapLayerOrder.deleteMany()
    await db.mapLayerOrder.createMany({
      data: [
        { layerKey: ORDER_KEY_B, beforeId: ORDER_ANCHOR, position: 0 },
        { layerKey: ORDER_KEY_A, beforeId: ORDER_ANCHOR, position: 1 },
      ],
    })
    await page.reload()
    await page.waitForURL(/map=/, { timeout: 30_000 })
    await waitForMapLoad(page, 60_000)
    await waitForAtlasGeoLayers(page)

    const secondPass = await getMapLayerIds(page)
    expect(secondPass.indexOf(ORDER_KEY_B)).toBeLessThan(secondPass.indexOf(ORDER_KEY_A))
  })
})
