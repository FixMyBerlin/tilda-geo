import { expect, test } from '@playwright/test'
import { STACK_SLOT_IDS } from '@/components/admin/layerOrder/layerStack'
import { TEST_REGION_URL } from '../fixtures/routes'
import { getMapLayerIds, waitForAtlasGeoLayers, waitForMapLoad } from '../utils/maps'

// Read-only smoke check. Tests that write the MapLayerOrder table live together in
// tests/pages/admin-layer-order.spec.ts (serial), because Playwright runs spec files in
// parallel and the table is a global singleton.

test('Smoke – map layer order: the basemap has all positions in order and atlas layers sit between them', async ({
  page,
}) => {
  await page.goto(TEST_REGION_URL)
  await page.waitForURL(/map=/, { timeout: 30_000 })
  await waitForMapLoad(page, 60_000)
  await waitForAtlasGeoLayers(page)

  const layerIds = await getMapLayerIds(page)

  // /admin/layer-order lists these positions from top to bottom; the basemap style defines them.
  const slotPositions = STACK_SLOT_IDS.map((slot) => layerIds.indexOf(slot))
  for (const [i, slot] of STACK_SLOT_IDS.entries()) {
    expect(slotPositions[i], `${slot} missing from the basemap style`).toBeGreaterThan(-1)
  }
  expect(slotPositions, 'STACK does not follow the basemap style').toEqual(
    [...slotPositions].sort((a, b) => b - a),
  )

  const atlasLayerPositions = layerIds
    .map((id, position) => ({ id, position }))
    .filter(({ id }) => id.startsWith('source:'))
  expect(atlasLayerPositions.length).toBeGreaterThan(0)

  const belowRoadnameAnchor = layerIds.indexOf('atlas-app-beforeid-below-roadname')
  const splicedBelow = atlasLayerPositions.filter(({ position }) => position < belowRoadnameAnchor)
  expect(splicedBelow.length, 'no atlas layers spliced below the roadname anchor').toBeGreaterThan(
    0,
  )

  const topAnchor = layerIds.indexOf('atlas-app-beforeid-top')
  const lastAtlasLayer = atlasLayerPositions.at(-1)
  expect(lastAtlasLayer!.position).toBeLessThan(topAnchor)
})
